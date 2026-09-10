'use client'
// Yeni nesil salon planı editörü sayfası (v1).
// Mevcut /svg-editor rotası korunur; bu sayfa yeni SeatMapEditor bileşenini kullanır.

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Armchair } from 'lucide-react'

const SeatMapEditor = dynamic(() => import('@/components/seatmap/SeatMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      Editör yükleniyor…
    </div>
  ),
})

export default function SeatmapEditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Üst bar */}
      <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-4">
          <Link href="/organizer/halls" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 text-gray-900">
            <Armchair size={18} className="text-indigo-600" />
            <h1 className="text-lg font-semibold">Salon Planı Editörü</h1>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Koltukları çizin, kategori atayın ve kaydedin
        </div>
      </div>

      {/* Editör */}
      <div className="h-[calc(100vh-56px)]">
        <SeatMapEditor hallId={params.id} />
      </div>
    </div>
  )
}
