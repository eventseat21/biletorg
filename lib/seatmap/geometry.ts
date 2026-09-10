// Koltuk haritası geometri yardımcıları (v2).
import type { SeatItem, SeatShape, WorldPoint } from './types'

export const GRID = 10

export function snapToGrid(value: number, grid = GRID): number {
  return Math.round(value / grid) * grid
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function computeBounds(seats: SeatItem[]): Bounds | null {
  if (seats.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < seats.length; i++) {
    const s = seats[i]
    if (s.x < minX) minX = s.x
    if (s.y < minY) minY = s.y
    if (s.x + s.width > maxX) maxX = s.x + s.width
    if (s.y + s.height > maxY) maxY = s.y + s.height
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

/** Ekran noktasına denk gelen koltuğu bulur (en üstteki kazanır). */
export function seatHitTest(seats: SeatItem[], point: WorldPoint, slop = 3): SeatItem | null {
  for (let i = seats.length - 1; i >= 0; i--) {
    const s = seats[i]
    if (
      point.x >= s.x - slop &&
      point.x <= s.x + s.width + slop &&
      point.y >= s.y - slop &&
      point.y <= s.y + s.height + slop
    ) {
      return s
    }
  }
  return null
}

/** Verilen dikdörtgenle kesişen tüm koltukları döndürür (çerçeve seçimi için). */
export function seatsInRect(
  seats: SeatItem[],
  rect: { x: number; y: number; width: number; height: number }
): SeatItem[] {
  const left = Math.min(rect.x, rect.x + rect.width)
  const right = Math.max(rect.x, rect.x + rect.width)
  const top = Math.min(rect.y, rect.y + rect.height)
  const bottom = Math.max(rect.y, rect.y + rect.height)
  return seats.filter(
    (s) => s.x < right && s.x + s.width > left && s.y < bottom && s.y + s.height > top
  )
}

let idCounter = 0

/** Henüz veritabanında olmayan yeni bir koltuk için geçici kimlik. */
export function makeSeatId(): string {
  idCounter += 1
  return `new-${Date.now().toString(36)}-${idCounter}`
}

export function isPersistedId(id: string): boolean {
  return !id.startsWith('new-')
}

/** 0 -> A, 25 -> Z, 26 -> AA ... */
export function rowLabel(index: number): string {
  let n = index
  let label = ''
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

/** Mevcut satır etiketlerinden sonra gelecek sıradaki harfi verir. */
export function nextRowLabel(existingRows: readonly string[]): string {
  let maxIndex = -1
  for (let i = 0; i < existingRows.length; i++) {
    const trimmed = String(existingRows[i]).trim().toUpperCase()
    if (!/^[A-Z]+$/.test(trimmed)) continue
    let value = 0
    for (const ch of trimmed) value = value * 26 + (ch.charCodeAt(0) - 64)
    if (value - 1 > maxIndex) maxIndex = value - 1
  }
  return rowLabel(maxIndex + 1)
}

export interface RowGeneratorOptions {
  rows: number
  seatsPerRow: number
  /** Koltuklar arası yatay boşluk. */
  gapX: number
  /** Satırlar arası dikey boşluk. */
  gapY: number
  seatWidth: number
  seatHeight: number
  shape: SeatShape
  type: string
  /** İlk satırın sol-üst köşesi. */
  originX: number
  originY: number
  /** 0 = A'dan başlar. */
  startRowIndex?: number
  startNumber?: number
  /** Blok düzeni (ör. [4, 4, 5, 2]); blokların arasına koridor boşluğu eklenir. */
  blocks?: number[]
  blockGap?: number
  /** Koltuk numara dizilimi. */
  numbering?: 'sequential' | 'odd' | 'even' | 'split'
  /** Numaraların görsel yönü. */
  numberDirection?: 'ltr' | 'rtl'
  /** 0 = düz satır. Pozitif değer satırı yukarı doğru yaylar. */
  curve?: number
}

/**
 * Dikdörtgen/ızgara biçiminde toplu koltuk üretir.
 * Editördeki "Satır Üret" aracının motoru.
 */
export function generateRows(opts: RowGeneratorOptions): SeatItem[] {
  const {
    rows,
    seatsPerRow,
    gapX,
    gapY,
    seatWidth,
    seatHeight,
    shape,
    type,
    originX,
    originY,
    startRowIndex = 0,
    startNumber = 1,
    blocks,
    blockGap = 34,
    numbering = 'sequential',
    numberDirection = 'ltr',
    curve = 0,
  } = opts

  const seats: SeatItem[] = []
  const pitchX = seatWidth + gapX
  const pitchY = seatHeight + gapY
  const validBlocks = blocks?.filter((count) => Number.isFinite(count) && count > 0).map(Math.floor)
  const hasBlocks = Boolean(validBlocks && validBlocks.length > 0)
  const totalSeats = hasBlocks
    ? (validBlocks as number[]).reduce((sum, count) => sum + count, 0)
    : seatsPerRow

  for (let r = 0; r < rows; r++) {
    const rowName = rowLabel(startRowIndex + r)
    let seatIndex = 0
    let blockStartX = originX
    const rowBlocks = hasBlocks ? (validBlocks as number[]) : [seatsPerRow]

    for (let b = 0; b < rowBlocks.length; b++) {
      const count = rowBlocks[b]
      for (let c = 0; c < count; c++) {
        const x = blockStartX + c * pitchX
        let y = originY + r * pitchY

        if (curve !== 0 && totalSeats > 1) {
          const t = seatIndex / (totalSeats - 1) // 0..1
          y += curve * (1 - 4 * (t - 0.5) ** 2)
        }

        const logicalIndex = numberDirection === 'ltr' ? seatIndex : totalSeats - 1 - seatIndex
        let seatNumber: number
        if (numbering === 'odd') {
          const oddStart = startNumber % 2 === 0 ? startNumber + 1 : startNumber
          seatNumber = oddStart + logicalIndex * 2
        } else if (numbering === 'even') {
          const evenStart = startNumber % 2 === 0 ? startNumber : startNumber + 1
          seatNumber = evenStart + logicalIndex * 2
        } else if (numbering === 'split') {
          const leftCount = Math.ceil(totalSeats / 2)
          seatNumber =
            logicalIndex < leftCount
              ? 1 + logicalIndex * 2
              : 2 + (logicalIndex - leftCount) * 2
        } else {
          seatNumber = startNumber + logicalIndex
        }

        seats.push({
          id: makeSeatId(),
          row: rowName,
          number: String(seatNumber),
          x: Math.round(x),
          y: Math.round(y),
          width: seatWidth,
          height: seatHeight,
          type,
          shape,
          rotation: 0,
        })
        seatIndex++
      }
      blockStartX += count * pitchX + (b < rowBlocks.length - 1 ? blockGap : 0)
    }
  }

  return seats
}

export interface ArcGeneratorOptions {
  rows: number
  seatsPerRow: number
  centerX: number
  centerY: number
  startRadius: number
  rowGap: number
  startAngleDeg: number
  endAngleDeg: number
  seatWidth: number
  seatHeight: number
  shape: SeatShape
  type: string
  startRowIndex?: number
  startNumber?: number
}

/** Merkez etrafında yay (kavisli) sıralar üretir. Stadyum/arena için. */
export function generateArcRows(opts: ArcGeneratorOptions): SeatItem[] {
  const {
    rows,
    seatsPerRow,
    centerX,
    centerY,
    startRadius,
    rowGap,
    startAngleDeg,
    endAngleDeg,
    seatWidth,
    seatHeight,
    shape,
    type,
    startRowIndex = 0,
    startNumber = 1,
  } = opts

  const seats: SeatItem[] = []
  if (rows < 1 || seatsPerRow < 1) return seats

  const a0 = (startAngleDeg * Math.PI) / 180
  const a1 = (endAngleDeg * Math.PI) / 180

  for (let r = 0; r < rows; r++) {
    const radius = startRadius + r * rowGap
    const rowName = rowLabel(startRowIndex + r)
    for (let c = 0; c < seatsPerRow; c++) {
      const t = seatsPerRow === 1 ? 0.5 : c / (seatsPerRow - 1)
      const angle = a0 + (a1 - a0) * t
      const px = centerX + radius * Math.cos(angle)
      const py = centerY + radius * Math.sin(angle)
      seats.push({
        id: makeSeatId(),
        row: rowName,
        number: String(startNumber + c),
        x: Math.round(px - seatWidth / 2),
        y: Math.round(py - seatHeight / 2),
        width: seatWidth,
        height: seatHeight,
        type,
        shape,
        rotation: Math.round((angle * 180) / Math.PI + 90),
      })
    }
  }

  return seats
}

/** Yuvarlak masa etrafına koltuk dizer (gala/düğün düzenleri). */
export function generateTableSeats(opts: {
  centerX: number
  centerY: number
  radius: number
  count: number
  seatWidth: number
  seatHeight: number
  shape: SeatShape
  type: string
  rowName: string
  startNumber?: number
}): SeatItem[] {
  const {
    centerX,
    centerY,
    radius,
    count,
    seatWidth,
    seatHeight,
    shape,
    type,
    rowName,
    startNumber = 1,
  } = opts

  const seats: SeatItem[] = []
  if (count < 1) return seats

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const px = centerX + radius * Math.cos(angle)
    const py = centerY + radius * Math.sin(angle)
    seats.push({
      id: makeSeatId(),
      row: rowName,
      number: String(startNumber + i),
      x: Math.round(px - seatWidth / 2),
      y: Math.round(py - seatHeight / 2),
      width: seatWidth,
      height: seatHeight,
      type,
      shape,
      rotation: Math.round((angle * 180) / Math.PI + 90),
    })
  }

  return seats
}

/** Verilen koltukların merkez noktası (yoksa null). */
export function centerOfSeats(seats: SeatItem[]): WorldPoint | null {
  const bounds = computeBounds(seats)
  if (!bounds) return null
  return { x: bounds.minX + bounds.width / 2, y: bounds.minY + bounds.height / 2 }
}

/** Seçili koltukları bir merkez etrafında döndürür. */
export function rotateSeatsAround(
  seats: SeatItem[],
  ids: readonly string[],
  pivot: WorldPoint,
  degrees: number
): SeatItem[] {
  const idSet = new Set(ids)
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return seats.map((s) => {
    if (!idSet.has(s.id)) return s
    const cx = s.x + s.width / 2
    const cy = s.y + s.height / 2
    const dx = cx - pivot.x
    const dy = cy - pivot.y
    const nx = pivot.x + dx * cos - dy * sin
    const ny = pivot.y + dx * sin + dy * cos
    return {
      ...s,
      x: Math.round(nx - s.width / 2),
      y: Math.round(ny - s.height / 2),
      rotation: Math.round(s.rotation + degrees),
    }
  })
}
