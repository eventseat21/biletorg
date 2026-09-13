import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const startDate = body.startDate ? new Date(body.startDate) : undefined
  if (startDate && Number.isNaN(startDate.getTime())) return NextResponse.json({ error: 'Geçersiz tarih' }, { status: 400 })
  const nextStatus = body.action === 'SUBMIT' ? 'PENDING_APPROVAL' : existing.status === 'PENDING_APPROVAL' ? 'DRAFT' : existing.status
  const event = await prisma.event.update({
    where: { id: existing.id },
    data: {
      hallId: body.hallId === undefined ? undefined : body.hallId || null,
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
      status: nextStatus,
    },
    include: { hall: { select: { id: true, name: true, capacity: true } } },
  })

  return NextResponse.json({ event })
}
