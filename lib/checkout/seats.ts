// Salon planından seçilen koltukların satış tarafı: tutma, bırakma ve alıcıya görünüm.
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { CheckoutError } from './errors'

const LIVE_TICKET_STATUSES = ['PENDING', 'ACTIVE', 'USED']

export type SeatLine = { categoryId: string; seatIds: string[] }

export type SaleSeatRow = {
  id: string
  x: number
  y: number
  row: string
  number: string
  type: string
  status: string
  price: number | null
  width: number
  height: number
  shape: string
  rotation: number
}

const SEAT_SELECT = {
  id: true,
  x: true,
  y: true,
  row: true,
  number: true,
  type: true,
  status: true,
  price: true,
  width: true,
  height: true,
  shape: true,
  rotation: true,
} satisfies Prisma.SeatSelect

/**
 * İstenen koltukların tamamını atomik olarak 'held' yapar.
 * updateMany satır kilidi kullandığı için aynı koltuğu isteyen ikinci sipariş
 * bekler ve sonra koltuğu 'held' bulup reddedilir — çift satış olmaz.
 */
export async function holdSeats(
  tx: Prisma.TransactionClient,
  hallId: string,
  seatIds: string[],
): Promise<Map<string, { id: string; type: string; row: string; number: string }>> {
  const unique = [...new Set(seatIds)]
  if (unique.length !== seatIds.length) {
    throw new CheckoutError(400, 'Aynı koltuk iki kez seçilemez.')
  }
  const taken = await tx.seat.updateMany({
    where: { id: { in: unique }, hallId, status: 'available' },
    data: { status: 'held' },
  })
  if (taken.count !== unique.length) {
    throw new CheckoutError(409, 'Seçtiğiniz koltuklardan bazıları az önce satıldı, lütfen yeniden seçin.')
  }

  const rows = await tx.seat.findMany({
    where: { id: { in: unique } },
    select: { id: true, type: true, row: true, number: true },
  })
  if (rows.length !== unique.length) {
    throw new CheckoutError(404, 'Seçilen koltuklar bulunamadı.')
  }
  return new Map(rows.map((row) => [row.id, row]))
}

/**
 * Sipariş iptal olduğunda koltuğu serbest bırakır.
 * Üzerinde hâlâ geçerli bilet olan ya da organizatörün elle rezerve ettiği koltuklar korunur.
 */
export async function releaseSeats(tx: Prisma.TransactionClient, seatIds: string[]): Promise<void> {
  if (seatIds.length === 0) return
  await tx.$executeRaw(
    Prisma.sql`UPDATE "seats" AS s
      SET "status" = 'available', "updatedAt" = now()
      WHERE s."id" IN (${Prisma.join(seatIds)})
        AND s."status" = 'held'
        AND NOT EXISTS (
          SELECT 1 FROM "tickets" t
          WHERE t."seatId" = s."id" AND t."status" IN (${Prisma.join(LIVE_TICKET_STATUSES)})
        )`,
  )
}

/** Alıcının gördüğü plan: koltuklar, bu etkinlikte satılmış olanlar ve satılabilir kategoriler. */
export async function readHallSeatsForSale(hallId: string, eventId: string) {
  const [seats, sold] = await Promise.all([
    prisma.seat.findMany({ where: { hallId }, select: SEAT_SELECT }) as Promise<SaleSeatRow[]>,
    prisma.ticket.findMany({
      where: { eventId, seatId: { not: null }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      select: { seatId: true },
    }),
  ])
  return { seats, soldSeatIds: sold.map((row) => row.seatId).filter((id): id is string => Boolean(id)) }
}
