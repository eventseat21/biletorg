import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { periodStart, readPeriod } from '@/lib/accounting/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type EventRow = { id: string; title: string; orders: number; tickets: number; total: number; fee: number; net: number }
type BucketRow = { bucket: string; total: number; net: number }

/** Organizatörün ödenmiş siparişlerinin defteri: etkinlik bazında brüt / komisyon / net. */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = readPeriod(searchParams.get('period'))
  const organizerId = session.user.organizerId
  const from = periodStart(period)
  const granularity = period === 'all' || period === 'year' ? 'month' : 'day'

  const [organizer, eventRows, buckets] = await Promise.all([
    prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { commissionType: true, commissionValue: true },
    }),
    prisma.$queryRaw<EventRow[]>`
      SELECT e."id", e."title",
             COUNT(o."id")::int AS orders,
             COALESCE(SUM(o."ticketCount"), 0)::int AS tickets,
             COALESCE(SUM(o."totalAmount"), 0)::float AS total,
             COALESCE(SUM(o."platformFee"), 0)::float AS fee,
             COALESCE(SUM(o."organizerAmount"), 0)::float AS net
      FROM "events" e
      LEFT JOIN LATERAL (
        SELECT ord."id", ord."totalAmount", ord."platformFee", ord."organizerAmount",
               (SELECT COUNT(*)::int FROM "tickets" t WHERE t."orderId" = ord."id") AS "ticketCount"
        FROM "orders" ord
        WHERE ord."eventId" = e."id"
          AND ord."paymentStatus" = 'PAID'
          AND (${from}::timestamptz IS NULL OR ord."createdAt" >= ${from})
      ) o ON TRUE
      WHERE e."organizerId" = ${organizerId}
      GROUP BY e."id", e."title"
      HAVING COUNT(o."id") > 0
      ORDER BY total DESC
    `,
    prisma.$queryRaw<BucketRow[]>`
      SELECT to_char(date_trunc(${granularity}, ord."createdAt"), 'YYYY-MM-DD') AS bucket,
             COALESCE(SUM(ord."totalAmount"), 0)::float AS total,
             COALESCE(SUM(ord."organizerAmount"), 0)::float AS net
      FROM "orders" ord
      JOIN "events" e ON e."id" = ord."eventId"
      WHERE e."organizerId" = ${organizerId}
        AND ord."paymentStatus" = 'PAID'
        AND (${from}::timestamptz IS NULL OR ord."createdAt" >= ${from})
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
  ])

  const totals = eventRows.reduce(
    (sum, row) => ({
      total: sum.total + row.total,
      fee: sum.fee + row.fee,
      net: sum.net + row.net,
      orders: sum.orders + row.orders,
      tickets: sum.tickets + row.tickets,
    }),
    { total: 0, fee: 0, net: 0, orders: 0, tickets: 0 },
  )

  return NextResponse.json({
    period,
    commissionType: organizer?.commissionType ?? null,
    commissionValue: organizer?.commissionValue ?? null,
    ...totals,
    eventRevenue: eventRows,
    revenueByDate: buckets.map((bucket) => ({
      date: new Date(`${bucket.bucket}T00:00:00`).toLocaleDateString('tr-TR'),
      revenue: bucket.total,
      net: bucket.net,
    })),
  })
}
