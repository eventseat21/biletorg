'use client'
// Salon planı editörü deneme sayfası (v2).

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowLeft, Armchair, ExternalLink } from 'lucide-react'
import { generateRows } from '@/lib/seatmap/geometry'
import type { SeatItem } from '@/lib/seatmap/types'

const SeatMapEditor = dynamic(() => import('@/components/seatmap/SeatMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      Editör yükleniyor…
    </div>
  ),
})

export default function SeatMapDemoPage() {
  const seats = useMemo<SeatItem[]>(() => {
    const back = generateRows({
      rows: 6,
      seatsPerRow: 16,
      gapX: 5,
      gapY: 12,
      seatWidth: 26,
      seatHeight: 26,
      shape: 'circle',
      type: 'NORMAL',
      originX: 120,
      originY: 120,
      startRowIndex: 0,
    })
    const mid = generateRows({
      rows: 5,
      seatsPerRow: 14,
      gapX: 6,
      gapY: 14,
      seatWidth: 28,
      seatHeight: 28,
      shape: 'circle',
      type: 'PREMIUM',
      originX: 170,
      originY: 420,
      startRowIndex: 6,
      curve: 46,
    })
    const vip = generateRows({
      rows: 2,
      seatsPerRow: 9,
      gapX: 9,
      gapY: 18,
      seatWidth: 32,
      seatHeight: 32,
      shape: 'rect',
      type: 'VIP',
      originX: 230,
      originY: 620,
      startRowIndex: 11,
      curve: 26,
    })
    const accessible = generateRows({
      rows: 1,
      seatsPerRow: 6,
      gapX: 10,
      gapY: 0,
      seatWidth: 30,
      seatHeight: 30,
      shape: 'rect',
      type: 'ACCESSIBLE',
      originX: 90,
      originY: 700,
      startRowIndex: 13,
    })
    return [...vip, ...mid, ...accessible, ...back]
  }, [])

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </Link>
        <div className="flex items-center gap-2 text-slate-900">
          <Armchair className="h-5 w-5 text-indigo-600" />
          <span className="font-semibold">Salon Planı Editörü</span>
        </div>
        <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          Deneme modu — kaydedilmez
        </span>
        <Link
          href="/saalplan/select-demo"
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
        >
          Müşteri görünümünü aç
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex-1">
        <SeatMapEditor initialSeats={seats} initialStage={{ width: 1400, height: 900 }} />
      </div>
    </div>
  )
}
