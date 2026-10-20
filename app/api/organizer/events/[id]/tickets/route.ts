import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncTicketCategoriesFromHall } from '@/lib/sales/categories-from-hall'

export const runtime = 'nodejs'

type Context = { params: { id: string } }

const SOLD_STATUSES = ['CANCELLED', 'REFUNDED']

/** Organizatörün kendi etkinliği; değilse yanıtı döndürüyoruz. */
async function ownedEvent(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) return { error: NextResponse.json({ error: 'Yetkisiz' }, { status: 401 }) }
  const event = await prisma.event.findFirst({
    where: { id, organizerId: session.user.organizerId },
    select: { id: true, hallId: true },
  })
  if (!event) return { error: NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 }) }
  return { event }
}

type DateInput = { provided: boolean; value: Date | null; invalid: boolean }

/** Alan hiç gelmediyse (provided=false) mevcut değer korunur; boşsa silinir. */
function readDate(value: unknown): DateInput {
  if (value === undefined) return { provided: false, value: null, invalid: false }
  if (value === null || value === '') return { provided: true, value: null, invalid: false }
  const date = new Date(String(value))
  return Number.isNaN(date.getTime())
    ? { provided: true, value: null, invalid: true }
    : { provided: true, value: date, invalid: false }
}

export async function GET(_request: Request, { params }: Context) {
  const owned = await ownedEvent(params.id)
  if (owned.error) return owned.error

  const categories = await prisma.ticketCategory.findMany({
    where: { eventId: owned.event.id },
    orderBy: { price: 'asc' },
  })
  return NextResponse.json({ categories, hallId: owned.event.hallId })
}

/** Yeni kategori aç veya salon planından kategorileri yansıt. */
export async function POST(request: Request, { params }: Context) {
  const owned = await ownedEvent(params.id)
  if (owned.error) return owned.error

  let body: {
    fromHall?: boolean
    name?: string
    description?: string | null
    price?: number | string
    totalQuantity?: number | string
    color?: string
    salesStart?: string | null
    salesEnd?: string | null
  }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 }) }

  if (body.fromHall) {
    if (!owned.event.hallId) return NextResponse.json({ error: 'Etkinlikte salon seçili değil' }, { status: 400 })
    const summary = await syncTicketCategoriesFromHall(owned.event.id, owned.event.hallId)
    return NextResponse.json({ summary })
  }

  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Kategori adı gerekli' }, { status: 400 })
  const price = Number(body.price ?? 0)
  const totalQuantity = Math.floor(Number(body.totalQuantity ?? 0))
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Geçersiz fiyat' }, { status: 400 })
  if (!Number.isInteger(totalQuantity) || totalQuantity < 0) return NextResponse.json({ error: 'Geçersiz stok' }, { status: 400 })

  const salesStart = readDate(body.salesStart)
  const salesEnd = readDate(body.salesEnd)
  if (salesStart.invalid || salesEnd.invalid) return NextResponse.json({ error: 'Geçersiz satış tarihi' }, { status: 400 })

  const category = await prisma.ticketCategory.create({
    data: {
      eventId: owned.event.id,
      name,
      description: body.description?.trim() || null,
      price,
      totalQuantity,
      availableQuantity: totalQuantity,
      color: /^#[0-9a-f]{6}$/i.test(String(body.color || '')) ? String(body.color) : '#3b82f6',
      salesStart: salesStart.value,
      salesEnd: salesEnd.value,
    },
  })
  return NextResponse.json({ category })
}

export async function PATCH(request: Request, { params }: Context) {
  const owned = await ownedEvent(params.id)
  if (owned.error) return owned.error

  let body: {
    categoryId?: string
    name?: string
    description?: string | null
    price?: number | string
    totalQuantity?: number | string
    color?: string
    salesStart?: string | null
    salesEnd?: string | null
  }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 }) }
  if (!body.categoryId) return NextResponse.json({ error: 'Bilet kategorisi gerekli' }, { status: 400 })

  const category = await prisma.ticketCategory.findFirst({ where: { id: body.categoryId, eventId: owned.event.id } })
  if (!category) return NextResponse.json({ error: 'Bilet kategorisi bulunamadı' }, { status: 404 })

  const price = body.price === undefined ? category.price : Number(body.price)
  const totalQuantity = body.totalQuantity === undefined ? category.totalQuantity : Math.floor(Number(body.totalQuantity))
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Geçersiz fiyat' }, { status: 400 })
  if (!Number.isInteger(totalQuantity) || totalQuantity < 0) return NextResponse.json({ error: 'Geçersiz stok' }, { status: 400 })

  const salesStart = readDate(body.salesStart)
  const salesEnd = readDate(body.salesEnd)
  if (salesStart.invalid || salesEnd.invalid) return NextResponse.json({ error: 'Geçersiz satış tarihi' }, { status: 400 })
  const startValue = salesStart.provided ? salesStart.value : category.salesStart
  const endValue = salesEnd.provided ? salesEnd.value : category.salesEnd
  if (startValue && endValue && endValue <= startValue) return NextResponse.json({ error: 'Satış bitişi başlangıçtan sonra olmalı' }, { status: 400 })

  const soldCount = await prisma.ticket.count({
    where: { categoryId: category.id, status: { notIn: SOLD_STATUSES } },
  })
  if (totalQuantity < soldCount) {
    return NextResponse.json({ error: `Bu kategoride ${soldCount} kayıtlı/satılmış bilet var; toplam stok bunun altına indirilemez` }, { status: 409 })
  }

  const color = body.color === undefined ? undefined : /^#[0-9a-f]{6}$/i.test(String(body.color)) ? String(body.color) : category.color

  const availableQuantity = Math.max(0, totalQuantity - soldCount)
  const updated = await prisma.ticketCategory.update({
    where: { id: category.id },
    data: {
      name: body.name?.trim() || undefined,
      description: body.description === null ? null : body.description?.trim() || undefined,
      price,
      totalQuantity,
      availableQuantity,
      color,
      salesStart: salesStart.provided ? salesStart.value : undefined,
      salesEnd: salesEnd.provided ? salesEnd.value : undefined,
    },
  })

  return NextResponse.json({ category: updated, soldCount })
}

/** Satılmamış kategoriyi kaldır. */
export async function DELETE(request: Request, { params }: Context) {
  const owned = await ownedEvent(params.id)
  if (owned.error) return owned.error

  let body: { categoryId?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 }) }
  if (!body.categoryId) return NextResponse.json({ error: 'Bilet kategorisi gerekli' }, { status: 400 })

  const category = await prisma.ticketCategory.findFirst({ where: { id: body.categoryId, eventId: owned.event.id } })
  if (!category) return NextResponse.json({ error: 'Bilet kategorisi bulunamadı' }, { status: 404 })

  const soldCount = await prisma.ticket.count({ where: { categoryId: category.id, status: { notIn: SOLD_STATUSES } } })
  if (soldCount > 0) {
    return NextResponse.json({ error: `Bu kategoride ${soldCount} satılmış bilet var; silinemez, stoğunu 0 yapabilirsiniz` }, { status: 409 })
  }

  await prisma.ticketCategory.delete({ where: { id: category.id } })
  return NextResponse.json({ ok: true })
}
