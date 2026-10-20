'use client'
// Ortak koltuk haritası render motoru (v4).
// Hem editör (düzenleme) hem de müşteri (seçim) tarafı bu bileşeni kullanır.
// 5.000-10.000 koltukta akıcı kalması için: görünen alan kırpılır, çok sayıda
// koltuk göründüğünde koltuk başına DOM düğümü yerine stil bazlı toplu <path> çizilir.

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import type {
  BackgroundFit,
  CategoryDef,
  ChartDoc,
  SeatItem,
  WorldPoint,
  ZoneDef,
} from '@/lib/seatmap/types'
import { buildCategoryMap, getCategory } from '@/lib/seatmap/categories'
import { computeBounds, type Bounds } from '@/lib/seatmap/geometry'
import { buildSeatIndex, indexPointHit, indexRectHits } from '@/lib/seatmap/spatial'

/** ChartBackground.fit -> SVG preserveAspectRatio eşlemesi. */
function preserveForFit(fit: BackgroundFit | undefined): string {
  switch (fit) {
    case 'cover':
      return 'xMidYMid slice'
    case 'fill':
      return 'none'
    case 'none':
      return 'xMinYMin meet'
    default:
      return 'xMidYMid meet'
  }
}

const MIN_SCALE = 0.05
const MAX_SCALE = 8
const CLICK_SLOP = 4
/** Bu sayıdan fazla koltuk göründüğünde toplu (batch) çizime geçilir. */
const BATCH_LIMIT = 900
/** Kırpmada ekran kenarına eklenen dünya boşluğu; hızlı sürüklemede boşluk görünmez. */
const CULL_MARGIN = 120
/** Bu genişliğin altındaki ekranda koltuklar dokunmatik için yakın gösterilir. */
const NARROW_VIEWPORT = 640
/** Dar ekranda bir koltuğun ekranda kaplayacağı en küçük genişlik (px). */
const MIN_SEAT_PX = 30

interface Transform {
  scale: number
  tx: number
  ty: number
}

export interface SeatMapCanvasProps {
  chart: ChartDoc
  /** Seçili koltuk kimlikleri. */
  selectedIds?: string[]
  /** Satılamaz koltuklar (satıldı / kapalı). */
  unavailableIds?: string[]
  /** Geçici olarak tutulmuş koltuklar. */
  heldIds?: string[]
  showLabels?: boolean
  /** Arka plan sürüklemesi haritayı kaydırsın mı? */
  panOnBackgroundDrag?: boolean
  /** Çizilecek seçim çerçevesi (dünya koordinatları). */
  marquee?: { x: number; y: number; width: number; height: number } | null
  stageLabel?: string
  /** Sahnenin dünya koordinatındaki konumu. Sürüklenebilir. */
  stagePosition?: { x: number; y: number }
  onStagePositionChange?: (position: { x: number; y: number }) => void
  /** Bölgeler (zone) — haritada kesikli çerçeve olarak gösterilir. */
  zones?: ZoneDef[]
  /** Vurgulanacak bölge kimliği. */
  activeZoneId?: string | null
  backgroundImage?: string | null
  backgroundOpacity?: number
  className?: string
  onSeatClick?: (seat: SeatItem) => void
  onBackgroundClick?: (point: WorldPoint) => void
  onSeatPointerDown?: (seat: SeatItem, point: WorldPoint, evt: ReactPointerEvent) => void
  onBackgroundPointerDown?: (point: WorldPoint, evt: ReactPointerEvent) => void
  /** Sürükleme sırasında kare başına en fazla bir kez gelir (rAF ile biriktirilir). */
  onPointerMoveWorld?: (point: WorldPoint) => void
  /** Bırakma anındaki kesin konum; bekleyen hareketler bundan önce iletilir. */
  onPointerUpWorld?: (point: WorldPoint) => void
}

interface SeatVisual {
  fill: string
  stroke: string
  strokeWidth: number
}

interface SeatGlyphProps {
  seat: SeatItem
  visual: SeatVisual
  showLabel: boolean
  labelColor: string
}

const SeatGlyph = memo(function SeatGlyph({
  seat,
  visual,
  showLabel,
  labelColor,
}: SeatGlyphProps) {
  const cx = seat.x + seat.width / 2
  const cy = seat.y + seat.height / 2
  const radius = Math.min(seat.width, seat.height) / 2
  const transform = seat.rotation ? `rotate(${seat.rotation} ${cx} ${cy})` : undefined

  return (
    <g transform={transform}>
      {seat.shape === 'circle' ? (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={visual.fill}
          stroke={visual.stroke}
          strokeWidth={visual.strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          x={seat.x}
          y={seat.y}
          width={seat.width}
          height={seat.height}
          rx={3}
          fill={visual.fill}
          stroke={visual.stroke}
          strokeWidth={visual.strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {showLabel ? (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={labelColor}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {seat.number}
        </text>
      ) : null}
    </g>
  )
})

function circleSubpath(seat: SeatItem): string {
  const r = Math.min(seat.width, seat.height) / 2
  const cx = seat.x + seat.width / 2
  const cy = seat.y + seat.height / 2
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`
}

function rectSubpath(seat: SeatItem): string {
  if (!seat.rotation) {
    return `M${seat.x} ${seat.y}h${seat.width}v${seat.height}h${-seat.width}z`
  }
  const cx = seat.x + seat.width / 2
  const cy = seat.y + seat.height / 2
  const hw = seat.width / 2
  const hh = seat.height / 2
  const rad = (seat.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const corner = (dx: number, dy: number) =>
    `${(cx + dx * cos - dy * sin).toFixed(1)} ${(cy + dx * sin + dy * cos).toFixed(1)}`
  return `M${corner(-hw, -hh)}L${corner(hw, -hh)}L${corner(hw, hh)}L${corner(-hw, hh)}z`
}

interface BatchGroup {
  fill: string
  stroke: string
  strokeWidth: number
  d: string
}

/** Koltuğun kategori rengini bastırmayan, çok hafif gri konturu. */
const SEAT_BASE_STROKE = '#cbd5e1'
const SEAT_BASE_STROKE_WIDTH = 0.75

function buildBatches(
  seats: SeatItem[],
  categoryMap: Record<string, CategoryDef>,
  selectedSet: Set<string>,
  unavailableSet: Set<string>,
  heldSet: Set<string>
): BatchGroup[] {
  const groups = new Map<string, { visual: SeatVisual; shape: string; parts: string[] }>()

  for (let i = 0; i < seats.length; i++) {
    const seat = seats[i]
    const category = categoryMap[seat.type] ?? getCategory(seat.type)
    const isUnavailable =
      unavailableSet.has(seat.id) ||
      seat.status === 'unavailable' ||
      seat.status === 'blocked' ||
      seat.locked
    const isSelected = selectedSet.has(seat.id)
    const isHeld = heldSet.has(seat.id) || seat.status === 'held'

    const visual: SeatVisual = { fill: category.color, stroke: SEAT_BASE_STROKE, strokeWidth: SEAT_BASE_STROKE_WIDTH }
    if (seat.locked) {
      visual.fill = '#94a3b8'
      visual.stroke = '#334155'
      visual.strokeWidth = 2
    } else if (isUnavailable) {
      visual.fill = '#d1d5db'
      visual.stroke = '#9ca3af'
    } else if (isSelected) {
      visual.stroke = '#ea580c'
      visual.strokeWidth = 3
    } else if (isHeld) {
      visual.fill = '#fde68a'
      visual.stroke = '#d97706'
    }

    const key = `${visual.fill}|${visual.stroke}|${visual.strokeWidth}|${seat.shape}`
    let group = groups.get(key)
    if (!group) {
      group = { visual, shape: seat.shape, parts: [] }
      groups.set(key, group)
    }
    group.parts.push(seat.shape === 'circle' ? circleSubpath(seat) : rectSubpath(seat))
  }

  return Array.from(groups.values(), (group) => ({
    fill: group.visual.fill,
    stroke: group.visual.stroke,
    strokeWidth: group.visual.strokeWidth,
    d: group.parts.join(''),
  }))
}

export default function SeatMapCanvas({
  chart,
  selectedIds,
  unavailableIds,
  heldIds,
  showLabels = false,
  panOnBackgroundDrag = false,
  marquee = null,
  stagePosition = { x: 580, y: 35 },
  onStagePositionChange,
  zones,
  activeZoneId = null,
  backgroundImage = null,
  backgroundOpacity = 0.35,
  className,
  stageLabel,
  onSeatClick,
  onBackgroundClick,
  onSeatPointerDown,
  onBackgroundPointerDown,
  onPointerMoveWorld,
  onPointerUpWorld,
}: SeatMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState<Transform>({ scale: 1, tx: 0, ty: 0 })
  const fittedRef = useRef(false)

  /** En son hesaplanan dönüş; olaylar içinde state'in bir kare gerisinden okunmaz. */
  const transformRef = useRef<Transform>(transform)
  const transformRafRef = useRef<number | null>(null)

  const panRef = useRef<{ startX: number; startY: number; scale: number; tx: number; ty: number } | null>(
    null
  )
  const stageDragRef = useRef<{
    startWorld: WorldPoint
    startPosition: { x: number; y: number }
  } | null>(null)
  const downRef = useRef<{ seat: SeatItem | null; x: number; y: number; moved: boolean } | null>(
    null
  )

  const worldRafRef = useRef<number | null>(null)
  const pendingWorldRef = useRef<WorldPoint | null>(null)

  const selectedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds])
  const unavailableSet = useMemo(() => new Set(unavailableIds ?? []), [unavailableIds])
  const heldSet = useMemo(() => new Set(heldIds ?? []), [heldIds])
  const categoryMap = useMemo(() => buildCategoryMap(chart.categories), [chart.categories])
  const seatIndex = useMemo(() => buildSeatIndex(chart.seats), [chart.seats])

  const moveWorldRef = useRef(onPointerMoveWorld)
  moveWorldRef.current = onPointerMoveWorld
  const upWorldRef = useRef(onPointerUpWorld)
  upWorldRef.current = onPointerUpWorld
  const stageMoveRef = useRef(onStagePositionChange)
  stageMoveRef.current = onStagePositionChange

  // Arka plan: yeni chart.background varsa onu, yoksa eski prop'ları kullan.
  const bg = chart.background ?? {
    image: backgroundImage,
    opacity: backgroundOpacity,
    fit: 'contain' as BackgroundFit,
  }

  const commitTransform = useCallback((next: Transform) => {
    transformRef.current = next
    if (transformRafRef.current !== null) return
    transformRafRef.current = requestAnimationFrame(() => {
      transformRafRef.current = null
      setTransform(transformRef.current)
    })
  }, [])

  const flushTransform = useCallback(() => {
    if (transformRafRef.current === null) return
    cancelAnimationFrame(transformRafRef.current)
    transformRafRef.current = null
    setTransform(transformRef.current)
  }, [])

  // Konteyner boyutunu izle.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(
    () => () => {
      if (transformRafRef.current !== null) cancelAnimationFrame(transformRafRef.current)
      if (worldRafRef.current !== null) cancelAnimationFrame(worldRafRef.current)
    },
    []
  )

  const fit = useCallback(() => {
    if (size.width === 0 || size.height === 0) return
    const bounds = computeBounds(chart.seats) ?? {
      minX: 0,
      minY: 0,
      width: Math.max(chart.stage.width, 1),
      height: Math.max(chart.stage.height, 1),
    }
    const pad = 56
    const bw = Math.max(bounds.width, 1)
    const bh = Math.max(bounds.height, 1)
    const rawScale = Math.min((size.width - pad * 2) / bw, (size.height - pad * 2) / bh)
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, rawScale))

    // Dar ekranda tüm haritayı sığdırmak koltuğu parmakla basılamaz hale getiriyor:
    // koltuk ~MIN_SEAT_PX olacak kadar yakın başlanır, kullanıcı sürükleyerek gezer.
    const seatWidth = chart.seats[0]?.width ?? 0
    if (size.width < NARROW_VIEWPORT && seatWidth > 0) {
      const comfortable = Math.min(MAX_SCALE, Math.max(scale, MIN_SEAT_PX / seatWidth))
      if (comfortable > scale) {
        const near = { scale: comfortable, tx: pad - bounds.minX * comfortable, ty: pad - bounds.minY * comfortable }
        transformRef.current = near
        setTransform(near)
        return
      }
    }

    const next = {
      scale,
      tx: (size.width - bw * scale) / 2 - bounds.minX * scale,
      ty: (size.height - bh * scale) / 2 - bounds.minY * scale,
    }
    transformRef.current = next
    setTransform(next)
  }, [chart.seats, chart.stage.width, chart.stage.height, size.width, size.height])

  // İlk boyut geldiğinde otomatik sığdır.
  useEffect(() => {
    if (size.width > 0 && size.height > 0 && !fittedRef.current) {
      fit()
      fittedRef.current = true
    }
  }, [size.width, size.height, fit])

  // Tekerlek ile yakınlaştırma (pasif olmayan dinleyici gerekir).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      const t = transformRef.current
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
      const k = scale / t.scale
      commitTransform({ scale, tx: px - (px - t.tx) * k, ty: py - (py - t.ty) * k })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [commitTransform])

  const localPoint = useCallback((clientX: number, clientY: number): WorldPoint => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const screenToWorld = useCallback((p: WorldPoint): WorldPoint => {
    const t = transformRef.current
    return { x: (p.x - t.tx) / t.scale, y: (p.y - t.ty) / t.scale }
  }, [])

  const emitWorld = useCallback((point: WorldPoint) => {
    pendingWorldRef.current = point
    if (worldRafRef.current !== null) return
    worldRafRef.current = requestAnimationFrame(() => {
      worldRafRef.current = null
      const pending = pendingWorldRef.current
      pendingWorldRef.current = null
      if (pending) moveWorldRef.current?.(pending)
    })
  }, [])

  /** Bekleyen hareketi hemen iletir; bırakma olayı bu noktadan sonra gelir. */
  const flushWorld = useCallback(() => {
    if (worldRafRef.current !== null) {
      cancelAnimationFrame(worldRafRef.current)
      worldRafRef.current = null
    }
    const pending = pendingWorldRef.current
    pendingWorldRef.current = null
    if (pending) moveWorldRef.current?.(pending)
  }, [])

  // Görünür alandaki koltuklar; dışarıdakiler DOM'a hiç girmez.
  const visibleSeats = useMemo(() => {
    if (size.width === 0 || size.height === 0) return chart.seats
    const { scale, tx, ty } = transform
    return indexRectHits(seatIndex, {
      x: (-CULL_MARGIN - tx) / scale,
      y: (-CULL_MARGIN - ty) / scale,
      width: (size.width + CULL_MARGIN * 2) / scale,
      height: (size.height + CULL_MARGIN * 2) / scale,
    })
  }, [seatIndex, chart.seats, transform, size.width, size.height])

  const useBatch = visibleSeats.length > BATCH_LIMIT
  const batches = useMemo(
    () =>
      useBatch
        ? buildBatches(visibleSeats, categoryMap, selectedSet, unavailableSet, heldSet)
        : [],
    [useBatch, visibleSeats, categoryMap, selectedSet, unavailableSet, heldSet]
  )

  // Bölgelerin sınırlayıcı kutuları: tek geçişte zone bazında toplanır.
  const zoneBoxes = useMemo(() => {
    if (!zones || zones.length === 0) return []
    const byZone = new Map<string, SeatItem[]>()
    for (let i = 0; i < chart.seats.length; i++) {
      const seat = chart.seats[i]
      if (!seat.zone) continue
      const list = byZone.get(seat.zone)
      if (list) list.push(seat)
      else byZone.set(seat.zone, [seat])
    }
    const boxes: { zone: ZoneDef; bounds: Bounds }[] = []
    for (let i = 0; i < zones.length; i++) {
      const bounds = computeBounds(byZone.get(zones[i].id) ?? [])
      if (bounds) boxes.push({ zone: zones[i], bounds })
    }
    return boxes
  }, [zones, chart.seats])

  // Satır başlıkları: her satırın (blok başına) en solundaki koltuğun dışına yazılır.
  const rowHeaders = useMemo(() => {
    if (!showLabels) return []
    const byKey = new Map<string, { row: string; x: number; y: number }>()
    for (let i = 0; i < visibleSeats.length; i++) {
      const seat = visibleSeats[i]
      const key = `${seat.row}::${seat.blockId ?? ''}`
      const current = byKey.get(key)
      if (!current || seat.x < current.x) {
        byKey.set(key, { row: seat.row, x: seat.x, y: seat.y + seat.height / 2 })
      }
    }
    return Array.from(byKey.values()).slice(0, 400)
  }, [showLabels, visibleSeats])

  const handleStagePointerDown = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!stageMoveRef.current) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    stageDragRef.current = {
      startWorld: screenToWorld(localPoint(e.clientX, e.clientY)),
      startPosition: stagePosition,
    }
  }

  const handleStagePointerMove = (e: ReactPointerEvent<SVGRectElement>) => {
    const drag = stageDragRef.current
    if (!drag || !stageMoveRef.current) return
    e.stopPropagation()
    const world = screenToWorld(localPoint(e.clientX, e.clientY))
    stageMoveRef.current({
      x: Math.round(drag.startPosition.x + world.x - drag.startWorld.x),
      y: Math.round(drag.startPosition.y + world.y - drag.startWorld.y),
    })
  }

  const handleStagePointerUp = (e: ReactPointerEvent<SVGRectElement>) => {
    e.stopPropagation()
    stageDragRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const handlePointerDown = (e: ReactPointerEvent) => {
    if (e.button === 2) return
    const el = containerRef.current
    if (el) el.setPointerCapture(e.pointerId)

    flushTransform()
    const lp = localPoint(e.clientX, e.clientY)
    const world = screenToWorld(lp)
    const seat = indexPointHit(seatIndex, world.x, world.y)
    downRef.current = { seat, x: lp.x, y: lp.y, moved: false }

    // Orta fare her zaman pan yapar. Kaydır modunda sol fare/parmak da pan yapar;
    // dokunmatikte koltuğun üstünden sürüklemek de kaydırır, dokunma seçimi bozmaz.
    const shouldPan = e.button === 1 || (panOnBackgroundDrag && e.button === 0)
    if (shouldPan && (!seat || e.pointerType === 'touch')) {
      const t = transformRef.current
      panRef.current = { startX: lp.x, startY: lp.y, scale: t.scale, tx: t.tx, ty: t.ty }
      if (!seat) return
    }

    if (seat) {
      onSeatPointerDown?.(seat, world, e)
    } else {
      onBackgroundPointerDown?.(world, e)
    }
  }

  const handlePointerMove = (e: ReactPointerEvent) => {
    const lp = localPoint(e.clientX, e.clientY)
    const d = downRef.current
    if (d && (Math.abs(lp.x - d.x) > CLICK_SLOP || Math.abs(lp.y - d.y) > CLICK_SLOP)) {
      d.moved = true
    }

    const pan = panRef.current
    if (pan) {
      const t = transformRef.current
      commitTransform({
        scale: t.scale,
        tx: pan.tx + (lp.x - pan.startX),
        ty: pan.ty + (lp.y - pan.startY),
      })
    }

    emitWorld(screenToWorld(lp))
  }

  const handlePointerUp = (e: ReactPointerEvent) => {
    const el = containerRef.current
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)

    flushTransform()
    const lp = localPoint(e.clientX, e.clientY)
    const world = screenToWorld(lp)
    const d = downRef.current

    if (d && !d.moved) {
      if (d.seat) onSeatClick?.(d.seat)
      else onBackgroundClick?.(world)
    }

    downRef.current = null
    panRef.current = null
    flushWorld()
    upWorldRef.current?.(world)
  }

  const zoomBy = (factor: number) => {
    const cx = size.width / 2
    const cy = size.height / 2
    const t = transformRef.current
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
    const k = scale / t.scale
    commitTransform({ scale, tx: cx - (cx - t.tx) * k, ty: cy - (cy - t.ty) * k })
  }

  const labelSize = 8.5 / transform.scale
  const stageFontSize = 18 / transform.scale

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-slate-50 ${panOnBackgroundDrag ? 'cursor-grab' : ''} ${className ?? ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg width={size.width} height={size.height} className="block touch-none select-none">
        <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}>
          {bg.image ? (
            <image
              href={bg.image}
              x={0}
              y={0}
              width={chart.stage.width}
              height={chart.stage.height}
              opacity={bg.opacity}
              preserveAspectRatio={preserveForFit(bg.fit)}
              style={{ pointerEvents: 'none' }}
            />
          ) : null}

          {/* Sahne: doğrudan harita üzerinde taşınabilir. */}
          <g style={{ cursor: onStagePositionChange ? 'move' : 'default' }}>
            <rect
              x={stagePosition.x}
              y={stagePosition.y}
              width={260}
              height={58}
              rx={10}
              fill="#111827"
              fillOpacity={0.94}
              stroke="#6366f1"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={handleStagePointerUp}
            />
            <text
              x={stagePosition.x + 130}
              y={stagePosition.y + 29}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={stageFontSize}
              fontWeight={700}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {stageLabel ?? 'SAHNE'}
            </text>
          </g>

          {zoneBoxes.map(({ zone, bounds }) => {
            const active = activeZoneId === zone.id
            return (
              <g key={zone.id} style={{ pointerEvents: 'none' }}>
                <rect
                  x={bounds.minX - 16}
                  y={bounds.minY - 16}
                  width={bounds.width + 32}
                  height={bounds.height + 32}
                  rx={14}
                  fill="none"
                  stroke={zone.color}
                  strokeOpacity={active ? 1 : 0.55}
                  strokeWidth={active ? 2 : 1.25}
                  strokeDasharray="10 6"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={bounds.minX - 16 + 9 / transform.scale}
                  cy={bounds.minY - 24}
                  r={5 / transform.scale}
                  fill={zone.color}
                />
                <text
                  x={bounds.minX - 16 + 20 / transform.scale}
                  y={bounds.minY - 24}
                  fill="#475569"
                  dominantBaseline="middle"
                  fontSize={15 / transform.scale}
                  fontWeight={600}
                >
                  {zone.name}
                </text>
              </g>
            )
          })}

          {useBatch ? (
            <g shapeRendering="optimizeSpeed">
              {batches.map((batch) => (
                <path
                  key={`${batch.fill}-${batch.stroke}-${batch.strokeWidth}`}
                  d={batch.d}
                  fill={batch.fill}
                  stroke={batch.stroke}
                  strokeWidth={batch.strokeWidth}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          ) : (
            <g fontSize={labelSize} fontWeight={600}>
              {visibleSeats.map((seat) => {
                const category = categoryMap[seat.type] ?? getCategory(seat.type)
                const isUnavailable =
                  unavailableSet.has(seat.id) ||
                  seat.status === 'unavailable' ||
                  seat.status === 'blocked' ||
                  seat.locked
                const isSelected = selectedSet.has(seat.id)
                const isHeld = heldSet.has(seat.id) || seat.status === 'held'

                const visual: SeatVisual = {
                  fill: category.color,
                  stroke: SEAT_BASE_STROKE,
                  strokeWidth: SEAT_BASE_STROKE_WIDTH,
                }
                if (seat.locked) {
                  visual.fill = '#94a3b8'
                  visual.stroke = '#334155'
                  visual.strokeWidth = 2
                } else if (isUnavailable) {
                  visual.fill = '#d1d5db'
                  visual.stroke = '#9ca3af'
                } else if (isSelected) {
                  visual.stroke = '#ea580c'
                  visual.strokeWidth = 3
                } else if (isHeld) {
                  visual.fill = '#fde68a'
                  visual.stroke = '#d97706'
                }

                return (
                  <SeatGlyph
                    key={seat.id}
                    seat={seat}
                    visual={visual}
                    showLabel={showLabels}
                    labelColor={category.textColor}
                  />
                )
              })}
            </g>
          )}

          {!useBatch && rowHeaders.length > 0 ? (
            <g
              fontSize={labelSize * 1.15}
              fontWeight={700}
              fill="#475569"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {rowHeaders.map((h) => (
                <text
                  key={`${h.row}-${h.x}`}
                  x={h.x - 5 / transform.scale}
                  y={h.y}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {h.row}
                </text>
              ))}
            </g>
          ) : null}

          {marquee ? (
            <rect
              x={marquee.x}
              y={marquee.y}
              width={marquee.width}
              height={marquee.height}
              fill="rgba(59,130,246,0.15)"
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </g>
      </svg>

      {useBatch && showLabels ? (
        <div className="pointer-events-none absolute right-4 top-3 rounded-md bg-slate-900/70 px-3 py-1 text-xs font-medium text-white">
          Etiketler yakınlaştırınca görünür
        </div>
      ) : null}

      {onStagePositionChange ? (
        <div className="pointer-events-none absolute left-4 top-3 rounded-md bg-slate-900/80 px-3 py-1 text-xs font-semibold tracking-wide text-white">
          Sahneyi sürükleyerek taşıyın
        </div>
      ) : null}

      {/* Zoom kontrolleri — canvas'ın pointer yakalayıcısına karışmasın. */}
      <div
        className="absolute bottom-4 right-4 z-30 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-100"
          aria-label="Yakınlaştır"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.2)}
          className="flex h-9 w-9 items-center justify-center border-t border-slate-200 text-slate-600 hover:bg-slate-100"
          aria-label="Uzaklaştır"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={fit}
          className="flex h-9 w-9 items-center justify-center border-t border-slate-200 text-slate-600 hover:bg-slate-100"
          aria-label="Sığdır"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
