'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ticket, Calendar, Heart, Bell, ChevronRight, Clock, MapPin, User, Settings } from 'lucide-react'

export default function UserDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login?callbackUrl=/user/dashboard')
        } else {
          setUser(data.user)
        }
      })
      .catch(() => router.push('/login?callbackUrl=/user/dashboard'))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const myTickets = [
    { id: 1, eventTitle: 'Tarkan Konseri', date: '2026-05-15', time: '20:00', location: 'İstanbul Arena', seat: 'A12', category: 'VIP', status: 'Aktif' },
    { id: 2, eventTitle: 'Caz Festivali', date: '2026-06-20', time: '19:30', location: 'Küçükçiftlik Park', seat: 'B45', category: 'Normal', status: 'Aktif' }
  ]

  const upcomingEvents = [
    { id: 1, title: 'Yaz Festivali 2026', date: '2026-07-01', location: 'İstanbul', image: '/concert-hero.jpg' },
    { id: 2, title: 'Rock Konseri', date: '2026-08-15', location: 'Ankara', image: '/concert-benefits.jpg' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Hoş Geldiniz, {user?.name?.split(' ')[0] || 'Kullanıcı'}!
          </h1>
          <p className="text-gray-600 mt-1">
            Biletlerinizi yönetin ve yeni etkinlikleri keşfedin.
          </p>
        </div>

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
                        <Link href={`/user/tickets/${ticket.id}`} className="p-2 text-gray-400 hover:text-indigo-600">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
              <div className="space-y-2">
                <Link href="/user/profile" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">Profilim</span>
                </Link>
                <Link href="/support" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
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