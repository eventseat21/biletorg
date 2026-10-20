import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncSeatCategories, type LayoutCategoryInput } from '@/lib/seatmap/persist'

type SeatPayload = {
  id?: string
  row: string
  number: string
  x: number
  y: number
  width: number
  height: number
  type: string
  shape: string
  rotation?: number
  status?: string | null
  price?: number | null
  zone?: string | null
  blockId?: string | null
  sectionId?: string | null
  svgId?: string | null
}

const SOLD_STATUSES = ['CANCELLED', 'REFUNDED']
const STATUSES = ['available', 'held', 'blocked', 'unavailable']
/** Postgres parametre sınırını (65535) güvenli şekilde altında kalacak yığın boyutu. */
const UPDATE_CHUNK = 2000

type SeatData = ReturnType<typeof seatData>
type ExistingSeat = {
  id: string
  row: string
  number: string
  x: number
  y: number
  width: number
  height: number
  type: string
  status: string
  price: number | null
  zone: string | null
  blockId: string | null
  sectionId: string | null
  shape: string
  rotation: number
  svgId: string | null
}

type SeatWrite = { id: string; data: SeatData; keyChanged: boolean }

/** Koltuk verisi veritabanındakiyle birebir aynıysa yazmaya gerek yok. */
function sameSeatData(existing: ExistingSeat, d: SeatData): boolean {
  return (
    existing.row === d.row &&
    existing.number === d.number &&
    existing.x === d.x &&
    existing.y === d.y &&
    existing.width === d.width &&
    existing.height === d.height &&
    existing.type === d.type &&
    existing.status === d.status &&
    (existing.price ?? null) === d.price &&
    (existing.zone ?? null) === d.zone &&
    (existing.blockId ?? null) === d.blockId &&
    (existing.sectionId ?? null) === d.sectionId &&
    existing.shape === d.shape &&
    existing.rotation === d.rotation &&
    (existing.svgId ?? null) === d.svgId
  )
}

/**
 * Koltuk başına sorgu yerine tek UPDATE ... FROM (VALUES) ile toplu günceller.
 * Anahtar değişimi benzersiz (hallId,row,number) kaydını bozmasın diye tüm
 * anahtar değiştiren koltuklar yazımdan ÖNCE tek geçişte geçici anahtara
 * taşınır; yığın sınırı yalnız sorgu boyutu içindir, sıralama için değil.
 */
async function stageSeatKeys(tx: Prisma.TransactionClient, hallId: string, ids: string[]) {
  for (let i = 0; i < ids.length; i += UPDATE_CHUNK) {
    await tx.$executeRaw(Prisma.sql`
      UPDATE "seats" SET "row" = '~', "number" = "id"
      WHERE "hallId" = ${hallId} AND "id" IN (${Prisma.join(ids.slice(i, i + UPDATE_CHUNK))})
    `)
  }
}

async function bulkUpdateSeats(tx: Prisma.TransactionClient, hallId: string, rows: SeatWrite[]) {
  const values = rows.map((row) => {
    const d = row.data
    return Prisma.sql`(
      ${row.id}::text, ${d.row}::text, ${d.number}::text, ${d.x}::int, ${d.y}::int,
      ${d.width}::int, ${d.height}::int, ${d.type}::text, ${d.status}::text,
      ${d.price}::double precision, ${d.zone}::text, ${d.blockId}::text,
      ${d.sectionId}::text, ${d.shape}::text, ${d.rotation}::int, ${d.svgId}::text
    )`
  })

  await tx.$executeRaw(Prisma.sql`
    UPDATE "seats" AS s
    SET "row" = v."row", "number" = v."number", x = v.x, y = v.y, width = v.width,
        height = v.height, type = v.type, status = v.status, price = v.price,
        zone = v.zone, "blockId" = v."blockId", "sectionId" = v."sectionId",
        shape = v.shape, rotation = v.rotation, "svgId" = v."svgId", "updatedAt" = now()
    FROM (VALUES ${Prisma.join(values)})
      AS v("id","row","number",x,y,width,height,type,status,price,zone,"blockId","sectionId",shape,rotation,"svgId")
    WHERE s."id" = v."id" AND s."hallId" = ${hallId}
  `)
}

const SEAT_SELECT = {
  id: true,
  row: true,
  number: true,
  x: true,
  y: true,
  width: true,
  height: true,
  type: true,
  status: true,
  price: true,
  zone: true,
  blockId: true,
  sectionId: true,
  shape: true,
  rotation: true,
  svgId: true,
} satisfies Prisma.SeatSelect

/** Kısmi kayıtta bile tam okumaya düşülen eşik; büyük IN listeleri okumadan pahalıdır. */
const PARTIAL_READ_LIMIT = 3000

async function readSeats(hallId: string, ids: string[] | null) {
  if (ids && ids.length === 0) return [] as Prisma.SeatGetPayload<{ select: typeof SEAT_SELECT }>[]
  return prisma.seat.findMany({
    where: ids ? { hallId, id: { in: ids } } : { hallId },
    select: SEAT_SELECT,
  })
}

async function readLockedSeatIds(hallId: string, ids: string[] | null) {
  if (ids && ids.length === 0) return new Set<string>()
  const guarded = await prisma.ticket.findMany({
    where: {
      seat: { hallId },
      status: { notIn: SOLD_STATUSES },
      ...(ids ? { seatId: { in: ids } } : {}),
    },
    select: { seatId: true },
    distinct: ['seatId'],
  })
  return new Set(guarded.map((ticket) => ticket.seatId).filter((id): id is string => Boolean(id)))
}

interface LayoutPlan {
  updates: SeatWrite[]
  creates: Prisma.SeatCreateManyInput[]
  createdSeats: { tempId: string; id: string; row: string; number: string }[]
  reverted: { id: string; row: string; number: string }[]
  safeDeletedIds: string[]
  refusedDeletedIds: string[]
}

/**
 * Gönderilen koltukları veritabanındakiyle karşılaştırıp yazılacakları üretir.
 * reservedSeats, yeni koltukların alabileceği satır/numara çiftlerinin mevcut
 * komşularla çakışmaması için önden ayrılır; kısmi kayıtta salonun tamamı
 * okunmadığı için bu küme tutulmaz — o yolda yeni koltuk bulunmaz, editör
 * yeni koltuk içeren kaydı tam modda gönderir.
 */
function buildPlan(
  hallId: string,
  seats: SeatPayload[],
  deletedSeatIds: string[],
  existingById: Map<string, ExistingSeat>,
  lockedIds: Set<string>,
  reservedSeats: ExistingSeat[] | null
): LayoutPlan {
  const payloadIds = new Set(seats.map((s) => s.id).filter((id) => id !== undefined && existingById.has(id)))
  const safeDeletedIds = deletedSeatIds.filter((id) => !lockedIds.has(id) && existingById.has(id))
  const refusedDeletedIds = deletedSeatIds.filter((id) => lockedIds.has(id) && existingById.has(id))
  const deletedSet = new Set(safeDeletedIds)

  const usedKeys = new Set<string>()
  if (reservedSeats) {
    for (const seat of reservedSeats) {
      if (deletedSet.has(seat.id) || payloadIds.has(seat.id)) continue
      usedKeys.add(`${seat.row}::${seat.number}`)
    }
  }
  // Yeni koltuklar, listede kendinden sonra gelen bir koltuğun hedef
  // anahtarını da almaya çalışmasın; satılmış koltuklar eski anahtarına
  // döneceği için o anahtar da rezerve edilir.
  for (const s of seats) {
    const current = s.id ? existingById.get(s.id) : undefined
    if (!current) continue
    usedKeys.add(`${String(s.row || 'R')}::${String(s.number || '1')}`)
    if (lockedIds.has(current.id)) usedKeys.add(`${current.row}::${current.number}`)
  }

  const updates: SeatWrite[] = []
  const creates: Prisma.SeatCreateManyInput[] = []
  const createdSeats: LayoutPlan['createdSeats'] = []
  const reverted: LayoutPlan['reverted'] = []

  for (const s of seats) {
    const current = s.id ? existingById.get(s.id) : undefined
    const row = String(s.row || 'R')
    const number = String(s.number || '1')

    if (current) {
      // Satılmış koltuğun satır/numarası değişmez.
      const locked = lockedIds.has(current.id)
      const nextRow = locked ? current.row : row
      const nextNumber = locked ? current.number : number
      usedKeys.add(`${nextRow}::${nextNumber}`)
      if (locked && (nextRow !== row || nextNumber !== number)) {
        reverted.push({ id: current.id, row: current.row, number: current.number })
      }
      const data = seatData(s, nextRow, nextNumber)
      // Değişmemiş koltuklar yazılmaz; 10.000 koltukluk salonda küçük bir
      // düzenleme sonrası kayıt tüm tabloyu yeniden yazmaz.
      if (!sameSeatData(current, data)) {
        updates.push({
          id: current.id,
          data,
          keyChanged: current.row !== data.row || current.number !== data.number,
        })
      }
      continue
    }

    let finalNumber = number
    if (usedKeys.has(`${row}::${finalNumber}`)) {
      finalNumber = `${number}-${Math.floor(Math.random() * 9000 + 1000)}`
      let guard = 0
      while (usedKeys.has(`${row}::${finalNumber}`) && guard < 50) {
        finalNumber = `${number}-${Math.floor(Math.random() * 9000 + 1000)}`
        guard++
      }
    }
    usedKeys.add(`${row}::${finalNumber}`)
    const id = randomUUID()
    if (s.id) createdSeats.push({ tempId: s.id, id, row, number: finalNumber })
    creates.push({ id, hallId, ...seatData(s, row, finalNumber) })
  }

  return { updates, creates, createdSeats, reverted, safeDeletedIds, refusedDeletedIds }
}

function seatKey(row: string, number: string) {
  return `${row}::${number}`
}

/** Verilen satırda kullanılmamış bir numara üretir. */
function claimNumber(taken: Set<string>, row: string, number: string): string {
  if (!taken.has(seatKey(row, number))) return number
  for (let i = 0; i < 50; i++) {
    const candidate = `${number}-${Math.floor(Math.random() * 9000 + 1000)}`
    if (!taken.has(seatKey(row, candidate))) return candidate
  }
  return `${number}-${randomUUID().slice(0, 8)}`
}

/**
 * Benzersiz (hallId, row, number) kaydını yazım sırasında bozacak hedef
 * anahtarları önceden çözer. Çakışan koltuk önce kendi eski anahtarına döner,
 * o da doluysa numarasına son ek alır; böylece kayıt 500 vermez, editör
 * uygulanan anahtarları geri bildirim olarak görür.
 */
async function resolveSeatKeys(
  hallId: string,
  updates: SeatWrite[],
  existingById: Map<string, ExistingSeat>,
  createKeys: string[],
  safeDeletedIds: string[],
  allSeats: ExistingSeat[] | null
): Promise<{ id: string; row: string; number: string }[]> {
  const changed = updates.filter((update) => update.keyChanged)
  if (changed.length === 0) return []

  // Yerinde kalacak koltukların anahtarları ile yeni koltuk anahtarları dolu sayılır.
  const taken = new Set(createKeys)
  const freeIds = new Set([...changed.map((update) => update.id), ...safeDeletedIds])
  if (allSeats) {
    for (const seat of allSeats) {
      if (!freeIds.has(seat.id)) taken.add(seatKey(seat.row, seat.number))
    }
  } else {
    const targets = Array.from(new Map(changed.map((u) => [seatKey(u.data.row, u.data.number), u.data])).values())
    for (let i = 0; i < targets.length; i += UPDATE_CHUNK) {
      const pairs = targets.slice(i, i + UPDATE_CHUNK)
      const holders = await prisma.$queryRaw<{ id: string; row: string; number: string }[]>(Prisma.sql`
        SELECT s."id", s."row", s."number" FROM "seats" AS s
        JOIN (VALUES ${Prisma.join(pairs.map((p) => Prisma.sql`(${p.row}::text, ${p.number}::text)`))})
          AS v("row", "number") ON v."row" = s."row" AND v."number" = s."number"
        WHERE s."hallId" = ${hallId}
      `)
      for (const holder of holders) {
        if (!freeIds.has(holder.id)) taken.add(seatKey(holder.row, holder.number))
      }
    }
  }

  const conflicts: { id: string; row: string; number: string }[] = []
  const pending: SeatWrite[] = []
  for (const update of changed) {
    const target = seatKey(update.data.row, update.data.number)
    if (taken.has(target)) {
      pending.push(update)
      continue
    }
    taken.add(target)
  }

  for (const update of pending) {
    const current = existingById.get(update.id)
    if (!current) continue
    const target = seatKey(update.data.row, update.data.number)
    if (!taken.has(target)) {
      taken.add(target)
      continue
    }
    const back = seatKey(current.row, current.number)
    if (!taken.has(back)) {
      update.data.row = current.row
      update.data.number = current.number
    } else {
      update.data.number = claimNumber(taken, update.data.row, update.data.number)
    }
    update.keyChanged = current.row !== update.data.row || current.number !== update.data.number
    taken.add(seatKey(update.data.row, update.data.number))
    conflicts.push({ id: update.id, row: update.data.row, number: update.data.number })
  }

  return conflicts
}

function seatData(s: SeatPayload, row: string, number: string) {
  return {
    row,
    number,
    x: Math.round(s.x),
    y: Math.round(s.y),
    width: Math.max(8, Math.round(s.width || 24)),
    height: Math.max(8, Math.round(s.height || 24)),
    type: s.type || 'NORMAL',
    status: STATUSES.includes(s.status || '') ? s.status! : 'available',
    price: typeof s.price === 'number' && Number.isFinite(s.price) ? s.price : null,
    zone: s.zone ?? null,
    blockId: s.blockId ?? null,
    sectionId: s.sectionId ?? null,
    shape: s.shape === 'rect' ? 'rect' : 'circle',
    rotation: Math.round(s.rotation ?? 0),
    svgId: s.svgId ?? null,
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const seats: SeatPayload[] = Array.isArray(body.seats) ? body.seats : []
    const deletedSeatIds: string[] = Array.isArray(body.deletedSeatIds) ? body.deletedSeatIds : []
    const layout = body.layout && typeof body.layout === 'object' ? body.layout : null
    // Özet yanıt: 10.000 koltuğun tamamı yeniden diziye çevrilmez, editör
    // yerel durumunu yalnızca değişen alanlarla günceller.
    const summary = body.response === 'summary'
    // Kısmi kayıt: editör yalnız değişen koltukları gönderir, salonun tamamı
    // veritabanından okunmaz.
    const partial = body.mode === 'partial'
    const sentIds = Array.from(
      new Set([
        ...seats.map((s) => s.id).filter((id): id is string => Boolean(id)),
        ...deletedSeatIds,
      ])
    )
    const limited = partial && sentIds.length <= PARTIAL_READ_LIMIT

    // Salon sahipliği ile gerekli okumalar tek yığında yapılır: bu veritabanında
    // gecikmenin kaynağı sorgu sayısıdır, sorgu boyutu değil.
    const [owned, existingSeats, lockedIds, seatCount] = await Promise.all([
      prisma.hall.count({ where: { id: params.id, organizerId: session.user.organizerId } }),
      readSeats(params.id, limited ? sentIds : null),
      readLockedSeatIds(params.id, limited ? sentIds : null),
      partial ? prisma.seat.count({ where: { hallId: params.id } }) : Promise.resolve(0),
    ])

    if (owned === 0) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
    }

    const existingById = new Map(existingSeats.map((seat) => [seat.id, seat]))
    // Kısmi kayıtta salonun tamamı okunmaz; anahtar çözücü o durumda yalnız
    // hedef anahtarlara sahip olan koltukları sorgular.
    let allSeats: ExistingSeat[] | null = limited ? null : existingSeats
    let plan = buildPlan(params.id, seats, deletedSeatIds, existingById, lockedIds, allSeats)

    if (limited && plan.creates.length > 0) {
      // Kısmi kayıtta sandığımızdan fazla yeni koltuk var: anahtar çakışmasını
      // görebilmek için salonun tamamı okunur ve plan yeniden kurulur.
      allSeats = await readSeats(params.id, null)
      plan = buildPlan(params.id, seats, deletedSeatIds, new Map(allSeats.map((seat) => [seat.id, seat])), lockedIds, allSeats)
    }

    const { updates, creates, createdSeats, reverted, safeDeletedIds, refusedDeletedIds } = plan
    const capacity = (partial ? seatCount : existingSeats.length) - safeDeletedIds.length + creates.length

    // Benzersiz (hallId,row,number) kaydını yazımda değil burada çöz: çakışan
    // koltuk eski numarasında kalır ya da son ek alır, editöre geri bildirilir.
    const keyConflicts = await resolveSeatKeys(
      params.id,
      updates,
      existingById,
      creates.map((create) => seatKey(create.row, create.number)),
      safeDeletedIds,
      allSeats
    )
    const stagedIds = updates.filter((update) => update.keyChanged).map((update) => update.id)

    await prisma.$transaction(async (tx) => {
      if (safeDeletedIds.length > 0) {
        await tx.seat.deleteMany({ where: { hallId: params.id, id: { in: safeDeletedIds } } })
      }
      if (stagedIds.length > 0) await stageSeatKeys(tx, params.id, stagedIds)
      for (let i = 0; i < updates.length; i += UPDATE_CHUNK) {
        await bulkUpdateSeats(tx, params.id, updates.slice(i, i + UPDATE_CHUNK))
      }
      if (creates.length > 0) {
        await tx.seat.createMany({ data: creates, skipDuplicates: true })
      }
      await tx.hall.update({
        where: { id: params.id },
        data: { capacity, ...(layout ? { layoutJson: layout } : {}) },
      })
      // Kategori yansıması da aynı yığında: layoutJson ile seat_categories birlikte değişir.
      if (layout && Array.isArray(layout.categories)) {
        await syncSeatCategories(tx, params.id, layout.categories as LayoutCategoryInput[])
      }
    }, { timeout: 120000 })

    if (summary) {
      const keptDeletedSeats = await readSeats(params.id, refusedDeletedIds)
      return NextResponse.json({
        ok: true,
        id: params.id,
        capacity,
        responseMode: 'summary',
        mode: partial ? 'partial' : 'full',
        lockedSeatIds: Array.from(lockedIds),
        createdSeats,
        reverted: keyConflicts.length > 0 ? [...reverted, ...keyConflicts] : reverted,
        keyConflicts,
        keptDeletedSeats,
      })
    }

    const updated = await prisma.hall.findUnique({
      where: { id: params.id },
      include: { seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] } },
    })

    return NextResponse.json({
      ...updated,
      seats: (updated?.seats ?? []).map((seat) => ({ ...seat, locked: lockedIds.has(seat.id) })),
    })
  } catch (error) {
    console.error('layout-sync:', error)
    return NextResponse.json(
      { error: 'Senkronizasyon başarısız', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
