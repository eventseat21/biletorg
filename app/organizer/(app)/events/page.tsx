import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Calendar, ChevronRight, ExternalLink } from 'lucide-react'
import { OrganizerPageCard } from './organizer-page-card'

export default async function OrganizerEventsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    redirect('/login')
  }

  const organizerId = session.user.organizerId
  const [events, organizer] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId },
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { tickets: true } } },
    }),
    prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { companyName: true, organizationDisplayName: true, status: true },
    }),
  ])

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

      {organizer?.status === 'APPROVED' ? (
        <OrganizerPageCard
          organizerId={organizerId}
          organizerName={organizer.organizationDisplayName || organizer.companyName}
        />
      ) : null}

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
            <div
              key={ev.id}
              className="flex items-center justify-between gap-4 p-6 transition-colors hover:bg-gray-50"
            >
              <Link href={`/organizer/events/${ev.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">{ev.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(ev.startDate).toLocaleString('tr-TR')} · {ev._count.tickets} bilet
                  </p>
                  <span
                    className={`mt-2 inline-block rounded px-2 py-0.5 text-xs ${
                      ev.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ev.isPublished ? 'Yayında' : 'Taslak'}
                  </span>
                </div>
              </Link>
              <div className="flex shrink-0 items-center gap-3">
                {ev.isPublished ? (
                  <a
                    href={`/events/${ev.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <ExternalLink size={15} />
                    <span className="hidden sm:inline">Bilet sayfası</span>
                  </a>
                ) : null}
                <Link href={`/organizer/events/${ev.id}`} aria-label={`${ev.title} düzenle`}>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
