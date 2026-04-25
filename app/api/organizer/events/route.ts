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

  let body: { title?: string; startDate?: string; description?: string }
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

  const orgId = session.user.organizerId
  const baseSlug = slugifyTitle(title)
  let slug = baseSlug
  for (let attempt = 0; attempt < 50; attempt++) {
    const existing = await prisma.event.findUnique({ where: { slug } })
    if (!existing) break
    slug = `${baseSlug}-${attempt + 1}`
  }

  const event = await prisma.$transaction(async (tx) => {
    const e = await tx.event.create({
      data: {
        organizerId: orgId,
        title,
        slug,
        description: body.description?.trim() || null,
        startDate: start,
        status: 'DRAFT',
        isPublished: false,
      },
    })
    await tx.ticketCategory.create({
      data: {
        eventId: e.id,
        name: 'Genel',
        price: 0,
        totalQuantity: 100,
        availableQuantity: 100,
      },
    })
    return e
  })

  return NextResponse.json({ event })
}
