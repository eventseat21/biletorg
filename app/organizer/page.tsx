import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Ticket, DollarSign, Users, TrendingUp, Plus } from 'lucide-react'

async function getDashboardData(organizerId: string) {
  const totalEvents = await prisma.event.count({
    where: { organizerId }
  })

  const publishedEvents = await prisma.event.count({
    where: { organizerId, isPublished: true }
  })

  const totalTickets = await prisma.ticket.count({
    where: { 
      event: { organizerId }
    }
  })

  const soldTickets = await prisma.ticket.count({
    where: { 
      event: { organizerId },
      status: 'ACTIVE'
    }
  })

  const revenue = await prisma.order.aggregate({
    where: {
      event: { organizerId },
      paymentStatus: 'COMPLETED'
    },
    _sum: {
      organizerAmount: true
    }
  })

  const recentEvents = await prisma.event.findMany({
    where: { organizerId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      _count: { select: { tickets: true } }
    }
  })

  return {
    totalEvents,
    publishedEvents,
    totalTickets,
    soldTickets,
    revenue: revenue._sum.organizerAmount || 0,
    recentEvents
  }
}

export default async function OrganizerDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    redirect('/login')
  }

  const data = await getDashboardData(session.user.organizerId)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Hoş geldiniz! İşte özet bilgileriniz.</p>
        </div>
        <Link href="/organizer/events/new" className="btn-primary inline-flex items-center gap-2">
          <Plus size={20} />
          Yeni Etkinlik
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Toplam Etkinlik"
          value={data.totalEvents.toString()}
          subtitle={`${data.publishedEvents} yayında`}
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
        <StatCard
          title="Satılan Bilet"
          value={data.soldTickets.toString()}
          subtitle={`/ ${data.totalTickets} toplam`}
          icon={<Ticket className="w-6 h-6 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Toplam Gelir"
          value={`${data.revenue.toLocaleString('tr-TR')} ₺`}
          subtitle="Net kazanç"
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          title="Doluluk Oranı"
          value={`${data.totalTickets > 0 ? Math.round((data.soldTickets / data.totalTickets) * 100) : 0}%`}
          subtitle="Ortalama"
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          color="purple"
        />
      </div>

      {/* Recent Events */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Son Etkinlikler</h2>
            <Link href="/organizer/events" className="text-primary-600 hover:text-primary-700 text-sm">
              Tümünü gör →
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentEvents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Henüz etkinlik oluşturmadınız.
              <Link href="/organizer/events/new" className="text-primary-600 hover:text-primary-700 block mt-2">
                İlk etkinliğinizi oluşturun
              </Link>
            </div>
          ) : (
            data.recentEvents.map((event) => (
              <div key={event.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString('tr-TR')} • {event._count.tickets} bilet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    event.isPublished 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {event.isPublished ? 'Yayında' : 'Taslak'}
                  </span>
                  <Link 
                    href={`/organizer/events/${event.id}`}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  color: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    emerald: 'bg-emerald-50',
    purple: 'bg-purple-50',
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${colors[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  )
}
