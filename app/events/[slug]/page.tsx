import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import Image from 'next/image'
import { Ticket } from 'lucide-react'
import BuyTickets from './BuyTickets'
import EventDescription from './EventDescription'
import ShareButton from './ShareButton'
import LanguageSwitch from '@/components/LanguageSwitch'
import { intlLocale, t, tf, type Locale } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n-server'

// Event details are public and can be served from the Next.js cache for a short period.
export const revalidate = 300

function dayLabel(date: Date, locale: Locale): string {
  return date.toLocaleDateString(intlLocale(locale), { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' })
}

function timeLabel(date: Date, locale: Locale): string {
  return date.toLocaleTimeString(intlLocale(locale), { hour: '2-digit', minute: '2-digit' })
}

function priceLine(prices: number[], locale: Locale): string {
  if (prices.length === 0) return '—'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const euro = (value: number) =>
    new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value)
  return min === max ? euro(min) : `${euro(min)} – ${euro(max)}`
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-gray-100 py-2.5 last:border-0">
      <dt className="w-36 shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm font-medium text-gray-900">{children}</dd>
    </div>
  )
}

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { durum?: string }
}) {
  const event = await prisma.event.findFirst({
    where: { slug: params.slug, status: 'PUBLISHED', isPublished: true },
    include: {
      organizer: { select: { id: true, companyName: true, organizationDisplayName: true } },
      hall: { select: { name: true, address: true, capacity: true } },
      ticketCategories: { orderBy: { price: 'asc' } },
    },
  })
  if (!event) notFound()

  const session = await getServerSession(authOptions)
  const locale = getLocale()
  const sellable = event.ticketCategories.map((category) => ({
    id: category.id,
    name: category.name,
    price: category.price,
    availableQuantity: category.availableQuantity,
    color: category.color,
    seatType: category.seatType,
    hasSeatSelection: category.hasSeatSelection,
  }))
  const hasLocalSeatPicker = event.hallId !== null && sellable.some((category) => category.hasSeatSelection)
  const organizerName = event.organizer.organizationDisplayName || event.organizer.companyName
  const mapsHref = event.hall?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.hall.name} ${event.hall.address}`)}`
    : null

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-24 md:pb-16 md:pt-28">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_340px] md:gap-8">
          <div className="min-w-0">
            <div className={`relative w-full max-w-md overflow-hidden rounded-md bg-gray-100 ${event.image ? 'aspect-[4/5]' : 'h-40'}`}>
              {event.image ? (
                <>
                  <Image src={event.image} alt="" aria-hidden fill sizes="(max-width: 768px) 100vw, 448px" className="scale-110 object-cover opacity-40 blur-xl" />
                  <Image src={event.image} alt={event.title} fill sizes="(max-width: 768px) 100vw, 448px" className="object-contain" />
                </>
              ) : (
                <span className="flex h-full items-center justify-center">
                  <Ticket className="h-12 w-12 text-gray-300" />
                </span>
              )}
            </div>

            <div className="mt-6 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-[28px]">{event.title}</h1>
              <ShareButton title={event.title} locale={locale} />
            </div>
            <div className="mt-3">
              <LanguageSwitch next={`/events/${event.slug}`} />
            </div>
            {event.category ? (
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-gray-700">{event.category}</p>
            ) : null}
            <Link href={`/a/${event.organizer.id}`} className="mt-1 inline-block text-sm text-primary-600 hover:underline">
              {organizerName}
            </Link>

            <dl className="mt-6 max-w-md">
              <MetaRow label={t(locale, 'venue')}>
                {event.hall?.name || t(locale, 'venueSoon')}
                {event.hall?.address ? (
                  <span className="mt-0.5 block text-xs font-normal text-gray-500">{event.hall.address}</span>
                ) : null}
                {mapsHref ? (
                  <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-medium text-primary-600 hover:underline">
                    {t(locale, 'showOnMap')}
                  </a>
                ) : null}
              </MetaRow>
              <MetaRow label={t(locale, 'date')}>{dayLabel(new Date(event.startDate), locale)}</MetaRow>
              <MetaRow label={t(locale, 'time')}>
                {timeLabel(new Date(event.startDate), locale)}
                {event.endDate ? ` – ${timeLabel(new Date(event.endDate), locale)}` : ''}
              </MetaRow>
              {event.doorsOpen ? <MetaRow label={t(locale, 'doors')}>{timeLabel(new Date(event.doorsOpen), locale)}</MetaRow> : null}
              {sellable.length > 0 ? <MetaRow label={t(locale, 'price')}>{priceLine(sellable.map((category) => category.price), locale)}</MetaRow> : null}
            </dl>

            {event.description ? <EventDescription text={event.description} locale={locale} /> : null}
          </div>

          <aside className="min-w-0 md:pt-2">
            {searchParams.durum === 'iptal' ? (
              <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {t(locale, 'paymentCancelled')}
              </p>
            ) : null}

            {sellable.length > 0 ? (
              <BuyTickets eventId={event.id} slug={event.slug} categories={sellable} loggedIn={Boolean(session?.user?.id)} locale={locale} />
            ) : (
              <p className="rounded-md border border-gray-200 p-4 text-sm text-gray-500">{t(locale, 'noSalesYet')}</p>
            )}

            {event.salesEventId && !hasLocalSeatPicker ? (
              <div className="mt-4">
                <a
                  href={`https://kurdevents.com/de/etkinlik/${event.salesEventId}/`}
                  className="block rounded-md border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  {t(locale, 'chooseSeatsOnCom')}
                </a>
                <p className="mt-2 text-xs text-gray-500">{t(locale, 'chooseSeatsOnComHint')}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  )
}
