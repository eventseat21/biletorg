import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, ChevronRight } from 'lucide-react'

export default async function OrganizerEventsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    redirect('/login')
  }

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.organizerId },
    orderBy: { startDate: 'desc' },
    include: { _count: { select: { tickets: true } } },
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Etkinlikler</h1>
          <p className="text-gray-600 mt-1">Tüm etkinliklerinizi yönetin</p>
        </div>
        <Link
          href="/organizer/events/new"
          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          Yeni Etkinlik
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Henüz etkinlik yok.</p>
          <Link href="/organizer/events/new" className="text-primary-600 font-medium mt-2 inline-block">
            İlk etkinliği oluştur
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`/organizer/events/${ev.id}`}
              className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div>
                <h2 className="font-semibold text-gray-900">{ev.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(ev.startDate).toLocaleString('tr-TR')} · {ev._count.tickets} bilet
                </p>
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                    ev.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {ev.isPublished ? 'Yayında' : 'Taslak'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
