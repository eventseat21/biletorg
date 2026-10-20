'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Loader2, Lock, MapPin } from 'lucide-react'
import type { SeatPick } from './SeatPicker'
import { intlLocale, t, tf, type Locale } from '@/lib/i18n'

export type SellableCategory = {
  id: string
  name: string
  price: number
  availableQuantity: number
  color: string
  seatType: string | null
  hasSeatSelection: boolean
}

const SeatPicker = dynamic(() => import('./SeatPicker'), { ssr: false })

const MAX_PER_CATEGORY = 10

export default function BuyTickets({
  eventId,
  slug,
  categories,
  loggedIn,
  locale,
}: {
  eventId: string
  slug: string
  categories: SellableCategory[]
  loggedIn: boolean
  locale: Locale
}) {
  const euro = (value: number) =>
    new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [picks, setPicks] = useState<SeatPick[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const seatCategories = useMemo(() => categories.filter((category) => category.hasSeatSelection), [categories])
  const plainCategories = useMemo(() => categories.filter((category) => !category.hasSeatSelection), [categories])
  const pickByCategory = useMemo(() => new Map(picks.map((pick) => [pick.categoryId, pick.seatIds])), [picks])
  const selectedSeatCount = useMemo(() => picks.reduce((sum, pick) => sum + pick.seatIds.length, 0), [picks])

  const total = useMemo(
    () =>
      plainCategories.reduce((sum, category) => sum + (quantities[category.id] ?? 0) * category.price, 0) +
      seatCategories.reduce((sum, category) => sum + (pickByCategory.get(category.id)?.length ?? 0) * category.price, 0),
    [plainCategories, seatCategories, quantities, pickByCategory],
  )
  const count = useMemo(
    () =>
      plainCategories.reduce((sum, category) => sum + (quantities[category.id] ?? 0), 0) +
      seatCategories.reduce((sum, category) => sum + (pickByCategory.get(category.id)?.length ?? 0), 0),
    [plainCategories, seatCategories, quantities, pickByCategory],
  )

  const setQuantity = (id: string, next: number, max: number) => {
    const value = Math.max(0, Math.min(Math.min(MAX_PER_CATEGORY, max), next))
    setQuantities((prev) => ({ ...prev, [id]: value }))
  }

  const buy = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/public/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          items: [
            ...Object.entries(quantities)
              .filter(([, quantity]) => quantity > 0)
              .map(([categoryId, quantity]) => ({ categoryId, quantity })),
            ...picks
              .filter((pick) => pick.seatIds.length > 0)
              .map((pick) => ({ categoryId: pick.categoryId, quantity: pick.seatIds.length, seatIds: pick.seatIds })),
          ],
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error ?? t(locale, 'checkoutFailed'))
        return
      }
      window.location.href = data.url
    } catch {
      setError(t(locale, 'connectionFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (!loggedIn) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">{t(locale, 'ticketCategories')}</h2>
        <ul className="mt-1 divide-y divide-gray-100">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 py-3">
              <span className="min-w-0 truncate text-sm font-semibold text-gray-900">{category.name}</span>
              <span className="shrink-0 text-sm font-bold text-gray-900">{euro(category.price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 border-t border-gray-100 pt-3 text-sm text-gray-600">
          <Lock size={16} className="mt-0.5 shrink-0 text-gray-400" />
          {t(locale, 'loginToBuy')}
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/events/${slug}`)}`}
          className="mt-4 block w-full rounded-md bg-primary-600 px-5 py-3 text-center font-semibold text-white hover:bg-primary-700"
        >
          {t(locale, 'signIn')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-md border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">{t(locale, 'ticketCategories')}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{t(locale, 'vatIncluded')}</p>
        </div>

        <ul className="divide-y divide-gray-100 px-4">
          {seatCategories.map((category) => {
            const chosen = pickByCategory.get(category.id)?.length ?? 0
            return (
              <li key={category.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-gray-900">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {t(locale, 'bySeat')} ·{' '}
                    {category.availableQuantity > 0
                      ? tf(locale, 'seatsFree', { n: category.availableQuantity })
                      : t(locale, 'seatsSoldOut')}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900">{euro(category.price)}</p>
                  {chosen > 0 ? <p className="text-xs font-medium text-primary-600">{tf(locale, 'selectedCount', { n: chosen })}</p> : null}
                </div>
              </li>
            )
          })}
          {plainCategories.map((category) => {
            const soldOut = category.availableQuantity <= 0
            const quantity = quantities[category.id] ?? 0
            return (
              <li key={category.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-gray-900">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t(locale, 'standardPrice')} · {soldOut ? t(locale, 'categorySoldOut') : tf(locale, 'ticketsLeft', { n: category.availableQuantity })}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-gray-900">{euro(category.price)}</p>
                </div>
                <div className="mt-2 flex shrink-0 items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(category.id, quantity - 1, category.availableQuantity)}
                    disabled={soldOut || quantity === 0}
                    className="h-8 w-8 rounded-full bg-primary-600 text-lg leading-none text-white disabled:bg-gray-200 disabled:text-gray-400"
                    aria-label={tf(locale, 'decrease', { name: category.name })}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-gray-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(category.id, quantity + 1, category.availableQuantity)}
                    disabled={soldOut || quantity >= Math.min(MAX_PER_CATEGORY, category.availableQuantity)}
                    className="h-8 w-8 rounded-full bg-primary-600 text-lg leading-none text-white disabled:bg-gray-200 disabled:text-gray-400"
                    aria-label={tf(locale, 'increase', { name: category.name })}
                  >
                    +
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {seatCategories.length > 0 ? (
          <div className="border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              <MapPin size={16} /> {selectedSeatCount > 0 ? tf(locale, 'seatsSelected', { n: selectedSeatCount }) : t(locale, 'chooseFromMap')}
            </button>
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-gray-500">{t(locale, 'deliveryNote')}</p>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_14px_rgba(0,0,0,0.08)] md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <button
          type="button"
          onClick={buy}
          disabled={busy || count === 0}
          className="flex w-full items-center justify-between gap-3 rounded-md bg-primary-600 px-5 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <span className="text-sm">{tf(locale, 'ticketCount', { n: count })}</span>
          <span className="inline-flex items-center gap-2">
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {t(locale, 'continueToPayment')}
          </span>
          <span className="text-sm font-bold">{euro(total)}</span>
        </button>
        <p className="mt-1.5 text-center text-[11px] text-gray-500">{t(locale, 'vatServiceNote')}</p>
      </div>

      {pickerOpen ? (
        <SeatPicker
          slug={slug}
          categories={seatCategories}
          picks={picks}
          locale={locale}
          onChange={setPicks}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  )
}
