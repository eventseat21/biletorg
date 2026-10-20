import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import EventActions from './EventActions'
import EventEditPanel from './EventEditPanel'
import ComPublishRequest from './ComPublishRequest'

export default async function OrganizerEventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    redirect('/login')
  }

  const event = await prisma.event.findFirst({
    where: {
      id: params.id,
      organizerId: session.user.organizerId,
    },
    include: {
      ticketCategories: true,
      hall: { select: { name: true } },
    },
  })

  if (!event) {
    notFound()
  }

  const commissionType = String((event as typeof event & { commissionType?: string }).commissionType ?? 'PERCENT_DEDUCT')
  const commissionValue = Number((event as typeof event & { commissionValue?: number }).commissionValue ?? 0)

  const [halls, organizer] = await Promise.all([
    prisma.hall.findMany({
      where: { organizerId: session.user.organizerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, _count: { select: { seats: true } } },
    }),
    prisma.organizer.findUnique({
      where: { id: session.user.organizerId },
      select: { commissionType: true, commissionValue: true },
    }),
  ])

  const publicBase = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://kurdevents.com').replace(/\/$/, '')
  const comUrl = event.salesEventId ? `${publicBase}/de/etkinlik/${event.salesEventId}/` : null

  // Kilitli değilse organizatör anlaşması etkinlik onayında esas alınır.
  const effectiveType = event.commissionLocked ? commissionType : organizer?.commissionType ?? commissionType
  const effectiveValue = event.commissionLocked ? commissionValue : organizer?.commissionValue ?? null

  return (
    <div className="max-w-2xl">
      <Link
        href="/organizer/events"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Etkinlik listesi
      </Link>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <span
            className={`shrink-0 text-sm px-2 py-1 rounded ${
              event.isPublished
                ? 'bg-green-100 text-green-800'
                : event.status === 'PENDING_APPROVAL'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {event.isPublished
              ? 'Yayında'
              : event.status === 'PENDING_APPROVAL'
                ? 'Onay bekliyor'
                : 'Taslak'}
          </span>
        </div>
        {event.description && <p className="text-gray-600 mb-4">{event.description}</p>}
        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date(event.startDate).toLocaleString('tr-TR')}
          </p>
          {event.hall && <p>Salon: {event.hall.name}</p>}
          <p className="font-mono text-xs text-gray-500">/{event.slug}</p>
        </div>
        <EventActions
          eventId={event.id}
          status={event.status}
          hallId={event.hallId}
          halls={halls.map((hall) => ({ id: hall.id, name: hall.name, seats: hall._count.seats }))}
        />
        <EventEditPanel event={{ id: event.id, title: event.title, titleDe: event.titleDe, titleEn: event.titleEn, titleKu: event.titleKu, titleCkb: event.titleCkb, description: event.description, descriptionDe: event.descriptionDe, descriptionEn: event.descriptionEn, descriptionKu: event.descriptionKu, descriptionCkb: event.descriptionCkb, startDate: event.startDate.toISOString(), image: event.image, category: event.category, hallId: event.hallId }} categories={event.ticketCategories.map((category) => ({ id: category.id, name: category.name, description: category.description, price: category.price, totalQuantity: category.totalQuantity, availableQuantity: category.availableQuantity, color: category.color, seatType: category.seatType, salesStart: category.salesStart?.toISOString() ?? null, salesEnd: category.salesEnd?.toISOString() ?? null }))} />
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-950">Ödeme anlaşması</h2>
          <p className="mt-1 text-xs leading-relaxed text-blue-800">
            Bu ayarı Kurdevents belirler; organizatör komisyon oranını veya yöntemini değiştiremez.
            {event.commissionLocked
              ? ' Bu etkinlik için anlaşma kilitlendi.'
              : ' Etkinlik onayında organizatör anlaşmanız esas alınır.'}
          </p>
          <div className="mt-3 grid gap-2 text-sm text-blue-950 sm:grid-cols-2">
            <div>
              <span className="text-xs text-blue-700">Yöntem</span>
              <p className="font-medium">
                {effectiveType === 'FIXED_ADD'
                  ? 'Bilet fiyatına sabit ücret eklenir'
                  : 'Organizatör payından yüzde kesilir'}
              </p>
            </div>
            <div>
              <span className="text-xs text-blue-700">Anlaşma değeri</span>
              <p className="font-medium">
                {effectiveValue === null
                  ? 'Etkinlik onayında belirlenecek'
                  : effectiveType === 'FIXED_ADD'
                    ? `€${effectiveValue.toFixed(2)} / bilet`
                    : `%${effectiveValue.toLocaleString('tr-TR')}`}
              </p>
            </div>
          </div>
        </div>
        <ComPublishRequest
          eventId={event.id}
          requested={event.publishComRequested}
          publishedToCom={Boolean(event.salesEventId)}
          comUrl={comUrl}
        />
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Bilet kategorileri</h2>
          <ul className="space-y-1">
            {event.ticketCategories.map((c) => (
              <li key={c.id} className="text-sm text-gray-700">
                {c.name} — €{c.price.toFixed(2)} (stok: {c.availableQuantity}/
                {c.totalQuantity})
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
