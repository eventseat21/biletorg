'use client'
// Salon planı editörü (v3).
// Araçlar, şablonlar, bölgeler, kategoriler/fiyat, arka plan, yay sıra, geri al/kaydet.

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type {
  ArcForm,
  CategoryDef,
  ChartBackground,
  ChartDoc,
  EditorTool,
  SeatItem,
  WorldPoint,
  ZoneDef,
} from '@/lib/seatmap/types'
import { DEFAULT_CATEGORIES, nextCategoryKey } from '@/lib/seatmap/categories'
import {
  centerOfSeats,
  generateArcRows,
  generateRows,
  makeSeatId,
  nextRowLabel,
  rotateSeatsAround,
  rowLabel,
  seatsInRect,
  snapToGrid,
} from '@/lib/seatmap/geometry'
import { persistedIds, seatFromApi, seatToPayload, type ApiSeat } from '@/lib/seatmap/adapter'
import { getTemplate } from '@/lib/seatmap/templates'
import SeatMapCanvas from './SeatMapCanvas'
import EditorToolbar from './EditorToolbar'
import TemplatesPanel from './TemplatesPanel'
import ZonesPanel from './ZonesPanel'
import PropertiesPanel from './PropertiesPanel'

export interface SeatMapEditorProps {
  /** Veritabanındaki salon kimliği. Yoksa editör "deneme" modunda çalışır. */
  hallId?: string
  initialSeats?: SeatItem[]
  initialStage?: { width: number; height: number }
}

interface RowForm {
  rows: number
  seatsPerRow: number
  gapX: number
  gapY: number
  seatWidth: number
  seatHeight: number
  shape: 'circle' | 'rect'
  curve: number
  /** Örnek: 4,4,5,2 — koridorlarla ayrılmış bloklar. */
  blockPattern: string
  blockGap: number
  numbering: 'sequential' | 'odd' | 'even' | 'split'
  numberDirection: 'ltr' | 'rtl'
  startNumber: number
}

const DEFAULT_ROW_FORM: RowForm = {
  rows: 4,
  seatsPerRow: 10,
  gapX: 6,
  gapY: 10,
  seatWidth: 26,
  seatHeight: 26,
  shape: 'circle',
  curve: 0,
  blockPattern: '',
  blockGap: 34,
  numbering: 'sequential',
  numberDirection: 'ltr',
  startNumber: 1,
}

const DEFAULT_ARC_FORM: ArcForm = {
  rows: 5,
  seatsPerRow: 20,
  startRadius: 240,
  rowGap: 30,
  startAngleDeg: 30,
  endAngleDeg: 150,
  seatWidth: 26,
  seatHeight: 26,
  shape: 'circle',
}

const DEFAULT_BACKGROUND: ChartBackground = { image: null, opacity: 0.35, fit: 'contain' }

/** Yeni kategori eklerken kullanılacak renkler. */
const ADD_COLORS = ['#64748b', '#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ec4899', '#8b5cf6']

/** Koltuk -> bölge eşlemesinin anahtarı (satır + numara). */
function seatKey(seat: Pick<SeatItem, 'row' | 'number'>): string {
  return `${seat.row}::${seat.number}`
}

function makeBlockId(): string {
  return `block-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`
}

interface StoredMeta {
  categories?: CategoryDef[]
  zones?: ZoneDef[]
  background?: ChartBackground
  seatZones?: Record<string, string>
  blockIds?: Record<string, string>
  stage?: { width: number; height: number }
  stagePosition?: WorldPoint
}

export default function SeatMapEditor({
  hallId,
  initialSeats,
  initialStage,
}: SeatMapEditorProps) {
  const [seats, setSeats] = useState<SeatItem[]>(() => initialSeats ?? [])
  const [stage, setStage] = useState(() => initialStage ?? { width: 1400, height: 900 })
  const [stagePosition, setStagePosition] = useState(() => ({
    x: Math.max(30, ((initialStage?.width ?? 1400) - 260) / 2),
    y: 35,
  }))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [tool, setTool] = useState<EditorTool>('select')
  const [activeCategory, setActiveCategory] = useState('NORMAL')
  const [showLabels, setShowLabels] = useState(true)
  const [rowForm, setRowForm] = useState<RowForm>(DEFAULT_ROW_FORM)
  const [showAdvancedRows, setShowAdvancedRows] = useState(true)

  // --- Faz 2: kategoriler, bölgeler, arka plan, yay sıra -------------------
  const [categories, setCategories] = useState<CategoryDef[]>(DEFAULT_CATEGORIES)
  const [zones, setZones] = useState<ZoneDef[]>([])
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [seatZones, setSeatZones] = useState<Record<string, string>>({})
  const [background, setBackground] = useState<ChartBackground>(DEFAULT_BACKGROUND)
  const [arcForm, setArcForm] = useState<ArcForm>(DEFAULT_ARC_FORM)
  const [arcCenter, setArcCenter] = useState<WorldPoint | null>(null)
  const [rotationPreview, setRotationPreview] = useState<number | null>(null)
  const [leftTab, setLeftTab] = useState<'templates' | 'zones'>('templates')
  const [sectionViewId, setSectionViewId] = useState<string | null>(null)
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null)
  const [pendingPlacement, setPendingPlacement] = useState<{
    seats: SeatItem[]
    label: string
    overlaps: number
  } | null>(null)
  const [metaReady, setMetaReady] = useState(!hallId)

  const [past, setPast] = useState<SeatItem[][]>([])
  const [future, setFuture] = useState<SeatItem[][]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(hallId))
  const [message, setMessage] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const persistedRef = useRef<Set<string>>(new Set(persistedIds(initialSeats ?? [])))
  const dragRef = useRef<{
    startWorld: WorldPoint
    snapshot: SeatItem[]
    ids: Set<string>
    moved: boolean
  } | null>(null)
  const marqueeRef = useRef<{ startWorld: WorldPoint; additive: boolean } | null>(null)
  const jsonInputRef = useRef<HTMLInputElement | null>(null)

  // ---- Veri yükleme (koltuklar + yerel meta) ------------------------------
  useEffect(() => {
    if (!hallId) {
      setMetaReady(true)
      return
    }
    let cancelled = false

    // Yerel meta (kategori/bölge/arka plan) — sayfa yenilense de kalsın.
    let storedSeatZones: Record<string, string> = {}
    let storedBlockIds: Record<string, string> = {}
    try {
      const raw = window.localStorage.getItem(`seatmap-meta:${hallId}`)
      if (raw) {
        const meta = JSON.parse(raw) as StoredMeta
        if (Array.isArray(meta.categories) && meta.categories.length > 0) {
          setCategories(meta.categories)
        }
        if (Array.isArray(meta.zones)) {
          setZones(meta.zones)
          if (meta.zones.length > 0) setActiveZoneId(meta.zones[0].id)
        }
        if (meta.background) setBackground(meta.background)
        if (meta.seatZones && typeof meta.seatZones === 'object') {
          storedSeatZones = meta.seatZones
          setSeatZones(meta.seatZones)
        }
        if (meta.blockIds && typeof meta.blockIds === 'object') {
          storedBlockIds = meta.blockIds
        }
      }
    } catch {
      /* bozuk meta görmezden gelinir */
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/organizer/halls/${hallId}`)
        if (!res.ok) throw new Error('Salon yüklenemedi')
        const data = await res.json()
        if (cancelled) return
        const remoteMeta = data.layoutJson && typeof data.layoutJson === 'object'
          ? (data.layoutJson as StoredMeta)
          : null
        if (remoteMeta) {
          if (Array.isArray(remoteMeta.categories) && remoteMeta.categories.length > 0) setCategories(remoteMeta.categories)
          if (Array.isArray(remoteMeta.zones)) {
            setZones(remoteMeta.zones)
            if (remoteMeta.zones.length > 0) setActiveZoneId(remoteMeta.zones[0].id)
          }
          if (remoteMeta.background) setBackground(remoteMeta.background)
          if (remoteMeta.seatZones && typeof remoteMeta.seatZones === 'object') {
            storedSeatZones = remoteMeta.seatZones
            setSeatZones(remoteMeta.seatZones)
          }
          if (remoteMeta.blockIds && typeof remoteMeta.blockIds === 'object') storedBlockIds = remoteMeta.blockIds
          if (remoteMeta.stagePosition) setStagePosition(remoteMeta.stagePosition)
        }
        const mapped = ((data.seats ?? []) as ApiSeat[]).map(seatFromApi).map((s) => {
          const key = seatKey(s)
          const z = storedSeatZones[key]
          const blockId = storedBlockIds[key]
          return {
            ...s,
            zone: z ?? s.zone ?? null,
            blockId: blockId ?? s.blockId ?? null,
          }
        })
        setSeats(mapped)
        persistedRef.current = new Set(persistedIds(mapped))
        const loadedStage = remoteMeta?.stage ?? {
          width: Number(data.stageWidth) || 1400,
          height: Number(data.stageHeight) || 900,
        }
        setStage(loadedStage)
        if (!remoteMeta?.stagePosition) {
          setStagePosition({ x: Math.max(30, (loadedStage.width - 260) / 2), y: 35 })
        }
      } catch {
        if (!cancelled) setMessage('Salon yüklenirken hata oluştu.')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setMetaReady(true)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [hallId])

  // Yerel metayı kaydet (yalnızca yükleme bittikten sonra).
  useEffect(() => {
    if (!hallId || !metaReady) return
    try {
      window.localStorage.setItem(
        `seatmap-meta:${hallId}`,
        JSON.stringify({
          categories,
          zones,
          background,
          seatZones,
          blockIds: Object.fromEntries(
            seats.filter((seat) => seat.blockId).map((seat) => [seatKey(seat), seat.blockId])
          ),
        })
      )
    } catch {
      /* kota dolu olabilir, sessizce geç */
    }
  }, [hallId, metaReady, categories, zones, background, seatZones, seats])

  // ---- Mesaj otomatik gizle ----------------------------------------------
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 2500)
    return () => clearTimeout(t)
  }, [message])

  // ---- Geçmiş (geri/ileri al) --------------------------------------------
  const commit = (next: SeatItem[]) => {
    setPast((p) => [...p.slice(-49), seats])
    setFuture([])
    setSeats(next)
    setDirty(true)
  }

  const undo = () => {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setPast(past.slice(0, -1))
    setFuture([...future, seats])
    setSeats(prev)
    setDirty(true)
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[future.length - 1]
    setFuture(future.slice(0, -1))
    setPast([...past, seats])
    setSeats(next)
    setDirty(true)
  }

  // ---- Seçim yardımcıları -------------------------------------------------
  const selectSeats = (ids: string[], additive: boolean) => {
    setSelected((prev) => {
      if (!additive) return new Set(ids)
      const next = new Set(prev)
      for (let i = 0; i < ids.length; i++) next.add(ids[i])
      return next
    })
  }

  const deleteSelected = () => {
    if (selected.size === 0) return
    const ids = Array.from(selected).filter((id) => !seats.find((seat) => seat.id === id)?.locked)
    if (ids.length === 0) {
      setMessage('Satılmış koltuklar silinemez.')
      return
    }
    removeSeatZones(ids)
    commit(seats.filter((s) => !selected.has(s.id)))
    setSelected(new Set())
    // Seçili yay silindiğinde canlı önizleme aynı koltukları geri getirmesin.
    setArcCenter(null)
    setRotationPreview(null)
    setMessage(`${ids.length} koltuk silindi.`)
  }

  const paintSeats = (ids: Iterable<string>, type: string) => {
    const idSet = new Set(ids)
    commit(seats.map((s) => (idSet.has(s.id) && !s.locked ? { ...s, type } : s)))
  }

  // ---- Bölge (zone) -------------------------------------------------------
  const removeSeatZones = (ids: string[]) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    const keys = seats.filter((s) => idSet.has(s.id)).map(seatKey)
    if (keys.length === 0) return
    setSeatZones((prev) => {
      const next = { ...prev }
      for (let i = 0; i < keys.length; i++) delete next[keys[i]]
      return next
    })
  }

  const addZone = (name: string, color: string) => {
    const id = `zone-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`
    setZones((prev) => [...prev, { id, name, color }])
    setActiveZoneId(id)
  }

  const removeZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id))
    if (activeZoneId === id) setActiveZoneId(null)
    setSeatZones((prev) => {
      const next: Record<string, string> = {}
      for (const key of Object.keys(prev)) if (prev[key] !== id) next[key] = prev[key]
      return next
    })
    commit(seats.map((s) => (s.zone === id ? { ...s, zone: null } : s)))
  }

  const assignZoneToSelection = () => {
    if (!activeZoneId || selected.size === 0) return
    const zoneId = activeZoneId
    const targets = seats.filter((s) => selected.has(s.id))
    setSeatZones((prev) => {
      const next = { ...prev }
      for (let i = 0; i < targets.length; i++) next[seatKey(targets[i])] = zoneId
      return next
    })
    commit(seats.map((s) => (selected.has(s.id) ? { ...s, zone: zoneId } : s)))
    setMessage('Seçili koltuklar bölgeye atandı.')
  }

  /** Editörde bölgeyi aktif yapar; mevcut koltuk seçimini bozmaz. */
  const selectZone = (id: string) => {
    setActiveZoneId(id)
    setLeftTab('zones')
    setMessage('Aktif bölüm seçildi. Yeni koltuklar bu bölüme atanır.')
  }

  const selectZoneSeats = (id: string) => {
    setActiveZoneId(id)
    setSelected(new Set(seats.filter((seat) => seat.zone === id).map((seat) => seat.id)))
    setSectionViewId(null)
    setMessage('Bölüm koltukları tek parça seçildi. Şimdi sürükleyebilirsin.')
  }

  const openZone = (id: string) => {
    setActiveZoneId(id)
    setSectionViewId(id)
    setSelected(new Set())
    setMessage('Bölüm görünümü açıldı.')
  }

  const clearSelectionZone = () => {
    if (selected.size === 0) return
    removeSeatZones(Array.from(selected))
    commit(seats.map((s) => (selected.has(s.id) ? { ...s, zone: null } : s)))
  }

  // ---- Kategoriler & fiyat ------------------------------------------------
  const updateCategory = (key: string, patch: Partial<CategoryDef>) => {
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)))
    setDirty(true)
  }

  const addCategory = () => {
    const key = nextCategoryKey(categories)
    const color = ADD_COLORS[categories.length % ADD_COLORS.length]
    setCategories((prev) => [
      ...prev,
      { key, label: 'Yeni Kategori', color, textColor: '#ffffff', price: 0 },
    ])
    setActiveCategory(key)
    setDirty(true)
  }

  const removeCategory = (key: string) => {
    if (categories.length <= 1) return
    const fallback = categories.find((c) => c.key !== key)
    if (!fallback) return
    const fallbackKey = fallback.key
    setCategories((prev) => prev.filter((c) => c.key !== key))
    if (activeCategory === key) setActiveCategory(fallbackKey)
    commit(seats.map((s) => (s.type === key ? { ...s, type: fallbackKey } : s)))
  }

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (let i = 0; i < seats.length; i++) {
      const t = seats[i].type
      map[t] = (map[t] ?? 0) + 1
    }
    return map
  }, [seats])

  const zoneCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (let i = 0; i < seats.length; i++) {
      const z = seats[i].zone
      if (z) map[z] = (map[z] ?? 0) + 1
    }
    return map
  }, [seats])

  const activeCategoryDef = useMemo(
    () => categories.find((c) => c.key === activeCategory) ?? categories[0],
    [categories, activeCategory]
  )

  // Form değiştiği anda yeni yay koltuklarını üretir; henüz gerçek koltuk listesine eklemez.
  const arcPreview = useMemo(() => {
    // Seçili bir grup düzenleniyorsa değişiklikler doğrudan koltuklara uygulanır;
    // ikinci bir önizleme kopyası çizme.
    if (!arcCenter || selected.size > 0) return []
    return generateArcRows({
      ...arcForm,
      centerX: arcCenter.x,
      centerY: arcCenter.y,
      type: activeCategory,
      startRowIndex: rowIndexAfter(seats),
    }).map((seat) => ({
      ...seat,
      zone: activeZoneId ?? null,
      blockId: 'preview-arc',
    }))
  }, [arcCenter, arcForm, activeCategory, seats])

  // Döndürme sürgüsü hareket ederken koltukları geçmişe yazmadan gösterir.
  const displaySeats = useMemo(() => {
    let visible = sectionViewId ? seats.filter((seat) => seat.zone === sectionViewId) : seats
    if (rotationPreview !== null && selected.size > 0) {
      const pivot = centerOfSeats(seats.filter((seat) => selected.has(seat.id)))
      if (pivot) visible = rotateSeatsAround(visible, Array.from(selected), pivot, rotationPreview)
    }
    return arcPreview.length > 0 ? [...visible, ...arcPreview] : visible
  }, [seats, selected, rotationPreview, arcPreview, sectionViewId])

  // ---- Şablon yerleştirme -------------------------------------------------
  const requestTemplate = (key: string) => {
    setPendingTemplate(key)
    setMessage('Yerleştirmek için haritada bir noktaya tıkla.')
  }

  const placeTemplate = (key: string, at: WorldPoint) => {
    const template = getTemplate(key)
    if (!template) return
    const built = template.build()
    const center = centerOfSeats(built) ?? { x: 0, y: 0 }
    const dx = snapToGrid(at.x - center.x)
    const dy = snapToGrid(at.y - center.y)
    const fallbackBlockId = makeBlockId()
    const blockMap: Record<string, string> = {}
    const placed = built.map((s) => {
      const sourceBlock = s.blockId ?? '__template-single-block__'
      if (!blockMap[sourceBlock]) blockMap[sourceBlock] = makeBlockId()
      return {
        ...s,
        x: Math.round(s.x + dx),
        y: Math.round(s.y + dy),
        zone: activeZoneId ?? null,
        blockId: blockMap[sourceBlock] ?? fallbackBlockId,
      }
    })
    const overlaps = placed.filter((candidate) =>
      seats.some((existing) =>
        candidate.x < existing.x + existing.width &&
        candidate.x + candidate.width > existing.x &&
        candidate.y < existing.y + existing.height &&
        candidate.y + candidate.height > existing.y
      )
    ).length
    setPendingPlacement({ seats: placed, label: template.label, overlaps })
    setMessage(
      overlaps > 0
        ? `${overlaps} koltuk mevcut salonla çakışıyor. Başka bir konum seçin.`
        : `${template.label} hazırlandı. Eklemek için onay ver.`
    )
  }

  const confirmPlacement = () => {
    if (!pendingPlacement || pendingPlacement.overlaps > 0) return
    const placed = pendingPlacement.seats
    const zoneId = activeZoneId
    if (zoneId) {
      setSeatZones((prev) => {
        const next = { ...prev }
        for (let i = 0; i < placed.length; i++) next[seatKey(placed[i])] = zoneId
        return next
      })
    }
    commit([...seats, ...placed])
    setPendingPlacement(null)
    setMessage(`${pendingPlacement.label}: ${placed.length} koltuk eklendi.`)
  }

  const cancelPlacement = () => {
    setPendingPlacement(null)
    setMessage('Blok ekleme iptal edildi.')
  }

  const copySelectedRowPattern = () => {
    const selectedSeats = seats.filter((seat) => selected.has(seat.id))
    const pattern = inferBlockPattern(selectedSeats)
    if (!pattern) {
      setMessage('Önce koridor düzeni olan tek bir satırı seç.')
      return
    }
    setRowForm((previous) => ({ ...previous, blockPattern: pattern }))
    setMessage(`Satır düzeni alındı: ${pattern}`)
  }

  const clearAllSeats = () => {
    // Gerçek koltukların yanında canlı yay/şablon önizlemesini de temizle.
    setSeatZones({})
    setSelected(new Set())
    setArcCenter(null)
    setRotationPreview(null)
    setPendingTemplate(null)
    setPendingPlacement(null)
    if (seats.length > 0) commit([])
    else setDirty(true)
    setMessage('Tüm koltuklar ve önizlemeler temizlendi.')
  }

  // ---- Sıra döndürme ------------------------------------------------------
  const rotateSelection = (degrees: number) => {
    if (selected.size === 0) return
    const chosen = seats.filter((s) => selected.has(s.id))
    const pivot = centerOfSeats(chosen)
    if (!pivot) return
    commit(rotateSeatsAround(seats, Array.from(selected), pivot, degrees))
  }

  const resetSelectionRotation = () => {
    if (selected.size === 0) return
    commit(seats.map((s) => (selected.has(s.id) ? { ...s, rotation: 0 } : s)))
  }

  const dissolveSelectedBlock = () => {
    if (selected.size === 0) return
    commit(seats.map((seat) => (selected.has(seat.id) ? { ...seat, blockId: null } : seat)))
    setMessage('Seçili blok çözüldü; koltuklar artık tek tek seçilebilir.')
  }

  const addSeatsToSelectedRows = (count: number) => {
    if (selected.size === 0 || count < 1) return
    const rowNames: string[] = []
    for (let i = 0; i < seats.length; i++) {
      if (selected.has(seats[i].id) && rowNames.indexOf(seats[i].row) === -1) rowNames.push(seats[i].row)
    }
    const added: SeatItem[] = []
    for (let r = 0; r < rowNames.length; r++) {
      const rowSeats = seats.filter((seat) => seat.row === rowNames[r]).sort((a, b) => a.x - b.x)
      if (rowSeats.length === 0) continue
      const last = rowSeats[rowSeats.length - 1]
      const gaps: number[] = []
      for (let i = 1; i < rowSeats.length; i++) gaps.push(rowSeats[i].x - (rowSeats[i - 1].x + rowSeats[i - 1].width))
      const gap = gaps.length > 0 ? gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 6
      const numericNumbers = rowSeats.map((seat) => Number(seat.number)).filter((value) => Number.isFinite(value))
      const firstNumber = numericNumbers.length > 0 ? Math.max(...numericNumbers) + 1 : rowSeats.length + 1
      for (let i = 0; i < count; i++) {
        added.push({
          id: makeSeatId(),
          row: last.row,
          number: String(firstNumber + i),
          x: last.x + last.width + gap + i * (last.width + gap),
          y: last.y,
          width: last.width,
          height: last.height,
          type: last.type,
          shape: last.shape,
          rotation: last.rotation,
          zone: last.zone ?? null,
          blockId: last.blockId ?? null,
        })
      }
    }
    if (added.length === 0) return
    commit([...seats, ...added])
    setSelected(new Set([...Array.from(selected), ...added.map((seat) => seat.id)]))
    setMessage(`${added.length} koltuk eklendi.`)
  }

  const setSelectionStatus = (status: 'available' | 'held' | 'unavailable') => {
    if (selected.size === 0) return
    commit(seats.map((seat) => (selected.has(seat.id) ? { ...seat, status } : seat)))
    setMessage(status === 'available' ? 'Koltuklar satışa açıldı.' : status === 'held' ? 'Koltuklar geçici olarak tutuldu.' : 'Koltuklar bloklandı.')
  }

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key)
    if (selected.size === 0) return
    commit(seats.map((seat) => (selected.has(seat.id) ? { ...seat, type: key } : seat)))
    const category = categories.find((item) => item.key === key)
    setMessage(`${category?.label ?? key} kategorisi seçime uygulandı.`)
  }

  const applyCategoryToSelection = () => {
    if (selected.size === 0) return
    commit(seats.map((seat) => (selected.has(seat.id) ? { ...seat, type: activeCategory } : seat)))
    setMessage(`${activeCategoryDef?.label ?? activeCategory} kategorisi seçime uygulandı.`)
  }

  const renameSelectedRows = (mode: 'letters' | 'numbers', start: string) => {
    if (selected.size === 0) return
    const selectedRows = seats
      .filter((seat) => selected.has(seat.id))
      .map((seat) => seat.row)
      .filter((row, index, rows) => rows.indexOf(row) === index)
    const rowPositions: Record<string, number> = {}
    for (let i = 0; i < selectedRows.length; i++) {
      const row = selectedRows[i]
      rowPositions[row] = seats
        .filter((seat) => seat.row === row)
        .reduce((sum, seat) => sum + seat.y, 0)
      rowPositions[row] /= Math.max(1, seats.filter((seat) => seat.row === row).length)
    }
    selectedRows.sort((a, b) => rowPositions[a] - rowPositions[b])
    const replacements: Record<string, string> = {}
    let startValue = mode === 'numbers' ? Math.max(1, Number(start) || 1) - 1 : letterIndex(start)
    for (let i = 0; i < selectedRows.length; i++) {
      replacements[selectedRows[i]] = mode === 'numbers' ? String(startValue + i + 1) : rowLabel(startValue + i)
    }
    commit(seats.map((seat) => (replacements[seat.row] ? { ...seat, row: replacements[seat.row] } : seat)))
    setMessage('Seçili satır başları güncellendi.')
  }

  const resizeSelection = (width: number, height: number) => {
    if (selected.size === 0 || width < 8 || height < 8) return
    commit(
      seats.map((seat) => {
        if (!selected.has(seat.id)) return seat
        const centerX = seat.x + seat.width / 2
        const centerY = seat.y + seat.height / 2
        return {
          ...seat,
          width,
          height,
          x: Math.round(centerX - width / 2),
          y: Math.round(centerY - height / 2),
        }
      })
    )
  }

  const setSelectionShape = (shape: 'circle' | 'rect') => {
    if (selected.size === 0) return
    commit(seats.map((s) => (selected.has(s.id) ? { ...s, shape } : s)))
    setMessage(shape === 'circle' ? 'Seçilen koltuklar yuvarlak yapıldı.' : 'Seçilen koltuklar kare yapıldı.')
  }

  /** Her satırdaki koltukları aynı Y koordinatına alarak yayı düzleştirir. */
  const straightenSelection = () => {
    if (selected.size === 0) return
    const selectedSeats = seats.filter((s) => selected.has(s.id))
    const rowTotals: Record<string, { total: number; count: number }> = {}
    for (let i = 0; i < selectedSeats.length; i++) {
      const seat = selectedSeats[i]
      const current = rowTotals[seat.row] ?? { total: 0, count: 0 }
      rowTotals[seat.row] = { total: current.total + seat.y, count: current.count + 1 }
    }
    commit(
      seats.map((seat) => {
        if (!selected.has(seat.id)) return seat
        const row = rowTotals[seat.row]
        return { ...seat, y: Math.round(row.total / row.count), rotation: 0 }
      })
    )
    setRotationPreview(null)
    setMessage('Seçili yay sıraları düzleştirildi.')
  }

  // ---- Yay (arc) sıra -----------------------------------------------------
  const pickArcCenter = () => {
    let source = seats.filter((seat) => selected.has(seat.id))
    if (source.length === 0 && activeZoneId) {
      source = seats.filter((seat) => seat.zone === activeZoneId)
    }
    const center = centerOfSeats(source)
    if (center) {
      if (source.length > 0) {
        const rowCounts: Record<string, number> = {}
        for (let i = 0; i < source.length; i++) {
          rowCounts[source[i].row] = (rowCounts[source[i].row] ?? 0) + 1
        }
        const rowNames = Object.keys(rowCounts)
        let maxSeatsPerRow = 1
        for (let i = 0; i < rowNames.length; i++) {
          if (rowCounts[rowNames[i]] > maxSeatsPerRow) maxSeatsPerRow = rowCounts[rowNames[i]]
        }
        setArcForm((previous) => ({
          ...previous,
          rows: rowNames.length,
          seatsPerRow: maxSeatsPerRow,
          seatWidth: source[0].width,
          seatHeight: source[0].height,
        }))
      }
      setArcCenter(center)
      setTool('arc')
      setMessage('Seçimin merkezi alındı. Yay ayarlarını değiştirerek canlı önizle.')
      return
    }
    setTool('arc')
    setMessage('Yay merkezi için haritada bir noktaya tıkla.')
  }

  /** Seçili koltukları yay formuna canlı uygular. */
  const changeArcForm = (nextForm: ArcForm) => {
    setArcForm(nextForm)
    if (selected.size === 0) return

    const selectedSeats = seats.filter((seat) => selected.has(seat.id))
    // Input temizlenirken geçici olarak 0 gelebilir; mevcut grubu silme.
    if (nextForm.rows < 1 || nextForm.seatsPerRow < 1 || nextForm.seatWidth < 8 || nextForm.seatHeight < 8) {
      return
    }
    const center = arcCenter ?? centerOfSeats(selectedSeats)
    if (!center || selectedSeats.length === 0) return

    const selectedZone = activeZoneId ?? selectedSeats[0].zone ?? null
    const generated = generateArcRows({
      ...nextForm,
      centerX: center.x,
      centerY: center.y,
      type: activeCategory,
      startRowIndex: rowIndexAfter(seats.filter((seat) => !selected.has(seat.id))),
    })

    // Mevcut kimlikleri mümkün olduğunca koru; satır/koltuk sayısı artarsa yenilerini üret.
    const blockId = selectedSeats[0].blockId ?? makeBlockId()
    const updated = generated.map((seat, index) => ({
      ...seat,
      id: index < selectedSeats.length ? selectedSeats[index].id : seat.id,
      zone: selectedZone,
      blockId,
    }))
    const remaining = seats.filter((seat) => !selected.has(seat.id))
    setArcCenter(center)
    commit([...remaining, ...updated])
    setSelected(new Set(updated.map((seat) => seat.id)))
  }

  const generateArc = () => {
    if (!arcCenter) {
      setMessage('Önce haritada yay merkezini seç.')
      return
    }
    if (arcPreview.length === 0) return
    const blockId = makeBlockId()
    const withZone = arcPreview.map((seat) => ({ ...seat, blockId }))
    if (activeZoneId) {
      const zoneId = activeZoneId
      setSeatZones((prev) => {
        const next = { ...prev }
        for (let i = 0; i < withZone.length; i++) next[seatKey(withZone[i])] = zoneId
        return next
      })
    }
    commit([...seats, ...withZone])
    setArcCenter(null)
    setMessage(`${withZone.length} koltuk eklendi.`)
  }

  // ---- Arka plan ----------------------------------------------------------
  const changeBackground = (next: ChartBackground) => {
    setBackground(next)
    setDirty(true)
  }

  // ---- Fare etkileşimleri -------------------------------------------------
  const handleSeatPointerDown = (seat: SeatItem, world: WorldPoint) => {
    // Yay önizleme koltukları henüz gerçek listeye eklenmemiştir.
    if (arcPreview.some((preview) => preview.id === seat.id)) return
    if (seat.locked && (tool === 'erase' || tool === 'paint')) {
      setMessage('Satılmış koltuklar değiştirilemez.')
      return
    }
    if (seat.locked && tool === 'select') {
      setMessage('Satılmış koltuk kilitli.')
      return
    }
    if (tool === 'erase') {
      removeSeatZones([seat.id])
      commit(seats.filter((s) => s.id !== seat.id))
      return
    }
    if (tool === 'paint') {
      const targets: Iterable<string> =
        selected.has(seat.id) && selected.size > 1 ? selected : [seat.id]
      paintSeats(targets, activeCategory)
      return
    }
    if (tool !== 'select') return

    let ids: Set<string>
    if (seat.blockId) {
      ids = new Set(seats.filter((item) => item.blockId === seat.blockId).map((item) => item.id))
    } else if (selected.has(seat.id)) {
      ids = new Set(selected)
    } else {
      ids = new Set([seat.id])
    }
    setSelected(ids)
    dragRef.current = { startWorld: world, snapshot: seats, ids, moved: false }
  }

  const handleBackgroundPointerDown = (world: WorldPoint, evt: ReactPointerEvent) => {
    // 1) Şablon yerleştirme modu
    if (pendingTemplate) {
      placeTemplate(pendingTemplate, world)
      setPendingTemplate(null)
      return
    }
    if (pendingPlacement) return

    // 2) Yay merkezi seçme
    if (tool === 'arc') {
      setArcCenter({ x: snapToGrid(world.x), y: snapToGrid(world.y) })
      setMessage('Yay merkezi seçildi. Sağ panelden "Oluştur"a bas.')
      return
    }

    if (tool === 'add') {
      const newSeat: SeatItem = {
        id: makeSeatId(),
        row: nextRowLabel(seats.map((s) => s.row)),
        number: '1',
        x: snapToGrid(world.x),
        y: snapToGrid(world.y),
        width: 26,
        height: 26,
        type: activeCategory,
        shape: 'circle',
        rotation: 0,
        zone: activeZoneId ?? null,
      }
      commit([...seats, newSeat])
      return
    }

    if (tool === 'row') {
      const generated = generateRows({
        ...rowForm,
        blocks: parseBlockPattern(rowForm.blockPattern),
        numbering: rowForm.numbering,
        numberDirection: rowForm.numberDirection,
        startNumber: rowForm.startNumber,
        type: activeCategory,
        originX: snapToGrid(world.x),
        originY: snapToGrid(world.y),
        startRowIndex: rowIndexAfter(seats),
      })
      const withZone = activeZoneId
        ? generated.map((s) => ({ ...s, zone: activeZoneId }))
        : generated
      const blockId = makeBlockId()
      const blockSeats = withZone.map((seat) => ({ ...seat, blockId }))
      const overlaps = blockSeats.filter((candidate) =>
        seats.some((existing) =>
          candidate.x < existing.x + existing.width &&
          candidate.x + candidate.width > existing.x &&
          candidate.y < existing.y + existing.height &&
          candidate.y + candidate.height > existing.y
        )
      ).length
      setPendingPlacement({ seats: blockSeats, label: 'Satır bloğu', overlaps })
      setMessage(
        overlaps > 0
          ? `${overlaps} koltuk mevcut salonla çakışıyor. Başka bir konum seçin.`
          : `${withZone.length} koltuk hazırlandı. Eklemek için onay ver.`
      )
      return
    }

    if (tool === 'select') {
      const additive = evt.shiftKey
      if (!additive) setSelected(new Set())
      marqueeRef.current = { startWorld: world, additive }
      setMarquee({ x: world.x, y: world.y, width: 0, height: 0 })
    }
  }

  const handlePointerMoveWorld = (world: WorldPoint) => {
    const drag = dragRef.current
    if (drag) {
      const dx = world.x - drag.startWorld.x
      const dy = world.y - drag.startWorld.y
      if (!drag.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        drag.moved = true
        setPast((p) => [...p.slice(-49), drag.snapshot])
        setFuture([])
      }
      if (drag.moved) {
        // Grup taşınırken her koltuğu ayrı ayrı yuvarlama. Bu, koltuklar
        // arasındaki koridor ve blok boşluklarını bozuyordu.
        const anchor = drag.snapshot.find((seat) => drag.ids.has(seat.id))
        if (!anchor) return
        const groupDx = snapToGrid(anchor.x + dx) - anchor.x
        const groupDy = snapToGrid(anchor.y + dy) - anchor.y
        setSeats(
          drag.snapshot.map((s) =>
            drag.ids.has(s.id) ? { ...s, x: s.x + groupDx, y: s.y + groupDy } : s
          )
        )
        setDirty(true)
      }
      return
    }

    const mq = marqueeRef.current
    if (mq) {
      setMarquee({
        x: Math.min(mq.startWorld.x, world.x),
        y: Math.min(mq.startWorld.y, world.y),
        width: Math.abs(world.x - mq.startWorld.x),
        height: Math.abs(world.y - mq.startWorld.y),
      })
    }
  }

  const handlePointerUpWorld = () => {
    const mq = marqueeRef.current
    if (mq && marquee) {
      const hit = seatsInRect(seats, marquee)
      selectSeats(
        hit.map((s) => s.id),
        mq.additive
      )
    }
    marqueeRef.current = null
    setMarquee(null)
    dragRef.current = null
  }

  // ---- Escape ile moddan çık ---------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setPendingTemplate(null)
      setPendingPlacement(null)
      setArcCenter(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---- Klavye kısayolları -------------------------------------------------
  const actionsRef = useRef({ undo, redo, deleteSelected })
  actionsRef.current = { undo, redo, deleteSelected }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) actionsRef.current.redo()
        else actionsRef.current.undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        actionsRef.current.redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        actionsRef.current.deleteSelected()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---- JSON yedekleme / geri yükleme --------------------------------------
  const exportJson = () => {
    const document = {
      version: 1,
      name: 'Biletorg Salon Planı',
      stage,
      stagePosition,
      seats,
      categories,
      zones,
      background,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = 'biletorg-seatmap.json'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Salon JSON olarak indirildi.')
  }

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<ChartDoc> & { seats?: unknown }
        if (!Array.isArray(parsed.seats)) throw new Error('seats alanı bulunamadı')
        const importedSeats = parsed.seats.map((raw) => {
          const value = raw as Partial<SeatItem> & { id?: string }
          return {
            id: value.id || makeSeatId(),
            row: String(value.row ?? ''),
            number: String(value.number ?? ''),
            x: Number(value.x) || 0,
            y: Number(value.y) || 0,
            width: Math.max(8, Number(value.width) || 26),
            height: Math.max(8, Number(value.height) || 26),
            type: String(value.type || 'NORMAL'),
            shape: value.shape === 'rect' ? 'rect' : 'circle',
            rotation: Number(value.rotation) || 0,
            zone: value.zone ?? null,
            blockId: value.blockId ?? null,
            status: value.status,
          } satisfies SeatItem
        })
        const importedCategories = Array.isArray(parsed.categories)
          ? parsed.categories.filter((item): item is CategoryDef => Boolean(item && typeof item === 'object'))
          : categories
        const importedZones = Array.isArray(parsed.zones) ? parsed.zones : zones
        setSeats(importedSeats)
        setCategories(importedCategories.length > 0 ? importedCategories : DEFAULT_CATEGORIES)
        setZones(importedZones as ZoneDef[])
        if (parsed.stage && typeof parsed.stage === 'object') {
          const nextStage = parsed.stage as { width?: number; height?: number }
          setStage({ width: Number(nextStage.width) || 1400, height: Number(nextStage.height) || 900 })
        }
        if (parsed.stagePosition && typeof parsed.stagePosition === 'object') {
          const position = parsed.stagePosition as { x?: number; y?: number }
          setStagePosition({ x: Number(position.x) || 0, y: Number(position.y) || 0 })
        }
        if (parsed.background) setBackground(parsed.background)
        setSelected(new Set())
        setPast([])
        setFuture([])
        setDirty(true)
        setMessage(`${importedSeats.length} koltuk içe aktarıldı.`)
      } catch {
        setMessage('Geçersiz JSON. Salon değiştirilmedi.')
      }
    }
    reader.readAsText(file)
  }

  // ---- Kaydet -------------------------------------------------------------
  const handleSave = async () => {
    if (!hallId) {
      setDirty(false)
      setMessage('Deneme modunda kayıt yapılmaz.')
      return
    }
    setSaving(true)
    try {
      const currentIds = new Set(seats.map((s) => s.id))
      const savedBlockIds: Record<string, string> = {}
      for (let i = 0; i < seats.length; i++) {
        if (seats[i].blockId) savedBlockIds[seatKey(seats[i])] = seats[i].blockId as string
      }
      const deletedSeatIds = Array.from(persistedRef.current).filter((id) => !currentIds.has(id))
      const layoutDocument: StoredMeta = {
        categories,
        zones,
        background,
        seatZones,
        blockIds: savedBlockIds,
        stage,
        stagePosition,
      }
      const res = await fetch(`/api/organizer/halls/${hallId}/seats/layout-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seats: seats.map(seatToPayload),
          deletedSeatIds,
          layout: layoutDocument,
        }),
      })
      if (!res.ok) throw new Error('Kayıt başarısız')
      const data = await res.json()
      // Bölgeler veritabanında tutulmuyor; satır+numara üzerinden geri uygula.
      const mapped = ((data.seats ?? []) as ApiSeat[]).map(seatFromApi).map((s) => {
        const key = seatKey(s)
        const z = seatZones[key]
        const blockId = savedBlockIds[key]
        return {
          ...s,
          zone: z ?? s.zone ?? null,
          blockId: blockId ?? s.blockId ?? null,
        }
      })
      setSeats(mapped)
      persistedRef.current = new Set(persistedIds(mapped))
      setSelected(new Set())
      setPast([])
      setFuture([])
      setDirty(false)
      setMessage('Salon kaydedildi.')
    } catch {
      setMessage('Kayıt sırasında hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

const chart: ChartDoc = useMemo(
    () => ({
      version: 1,
      name: 'Biletorg Salon Planı',
      stage,
      stagePosition,
      seats: displaySeats,
      categories,
      zones,
      background,
    }),
    [stage, stagePosition, displaySeats, categories, zones, background]
  )

  const selectedIdsArray = useMemo(() => Array.from(selected), [selected])
  const selectedSize = useMemo(() => {
    const first = seats.find((seat) => selected.has(seat.id))
    return { width: first?.width ?? 26, height: first?.height ?? 26 }
  }, [seats, selected])
  const selectedBlockId = useMemo(() => {
    const blockIds = new Set(
      seats
        .filter((seat) => selected.has(seat.id) && seat.blockId)
        .map((seat) => seat.blockId as string)
    )
    return blockIds.size === 1 ? Array.from(blockIds)[0] : null
  }, [seats, selected])
  const selectedBlockSeatCount = useMemo(
    () => (selectedBlockId ? seats.filter((seat) => seat.blockId === selectedBlockId).length : 0),
    [seats, selectedBlockId]
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Yükleniyor…
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <EditorToolbar
        tool={tool}
        onToolChange={setTool}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
        selectionCount={selected.size}
        onDeleteSelected={deleteSelected}
        onSave={handleSave}
        saving={saving}
        dirty={dirty}
        onExportJson={exportJson}
        onImportJson={() => jsonInputRef.current?.click()}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={importJson}
      />

      <div className="flex min-h-0 flex-1">
        {/* Sol panel: şablonlar + bölgeler */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="flex border-b border-slate-200">
            <LeftTab
              active={leftTab === 'templates'}
              onClick={() => setLeftTab('templates')}
              label="Salonlar"
            />
            <LeftTab
              active={leftTab === 'zones'}
              onClick={() => setLeftTab('zones')}
              label="Bölgeler"
            />
          </div>
          <div className="min-h-0 flex-1">
            {leftTab === 'templates' ? (
              <TemplatesPanel
                onInsert={requestTemplate}
                onClearAll={clearAllSeats}
                seatCount={seats.length}
              />
            ) : (
              <ZonesPanel
                zones={zones}
                activeZoneId={activeZoneId}
                zoneCounts={zoneCounts}
                selectionCount={selected.size}
                onAddZone={addZone}
                onRemoveZone={removeZone}
                onSelectZone={selectZone}
                onSelectZoneSeats={selectZoneSeats}
                onOpenZone={openZone}
                onAssignSelection={assignZoneToSelection}
                onClearSelectionZone={clearSelectionZone}
              />
            )}
          </div>
        </aside>

        {/* Orta: harita */}
        <div className="relative min-w-0 flex-1">
          <SeatMapCanvas
            chart={chart}
            selectedIds={selectedIdsArray}
            showLabels={showLabels}
            marquee={marquee}
            panOnBackgroundDrag={tool === 'pan'}
            stageLabel="SAHNE"
            stagePosition={stagePosition}
            onStagePositionChange={setStagePosition}
            zones={zones}
            activeZoneId={activeZoneId}
            className="h-full w-full"
            onSeatPointerDown={handleSeatPointerDown}
            onBackgroundPointerDown={handleBackgroundPointerDown}
            onPointerMoveWorld={handlePointerMoveWorld}
            onPointerUpWorld={handlePointerUpWorld}
          />

          {/* Satır üretme paneli */}
          {tool === 'row' ? (
            <div className="absolute left-4 top-4 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Satır Üret</h3>
              <p className="mb-3 text-xs text-slate-500">
                Değerleri gir, sonra haritada başlangıç noktasına tıkla.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Satır"
                  value={rowForm.rows}
                  onChange={(v) => setRowForm({ ...rowForm, rows: v })}
                  min={1}
                />
                <NumberField
                  label="Koltuk/satır"
                  value={rowForm.seatsPerRow}
                  onChange={(v) => setRowForm({ ...rowForm, seatsPerRow: v })}
                  min={1}
                />
                <label className="col-span-2 flex flex-col gap-1 text-xs text-slate-600">
                  Şekil
                  <select
                    value={rowForm.shape}
                    onChange={(e) =>
                      setRowForm({ ...rowForm, shape: e.target.value as 'circle' | 'rect' })
                    }
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    <option value="circle">Yuvarlak</option>
                    <option value="rect">Kare</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedRows((value) => !value)}
                className="mt-3 flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
              >
                <span>{showAdvancedRows ? 'Gelişmiş ayarları gizle' : 'Gelişmiş ayarları göster'}</span>
                <span>{showAdvancedRows ? '−' : '+'}</span>
              </button>
              {showAdvancedRows ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                <NumberField
                  label="Yatay boşluk"
                  value={rowForm.gapX}
                  onChange={(v) => setRowForm({ ...rowForm, gapX: v })}
                  min={0}
                />
                <NumberField
                  label="Dikey boşluk"
                  value={rowForm.gapY}
                  onChange={(v) => setRowForm({ ...rowForm, gapY: v })}
                  min={0}
                />
                <NumberField
                  label="Genişlik"
                  value={rowForm.seatWidth}
                  onChange={(v) => setRowForm({ ...rowForm, seatWidth: v })}
                  min={8}
                />
                <NumberField
                  label="Yükseklik"
                  value={rowForm.seatHeight}
                  onChange={(v) => setRowForm({ ...rowForm, seatHeight: v })}
                  min={8}
                />
                <NumberField
                  label="Kavis"
                  value={rowForm.curve}
                  onChange={(v) => setRowForm({ ...rowForm, curve: v })}
                  min={-200}
                />
                <NumberField
                  label="Koridor boşluğu"
                  value={rowForm.blockGap}
                  onChange={(v) => setRowForm({ ...rowForm, blockGap: v })}
                  min={0}
                />
              </div>
              ) : null}
              {showAdvancedRows ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <NumberField
                  label="Başlangıç no"
                  value={rowForm.startNumber}
                  onChange={(v) => setRowForm({ ...rowForm, startNumber: v })}
                  min={1}
                />
                <label className="flex flex-col gap-1 text-xs text-slate-600">
                  Numara dizilimi
                  <select
                    value={rowForm.numbering}
                    onChange={(e) =>
                      setRowForm({
                        ...rowForm,
                        numbering: e.target.value as RowForm['numbering'],
                      })
                    }
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    <option value="sequential">1, 2, 3...</option>
                    <option value="odd">Sadece tek</option>
                    <option value="even">Sadece çift</option>
                    <option value="split">Sol tek / sağ çift</option>
                  </select>
                </label>
                <label className="col-span-2 flex flex-col gap-1 text-xs text-slate-600">
                  Yön
                  <select
                    value={rowForm.numberDirection}
                    onChange={(e) =>
                      setRowForm({
                        ...rowForm,
                        numberDirection: e.target.value as RowForm['numberDirection'],
                      })
                    }
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    <option value="ltr">Soldan sağa</option>
                    <option value="rtl">Sağdan sola</option>
                  </select>
                </label>
              </div>
              ) : null}
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-slate-600">
                  Blok düzeni
                  <input
                    value={rowForm.blockPattern}
                    onChange={(e) => setRowForm({ ...rowForm, blockPattern: e.target.value })}
                    placeholder="Örn. 4,4,5,2"
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                  />
                </label>
                <button
                  type="button"
                  onClick={copySelectedRowPattern}
                  disabled={selected.size === 0}
                  className="w-full rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-40"
                >
                  Seçili satırın düzenini al
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <span>Kategori:</span>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white"
                  style={{ backgroundColor: activeCategoryDef?.color }}
                >
                  {activeCategoryDef?.label}
                </span>
              </div>
            </div>
          ) : null}

          {/* Blok ekleme onayı */}
          {pendingPlacement ? (
            <div className="absolute left-1/2 top-1/2 z-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
              <h3 className="text-sm font-semibold text-slate-900">Blok eklensin mi?</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {pendingPlacement.label} için {pendingPlacement.seats.length} koltuk hazırlanıyor.
              </p>
              {pendingPlacement.overlaps > 0 ? (
                <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] leading-relaxed text-red-700">
                  {pendingPlacement.overlaps} koltuk mevcut düzenle çakışıyor. Üst üste ekleme yapılmayacak; vazgeçip haritada başka bir noktaya tıklayın.
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-500">
                  Bu konuma eklemek istediğinizden emin misiniz?
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={cancelPlacement}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={confirmPlacement}
                  disabled={pendingPlacement.overlaps > 0}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  Evet, ekle
                </button>
              </div>
            </div>
          ) : null}

          {sectionViewId ? (
            <button
              type="button"
              onClick={() => setSectionViewId(null)}
              className="absolute left-4 top-4 z-20 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
            >
              ← Tüm salonu göster
            </button>
          ) : null}

          {/* Şablon yerleştirme uyarısı */}
          {pendingTemplate ? (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-lg">
              Şablonu yerleştirmek için haritada bir noktaya tıkla (iptal: Esc)
            </div>
          ) : null}

          {/* Yay merkezi seçme uyarısı */}
          {tool === 'arc' ? (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
              Yay merkezini haritada seç
            </div>
          ) : null}

          {message ? (
            <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
              {message}
            </div>
          ) : null}
        </div>

        {/* Sağ panel: basit / kategoriler / arka plan */}
        <aside className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
          <PropertiesPanel
            showLabels={showLabels}
            onToggleLabels={setShowLabels}
            selectionCount={selected.size}
            selectionWidth={selectedSize.width}
            selectionHeight={selectedSize.height}
            selectedBlockId={selectedBlockId}
            selectedBlockSeatCount={selectedBlockSeatCount}
            rotationPreview={rotationPreview}
            onRotateSelection={rotateSelection}
            onResizeSelection={resizeSelection}
            onPreviewRotate={setRotationPreview}
            activeCategoryLabel={activeCategoryDef?.label ?? activeCategory}
            onApplyCategoryToSelection={applyCategoryToSelection}
            onRenameSelectedRows={renameSelectedRows}
            onAddSeatsToSelectedRows={addSeatsToSelectedRows}
            onSetSelectionStatus={setSelectionStatus}
            onResetSelectionRotation={resetSelectionRotation}
            onSetSelectionShape={setSelectionShape}
            onStraightenSelection={straightenSelection}
            onDissolveSelectedBlock={dissolveSelectedBlock}
            arcForm={arcForm}
            onArcFormChange={changeArcForm}
            arcCenterPicked={arcCenter !== null}
            onPickArcCenter={pickArcCenter}
            onGenerateArc={generateArc}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            onUpdateCategory={updateCategory}
            onAddCategory={addCategory}
            onRemoveCategory={removeCategory}
            categoryCounts={categoryCounts}
            background={background}
            onBackgroundChange={changeBackground}
          />
        </aside>
      </div>
    </div>
  )
}

function LeftTab({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border-b-2 py-2.5 text-xs font-medium transition ${
        active
          ? 'border-indigo-600 text-indigo-700'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
    </button>
  )
}

function NumberField({
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
    <label className="flex flex-col gap-1 text-xs text-slate-600">
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

function letterIndex(value: string): number {
  const text = value.trim().toUpperCase()
  if (!/^[A-Z]+$/.test(text)) return 0
  let result = 0
  for (let i = 0; i < text.length; i++) result = result * 26 + text.charCodeAt(i) - 64
  return Math.max(0, result - 1)
}

function parseBlockPattern(value: string): number[] | undefined {
  const blocks = value
    .split(/[;,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((count) => Number.isFinite(count) && count > 0)
    .map((count) => Math.floor(count))
  return blocks.length > 1 ? blocks : undefined
}

/** Seçili satırdaki büyük yatay boşlukları koridor olarak algılar. */
function inferBlockPattern(seats: SeatItem[]): string | null {
  if (seats.length < 2) return null
  const byRow: Record<string, SeatItem[]> = {}
  for (let i = 0; i < seats.length; i++) {
    const seat = seats[i]
    if (!byRow[seat.row]) byRow[seat.row] = []
    byRow[seat.row].push(seat)
  }
  const rowNames = Object.keys(byRow)
  if (rowNames.length !== 1) return null
  const row = byRow[rowNames[0]].slice().sort((a, b) => a.x - b.x)
  if (row.length < 2) return null

  const gaps: number[] = []
  for (let i = 1; i < row.length; i++) {
    gaps.push(row[i].x - (row[i - 1].x + row[i - 1].width))
  }
  const sortedGaps = gaps.slice().sort((a, b) => a - b)
  const normalGap = sortedGaps[Math.floor(sortedGaps.length / 2)]
  const threshold = normalGap + Math.max(14, row[0].width * 0.6)
  const blocks: number[] = []
  let count = 1
  for (let i = 0; i < gaps.length; i++) {
    if (gaps[i] > threshold) {
      blocks.push(count)
      count = 1
    } else {
      count++
    }
  }
  blocks.push(count)
  return blocks.length > 1 ? blocks.join(',') : null
}

/** Mevcut satır etiketlerinden sonraki satır indeksini hesaplar. */
function rowIndexAfter(seats: SeatItem[]): number {
  let max = -1
  for (let i = 0; i < seats.length; i++) {
    const t = seats[i].row.trim().toUpperCase()
    if (!/^[A-Z]+$/.test(t)) continue
    let v = 0
    for (const ch of t) v = v * 26 + (ch.charCodeAt(0) - 64)
    if (v - 1 > max) max = v - 1
  }
  return max + 1
}
