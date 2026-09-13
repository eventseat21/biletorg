import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import { Calendar, MapPin, Ticket } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PublicEventPage({ params }: { params: { slug: string } }) {
  const event = await prisma.event.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED', isPublished: true },
    include: {
      organizer: { select: { companyName: true, organizationDisplayName: true } },
      hall: { select: { name: true, capacity: true } },
      ticketCategories: { orderBy: { price: 'asc' } },
    },
  })
  if (!event) notFound()

  return (
    <div className="min-h-screen bg-gray-50"><Header /><main className="container mx-auto max-w-5xl px-4 pb-12 pt-32">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex min-h-64 items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-200 p-8">{event.image ? <img src={event.image} alt={event.title} className="max-h-72 w-full object-cover" /> : <Ticket className="h-24 w-24 text-indigo-400" />}</div>
        <div className="p-6 md:p-10">
          <p className="text-sm font-medium text-indigo-600">{event.organizer.organizationDisplayName || event.organizer.companyName}</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">{event.title}</h1>
          <div className="mt-5 grid gap-3 text-sm text-gray-600 md:grid-cols-2"><span className="flex items-center gap-2"><Calendar size={17} />{new Date(event.startDate).toLocaleString('tr-TR')}</span><span className="flex items-center gap-2"><MapPin size={17} />{event.hall?.name || 'Salon bilgisi yakında'}</span></div>
          {event.description ? <p className="mt-6 whitespace-pre-line leading-relaxed text-gray-700">{event.description}</p> : null}
          <p className="mt-5 text-lg font-semibold text-indigo-700">€{(event.ticketCategories[0]?.price ?? 0).toFixed(2)}’dan başlayan fiyatlarla</p>
          <section className="mt-8 rounded-xl border border-gray-200 p-5"><h2 className="text-lg font-semibold text-gray-900">Bilet kategorileri</h2><div className="mt-3 divide-y divide-gray-100">{event.ticketCategories.map((category) => <div key={category.id} className="flex items-center justify-between py-3"><span className="font-medium text-gray-800">{category.name}</span><span className="font-semibold text-indigo-600">€{category.price.toFixed(2)}</span></div>)}</div></section>
          <div className="mt-8 flex flex-wrap items-center gap-4">{event.salesEventId ? <a href={`https://kurdevents.com/de/etkinlik/${event.salesEventId}/`} className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">Salon ve koltuk seç</a> : <span className="text-sm text-gray-500">Satış bağlantısı hazırlanıyor.</span>}<span className="text-xs text-gray-500">Satış ve ödeme kurdevents.com üzerinden tamamlanır.</span></div>
        </div>
      </div>
    </main></div>
  )
}
