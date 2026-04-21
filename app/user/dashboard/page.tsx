'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Ticket, 
  Calendar, 
  Heart, 
  User, 
  Settings,
  Bell,
  ChevronRight,
  Clock,
  MapPin
} from 'lucide-react'

export default function UserDashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/login?callbackUrl=/user/dashboard')
  }

  const user = session.user

  // Mock data - gerçek veriler API'den gelecek
  const myTickets = [
    {
      id: 1,
      eventTitle: 'Tarkan Konseri',
      date: '2026-05-15',
      time: '20:00',
      location: 'İstanbul Arena',
      seat: 'A12',
      category: 'VIP',
      status: 'Aktif'
    },
    {
      id: 2,
      eventTitle: 'Caz Festivali',
      date: '2026-06-20',
      time: '19:30',
      location: 'Küçükçiftlik Park',
      seat: 'B45',
      category: 'Normal',
      status: 'Aktif'
    }
  ]

  const upcomingEvents = [
    {
      id: 1,
      title: 'Yaz Festivali 2026',
      date: '2026-07-01',
      location: 'İstanbul',
      image: '/concert-hero.jpg'
    },
    {
      id: 2,
      title: 'Rock Konseri',
      date: '2026-08-15',
      location: 'Ankara',
      image: '/concert-benefits.jpg'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BiletOrg</span>
            </Link>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Hoş Geldiniz, {user?.name?.split(' ')[0] || 'Kullanıcı'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Biletlerinizi yönetin ve yeni etkinlikleri keşfedin.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktif Biletlerim</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Favori Etkinlikler</p>
                <p className="text-2xl font-bold text-gray-900">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bu Ay</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Tickets */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Biletlerim</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {myTickets.map((ticket) => (
                  <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{ticket.eventTitle}</h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(ticket.date).toLocaleDateString('tr-TR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {ticket.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {ticket.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {ticket.category}
                          </span>
                          <span className="text-gray-500">• Koltuk {ticket.seat}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {ticket.status}
                        </span>
                        <Link 
                          href={`/user/tickets/${ticket.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <Link 
                  href="/user/tickets"
                  className="flex items-center justify-center gap-2 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                >
                  Tüm Biletlerimi Gör
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Yaklaşan Etkinlikler</h3>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link 
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                      <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link 
                href="/events"
                className="flex items-center justify-center gap-2 mt-4 text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                Tüm Etkinlikler
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
              <div className="space-y-2">
                <Link 
                  href="/user/profile"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Profilim</span>
                </Link>
                <Link 
                  href="/user/settings"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Ayarlar</span>
                </Link>
                <Link 
                  href="/support"
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Destek Al</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
