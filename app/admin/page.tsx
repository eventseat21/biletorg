import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getAdminStats() {
  try {
    const [totalUsers, totalOrganizers, totalEvents, totalTickets, pendingOrgs, pendingCheckers] = await Promise.all([
      prisma.user.count(),
      prisma.organizer.count(),
      prisma.event.count(),
      prisma.ticket.count(),
      prisma.organizer.count({ where: { status: 'PENDING' } }),
      prisma.ticketChecker.count({ where: { status: 'PENDING' } })
    ])
    const pendingApprovals = pendingOrgs + pendingCheckers

    const revenue = await prisma.order.aggregate({
      where: { paymentStatus: 'COMPLETED' },
      _sum: { totalAmount: true }
    })

    return {
      totalUsers,
      totalOrganizers,
      totalEvents,
      totalTickets,
      pendingApprovals,
      totalRevenue: revenue._sum.totalAmount || 0
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return {
      totalUsers: 0,
      totalOrganizers: 0,
      totalEvents: 0,
      totalTickets: 0,
      pendingApprovals: 0,
      totalRevenue: 0
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Kullanıcı</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Organizatör</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrganizers}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Etkinlik</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEvents}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Satılan Bilet</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTickets}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam Gelir</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {stats.totalRevenue.toLocaleString('tr-TR')} ₺
          </p>
        </div>
        <div className="card p-6 border-2 border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-700">Onay Bekleyen</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingApprovals}</p>
          {stats.pendingApprovals > 0 && (
            <Link href="/admin/approvals" className="text-sm text-yellow-600 hover:text-yellow-700 mt-2 block">
              Onaylara git →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
