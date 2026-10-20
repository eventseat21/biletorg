import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isStripeConfigured, StripeNotConfiguredError } from '@/lib/stripe'
import { CheckoutError } from '@/lib/checkout/errors'
import { createPendingOrder, releaseExpiredOrders, releaseOrder, type CheckoutItem } from '@/lib/checkout/orders'
import { openCheckoutSession, type CheckoutLine } from '@/lib/checkout/stripe-session'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_LINES = 20
/** Koltuk reyonları ve Stripe oturumları şişmesin. */
const CHECKOUT_LIMIT = 15
const CHECKOUT_WINDOW_MS = 5 * 60 * 1000

function parseSeatIds(raw: unknown, quantity: number): string[] | undefined {
  if (raw === undefined) return undefined
  if (!Array.isArray(raw) || raw.length !== quantity || raw.some((id) => typeof id !== 'string' || !id)) {
    throw new CheckoutError(400, 'Koltuk seçimi geçersiz.')
  }
  return raw as string[]
}

function parseItems(raw: unknown): CheckoutItem[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) {
    throw new CheckoutError(400, 'Bilet seçimi geçersiz.')
  }
  const seen = new Set<string>()
  return raw.map((entry) => {
    const categoryId = typeof entry?.categoryId === 'string' ? entry.categoryId : ''
    const quantity = Number(entry?.quantity)
    if (!categoryId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new CheckoutError(400, 'Bilet adedi 1 ile 10 arasında olmalı.')
    }
    if (seen.has(categoryId)) throw new CheckoutError(400, 'Aynı kategori için adedi tek satırda belirtin.')
    seen.add(categoryId)
    const seatIds = parseSeatIds(entry?.seatIds, quantity)
    return seatIds ? { categoryId, quantity, seatIds } : { categoryId, quantity }
  })
}

function siteUrl(originHeader: string | null): string {
  const configured =
    process.env.NEXT_PUBLIC_ORG_SITE_URL || process.env.NEXTAUTH_URL || originHeader || 'http://localhost:8080'
  return configured.replace(/\/$/, '')
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Bilet almak için giriş yapın.' }, { status: 401 })

  const limit = rateLimit(`checkout:${userId}`, CHECKOUT_LIMIT, CHECKOUT_WINDOW_MS)
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSec, 'Çok sık bilet denemesi. Birkaç dakika sonra tekrar deneyin.')
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'İstek gövdesi okunamadı.' }, { status: 400 })
  }

  const eventId = typeof body.eventId === 'string' ? body.eventId : ''
  if (!eventId) return NextResponse.json({ error: 'Etkinlik belirtilmedi.' }, { status: 400 })

  let order: Awaited<ReturnType<typeof createPendingOrder>>
  let eventTitle = 'Etkinlik'
  let eventSlug = ''
  let lines: CheckoutLine[] = []

  try {
    // Süresi dolmuş tutmalar aynı sorguda temizlenir; cron gerekmez.
    await releaseExpiredOrders()
    order = await createPendingOrder({
      eventId,
      userId,
      items: parseItems(body.items),
      customer: { email: session.user.email ?? '', name: session.user.name ?? null, phone: null },
    })
    const detail = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      select: {
        event: { select: { title: true, slug: true } },
        tickets: { select: { price: true, category: { select: { name: true } } } },
      },
    })
    eventTitle = detail.event.title
    eventSlug = detail.event.slug
    const grouped = new Map<string, CheckoutLine>()
    for (const ticket of detail.tickets) {
      const name = ticket.category.name
      const existing = grouped.get(name)
      if (existing) existing.quantity += 1
      else grouped.set(name, { name, unitPrice: ticket.price, quantity: 1 })
    }
    lines = [...grouped.values()]
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[checkout] sipariş oluşturulamadı:', error)
    return NextResponse.json({ error: 'Sipariş oluşturulamadı.' }, { status: 500 })
  }

  if (!isStripeConfigured()) {
    // Anahtar yokken koltuklar reyonlarda beklemesin.
    await releaseOrder(order.id)
    return NextResponse.json(
      { error: 'Ödeme sistemi yapılandırılmadı: STRIPE_SECRET_KEY tanımlayın.' },
      { status: 503 },
    )
  }

  try {
    const url = await openCheckoutSession({
      orderId: order.id,
      eventId,
      title: eventTitle,
      slug: eventSlug,
      customerEmail: session.user.email ?? null,
      totalAmount: order.totalAmount,
      lines,
      base: siteUrl(request.headers.get('origin')),
    })
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      url,
    })
  } catch (error) {
    await releaseOrder(order.id)
    if (error instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('[checkout] stripe oturumu açılamadı:', error)
    return NextResponse.json({ error: 'Ödeme sayfası açılamadı, tekrar deneyin.' }, { status: 502 })
  }
}
