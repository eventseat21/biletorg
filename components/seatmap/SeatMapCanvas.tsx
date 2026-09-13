'use client'
// Ortak koltuk haritası render motoru (v3).
// Hem editör (düzenleme) hem de müşteri (seçim) tarafı bu bileşeni kullanır.

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
  ChartDoc,
  SeatItem,
  WorldPoint,
  ZoneDef,
} from '@/lib/seatmap/types'
import { buildCategoryMap, getCategory } from '@/lib/seatmap/categories'
import { computeBounds, seatHitTest, type Bounds } from '@/lib/seatmap/geometry'

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
  onPointerMoveWorld?: (point: WorldPoint, evt: ReactPointerEvent) => void
  onPointerUpWorld?: (point: WorldPoint, evt: ReactPointerEvent) => void
}

interface SeatGlyphProps {
  seat: SeatItem
  fill: string
  stroke: string
  strokeWidth: number
  showLabel: boolean
  labelSize: number
  labelColor: string
}

const SeatGlyph = memo(function SeatGlyph({
  seat,
  fill,
  stroke,
  strokeWidth,
  showLabel,
  labelSize,
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
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          x={seat.x}
          y={seat.y}
          width={seat.width}
          height={seat.height}
          rx={3}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {showLabel ? (
        <text
          x={cx}
          y={cy}
          fontSize={labelSize}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={labelColor}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {seat.row}
          {seat.number}
        </text>
      ) : null}
    </g>
  )
})

export default function SeatMapCanvas({
  chart,
  selectedIds,
  unavailableIds,
  heldIds,
  showLabels = false,
  panOnBackgroundDrag = false,
  marquee = null,
  stageLabel,
  stagePosition = { x: 580, y: 35 },
  onStagePositionChange,
  zones,
  activeZoneId = null,
  backgroundImage = null,
  backgroundOpacity = 0.35,
  className,
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

  const panRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)
  const stageDragRef = useRef<{
    startWorld: WorldPoint
    startPosition: { x: number; y: number }
  } | null>(null)
  const downRef = useRef<{ seat: SeatItem | null; x: number; y: number; moved: boolean } | null>(
    null
  )

  const selectedSet = useMemo(() => new Set(selectedIds ?? []), [selectedIds])
  const unavailableSet = useMemo(() => new Set(unavailableIds ?? []), [unavailableIds])
  const heldSet = useMemo(() => new Set(heldIds ?? []), [heldIds])
  const categoryMap = useMemo(() => buildCategoryMap(chart.categories), [chart.categories])

  // Arka plan: yeni chart.background varsa onu, yoksa eski prop'ları kullan.
  const bg = chart.background ?? {
    image: backgroundImage,
    opacity: backgroundOpacity,
    fit: 'contain' as BackgroundFit,
  }

  // Bölgelerin sınırlayıcı kutularını hesapla.
  const zoneBoxes = useMemo(() => {
    if (!zones || zones.length === 0) return []
    const boxes: { zone: ZoneDef; bounds: Bounds }[] = []
    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i]
      const members: SeatItem[] = []
      for (let j = 0; j < chart.seats.length; j++) {
        if (chart.seats[j].zone === zone.id) members.push(chart.seats[j])
      }
      const bounds = computeBounds(members)
      if (bounds) boxes.push({ zone, bounds })
    }
    return boxes
  }, [zones, chart.seats])

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
    setTransform({
      scale,
      tx: (size.width - bw * scale) / 2 - bounds.minX * scale,
      ty: (size.height - bh * scale) / 2 - bounds.minY * scale,
    })
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
      setTransform((t) => {
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
        const k = newScale / t.scale
        return { scale: newScale, tx: px - (px - t.tx) * k, ty: py - (py - t.ty) * k }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const localPoint = useCallback((clientX: number, clientY: number): WorldPoint => {
    const el = containerRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }, [])

  const screenToWorld = useCallback(
    (p: WorldPoint): WorldPoint => ({
      x: (p.x - transform.tx) / transform.scale,
      y: (p.y - transform.ty) / transform.scale,
    }),
    [transform]
  )

  const handleStagePointerDown = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!onStagePositionChange) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const lp = localPoint(e.clientX, e.clientY)
    stageDragRef.current = {
      startWorld: screenToWorld(lp),
      startPosition: stagePosition,
    }
  }

  const handleStagePointerMove = (e: ReactPointerEvent<SVGRectElement>) => {
    const drag = stageDragRef.current
    if (!drag || !onStagePositionChange) return
    e.stopPropagation()
    const lp = localPoint(e.clientX, e.clientY)
    const world = screenToWorld(lp)
    onStagePositionChange({
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

    const lp = localPoint(e.clientX, e.clientY)
    const world = screenToWorld(lp)
    const seat = seatHitTest(chart.seats, world)
    downRef.current = { seat, x: lp.x, y: lp.y, moved: false }

    // Orta fare her zaman pan yapar. Kaydır aracında sol fare de pan yapar.
    const shouldPan = e.button === 1 || (panOnBackgroundDrag && e.button === 0)
    if (shouldPan && !seat) {
      panRef.current = { startX: lp.x, startY: lp.y, tx: transform.tx, ty: transform.ty }
      return
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

    if (panRef.current) {
      const p = panRef.current
      setTransform((t) => ({
        ...t,
        tx: p.tx + (lp.x - p.startX),
        ty: p.ty + (lp.y - p.startY),
      }))
    }

    onPointerMoveWorld?.(screenToWorld(lp), e)
  }

  const handlePointerUp = (e: ReactPointerEvent) => {
    const el = containerRef.current
    if (el && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)

    const lp = localPoint(e.clientX, e.clientY)
    const world = screenToWorld(lp)
    const d = downRef.current
    const wasPanning = panRef.current !== null

    if (d && !d.moved && !wasPanning) {
      if (d.seat) onSeatClick?.(d.seat)
      else onBackgroundClick?.(world)
    }

    downRef.current = null
    panRef.current = null
    onPointerUpWorld?.(world, e)
  }

  const zoomBy = (factor: number) => {
    const cx = size.width / 2
    const cy = size.height / 2
    setTransform((t) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale * factor))
      const k = newScale / t.scale
      return { scale: newScale, tx: cx - (cx - t.tx) * k, ty: cy - (cy - t.ty) * k }
    })
  }

  const labelSize = 8.5 / transform.scale

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
              fontSize={18 / transform.scale}
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
                  fill={zone.color}
                  fillOpacity={active ? 0.16 : 0.06}
                  stroke={zone.color}
                  strokeWidth={active ? 2 : 1.25}
                  strokeDasharray="10 6"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={bounds.minX - 16}
                  y={bounds.minY - 24}
                  fill={zone.color}
                  fontSize={15 / transform.scale}
                  fontWeight={600}
                >
                  {zone.name}
                </text>
              </g>
            )
          })}

          {chart.seats.map((seat) => {
            const category = categoryMap[seat.type] ?? getCategory(seat.type)
            const isUnavailable = unavailableSet.has(seat.id) || seat.status === 'unavailable' || seat.status === 'blocked' || seat.locked
            const isSelected = selectedSet.has(seat.id)
            const isHeld = heldSet.has(seat.id) || seat.status === 'held'

            let fill = category.color
            let stroke = '#1f2937'
            let strokeWidth = 1

            if (seat.locked) {
              fill = '#94a3b8'
              stroke = '#334155'
              strokeWidth = 2
            } else if (isUnavailable) {
              fill = '#d1d5db'
              stroke = '#9ca3af'
            } else if (isSelected) {
              stroke = '#ea580c'
              strokeWidth = 3
            } else if (isHeld) {
              fill = '#fde68a'
              stroke = '#d97706'
            }

            return (
              <SeatGlyph
                key={seat.id}
                seat={seat}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                showLabel={showLabels}
                labelSize={labelSize}
                labelColor={category.textColor}
              />
            )
          })}

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
