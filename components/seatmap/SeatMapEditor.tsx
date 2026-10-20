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
import Link from 'next/link'
import type {
  ArcForm,
  CategoryDef,
  ChartBackground,
  ChartDoc,
  EditorTool,
  SeatItem,
  SeatLayoutDocument,
  StatusBrush,
  WorldPoint,
  ZoneDef,
} from '@/lib/seatmap/types'
import { DEFAULT_CATEGORIES, applyCategory, buildCategoryMap, ensureSeatCategories, nextCategoryKey } from '@/lib/seatmap/categories'
import {
  centerOfSeats,
  generateArcRows,
  generateRows,
  isPersistedId,
  makeSeatId,
  nextRowLabel,
  rotateSeatsAround,
  rowLabel,
  snapToGrid,
} from '@/lib/seatmap/geometry'
import { buildSeatIndex, indexRectHits } from '@/lib/seatmap/spatial'
import {
  hasUnsavedSeats,
  seatFromApi,
  seatSignature,
  seatSyncMap,
  seatToPayload,
  type ApiSeat,
} from '@/lib/seatmap/adapter'
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
  /** Örnek: 28,26,24 — satır bazında toplam koltuk; doluysa "Satır" ve "Koltuk/satır" yerine geçer. */
  perRowPattern: string
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
  perRowPattern: '',
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

/** Rezerve aracının koltuğa vereceği durumun arayüz adı. */
const STATUS_BRUSH_LABEL: Record<StatusBrush, string> = {
  held: 'Tutuldu',
  unavailable: 'Bloklu',
  available: 'Satışa açık',
}

/** Yeni kategori eklerken kullanılacak renkler. */
const ADD_COLORS = ['#7c3aed', '#0284c7', '#db2777', '#65a30d', '#f59e0b', '#dc2626', '#4f46e5', '#0891b2']

/** Son düzenlemeden kaç ms sonra otomatik kayıt tetiklenir. */
const AUTOSAVE_DELAY_MS = 4000

function makeBlockId(): string {
  return `block-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`
}

/** Geri/ileri al listesi sınırlı tutulur; 10.000 koltukta kopyalar belleği şişirir. */
function pushBounded<T>(list: T[], item: T, limit: number): T[] {
  return [...(list.length >= limit ? list.slice(list.length - limit + 1) : list), item]
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
  const [activeCategory, setActiveCategory] = useState('CATEGORY_1')
  const [statusBrush, setStatusBrush] = useState<StatusBrush>('held')
  const [showLabels, setShowLabels] = useState(true)
  const [rowForm, setRowForm] = useState<RowForm>(DEFAULT_ROW_FORM)
  const [showAdvancedRows, setShowAdvancedRows] = useState(true)

  // --- Faz 2: kategoriler, bölgeler, arka plan, yay sıra -------------------
  const [categories, setCategories] = useState<CategoryDef[]>(DEFAULT_CATEGORIES)
  const [zones, setZones] = useState<ZoneDef[]>([])
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
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

  const [past, setPast] = useState<SeatItem[][]>([])
  const [future, setFuture] = useState<SeatItem[][]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(Boolean(hallId))
  const [message, setMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [autosave, setAutosave] = useState(true)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [marquee, setMarquee] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  /** Kayıtli koltukların id -> imza haritası; değişeni ve silineni bulur. */
  const syncedRef = useRef<Map<string, string>>(new Map(seatSyncMap(initialSeats ?? [])))
  const dragRef = useRef<{
    startWorld: WorldPoint
    snapshot: SeatItem[]
    ids: Set<string>
    moved: boolean
  } | null>(null)
  const marqueeRef = useRef<{
    startWorld: WorldPoint
    additive: boolean
    mode: 'select' | 'paint' | 'reserve' | 'erase'
  } | null>(null)
  const jsonInputRef = useRef<HTMLInputElement | null>(null)

  /** Kayıt bittiğinde hâlâ kaydedilmemiş bir şey var mı diye güncel durumu tutar. */
  const stateRef = useRef({ seats, categories, zones, background, stage, stagePosition })
  stateRef.current = { seats, categories, zones, background, stage, stagePosition }
  /** Son başarılı kayıtta veritabanına yazılan düzen belgesinin metni. */
  const savedLayoutRef = useRef<string>('')
  /** Kayıtta alınan geçici id -> gerçek id eşlemesi; geri alınan anlık görüntüler de çevrilir. */
  const aliasRef = useRef<Map<string, string>>(new Map())
  const saveRef = useRef<((options?: { automatic?: boolean }) => Promise<void>) | null>(null)
  /** Eşzamanlı kayıt denemelerini engeller (elle + otomatik). */
  const savingRef = useRef(false)

  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories])

  /** Yerleştirme/çakışma/çerçeve sorgularının koltuk listesini taramaması için. */
  const seatIndex = useMemo(() => buildSeatIndex(seats), [seats])

  const countOverlapsWith = (candidates: SeatItem[]): number => {
    if (seatIndex.seats.length === 0) return 0
    let overlaps = 0
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i]
      if (
        indexRectHits(seatIndex, {
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height,
        }).length > 0
      ) {
        overlaps++
      }
    }
    return overlaps
  }

  // ---- Veri yükleme (koltuklar + salon düzeni) ----------------------------
  useEffect(() => {
    if (!hallId) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    const load = async () => {
      try {
        const res = await fetch(`/api/organizer/halls/${hallId}`)
        if (!res.ok) throw new Error(res.status === 401 ? 'Oturum düşmüş, tekrar giriş yapın.' : 'Salon yüklenemedi')
        const data = await res.json()
        if (cancelled) return
        const remoteMeta = data.layoutJson && typeof data.layoutJson === 'object'
          ? (data.layoutJson as SeatLayoutDocument)
          : null
        const rawCategories =
          remoteMeta && Array.isArray(remoteMeta.categories) && remoteMeta.categories.length > 0
            ? remoteMeta.categories
            : DEFAULT_CATEGORIES
        const loadedZones = remoteMeta && Array.isArray(remoteMeta.zones) ? remoteMeta.zones : []
        const loadedBackground = remoteMeta?.background ?? DEFAULT_BACKGROUND
        const mapped = (data.seats ?? []).map(seatFromApi)
        // Koltukta tipi olup kategorisi olmayan salonlarda (eski veri, parket vb.)
        // renkler ve fiyatlar griye düşmesin diye kategoriler tamamlanır.
        const loadedCategories = ensureSeatCategories(rawCategories, mapped, true)
        const loadedStage = remoteMeta?.stage ?? {
          width: Number(data.stageWidth) || 1400,
          height: Number(data.stageHeight) || 900,
        }
        const loadedStagePosition =
          remoteMeta?.stagePosition ?? { x: Math.max(30, (loadedStage.width - 260) / 2), y: 35 }

        setCategories(loadedCategories)
        setZones(loadedZones)
        if (loadedZones.length > 0) setActiveZoneId(loadedZones[0].id)
        setBackground(loadedBackground)
        setStagePosition(loadedStagePosition)
        setSeats(mapped)
        syncedRef.current = seatSyncMap(mapped)
        aliasRef.current = new Map()
        setStage(loadedStage)
        savedLayoutRef.current = JSON.stringify({
          categories: loadedCategories,
          zones: loadedZones,
          background: loadedBackground,
          stage: loadedStage,
          stagePosition: loadedStagePosition,
        })
        setDirty(false)
      } catch (error) {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'Salon yüklenirken hata oluştu.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [hallId, reloadKey])

  // ---- Mesaj otomatik gizle ----------------------------------------------
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 2500)
    return () => clearTimeout(t)
  }, [message])

  // ---- Otomatik kayıt -----------------------------------------------------
  // Kullanıcı düzenlemeyi bıraktıktan sonra beklemeden plan veritabanına yazılır;
  // kayıt sürerken yapılan yeni değişiklikler timers yeniden kurularak korunur.
  useEffect(() => {
    if (!hallId || !autosave || !dirty || loading || loadError || saving) return
    if (pendingPlacement || pendingTemplate) return
    const t = setTimeout(() => {
      void saveRef.current?.({ automatic: true })
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [
    hallId,
    autosave,
    dirty,
    loading,
    loadError,
    saving,
    pendingPlacement,
    pendingTemplate,
    seats,
    categories,
    zones,
    background,
    stage,
    stagePosition,
  ])

  // ---- Kaydedilmemiş değişiklik varken sayfadan çıkma ---------------------
  useEffect(() => {
    if (!dirty && !saving) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty, saving])

  // ---- Geçmiş (geri/ileri al) --------------------------------------------
  const historyLimit = seats.length > 3000 ? 10 : 50

  const commit = (next: SeatItem[]) => {
    setPast((p) => pushBounded(p, seats, historyLimit))
    setFuture([])
    setSeats(next)
    setDirty(true)
  }

  /**
   * Kayıt sonrası geçici id'ler veritabanı id'lerine döner. Geri/ileri alınan
   * eski anlık görüntüler hâlâ geçici id taşıdığı için aynı eşleme uygulanır;
   * aksi halde geri alınan koltuklar yeniden create edilip mükerrer olur.
   */
  const applyIdAliases = (snapshot: SeatItem[]) => {
    if (aliasRef.current.size === 0) return snapshot
    return snapshot.map((seat) => {
      const realId = aliasRef.current.get(seat.id)
      return realId ? { ...seat, id: realId } : seat
    })
  }

  const undo = () => {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setPast(past.slice(0, -1))
    setFuture((f) => pushBounded(f, seats, historyLimit))
    setSeats(applyIdAliases(prev))
    setDirty(true)
  }

  const redo = () => {
    if (future.length === 0) return
    const next = future[future.length - 1]
    setFuture(future.slice(0, -1))
    setPast((p) => pushBounded(p, seats, historyLimit))
    setSeats(applyIdAliases(next))
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
    // 10.000 koltukta seçim başına arama yapmamak için tek geçişte haritala.
    const lockedIds = new Set(seats.filter((seat) => seat.locked).map((seat) => seat.id))
    const ids = Array.from(selected).filter((id) => !lockedIds.has(id))
    if (ids.length === 0) {
      setMessage('Satılmış koltuklar silinemez.')
      return
    }
    const idSet = new Set(ids)
    const lockedCount = selected.size - ids.length
    // Toplu silme geri alınamayacak kadar büyükse önce onay iste.
    if (ids.length > 100) {
      const ok = window.confirm(`${ids.length} koltuk silinecek. Onaylıyor musunuz?`)
      if (!ok) return
    }
    commit(seats.filter((s) => !idSet.has(s.id)))
    setSelected(new Set())
    // Seçili yay silindiğinde canlı önizleme aynı koltukları geri getirmesin.
    setArcCenter(null)
    setRotationPreview(null)
    setMessage(lockedCount > 0 ? `${ids.length} koltuk silindi; ${lockedCount} kilitli koltuk korundu.` : `${ids.length} koltuk silindi.`)
  }

  const selectAllSeats = () => {
    if (seats.length === 0) {
      setMessage('Bu salonda henüz koltuk yok.')
      return
    }
    setSelected(new Set(seats.map((seat) => seat.id)))
    setMessage(`${seats.length} koltuk seçildi.`)
  }

  const paintSeats = (ids: Iterable<string>, categoryKey: string) => {
    const idSet = new Set(ids)
    const category = categoryMap[categoryKey]
    commit(
      seats.map((s) => (idSet.has(s.id) && !s.locked ? applyCategory(s, category) : s))
    )
  }

  /** Rezerve aracı: seçili/veriilen koltuklara durum uygular (satılmış koltuklar hariç). */
  const applyStatusTo = (ids: Iterable<string>, status: StatusBrush) => {
    const idSet = new Set(ids)
    let touched = 0
    const next = seats.map((s) => {
      if (!idSet.has(s.id) || s.locked || s.status === status) return s
      touched++
      return { ...s, status }
    })
    if (touched === 0) return
    commit(next)
    setMessage(
      status === 'held'
        ? `${touched} koltuk tutuldu olarak işaretlendi.`
        : status === 'unavailable'
          ? `${touched} koltuk bloklandı.`
          : `${touched} koltuk satışa açıldı.`
    )
  }

  /** Seçili koltuklara kategorinin fiyatını ve bölüm adını yazar. */
  const applyCategoryToSeats = (list: SeatItem[]): SeatItem[] =>
    list.map((seat) => applyCategory(seat, categoryMap[seat.type]))

  /** Verilen kimlikleri siler; satılmış koltuklara dokunmaz. */
  const eraseSeats = (ids: Iterable<string>) => {
    const idSet = new Set(ids)
    let skipped = 0
    const next = seats.filter((seat) => {
      if (!idSet.has(seat.id)) return true
      if (seat.locked) {
        skipped++
        return true
      }
      return false
    })
    const removed = seats.length - next.length
    if (removed === 0) {
      if (skipped > 0) setMessage('Satılmış koltuklar silinemez.')
      return
    }
    commit(next)
    setSelected(new Set())
    setMessage(
      removed + ' koltuk silindi' + (skipped > 0 ? `; ${skipped} satılmış koltuk korundu.` : '.')
    )
  }

  // ---- Bölge (zone) -------------------------------------------------------
  const addZone = (name: string, color: string) => {
    const id = `zone-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`
    setZones((prev) => [...prev, { id, name, color }])
    setActiveZoneId(id)
  }

  const removeZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id))
    if (activeZoneId === id) setActiveZoneId(null)
    commit(seats.map((s) => (s.zone === id ? { ...s, zone: null } : s)))
  }

  const assignZoneToSelection = () => {
    if (!activeZoneId || selected.size === 0) return
    const zoneId = activeZoneId
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
    commit(seats.map((s) => (selected.has(s.id) ? { ...s, zone: null } : s)))
  }

  // ---- Kategoriler & fiyat ------------------------------------------------
  const updateCategory = (key: string, patch: Partial<CategoryDef>) => {
    const current = categoryMap[key]
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)))
    if (patch.price !== undefined || patch.label !== undefined) {
      const next = current ? { ...current, ...patch } : undefined
      commit(seats.map((s) => (s.type === key ? applyCategory(s, next) : s)))
    }
    setDirty(true)
  }

  const addCategory = () => {
    const key = nextCategoryKey(categories)
    const used = new Set(categories.map((c) => c.color.toLowerCase()))
    const color =
      ADD_COLORS.find((c) => !used.has(c.toLowerCase())) ??
      ADD_COLORS[categories.length % ADD_COLORS.length]
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
    commit(seats.map((s) => (s.type === key ? applyCategory(s, fallback) : s)))
  }

  const pruneUnusedCategories = () => {
    const used = new Set(seats.map((s) => s.type))
    const kept = categories.filter((c) => used.has(c.key))
    if (kept.length === 0 || kept.length === categories.length) return
    setCategories(kept)
    if (!used.has(activeCategory)) setActiveCategory(kept[0].key)
    setDirty(true)
    setMessage(`${categories.length - kept.length} kullanılmayan kategori kaldırıldı.`)
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
    }).map((seat) =>
      applyCategory(
        { ...seat, zone: activeZoneId ?? null, blockId: 'preview-arc' },
        categoryMap[seat.type]
      )
    )
  }, [arcCenter, arcForm, activeCategory, seats, categoryMap, activeZoneId])

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
    const placed = applyCategoryToSeats(
      built.map((s) => {
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
    )
    const overlaps = countOverlapsWith(placed)
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
    // Satılmış koltuklar planı bozmaması için her zaman korunur.
    const locked = seats.filter((seat) => seat.locked)
    const removable = seats.length - locked.length
    if (removable > 0) {
      const ok = window.confirm(
        `${removable} koltuk silinecek. Bu işlem geri alınabilir ama planınız boşalır. Onaylıyor musunuz?`
      )
      if (!ok) return
    }
    // Gerçek koltukların yanında canlı yay/şablon önizlemesini de temizle.
    setSelected(new Set())
    setArcCenter(null)
    setRotationPreview(null)
    setPendingTemplate(null)
    setPendingPlacement(null)
    if (removable > 0) commit(locked)
    else if (seats.length === 0) setDirty(true)
    setMessage(
      removable > 0
        ? `${removable} koltuk silindi${locked.length > 0 ? `; ${locked.length} satılmış koltuk korundu` : ''}.`
        : 'Bu salonda silinecek koltuk yok.'
    )
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
          price: last.price ?? null,
          sectionId: last.sectionId ?? null,
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

  const setSelectionStatus = (status: StatusBrush) => {
    if (selected.size === 0) return
    applyStatusTo(selected, status)
  }

  const handleCategoryChange = (key: string) => {
    setActiveCategory(key)
    const category = categoryMap[key]
    if (selected.size === 0) return
    commit(seats.map((seat) => (selected.has(seat.id) ? applyCategory(seat, category) : seat)))
    setMessage(`${category?.label ?? key} kategorisi seçime uygulandı.`)
  }

  const applyCategoryToSelection = () => {
    if (selected.size === 0) return
    const category = categoryMap[activeCategory]
    commit(seats.map((seat) => (selected.has(seat.id) ? applyCategory(seat, category) : seat)))
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
    const updated = generated.map((seat, index) =>
      applyCategory(
        {
          ...seat,
          id: index < selectedSeats.length ? selectedSeats[index].id : seat.id,
          zone: selectedZone,
          blockId,
        },
        categoryMap[seat.type]
      )
    )
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
  /** Kutu seçimini başlatır; koltuğun üstünde başlayan sürükleme de kutu çizebilsin diye
   *  koltuk ve arka plan indirme yollarının ikisinden de çağrılır. */
  const beginMarquee = (
    world: WorldPoint,
    evt: ReactPointerEvent,
    mode: 'select' | 'paint' | 'reserve' | 'erase'
  ) => {
    marqueeRef.current = { startWorld: world, additive: evt.shiftKey, mode }
    setMarquee({ x: world.x, y: world.y, width: 0, height: 0 })
  }

  const handleSeatPointerDown = (seat: SeatItem, world: WorldPoint, evt: ReactPointerEvent) => {
    // Yay önizleme koltukları henüz gerçek listeye eklenmemiştir.
    if (arcPreview.some((preview) => preview.id === seat.id)) return
    if (seat.locked && (tool === 'erase' || tool === 'paint' || tool === 'reserve')) {
      setMessage('Satılmış koltuklar değiştirilemez.')
      return
    }
    if (seat.locked && tool === 'select') {
      setMessage('Satılmış koltuk kilitli.')
      return
    }
    if (tool === 'erase') {
      eraseSeats([seat.id])
      beginMarquee(world, evt, 'erase')
      return
    }
    if (tool === 'paint') {
      const targets: Iterable<string> =
        selected.has(seat.id) && selected.size > 1 ? selected : [seat.id]
      paintSeats(targets, activeCategory)
      beginMarquee(world, evt, 'paint')
      return
    }
    if (tool === 'reserve') {
      // Shift ile seçili grup genişletilip tek seferde işaretlenebilir.
      const targets: Iterable<string> =
        selected.has(seat.id) && selected.size > 1 ? selected : [seat.id]
      applyStatusTo(targets, statusBrush)
      if (evt.shiftKey) selectSeats([seat.id], true)
      beginMarquee(world, evt, 'reserve')
      return
    }
    if (tool !== 'select') return

    const groupIds = seat.blockId
      ? seats.filter((item) => item.blockId === seat.blockId).map((item) => item.id)
      : [seat.id]

    if (evt.shiftKey) {
      // Shift: blok grubunu seçim listesine ekle veya çıkar.
      const next = new Set(selected)
      const alreadyIn = groupIds.every((id) => next.has(id))
      for (const id of groupIds) {
        if (alreadyIn) next.delete(id)
        else next.add(id)
      }
      setSelected(next)
      return
    }

    let ids: Set<string>
    if (seat.blockId) {
      ids = new Set(groupIds)
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
      const x = snapToGrid(world.x)
      const y = snapToGrid(world.y)
      const width = 26
      const height = 26
      const overlaps = seats.some((existing) =>
        x < existing.x + existing.width &&
        x + width > existing.x &&
        y < existing.y + existing.height &&
        y + height > existing.y
      )
      if (overlaps) {
        setMessage('Bu konumda başka bir koltuk var. Koltuğu boş bir alana ekleyin.')
        return
      }
      const newSeat: SeatItem = {
        id: makeSeatId(),
        row: nextRowLabel(seats.map((s) => s.row)),
        number: '1',
        x,
        y,
        width,
        height,
        type: activeCategory,
        shape: 'circle',
        rotation: 0,
        zone: activeZoneId ?? null,
      }
      commit([...seats, applyCategory(newSeat, categoryMap[activeCategory])])
      setMessage('Koltuk eklendi.')
      return
    }

    if (tool === 'row') {
      const generated = generateRows({
        ...rowForm,
        blocks: parseBlockPattern(rowForm.blockPattern),
        rowSeatCounts: parsePerRowPattern(rowForm.perRowPattern),
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
      const blockSeats = applyCategoryToSeats(withZone.map((seat) => ({ ...seat, blockId })))
      const overlaps = countOverlapsWith(blockSeats)
      setPendingPlacement({ seats: blockSeats, label: 'Satır bloğu', overlaps })
      setMessage(
        overlaps > 0
          ? `${overlaps} koltuk mevcut salonla çakışıyor. Başka bir konum seçin.`
          : `${withZone.length} koltuk hazırlandı. Eklemek için onay ver.`
      )
      return
    }

    if (tool === 'select' || tool === 'paint' || tool === 'reserve' || tool === 'erase') {
      const additive = evt.shiftKey
      if (tool === 'select' && !additive) setSelected(new Set())
      beginMarquee(world, evt, tool)
    }
  }

  const handlePointerMoveWorld = (world: WorldPoint) => {
    const drag = dragRef.current
    if (drag) {
      const dx = world.x - drag.startWorld.x
      const dy = world.y - drag.startWorld.y
      if (!drag.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        drag.moved = true
        setPast((p) => pushBounded(p, drag.snapshot, historyLimit))
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

  const handlePointerUpWorld = (world: WorldPoint) => {
    const mq = marqueeRef.current
    if (mq) {
      // Bırakma anındaki konum kullanılır; kare başına güncellenen state geride kalabilir.
      const rect = {
        x: Math.min(mq.startWorld.x, world.x),
        y: Math.min(mq.startWorld.y, world.y),
        width: Math.abs(world.x - mq.startWorld.x),
        height: Math.abs(world.y - mq.startWorld.y),
      }
      // Koltuğun üstünde başlayan kutu tek tıkla bittiyse fırça indirme anında
      // zaten uygulandı; kutuyu bir kez daha uygulamak ikinci bir geri al adımı açar.
      const isClick = rect.width <= 1 && rect.height <= 1
      const ids = indexRectHits(seatIndex, rect).map((s) => s.id)
      if (mq.mode === 'select') {
        selectSeats(ids, mq.additive)
      } else if (ids.length > 0 && !isClick) {
        // Sürüklemenin hangi araca ait olduğu araç değişse bile korunur.
        if (mq.mode === 'paint') paintSeats(ids, activeCategory)
        else if (mq.mode === 'reserve') applyStatusTo(ids, statusBrush)
        else eraseSeats(ids)
      }
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
  const actionsRef = useRef({ undo, redo, deleteSelected, selectAllSeats })
  actionsRef.current = { undo, redo, deleteSelected, selectAllSeats }

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
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        actionsRef.current.selectAllSeats()
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
      name: 'kurdevents.org Salon Planı',
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
    link.download = 'kurdevents-seatmap.json'
    link.click()
    URL.revokeObjectURL(url)
    setMessage('Salon JSON olarak indirildi.')
  }

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (seats.length > 0) {
      const ok = window.confirm(
        `İçe aktarma mevcut plandaki ${seats.length} koltuğun yerini alır. Devam edilsin mi?`
      )
      if (!ok) return
    }
    const previousSeats = seats
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<ChartDoc> & { seats?: unknown }
        if (!Array.isArray(parsed.seats)) throw new Error('seats alanı bulunamadı')
        const importedSeats = parsed.seats.map((raw) => {
          const value = raw as Partial<SeatItem> & { id?: string }
          return {
            // Dosyadaki id'ler bu salona ait olmayabilir; hepsi yeni koltuk olarak eklenir.
            id: makeSeatId(),
            row: String(value.row ?? ''),
            number: String(value.number ?? ''),
            x: Number(value.x) || 0,
            y: Number(value.y) || 0,
            width: Math.max(8, Number(value.width) || 26),
            height: Math.max(8, Number(value.height) || 26),
            type: String(value.type || 'CATEGORY_1'),
            price: Number.isFinite(value.price as number) ? (value.price as number) : null,
            sectionId: value.sectionId ?? null,
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
        const nextCategories = ensureSeatCategories(
          importedCategories.length > 0 ? importedCategories : DEFAULT_CATEGORIES,
          importedSeats,
          true,
        )
        const importedMap = buildCategoryMap(nextCategories)
        // Fiyat ve bölüm adı her zaman kategori listesinden türetilir.
        setSeats(importedSeats.map((seat) => applyCategory(seat, importedMap[seat.type])))
        setCategories(nextCategories)
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
        // Dışa aktarılan plan tek adımda geri alınabilir.
        setPast([previousSeats])
        setFuture([])
        setDirty(true)
        setMessage(`${importedSeats.length} koltuk içe aktarıldı. (Geri almak için Ctrl+Z)`)
      } catch {
        setMessage('Geçersiz JSON. Salon değiştirilmedi.')
      }
    }
    reader.readAsText(file)
  }

  // ---- Kaydet -------------------------------------------------------------
  /** Kayıttan sonra planda veritabanından farklı bir şey kaldı mı? */
  const computeDirty = () => {
    const current = stateRef.current
    const layoutChanged =
      JSON.stringify({
        categories: current.categories,
        zones: current.zones,
        background: current.background,
        stage: current.stage,
        stagePosition: current.stagePosition,
      }) !== savedLayoutRef.current
    return layoutChanged || hasUnsavedSeats(current.seats, syncedRef.current)
  }

  const handleSave = async (options?: { automatic?: boolean }) => {
    if (!hallId) {
      setDirty(false)
      setMessage('Deneme modunda kayıt yapılmaz.')
      return
    }
    if (savingRef.current) return
    // Otomatik kayıt sırasında kullanıcının yaptığı yeni değişiklik sessizce
    // düşmesin: kayıt bitince tekrar zamanlanır.
    const automatic = Boolean(options?.automatic)
    if (automatic && !dirty) return
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      const currentIds = new Set(seats.map((s) => s.id))
      const deletedSeatIds = Array.from(syncedRef.current.keys()).filter((id) => !currentIds.has(id))
      // Yalnız veritabanındaki imzasından farklı olan koltuklar gönderilir;
      // 10.000 koltukluk salonda tek bir değişiklik tüm listayı yeniden yazdırmaz.
      const dirty: SeatItem[] = []
      let hasNewSeat = false
      for (const seat of seats) {
        const signature = seatSignature(seat)
        if (syncedRef.current.get(seat.id) === signature) continue
        dirty.push(seat)
        if (!isPersistedId(seat.id)) hasNewSeat = true
      }
      const layoutDocument: SeatLayoutDocument = {
        categories,
        zones,
        background,
        stage,
        stagePosition,
      }
      const res = await fetch(`/api/organizer/halls/${hallId}/seats/layout-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seats: dirty.map(seatToPayload),
          deletedSeatIds,
          layout: layoutDocument,
          response: 'summary',
          mode: hasNewSeat ? 'full' : 'partial',
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const base = data?.error || `Kayıt başarısız (${res.status})`
        throw new Error(data?.details ? `${base} — ${data.details}` : base)
      }

      if (data?.responseMode !== 'summary') {
        const mapped = ((data?.seats ?? []) as ApiSeat[]).map(seatFromApi)
        setSeats(mapped)
        syncedRef.current = seatSyncMap(mapped)
        setSelected(new Set())
        setPast([])
        setFuture([])
        setDirty(false)
        setMessage('Salon kaydedildi.')
        return
      }

      // Özet yanıt: tüm liste sunucudan gelmez, yerel liste değişenlerle
      // birleştirilir. 10.000 koltukta yeniden boyama yerine tek geçiş olur.
      const locked = new Set<string>((data.lockedSeatIds ?? []) as string[])
      const dirtyIds = new Set(dirty.map((seat) => seat.id))
      const createdById = new Map<string, { id: string; row: string; number: string }>(
        ((data.createdSeats ?? []) as { tempId: string; id: string; row: string; number: string }[]).map((c) => [
          c.tempId,
          c,
        ])
      )
      const revertedById = new Map<string, { row: string; number: string }>(
        ((data.reverted ?? []) as { id: string; row: string; number: string }[]).map((r) => [r.id, r])
      )
      let changed = 0
      const merged: SeatItem[] = seats.map((seat) => {
        // Kısmi kayıtta satılmış koltuk listesi yalnız gönderilenleri kapsar.
        if (data.mode === 'partial' && !dirtyIds.has(seat.id)) return seat
        const created = createdById.get(seat.id)
        const reverted = revertedById.get(seat.id)
        const id = created ? created.id : seat.id
        const row = created ? created.row : reverted ? reverted.row : seat.row
        const number = created ? created.number : reverted ? reverted.number : seat.number
        if (id === seat.id && row === seat.row && number === seat.number && seat.locked === locked.has(id)) {
          return seat
        }
        changed++
        return { ...seat, id, row, number, locked: locked.has(id) }
      })
      const revived = ((data.keptDeletedSeats ?? []) as ApiSeat[]).map(seatFromApi)
      // Kısmi kayıtta gönderilmeyen koltuklar yerel listedir; silinmiş sayılıp
      // geri gelen satılmış koltuklar yeniden eklenince mükerrer olur.
      const revivedIds = new Set(revived.map((seat) => seat.id))
      const kept = revived.length > 0 ? merged.filter((seat) => !revivedIds.has(seat.id)) : merged

      const nextSynced = new Map(syncedRef.current)
      for (const id of deletedSeatIds) nextSynced.delete(id)
      for (const seat of dirty) {
        const created = createdById.get(seat.id)
        const reverted = revertedById.get(seat.id)
        const id = created ? created.id : seat.id
        const signed = reverted ? { ...seat, row: reverted.row, number: reverted.number } : seat
        nextSynced.set(id, seatSignature(signed))
      }
      for (const seat of revived) nextSynced.set(seat.id, seatSignature(seat))
      syncedRef.current = nextSynced
      savedLayoutRef.current = JSON.stringify(layoutDocument)
      createdById.forEach((created, tempId) => aliasRef.current.set(tempId, created.id))

      if (changed > 0 || revived.length > 0) {
        setSeats(revived.length > 0 ? [...kept, ...revived] : merged)
      }
      setSelected(new Set())
      // Kayıt sürerken yapılan düzenlemeler kaybolmasın: kirliliği yeniden say.
      const remaining = computeDirty()
      setDirty(remaining)
      setSavedAt(Date.now())
      const conflictCount = ((data.keyConflicts ?? []) as unknown[]).length
      if (!automatic) {
        setMessage(
          remaining
            ? 'Kaydedildi, planda kaydedilmemiş değişiklik var.'
            : conflictCount > 0
              ? `Salon kaydedildi. ${conflictCount} koltuğun satır/numarası, aynı numarayı kullanan başka koltuk olduğu için çakışmayacak şekilde düzenlendi.`
              : revertedById.size > 0 || revived.length > 0
                ? 'Salon kaydedildi. Satılan koltukların yeri ve numarası korunur.'
                : 'Salon kaydedildi.'
        )
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Kayıt sırasında hata oluştu.'
      setSaveError(text)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  saveRef.current = handleSave

const chart: ChartDoc = useMemo(
    () => ({
      version: 1,
      name: 'kurdevents.org Salon Planı',
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

  // Rozet yalnızca son kayıt saatini taşır; kirlilik ve kayıt durumu zaten
  // soldaki uyarıda ve Kaydet düğmesinde görünüyor.
  const autosaveLabel = !dirty && !saving && savedAt ? `Son kayıt ${new Date(savedAt).toLocaleTimeString('tr-TR')}` : ''

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Yükleniyor…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <p className="text-sm font-semibold text-red-700">{loadError}</p>
        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
          Salon planı sunucudan alınamadı; düzenleme yapmadan önce bağlantıyı ve oturumu kontrol edin.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Tekrar dene
          </button>
          <Link
            href="/organizer/halls"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Salon listesine dön
          </Link>
        </div>
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
        statusBrush={statusBrush}
        onStatusBrushChange={setStatusBrush}
        showLabels={showLabels}
        onToggleLabels={setShowLabels}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={undo}
        onRedo={redo}
        selectionCount={selected.size}
        onSelectAll={selectAllSeats}
        onDeleteSelected={deleteSelected}
        onSave={() => void handleSave()}
        saving={saving}
        dirty={dirty}
        autosave={autosave}
        onAutosaveChange={setAutosave}
        autosaveLabel={autosaveLabel}
        onExportJson={exportJson}
        onImportJson={() => jsonInputRef.current?.click()}
      />
      {saveError ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800">
          <span>Kayıt edilemedi: {saveError}</span>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-md border border-red-300 bg-white px-2.5 py-1 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Yeniden dene
          </button>
        </div>
      ) : null}
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
            onStagePositionChange={(position) => {
              setStagePosition(position)
              setDirty(true)
            }}
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
                <label className="block text-xs text-slate-600">
                  Satır bazında koltuk
                  <input
                    value={rowForm.perRowPattern}
                    onChange={(e) => setRowForm({ ...rowForm, perRowPattern: e.target.value })}
                    placeholder="Örn. 28,26,24"
                    className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                  />
                  <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                    Her satıra kaç koltuk düşeceğini aralıkla yaz. Bu alan doluyken yukarıdaki
                    satır ve koltuk/satır değerleri geçersiz kalır; blok düzeni yazıldıysa
                    koltuklar koridorlara oranla paylaştırılır.
                  </span>
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

          {(tool === 'reserve' || tool === 'paint' || tool === 'erase') ? (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
              {tool === 'reserve'
                ? `Rezerve aracı: tıkla veya sürükleyerek kutu çiz (${STATUS_BRUSH_LABEL[statusBrush]})`
                : tool === 'paint'
                  ? 'Boya aracı: tıkla veya sürükleyerek kutu çiz'
                  : 'Silme aracı: tıkla veya sürükleyerek kutu çiz'}
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
            onPruneUnusedCategories={pruneUnusedCategories}
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

/** Satır bazlı koltuk adetlerini okur: "28,26,24" veya "28;26;24". */
function parsePerRowPattern(value: string): number[] | undefined {
  const counts = value
    .split(/[;,\s]+/)
    .filter((part) => part.trim() !== '')
    .map((part) => Number(part.trim()))
    .map((count) => (Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0))
  return counts.length > 0 ? counts : undefined
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
