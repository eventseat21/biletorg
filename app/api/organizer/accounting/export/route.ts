import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { euro, PERIOD_LABELS, periodStart, readPeriod, toCsv } from '@/lib/accounting/format'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Row = {
  orderNumber: string
  createdAt: Date
  title: string
  tickets: number
  customerEmail: string
  totalAmount: number
  platformFee: number
  organizerAmount: number
}

/** Ödenmiş sipariş dökümü: organizatöre ödeme için CSV. */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = readPeriod(searchParams.get('period'))
  const from = periodStart(period)

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT ord."orderNumber",
           ord."createdAt",
           e."title",
           ord."customerEmail",
           ord."totalAmount",
           ord."platformFee",
           ord."organizerAmount",
           (SELECT COUNT(*)::int FROM "tickets" t WHERE t."orderId" = ord."id") AS tickets
    FROM "orders" ord
    JOIN "events" e ON e."id" = ord."eventId"
    WHERE e."organizerId" = ${session.user.organizerId}
      AND ord."paymentStatus" = 'PAID'
      AND (${from}::timestamptz IS NULL OR ord."createdAt" >= ${from})
    ORDER BY ord."createdAt" ASC
  `

  const totals = rows.reduce(
    (sum, row) => ({
      tickets: sum.tickets + row.tickets,
      total: sum.total + Number(row.totalAmount),
      fee: sum.fee + Number(row.platformFee),
      net: sum.net + Number(row.organizerAmount),
    }),
    { tickets: 0, total: 0, fee: 0, net: 0 },
  )

  const csv = toCsv([
    ['Sipariş no', 'Tarih', 'Etkinlik', 'Bilet', 'Müşteri', 'Brüt (EUR)', 'Kurdevents komisyonu (EUR)', 'Organizatör net (EUR)'],
    ...rows.map((row) => [
      row.orderNumber,
      new Date(row.createdAt).toLocaleString('tr-TR'),
      row.title,
      row.tickets,
      row.customerEmail,
      euro(Number(row.totalAmount)),
      euro(Number(row.platformFee)),
      euro(Number(row.organizerAmount)),
    ]),
    ['TOPLAM', PERIOD_LABELS[period], '', totals.tickets, '', euro(totals.total), euro(totals.fee), euro(totals.net)],
  ])

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kurdevents-${period}.csv"`,
    },
  })
}
