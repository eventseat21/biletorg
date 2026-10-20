import { prisma } from '@/lib/prisma'

export type ScannedTicket = {
  id: string
  code: string | null
  ticketNumber: string
  price: number
  checkedInAt: Date | null
  category: { name: string; color: string }
  seat: { row: string; number: string } | null
  event: { id: string; title: string; slug: string; startDate: Date }
  holder: { name: string | null; email: string }
}

/** Admin her etkinliği okur; kontrolör yalnız atandığı organizatörünkini. */
export type ScanScope = { admin: true } | { admin?: false; organizerId: string }

function scopeWhere(scope: ScanScope) {
  return scope.admin ? {} : { event: { organizerId: scope.organizerId } }
}

export type ScanOutcome = { state: 'ok'; ticket: ScannedTicket }
  | { state: 'used'; ticket: ScannedTicket }
  | { state: 'unpaid'; message: string }
  | { state: 'cancelled'; message: string }
  | { state: 'format'; message: string }
  | { state: 'notfound'; message: string }

const ticketSelect = {
  id: true,
  code: true,
  ticketNumber: true,
  price: true,
  status: true,
  checkedInAt: true,
  category: { select: { name: true, color: true } },
  seat: { select: { row: true, number: true } },
  event: { select: { id: true, title: true, slug: true, startDate: true } },
  user: { select: { name: true, email: true } },
}

type TicketRow = {
  id: string
  code: string | null
  ticketNumber: string
  price: number
  status: string
  checkedInAt: Date | null
  category: { name: string; color: string }
  seat: { row: string; number: string } | null
  event: { id: string; title: string; slug: string; startDate: Date }
  user: { name: string | null; email: string | null }
}

function toScanned(row: TicketRow): ScannedTicket {
  return {
    id: row.id,
    code: row.code,
    ticketNumber: row.ticketNumber,
    price: row.price,
    checkedInAt: row.checkedInAt,
    category: row.category,
    seat: row.seat,
    event: row.event,
    holder: { name: row.user.name, email: row.user.email ?? '' },
  }
}

/** Kullanıcının yazdığı kodu kanonik biçimlere çevirir (tireler yok sayılır). */
function candidates(raw: string): { code?: string; ticketNumber?: string }[] {
  const trimmed = raw.trim().toUpperCase()
  const compact = trimmed.replace(/[^A-Z0-9]/g, '')
  const out: { code?: string; ticketNumber?: string }[] = []
  if (compact.length === 16) {
    out.push({ code: `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}-${compact.slice(12)}` })
    if (compact.startsWith('TK')) {
      out.push({ ticketNumber: `TK-${compact.slice(2, 10)}-${compact.slice(10)}` })
    }
  }
  if (trimmed.startsWith('TK-')) out.push({ ticketNumber: trimmed })
  return out
}

/** Bileti doğrular; giriş işaretlemez. */
export async function scanTicket(raw: string, scope: ScanScope): Promise<ScanOutcome> {
  const where = candidates(raw)
  if (where.length === 0) {
    return { state: 'format', message: 'Kod en az 16 karakter olmalı. Bilet sayfasındaki kodu yazın.' }
  }

  const row = (await prisma.ticket.findFirst({
    where: { OR: where, ...scopeWhere(scope) },
    select: ticketSelect,
  })) as TicketRow | null

  if (!row) return { state: 'notfound', message: scope.admin ? 'Bu kodla bilet bulunamadı.' : 'Bu kodla sizin biletiniz bulunamadı.' }
  if (row.status === 'PENDING') return { state: 'unpaid', message: 'Bilet ödemesi tamamlanmamış.' }
  if (row.status === 'CANCELLED') return { state: 'cancelled', message: 'Bilet iptal edilmiş.' }
  if (row.status === 'REFUNDED') return { state: 'cancelled', message: 'Bilet iade edilmiş, girişi yok.' }
  if (row.status === 'USED' || row.checkedInAt) return { state: 'used', ticket: toScanned(row) }
  return { state: 'ok', ticket: toScanned(row) }
}

/** Girişi onaylar; aynı bilet iki kez okutulursa ikinci işaretlemeyi reddeder. */
export async function admitTicket(
  ticketId: string,
  scope: ScanScope,
): Promise<{ ok: boolean; checkedInAt: Date | null; forbidden?: boolean }> {
  if (!scope.admin) {
    const owned = await prisma.ticket.count({
      where: { id: ticketId, event: { organizerId: scope.organizerId } },
    })
    if (owned === 0) return { ok: false, checkedInAt: null, forbidden: true }
  }

  const checkedInAt = new Date()
  const updated = await prisma.ticket.updateMany({
    where: { id: ticketId, status: 'ACTIVE', checkedInAt: null },
    data: { status: 'USED', checkedInAt },
  })
  if (updated.count === 1) return { ok: true, checkedInAt }
  const current = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { checkedInAt: true } })
  return { ok: false, checkedInAt: current?.checkedInAt ?? null }
}
