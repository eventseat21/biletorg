import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, MapPin, Ticket } from 'lucide-react'

async function getPublishedEvents() {
  return prisma.event.findMany({
    where: { 
      isPublished: true,
      status: 'PUBLISHED',
      startDate: { gte: new Date() }
    },
    orderBy: { startDate: 'asc' },
    include: {
      organizer: { select: { companyName: true } },
      hall: { select: { name: true } },
      ticketCategories: {
        select: { price: true },
        orderBy: { price: 'asc' },
        take: 1
      }
    }
  })
}

export default async function EventsPage() {
  const events = await getPublishedEvents()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            BiletOrg
          </Link>
          <nav className="flex items-center gap-8">
            <Link href="/events" className="text-primary-600 font-medium">
              Etkinlikler
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Giriş Yap
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Üye Ol
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Yaklaşan Etkinlikler</h1>

        {events.length === 0 ? (
          <div className="card p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz etkinlik yok</h3>
            <p className="text-gray-500">Yakında yeni etkinlikler eklenecek</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link 
                key={event.id} 
                href={`/events/${event.slug}`}
                className="card hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <Calendar className="w-16 h-16 text-primary-400" />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar size={14} />
                    {new Date(event.startDate).toLocaleDateString('tr-TR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {event.hall?.name || event.organizer.companyName}
                      </span>
                    </div>
                    <div className="text-primary-600 font-semibold">
                      {event.ticketCategories[0] ? (
                        `Başlangıç: ${event.ticketCategories[0].price.toLocaleString('tr-TR')} ₺`
                      ) : (
                        'Biletler yakında'
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
