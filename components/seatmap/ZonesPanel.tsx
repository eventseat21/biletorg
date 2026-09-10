'use client'
// Sol panel: bölgeler (zone) — koltukları gruplama.

import { useState } from 'react'
import { Eye, Layers, MousePointer2, Plus, Trash2 } from 'lucide-react'
import type { ZoneDef } from '@/lib/seatmap/types'

const ZONE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6']

export interface ZonesPanelProps {
  zones: ZoneDef[]
  activeZoneId: string | null
  zoneCounts: Record<string, number>
  selectionCount: number
  onAddZone: (name: string, color: string) => void
  onRemoveZone: (id: string) => void
  onSelectZone: (id: string) => void
  onSelectZoneSeats: (id: string) => void
  onOpenZone: (id: string) => void
  onAssignSelection: () => void
  onClearSelectionZone: () => void
}

export default function ZonesPanel({
  zones,
  activeZoneId,
  zoneCounts,
  selectionCount,
  onAddZone,
  onRemoveZone,
  onSelectZone,
  onSelectZoneSeats,
  onOpenZone,
  onAssignSelection,
  onClearSelectionZone,
}: ZonesPanelProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(ZONE_COLORS[0])

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAddZone(trimmed, color)
    setName('')
    setColor(ZONE_COLORS[(zones.length + 1) % ZONE_COLORS.length])
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5">
        <Layers className="h-4 w-4 text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-800">Bölgeler</h2>
      </div>

      {/* Yeni bölge */}
      <div className="space-y-2 border-b border-slate-200 p-3">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Bölge ekle ve aktif bölge seç. Sonra eklediğin koltuklar otomatik bu bölgeye atanır.
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          placeholder="Bölge adı (ör. Kuzey Tribün)"
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
        />
        <div className="flex items-center gap-1.5">
          {ZONE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full border-2 ${
                color === c ? 'border-slate-900' : 'border-white'
              }`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <button
            type="button"
            onClick={add}
            className="ml-auto flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Bölge
          </button>
        </div>
      </div>

      {/* Bölge listesi */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {zones.length === 0 ? (
          <p className="text-[11px] text-slate-500">Henüz bölge yok. Yukarıdan ekle.</p>
        ) : (
          zones.map((z) => (
            <div
              key={z.id}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
                activeZoneId === z.id
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectZone(z.id)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: z.color }}
                />
                <span className="truncate text-xs font-medium text-slate-800">{z.name}</span>
                <span className="ml-auto shrink-0 text-[10px] text-slate-500">
                  {zoneCounts[z.id] ?? 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenZone(z.id)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                aria-label="Bölümü aç"
                title="Bölümü aç"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectZoneSeats(z.id)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                aria-label="Bölüm koltuklarını seç"
                title="Bölüm koltuklarını seç"
              >
                <MousePointer2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRemoveZone(z.id)}
                className="shrink-0 text-slate-400 hover:text-red-600"
                aria-label="Bölgeyi sil"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Seçimi bölgeye ata */}
      <div className="space-y-2 border-t border-slate-200 p-3">
        <p className="text-[10px] leading-relaxed text-slate-400">
          Göz: sadece bölümü açar. İmleç: bölümü tek parça seçer ve taşıyabilirsin.
        </p>
        <button
          type="button"
          onClick={onAssignSelection}
          disabled={!activeZoneId || selectionCount === 0}
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          Seçili {selectionCount} koltuğu bölgeye ata
        </button>
        <button
          type="button"
          onClick={onClearSelectionZone}
          disabled={selectionCount === 0}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
        >
          Seçimin bölgesini kaldır
        </button>
      </div>
    </div>
  )
}
