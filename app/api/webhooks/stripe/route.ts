import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { finalizePaidOrder, releaseOrder } from '@/lib/checkout/orders'
import { notifyOrderPaid } from '@/lib/checkout/notify'

export const dynamic = 'force-dynamic'

/** Webhook'ta sipariş, metadata yoksa Stripe oturum kimliğiyle bulunur. */
async function resolveOrderId(session: Stripe.Checkout.Session): Promise<string | null> {
  const fromMetadata = session.metadata?.orderId
  if (fromMetadata) return fromMetadata
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  })
  return order?.id ?? null
}

export async function POST(request: Request) {
  const secret = getStripeWebhookSecret()
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET tanımlı değil.' }, { status: 503 })
  }
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'stripe-signature başlığı yok.' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch (error) {
    console.error('[stripe webhook] imza doğrulanamadı:', error)
    return NextResponse.json({ error: 'Geçersiz imza.' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.expired') {
    return NextResponse.json({ received: true, ignored: event.type })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderId = await resolveOrderId(session)
  if (!orderId) {
    console.error('[stripe webhook] sipariş bulunamadı:', session.id)
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const changed = await finalizePaidOrder(orderId, session.payment_intent?.toString() ?? null)
      if (changed) {
        // Bilet kodları sipariş sayfasında da duruyor; e-posta ödemenin önüne geçmez.
        const mail = await notifyOrderPaid(orderId)
        if (!mail.sent) console.error('[stripe webhook] bilet e-postası gitmedi:', orderId, mail.reason)
      }
      return NextResponse.json({ received: true, orderId, paid: changed })
    }
    const changed = await releaseOrder(orderId)
    return NextResponse.json({ received: true, orderId, released: changed })
  } catch (error) {
    // 500 dönersek Stripe olayı yeniden dener.
    console.error('[stripe webhook] işlenemedi:', event.type, orderId, error)
    return NextResponse.json({ error: 'Sipariş güncellenemedi.' }, { status: 500 })
  }
}
