'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Armchair } from 'lucide-react'

// Eski /editor bağlantısını yeni nesil seat map editörüne bağlarız.
const SeatMapEditor = dynamic(() => import('@/components/seatmap/SeatMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      Editör yükleniyor…
    </div>
  ),
})

export default function HallEditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/organizer/halls"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Salonlara dön"
          >
            <ArrowLeft size={20} />
          </Link>
          <Armchair size={20} className="text-indigo-600" />
          <h1 className="text-lg font-semibold text-slate-900">Salon Editörü</h1>
        </div>
        <Link
          href={`/organizer/halls/${params.id}/seatmap`}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Yeni editör adresini aç
        </Link>
      </header>
      <main className="min-h-0 flex-1">
        <SeatMapEditor hallId={params.id} />
      </main>
    </div>
  )
}
