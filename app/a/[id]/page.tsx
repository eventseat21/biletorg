import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { SiteFooter } from '@/components/site-footer'
import { Calendar, Globe, MapPin, Ticket } from 'lucide-react'

// Organizatör sayfaları herkese açık; kısa süre önbellekte tutulur.
export const revalidate = 120

const eventInclude = {
  hall: { select: { name: true } },
  ticketCategories: {
    select: { price: true },
    orderBy: { price: 'asc' as const },
    take: 1,
  },
}

type ListEvent = {
  id: string
  slug: string
  title: string
  image: string | null
  startDate: Date
  hall: { name: string } | null
  ticketCategories: { price: number }[]
}

async function getOrganizerPage(id: string) {
  const [organizer, events] = await Promise.all([
    prisma.organizer.findFirst({
      where: { id, status: 'APPROVED' },
      select: {
        id: true,
        companyName: true,
        organizationDisplayName: true,
        description: true,
        website: true,
        logo: true,
        city: true,
        country: true,
      },
    }),
    prisma.event.findMany({
      where: { organizerId: id, isPublished: true, status: 'PUBLISHED' },
      orderBy: { startDate: 'asc' },
      include: eventInclude,
    }),
  ])
  return { organizer, events }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { organizer, events } = await getOrganizerPage(params.id)
  if (!organizer) return { title: 'Organizatör bulunamadı' }
  const name = organizer.organizationDisplayName || organizer.companyName
  return {
    title: `${name} - Etkinlikler`,
    description: organizer.description ?? `${name} yaklaşan etkinlikleri`,
  }
}

function dayLabel(date: Date) {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'short' })
}

function hourLabel(date: Date) {
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function EventCard({ event }: { event: ListEvent }) {
  const from = event.ticketCategories[0]?.price
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-md border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-gray-100">
        {event.image ? (
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <Ticket className="h-14 w-14 text-gray-300" />
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[17px] font-bold leading-snug text-gray-900 group-hover:text-primary-700">{event.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin size={14} className="shrink-0 text-gray-400" />
          <span className="truncate">{event.hall?.name ?? 'Salon bilgisi yakında'}</span>
        </p>
        <p className="mt-3 flex items-center gap-3 text-sm text-gray-800">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-gray-400" />
            {dayLabel(event.startDate)}
          </span>
          <span className="font-medium">{hourLabel(event.startDate)}</span>
        </p>
        <p className="mt-3 text-sm font-bold text-primary-700">
          {from === undefined ? 'Biletler yakında' : `€${from.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}'den başlayan`}
        </p>
      </div>
    </Link>
  )
}

export default async function PublicOrganizerPage({ params }: { params: { id: string } }) {
  const { organizer, events } = await getOrganizerPage(params.id)
  if (!organizer) notFound()

  const name = organizer.organizationDisplayName || organizer.companyName
  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.startDate) >= now)
  const past = events.filter((e) => new Date(e.startDate) < now).reverse()

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 md:pt-28">
        <section className="border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200">
              {organizer.logo ? (
                <img src={organizer.logo} alt={name} className="h-full w-full object-cover" />
              ) : (
                <Ticket className="h-7 w-7 text-gray-400" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {organizer.city ? (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {[organizer.city, organizer.country].filter(Boolean).join(', ')}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {upcoming.length > 0 ? `${upcoming.length} yaklaşan etkinlik` : 'Yaklaşan etkinlik yok'}
                </span>
              </div>
            </div>
          </div>
          {organizer.description ? (
            <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-gray-700">{organizer.description}</p>
          ) : null}
          {organizer.website ? (
            <a
              href={organizer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
            >
              <Globe size={14} />
              {organizer.website.replace(/^https?:\/\//, '')}
            </a>
          ) : null}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900">Yaklaşan etkinlikler</h2>
          {upcoming.length === 0 ? (
            <div className="mt-4 rounded-md border border-gray-200 p-12 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <h3 className="font-medium text-gray-900">Henüz yayınlanmış etkinlik yok</h3>
              <p className="mt-1 text-sm text-gray-500">{name} yeni etkinliklerini burada paylaşacak.</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {past.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-gray-900">Geçmiş etkinlikler</h2>
            <div className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
              {past.slice(0, 20).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{event.title}</h3>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {dayLabel(event.startDate)}
                      {event.hall?.name ? ` · ${event.hall.name}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Geçti</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}
