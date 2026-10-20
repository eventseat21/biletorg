// Ödenmiş siparişin iadesi: para (Stripe hazırsa Stripe'ten), biletler, koltuklar ve stok.
import { prisma } from '@/lib/prisma'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getRefundTemplate, sendEmail } from '@/lib/email'
import { CheckoutError } from './errors'
import { releaseSeats } from './seats'

export type RefundResult = {
  orderNumber: string
  amount: number
  /** Stripe anahtarı yokken para manuel aktarılır; bu durumda null döner. */
  stripeRefundId: string | null
}

/**
 * Siparişi tam olarak iade eder. Kısmi iade yok: kapıdan geçmiş bilet olan sipariş
 * iade edilemez, çünkü o bilet zaten kullanılmıştır.
 */
export async function refundOrder(orderId: string, options: { reason: string; adminId: string }): Promise<RefundResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      customerEmail: true,
      customerName: true,
      stripePaymentIntentId: true,
      stripeSessionId: true,
      event: { select: { id: true, title: true, startDate: true } },
      tickets: { select: { id: true, status: true, seatId: true, categoryId: true, checkedInAt: true } },
    },
  })
  if (!order) throw new CheckoutError(404, 'Sipariş bulunamadı.')
  if (order.paymentStatus !== 'PAID') throw new CheckoutError(409, 'Yalnızca ödenmiş sipariş iade edilir.')
  if (order.status === 'REFUNDED') throw new CheckoutError(409, 'Bu sipariş zaten iade edilmiş.')
  if (order.tickets.some((ticket) => ticket.checkedInAt || ticket.status === 'USED')) {
    throw new CheckoutError(409, 'Kapıdan geçmiş bileti olan sipariş iade edilemez.')
  }

  // Önce para: Stripe başarısızsa veritabanında hiçbir şey değişmez.
  let stripeRefundId: string | null = null
  if (isStripeConfigured() && (order.stripePaymentIntentId || order.stripeSessionId)) {
    const stripe = getStripe()
    let paymentIntentId = order.stripePaymentIntentId
    if (!paymentIntentId && order.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)
      paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)
    }
    if (!paymentIntentId) throw new CheckoutError(409, 'Siparişin Stripe ödemesi bulunamadı, iade yapılamadı.')
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(order.totalAmount * 100),
      reason: 'requested_by_customer',
      metadata: { orderId: order.id, adminId: options.adminId, note: options.reason },
    }, { idempotencyKey: `refund-${order.id}` })
    stripeRefundId = refund.id
  } else if (!isStripeConfigured()) {
    console.warn('[refund] Stripe tanımlı değil; iade kaydı yerel tutuldu, ödeme manuel yapılacak:', order.orderNumber)
  }

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { paymentStatus: true, status: true },
    })
    if (fresh.paymentStatus !== 'PAID' || fresh.status === 'REFUNDED') {
      throw new CheckoutError(409, 'Sipariş durumu değişti, sayfa yeniden yüklendiğinde tekrar deneyin.')
    }

    const byCategory = new Map<string, number>()
    for (const ticket of order.tickets) {
      byCategory.set(ticket.categoryId, (byCategory.get(ticket.categoryId) ?? 0) + 1)
    }
    for (const [categoryId, count] of byCategory) {
      await tx.ticketCategory.update({ where: { id: categoryId }, data: { availableQuantity: { increment: count } } })
    }

    await tx.ticket.updateMany({ where: { orderId }, data: { status: 'REFUNDED' } })
    await releaseSeats(
      tx,
      order.tickets.map((ticket) => ticket.seatId).filter((id): id is string => Boolean(id)),
    )
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED', paymentStatus: 'REFUNDED', refundedAt: new Date(), refundReason: options.reason, stripeRefundId },
    })
  })

  try {
    await sendEmail({
      to: order.customerEmail,
      subject: `Siparişiniz iade edildi — ${order.orderNumber}`,
      html: getRefundTemplate(order.customerEmail, order.orderNumber, order.event.title, order.totalAmount, options.reason, stripeRefundId !== null),
    })
  } catch (error) {
    console.error('[refund] iade e-postası gönderilemedi:', order.orderNumber, error)
  }

  return { orderNumber: order.orderNumber, amount: order.totalAmount, stripeRefundId }
}
