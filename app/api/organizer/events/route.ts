import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'etkinlik'
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.organizerId },
    orderBy: { startDate: 'desc' },
    include: {
      _count: { select: { tickets: true } },
      ticketCategories: { take: 1, select: { price: true } },
    },
  })

  return NextResponse.json({ events })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  let body: {
    title?: string
    titleTr?: string
    titleDe?: string
    titleEn?: string
    titleKu?: string
    titleCkb?: string
    startDate?: string
    description?: string
    descriptionTr?: string
    descriptionDe?: string
    descriptionEn?: string
    descriptionKu?: string
    descriptionCkb?: string
    image?: string
    category?: string
    startingPrice?: number | string
    initialQuantity?: number | string
    hallId?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  const title = String(body.title || '').trim()
  if (!title) {
    return NextResponse.json({ error: 'Başlık gerekli' }, { status: 400 })
  }

  const start = body.startDate
    ? new Date(body.startDate)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: 'Geçersiz tarih' }, { status: 400 })
  }

  const startingPrice = Number(body.startingPrice ?? 0)
  const initialQuantity = Math.floor(Number(body.initialQuantity ?? 100))
  if (!Number.isFinite(startingPrice) || startingPrice < 0) return NextResponse.json({ error: 'Başlangıç fiyatı geçersiz' }, { status: 400 })
  if (!Number.isFinite(initialQuantity) || initialQuantity < 1) return NextResponse.json({ error: 'Bilet adedi 0’dan büyük olmalı' }, { status: 400 })

  const orgId = session.user.organizerId
  const baseSlug = slugifyTitle(title)
  let slug = baseSlug
  for (let attempt = 0; attempt < 50; attempt++) {
    const existing = await prisma.event.findUnique({ where: { slug } })
    if (!existing) break
    slug = `${baseSlug}-${attempt + 1}`
  }

  if (body.hallId) {
    const hall = await prisma.hall.findFirst({
      where: { id: body.hallId, organizerId: orgId },
      select: { id: true },
    })
    if (!hall) return NextResponse.json({ error: 'Salon bulunamadı' }, { status: 400 })
  }

  const event = await prisma.$transaction(async (tx) => {
    const e = await tx.event.create({
      data: {
        organizerId: orgId,
        title,
        titleTr: body.titleTr?.trim() || title,
        titleDe: body.titleDe?.trim() || null,
        titleEn: body.titleEn?.trim() || null,
        titleKu: body.titleKu?.trim() || null,
        titleCkb: body.titleCkb?.trim() || null,
        slug,
        description: body.description?.trim() || null,
        descriptionTr: body.descriptionTr?.trim() || body.description?.trim() || null,
        descriptionDe: body.descriptionDe?.trim() || null,
        descriptionEn: body.descriptionEn?.trim() || null,
        descriptionKu: body.descriptionKu?.trim() || null,
        descriptionCkb: body.descriptionCkb?.trim() || null,
        image: body.image?.trim() || null,
        category: body.category?.trim() || null,
        startDate: start,
        hallId: body.hallId || null,
        status: 'DRAFT',
        isPublished: false,
      },
    })
    await tx.ticketCategory.create({
      data: {
        eventId: e.id,
        name: 'Genel',
        price: startingPrice,
        totalQuantity: initialQuantity,
        availableQuantity: initialQuantity,
      },
    })
    return e
  })

  return NextResponse.json({ event })
}
