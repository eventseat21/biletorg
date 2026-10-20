import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { holdExpiresAt } from './orders'

export type CheckoutLine = { name: string; unitPrice: number; quantity: number }

function toCents(amount: number): number {
  return Math.round(Number(amount.toFixed(2)) * 100)
}

/**
 * Stripe Checkout oturumu açar ve siparişe bağlar.
 * `totalAmount`, satırların toplamından fazlaysa fark hizmet bedeli olarak ayrı satır yazılır.
 */
export async function openCheckoutSession(params: {
  orderId: string
  eventId: string
  title: string
  slug: string
  customerEmail: string | null
  totalAmount: number
  lines: CheckoutLine[]
  base: string
}): Promise<string | null> {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.lines.map((line) => ({
    quantity: line.quantity,
    price_data: {
      currency: 'eur',
      unit_amount: toCents(line.unitPrice),
      product_data: { name: `${params.title} — ${line.name}` },
    },
  }))

  const ticketTotal = params.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
  const fee = Number((params.totalAmount - ticketTotal).toFixed(2))
  if (fee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: toCents(fee),
        product_data: { name: 'Hizmet bedeli (KurdEvents)' },
      },
    })
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: params.customerEmail ?? undefined,
    line_items: lineItems,
    expires_at: Math.floor(holdExpiresAt().getTime() / 1000),
    success_url: `${params.base}/user/orders/${params.orderId}?durum=basarili`,
    cancel_url: `${params.base}/events/${params.slug}?durum=iptal`,
    metadata: { orderId: params.orderId, eventId: params.eventId },
  })

  await prisma.order.update({ where: { id: params.orderId }, data: { stripeSessionId: session.id } })
  return session.url
}
