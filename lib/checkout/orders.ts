// Siparişin yaşam döngüsü: bekleme → ödeme → bilet, ya da iptal → stok iadesi.
import { prisma } from '@/lib/prisma'
import { CheckoutError } from './errors'
import { computeOrderAmounts, makeOrderNumber, makeTicketCode, makeTicketNumber, round2 } from './pricing'
import { holdSeats, releaseSeats } from './seats'

export const ORDER_HOLD_MINUTES = 15
/** Bir sipariş en fazla bu kadar bilet taşıyabilir; tek kişinin stok tutmasını engeller. */
export const MAX_TICKETS_PER_ORDER = 10

export type CheckoutItem = { categoryId: string; quantity: number; seatIds?: string[] }

export function holdExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000)
}

/**
 * Koltuk/bilet rezervasyonunu atomik olarak tutar ve ödenmemiş (PENDING) biletleri yazar.
 * Stok düşümü WHERE ile yapıldığı için aynı anda gelen iki sipariş aynı bileti satamaz.
 */
export async function createPendingOrder(params: {
  eventId: string
  userId: string
  items: CheckoutItem[]
  customer: { email: string; name: string | null; phone: string | null }
}): Promise<{ id: string; orderNumber: string; totalAmount: number; ticketCount: number }> {
  const { eventId, userId, items, customer } = params
  const ticketCount = items.reduce((sum, item) => sum + item.quantity, 0)
  if (ticketCount <= 0) throw new CheckoutError(400, 'En az bir bilet seçin.')
  if (ticketCount > MAX_TICKETS_PER_ORDER) {
    throw new CheckoutError(400, `Bir siparişte en fazla ${MAX_TICKETS_PER_ORDER} bilet olabilir.`)
  }

  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findFirst({
      where: { id: eventId, status: 'PUBLISHED', isPublished: true },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        hallId: true,
        commissionType: true,
        commissionValue: true,
      },
    })
    if (!event) throw new CheckoutError(404, 'Etkinlik satışta değil.')

    const now = new Date()
    const categories = await tx.ticketCategory.findMany({
      where: { eventId, id: { in: items.map((i) => i.categoryId) } },
    })
    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    let baseAmount = 0
    const lines: { category: (typeof categories)[number]; quantity: number; seatIds: string[] }[] = []

    // Kilit sırası tüm siparişlerde aynı olsun diye kategori kimliğine göre sıralanır.
    for (const item of [...items].sort((a, b) => a.categoryId.localeCompare(b.categoryId))) {
      const category = categoryMap.get(item.categoryId)
      if (!category) throw new CheckoutError(404, 'Bilet kategorisi bulunamadı.')
      if (category.salesStart && category.salesStart > now) {
        throw new CheckoutError(409, `${category.name} satışa henüz açılmadı.`)
      }
      if (category.salesEnd && category.salesEnd < now) {
        throw new CheckoutError(409, `${category.name} için satış kapandı.`)
      }
      const seatIds = [...new Set(item.seatIds ?? [])]
      if (category.hasSeatSelection) {
        if (!event.hallId) throw new CheckoutError(409, `${category.name} için salon planı kaldırılmış.`)
        if (seatIds.length !== item.quantity) {
          throw new CheckoutError(400, `${category.name} için koltuk seçin (adet = seçilen koltuk sayısı).`)
        }
      } else if (seatIds.length > 0) {
        throw new CheckoutError(400, `${category.name} koltuk seçimi gerektirmez.`)
      }
      const taken = await tx.ticketCategory.updateMany({
        where: { id: category.id, availableQuantity: { gte: item.quantity } },
        data: { availableQuantity: { decrement: item.quantity } },
      })
      if (taken.count === 0) {
        throw new CheckoutError(409, `${category.name} için yeterli yer yok.`)
      }
      baseAmount += category.price * item.quantity
      lines.push({ category, quantity: item.quantity, seatIds })
    }

    // Koltuk tutma kategoriden sonra gelir; tüm siparişler aynı sırayla kilit alır.
    const requestedSeats = lines.flatMap((line) => line.seatIds)
    if (requestedSeats.length > 0) {
      const held = await holdSeats(tx, event.hallId as string, requestedSeats)
      for (const line of lines) {
        for (const seatId of line.seatIds) {
          const seat = held.get(seatId)
          if (!seat) throw new CheckoutError(404, 'Seçilen koltuklar bulunamadı.')
          if (line.category.seatType && seat.type !== line.category.seatType) {
            throw new CheckoutError(409, `${seat.row}-${seat.number} koltuğu ${line.category.name} kategorisinde değil.`)
          }
        }
      }
    }

    const amounts = computeOrderAmounts(round2(baseAmount), ticketCount, {
      type: event.commissionType,
      value: event.commissionValue,
    })

    const order = await tx.order.create({
      data: {
        orderNumber: makeOrderNumber(),
        userId,
        eventId,
        status: 'PENDING',
        totalAmount: amounts.totalAmount,
        platformFee: amounts.platformFee,
        organizerAmount: amounts.organizerAmount,
        customerEmail: customer.email,
        customerName: customer.name,
        customerPhone: customer.phone,
        paymentStatus: 'PENDING',
        expiresAt: holdExpiresAt(now),
        tickets: {
          create: lines.flatMap(({ category, quantity, seatIds }) =>
            Array.from({ length: quantity }, (_unused, index) => ({
              eventId,
              categoryId: category.id,
              userId,
              ticketNumber: makeTicketNumber(),
              status: 'PENDING',
              price: category.price,
              seatId: seatIds[index] ?? null,
            })),
          ),
        },
      },
      select: { id: true, orderNumber: true, totalAmount: true },
    })

    return { ...order, ticketCount }
  })
}

/** Stripe ödemesi doğrulandı: biletler satışa çıkarılır ve kapı kodları verilir. */
export async function finalizePaidOrder(orderId: string, paymentIntentId: string | null): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true, tickets: { select: { id: true, code: true } } },
    })
    if (!order || order.paymentStatus === 'PAID') return false

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'STRIPE',
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
        expiresAt: null,
      },
    })
    for (const ticket of order.tickets) {
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: 'ACTIVE', code: ticket.code ?? makeTicketCode() },
      })
    }
    return true
  })
}

/** Ödenmemiş sipariş: biletler iptal edilir, stok geri yazılır. */
export async function releaseOrder(orderId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentStatus: true,
        status: true,
        tickets: { select: { id: true, categoryId: true, seatId: true } },
      },
    })
    if (!order || order.paymentStatus === 'PAID' || order.status === 'CANCELLED') return false

    const byCategory = new Map<string, number>()
    for (const ticket of order.tickets) {
      byCategory.set(ticket.categoryId, (byCategory.get(ticket.categoryId) ?? 0) + 1)
    }
    for (const [categoryId, count] of byCategory) {
      await tx.ticketCategory.update({
        where: { id: categoryId },
        data: { availableQuantity: { increment: count } },
      })
    }
    await tx.ticket.updateMany({ where: { orderId }, data: { status: 'CANCELLED' } })
    await releaseSeats(
      tx,
      order.tickets.map((ticket) => ticket.seatId).filter((id): id is string => Boolean(id)),
    )
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', paymentStatus: 'FAILED', expiresAt: null },
    })
    return true
  })
}

/** Zamanında ödenmemiş siparişleri temizler; sayfa ziyaretiyle tetiklenir, cron gerektirmez. */
export async function releaseExpiredOrders(): Promise<number> {
  const expired = await prisma.order.findMany({
    where: { status: 'PENDING', paymentStatus: 'PENDING', expiresAt: { lt: new Date() } },
    select: { id: true },
    take: 50,
  })
  let released = 0
  for (const order of expired) {
    if (await releaseOrder(order.id)) released += 1
  }
  return released
}

const checkoutOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  totalAmount: true,
  platformFee: true,
  organizerAmount: true,
  paidAt: true,
  refundedAt: true,
  refundReason: true,
  createdAt: true,
  customerEmail: true,
  customerName: true,
  event: { select: { id: true, title: true, slug: true, startDate: true, image: true } },
  tickets: {
    select: {
      id: true,
      ticketNumber: true,
      code: true,
      status: true,
      checkedInAt: true,
      price: true,
      seat: { select: { row: true, number: true } },
      category: { select: { name: true, color: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

/** Alıcının kendi siparişi mi? Kimlik sızıntısını önlemek için userId ile birlikte okunur. */
export async function findUserOrder(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    select: checkoutOrderSelect,
  })
}
