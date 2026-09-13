import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type Context = { params: { id: string } }

export async function PATCH(request: Request, { params }: Context) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const event = await prisma.event.findFirst({
    where: { id: params.id, organizerId: session.user.organizerId },
    select: { id: true },
  })
  if (!event) return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })

  let body: { categoryId?: string; name?: string; description?: string | null; price?: number | string; totalQuantity?: number | string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 }) }
  if (!body.categoryId) return NextResponse.json({ error: 'Bilet kategorisi gerekli' }, { status: 400 })

  const category = await prisma.ticketCategory.findFirst({ where: { id: body.categoryId, eventId: event.id } })
  if (!category) return NextResponse.json({ error: 'Bilet kategorisi bulunamadı' }, { status: 404 })

  const price = body.price === undefined ? category.price : Number(body.price)
  const totalQuantity = body.totalQuantity === undefined ? category.totalQuantity : Math.floor(Number(body.totalQuantity))
  if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Geçersiz fiyat' }, { status: 400 })
  if (!Number.isInteger(totalQuantity) || totalQuantity < 0) return NextResponse.json({ error: 'Geçersiz stok' }, { status: 400 })

  const soldCount = await prisma.ticket.count({
    where: { categoryId: category.id, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
  })
  if (totalQuantity < soldCount) {
    return NextResponse.json({ error: `Bu kategoride ${soldCount} kayıtlı/satılmış bilet var; toplam stok bunun altına indirilemez` }, { status: 409 })
  }

  const availableQuantity = Math.max(0, totalQuantity - soldCount)
  const updated = await prisma.ticketCategory.update({
    where: { id: category.id },
    data: {
      name: body.name?.trim() || undefined,
      description: body.description === null ? null : body.description?.trim() || undefined,
      price,
      totalQuantity,
      availableQuantity,
    },
  })

  return NextResponse.json({ category: updated, soldCount })
}
