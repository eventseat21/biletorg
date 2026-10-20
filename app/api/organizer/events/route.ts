import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncTicketCategoriesFromHall, type HallSyncSummary } from '@/lib/sales/categories-from-hall'

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

/**
 * Aynı adlı etkinlikler karışmasın diye tabana sıra numarası eklenir:
 * ilk kayıt çıplak tabanı alır, sonrakiler 0001, 0002 ... diye devam eder.
 */
async function uniqueSlug(base: string): Promise<string> {
  const taken = await prisma.event.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  })
  const names = new Set(taken.map((row) => row.slug))
  if (!names.has(base)) return base

  let highest = 0
  for (const { slug } of taken) {
    const suffix = /^\d+$/.test(slug.slice(base.length)) ? Number(slug.slice(base.length)) : 0
    if (suffix > highest) highest = suffix
  }
  let candidate = `${base}${String(highest + 1).padStart(4, '0')}`
  while (names.has(candidate)) {
    highest += 1
    candidate = `${base}${String(highest).padStart(4, '0')}`
  }
  return candidate
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
  const slug = await uniqueSlug(slugifyTitle(title))

  if (body.hallId) {
    const hall = await prisma.hall.findFirst({
      where: { id: body.hallId, organizerId: orgId },
      select: { id: true },
    })
    if (!hall) return NextResponse.json({ error: 'Salon bulunamadı' }, { status: 400 })
  }

  const withHall = Boolean(body.hallId)
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
    if (!withHall) {
      await tx.ticketCategory.create({
        data: {
          eventId: e.id,
          name: 'Genel',
          price: startingPrice,
          totalQuantity: initialQuantity,
          availableQuantity: initialQuantity,
        },
      })
    }
    return e
  })

  // Salon seçiliyse satış kategorileri salon planından türetilir; planda
  // kategori yoksa tek 'Genel' kategorisine dönülür.
  let hallSynced: HallSyncSummary | null = null
  if (withHall) {
    hallSynced = await syncTicketCategoriesFromHall(event.id, body.hallId as string)
    if (hallSynced.created + hallSynced.updated === 0) {
      await prisma.ticketCategory.create({
        data: {
          eventId: event.id,
          name: 'Genel',
          price: startingPrice,
          totalQuantity: initialQuantity,
          availableQuantity: initialQuantity,
        },
      })
      hallSynced = null
    }
  }

  return NextResponse.json({ event, hallSynced })
}
