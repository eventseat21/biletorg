import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar } from 'lucide-react'

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
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {event.isPublished ? 'Yayında' : 'Taslak'}
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
        <p className="text-sm text-gray-500 mt-6">
          Yayına alma ve detaylı düzenleme yakında bu sayfada genişletilebilir.
        </p>
      </div>
    </div>
  )
}
