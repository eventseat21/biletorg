import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'
import EventActions from './EventActions'
import EventEditPanel from './EventEditPanel'

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
        <EventActions eventId={event.id} status={event.status} hallId={event.hallId} />
        <EventEditPanel event={{ id: event.id, title: event.title, titleDe: event.titleDe, titleEn: event.titleEn, titleKu: event.titleKu, titleCkb: event.titleCkb, description: event.description, descriptionDe: event.descriptionDe, descriptionEn: event.descriptionEn, descriptionKu: event.descriptionKu, descriptionCkb: event.descriptionCkb, startDate: event.startDate.toISOString(), image: event.image, category: event.category, hallId: event.hallId }} categories={event.ticketCategories.map((category) => ({ id: category.id, name: category.name, description: category.description, price: category.price, totalQuantity: category.totalQuantity, availableQuantity: category.availableQuantity }))} />
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-950">Ödeme anlaşması</h2>
          <p className="mt-1 text-xs leading-relaxed text-blue-800">
            Bu ayar Kurdevents tarafından belirlenir. Organizatör komisyon oranını veya yöntemini değiştiremez.
          </p>
          <div className="mt-3 grid gap-2 text-sm text-blue-950 sm:grid-cols-2">
            <div>
              <span className="text-xs text-blue-700">Yöntem</span>
              <p className="font-medium">
                {commissionType === 'FIXED_ADD'
                  ? 'Bilet fiyatına sabit ücret eklenir'
                  : 'Organizatör payından yüzde kesilir'}
              </p>
            </div>
            <div>
              <span className="text-xs text-blue-700">Anlaşma değeri</span>
              <p className="font-medium">
                {commissionType === 'FIXED_ADD'
                  ? `€${commissionValue.toFixed(2)} / bilet`
                  : `%${commissionValue.toLocaleString('tr-TR')}`}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Bilet kategorileri</h2>
          <ul className="space-y-1">
            {event.ticketCategories.map((c) => (
              <li key={c.id} className="text-sm text-gray-700">
                {c.name} — {c.price.toLocaleString('tr-TR')} ₺ (stok: {c.availableQuantity}/
                {c.totalQuantity})
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
