'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, Check, ShoppingCart, Users } from 'lucide-react'
import type { CategoryDef, ChartDoc, SeatItem, ZoneDef } from '@/lib/seatmap/types'
import SeatMapCanvas from './SeatMapCanvas'

export interface SeatMapSelectorProps {
  chart: ChartDoc
  zones: ZoneDef[]
  title?: string
  dateLabel?: string
}

export default function SeatMapSelector({
  chart,
  zones,
  title = 'Konser Arena',
  dateLabel = 'Salon planı önizleme',
}: SeatMapSelectorProps) {
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const visibleSeats = useMemo(() => {
    if (activeZoneId) return chart.seats.filter((seat) => seat.zone === activeZoneId)
    if (activeCategoryKey) return chart.seats.filter((seat) => seat.type === activeCategoryKey)
    return chart.seats
  }, [activeZoneId, activeCategoryKey, chart.seats])

  const selectedSeats = useMemo(
    () => chart.seats.filter((seat) => selectedIds.includes(seat.id)),
    [chart.seats, selectedIds]
  )

  const total = selectedSeats.reduce((sum, seat) => sum + priceForSeat(seat, chart.categories), 0)
  const activeZone = zones.find((zone) => zone.id === activeZoneId)

  const toggleSeat = (seat: SeatItem) => {
    if (seat.status === 'blocked' || seat.status === 'unavailable' || seat.status === 'held') return
    setSelectedIds((current) =>
      current.includes(seat.id)
        ? current.filter((id) => id !== seat.id)
        : [...current, seat.id]
    )
  }

  const selectZone = (zoneId: string) => {
    setActiveZoneId(zoneId)
    setActiveCategoryKey(null)
    setSelectedIds([])
  }

  const selectCategory = (categoryKey: string) => {
    setActiveCategoryKey(categoryKey)
    setActiveZoneId(null)
    setSelectedIds([])
  }

  return (
    <div className="flex h-full min-h-[640px] flex-col bg-slate-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">Biletorg</p>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-xs text-slate-500">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600">
          <Users className="h-4 w-4" />
          {chart.seats.length} koltuk
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-200 bg-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Bölüm seç</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Önce salondaki bir bölümü seçin, ardından uygun koltukları işaretleyin.
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-2 lg:overflow-visible">
            <button
              type="button"
              onClick={() => {
                setActiveZoneId(null)
                setActiveCategoryKey(null)
                setSelectedIds([])
              }}
              className={`flex min-w-36 items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition lg:w-full ${
                activeZoneId === null && activeCategoryKey === null
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Tüm salon</span>
              <span className="text-[10px] text-slate-500">{chart.seats.length}</span>
            </button>
            {zones.map((zone) => {
              const count = chart.seats.filter((seat) => seat.zone === zone.id).length
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => selectZone(zone.id)}
                  className={`flex min-w-44 items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition lg:w-full ${
                    activeZoneId === zone.id
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: zone.color }} />
                  <span className="min-w-0 flex-1 truncate">{zone.name}</span>
                  <span className="text-[10px] text-slate-500">{count}</span>
                </button>
              )
            })}
          </div>
          <div className="border-t border-slate-200 p-3">
            <h3 className="mb-2 text-xs font-semibold text-slate-800">Kategoriler</h3>
            <div className="space-y-2">
              {chart.categories.map((category) => {
                const count = chart.seats.filter((seat) => seat.type === category.key).length
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => selectCategory(category.key)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                      activeCategoryKey === category.key
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="min-w-0 flex-1 truncate">{category.label}</span>
                    <span className="text-[10px] text-slate-500">
                      {category.price != null ? `€${category.price}` : ''} · {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="hidden border-t border-slate-200 p-4 lg:block">
            <div className="space-y-2 text-[11px] text-slate-500">
              <Legend color="#22c55e" label="Seçilebilir" />
              <Legend color="#f97316" label="Seçiminiz" />
              <Legend color="#d1d5db" label="Dolu / kullanılamaz" />
            </div>
          </div>
        </aside>

        <main className="relative min-h-[480px] min-w-0 flex-1">
          <div className="absolute left-4 top-4 z-10 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
            {activeZone ? (
              <button
                type="button"
                onClick={() => {
                  setActiveZoneId(null)
                  setSelectedIds([])
                }}
                className="flex items-center gap-1.5 font-medium text-indigo-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {activeZone.name}
              </button>
            ) : activeCategoryKey ? (
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryKey(null)
                  setSelectedIds([])
                }}
                className="flex items-center gap-1.5 font-medium text-indigo-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {categoryLabelByKey(activeCategoryKey, chart.categories)}
              </button>
            ) : (
              <span className="font-medium text-slate-700">Tüm salon görünümü</span>
            )}
          </div>
          <SeatMapCanvas
            chart={{ ...chart, seats: visibleSeats }}
            selectedIds={selectedIds}
            showLabels
            stageLabel="SAHNE"
            className="h-full min-h-[480px] w-full"
            onSeatClick={toggleSeat}
          />
        </main>

        <aside className="w-full shrink-0 border-t border-slate-200 bg-white lg:w-80 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 border-b border-slate-200 p-4">
            <ShoppingCart className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Sepet özeti</h2>
            <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {selectedSeats.length}
            </span>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto p-4 lg:max-h-[calc(100%-130px)]">
            {selectedSeats.length === 0 ? (
              <p className="py-8 text-center text-xs leading-relaxed text-slate-500">
                Devam etmek için haritadan koltuk seçin.
              </p>
            ) : (
              selectedSeats.map((seat) => (
                <div key={seat.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">{seat.row}{seat.number}</p>
                    <p className="text-[10px] text-slate-500">{categoryLabel(seat, chart.categories)}</p>
                  </div>
                  <span className="font-medium text-slate-700">€{priceForSeat(seat, chart.categories).toLocaleString('tr-TR')}</span>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-slate-500">Toplam</span>
              <strong className="text-lg text-slate-900">€{total.toLocaleString('tr-TR')}</strong>
            </div>
            <button
              type="button"
              disabled={selectedSeats.length === 0}
              onClick={() => window.alert('Demo: Koltuklar sepete eklendi.')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check className="h-4 w-4" /> Sepete ekle
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  )
}

function categoryLabelByKey(key: string, categories: CategoryDef[]): string {
  return categories.find((category) => category.key === key)?.label ?? key
}

function categoryLabel(seat: SeatItem, categories: CategoryDef[]): string {
  return categories.find((category) => category.key === seat.type)?.label ?? seat.type
}

function priceForSeat(seat: SeatItem, categories: CategoryDef[]): number {
  return categories.find((category) => category.key === seat.type)?.price ?? 0
}
