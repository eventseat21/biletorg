'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Circle, Rect, Group, Text, Image as KonvaImage } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { Rect as KonvaRect } from 'react-konva'

interface SvgHallEditorProps {
  hallId: string
}

type SeatType =
  | 'NORMAL'
  | 'VIP'
  | 'PREMIUM'
  | 'ACCESSIBLE'
  | 'CATEGORY_1'
  | 'CATEGORY_2'
  | 'CATEGORY_3'
  | 'CATEGORY_4'
  | 'CATEGORY_5'
  | 'CATEGORY_6'
  | 'CATEGORY_7'
  | 'CATEGORY_8'
  | 'CATEGORY_9'
  | 'CATEGORY_10'

interface Seat {
  id: string
  row: string
  number: string
  x: number
  y: number
  width: number
  height: number
  type: SeatType
  shape: 'circle' | 'rect'
  rotation: number
  svgId?: string
}
type BlockName = 'B1' | 'B2' | 'B3' | 'B4'

const SEAT_COLORS: Record<SeatType, string> = {
  NORMAL: '#6b7280',
  VIP: '#fbbf24',
  PREMIUM: '#3b82f6',
  ACCESSIBLE: '#10b981',
  CATEGORY_1: '#ef4444',
  CATEGORY_2: '#f97316',
  CATEGORY_3: '#eab308',
  CATEGORY_4: '#84cc16',
  CATEGORY_5: '#06b6d4',
  CATEGORY_6: '#0ea5e9',
  CATEGORY_7: '#8b5cf6',
  CATEGORY_8: '#d946ef',
  CATEGORY_9: '#ec4899',
  CATEGORY_10: '#f43f5e',
}

const ALL_TYPES = Object.keys(SEAT_COLORS) as SeatType[]

const GRID_SIZE = 10
const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE

/** Etkinlik formatına göre önerilen boşluklar (tek tuşla uygulanır; isteğe bağlı Hizala ile birleştirin) */
const LAYOUT_PRESETS = {
  THEATER: {
    label: 'Tiyatro / klasik salon',
    uniformSeatGap: 16,
    uniformRowGap: 32,
    stage: 'top' as const,
  },
  CONCERT: {
    label: 'Konser (sık düzen)',
    uniformSeatGap: 12,
    uniformRowGap: 22,
    stage: 'top' as const,
  },
  CONFERENCE: {
    label: 'Konferans (ferah)',
    uniformSeatGap: 20,
    uniformRowGap: 40,
    stage: 'top' as const,
  },
  ARENA: {
    label: 'Arena (sahne altta)',
    uniformSeatGap: 14,
    uniformRowGap: 28,
    stage: 'bottom' as const,
  },
} as const

type LayoutPresetKey = keyof typeof LAYOUT_PRESETS

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
    : clean
  const num = Number.parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function closestSeatTypeFromRgb(r: number, g: number, b: number): SeatType {
  let best: SeatType = 'NORMAL'
  let bestDist = Number.POSITIVE_INFINITY
  for (const seatType of ALL_TYPES) {
    const c = hexToRgb(SEAT_COLORS[seatType])
    const d = Math.pow(r - c.r, 2) + Math.pow(g - c.g, 2) + Math.pow(b - c.b, 2)
    if (d < bestDist) {
      bestDist = d
      best = seatType
    }
  }
  return best
}

function normalizeApiSeat(raw: Record<string, unknown>): Seat {
  let shape: 'circle' | 'rect' =
    raw.shape === 'rect' ? 'rect' : raw.shape === 'circle' ? 'circle' : 'circle'
  let typeStr = String(raw.type ?? 'NORMAL')
  if (typeStr === 'circle' || typeStr === 'rect' || typeStr === 'ellipse') {
    shape = typeStr === 'rect' ? 'rect' : 'circle'
    typeStr = 'NORMAL'
  }
  const seatType = (typeStr in SEAT_COLORS ? typeStr : 'NORMAL') as SeatType
  const width = Math.max(16, Number(raw.width) || 30)
  const height = Math.max(16, Number(raw.height) || 30)
  const rotation = Math.round(Number(raw.rotation) || 0)

  return {
    id: String(raw.id),
    row: String(raw.row ?? 'A'),
    number: String(raw.number ?? ''),
    x: Math.round(Number(raw.x) || 0),
    y: Math.round(Number(raw.y) || 0),
    width,
    height,
    type: seatType,
    shape,
    rotation,
    svgId: raw.svgId != null ? String(raw.svgId) : undefined,
  }
}

function cloneSeats(s: Seat[]): Seat[] {
  return JSON.parse(JSON.stringify(s)) as Seat[]
}

type ToolMode = 'select' | 'add'
type NumberDirection = 'LTR' | 'RTL'
type BlockLayoutType = 'straight' | 'curved' | 'arc'
type LayoutBlockConfig = {
  id: string
  blockX: number
  blockY: number
  rows: number
  cols: number
  gapX: number
  gapY: number
  seatWidth: number
  seatHeight: number
  rowLabel: string
  rotation: number
  type: BlockLayoutType
  curveStrength?: number
  centerX?: number
  centerY?: number
  startRadius?: number
  rowGap?: number
  startAngleDeg?: number
  endAngleDeg?: number
  seatsPerRow?: number
  seatType?: SeatType
  shape?: 'circle' | 'rect'
  /** 1 = preset boyutu; merkez / sol-üst köşe sabit, blok küçültülür veya büyütülür */
  scale?: number
  /** Yay koltuklarını merkez etrafında döndürür (derece); mavi tutamacın `rotation` alanından ayrı */
  arcGroupRotationDeg?: number
}
type CurvedBlockForm = {
  blockId: string
  centerX: number
  centerY: number
  startRadius: number
  rowGap: number
  startAngleDeg: number
  endAngleDeg: number
  rows: number
  seatsPerRow: number
}

type SeatNodeProps = {
  seat: Seat
  selected: boolean
  canDrag: boolean
  blockLabel?: string
  showLabel: boolean
  /** NORMAL dışındaki türlerde küçük kategori kısaltması */
  showCategoryHint: boolean
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void
  onClick: (e: KonvaEventObject<MouseEvent>) => void
}

function seatTypeShortLabel(t: SeatType): string {
  if (t === 'NORMAL') return ''
  const m = /^CATEGORY_(\d+)$/.exec(t)
  if (m) return `C${m[1]}`
  if (t.length <= 5) return t
  return t.slice(0, 4)
}

function SeatNode({
  seat,
  selected,
  canDrag,
  blockLabel,
  showLabel,
  showCategoryHint,
  onDragEnd,
  onClick,
}: SeatNodeProps) {
  const cx = seat.x + seat.width / 2
  const cy = seat.y + seat.height / 2

  return (
    <Group
      x={cx}
      y={cy}
      rotation={seat.rotation}
      offsetX={seat.width / 2}
      offsetY={seat.height / 2}
      dragDistance={6}
      draggable={canDrag}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseDown={(e) => {
        e.cancelBubble = true
      }}
    >
      <Rect
        x={-6}
        y={-6}
        width={seat.width + 12}
        height={seat.height + 12}
        fill="rgba(0,0,0,0.001)"
        strokeEnabled={false}
      />
      {seat.shape === 'circle' ? (
        <Circle
          x={seat.width / 2}
          y={seat.height / 2}
          radius={Math.min(seat.width, seat.height) / 2}
          fill={SEAT_COLORS[seat.type]}
          stroke={selected ? '#ea580c' : '#1f2937'}
          strokeWidth={selected ? 3 : 1}
          hitStrokeWidth={10}
        />
      ) : (
        <Rect
          x={0}
          y={0}
          width={seat.width}
          height={seat.height}
          fill={SEAT_COLORS[seat.type]}
          stroke={selected ? '#ea580c' : '#1f2937'}
          strokeWidth={selected ? 3 : 1}
          cornerRadius={3}
          hitStrokeWidth={10}
        />
      )}
      {showLabel ? (
        <Text
          x={0}
          y={-11}
          width={seat.width}
          text={`${seat.row}${seat.number}`}
          fontSize={Math.max(8, Math.min(11, Math.round(seat.width * 0.32)))}
          fill={selected ? '#c2410c' : '#111827'}
          fontStyle={selected ? 'bold' : 'normal'}
          align="center"
          listening={false}
        />
      ) : null}
      {blockLabel ? (
        <Text
          x={0}
          y={seat.height + 1}
          width={seat.width}
          text={blockLabel}
          fontSize={8}
          fill="#475569"
          align="center"
          listening={false}
        />
      ) : null}
      {showCategoryHint && seat.type !== 'NORMAL' ? (
        <Text
          x={0}
          y={seat.height + (blockLabel ? 12 : 1)}
          width={seat.width}
          text={seatTypeShortLabel(seat.type)}
          fontSize={Math.max(6, Math.min(9, Math.round(seat.width * 0.22)))}
          fill="#7c3aed"
          fontStyle="bold"
          align="center"
          listening={false}
        />
      ) : null}
    </Group>
  )
}

function buildSeatsFromBlocks(blocks: LayoutBlockConfig[]): Seat[] {
  const all: Seat[] = []
  for (const block of blocks) {
    const scale = Math.min(4, Math.max(0.2, Number(block.scale ?? 1)))
    const rows = Math.max(1, Math.round(block.rows))
    const cols = Math.max(1, Math.round(block.cols))
    const seatWidth = Math.max(8, Math.round(block.seatWidth * scale))
    const seatHeight = Math.max(8, Math.round(block.seatHeight * scale))
    const gapX = Math.max(0, Math.round(block.gapX * scale))
    const gapY = Math.max(0, Math.round(block.gapY * scale))
    const type = block.seatType || 'NORMAL'
    const shape = block.shape || 'circle'
    const curve = Math.max(0, Number(block.curveStrength || 0) * scale)
    const baseRot = ((Math.round(block.rotation) % 360) + 360) % 360
    const rowPrefix = (block.rowLabel || 'A').trim() || 'A'

    if (block.type === 'arc') {
      const centerX = Number(block.centerX ?? block.blockX)
      const centerY = Number(block.centerY ?? block.blockY)
      const startRadius = Math.max(1, Number(block.startRadius ?? 220) * scale)
      const explicitRowGap = Number(block.rowGap)
      const rGap = Math.max(
        1,
        Number.isFinite(explicitRowGap)
          ? explicitRowGap * scale
          : Math.max(seatHeight + gapY, 18)
      )
      const startA = (Number(block.startAngleDeg ?? 120) * Math.PI) / 180
      const endA = (Number(block.endAngleDeg ?? 60) * Math.PI) / 180
      const spr = Math.max(2, Math.round(Number(block.seatsPerRow ?? block.cols ?? 12)))
      const groupRotDeg = ((Number(block.arcGroupRotationDeg ?? 0) % 360) + 360) % 360
      const groupRad = (groupRotDeg * Math.PI) / 180

      for (let r = 0; r < rows; r++) {
        const rowName = `${rowPrefix}${r + 1}`
        const currentRadius = startRadius + r * rGap
        const angleStep = spr > 1 ? (endA - startA) / (spr - 1) : 0
        for (let s = 0; s < spr; s++) {
          const angle = startA + s * angleStep
          const x0 = centerX + currentRadius * Math.cos(angle)
          const y0 = centerY + currentRadius * Math.sin(angle)
          const dx = x0 - centerX
          const dy = y0 - centerY
          const x = centerX + dx * Math.cos(groupRad) - dy * Math.sin(groupRad)
          const y = centerY + dx * Math.sin(groupRad) + dy * Math.cos(groupRad)
          const rot = Math.round((angle * 180) / Math.PI + 90 + groupRotDeg)
          all.push({
            id: `new-arc-${block.id}-${r}-${s}`,
            row: rowName,
            number: String(s + 1),
            x: snapToGrid(x - seatWidth / 2),
            y: snapToGrid(y - seatHeight / 2),
            width: seatWidth,
            height: seatHeight,
            type,
            shape,
            rotation: rot,
            svgId: `${block.id}-${r + 1}-${s + 1}`,
          })
        }
      }
    } else {
      for (let r = 0; r < rows; r++) {
        const rowName = `${rowPrefix}${r + 1}`
        const rowMid = (cols - 1) / 2
        for (let c = 0; c < cols; c++) {
          const baseX = block.blockX + c * (seatWidth + gapX)
          const baseY = block.blockY + r * (seatHeight + gapY)
          const nx = rowMid === 0 ? 0 : (c - rowMid) / rowMid
          const curveOffsetY = block.type === 'curved' ? -Math.pow(nx, 2) * curve : 0
          const rot = block.type === 'curved' ? Math.round(baseRot + -nx * (curve * 0.7)) : baseRot
          all.push({
            id: `new-block-${block.id}-${r}-${c}`,
            row: rowName,
            number: String(c + 1),
            x: snapToGrid(baseX),
            y: snapToGrid(baseY + curveOffsetY),
            width: seatWidth,
            height: seatHeight,
            type,
            shape,
            rotation: rot,
            svgId: `${block.id}-${r + 1}-${c + 1}`,
          })
        }
      }
    }
  }
  return all
}

function seatBelongsToLayoutBlock(seat: Seat, blockId: string): boolean {
  if (seat.svgId != null && seat.svgId.startsWith(`${blockId}-`)) return true
  if (seat.id.startsWith(`new-arc-${blockId}-`)) return true
  if (seat.id.startsWith(`new-block-${blockId}-`)) return true
  return false
}

/** Sadece bir bloğun koltuklarını üretir; diğer koltuklara dokunmaz (manuel boyut / taşıma korunur). */
function mergeSeatsFromSingleBlock(
  blockId: string,
  allBlocks: LayoutBlockConfig[],
  currentSeats: Seat[]
): Seat[] {
  const block = allBlocks.find((b) => b.id === blockId)
  if (!block) return currentSeats
  const fresh = buildSeatsFromBlocks([block])
  const rest = currentSeats.filter((s) => !seatBelongsToLayoutBlock(s, blockId))
  return [...rest, ...fresh]
}

function buildDuisburgLikePreset(): LayoutBlockConfig[] {
  return [
    {
      id: 'MAIN_PARKETT',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 15,
      cols: 20,
      gapX: 8,
      gapY: 14,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'P',
      rotation: 0,
      curveStrength: 0,
      centerX: 520,
      centerY: -90,
      startRadius: 300,
      rowGap: 24,
      startAngleDeg: 154,
      endAngleDeg: 26,
      seatsPerRow: 30,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'MID_CENTER',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 7,
      cols: 16,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'M',
      rotation: 0,
      curveStrength: 0,
      centerX: 520,
      centerY: 360,
      startRadius: 120,
      rowGap: 24,
      startAngleDeg: 166,
      endAngleDeg: 14,
      seatsPerRow: 16,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'LOWER_CENTER',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 9,
      cols: 22,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'L',
      rotation: 0,
      curveStrength: 0,
      centerX: 520,
      centerY: 740,
      startRadius: 130,
      rowGap: 24,
      startAngleDeg: 168,
      endAngleDeg: 12,
      seatsPerRow: 22,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'UPPER_LEFT',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 6,
      cols: 12,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'UL',
      rotation: 0,
      curveStrength: 0,
      centerX: 190,
      centerY: 180,
      startRadius: 86,
      rowGap: 22,
      startAngleDeg: 126,
      endAngleDeg: 44,
      seatsPerRow: 10,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'UPPER_RIGHT',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 6,
      cols: 12,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'UR',
      rotation: 0,
      curveStrength: 0,
      centerX: 850,
      centerY: 180,
      startRadius: 86,
      rowGap: 22,
      startAngleDeg: 136,
      endAngleDeg: 54,
      seatsPerRow: 10,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'MID_LEFT',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 6,
      cols: 12,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'ML',
      rotation: 0,
      curveStrength: 0,
      centerX: 240,
      centerY: 470,
      startRadius: 90,
      rowGap: 22,
      startAngleDeg: 138,
      endAngleDeg: 56,
      seatsPerRow: 11,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'MID_RIGHT',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 6,
      cols: 12,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'MR',
      rotation: 0,
      curveStrength: 0,
      centerX: 800,
      centerY: 470,
      startRadius: 90,
      rowGap: 22,
      startAngleDeg: 124,
      endAngleDeg: 42,
      seatsPerRow: 11,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'LOWER_LEFT',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 6,
      cols: 12,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'LL',
      rotation: 0,
      curveStrength: 0,
      centerX: 255,
      centerY: 835,
      startRadius: 100,
      rowGap: 22,
      startAngleDeg: 148,
      endAngleDeg: 62,
      seatsPerRow: 12,
      seatType: 'NORMAL',
      shape: 'rect',
    },
    {
      id: 'LOWER_RIGHT',
      type: 'arc',
      blockX: 0,
      blockY: 0,
      rows: 6,
      cols: 12,
      gapX: 8,
      gapY: 12,
      seatWidth: 22,
      seatHeight: 22,
      rowLabel: 'LR',
      rotation: 0,
      curveStrength: 0,
      centerX: 785,
      centerY: 835,
      startRadius: 100,
      rowGap: 22,
      startAngleDeg: 118,
      endAngleDeg: 32,
      seatsPerRow: 12,
      seatType: 'NORMAL',
      shape: 'rect',
    },
  ]
}

export default function SvgHallEditor({ hallId }: SvgHallEditorProps) {
  // TODO(layout-components): Editor büyüdükçe `Seat`, `Block`, `ReferenceLayer` olarak
  // bileşenlere ayrılmalı ve bloklar tek bir layout şemasından üretilmeli.
  const [seats, setSeats] = useState<Seat[]>([])
  const [hall, setHall] = useState<Record<string, unknown> | null>(null)
  const [svgBgImage, setSvgBgImage] = useState<HTMLImageElement | null>(null)
  const [showSvgPlan, setShowSvgPlan] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 })
  const suppressNextStageClick = useRef(false)
  const [zoom, setZoom] = useState(1)
  const [toolMode, setToolMode] = useState<ToolMode>('select')
  const [past, setPast] = useState<Seat[][]>([])
  const [future, setFuture] = useState<Seat[][]>([])
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])
  const [rowCategoryRow, setRowCategoryRow] = useState('')
  const [rowCategoryType, setRowCategoryType] = useState<SeatType>('NORMAL')
  const [curveStrength, setCurveStrength] = useState(28)
  const [curveRotate, setCurveRotate] = useState(true)
  const [aisleEvery, setAisleEvery] = useState(12)
  const [aisleWidth, setAisleWidth] = useState(26)
  const [rowNumberDirection, setRowNumberDirection] = useState<NumberDirection>('LTR')
  const [doubleRowOffset, setDoubleRowOffset] = useState(0)
  const [addSeatsCount, setAddSeatsCount] = useState(10)
  const [showRowArrows, setShowRowArrows] = useState(true)
  const [seatBlocks, setSeatBlocks] = useState<Record<string, BlockName>>({})
  /** Koltuklar arası boşluk (px) — Hizala araçları */
  const [uniformSeatGap, setUniformSeatGap] = useState(16)
  /** Sıralar arası ek dikey boşluk (0 = sıra Y’lerine dokunma) */
  const [uniformRowGap, setUniformRowGap] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [layoutPresetKey, setLayoutPresetKey] = useState<LayoutPresetKey | 'CUSTOM'>('CUSTOM')
  const [stagePosition, setStagePosition] = useState<'top' | 'bottom'>('top')
  const [bulkRowLabel, setBulkRowLabel] = useState('')
  const [renumberStart, setRenumberStart] = useState(1)
  const [newRowName, setNewRowName] = useState('')
  const [duplicateRowTarget, setDuplicateRowTarget] = useState('')
  const [rowDuplicateOffsetY, setRowDuplicateOffsetY] = useState(52)
  const [blockBoundaryGap, setBlockBoundaryGap] = useState(40)
  const [bulkWidth, setBulkWidth] = useState(28)
  const [bulkHeight, setBulkHeight] = useState(28)
  const [bulkRotation, setBulkRotation] = useState(0)
  const [bulkShape, setBulkShape] = useState<'circle' | 'rect'>('circle')
  const [pngRefImage, setPngRefImage] = useState<HTMLImageElement | null>(null)
  const [showPngRef, setShowPngRef] = useState(true)
  const [pngRefOpacity, setPngRefOpacity] = useState(0.5)
  const [showSeatLabels, setShowSeatLabels] = useState(true)
  const [showCategoryOnSeats, setShowCategoryOnSeats] = useState(true)
  const [referenceSeatSize, setReferenceSeatSize] = useState(28)
  const [showLayoutGuides, setShowLayoutGuides] = useState(true)
  const [rowGroupDistance, setRowGroupDistance] = useState(50) // Sıra Grup Mesafesi (Y Eşiği)
  const [selectedLayoutBlockId, setSelectedLayoutBlockId] = useState<string | null>(null)
  const layoutScaleHistoryPushed = useRef(false)
  const layoutCenterDragHistoryPushed = useRef(false)
  const layoutRotateDragHistoryPushed = useRef(false)
  const [showAdvancedTools, setShowAdvancedTools] = useState(false)
  const [curvedBlockForm, setCurvedBlockForm] = useState<CurvedBlockForm>({
    blockId: 'parkett_main',
    centerX: 500,
    centerY: -80,
    startRadius: 300,
    rowGap: 24,
    startAngleDeg: 150,
    endAngleDeg: 30,
    rows: 15,
    seatsPerRow: 20,
  })
  const [layoutBlocks, setLayoutBlocks] = useState<LayoutBlockConfig[]>([
    {
      id: 'A',
      blockX: 120,
      blockY: 220,
      rows: 8,
      cols: 14,
      gapX: 8,
      gapY: 12,
      seatWidth: 28,
      seatHeight: 28,
      rowLabel: 'A',
      rotation: 0,
      type: 'curved',
      curveStrength: 16,
      centerX: 500,
      centerY: 120,
      startRadius: 280,
      rowGap: 24,
      startAngleDeg: 155,
      endAngleDeg: 25,
      seatsPerRow: 14,
      seatType: 'NORMAL',
      shape: 'circle',
    },
    {
      id: 'B',
      blockX: 620,
      blockY: 220,
      rows: 8,
      cols: 14,
      gapX: 8,
      gapY: 12,
      seatWidth: 28,
      seatHeight: 28,
      rowLabel: 'B',
      rotation: 10,
      type: 'straight',
      curveStrength: 0,
      centerX: 500,
      centerY: 120,
      startRadius: 320,
      rowGap: 24,
      startAngleDeg: 155,
      endAngleDeg: 25,
      seatsPerRow: 14,
      seatType: 'NORMAL',
      shape: 'circle',
    },
  ])

  const seatsRef = useRef(seats)
  seatsRef.current = seats
  const selectedIdsRef = useRef(selectedIds)
  selectedIdsRef.current = selectedIds
  const pngSampleCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const pushHistory = useCallback((snapshot: Seat[]) => {
    setPast((p) => [...p.slice(-39), cloneSeats(snapshot)])
    setFuture([])
  }, [])

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p
      const prev = p[p.length - 1]
      setFuture((f) => [cloneSeats(seatsRef.current), ...f])
      setSeats(prev)
      setSelectedIds([])
      return p.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const nxt = f[0]
      setPast((p) => [...p.slice(-39), cloneSeats(seatsRef.current)])
      setSeats(nxt)
      setSelectedIds([])
      return f.slice(1)
    })
  }, [])

  const organizeSeats = (seats: Seat[], rowGroupDistance: number): Seat[] => {
  if (!seats.length) return seats

  // 1. Koltukları satırlara göre grupla (Y eşiğine göre)
  const seatsByRow = seats.reduce((acc, seat) => {
    const rowKey = seat.row
    if (!acc[rowKey]) acc[rowKey] = []
    acc[rowKey].push(seat)
    return acc
  }, {} as Record<string, Seat[]>)

  // 2. Her satırı düzelt
  const organizedSeats: Seat[] = []
  let currentY = 100 // Başlangıç Y pozisyonu

  Object.keys(seatsByRow).sort((a, b) => {
    const aNum = parseInt(a.replace(/\D/g, '')) || 0
    const bNum = parseInt(b.replace(/\D/g, '')) || 0
    return aNum - bNum
  }).forEach((rowKey, rowIndex) => {
    const rowSeats = seatsByRow[rowKey]
    
    // 3. Koltukları X pozisyonuna göre sırala
    rowSeats.sort((a, b) => a.x - b.x)
    
    // 4. Koltukları düzgün yerleştir
    const startX = 100 // Başlangıç X pozisyonu
    const seatSpacing = 35 // Koltuklar arası mesafe
    const rowSpacing = rowGroupDistance // Sıralar arası mesafe (ayarlanabilir)
    
    rowSeats.forEach((seat, seatIndex) => {
      organizedSeats.push({
        ...seat,
        x: Math.round(startX + seatIndex * seatSpacing),
        y: Math.round(currentY),
        row: rowKey,
        // Koltuk numarasını düzelt
        number: String(seatIndex + 1)
      })
    })
    
    currentY += rowSpacing
  })

  return organizedSeats
}

const fetchHallData = async () => {
    try {
      const res = await fetch(`/api/organizer/halls/${hallId}`)
      const data = await res.json()
      const rawSeats = (data.seats || []) as Record<string, unknown>[]
      const updatedSeats = rawSeats.map(normalizeApiSeat)
      
      // Koltukları organize et - sıra grup mesafesi ile
      const organizedSeats = organizeSeats(updatedSeats, rowGroupDistance)

      const maxX =
        organizedSeats.length > 0
          ? Math.max(...organizedSeats.map((s) => s.x + s.width)) + 120
          : 0
      const maxY =
        organizedSeats.length > 0
          ? Math.max(...organizedSeats.map((s) => s.y + s.height)) + 120
          : 0
      const newStageWidth = Math.max(Number(data.stageWidth) || 800, maxX, 400)
      const newStageHeight = Math.max(Number(data.stageHeight) || 600, maxY, 400)

      setHall({ ...data, stageWidth: newStageWidth, stageHeight: newStageHeight })
      setSeats(organizedSeats)
      setPast([])
      setFuture([])
      setPendingDeleteIds([])
    } catch (error) {
      console.error('Error fetching hall:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHallData()
  }, [hallId, rowGroupDistance])

  const svgSource = hall?.svgSource as string | undefined

  useEffect(() => {
    if (!svgSource?.trim()) {
      setSvgBgImage(null)
      return
    }
    const img = new window.Image()
    const blob = new Blob([svgSource], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      setSvgBgImage(img)
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setSvgBgImage(null)
    }
    img.src = url
  }, [svgSource])

  const uniqueRows = useMemo(() => {
    const r = Array.from(new Set(seats.map((s) => s.row)))
    return r.sort()
  }, [seats])

  const soleSelectedSeat = useMemo(() => {
    if (selectedIds.length !== 1) return null
    return seats.find((s) => s.id === selectedIds[0]) ?? null
  }, [seats, selectedIds])

  const rowStats = useMemo(() => {
    const m = new Map<string, number>()
    for (const s of seats) {
      m.set(s.row, (m.get(s.row) || 0) + 1)
    }
    return Array.from(m.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, count]) => ({ row, count }))
  }, [seats])

  useEffect(() => {
    if (uniqueRows.length && !uniqueRows.includes(rowCategoryRow)) {
      setRowCategoryRow(uniqueRows[0])
    }
  }, [uniqueRows, rowCategoryRow])

  useEffect(() => {
    // Yeni importlarda basit blok dağılımı: X ekseninde 4 dilim
    if (seats.length === 0) {
      setSeatBlocks({})
      return
    }
    setSeatBlocks((prev) => {
      const hasAll = seats.every((s) => prev[s.id])
      if (hasAll) return prev
      const minX = Math.min(...seats.map((s) => s.x))
      const maxX = Math.max(...seats.map((s) => s.x + s.width))
      const span = Math.max(1, maxX - minX)
      const next = { ...prev }
      for (const s of seats) {
        if (next[s.id]) continue
        const cx = s.x + s.width / 2
        const t = (cx - minX) / span
        next[s.id] = t < 0.25 ? 'B1' : t < 0.5 ? 'B2' : t < 0.75 ? 'B3' : 'B4'
      }
      return next
    })
  }, [seats])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = seatsRef.current.filter((s) => selectedIdsRef.current.includes(s.id))
        if (sel.length === 0) return
        e.preventDefault()
        pushHistory(seatsRef.current)
        const removedIds = sel.map((s) => s.id)
        setSeats((curr) => curr.filter((s) => !removedIds.includes(s.id)))
        setPendingDeleteIds((d) => {
          const next = [...d]
          for (const id of removedIds) {
            if (!id.startsWith('new-') && !next.includes(id)) next.push(id)
          }
          return next
        })
        setSelectedIds([])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, pushHistory])

  const stageWidth = Math.max(400, Number(hall?.stageWidth) || 800)
  const stageHeight = Math.max(400, Number(hall?.stageHeight) || 600)

  const editorPan = useMemo(() => {
    const pad = 56
    let minX = 0
    let minY = 0
    let maxX = stageWidth
    let maxY = stageHeight
    if (seats.length > 0) {
      minX = Math.min(...seats.map((s) => s.x))
      minY = Math.min(...seats.map((s) => s.y))
      maxX = Math.max(...seats.map((s) => s.x + s.width))
      maxY = Math.max(...seats.map((s) => s.y + s.height))
    }
    if (showLayoutGuides) {
      for (const b of layoutBlocks) {
        if (b.type === 'arc') {
          const cx = Number(b.centerX ?? b.blockX ?? 0)
          const cy = Number(b.centerY ?? b.blockY ?? 0)
          const sc = b.scale ?? 1
          const r0 = Number(b.startRadius ?? 220) * sc
          const rg = Number(b.rowGap ?? 24) * sc * Math.max(0, (b.rows ?? 1) - 1)
          const outer = r0 + rg + 56
          minX = Math.min(minX, cx - outer)
          minY = Math.min(minY, cy - outer)
          maxX = Math.max(maxX, cx + outer)
          maxY = Math.max(maxY, cy + outer)
        } else {
          const sc = b.scale ?? 1
          const w = sc * Math.max(1, b.cols) * (b.seatWidth + b.gapX)
          const h = sc * Math.max(1, b.rows) * (b.seatHeight + b.gapY)
          minX = Math.min(minX, b.blockX)
          minY = Math.min(minY, b.blockY)
          maxX = Math.max(maxX, b.blockX + w)
          maxY = Math.max(maxY, b.blockY + h)
        }
      }
    }
    const bboxMinX = minX - pad
    const bboxMinY = minY - pad
    const bboxMaxX = maxX + pad
    const bboxMaxY = maxY + pad
    const gx = pad - bboxMinX * zoom
    const gy = pad - bboxMinY * zoom
    const spanW = (bboxMaxX - bboxMinX) * zoom + 2 * pad
    const spanH = (bboxMaxY - bboxMinY) * zoom + 2 * pad
    const sw = Math.max(stageWidth * zoom + 2 * pad, spanW)
    const sh = Math.max(stageHeight * zoom + 2 * pad, spanH)
    return { gx, gy, sw, sh }
  }, [seats, layoutBlocks, showLayoutGuides, stageWidth, stageHeight, zoom])

  const toWorld = useCallback(
    (pos: { x: number; y: number }) => ({
      x: (pos.x - editorPan.gx) / zoom,
      y: (pos.y - editorPan.gy) / zoom,
    }),
    [zoom, editorPan.gx, editorPan.gy]
  )

  const ensurePngSamplingCanvas = useCallback(() => {
    if (!pngRefImage) return null
    const c = document.createElement('canvas')
    c.width = stageWidth
    c.height = stageHeight
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(pngRefImage, 0, 0, stageWidth, stageHeight)
    pngSampleCanvasRef.current = c
    return c
  }, [pngRefImage, stageHeight, stageWidth])

  const handleSeatClick = (e: KonvaEventObject<MouseEvent>, seat: Seat) => {
    e.cancelBubble = true
    suppressNextStageClick.current = false
    setSelectedLayoutBlockId(null)
    if (toolMode === 'add') return

    if (e.evt.shiftKey) {
      setSelectedIds((prev) =>
        prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id]
      )
    } else {
      setSelectedIds([seat.id])
    }
  }

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (toolMode === 'add') return
    if (e.evt.button === 0 && !e.evt.shiftKey && e.target === e.target.getStage()) {
      const posRaw = e.target.getStage()?.getPointerPosition()
      const pos = posRaw ? toWorld(posRaw) : null
      if (pos) {
        setIsSelecting(true)
        setSelectionStart({ x: pos.x, y: pos.y })
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 })
        setSelectedIds([])
        setSelectedLayoutBlockId(null)
      }
    }
  }

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    if (toolMode === 'add' && e.target === e.target.getStage()) {
      const posRaw = e.target.getStage()?.getPointerPosition()
      const pos = posRaw ? toWorld(posRaw) : null
      if (!pos) return
      pushHistory(seatsRef.current)
      const row = (rowCategoryRow || 'M').trim() || 'M'
      const inRow = seatsRef.current.filter((s) => s.row === row)
      let maxN = 0
      for (const s of inRow) {
        const n = parseInt(s.number, 10)
        if (Number.isFinite(n)) maxN = Math.max(maxN, n)
      }
      const n = maxN + 1
      const w = 28
      const h = 28
      const newSeat: Seat = {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        row,
        number: String(n),
        x: snapToGrid(pos.x - w / 2),
        y: snapToGrid(pos.y - h / 2),
        width: w,
        height: h,
        type: 'NORMAL',
        shape: 'circle',
        rotation: 0,
      }
      setSeats((s) => [...s, newSeat])
      setSelectedIds([newSeat.id])
      return
    }

    if (suppressNextStageClick.current) {
      suppressNextStageClick.current = false
      return
    }
    if (e.target === e.target.getStage()) {
      setSelectedIds([])
      setSelectedLayoutBlockId(null)
    }
  }

  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isSelecting) return
    const posRaw = e.target.getStage()?.getPointerPosition()
    const pos = posRaw ? toWorld(posRaw) : null
    if (pos) {
      const rect = {
        x: Math.min(selectionStart.x, pos.x),
        y: Math.min(selectionStart.y, pos.y),
        width: Math.abs(pos.x - selectionStart.x),
        height: Math.abs(pos.y - selectionStart.y),
      }
      setSelectionRect(rect)
      const selectedSeatIds = seats.filter((seat) => {
        const cx = seat.x + seat.width / 2
        const cy = seat.y + seat.height / 2
        return cx >= rect.x && cx <= rect.x + rect.width && cy >= rect.y && cy <= rect.y + rect.height
      }).map((seat) => seat.id)
      setSelectedIds(selectedSeatIds)
    }
  }

  const handleStageMouseUp = () => {
    setSelectionRect((prev) => {
      if (prev.width > 4 || prev.height > 4) {
        suppressNextStageClick.current = true
      }
      return { x: 0, y: 0, width: 0, height: 0 }
    })
    setIsSelecting(false)
  }

  const handleSeatDragEnd = (e: KonvaEventObject<DragEvent>, seat: Seat) => {
    if (toolMode === 'add') return
    const node = e.target
    const ocx = seat.x + seat.width / 2
    const ocy = seat.y + seat.height / 2
    const ncx = node.x()
    const ncy = node.y()
    const dcx = ncx - ocx
    const dcy = ncy - ocy

    const sel = selectedIdsRef.current
    pushHistory(seatsRef.current)
    setSeats((curr) =>
      curr.map((s) => {
        if (!sel.includes(s.id)) return s
        const cx = s.x + s.width / 2 + dcx
        const cy = s.y + s.height / 2 + dcy
        return {
          ...s,
          x: snapToGrid(cx - s.width / 2),
          y: snapToGrid(cy - s.height / 2),
        }
      })
    )
  }

  const applyCategoryToSelected = async (category: SeatType) => {
    if (selectedIds.length === 0) return
    pushHistory(seatsRef.current)
    setSeats((curr) =>
      curr.map((seat) => (selectedIds.includes(seat.id) ? { ...seat, type: category } : seat))
    )

    const persisted = selectedIds.filter((id) => !id.startsWith('new-'))
    if (persisted.length > 0) {
      try {
        await fetch(`/api/organizer/halls/${hallId}/seats/batch-update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatIds: persisted, updates: { type: category } }),
        })
      } catch (err) {
        console.error(err)
      }
    }
  }

  const applyCategoryToRow = () => {
    if (!rowCategoryRow) return
    pushHistory(seatsRef.current)
    setSeats((curr) =>
      curr.map((s) => (s.row === rowCategoryRow ? { ...s, type: rowCategoryType } : s))
    )
  }

  const rotateSelected = (delta: number) => {
    if (selectedIds.length === 0) return
    pushHistory(seatsRef.current)
    const sel = new Set(selectedIdsRef.current)
    setSeats((curr) => {
      const target = curr.filter((s) => sel.has(s.id))
      if (target.length === 0) return curr
      const centerX = target.reduce((acc, s) => acc + s.x + s.width / 2, 0) / target.length
      const centerY = target.reduce((acc, s) => acc + s.y + s.height / 2, 0) / target.length
      const r = (delta * Math.PI) / 180
      const cos = Math.cos(r)
      const sin = Math.sin(r)
      return curr.map((s) => {
        if (!sel.has(s.id)) return s
        const cx = s.x + s.width / 2
        const cy = s.y + s.height / 2
        const dx = cx - centerX
        const dy = cy - centerY
        const nx = centerX + dx * cos - dy * sin
        const ny = centerY + dx * sin + dy * cos
        return {
          ...s,
          x: snapToGrid(nx - s.width / 2),
          y: snapToGrid(ny - s.height / 2),
          rotation: Math.round(((s.rotation + delta) % 360 + 360) % 360),
        }
      })
    })
  }

  const getWorkingSeatIds = useCallback(() => {
    return selectedIdsRef.current.length > 0
      ? selectedIdsRef.current
      : seatsRef.current.map((s) => s.id)
  }, [])

  const applyCurvedBlock = useCallback(() => {
    const targetIds = new Set(getWorkingSeatIds())
    if (targetIds.size < 3) {
      alert('Eğri blok için en az 3 koltuk seçin (veya hiç seçim yapmadan tümüne uygulayın).')
      return
    }
    pushHistory(seatsRef.current)
    setSeats((curr) => {
      const byRow = new Map<string, Seat[]>()
      for (const s of curr) {
        if (!targetIds.has(s.id)) continue
        if (!byRow.has(s.row)) byRow.set(s.row, [])
        byRow.get(s.row)!.push(s)
      }

      const patch = new Map<string, Seat>()
      byRow.forEach((rowSeats) => {
        const sorted = [...rowSeats].sort((a, b) => a.x - b.x)
        const n = sorted.length
        const mid = (n - 1) / 2
        for (let i = 0; i < n; i++) {
          const seat = sorted[i]
          const nx = mid === 0 ? 0 : (i - mid) / mid
          const bendY = -Math.pow(nx, 2) * curveStrength
          const rot = curveRotate ? Math.round(-nx * (curveStrength * 0.9)) : seat.rotation
          patch.set(seat.id, {
            ...seat,
            y: snapToGrid(seat.y + bendY),
            rotation: rot,
          })
        }
      })

      return curr.map((s) => patch.get(s.id) ?? s)
    })
  }, [curveRotate, curveStrength, getWorkingSeatIds, pushHistory])

  const applyAutoAisles = useCallback(() => {
    const targetIds = new Set(getWorkingSeatIds())
    if (targetIds.size < 2) return
    const every = Math.max(2, Math.round(aisleEvery))
    const extraGap = Math.max(4, Math.round(aisleWidth))

    pushHistory(seatsRef.current)
    setSeats((curr) => {
      const byRow = new Map<string, Seat[]>()
      for (const s of curr) {
        if (!targetIds.has(s.id)) continue
        if (!byRow.has(s.row)) byRow.set(s.row, [])
        byRow.get(s.row)!.push(s)
      }

      const patch = new Map<string, Seat>()
      byRow.forEach((rowSeats) => {
        const sorted = [...rowSeats].sort((a, b) => a.x - b.x)
        if (sorted.length < 3) return

        const medianW = [...sorted]
          .map((s) => s.width)
          .sort((a, b) => a - b)[Math.floor(sorted.length / 2)] || 24
        const seatGap = Math.max(6, Math.round(medianW * 0.34))
        const startX = sorted[0].x
        let xCursor = startX

        sorted.forEach((seat, index) => {
          if (index > 0) {
            xCursor += medianW + seatGap
            if (index % every === 0) xCursor += extraGap
          }
          patch.set(seat.id, { ...seat, x: snapToGrid(xCursor) })
        })
      })
      return curr.map((s) => patch.get(s.id) ?? s)
    })
  }, [aisleEvery, aisleWidth, getWorkingSeatIds, pushHistory])

  const deleteSelectedSeats = useCallback(() => {
    const selected = selectedIdsRef.current
    if (selected.length === 0) return
    pushHistory(seatsRef.current)
    setSeats((curr) => curr.filter((s) => !selected.includes(s.id)))
    setPendingDeleteIds((d) => {
      const next = [...d]
      for (const id of selected) {
        if (!id.startsWith('new-') && !next.includes(id)) next.push(id)
      }
      return next
    })
    setSelectedIds([])
  }, [pushHistory])

  const alignAndRenumberRow = useCallback(() => {
    if (!rowCategoryRow) return
    pushHistory(seatsRef.current)
    const gap = Math.max(4, uniformSeatGap)
    setSeats((curr) => {
      const rowSeats = curr.filter((s) => s.row === rowCategoryRow).sort((a, b) => a.x - b.x)
      if (rowSeats.length < 2) return curr
      const widths = [...rowSeats.map((s) => s.width)].sort((a, b) => a - b)
      const wMed = widths[Math.floor(widths.length / 2)] || 28
      const minX = Math.min(...rowSeats.map((s) => s.x))
      const meanY = rowSeats.reduce((acc, s) => acc + s.y, 0) / rowSeats.length
      const rowIdx = uniqueRows.indexOf(rowCategoryRow)
      const parityShift = doubleRowOffset !== 0 && rowIdx >= 0 && rowIdx % 2 === 1 ? doubleRowOffset : 0

      const sortedForNumber =
        rowNumberDirection === 'LTR' ? [...rowSeats] : [...rowSeats].reverse()
      const numberById = new Map<string, string>()
      sortedForNumber.forEach((s, i) => numberById.set(s.id, String(i + 1)))

      const patch = new Map<string, Seat>()
      rowSeats.forEach((s, i) => {
        patch.set(s.id, {
          ...s,
          x: snapToGrid(minX + parityShift + i * (Math.round(wMed) + gap)),
          y: snapToGrid(meanY),
          rotation: 0,
          number: numberById.get(s.id) || s.number,
        })
      })
      return curr.map((s) => patch.get(s.id) ?? s)
    })
  }, [doubleRowOffset, pushHistory, rowCategoryRow, rowNumberDirection, uniformSeatGap, uniqueRows])

  /** Seçimdeki satırların tamamı (veya seçim yoksa tüm salon): eş aralık + numara; isteğe bağlı sıra dikey boşluğu */
  const applyHizalaBulk = useCallback(() => {
    pushHistory(seatsRef.current)
    const gap = Math.max(4, uniformSeatGap)
    const rowG = Math.max(0, uniformRowGap)

    setSeats((curr) => {
      const sel = selectedIdsRef.current
      const rowsToTouch = new Set<string>()
      if (sel.length === 0) {
        for (const s of curr) rowsToTouch.add(s.row)
      } else {
        for (const s of curr) {
          if (sel.includes(s.id)) rowsToTouch.add(s.row)
        }
      }
      if (rowsToTouch.size === 0) return curr

      const patch = new Map<string, Seat>()

      for (const row of Array.from(rowsToTouch)) {
        const rowSeats = curr.filter((s) => s.row === row).sort((a, b) => a.x - b.x)
        if (rowSeats.length === 0) continue
        const widths = [...rowSeats.map((s) => s.width)].sort((a, b) => a - b)
        const wMed = widths[Math.floor(widths.length / 2)] || 28
        const minX = Math.min(...rowSeats.map((s) => s.x))
        const meanY = rowSeats.reduce((acc, s) => acc + s.y, 0) / rowSeats.length
        const rowIdx = uniqueRows.indexOf(row)
        const parityShift = doubleRowOffset !== 0 && rowIdx >= 0 && rowIdx % 2 === 1 ? doubleRowOffset : 0

        const sortedForNumber =
          rowNumberDirection === 'LTR' ? [...rowSeats] : [...rowSeats].reverse()
        const numberById = new Map<string, string>()
        sortedForNumber.forEach((s, i) => numberById.set(s.id, String(i + 1)))

        rowSeats.forEach((s, i) => {
          patch.set(s.id, {
            ...s,
            x: snapToGrid(minX + parityShift + i * (Math.round(wMed) + gap)),
            y: snapToGrid(meanY),
            rotation: 0,
            number: numberById.get(s.id) || s.number,
          })
        })
      }

      if (rowG > 0 && rowsToTouch.size > 0) {
        const rowMeta = Array.from(rowsToTouch)
          .map((row) => {
            const patched = curr
              .filter((s) => s.row === row)
              .map((s) => patch.get(s.id) ?? s)
            if (patched.length === 0) return null
            const minY = Math.min(...patched.map((s) => s.y))
            const maxH = Math.max(...patched.map((s) => s.height))
            const meanY = patched.reduce((a, s) => a + s.y + s.height / 2, 0) / patched.length
            return { row, patched, minY, maxH, meanY }
          })
          .filter(Boolean) as Array<{
          row: string
          patched: Seat[]
          minY: number
          maxH: number
          meanY: number
        }>

        rowMeta.sort((a, b) => a.meanY - b.meanY)
        let yTop = Math.min(...rowMeta.map((m) => m.minY))
        for (const meta of rowMeta) {
          const dy = yTop - meta.minY
          for (const s of meta.patched) {
            const p = patch.get(s.id) ?? s
            patch.set(s.id, { ...p, y: snapToGrid(p.y + dy) })
          }
          yTop += meta.maxH + rowG
        }
      }

      return curr.map((s) => patch.get(s.id) ?? s)
    })
  }, [doubleRowOffset, pushHistory, rowNumberDirection, uniformRowGap, uniformSeatGap, uniqueRows])

  const addSeatsToRow = useCallback(() => {
    if (!rowCategoryRow) return
    const count = Math.max(1, Math.min(200, Math.round(addSeatsCount)))
    pushHistory(seatsRef.current)
    setSeats((curr) => {
      const rowSeats = curr.filter((s) => s.row === rowCategoryRow).sort((a, b) => a.x - b.x)
      const avgW = rowSeats.length > 0 ? rowSeats.reduce((acc, s) => acc + s.width, 0) / rowSeats.length : 28
      const avgH = rowSeats.length > 0 ? rowSeats.reduce((acc, s) => acc + s.height, 0) / rowSeats.length : 28
      const spacing = Math.max(6, Math.round(avgW * 0.35))
      const baseY =
        rowSeats.length > 0
          ? rowSeats.reduce((acc, s) => acc + s.y, 0) / rowSeats.length
          : stageHeight / 2
      const startX =
        rowSeats.length > 0
          ? Math.max(...rowSeats.map((s) => s.x)) + Math.round(avgW) + spacing
          : stageWidth / 2
      let maxN = 0
      for (const s of rowSeats) {
        const n = parseInt(s.number, 10)
        if (Number.isFinite(n)) maxN = Math.max(maxN, n)
      }
      const additions: Seat[] = []
      for (let i = 0; i < count; i++) {
        additions.push({
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${i}`,
          row: rowCategoryRow,
          number: String(maxN + i + 1),
          x: snapToGrid(startX + i * (Math.round(avgW) + spacing)),
          y: snapToGrid(baseY),
          width: Math.max(16, Math.round(avgW)),
          height: Math.max(16, Math.round(avgH)),
          type: rowCategoryType,
          shape: 'circle',
          rotation: 0,
        })
      }
      return [...curr, ...additions]
    })
  }, [addSeatsCount, pushHistory, rowCategoryRow, rowCategoryType, stageHeight, stageWidth])

  const selectBlock = useCallback((block: BlockName) => {
    const ids = seatsRef.current.filter((s) => seatBlocks[s.id] === block).map((s) => s.id)
    setSelectedIds(ids)
  }, [seatBlocks])

  const repartitionBlocksFromSelection = useCallback(() => {
    const ids = selectedIdsRef.current
    if (ids.length < 4) {
      alert('Bloklara ayırmak için en az 4 koltuk seçin.')
      return
    }
    const selectedSeats = seatsRef.current.filter((s) => ids.includes(s.id))
    const minX = Math.min(...selectedSeats.map((s) => s.x))
    const maxX = Math.max(...selectedSeats.map((s) => s.x + s.width))
    const span = Math.max(1, maxX - minX)
    setSeatBlocks((prev) => {
      const next = { ...prev }
      for (const s of selectedSeats) {
        const cx = s.x + s.width / 2
        const t = (cx - minX) / span
        next[s.id] = t < 0.25 ? 'B1' : t < 0.5 ? 'B2' : t < 0.75 ? 'B3' : 'B4'
      }
      return next
    })
  }, [])

  const flipRowDirection = useCallback(() => {
    if (!rowCategoryRow) return
    pushHistory(seatsRef.current)
    setSeats((curr) => {
      const rowSeats = curr.filter((s) => s.row === rowCategoryRow).sort((a, b) => a.x - b.x)
      if (rowSeats.length < 2) return curr
      const xPositions = rowSeats.map((s) => s.x)
      const reversedX = [...xPositions].reverse()
      const patch = new Map<string, Seat>()
      for (let i = 0; i < rowSeats.length; i++) {
        const seat = rowSeats[i]
        patch.set(seat.id, {
          ...seat,
          x: snapToGrid(reversedX[i]),
          number: String(i + 1),
        })
      }
      return curr.map((s) => patch.get(s.id) ?? s)
    })
  }, [pushHistory, rowCategoryRow])

  const applyLayoutPreset = useCallback((key: LayoutPresetKey) => {
    const p = LAYOUT_PRESETS[key]
    setLayoutPresetKey(key)
    setUniformSeatGap(p.uniformSeatGap)
    setUniformRowGap(p.uniformRowGap)
    setStagePosition(p.stage)
  }, [])

  const applyRowLabelToSelected = useCallback(() => {
    const label = bulkRowLabel.trim()
    if (!label || selectedIdsRef.current.length === 0) return
    pushHistory(seatsRef.current)
    const idSet = new Set(selectedIdsRef.current)
    setSeats((curr) => {
      const sel = curr.filter((s) => idSet.has(s.id)).sort((a, b) => a.x - b.x)
      let n = 1
      const numById = new Map<string, string>()
      for (const s of sel) numById.set(s.id, String(n++))
      return curr.map((s) =>
        idSet.has(s.id) ? { ...s, row: label, number: numById.get(s.id) || s.number } : s
      )
    })
  }, [bulkRowLabel, pushHistory])

  const renumberSelectedOnly = useCallback(() => {
    if (selectedIdsRef.current.length === 0) return
    const start = Math.max(1, Math.floor(renumberStart))
    pushHistory(seatsRef.current)
    const idSet = new Set(selectedIdsRef.current)
    setSeats((curr) => {
      const sel = curr.filter((s) => idSet.has(s.id)).sort((a, b) => a.x - b.x)
      let n = start
      const numById = new Map<string, string>()
      for (const s of sel) numById.set(s.id, String(n++))
      return curr.map((s) =>
        idSet.has(s.id) ? { ...s, number: numById.get(s.id) || s.number } : s
      )
    })
  }, [pushHistory, renumberStart])

  const deleteEntireRow = useCallback(() => {
    const row = rowCategoryRow
    if (!row) return
    const toRemove = seatsRef.current.filter((s) => s.row === row)
    if (toRemove.length === 0) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`"${row}" satırındaki ${toRemove.length} koltuk silinsin mi?`)
    ) {
      return
    }
    pushHistory(seatsRef.current)
    const rm = new Set(toRemove.map((s) => s.id))
    setSeats((curr) => curr.filter((s) => !rm.has(s.id)))
    setPendingDeleteIds((d) => {
      const next = [...d]
      for (const s of toRemove) {
        if (!s.id.startsWith('new-') && !next.includes(s.id)) next.push(s.id)
      }
      return next
    })
    setSeatBlocks((prev) => {
      const n = { ...prev }
      for (const s of toRemove) delete n[s.id]
      return n
    })
    setSelectedIds([])
  }, [pushHistory, rowCategoryRow])

  const addEmptyRow = useCallback(() => {
    const label = newRowName.trim()
    if (!label) {
      alert('Yeni satır için bir etiket girin (örn. AA, M2).')
      return
    }
    if (seatsRef.current.some((s) => s.row === label)) {
      alert('Bu satır etiketi zaten kullanılıyor.')
      return
    }
    pushHistory(seatsRef.current)
    const w = Math.max(16, bulkWidth)
    const h = Math.max(16, bulkHeight)
    const seat: Seat = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      row: label,
      number: '1',
      x: snapToGrid(stageWidth / 2 - w / 2),
      y: snapToGrid(stageHeight / 2 - h / 2),
      width: w,
      height: h,
      type: rowCategoryType,
      shape: bulkShape,
      rotation: 0,
    }
    setSeats((s) => [...s, seat])
    setSelectedIds([seat.id])
    setRowCategoryRow(label)
  }, [
    bulkHeight,
    bulkShape,
    bulkWidth,
    newRowName,
    pushHistory,
    rowCategoryType,
    stageHeight,
    stageWidth,
  ])

  const duplicateRow = useCallback(() => {
    const from = rowCategoryRow
    const to = duplicateRowTarget.trim()
    if (!from || !to) {
      alert('Kaynak satır seçili olmalı ve hedef satır adı girilmeli.')
      return
    }
    if (from === to) return
    const src = seatsRef.current.filter((s) => s.row === from)
    if (src.length === 0) return
    if (seatsRef.current.some((s) => s.row === to)) {
      alert('Hedef satır etiketi zaten var; farklı bir ad seçin.')
      return
    }
    const dy = Math.max(24, rowDuplicateOffsetY)
    pushHistory(seatsRef.current)
    const additions: Seat[] = src.map((s, i) => ({
      ...s,
      id: `new-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
      row: to,
      y: snapToGrid(s.y + dy),
    }))
    setSeats((curr) => [...curr, ...additions])
    setRowCategoryRow(to)
    setSelectedIds(additions.map((s) => s.id))
  }, [duplicateRowTarget, pushHistory, rowCategoryRow, rowDuplicateOffsetY])

  const clearBlockLabelsSelection = useCallback(() => {
    if (selectedIdsRef.current.length === 0) return
    const idSet = new Set(selectedIdsRef.current)
    setSeatBlocks((prev) => {
      const next = { ...prev }
      for (const id of Array.from(idSet)) delete next[id]
      return next
    })
  }, [])

  const applyBlockBoundaryAisles = useCallback(() => {
    const gap = Math.max(8, Math.round(blockBoundaryGap))
    const names = (['B1', 'B2', 'B3', 'B4'] as BlockName[]).filter((b) =>
      seatsRef.current.some((s) => seatBlocks[s.id] === b)
    )
    if (names.length < 2) {
      alert('En az iki blokta (B1–B4) koltuk olmalı. Önce blok atayın veya seçilileri B1–B4 yapın.')
      return
    }
    pushHistory(seatsRef.current)
    setSeats((curr) => {
      const groups = names
        .map((name) => {
          const ss = curr.filter((s) => seatBlocks[s.id] === name)
          const med = ss.map((s) => s.x + s.width / 2).sort((a, b) => a - b)
          const cx = med[Math.floor(med.length / 2)] ?? 0
          return { name, ids: new Set(ss.map((s) => s.id)), cx }
        })
        .sort((a, b) => a.cx - b.cx)

      let next = [...curr]
      for (let i = 1; i < groups.length; i++) {
        const left = groups[i - 1]
        const right = groups[i]
        const leftMax = Math.max(
          ...next.filter((s) => left.ids.has(s.id)).map((s) => s.x + s.width)
        )
        const rightMin = Math.min(...next.filter((s) => right.ids.has(s.id)).map((s) => s.x))
        const need = gap - (rightMin - leftMax)
        if (need <= 0) continue
        const shiftIds = new Set<string>()
        for (let j = i; j < groups.length; j++) {
          for (const id of Array.from(groups[j].ids)) shiftIds.add(id)
        }
        next = next.map((s) =>
          shiftIds.has(s.id) ? { ...s, x: snapToGrid(s.x + Math.ceil(need)) } : s
        )
      }
      return next
    })
  }, [blockBoundaryGap, pushHistory, seatBlocks])

  const applyBulkSeatGeometry = useCallback(() => {
    if (selectedIdsRef.current.length === 0) return
    const w = Math.max(8, Math.round(bulkWidth))
    const h = Math.max(8, Math.round(bulkHeight))
    const rot = ((Math.round(bulkRotation) % 360) + 360) % 360
    const idSet = new Set(selectedIdsRef.current)
    pushHistory(seatsRef.current)
    setSeats((curr) =>
      curr.map((s) =>
        idSet.has(s.id) ? { ...s, width: w, height: h, rotation: rot, shape: bulkShape } : s
      )
    )
  }, [bulkHeight, bulkRotation, bulkShape, bulkWidth, pushHistory])

  const patchOneSeatField = useCallback(
    (id: string, patch: Partial<Pick<Seat, 'row' | 'number' | 'rotation' | 'width' | 'height' | 'shape'>>) => {
      const curr = seatsRef.current
      const target = curr.find((s) => s.id === id)
      if (!target) return
      const next = { ...target, ...patch }
      if (patch.row !== undefined || patch.number !== undefined) {
        const clash = curr.some(
          (s) => s.id !== id && s.row === next.row && s.number === next.number
        )
        if (clash) {
          alert('Bu satır + numara başka bir koltukta kullanılıyor.')
          return
        }
      }
      pushHistory(curr)
      setSeats((c) => c.map((s) => (s.id === id ? next : s)))
    },
    [pushHistory]
  )

  const handlePngReferenceUpload = useCallback((file: File | null) => {
    if (!file) return
    const fr = new FileReader()
    fr.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        setPngRefImage(img)
        setShowPngRef(true)
      }
      img.src = String(fr.result || '')
    }
    fr.readAsDataURL(file)
  }, [])

  const applyColorsFromPngReference = useCallback(() => {
    if (!pngRefImage) {
      alert('Önce PNG referans yükleyin.')
      return
    }
    const canvas = ensurePngSamplingCanvas()
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const targetIds = selectedIdsRef.current.length > 0
      ? new Set(selectedIdsRef.current)
      : new Set(seatsRef.current.map((s) => s.id))

    if (targetIds.size === 0) return

    pushHistory(seatsRef.current)
    setSeats((curr) =>
      curr.map((s) => {
        if (!targetIds.has(s.id)) return s
        const px = Math.max(0, Math.min(stageWidth - 1, Math.round(s.x + s.width / 2)))
        const py = Math.max(0, Math.min(stageHeight - 1, Math.round(s.y + s.height / 2)))
        const sample = ctx.getImageData(px, py, 1, 1).data
        const alpha = sample[3]
        if (alpha < 10) return s
        const type = closestSeatTypeFromRgb(sample[0], sample[1], sample[2])
        return { ...s, type }
      })
    )
  }, [ensurePngSamplingCanvas, pngRefImage, pushHistory, stageHeight, stageWidth])

  const applyReferenceSeatSizeAll = useCallback(() => {
    const target = Math.max(8, Math.round(referenceSeatSize))
    const targetIds = selectedIdsRef.current.length > 0
      ? new Set(selectedIdsRef.current)
      : new Set(seatsRef.current.map((s) => s.id))
    if (targetIds.size === 0) return
    pushHistory(seatsRef.current)
    setSeats((curr) =>
      curr.map((s) =>
        targetIds.has(s.id) ? { ...s, width: target, height: target } : s
      )
    )
  }, [pushHistory, referenceSeatSize])

  const importSeatMapJson = useCallback(async (file: File | null) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as
        | { seats?: Array<Record<string, unknown>>; stageWidth?: number; stageHeight?: number }
        | Array<Record<string, unknown>>
      const rawSeats = Array.isArray(parsed) ? parsed : parsed.seats || []
      if (!Array.isArray(rawSeats) || rawSeats.length === 0) {
        alert('Geçerli koltuk listesi bulunamadı. JSON içinde seats dizisi olmalı.')
        return
      }

      const normalized = rawSeats.map((raw, i) => {
        const seat = normalizeApiSeat({
          ...raw,
          id: `new-json-${Date.now()}-${i}`,
          row: String(raw.row ?? 'A'),
          number: String(raw.number ?? i + 1),
          x: Number(raw.x ?? 0),
          y: Number(raw.y ?? 0),
          width: Number(raw.width ?? 28),
          height: Number(raw.height ?? 28),
          shape: raw.shape === 'rect' ? 'rect' : 'circle',
          type: String(raw.type ?? 'NORMAL'),
          rotation: Number(raw.rotation ?? 0),
        })
        return seat
      })

      const persistedToDelete = seatsRef.current
        .filter((s) => !s.id.startsWith('new-'))
        .map((s) => s.id)

      pushHistory(seatsRef.current)
      setPendingDeleteIds((prev) => Array.from(new Set([...prev, ...persistedToDelete])))
      setSeats(normalized)
      setSelectedIds([])
      setSeatBlocks({})

      const maxX = Math.max(...normalized.map((s) => s.x + s.width), 400)
      const maxY = Math.max(...normalized.map((s) => s.y + s.height), 400)
      setHall((prev) =>
        prev
          ? {
              ...prev,
              stageWidth: Math.max(Number(prev.stageWidth) || 800, Math.ceil(maxX + 80)),
              stageHeight: Math.max(Number(prev.stageHeight) || 600, Math.ceil(maxY + 80)),
            }
          : prev
      )
      alert(`JSON içe aktarıldı: ${normalized.length} koltuk.`)
    } catch (err) {
      console.error(err)
      alert('JSON okunamadı. Geçerli bir koltuk haritası dosyası yükleyin.')
    }
  }, [pushHistory])

  const updateLayoutBlock = useCallback((id: string, patch: Partial<LayoutBlockConfig>) => {
    setLayoutBlocks((curr) => {
      const next = curr.map((b) => (b.id === id ? { ...b, ...patch } : b))
      setSeats((seatsNow) => mergeSeatsFromSingleBlock(id, next, seatsNow))
      return next
    })
  }, [])

  const dragLayoutBlockGuide = useCallback((id: string, x: number, y: number) => {
    const wx = snapToGrid(x)
    const wy = snapToGrid(y)
    setLayoutBlocks((curr) => {
      const next = curr.map((b) =>
        b.id === id
          ? b.type === 'arc'
            ? { ...b, centerX: wx, centerY: wy }
            : { ...b, blockX: wx, blockY: wy }
          : b
      )
      setSeats((seatsNow) => mergeSeatsFromSingleBlock(id, next, seatsNow))
      return next
    })
  }, [])

  const rotateLayoutBlockGuide = useCallback((id: string, handleX: number, handleY: number) => {
    const hx = handleX
    const hy = handleY
    setLayoutBlocks((curr) => {
      const next = curr.map((b) => {
        if (b.id !== id) return b
        const ox = b.type === 'arc' ? Number(b.centerX ?? b.blockX) : b.blockX
        const oy = b.type === 'arc' ? Number(b.centerY ?? b.blockY) : b.blockY
        const rawDeg = Math.round((Math.atan2(hy - oy, hx - ox) * 180) / Math.PI)
        const normDeg = ((rawDeg % 360) + 360) % 360
        if (b.type === 'arc') {
          return { ...b, arcGroupRotationDeg: normDeg, rotation: normDeg }
        }
        return { ...b, rotation: rawDeg }
      })
      setSeats((seatsNow) => mergeSeatsFromSingleBlock(id, next, seatsNow))
      return next
    })
  }, [])

  const resizeLayoutBlockScale = useCallback((id: string, worldX: number, worldY: number) => {
    setLayoutBlocks((curr) => {
      const block = curr.find((b) => b.id === id)
      if (!block) return curr
      const rows = Math.max(1, block.rows)
      const cols = Math.max(1, block.cols)
      let newScale = block.scale ?? 1
      if (block.type === 'arc') {
        const cx = Number(block.centerX ?? block.blockX)
        const cy = Number(block.centerY ?? block.blockY)
        const baseStartR = Math.max(1, Number(block.startRadius ?? 220))
        const baseRowGap = Math.max(1, Number(block.rowGap ?? 24))
        const nominalOuter = baseStartR + Math.max(0, rows - 1) * baseRowGap
        const d = Math.hypot(worldX - cx, worldY - cy)
        newScale = nominalOuter > 0.5 ? Math.min(4, Math.max(0.2, d / nominalOuter)) : newScale
      } else {
        const cellW = block.seatWidth + block.gapX
        const cellH = block.seatHeight + block.gapY
        const nominalW = Math.max(1, cols * cellW)
        const nominalH = Math.max(1, rows * cellH)
        const sx = (worldX - block.blockX) / nominalW
        const sy = (worldY - block.blockY) / nominalH
        newScale = Math.min(4, Math.max(0.2, (sx + sy) / 2))
      }
      const next = curr.map((b) => (b.id === id ? { ...b, scale: newScale } : b))
      setSeats((seatsNow) => mergeSeatsFromSingleBlock(id, next, seatsNow))
      return next
    })
  }, [])

  const selectLayoutBlockOnCanvas = useCallback((id: string, e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    setSelectedLayoutBlockId(id)
    setSelectedIds([])
  }, [])

  const selectSeatsBelongingToLayoutBlock = useCallback((blockId: string) => {
    const prefixSvg = `${blockId}-`
    const prefixArc = `new-arc-${blockId}-`
    const prefixBlk = `new-block-${blockId}-`
    const ids = seatsRef.current
      .filter(
        (s) =>
          (s.svgId != null && s.svgId.startsWith(prefixSvg)) ||
          s.id.startsWith(prefixArc) ||
          s.id.startsWith(prefixBlk)
      )
      .map((s) => s.id)
    setSelectedLayoutBlockId(blockId)
    setSelectedIds(ids)
  }, [])

  const arcSliderHistoryPushed = useRef(false)
  const beginArcSliderGesture = useCallback(() => {
    if (!arcSliderHistoryPushed.current) {
      arcSliderHistoryPushed.current = true
      pushHistory(seatsRef.current)
    }
  }, [pushHistory])
  const endArcSliderGesture = useCallback(() => {
    arcSliderHistoryPushed.current = false
  }, [])

  const patchLayoutBlockAndSyncSeats = useCallback((id: string, patch: Partial<LayoutBlockConfig>) => {
    setLayoutBlocks((curr) => {
      const next = curr.map((b) => (b.id === id ? { ...b, ...patch } : b))
      setSeats((seatsNow) => mergeSeatsFromSingleBlock(id, next, seatsNow))
      return next
    })
  }, [])

  const addLayoutBlock = useCallback(() => {
    setLayoutBlocks((curr) => [
      ...curr,
      {
        id: `B${curr.length + 1}`,
        blockX: 160 + curr.length * 60,
        blockY: 220 + curr.length * 20,
        rows: 6,
        cols: 10,
        gapX: 8,
        gapY: 12,
        seatWidth: 28,
        seatHeight: 28,
        rowLabel: String.fromCharCode(65 + (curr.length % 20)),
        rotation: 0,
        type: 'straight',
        curveStrength: 0,
        centerX: 500,
        centerY: 120,
        startRadius: 260,
        rowGap: 24,
        startAngleDeg: 150,
        endAngleDeg: 30,
        seatsPerRow: 10,
        seatType: 'NORMAL',
        shape: 'circle',
      },
    ])
  }, [])

  const addCenterArcPreset = useCallback(() => {
    setLayoutBlocks((curr) => [
      ...curr,
      {
        id: `CENTER_${curr.length + 1}`,
        blockX: 240,
        blockY: 280,
        rows: 12,
        cols: 20,
        gapX: 8,
        gapY: 12,
        seatWidth: 24,
        seatHeight: 24,
        rowLabel: 'P',
        rotation: 0,
        type: 'arc',
        curveStrength: 0,
        centerX: 500,
        centerY: -80,
        startRadius: 300,
        rowGap: 24,
        startAngleDeg: 150,
        endAngleDeg: 30,
        seatsPerRow: 20,
        seatType: 'NORMAL',
        shape: 'circle',
      },
    ])
  }, [])

  const addSidePreset = useCallback(() => {
    setLayoutBlocks((curr) => [
      ...curr,
      {
        id: `SIDE_${curr.length + 1}`,
        blockX: 760,
        blockY: 260,
        rows: 10,
        cols: 10,
        gapX: 8,
        gapY: 12,
        seatWidth: 24,
        seatHeight: 24,
        rowLabel: 'S',
        rotation: 18,
        type: 'straight',
        curveStrength: 0,
        centerX: 500,
        centerY: 120,
        startRadius: 260,
        rowGap: 24,
        startAngleDeg: 140,
        endAngleDeg: 40,
        seatsPerRow: 10,
        seatType: 'NORMAL',
        shape: 'circle',
      },
    ])
  }, [])

  const removeLayoutBlock = useCallback((id: string) => {
    setLayoutBlocks((curr) => curr.filter((b) => b.id !== id))
  }, [])

  const exportLayoutBlocks = useCallback(() => {
    const blob = new Blob([JSON.stringify({ blocks: layoutBlocks }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `layout-blocks-${hallId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [hallId, layoutBlocks])

  const importLayoutBlocks = useCallback(async (file: File | null) => {
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as { blocks?: LayoutBlockConfig[] } | LayoutBlockConfig[]
      const blocks = Array.isArray(parsed) ? parsed : parsed.blocks || []
      if (!Array.isArray(blocks) || blocks.length === 0) {
        alert('Geçerli layout bulunamadı. JSON içinde blocks dizisi olmalı.')
        return
      }
      setLayoutBlocks(
        blocks.map((b, i) => ({
          ...b,
          id: b.id || `IMP_${i + 1}`,
          type: b.type || 'straight',
          seatType: b.seatType || 'NORMAL',
          shape: b.shape || 'circle',
          scale: b.scale != null && Number.isFinite(Number(b.scale)) ? Number(b.scale) : 1,
          arcGroupRotationDeg:
            b.arcGroupRotationDeg != null && Number.isFinite(Number(b.arcGroupRotationDeg))
              ? Number(b.arcGroupRotationDeg)
              : 0,
        }))
      )
    } catch (e) {
      console.error(e)
      alert('Layout JSON okunamadı.')
    }
  }, [])

  const fillCurvedBlockFromArc = useCallback(() => {
    const arc = layoutBlocks.find((b) => b.type === 'arc')
    if (!arc) {
      alert('Önce en az bir arc blok tanımlayın.')
      return
    }
    setCurvedBlockForm({
      blockId: arc.id || 'parkett_main',
      centerX: Number(arc.centerX ?? arc.blockX ?? 500),
      centerY: Number(arc.centerY ?? arc.blockY ?? -80),
      startRadius: Number(arc.startRadius ?? 300),
      rowGap: Number(arc.rowGap ?? 24),
      startAngleDeg: Number(arc.startAngleDeg ?? 150),
      endAngleDeg: Number(arc.endAngleDeg ?? 30),
      rows: Number(arc.rows ?? 15),
      seatsPerRow: Number(arc.seatsPerRow ?? arc.cols ?? 20),
    })
  }, [layoutBlocks])

  const curvedBlockConfigText = useMemo(() => {
    const cfg = {
      blockId: curvedBlockForm.blockId,
      centerX: curvedBlockForm.centerX,
      centerY: curvedBlockForm.centerY,
      startRadius: curvedBlockForm.startRadius,
      rowGap: curvedBlockForm.rowGap,
      startAngle: `Math.PI * ${(curvedBlockForm.startAngleDeg / 180).toFixed(4)}`,
      endAngle: `Math.PI * ${(curvedBlockForm.endAngleDeg / 180).toFixed(4)}`,
      rows: curvedBlockForm.rows,
      seatsPerRow: curvedBlockForm.seatsPerRow,
    }
    return `const ${cfg.blockId} = {
  blockId: '${cfg.blockId}',
  centerX: ${cfg.centerX},
  centerY: ${cfg.centerY},
  startRadius: ${cfg.startRadius},
  rowGap: ${cfg.rowGap},
  startAngle: ${cfg.startAngle},
  endAngle: ${cfg.endAngle},
  rows: ${cfg.rows},
  seatsPerRow: ${cfg.seatsPerRow}
};`
  }, [curvedBlockForm])

  const copyCurvedBlockConfig = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(curvedBlockConfigText)
      alert('CurvedBlock config kopyalandı.')
    } catch (e) {
      console.error(e)
      alert('Kopyalama başarısız. Elle seçip kopyalayabilirsiniz.')
    }
  }, [curvedBlockConfigText])

  const applyLayoutBlocksToSeats = useCallback(() => {
    if (layoutBlocks.length === 0) {
      alert('En az bir blok tanımlayın.')
      return
    }
    const nextSeats = buildSeatsFromBlocks(layoutBlocks)
    if (nextSeats.length === 0) return
    const persistedToDelete = seatsRef.current
      .filter((s) => !s.id.startsWith('new-'))
      .map((s) => s.id)
    pushHistory(seatsRef.current)
    setPendingDeleteIds((prev) => Array.from(new Set([...prev, ...persistedToDelete])))
    setSeats(nextSeats)
    setSelectedIds([])
    setSeatBlocks({})
    const maxX = Math.max(...nextSeats.map((s) => s.x + s.width), 400)
    const maxY = Math.max(...nextSeats.map((s) => s.y + s.height), 400)
    setHall((prev) =>
      prev
        ? {
            ...prev,
            stageWidth: Math.max(Number(prev.stageWidth) || 800, Math.ceil(maxX + 80)),
            stageHeight: Math.max(Number(prev.stageHeight) || 600, Math.ceil(maxY + 80)),
          }
        : prev
    )
  }, [layoutBlocks, pushHistory])

  const applyPresetBlocksToSeats = useCallback(
    (presetBlocks: LayoutBlockConfig[]) => {
      if (presetBlocks.length === 0) return
      const nextSeats = buildSeatsFromBlocks(presetBlocks)
      if (nextSeats.length === 0) return
      const persistedToDelete = seatsRef.current
        .filter((s) => !s.id.startsWith('new-'))
        .map((s) => s.id)
      pushHistory(seatsRef.current)
      setPendingDeleteIds((prev) => Array.from(new Set([...prev, ...persistedToDelete])))
      setLayoutBlocks(presetBlocks)
      setSeats(nextSeats)
      setSelectedIds([])
      setSeatBlocks({})
      const maxX = Math.max(...nextSeats.map((s) => s.x + s.width), 400)
      const maxY = Math.max(...nextSeats.map((s) => s.y + s.height), 400)
      setHall((prev) =>
        prev
          ? {
              ...prev,
              stageWidth: Math.max(Number(prev.stageWidth) || 800, Math.ceil(maxX + 80)),
              stageHeight: Math.max(Number(prev.stageHeight) || 600, Math.ceil(maxY + 80)),
            }
          : prev
      )
    },
    [pushHistory]
  )

  const applyDuisburgLikePreset = useCallback(() => {
    const preset = buildDuisburgLikePreset()
    applyPresetBlocksToSeats(preset)
    setCurvedBlockForm({
      blockId: 'MAIN_PARKETT',
      centerX: 520,
      centerY: -90,
      startRadius: 300,
      rowGap: 24,
      startAngleDeg: 154,
      endAngleDeg: 26,
      rows: 15,
      seatsPerRow: 30,
    })
  }, [applyPresetBlocksToSeats])

  const rowArrowMeta = useMemo(() => {
    if (!showRowArrows) return []
    return uniqueRows
      .map((row) => {
        const rowSeats = seats.filter((s) => s.row === row)
        if (rowSeats.length === 0) return null
        const sorted = [...rowSeats].sort((a, b) => {
          const na = parseInt(a.number, 10)
          const nb = parseInt(b.number, 10)
          if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
          return a.number.localeCompare(b.number, undefined, { numeric: true })
        })
        const p0 = sorted[0]
        const p1 = sorted[sorted.length - 1]
        const ax0 = p0.x + p0.width / 2
        const ay0 = p0.y + p0.height / 2
        const ax1 = p1.x + p1.width / 2
        const ay1 = p1.y + p1.height / 2
        const midX = (ax0 + ax1) / 2
        const midY = (ay0 + ay1) / 2
        const tangentDeg = (Math.atan2(ay1 - ay0, ax1 - ax0) * 180) / Math.PI
        const rtl = rowNumberDirection === 'RTL'
        const textRot = rtl ? tangentDeg + 180 : tangentDeg
        const perpDeg = textRot + 90
        const pr = (perpDeg * Math.PI) / 180
        const off = 28
        const x = midX + Math.cos(pr) * off
        const y = midY + Math.sin(pr) * off
        return {
          row,
          x,
          y,
          text: rtl ? '←' : '→',
          rotation: textRot,
        }
      })
      .filter(Boolean) as Array<{ row: string; x: number; y: number; text: string; rotation: number }>
  }, [rowNumberDirection, seats, showRowArrows, uniqueRows])

  const selectedLayoutBlock = useMemo(
    () => layoutBlocks.find((b) => b.id === selectedLayoutBlockId) ?? null,
    [layoutBlocks, selectedLayoutBlockId]
  )

  const copyFullHallJson = useCallback(async () => {
    const seatPayload = seats.map((s) => ({
      id: s.id,
      row: s.row,
      number: s.number,
      x: s.x,
      y: s.y,
      width: s.width,
      height: s.height,
      type: s.type,
      shape: s.shape,
      rotation: s.rotation,
      svgId: s.svgId,
    }))
    const doc = {
      hallId,
      exportedAt: new Date().toISOString(),
      seats: seatPayload,
      layoutBlocks,
      stage: hall
        ? {
            width: hall.stageWidth,
            height: hall.stageHeight,
            position: stagePosition,
          }
        : undefined,
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(doc, null, 2))
      alert('Salon JSON panoya kopyalandı (koltuklar + layout blokları).')
    } catch {
      alert('Panoya kopyalanamadı.')
    }
  }, [hall, hallId, layoutBlocks, seats, stagePosition])

  const handleSaveToDatabase = async () => {
    setIsSaving(true)
    try {
      const payload = seats.map((s) => ({
        id: s.id,
        row: s.row,
        number: s.number,
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        type: s.type,
        shape: s.shape,
        rotation: s.rotation,
        svgId: s.svgId,
      }))
      const res = await fetch(`/api/organizer/halls/${hallId}/seats/layout-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats: payload, deletedSeatIds: pendingDeleteIds }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Kayıt başarısız')
        return
      }
      const data = await res.json()
      const rawSeats = (data.seats || []) as Record<string, unknown>[]
      setSeats(rawSeats.map(normalizeApiSeat))
      setPendingDeleteIds([])
      setPast([])
      setFuture([])
      alert('Salon kaydedildi.')
    } catch (e) {
      console.error(e)
      alert('Kayıt sırasında hata')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Yükleniyor...</div>
  }
  if (!hall) {
    return <div className="flex items-center justify-center h-full">Salon bulunamadı</div>
  }

  const source = String(hall.source || '')

  const canShowDenseLabels = zoom >= 1.2

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-gray-50">
      <div className="shrink-0 border-b border-indigo-300/80 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Çok katmanlı tiyatro düzeni</p>
            <p className="text-xs text-indigo-100">
              Üstteki boş düğme hazır düzeni yükler. PNG ile hizalamak için bloğu sürükleyin; sol sarı panelde yarıçap ve
              açı kaydırıcıları var. Bitince &quot;Kaydet&quot; veya tüm salon JSON&apos;unu panoya kopyalayın.
            </p>
          </div>
          <button
            type="button"
            onClick={applyDuisburgLikePreset}
            aria-label="Hazır çok katmanlı salon düzenini uygula"
            title="Hazır çok katmanlı salon düzenini uygula"
            className="shrink-0 min-h-[3rem] min-w-[3rem] rounded-xl bg-white px-8 py-3.5 text-center text-sm font-bold text-indigo-800 shadow-lg ring-1 ring-white/30 transition hover:bg-indigo-50 active:scale-[0.99]"
          >
            {'\u00A0'}
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col max-h-[42vh] md:max-h-none overflow-y-auto">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Salon düzeni</h2>
          <p className="text-xs text-gray-500 mt-1">
            İlham:{' '}
            <a
              href="https://ditix.io/saalplan-sitzplatzbuchung"
              className="text-indigo-600 underline"
              target="_blank"
              rel="noreferrer"
            >
              ditix seatmap
            </a>
          </p>
        </div>

        <div className="p-4 space-y-3 text-sm border-b border-gray-100">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setToolMode('select')}
              className={`flex-1 rounded-lg py-2 font-medium ${
                toolMode === 'select' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Seç / taşı
            </button>
            <button
              type="button"
              onClick={() => setToolMode('add')}
              className={`flex-1 rounded-lg py-2 font-medium ${
                toolMode === 'add' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Koltuk ekle
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {toolMode === 'add'
              ? `Tuvalde boş yere tıklayın — satır: "${rowCategoryRow || 'M'}", numara otomatik.`
              : 'Kutu seçim: boş alanda sürükleyin (turuncu). Shift+tık çoklu.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={deleteSelectedSeats}
              disabled={selectedIds.length === 0}
              className="rounded-lg bg-red-50 border border-red-200 py-1.5 text-xs font-medium text-red-700 disabled:opacity-40"
            >
              Seçilileri sil
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(seats.map((s) => s.id))}
              className="rounded-lg bg-gray-100 border border-gray-200 py-1.5 text-xs font-medium text-gray-700"
            >
              Hepsini seç
            </button>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[11px] text-gray-700">
              <input
                type="checkbox"
                checked={showCategoryOnSeats}
                onChange={(e) => setShowCategoryOnSeats(e.target.checked)}
                className="rounded border-gray-300"
              />
              VIP vb. kategori kısaltmasını planda göster
            </label>
            <p className="text-[10px] font-semibold text-gray-800">Seçili koltuk kategorisi</p>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
              {ALL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyCategoryToSelected(type)}
                  className="rounded px-1.5 py-0.5 text-[9px] font-medium text-white disabled:opacity-40"
                  style={{ backgroundColor: SEAT_COLORS[type] }}
                  title={type}
                >
                  {type.replace('CATEGORY_', 'C')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 border-b border-gray-100 bg-amber-50/80">
          <p className="text-xs font-semibold text-gray-900">PNG üzerine hizala (yay bloğu)</p>
          <p className="text-[10px] text-gray-600 leading-snug">
            Yeşil: taşı · Mavi: yay grubunu döndür · Mor: ölçek. Blokları ayırmak için taşıyın; tek blokta koltuk
            seçip silebilirsiniz.
          </p>
          {!selectedLayoutBlockId ? (
            <p className="text-xs text-amber-950/80">
              Bir blok seçmek için plandaki <strong>yeşil merkez tutamacına</strong> tıklayın (koltukların üstünde).
            </p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectSeatsBelongingToLayoutBlock(selectedLayoutBlockId)}
                  className="flex-1 min-w-[8rem] rounded border border-amber-700/40 bg-white px-2 py-1.5 text-[11px] font-medium text-amber-950 hover:bg-amber-100/60"
                >
                  Bu bloğun koltuklarını seç
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLayoutBlockId(null)}
                  className="rounded border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Blok seçimini kaldır
                </button>
              </div>
              <p className="text-[10px] text-gray-600">
                Koltukları seçtikten sonra yukarıda <strong>Seçilileri sil</strong> ile kaldırın (blok şablonu
                kalır; gerekirse Gelişmiş → layout ile yeniden üretirsiniz).
              </p>
              {selectedLayoutBlock?.type !== 'arc' ? (
                <p className="text-xs text-gray-700">
                  <span className="font-mono">{selectedLayoutBlock?.id}</span> düz / eğri ızgara — yay
                  kaydırıcıları yok. Gelişmiş → Layout bloklarından düzenleyin; mavi tutamak düz blokta sıra
                  açısını döndürür.
                </p>
              ) : null}
            </div>
          )}
          {selectedLayoutBlockId && selectedLayoutBlock?.type === 'arc' ? (
            <div
              className="space-y-2.5"
              onPointerDownCapture={beginArcSliderGesture}
              onPointerUpCapture={endArcSliderGesture}
              onPointerCancelCapture={endArcSliderGesture}
            >
              <p className="text-[10px] font-mono text-gray-800">{selectedLayoutBlock.id}</p>
              <label className="block text-[10px] font-medium text-gray-800">
                Başlangıç yarıçapı: {Math.round(Number(selectedLayoutBlock.startRadius ?? 220))} px
                <input
                  type="range"
                  min={20}
                  max={900}
                  value={Math.round(Number(selectedLayoutBlock.startRadius ?? 220))}
                  onChange={(e) =>
                    selectedLayoutBlockId &&
                    patchLayoutBlockAndSyncSeats(selectedLayoutBlockId, {
                      startRadius: Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full accent-amber-700"
                />
              </label>
              <label className="block text-[10px] font-medium text-gray-800">
                Sıra derinliği (satır aralığı): {Math.round(Number(selectedLayoutBlock.rowGap ?? 24))} px
                <input
                  type="range"
                  min={4}
                  max={120}
                  value={Math.round(Number(selectedLayoutBlock.rowGap ?? 24))}
                  onChange={(e) =>
                    selectedLayoutBlockId &&
                    patchLayoutBlockAndSyncSeats(selectedLayoutBlockId, {
                      rowGap: Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full accent-amber-700"
                />
              </label>
              <label className="block text-[10px] font-medium text-gray-800">
                Başlangıç açısı: {Math.round(Number(selectedLayoutBlock.startAngleDeg ?? 120))}°
                <input
                  type="range"
                  min={-180}
                  max={360}
                  value={Math.round(Number(selectedLayoutBlock.startAngleDeg ?? 120))}
                  onChange={(e) =>
                    selectedLayoutBlockId &&
                    patchLayoutBlockAndSyncSeats(selectedLayoutBlockId, {
                      startAngleDeg: Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full accent-amber-700"
                />
              </label>
              <label className="block text-[10px] font-medium text-gray-800">
                Bitiş açısı: {Math.round(Number(selectedLayoutBlock.endAngleDeg ?? 60))}°
                <input
                  type="range"
                  min={-180}
                  max={360}
                  value={Math.round(Number(selectedLayoutBlock.endAngleDeg ?? 60))}
                  onChange={(e) =>
                    selectedLayoutBlockId &&
                    patchLayoutBlockAndSyncSeats(selectedLayoutBlockId, {
                      endAngleDeg: Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full accent-amber-700"
                />
              </label>
              <label className="block text-[10px] font-medium text-gray-800">
                Yay grubunu döndür (merkez etrafı):{' '}
                {Math.round(Number(selectedLayoutBlock.arcGroupRotationDeg ?? 0))}°
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={Math.round(Number(selectedLayoutBlock.arcGroupRotationDeg ?? 0))}
                  onChange={(e) =>
                    selectedLayoutBlockId &&
                    patchLayoutBlockAndSyncSeats(selectedLayoutBlockId, {
                      arcGroupRotationDeg: Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full accent-amber-700"
                />
              </label>
              <label className="block text-[10px] font-medium text-gray-800">
                Sıra başına koltuk: {Math.round(Number(selectedLayoutBlock.seatsPerRow ?? selectedLayoutBlock.cols ?? 10))}
                <input
                  type="range"
                  min={2}
                  max={80}
                  value={Math.round(Number(selectedLayoutBlock.seatsPerRow ?? selectedLayoutBlock.cols ?? 10))}
                  onChange={(e) =>
                    selectedLayoutBlockId &&
                    patchLayoutBlockAndSyncSeats(selectedLayoutBlockId, {
                      seatsPerRow: Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full accent-amber-700"
                />
              </label>
              <label className="block text-[10px] font-medium text-gray-800">
                Yay sırası sayısı: {Math.round(Number(selectedLayoutBlock.rows ?? 1))}
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={Math.round(Number(selectedLayoutBlock.rows ?? 1))}
                  onChange={(e) =>
                    selectedLayoutBlockId &&
                    patchLayoutBlockAndSyncSeats(selectedLayoutBlockId, {
                      rows: Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full accent-amber-700"
                />
              </label>
            </div>
          ) : null}
        </div>

        <div className="p-4 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setShowAdvancedTools((v) => !v)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {showAdvancedTools ? 'Gelişmiş araçları gizle' : 'Gelişmiş araçları göster'}
          </button>
        </div>

        {showAdvancedTools ? (
        <div className="p-4 space-y-3 border-b border-gray-100 bg-sky-50/50">
          <p className="text-xs font-semibold text-gray-800">Etkinlik formatı (ön ayar)</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Boşlukları ve sahne ipucunu tek tıkta ayarlayın; ardından <strong>Hizala</strong> ile düzeni
            oturtabilirsiniz.
          </p>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(LAYOUT_PRESETS) as LayoutPresetKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => applyLayoutPreset(key)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
                  layoutPresetKey === key
                    ? 'border-sky-500 bg-sky-100 font-semibold text-sky-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="block font-medium">{LAYOUT_PRESETS[key].label}</span>
                <span className="text-[10px] text-gray-500">
                  koltuk arası {LAYOUT_PRESETS[key].uniformSeatGap}px · sıra arası {LAYOUT_PRESETS[key].uniformRowGap}
                  px · sahne {LAYOUT_PRESETS[key].stage === 'top' ? 'üstte' : 'altta'}
                </span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-gray-700">
            <span className="shrink-0">Sahne etiketi</span>
            <select
              value={stagePosition}
              onChange={(e) => {
                setLayoutPresetKey('CUSTOM')
                setStagePosition(e.target.value as 'top' | 'bottom')
              }}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="top">Üstte (klasik)</option>
              <option value="bottom">Altta / arena</option>
            </select>
          </label>
        </div>
        ) : null}

        {showAdvancedTools ? (
        <div className="p-4 space-y-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-800">Satır ve numara (ayrı ayrı)</p>
          {soleSelectedSeat ? (
            <div className="rounded-lg border border-gray-200 bg-white p-2 space-y-2">
              <p className="text-[10px] font-medium text-gray-500">Seçili tek koltuk</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[10px] text-gray-600">
                  Satır
                  <input
                    key={`r-${soleSelectedSeat.id}`}
                    defaultValue={soleSelectedSeat.row}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v && v !== soleSelectedSeat.row) {
                        patchOneSeatField(soleSelectedSeat.id, { row: v })
                      }
                    }}
                    className="mt-0.5 w-full rounded border border-gray-300 px-1.5 py-1 text-xs"
                  />
                </label>
                <label className="text-[10px] text-gray-600">
                  Numara
                  <input
                    key={`n-${soleSelectedSeat.id}`}
                    defaultValue={soleSelectedSeat.number}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v && v !== soleSelectedSeat.number) {
                        patchOneSeatField(soleSelectedSeat.id, { number: v })
                      }
                    }}
                    className="mt-0.5 w-full rounded border border-gray-300 px-1.5 py-1 text-xs"
                  />
                </label>
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-600 block">
              Çoklu seçim: yeni satır etiketi (numaralar 1…n yeniden)
              <input
                value={bulkRowLabel}
                onChange={(e) => setBulkRowLabel(e.target.value)}
                placeholder="Örn. K, M2"
                className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
              />
            </label>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={applyRowLabelToSelected}
              className="w-full rounded-lg border border-indigo-200 bg-indigo-50 py-1.5 text-xs font-medium text-indigo-800 disabled:opacity-40"
            >
              Seçililere satır ata + soldan sağa numarala
            </button>
            <div className="flex gap-2 items-end">
              <label className="text-[10px] text-gray-600 flex-1">
                Numara başlangıcı
                <input
                  type="number"
                  min={1}
                  value={renumberStart}
                  onChange={(e) => setRenumberStart(Number(e.target.value))}
                  className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
                />
              </label>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={renumberSelectedOnly}
                className="rounded-lg btn-secondary py-1.5 px-2 text-xs shrink-0 disabled:opacity-40"
              >
                Sadece numarala
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-gray-300 p-2 space-y-2">
            <p className="text-[10px] font-medium text-gray-600">Yeni / kopya satır</p>
            <div className="flex gap-1">
              <input
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                placeholder="Yeni satır adı"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <button type="button" onClick={addEmptyRow} className="btn-secondary px-2 py-1 text-xs shrink-0">
                + Satır
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <input
                value={duplicateRowTarget}
                onChange={(e) => setDuplicateRowTarget(e.target.value)}
                placeholder="Kopya hedef satır"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              />
              <input
                type="number"
                min={16}
                max={200}
                value={rowDuplicateOffsetY}
                onChange={(e) => setRowDuplicateOffsetY(Number(e.target.value))}
                title="Dikey öteleme px"
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              />
            </div>
            <button type="button" onClick={duplicateRow} className="w-full btn-secondary py-1 text-xs">
              Seçili satırı aşağı kopyala ({rowCategoryRow || '—'} → hedef)
            </button>
            <button
              type="button"
              onClick={deleteEntireRow}
              className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-medium text-red-800"
            >
              &quot;{rowCategoryRow || '?'}&quot; satırını tamamen sil
            </button>
          </div>
        </div>
        ) : null}

        <div className="p-4 space-y-2 border-b border-gray-100">
          <label className="text-xs font-medium text-gray-600">Yakınlaştır ({Math.round(zoom * 100)}%)</label>
          <input
            type="range"
            min={40}
            max={200}
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="w-full"
          />
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100">
          <div className="flex gap-2">
            <button type="button" onClick={undo} className="btn-secondary flex-1 py-1.5 text-xs" disabled={past.length === 0}>
              Geri al
            </button>
            <button type="button" onClick={redo} className="btn-secondary flex-1 py-1.5 text-xs" disabled={future.length === 0}>
              İleri al
            </button>
          </div>
          <p className="text-xs text-gray-400">Ctrl+Z / Ctrl+Shift+Z</p>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100 bg-gray-50">
          <p className="text-sm">
            Koltuk: <strong>{seats.length}</strong> · Seçili:{' '}
            <strong className="text-indigo-600">{selectedIds.length}</strong>
          </p>
          {svgSource ? (
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showSvgPlan}
                onChange={(e) => setShowSvgPlan(e.target.checked)}
                className="rounded border-gray-300"
              />
              SVG plan arka plan
            </label>
          ) : null}
          {pngRefImage ? (
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showPngRef}
                onChange={(e) => setShowPngRef(e.target.checked)}
                className="rounded border-gray-300"
              />
              PNG referans arka plan
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showRowArrows}
              onChange={(e) => setShowRowArrows(e.target.checked)}
              className="rounded border-gray-300"
            />
            Satır yön oklarını göster
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showSeatLabels}
              onChange={(e) => setShowSeatLabels(e.target.checked)}
              className="rounded border-gray-300"
            />
            Tüm koltuk numaralarını göster (zoom &gt;= 120%)
          </label>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-800">Satır özeti</p>
          <div className="max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-white text-[11px]">
            {rowStats.length === 0 ? (
              <p className="p-2 text-gray-500">Koltuk yok</p>
            ) : (
              rowStats.map(({ row, count }) => (
                <div
                  key={row}
                  className="flex justify-between gap-2 border-b border-gray-100 px-2 py-1.5 last:border-0"
                >
                  <span className="font-medium text-gray-800">{row}</span>
                  <span className="text-gray-600 shrink-0">{count} koltuk</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 space-y-3 border-b border-gray-100 bg-fuchsia-50/40">
          <p className="text-sm font-semibold text-gray-900">PNG ve 1:1 içe aktarım</p>
          <p className="text-[11px] text-gray-600">
            PNG referansından renk eşleştirmesi ve JSON ile birebir koltuk yerleşimi aktarımı.
          </p>
          <label className="block">
            <span className="text-[11px] text-gray-700">PNG referans yükle</span>
            <input
              type="file"
              accept=".png,image/png"
              onChange={(e) => handlePngReferenceUpload(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-xs file:mr-2 file:rounded file:border file:border-gray-300 file:bg-white file:px-2 file:py-1"
            />
          </label>
          <label className="block text-[11px] text-gray-700">
            PNG opaklık ({Math.round(pngRefOpacity * 100)}%)
            <input
              type="range"
              min={10}
              max={95}
              value={Math.round(pngRefOpacity * 100)}
              onChange={(e) => setPngRefOpacity(Number(e.target.value) / 100)}
              className="mt-1 w-full"
            />
          </label>
          <p className="text-[10px] text-gray-500">
            PNG sadece kılavuz altlıktır; koltuk verisi olarak kaydedilmez.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={applyColorsFromPngReference}
              className="rounded-lg bg-fuchsia-600 px-2 py-2 text-xs font-semibold text-white hover:bg-fuchsia-700"
            >
              PNG rengine göre kategorile
            </button>
            <div className="space-y-1">
              <input
                type="number"
                min={8}
                max={120}
                value={referenceSeatSize}
                onChange={(e) => setReferenceSeatSize(Number(e.target.value))}
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
                placeholder="Koltuk boyutu px"
              />
              <button
                type="button"
                onClick={applyReferenceSeatSizeAll}
                className="w-full rounded-lg border border-fuchsia-300 bg-white px-2 py-1.5 text-xs font-medium text-fuchsia-800"
              >
                Boyutu uygula
              </button>
            </div>
          </div>
          <label className="block">
            <span className="text-[11px] text-gray-700">JSON koltuk haritası yükle (1:1)</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => importSeatMapJson(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-xs file:mr-2 file:rounded file:border file:border-gray-300 file:bg-white file:px-2 file:py-1"
            />
          </label>
          <p className="text-[10px] text-gray-500">
            JSON yüklenince mevcut koltuk düzeni bununla değiştirilir. Kaydettiğinizde veritabanına birebir işlenir.
          </p>
        </div>

        <div className="p-4 space-y-3 border-b border-gray-100 bg-indigo-50/50">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900">CurvedBlock Parametre Üretici</p>
            <button
              type="button"
              onClick={fillCurvedBlockFromArc}
              className="shrink-0 rounded border border-indigo-300 bg-white px-2 py-1 text-xs font-medium text-indigo-800"
            >
              Arc bloktan doldur
            </button>
          </div>
          <p className="text-[10px] text-indigo-700/80">
            Hazır düzen için üstteki büyük butonu kullanın (etiket yok; üzerine gelince ipucu çıkar).
          </p>
          <p className="text-[11px] text-gray-600">
            Aşağıdaki değerleri girin; çıktı doğrudan `CurvedBlock` config objesi olarak kopyalanabilir.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={curvedBlockForm.blockId}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, blockId: e.target.value }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs col-span-2"
              placeholder="blockId"
            />
            <input
              type="number"
              value={curvedBlockForm.centerX}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, centerX: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="centerX"
            />
            <input
              type="number"
              value={curvedBlockForm.centerY}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, centerY: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="centerY"
            />
            <input
              type="number"
              value={curvedBlockForm.startRadius}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, startRadius: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="startRadius"
            />
            <input
              type="number"
              value={curvedBlockForm.rowGap}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, rowGap: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="rowGap"
            />
            <input
              type="number"
              value={curvedBlockForm.startAngleDeg}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, startAngleDeg: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="startAngleDeg"
            />
            <input
              type="number"
              value={curvedBlockForm.endAngleDeg}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, endAngleDeg: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="endAngleDeg"
            />
            <input
              type="number"
              min={1}
              value={curvedBlockForm.rows}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, rows: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="rows"
            />
            <input
              type="number"
              min={2}
              value={curvedBlockForm.seatsPerRow}
              onChange={(e) => setCurvedBlockForm((v) => ({ ...v, seatsPerRow: Number(e.target.value) }))}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
              placeholder="seatsPerRow"
            />
          </div>
          <pre className="max-h-40 overflow-auto rounded-lg border border-indigo-100 bg-white p-2 text-[10px] leading-relaxed text-gray-700">
{curvedBlockConfigText}
          </pre>
          <button
            type="button"
            onClick={copyCurvedBlockConfig}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            CurvedBlock config'i kopyala
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-gray-100 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Layout Blocks (component modeli)</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={addLayoutBlock}
                className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-emerald-800"
              >
                + Blok
              </button>
              <button
                type="button"
                onClick={addCenterArcPreset}
                className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-emerald-800"
              >
                Center
              </button>
              <button
                type="button"
                onClick={addSidePreset}
                className="rounded border border-emerald-300 bg-white px-2 py-1 text-xs font-medium text-emerald-800"
              >
                Side
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-600">
            Her blok kendi satır/sütun/gap/rotation ayarına sahiptir. Uygula dediğinizde koltuklar bu şemadan üretilir.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={exportLayoutBlocks}
              className="rounded border border-emerald-300 bg-white px-2 py-1.5 text-xs font-medium text-emerald-900"
            >
              Layout JSON dışa aktar
            </button>
            <label className="rounded border border-emerald-300 bg-white px-2 py-1.5 text-center text-xs font-medium text-emerald-900 cursor-pointer">
              Layout JSON içe al
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => importLayoutBlocks(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-[11px] text-gray-700">
            <input
              type="checkbox"
              checked={showLayoutGuides}
              onChange={(e) => setShowLayoutGuides(e.target.checked)}
              className="rounded border-gray-300"
            />
            Sahnedeki blok kılavuzlarını göster (sürükle/döndür)
          </label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[11px] text-gray-700">
              <span className="font-medium">Sıra Grup Mesafesi (Y Eşiği):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={rowGroupDistance}
                onChange={(e) => {
                  const newValue = Number(e.target.value)
                  console.log('Sıra Grup Mesafesi değişti:', newValue)
                  setRowGroupDistance(newValue)
                }}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="min-w-[40px] text-[10px] font-medium text-gray-700 bg-gray-100 px-1 py-0.5 rounded">
                {rowGroupDistance}px
              </span>
            </div>
            <p className="text-[10px] text-gray-500">Sıralar arası dikey mesafe (20-100px)</p>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {layoutBlocks.map((block) => (
              <div key={block.id} className="rounded-lg border border-emerald-200 bg-white p-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-800">{block.id}</p>
                  <button
                    type="button"
                    onClick={() => removeLayoutBlock(block.id)}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    sil
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="number"
                    value={block.blockX}
                    onChange={(e) => updateLayoutBlock(block.id, { blockX: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="blockX"
                  />
                  <input
                    type="number"
                    value={block.blockY}
                    onChange={(e) => updateLayoutBlock(block.id, { blockY: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="blockY"
                  />
                  <input
                    type="number"
                    min={1}
                    value={block.rows}
                    onChange={(e) => updateLayoutBlock(block.id, { rows: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="rows"
                  />
                  <input
                    type="number"
                    min={1}
                    value={block.cols}
                    onChange={(e) => updateLayoutBlock(block.id, { cols: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="cols"
                  />
                  <input
                    type="number"
                    value={block.gapX}
                    onChange={(e) => updateLayoutBlock(block.id, { gapX: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="gapX"
                  />
                  <input
                    type="number"
                    value={block.gapY}
                    onChange={(e) => updateLayoutBlock(block.id, { gapY: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="gapY"
                  />
                  <input
                    type="number"
                    value={block.seatWidth}
                    onChange={(e) => updateLayoutBlock(block.id, { seatWidth: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="seatW"
                  />
                  <input
                    type="number"
                    value={block.seatHeight}
                    onChange={(e) => updateLayoutBlock(block.id, { seatHeight: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="seatH"
                  />
                  <input
                    value={block.rowLabel}
                    onChange={(e) => updateLayoutBlock(block.id, { rowLabel: e.target.value })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="rowLabel"
                  />
                  <input
                    type="number"
                    value={block.rotation}
                    onChange={(e) => updateLayoutBlock(block.id, { rotation: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="rotation"
                  />
                  <select
                    value={block.type}
                    onChange={(e) => updateLayoutBlock(block.id, { type: e.target.value as BlockLayoutType })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                  >
                    <option value="straight">straight</option>
                    <option value="curved">curved</option>
                    <option value="arc">arc</option>
                  </select>
                  <input
                    type="number"
                    value={block.curveStrength || 0}
                    onChange={(e) => updateLayoutBlock(block.id, { curveStrength: Number(e.target.value) })}
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    placeholder="curve"
                  />
                  {block.type === 'arc' ? (
                    <>
                      <input
                        type="number"
                        value={block.centerX ?? 500}
                        onChange={(e) => updateLayoutBlock(block.id, { centerX: Number(e.target.value) })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="centerX"
                      />
                      <input
                        type="number"
                        value={block.centerY ?? 120}
                        onChange={(e) => updateLayoutBlock(block.id, { centerY: Number(e.target.value) })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="centerY"
                      />
                      <input
                        type="number"
                        min={1}
                        value={block.startRadius ?? 240}
                        onChange={(e) => updateLayoutBlock(block.id, { startRadius: Number(e.target.value) })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="startRadius"
                      />
                      <input
                        type="number"
                        min={1}
                        value={block.rowGap ?? 24}
                        onChange={(e) => updateLayoutBlock(block.id, { rowGap: Number(e.target.value) })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="rowGap"
                      />
                      <input
                        type="number"
                        value={block.startAngleDeg ?? 150}
                        onChange={(e) => updateLayoutBlock(block.id, { startAngleDeg: Number(e.target.value) })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="start°"
                      />
                      <input
                        type="number"
                        value={block.endAngleDeg ?? 30}
                        onChange={(e) => updateLayoutBlock(block.id, { endAngleDeg: Number(e.target.value) })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="end°"
                      />
                      <input
                        type="number"
                        min={2}
                        value={block.seatsPerRow ?? block.cols}
                        onChange={(e) => updateLayoutBlock(block.id, { seatsPerRow: Number(e.target.value) })}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                        placeholder="seats/row"
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={applyLayoutBlocksToSeats}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Layout bloklarını koltuklara uygula
          </button>
        </div>

        {showAdvancedTools ? (
        <>
        <div className="p-4 space-y-3 border-b border-gray-100 bg-amber-50/60">
          <p className="text-sm font-semibold text-gray-900">Hizala</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Seçim yoksa <strong>tüm sıralar</strong>; seçim varsa yalnızca seçili koltukların bulunduğu sıralar düzenlenir.
            Boşlukları artırıp tekrar uygulayın; geri al ile eski haline dönebilirsiniz.
          </p>
          <div>
            <label className="text-[11px] font-medium text-gray-700">Numara yönü</label>
            <select
              value={rowNumberDirection}
              onChange={(e) => setRowNumberDirection(e.target.value as NumberDirection)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
            >
              <option value="LTR">Soldan sağa (1,2,3…)</option>
              <option value="RTL">Sağdan sola (…3,2,1)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-700">Koltuk arası (px)</label>
              <input
                type="number"
                min={0}
                max={80}
                value={uniformSeatGap}
                onChange={(e) => setUniformSeatGap(Number(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-700">Sıra arası (px)</label>
              <input
                type="number"
                min={0}
                max={120}
                value={uniformRowGap}
                onChange={(e) => setUniformRowGap(Number(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-500">Sıra arası 0 iken dikey konum korunur; &gt;0 iken sıralar alt alta aralıklı dizilir.</p>
          <button
            type="button"
            onClick={applyHizalaBulk}
            className="w-full rounded-lg bg-amber-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Hizala (seçili satırlar / tümü)
          </button>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700">Seçililere dönüş</p>
          <div className="flex gap-1">
            <button type="button" className="btn-secondary flex-1 text-xs py-1" onClick={() => rotateSelected(-15)}>
              −15°
            </button>
            <button type="button" className="btn-secondary flex-1 text-xs py-1" onClick={() => rotateSelected(15)}>
              +15°
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100 bg-violet-50/40">
          <p className="text-xs font-semibold text-gray-800">Şekil: genişlik, yükseklik, eğim</p>
          <p className="text-[10px] text-gray-600">Seçili koltuklara aynı boyut ve dönüşü uygular (daire / dikdörtgen).</p>
          <div className="grid grid-cols-3 gap-1">
            <label className="text-[10px] text-gray-600">
              Genişlik
              <input
                type="number"
                min={8}
                max={120}
                value={bulkWidth}
                onChange={(e) => setBulkWidth(Number(e.target.value))}
                className="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-xs"
              />
            </label>
            <label className="text-[10px] text-gray-600">
              Yükseklik
              <input
                type="number"
                min={8}
                max={120}
                value={bulkHeight}
                onChange={(e) => setBulkHeight(Number(e.target.value))}
                className="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-xs"
              />
            </label>
            <label className="text-[10px] text-gray-600">
              Eğim °
              <input
                type="number"
                value={bulkRotation}
                onChange={(e) => setBulkRotation(Number(e.target.value))}
                className="mt-0.5 w-full rounded border border-gray-300 px-1 py-1 text-xs"
              />
            </label>
          </div>
          <select
            value={bulkShape}
            onChange={(e) => setBulkShape(e.target.value as 'circle' | 'rect')}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="circle">Daire</option>
            <option value="rect">Dikdörtgen</option>
          </select>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={applyBulkSeatGeometry}
            className="w-full rounded-lg bg-violet-600 px-2 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
          >
            Seçililere boyut ve eğimi uygula
          </button>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700">Eğri blok (seçili / tümü)</p>
          <label className="block text-[11px] text-gray-500">
            Eğrilik: {curveStrength}
          </label>
          <input
            type="range"
            min={6}
            max={70}
            value={curveStrength}
            onChange={(e) => setCurveStrength(Number(e.target.value))}
            className="w-full"
          />
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={curveRotate}
              onChange={(e) => setCurveRotate(e.target.checked)}
              className="rounded border-gray-300"
            />
            Eğriye göre koltukları döndür
          </label>
          <button type="button" onClick={applyCurvedBlock} className="w-full btn-secondary py-1.5 text-xs">
            Eğri blok uygula
          </button>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700">Otomatik koridor (seçili / tümü)</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-gray-600">
              Her
              <input
                type="number"
                min={2}
                max={40}
                value={aisleEvery}
                onChange={(e) => setAisleEvery(Number(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
              />
            </label>
            <label className="text-[11px] text-gray-600">
              Koridor px
              <input
                type="number"
                min={4}
                max={120}
                value={aisleWidth}
                onChange={(e) => setAisleWidth(Number(e.target.value))}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs"
              />
            </label>
          </div>
          <button type="button" onClick={applyAutoAisles} className="w-full btn-secondary py-1.5 text-xs">
            Otomatik koridor uygula
          </button>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700">Satıra kategori</p>
          <select
            value={rowCategoryRow}
            onChange={(e) => setRowCategoryRow(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            {uniqueRows.map((r) => (
              <option key={r} value={r}>
                {r} ({seats.filter((s) => s.row === r).length})
              </option>
            ))}
          </select>
          <select
            value={rowCategoryType}
            onChange={(e) => setRowCategoryType(e.target.value as SeatType)}
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" onClick={applyCategoryToRow} className="w-full btn-secondary py-1.5 text-xs">
            Bu satıra uygula
          </button>
          <label className="block text-[11px] text-gray-600 pt-1">
            Tek/çift sıra yatay ofset (px)
            <input
              type="number"
              value={doubleRowOffset}
              onChange={(e) => setDoubleRowOffset(Number(e.target.value))}
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
            />
          </label>
          <button type="button" onClick={alignAndRenumberRow} className="w-full btn-secondary py-1.5 text-xs">
            Satırı hizala + yeniden numarala
          </button>
          <button type="button" onClick={flipRowDirection} className="w-full btn-secondary py-1.5 text-xs">
            Satırı ters çevir (yön)
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              max={200}
              value={addSeatsCount}
              onChange={(e) => setAddSeatsCount(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1.5 text-xs"
              placeholder="adet"
            />
            <button type="button" onClick={addSeatsToRow} className="btn-secondary py-1.5 text-xs">
              Satıra koltuk ekle
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700">Blok seçimi (lasso sonrası)</p>
          <button type="button" onClick={repartitionBlocksFromSelection} className="w-full btn-secondary py-1.5 text-xs">
            Seçilileri B1-B4 olarak ayır
          </button>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] text-gray-600">
              Bölümler arası koridor (px)
              <input
                type="number"
                min={8}
                max={200}
                value={blockBoundaryGap}
                onChange={(e) => setBlockBoundaryGap(Number(e.target.value))}
                className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-xs"
              />
            </label>
            <button
              type="button"
              onClick={applyBlockBoundaryAisles}
              className="self-end rounded-lg border border-emerald-300 bg-emerald-50 py-1.5 text-[11px] font-medium text-emerald-900"
            >
              Blok sınırlarına geçiş ekle
            </button>
          </div>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={clearBlockLabelsSelection}
            className="w-full rounded border border-gray-300 bg-gray-50 py-1 text-[11px] text-gray-700 disabled:opacity-40"
          >
            Seçililerin blok etiketini kaldır
          </button>
          <div className="grid grid-cols-4 gap-1">
            {(['B1', 'B2', 'B3', 'B4'] as BlockName[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => selectBlock(b)}
                className="rounded border border-gray-300 bg-gray-50 py-1 text-[11px] font-medium text-gray-700"
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
            <p className="text-[10px] font-semibold text-gray-700 mb-1.5">Kategori rehberi</p>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {ALL_TYPES.map((type) => (
                <li key={type} className="flex items-center gap-2 text-[10px] text-gray-800">
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
                    style={{ backgroundColor: SEAT_COLORS[type] }}
                  />
                  <span className="font-medium">{type}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[9px] text-gray-500">
              Etkinlik bazında farklı fiyatlar için bilet kategorileri kullanılır; buradaki renkler salonda ayırt
              etmeyi kolaylaştırır.
            </p>
          </div>
        </div>
        </>
        ) : null}

        <div className="p-4 mt-auto border-t border-gray-200 space-y-2">
          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="w-full btn-primary py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {isSaving ? 'Kaydediliyor…' : 'Tümünü sunucuya kaydet'}
          </button>
          <button
            type="button"
            onClick={copyFullHallJson}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
          >
            Salon JSON&apos;unu panoya kopyala
          </button>
          <p className="text-[10px] text-gray-400">
            JSON: koltuklar + layout blokları + sahne özeti. Kayıt: silinenler ve yeniler kalıcı olur; geri al yığını
            kayıt sonrası sıfırlanır.
          </p>
        </div>
      </aside>

      <div
        className="flex-1 min-h-0 min-w-0 overflow-auto bg-gray-200"
        onWheel={(e) => {
          if (e.ctrlKey) {
            e.preventDefault()
            setZoom((z) => Math.min(2.2, Math.max(0.35, z - e.deltaY * 0.001)))
          }
        }}
      >
        <div
          className="inline-block p-6"
          style={{
            minWidth: editorPan.sw + 48,
            minHeight: editorPan.sh + 48,
          }}
        >
          <Stage
            width={editorPan.sw}
            height={editorPan.sh}
            className="bg-white shadow-xl ring-1 ring-gray-300"
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onClick={handleStageClick}
          >
            <Layer>
              <Group x={editorPan.gx} y={editorPan.gy} scaleX={zoom} scaleY={zoom}>
                {showPngRef && pngRefImage ? (
                  <KonvaImage
                    image={pngRefImage}
                    x={0}
                    y={0}
                    width={stageWidth}
                    height={stageHeight}
                    opacity={pngRefOpacity}
                    listening={false}
                  />
                ) : null}
                {showSvgPlan && svgBgImage ? (
                  <KonvaImage
                    image={svgBgImage}
                    x={0}
                    y={0}
                    width={stageWidth}
                    height={stageHeight}
                    opacity={0.3}
                    listening={false}
                  />
                ) : null}
                {source !== 'enhanced-svg' && source !== 'svg' ? (
                  <Text
                    x={stageWidth / 2 - 40}
                    y={stagePosition === 'top' ? 24 : stageHeight - 36}
                    text="SAHNE"
                    fontSize={20}
                    fontStyle="bold"
                    fill="#374151"
                  />
                ) : null}
                {rowArrowMeta.map((a) => (
                  <Text
                    key={`row-arrow-${a.row}`}
                    x={a.x}
                    y={a.y}
                    offsetX={8}
                    offsetY={8}
                    rotation={a.rotation}
                    text={a.text}
                    fontSize={16}
                    fill="#2563eb"
                    fontStyle="bold"
                    listening={false}
                  />
                ))}
                {seats.map((seat) => {
                  const selected = selectedIds.includes(seat.id)
                  const canDrag =
                    toolMode === 'select' &&
                    (selectedIds.length === 0 || selectedIds.includes(seat.id))
                  return (
                    <SeatNode
                      key={seat.id}
                      seat={seat}
                      selected={selected}
                      canDrag={canDrag}
                      blockLabel={seatBlocks[seat.id]}
                      showLabel={selected || (showSeatLabels && canShowDenseLabels)}
                      showCategoryHint={showCategoryOnSeats}
                      onDragEnd={(e) => handleSeatDragEnd(e, seat)}
                      onClick={(e) => handleSeatClick(e, seat)}
                    />
                  )
                })}
                {showLayoutGuides
                  ? layoutBlocks.map((block) => {
                      const blockSelected = selectedLayoutBlockId === block.id
                      const guideStroke = blockSelected ? '#ea580c' : '#10b981'
                      const guideWidth = blockSelected ? 2 : 1
                      if (block.type === 'arc') {
                        const cx = Number(block.centerX ?? block.blockX)
                        const cy = Number(block.centerY ?? block.blockY)
                        const sc = block.scale ?? 1
                        const baseStartR = Math.max(1, Number(block.startRadius ?? 220))
                        const baseRowGap = Math.max(1, Number(block.rowGap ?? 24))
                        const startRadius = baseStartR * sc
                        const endRadius =
                          startRadius + Math.max(0, block.rows - 1) * baseRowGap * sc
                        const handleR = endRadius + 36
                        const handleAngleDeg =
                          ((Number(block.arcGroupRotationDeg ?? block.rotation ?? 0) % 360) + 360) % 360
                        const rotRad = (handleAngleDeg * Math.PI) / 180
                        const hX = cx + handleR * Math.cos(rotRad)
                        const hY = cy + handleR * Math.sin(rotRad)
                        const midAngleRad =
                          (((Number(block.startAngleDeg ?? 120) + Number(block.endAngleDeg ?? 60)) / 2) *
                            Math.PI) /
                          180
                        const scaleHX = cx + endRadius * Math.cos(midAngleRad)
                        const scaleHY = cy + endRadius * Math.sin(midAngleRad)
                        return (
                          <Group key={`guide-${block.id}`}>
                            <Circle
                              x={cx}
                              y={cy}
                              radius={startRadius}
                              stroke={guideStroke}
                              strokeWidth={guideWidth}
                              dash={[4, 4]}
                              listening={false}
                            />
                            <Circle
                              x={cx}
                              y={cy}
                              radius={endRadius}
                              stroke={guideStroke}
                              strokeWidth={guideWidth}
                              dash={[4, 4]}
                              listening={false}
                            />
                            <Circle
                              x={cx}
                              y={cy}
                              radius={8}
                              fill="#10b981"
                              stroke="#ecfdf5"
                              strokeWidth={1}
                              hitStrokeWidth={14}
                              draggable
                              onMouseDown={(e) => selectLayoutBlockOnCanvas(block.id, e)}
                              onDragStart={() => {
                                if (!layoutCenterDragHistoryPushed.current) {
                                  layoutCenterDragHistoryPushed.current = true
                                  pushHistory(seatsRef.current)
                                }
                              }}
                              onDragMove={(e) => dragLayoutBlockGuide(block.id, e.target.x(), e.target.y())}
                              onDragEnd={() => {
                                layoutCenterDragHistoryPushed.current = false
                              }}
                            />
                            <Circle
                              x={hX}
                              y={hY}
                              radius={6}
                              fill="#0ea5e9"
                              stroke="#e0f2fe"
                              strokeWidth={1}
                              hitStrokeWidth={14}
                              draggable
                              onMouseDown={(e) => selectLayoutBlockOnCanvas(block.id, e)}
                              onDragStart={() => {
                                if (!layoutRotateDragHistoryPushed.current) {
                                  layoutRotateDragHistoryPushed.current = true
                                  pushHistory(seatsRef.current)
                                }
                              }}
                              onDragMove={(e) => rotateLayoutBlockGuide(block.id, e.target.x(), e.target.y())}
                              onDragEnd={() => {
                                layoutRotateDragHistoryPushed.current = false
                              }}
                            />
                            <Circle
                              x={scaleHX}
                              y={scaleHY}
                              radius={7}
                              fill="#a855f7"
                              stroke="#faf5ff"
                              strokeWidth={1}
                              hitStrokeWidth={14}
                              draggable
                              onMouseDown={(e) => selectLayoutBlockOnCanvas(block.id, e)}
                              onDragStart={() => {
                                if (!layoutScaleHistoryPushed.current) {
                                  layoutScaleHistoryPushed.current = true
                                  pushHistory(seatsRef.current)
                                }
                              }}
                              onDragMove={(e) =>
                                resizeLayoutBlockScale(block.id, e.target.x(), e.target.y())
                              }
                              onDragEnd={() => {
                                layoutScaleHistoryPushed.current = false
                              }}
                            />
                          </Group>
                        )
                      }
                      const sc = block.scale ?? 1
                      const width = sc * Math.max(1, block.cols) * (block.seatWidth + block.gapX)
                      const height = sc * Math.max(1, block.rows) * (block.seatHeight + block.gapY)
                      const rad = (Number(block.rotation || 0) * Math.PI) / 180
                      const hX = block.blockX + Math.cos(rad) * (Math.max(width, height) * 0.5 + 28)
                      const hY = block.blockY + Math.sin(rad) * (Math.max(width, height) * 0.5 + 28)
                      const scaleHX = block.blockX + width
                      const scaleHY = block.blockY + height
                      return (
                        <Group key={`guide-${block.id}`}>
                          <KonvaRect
                            x={block.blockX}
                            y={block.blockY}
                            width={width}
                            height={height}
                            stroke={guideStroke}
                            strokeWidth={guideWidth}
                            dash={[4, 4]}
                            listening={false}
                          />
                          <Circle
                            x={block.blockX}
                            y={block.blockY}
                            radius={7}
                            fill="#10b981"
                            stroke="#ecfdf5"
                            strokeWidth={1}
                            hitStrokeWidth={14}
                            draggable
                            onMouseDown={(e) => selectLayoutBlockOnCanvas(block.id, e)}
                            onDragStart={() => {
                              if (!layoutCenterDragHistoryPushed.current) {
                                layoutCenterDragHistoryPushed.current = true
                                pushHistory(seatsRef.current)
                              }
                            }}
                            onDragMove={(e) => dragLayoutBlockGuide(block.id, e.target.x(), e.target.y())}
                            onDragEnd={() => {
                              layoutCenterDragHistoryPushed.current = false
                            }}
                          />
                          <Circle
                            x={hX}
                            y={hY}
                            radius={6}
                            fill="#0ea5e9"
                            stroke="#e0f2fe"
                            strokeWidth={1}
                            hitStrokeWidth={14}
                            draggable
                            onMouseDown={(e) => selectLayoutBlockOnCanvas(block.id, e)}
                            onDragStart={() => {
                              if (!layoutRotateDragHistoryPushed.current) {
                                layoutRotateDragHistoryPushed.current = true
                                pushHistory(seatsRef.current)
                              }
                            }}
                            onDragMove={(e) => rotateLayoutBlockGuide(block.id, e.target.x(), e.target.y())}
                            onDragEnd={() => {
                              layoutRotateDragHistoryPushed.current = false
                            }}
                          />
                          <Circle
                            x={scaleHX}
                            y={scaleHY}
                            radius={7}
                            fill="#a855f7"
                            stroke="#faf5ff"
                            strokeWidth={1}
                            hitStrokeWidth={14}
                            draggable
                            onMouseDown={(e) => selectLayoutBlockOnCanvas(block.id, e)}
                            onDragStart={() => {
                              if (!layoutScaleHistoryPushed.current) {
                                layoutScaleHistoryPushed.current = true
                                pushHistory(seatsRef.current)
                              }
                            }}
                            onDragMove={(e) =>
                              resizeLayoutBlockScale(block.id, e.target.x(), e.target.y())
                            }
                            onDragEnd={() => {
                              layoutScaleHistoryPushed.current = false
                            }}
                          />
                        </Group>
                      )
                    })
                  : null}
              </Group>
            </Layer>
            <Layer listening={false}>
              <Group x={editorPan.gx} y={editorPan.gy} scaleX={zoom} scaleY={zoom}>
                {isSelecting && selectionRect.width > 0 && selectionRect.height > 0 ? (
                  <KonvaRect
                    x={selectionRect.x}
                    y={selectionRect.y}
                    width={selectionRect.width}
                    height={selectionRect.height}
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="rgba(249, 115, 22, 0.2)"
                    dash={[6, 4]}
                  />
                ) : null}
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>
      </div>
    </div>
  )
}
