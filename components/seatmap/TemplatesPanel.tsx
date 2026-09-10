'use client'
// Sol panel: hazır salon şablonları.

import { useMemo } from 'react'
import { LayoutTemplate, Trash2 } from 'lucide-react'
import { VENUE_TEMPLATES } from '@/lib/seatmap/templates'

export interface TemplatesPanelProps {
  onInsert: (templateKey: string) => void
  onClearAll: () => void
  seatCount: number
}

export default function TemplatesPanel({ onInsert, onClearAll, seatCount }: TemplatesPanelProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of VENUE_TEMPLATES) {
      try {
        map[t.key] = t.build().length
      } catch {
        map[t.key] = 0
      }
    }
    return map
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5">
        <LayoutTemplate className="h-4 w-4 text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-800">Salon Şablonları</h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-2.5 text-[11px] leading-relaxed text-indigo-900">
          <p className="font-semibold">Salon oluşturma</p>
          <ol className="mt-1 list-inside list-decimal space-y-0.5 text-indigo-800">
            <li>Bir şablon seçin.</li>
            <li>Haritada yerleştirme noktasına tıklayın.</li>
            <li>Onaylayın; çakışma varsa ekleme durur.</li>
          </ol>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Şablonlar ayrı bloklar halinde gelir. Haritada bir bloğun koltuğuna tıklayınca blok birlikte seçilir.
        </p>

        {VENUE_TEMPLATES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onInsert(t.key)}
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">{t.label}</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {counts[t.key] ?? 0}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">{t.hint}</p>
          </button>
        ))}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 text-[11px] text-slate-500">Toplam {seatCount} koltuk</div>
        <button
          type="button"
          onClick={onClearAll}
          disabled={seatCount === 0}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Tüm Koltukları Temizle
        </button>
      </div>
    </div>
  )
}
