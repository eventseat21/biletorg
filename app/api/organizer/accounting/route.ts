import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession()
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'month'

  const organizerId = session.user.organizerId
  const commissionRate = parseInt(process.env.PLATFORM_COMMISSION_PERCENTAGE || '5')

  // Calculate date range
  const now = new Date()
  const startDate = new Date()
  if (period === 'week') {
    startDate.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    startDate.setDate(now.getDate() - 30)
  } else {
    startDate.setFullYear(now.getFullYear() - 1)
  }

  // Get all completed orders for this organizer
  const orders = await prisma.order.findMany({
    where: {
      event: { organizerId },
      paymentStatus: 'COMPLETED',
      createdAt: { gte: startDate }
    },
    include: { event: true }
  })

  // Calculate totals
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const totalCommission = orders.reduce((sum, o) => sum + Number(o.platformFee), 0)
  const netRevenue = totalRevenue - totalCommission
  const totalSales = orders.length

  // Revenue by date for chart
  const revenueByDate: Record<string, number> = {}
  orders.forEach(order => {
    const date = order.createdAt.toISOString().split('T')[0]
    revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.totalAmount)
  })

  // Revenue by event
  const eventRevenueMap: Record<string, {
    id: string
    title: string
    sales: number
    total: number
    commission: number
    net: number
  }> = {}

  orders.forEach(order => {
    const eventId = order.event.id
    if (!eventRevenueMap[eventId]) {
      eventRevenueMap[eventId] = {
        id: eventId,
        title: order.event.title,
        sales: 0,
        total: 0,
        commission: 0,
        net: 0
      }
    }
    eventRevenueMap[eventId].sales += 1
    eventRevenueMap[eventId].total += Number(order.totalAmount)
    eventRevenueMap[eventId].commission += Number(order.platformFee)
    eventRevenueMap[eventId].net += Number(order.organizerAmount)
  })

  const sortedDates = Object.keys(revenueByDate).sort()
  const revenueByDateArray = sortedDates.map(date => ({
    date: new Date(date).toLocaleDateString('tr-TR'),
    revenue: revenueByDate[date]
  }))

  return NextResponse.json({
    totalRevenue,
    totalCommission,
    netRevenue,
    totalSales,
    commissionRate,
    revenueByDate: revenueByDateArray,
    eventRevenue: Object.values(eventRevenueMap).sort((a, b) => b.net - a.net)
  })
}
