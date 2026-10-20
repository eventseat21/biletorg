import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readHallSeatsForSale } from '@/lib/checkout/seats'

export const dynamic = 'force-dynamic'

/** Alıcının koltuk seçeceği plan: yalnız yayınlanmış etkinlikler için açık. */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const event = await prisma.event.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED', isPublished: true },
    select: {
      id: true,
      hallId: true,
      hall: { select: { id: true, name: true, layoutJson: true } },
      ticketCategories: {
        where: { hasSeatSelection: true },
        orderBy: { price: 'asc' },
        select: { id: true, name: true, color: true, seatType: true, price: true, availableQuantity: true },
      },
    },
  })
  if (!event?.hallId || event.ticketCategories.length === 0) {
    return NextResponse.json({ error: 'Bu etkinlikte koltuk seçimi yok.' }, { status: 404 })
  }

  const { seats, soldSeatIds } = await readHallSeatsForSale(event.hallId, event.id)
  const layout = (event.hall?.layoutJson ?? {}) as { stage?: { width: number; height: number }; background?: unknown }

  return NextResponse.json({
    hallName: event.hall?.name ?? null,
    stage: layout.stage ?? { width: 1200, height: 800 },
    seats,
    soldSeatIds,
    categories: event.ticketCategories,
  })
}
