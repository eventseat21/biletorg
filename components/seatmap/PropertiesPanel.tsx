'use client'
// Sağ panel: Basit ayarlar, Kategoriler (isim+renk+fiyat) ve Arka Plan (v3).

import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Circle,
  ImageIcon,
  Plus,
  RotateCw,
  Settings2,
  Square,
  Tags,
  Target,
  Trash2,
} from 'lucide-react'
import type { ArcForm, BackgroundFit, CategoryDef, ChartBackground } from '@/lib/seatmap/types'

type TabKey = 'simple' | 'categories' | 'background'

export interface PropertiesPanelProps {
  // Basit
  showLabels: boolean
  onToggleLabels: (value: boolean) => void
  selectionCount: number
  selectionWidth: number
  selectionHeight: number
  selectedBlockId: string | null
  selectedBlockSeatCount: number
  rotationPreview: number | null
  onRotateSelection: (degrees: number) => void
  onResizeSelection: (width: number, height: number) => void
  onPreviewRotate: (degrees: number | null) => void
  onResetSelectionRotation: () => void
  onSetSelectionShape: (shape: 'circle' | 'rect') => void
  onStraightenSelection: () => void
  onDissolveSelectedBlock: () => void
  activeCategoryLabel: string
  onApplyCategoryToSelection: () => void
  onRenameSelectedRows: (mode: 'letters' | 'numbers', start: string) => void
  onAddSeatsToSelectedRows: (count: number) => void
  onSetSelectionStatus: (status: 'available' | 'held' | 'unavailable') => void
  // Yay üretici
  arcForm: ArcForm
  onArcFormChange: (form: ArcForm) => void
  arcCenterPicked: boolean
  onPickArcCenter: () => void
  onGenerateArc: () => void
  // Kategoriler
  categories: CategoryDef[]
  activeCategory: string
  onCategoryChange: (key: string) => void
  onUpdateCategory: (key: string, patch: Partial<CategoryDef>) => void
  onAddCategory: () => void
  onRemoveCategory: (key: string) => void
  categoryCounts: Record<string, number>
  // Arka plan
  background: ChartBackground
  onBackgroundChange: (background: ChartBackground) => void
}

export default function PropertiesPanel(props: PropertiesPanelProps) {
  const [tab, setTab] = useState<TabKey>('simple')

  return (
    <div className="flex h-full flex-col">
      {/* Sekmeler */}
      <div className="flex border-b border-slate-200">
        <TabButton
          active={tab === 'simple'}
          onClick={() => setTab('simple')}
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Basit"
        />
        <TabButton
          active={tab === 'categories'}
          onClick={() => setTab('categories')}
          icon={<Tags className="h-3.5 w-3.5" />}
          label="Kategoriler"
        />
        <TabButton
          active={tab === 'background'}
          onClick={() => setTab('background')}
          icon={<ImageIcon className="h-3.5 w-3.5" />}
          label="Arka Plan"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'simple' ? <SimpleTab {...props} /> : null}
        {tab === 'categories' ? <CategoriesTab {...props} /> : null}
        {tab === 'background' ? <BackgroundTab {...props} /> : null}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-[11px] font-medium transition ${
        active
          ? 'border-indigo-600 text-indigo-700'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ---------------------------------------------------------------- Basit

function SimpleTab({
  showLabels,
  onToggleLabels,
  selectionCount,
  selectionWidth,
  selectionHeight,
  selectedBlockId,
  selectedBlockSeatCount,
  rotationPreview,
  onRotateSelection,
  onResizeSelection,
  onPreviewRotate,
  onResetSelectionRotation,
  onSetSelectionShape,
  onStraightenSelection,
  onDissolveSelectedBlock,
  activeCategoryLabel,
  onApplyCategoryToSelection,
  onRenameSelectedRows,
  onAddSeatsToSelectedRows,
  onSetSelectionStatus,
  arcForm,
  onArcFormChange,
  arcCenterPicked,
  onPickArcCenter,
  onGenerateArc,
}: PropertiesPanelProps) {
  const [rotateDeg, setRotateDeg] = useState(15)
  const [rowLabelMode, setRowLabelMode] = useState<'letters' | 'numbers'>('letters')
  const [rowLabelStart, setRowLabelStart] = useState('A')
  const [additionalSeats, setAdditionalSeats] = useState(5)

  return (
    <div className="space-y-4">
      <Section title="Genel">
        <label className="flex items-center justify-between text-xs text-slate-700">
          Koltuk etiketlerini göster
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => onToggleLabels(e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </Section>

      <Section title="Seçim">
        {selectionCount === 0 ? (
          <p className="text-[11px] text-slate-500">Döndürmek için koltuk seç.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-600">{selectionCount} koltuk seçili</p>
            <div className={`rounded-md border p-2 ${selectedBlockId ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-slate-700">Blok düzenleme</p>
                {selectedBlockId ? <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-700">Blok</span> : null}
              </div>
              {selectedBlockId ? (
                <div className="mt-1.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span className="truncate pr-2">{selectedBlockId}</span>
                    <strong>{selectedBlockSeatCount} koltuk</strong>
                  </div>
                  <p className="text-[10px] leading-relaxed text-slate-500">Taşımak için haritada blok koltuklarından birini sürükleyin.</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" onClick={() => onRotateSelection(-15)} className="rounded border border-slate-300 bg-white px-2 py-1.5 text-[10px] text-slate-700 hover:bg-slate-50">↶ 15° sola</button>
                    <button type="button" onClick={() => onRotateSelection(15)} className="rounded border border-slate-300 bg-white px-2 py-1.5 text-[10px] text-slate-700 hover:bg-slate-50">↷ 15° sağa</button>
                    <button type="button" onClick={() => onSetSelectionShape('rect')} className="rounded border border-slate-300 bg-white px-2 py-1.5 text-[10px] text-slate-700 hover:bg-slate-50">Kare yap</button>
                    <button type="button" onClick={() => onSetSelectionShape('circle')} className="rounded border border-slate-300 bg-white px-2 py-1.5 text-[10px] text-slate-700 hover:bg-slate-50">Yuvarlak yap</button>
                  </div>
                  <button type="button" onClick={onApplyCategoryToSelection} className="w-full rounded bg-indigo-600 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-indigo-700">{activeCategoryLabel} kategorisini uygula</button>
                  <button type="button" onClick={onDissolveSelectedBlock} className="w-full rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800 hover:bg-amber-100">Blok bağlantısını çöz</button>
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-slate-500">Tek bir bloğu düzenlemek için sadece o bloğun koltuklarını seçin.</p>
              )}
            </div>
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <p className="text-[10px] font-medium text-slate-600">Seçili her sıraya koltuk ekle</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={additionalSeats}
                  onChange={(e) => setAdditionalSeats(Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => onAddSeatsToSelectedRows(additionalSeats)}
                  className="flex-1 rounded-md bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-slate-700"
                >
                  Her sıraya ekle
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-400">Koltuklar sıraların sağına, mevcut aralık korunarak eklenir.</p>
            </div>
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <p className="text-[10px] font-medium text-slate-600">Koltuk durumu</p>
              <div className="grid grid-cols-3 gap-1">
                <button type="button" onClick={() => onSetSelectionStatus('available')} className="rounded border border-emerald-200 bg-emerald-50 px-1 py-1.5 text-[10px] text-emerald-700 hover:bg-emerald-100">Uygun</button>
                <button type="button" onClick={() => onSetSelectionStatus('held')} className="rounded border border-amber-200 bg-amber-50 px-1 py-1.5 text-[10px] text-amber-700 hover:bg-amber-100">Tutuldu</button>
                <button type="button" onClick={() => onSetSelectionStatus('unavailable')} className="rounded border border-red-200 bg-red-50 px-1 py-1.5 text-[10px] text-red-700 hover:bg-red-100">Bloklu</button>
              </div>
            </div>
            <button
              type="button"
              onClick={onApplyCategoryToSelection}
              className="w-full rounded-md bg-indigo-600 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700"
            >
              {activeCategoryLabel} kategorisini seçime uygula
            </button>
            <div className="grid grid-cols-2 gap-2">
              <Num label="Genişlik" value={selectionWidth} onChange={(value) => onResizeSelection(value, selectionHeight)} min={8} />
              <Num label="Yükseklik" value={selectionHeight} onChange={(value) => onResizeSelection(selectionWidth, value)} min={8} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={90}
                value={rotateDeg}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setRotateDeg(value)
                  onPreviewRotate(value)
                }}
                className="flex-1"
              />
              <span className="w-10 text-right text-[11px] text-slate-600">{rotateDeg}°</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onPreviewRotate(null)
                  onRotateSelection(-rotateDeg)
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <RotateCw className="h-3.5 w-3.5 -scale-x-100" />
                Sola
              </button>
              <button
                type="button"
                onClick={() => {
                  onPreviewRotate(null)
                  onRotateSelection(rotateDeg)
                }}
                className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Sağa
              </button>
            </div>
            {rotationPreview !== null ? (
              <button
                type="button"
                onClick={() => {
                  onPreviewRotate(null)
                  onRotateSelection(rotationPreview)
                }}
                className="w-full rounded-md bg-indigo-600 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-700"
              >
                Açıyı uygula ({rotationPreview}°)
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                onPreviewRotate(null)
                onResetSelectionRotation()
              }}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              Döndürmeyi sıfırla
            </button>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => onSetSelectionShape('circle')}
                className="flex items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
              >
                <Circle className="h-3 w-3" /> Yuvarlak yap
              </button>
              <button
                type="button"
                onClick={() => onSetSelectionShape('rect')}
                className="flex items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
              >
                <Square className="h-3 w-3" /> Kare yap
              </button>
            </div>
            <button
              type="button"
              onClick={onStraightenSelection}
              className="w-full rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[11px] text-indigo-700 hover:bg-indigo-100"
            >
              Seçili yay sıralarını düzleştir
            </button>
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <p className="text-[10px] font-medium text-slate-600">Seçili satır başlarını değiştir</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={rowLabelMode}
                  onChange={(e) => setRowLabelMode(e.target.value as 'letters' | 'numbers')}
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px]"
                >
                  <option value="letters">A, B, C...</option>
                  <option value="numbers">1, 2, 3...</option>
                </select>
                <input
                  value={rowLabelStart}
                  onChange={(e) => setRowLabelStart(e.target.value)}
                  placeholder={rowLabelMode === 'letters' ? 'A' : '1'}
                  className="rounded-md border border-slate-300 px-2 py-1 text-[11px]"
                />
              </div>
              <button
                type="button"
                onClick={() => onRenameSelectedRows(rowLabelMode, rowLabelStart)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-100"
              >
                Satır başlarını uygula
              </button>
            </div>
            <button
              type="button"
              onClick={onDissolveSelectedBlock}
              className="w-full rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-800 hover:bg-amber-100"
            >
              Seçili bloku çöz
            </button>
          </div>
        )}
      </Section>

      <Section title="Yuvarlak / Yay Sıra">
        <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
          Önce merkezi seç, sonra oluştur. Stadyum ve arena sıraları için.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Num label="Satır" value={arcForm.rows} onChange={(v) => onArcFormChange({ ...arcForm, rows: v })} min={1} />
          <Num label="Koltuk/satır" value={arcForm.seatsPerRow} onChange={(v) => onArcFormChange({ ...arcForm, seatsPerRow: v })} min={1} />
          <Num label="İç yarıçap" value={arcForm.startRadius} onChange={(v) => onArcFormChange({ ...arcForm, startRadius: v })} min={20} />
          <Num label="Sıra aralığı" value={arcForm.rowGap} onChange={(v) => onArcFormChange({ ...arcForm, rowGap: v })} min={10} />
          <Num label="Başlangıç açısı" value={arcForm.startAngleDeg} onChange={(v) => onArcFormChange({ ...arcForm, startAngleDeg: v })} />
          <Num label="Bitiş açısı" value={arcForm.endAngleDeg} onChange={(v) => onArcFormChange({ ...arcForm, endAngleDeg: v })} />
          <Num label="Genişlik" value={arcForm.seatWidth} onChange={(v) => onArcFormChange({ ...arcForm, seatWidth: v })} min={8} />
          <Num label="Yükseklik" value={arcForm.seatHeight} onChange={(v) => onArcFormChange({ ...arcForm, seatHeight: v })} min={8} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onPickArcCenter}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
              arcCenterPicked
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            {arcCenterPicked ? 'Merkez seçili' : 'Merkez seç'}
          </button>
          <button
            type="button"
            onClick={onGenerateArc}
            disabled={!arcCenterPicked}
            className="flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Oluştur
          </button>
        </div>
      </Section>
    </div>
  )
}

// ------------------------------------------------------------ Kategoriler

function CategoriesTab({
  categories,
  activeCategory,
  onCategoryChange,
  onUpdateCategory,
  onAddCategory,
  onRemoveCategory,
  categoryCounts,
}: PropertiesPanelProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-800">Kategoriler & Fiyat</h3>
        <button
          type="button"
          onClick={onAddCategory}
          className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-3 w-3" />
          Ekle
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.key}
            className={`rounded-lg border p-2.5 transition ${
              activeCategory === c.key
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={c.color}
                onChange={(e) => onUpdateCategory(c.key, { color: e.target.value })}
                onClick={() => onCategoryChange(c.key)}
                className="h-7 w-8 shrink-0 cursor-pointer rounded border border-slate-300"
                aria-label="Renk"
              />
              <input
                value={c.label}
                onChange={(e) => onUpdateCategory(c.key, { label: e.target.value })}
                className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                placeholder="Kategori adı"
                title="Kategori adı"
              />
              <div className="flex w-20 shrink-0 items-center gap-1">
                <span className="text-[11px] text-slate-500">€</span>
                <PriceInput
                  value={c.price}
                  onCommit={(price) => onUpdateCategory(c.key, { price })}
                />
              </div>
              <span className="shrink-0 text-[10px] text-slate-500">
                {categoryCounts[c.key] ?? 0}
              </span>
              {categories.length > 1 ? (
                <button
                  type="button"
                  onClick={() => onRemoveCategory(c.key)}
                  className="shrink-0 text-slate-400 hover:text-red-600"
                  aria-label="Kategoriyi sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Aktif kategoriyi seçtikten sonra <strong>Boya</strong> aracıyla koltuklara uygula.
      </p>
    </div>
  )
}

// ------------------------------------------------------------- Arka Plan

function BackgroundTab({ background, onBackgroundChange }: PropertiesPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  const onFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onBackgroundChange({ ...background, image: String(reader.result) })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <Section title="Salon Görseli">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-4 text-xs text-slate-600 hover:border-indigo-400 hover:bg-indigo-50"
        >
          Görsel yükle (plan / kroki)
        </button>

        {background.image ? (
          <div className="mt-2 space-y-2">
            <div className="relative overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={background.image}
                alt="Arka plan önizleme"
                className="h-28 w-full object-contain bg-slate-50"
              />
            </div>
            <button
              type="button"
              onClick={() => onBackgroundChange({ ...background, image: null })}
              className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] text-red-700 hover:bg-red-100"
            >
              Görseli kaldır
            </button>
          </div>
        ) : null}
      </Section>

      <Section title="Görsel Ayarları">
        <label className="block text-[11px] text-slate-600">
          Saydamlık: {Math.round(background.opacity * 100)}%
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(background.opacity * 100)}
            onChange={(e) =>
              onBackgroundChange({ ...background, opacity: Number(e.target.value) / 100 })
            }
            className="mt-1 w-full"
          />
        </label>
        <label className="mt-2 block text-[11px] text-slate-600">
          Sığdırma
          <select
            value={background.fit}
            onChange={(e) =>
              onBackgroundChange({ ...background, fit: e.target.value as BackgroundFit })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="none">Orijinal boyut</option>
            <option value="contain">Sığdır (oranı koru)</option>
            <option value="cover">Kapla (kırp)</option>
            <option value="fill">Uzat</option>
          </select>
        </label>
      </Section>
    </div>
  )
}

// ------------------------------------------------------------------ ortak

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      {children}
    </div>
  )
}

function PriceInput({
  value,
  onCommit,
}: {
  value?: number
  onCommit: (value: number) => void
}) {
  const [text, setText] = useState(value == null ? '' : String(value))

  useEffect(() => {
    setText(value == null ? '' : String(value))
  }, [value])

  const commit = () => {
    const normalized = text.replace(',', '.').trim()
    if (!normalized) {
      onCommit(0)
      return
    }
    const parsed = Number(normalized)
    if (Number.isFinite(parsed) && parsed >= 0) onCommit(parsed)
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        const parsed = Number(next.replace(',', '.'))
        if (Number.isFinite(parsed) && parsed >= 0) onCommit(parsed)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
      className="w-full rounded-md border border-slate-300 px-1.5 py-1 text-xs"
      placeholder="Fiyat"
      title="Kategori fiyatı (Euro)"
      aria-label="Kategori fiyatı Euro"
    />
  )
}

function Num({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-slate-600">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
    </label>
  )
}
