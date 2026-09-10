'use client'
// Editör araç çubuğu (v3).

import {
  CircleDashed,
  Download,
  Eraser,
  Hand,
  LayoutGrid,
  MousePointer2,
  PaintBucket,
  PlusCircle,
  Redo2,
  Save,
  Tag,
  Trash2,
  Upload,
  Undo2,
} from 'lucide-react'
import type { CategoryDef, EditorTool } from '@/lib/seatmap/types'

const TOOLS: { key: EditorTool; label: string; icon: typeof MousePointer2 }[] = [
  { key: 'select', label: 'Seç', icon: MousePointer2 },
  { key: 'add', label: 'Koltuk Ekle', icon: PlusCircle },
  { key: 'row', label: 'Satır Üret', icon: LayoutGrid },
  { key: 'arc', label: 'Yay Sıra', icon: CircleDashed },
  { key: 'paint', label: 'Boya', icon: PaintBucket },
  { key: 'erase', label: 'Sil', icon: Eraser },
  { key: 'pan', label: 'Kaydır', icon: Hand },
]

export interface EditorToolbarProps {
  tool: EditorTool
  onToolChange: (tool: EditorTool) => void
  categories: CategoryDef[]
  activeCategory: string
  onCategoryChange: (key: string) => void
  showLabels: boolean
  onToggleLabels: (value: boolean) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  selectionCount: number
  onDeleteSelected: () => void
  onSave: () => void
  saving: boolean
  dirty: boolean
  onExportJson: () => void
  onImportJson: () => void
}

export default function EditorToolbar({
  tool,
  onToolChange,
  categories,
  activeCategory,
  onCategoryChange,
  showLabels,
  onToggleLabels,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectionCount,
  onDeleteSelected,
  onSave,
  saving,
  dirty,
  onExportJson,
  onImportJson,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
        {TOOLS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onToolChange(key)}
            title={label}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
              tool === key
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-200" />

      <div className="flex flex-wrap items-center gap-1.5">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => onCategoryChange(category.key)}
            title={`${category.label}${category.price != null ? ` — €${category.price}` : ''}`}
            className={`h-7 w-7 rounded-full border-2 transition ${
              activeCategory === category.key
                ? 'scale-110 border-slate-900'
                : 'border-white shadow-sm hover:scale-105'
            }`}
            style={{ backgroundColor: category.color }}
            aria-label={category.label}
          />
        ))}
      </div>

      <div className="h-6 w-px bg-slate-200" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          title="Geri al"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          title="İleri al"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={selectionCount === 0}
          title="Seçilenleri sil"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onToggleLabels(!showLabels)}
          title="Etiketleri göster/gizle"
          className={`flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 ${
            showLabels ? 'text-indigo-700' : 'text-slate-600'
          }`}
        >
          <Tag className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onImportJson}
          title="JSON içe aktar"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <Upload className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onExportJson}
          title="JSON dışa aktar"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">
          {selectionCount > 0 ? `${selectionCount} koltuk seçili` : 'Seçim yok'}
        </span>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Kaydediliyor…' : dirty ? 'Kaydet' : 'Kayıtlı'}
        </button>
      </div>
    </div>
  )
}
