'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { generateRows } from '@/lib/seatmap/geometry'
import type { CategoryDef, ChartDoc, SeatItem, ZoneDef } from '@/lib/seatmap/types'
import SeatMapSelector from '@/components/seatmap/SeatMapSelector'

const CATEGORIES: CategoryDef[] = [
  { key: 'NORMAL', label: 'Standart', color: '#64748b', textColor: '#fff', price: 450 },
  { key: 'PREMIUM', label: 'Premium', color: '#3b82f6', textColor: '#fff', price: 750 },
  { key: 'VIP', label: 'VIP', color: '#f59e0b', textColor: '#1f2937', price: 1200 },
]

const ZONES: ZoneDef[] = [
  { id: 'north', name: 'Kuzey Tribün', color: '#6366f1' },
  { id: 'east', name: 'Doğu Tribün', color: '#0ea5e9' },
  { id: 'south', name: 'Güney Tribün', color: '#10b981' },
  { id: 'west', name: 'Batı Tribün', color: '#f59e0b' },
  { id: 'floor', name: 'Saha Alanı', color: '#ef4444' },
]

export default function SeatSelectionDemoPage() {
  const chart = useMemo<ChartDoc>(() => {
    const seats: SeatItem[] = []
    const north = generateRows({
      rows: 4,
      seatsPerRow: 18,
      gapX: 8,
      gapY: 12,
      seatWidth: 26,
      seatHeight: 26,
      shape: 'circle',
      type: 'NORMAL',
      originX: 430,
      originY: 80,
      startRowIndex: 0,
      curve: 24,
    })
    const floor = generateRows({
      rows: 5,
      seatsPerRow: 16,
      gapX: 10,
      gapY: 14,
      seatWidth: 28,
      seatHeight: 28,
      shape: 'rect',
      type: 'PREMIUM',
      originX: 470,
      originY: 290,
      startRowIndex: 4,
    })
    const south = generateRows({
      rows: 4,
      seatsPerRow: 18,
      gapX: 8,
      gapY: 12,
      seatWidth: 26,
      seatHeight: 26,
      shape: 'circle',
      type: 'NORMAL',
      originX: 430,
      originY: 570,
      startRowIndex: 9,
      curve: -24,
    })
    const west = generateRows({
      rows: 6,
      seatsPerRow: 6,
      gapX: 10,
      gapY: 12,
      seatWidth: 26,
      seatHeight: 26,
      shape: 'circle',
      type: 'VIP',
      originX: 180,
      originY: 205,
      startRowIndex: 13,
    })
    const east = generateRows({
      rows: 6,
      seatsPerRow: 6,
      gapX: 10,
      gapY: 12,
      seatWidth: 26,
      seatHeight: 26,
      shape: 'circle',
      type: 'VIP',
      originX: 1040,
      originY: 205,
      startRowIndex: 19,
    })

    addZoneSeats(seats, north, 'north')
    addZoneSeats(seats, east, 'east')
    addZoneSeats(seats, south, 'south')
    addZoneSeats(seats, west, 'west')
    addZoneSeats(seats, floor, 'floor')
    return { stage: { width: 1400, height: 850 }, seats, categories: CATEGORIES }
  }, [])

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
        <Link href="/saalplan/demo" className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Editöre dön
        </Link>
        <span className="h-5 w-px bg-slate-200" />
        <span className="text-sm font-medium text-slate-800">Müşteri koltuk seçimi — demo</span>
      </div>
      <div className="min-h-0 flex-1">
        <SeatMapSelector
          chart={chart}
          zones={ZONES}
          title="Biletorg Konser Arena"
          dateLabel="12 Ekim 2026 · 20:00 · Salon planı"
        />
      </div>
    </div>
  )
}

function addZoneSeats(target: SeatItem[], source: SeatItem[], zone: string) {
  for (let i = 0; i < source.length; i++) target.push({ ...source[i], zone })
}
