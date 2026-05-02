import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { MapPin, Users, ChevronRight } from 'lucide-react'

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

async function getAllHalls() {
  try {
    return prisma.hall.findMany({
      include: {
        organizer: {
          select: {
            id: true,
            companyName: true,
            organizationDisplayName: true,
            companyEmail: true
          }
        },
        _count: {
          select: { seats: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching halls:', error)
    return []
  }
}

export default async function AdminDashboard() {
  const stats = await getAdminStats()
  const halls = await getAllHalls()

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

      {/* Halls Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Salonlar</h2>
          <p className="text-sm text-gray-500">Toplam {halls.length} salon</p>
        </div>

        {halls.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz salon yok</h3>
            <p className="text-gray-500">Organizatörler salon oluşturduğunda burada görünecek</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {halls.map((hall) => (
              <div key={hall.id} className="card hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-primary-600" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{hall.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{hall.description || 'Açıklama yok'}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {hall._count.seats} koltuk
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {hall.capacity} kapasite
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    <p className="font-medium text-gray-700">Organizatör:</p>
                    <p>{hall.organizer.organizationDisplayName || hall.organizer.companyName}</p>
                    <p className="text-xs">{hall.organizer.companyEmail}</p>
                  </div>

                  <Link 
                    href={`/organizer/halls/${hall.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
                  >
                    Detayları gör
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
