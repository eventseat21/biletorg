'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import SeatMapCanvas from '@/components/seatmap/SeatMapCanvas'
import { seatFromApi, type ApiSeat } from '@/lib/seatmap/adapter'
import type { CategoryDef, ChartDoc } from '@/lib/seatmap/types'
import { intlLocale, t, tf, type Locale } from '@/lib/i18n'

export type SeatCategory = {
  id: string
  name: string
  price: number
  color: string
  seatType: string | null
  availableQuantity: number
}

export type SeatPick = { categoryId: string; seatIds: string[] }

type SeatsResponse = {
  hallName: string | null
  stage: { width: number; height: number }
  seats: ApiSeat[]
  soldSeatIds: string[]
  categories: SeatCategory[]
}

const MAX_TOTAL = 10

export default function SeatPicker({
  slug,
  categories,
  picks,
  locale,
  onChange,
  onClose,
}: {
  slug: string
  categories: SeatCategory[]
  picks: SeatPick[]
  locale: Locale
  onChange: (next: SeatPick[]) => void
  onClose: () => void
}) {
  const [data, setData] = useState<SeatsResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const euro = (value: number) =>
    new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value)

  useEffect(() => {
    let alive = true
    fetch(`/api/public/events/${encodeURIComponent(slug)}/seats`)
      .then(async (res) => {
        const json = await res.json()
        if (!alive) return
        if (!res.ok) setLoadError(json.error ?? t(locale, 'seatMapFailed'))
        else setData(json as SeatsResponse)
      })
      .catch(() => alive && setLoadError(t(locale, 'seatMapFailed')))
    return () => {
      alive = false
    }
  }, [slug])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const categoryByKey = useMemo(() => {
    const map = new Map<string, SeatCategory>()
    for (const category of categories) map.set(category.seatType ?? category.id, category)
    return map
  }, [categories])

  const chart = useMemo<ChartDoc | null>(() => {
    if (!data) return null
    const sold = new Set(data.soldSeatIds)
    const sellableTypes = new Set(categories.map((category) => category.seatType ?? category.id))
    return {
      stage: data.stage,
      seats: data.seats.map((raw) => {
        const seat = seatFromApi(raw)
        if (sold.has(seat.id)) return { ...seat, status: 'blocked' as const }
        if (!sellableTypes.has(seat.type)) return { ...seat, status: 'unavailable' as const }
        return seat
      }),
      categories: data.categories.map<CategoryDef>((category) => ({
        key: category.seatType ?? category.id,
        label: category.name,
        color: category.color,
        textColor: '#ffffff',
        price: category.price,
      })),
    }
  }, [data, categories])

  const visibleSeats = useMemo(
    () => (chart && activeKey ? chart.seats.filter((seat) => seat.type === activeKey) : chart?.seats ?? []),
    [chart, activeKey],
  )

  const selectedIds = useMemo(() => picks.flatMap((pick) => pick.seatIds), [picks])
  const selectedCount = selectedIds.length

  const seatLabel = (seatId: string) => {
    const seat = chart?.seats.find((item) => item.id === seatId)
    return seat ? `${seat.row}-${seat.number}` : seatId
  }

  const toggleSeat = (seatId: string, type: string) => {
    const category = categoryByKey.get(type)
    if (!category) return
    const current = picks.find((pick) => pick.categoryId === category.id)
    const already = current?.seatIds.includes(seatId) ?? false
    if (!already && selectedCount >= MAX_TOTAL) return

    const seatIds = already
      ? (current?.seatIds.filter((id) => id !== seatId) ?? [])
      : [...(current?.seatIds ?? []), seatId]
    const rest = picks.filter((pick) => pick.categoryId !== category.id)
    onChange(seatIds.length > 0 ? [...rest, { categoryId: category.id, seatIds }] : rest)
  }

  if (loadError) {
    return (
      <p className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">{loadError}</p>
    )
  }
  if (!data || !chart) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" /> {t(locale, 'loadingSeatMap')}
      </p>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={t(locale, 'seatSelection')}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-bold text-gray-900">{data.hallName}</h2>
        <button
          type="button"
          onClick={() => setActiveKey(null)}
          className={`rounded-full border px-3 py-1 text-xs ${!activeKey ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'}`}
        >
          {t(locale, 'wholeHall')}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveKey(category.seatType ?? category.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              activeKey === (category.seatType ?? category.id)
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
            {category.name} · {euro(category.price)}
          </button>
        ))}
        <button
          type="button"
          onClick={onClose}
          aria-label={t(locale, 'closeSeatMap')}
          className="ml-auto rounded-full border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <SeatMapCanvas
          chart={{ ...chart, seats: visibleSeats }}
          selectedIds={selectedIds}
          showLabels
          panOnBackgroundDrag
          stageLabel={t(locale, 'stage')}
          className="h-full w-full"
          onSeatClick={(seat) => {
            if (seat.status === 'blocked' || seat.status === 'unavailable' || seat.status === 'held') return
            toggleSeat(seat.id, seat.type)
          }}
        />
      </div>

      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-2 border-orange-600 bg-white" /> {t(locale, 'legendSelected')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-amber-200" /> {t(locale, 'legendHeld')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gray-300" /> {t(locale, 'legendSold')}
          </span>
          <span className="ml-auto">{t(locale, 'mapHint')}</span>
        </div>

        {picks.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {picks.map((pick) => {
              const category = categories.find((item) => item.id === pick.categoryId)
              return (
                <span key={pick.categoryId} className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="font-medium text-gray-800">{category?.name}</span>
                  {pick.seatIds.map((seatId) => (
                    <button
                      key={seatId}
                      type="button"
                      onClick={() => toggleSeat(seatId, category?.seatType ?? category?.id ?? '')}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100"
                    >
                      {seatLabel(seatId)} <X size={12} />
                    </button>
                  ))}
                </span>
              )
            })}
          </div>
        ) : (
          <p className="mt-2 hidden text-sm text-gray-500 sm:block">
            {t(locale, 'holdHint')}
          </p>
        )}
        {selectedCount >= MAX_TOTAL ? (
          <p className="mt-2 text-xs text-amber-700">{tf(locale, 'maxSeatsPerOrder', { n: MAX_TOTAL })}</p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-md bg-primary-600 px-5 py-3 font-semibold text-white hover:bg-primary-700 sm:ml-auto sm:block sm:w-auto"
        >
          {selectedCount > 0 ? tf(locale, 'selectedDone', { n: selectedCount }) : t(locale, 'closeSeatMap')}
        </button>
      </div>
    </div>
  )
}
