import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncTicketCategoriesFromHall, type HallSyncSummary } from '@/lib/sales/categories-from-hall'

export const runtime = 'nodejs'

type Context = { params: { id: string } }

export async function PATCH(request: Request, { params }: Context) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const existing = await prisma.event.findFirst({
    where: { id: params.id, organizerId: session.user.organizerId },
  })
  if (!existing) return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })


  let body: {
    hallId?: string | null
    action?: 'SAVE' | 'SUBMIT'
    title?: string
    titleTr?: string
    titleDe?: string
    titleEn?: string
    titleKu?: string
    titleCkb?: string
    description?: string
    descriptionTr?: string
    descriptionDe?: string
    descriptionEn?: string
    descriptionKu?: string
    descriptionCkb?: string
    image?: string | null
    category?: string | null
    startDate?: string
    publishComRequested?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  if (body.hallId) {
    const hall = await prisma.hall.findFirst({
      where: { id: body.hallId, organizerId: session.user.organizerId },
      select: { id: true },
    })
    if (!hall) return NextResponse.json({ error: 'Salon bulunamadı' }, { status: 400 })
  }

  // Onaya giden etkinliğin satılabilmesi için koltuk planı olması gerekir.
  if (body.action === 'SUBMIT') {
    const targetHallId = body.hallId ?? existing.hallId
    if (!targetHallId) {
      return NextResponse.json({ error: 'Onaya göndermek için bir salon seçin.' }, { status: 400 })
    }
    const seatCount = await prisma.seat.count({ where: { hallId: targetHallId } })
    if (seatCount === 0) {
      return NextResponse.json(
        { error: 'Seçili salonda henüz koltuk planı yok. Önce salon planında koltuk oluşturun.' },
        { status: 400 }
      )
    }
  }

  const startDate = body.startDate ? new Date(body.startDate) : undefined
  if (startDate && Number.isNaN(startDate.getTime())) return NextResponse.json({ error: 'Geçersiz tarih' }, { status: 400 })

  // Yalnız açık bir aksiyon gelirse durum değişir; tek alanlık güncelleme etkinliği onaydan düşürmez.
  const nextStatus =
    body.action === 'SUBMIT'
      ? 'PENDING_APPROVAL'
      : body.action === 'SAVE' && existing.status === 'PENDING_APPROVAL'
        ? 'DRAFT'
        : existing.status
  const nextHallId = body.hallId === undefined ? existing.hallId : body.hallId || null
  const event = await prisma.event.update({
    where: { id: existing.id },
    data: {
      hallId: nextHallId,
      title: body.title?.trim() || undefined,
      titleTr: body.titleTr?.trim() || undefined,
      titleDe: body.titleDe?.trim() || undefined,
      titleEn: body.titleEn?.trim() || undefined,
      titleKu: body.titleKu?.trim() || undefined,
      titleCkb: body.titleCkb?.trim() || undefined,
      description: body.description?.trim() || undefined,
      descriptionTr: body.descriptionTr?.trim() || undefined,
      descriptionDe: body.descriptionDe?.trim() || undefined,
      descriptionEn: body.descriptionEn?.trim() || undefined,
      descriptionKu: body.descriptionKu?.trim() || undefined,
      descriptionCkb: body.descriptionCkb?.trim() || undefined,
      image: body.image === null ? null : body.image?.trim() || undefined,
      category: body.category?.trim() || undefined,
      startDate,
      publishComRequested: body.publishComRequested,
      status: nextStatus,
    },
    include: { hall: { select: { id: true, name: true, capacity: true } } },
  })

  // Salon değiştiğinde ya da onaya giderken satış listesi planla hizalanır.
  let hallSynced: HallSyncSummary | null = null
  const shouldSync = Boolean(nextHallId) && (nextHallId !== existing.hallId || body.action === 'SUBMIT')
  if (shouldSync) hallSynced = await syncTicketCategoriesFromHall(event.id, nextHallId as string)

  return NextResponse.json({ event, hallSynced })
}
