// Koltuk konumları için ızgara tabanlı uzaysal indeks.
// 5.000-10.000 koltukta isabet testi ve kutu sorgusunun tüm listeyi taramaması için kullanılır.
import type { SeatItem } from './types'

const CELL = 128

export interface SeatIndex {
  seats: SeatItem[]
  originX: number
  originY: number
  cols: number
  rows: number
  cells: Map<number, number[]>
  seen: Int32Array
  epoch: number
}

function cellRange(index: SeatIndex, minX: number, minY: number, maxX: number, maxY: number) {
  const gx0 = Math.max(0, Math.floor((minX - index.originX) / CELL))
  const gy0 = Math.max(0, Math.floor((minY - index.originY) / CELL))
  const gx1 = Math.min(index.cols - 1, Math.floor((maxX - index.originX) / CELL))
  const gy1 = Math.min(index.rows - 1, Math.floor((maxY - index.originY) / CELL))
  return { gx0, gy0, gx1, gy1 }
}

export function buildSeatIndex(seats: SeatItem[]): SeatIndex {
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

  const index: SeatIndex = {
    seats,
    originX: Number.isFinite(minX) ? minX : 0,
    originY: Number.isFinite(minY) ? minY : 0,
    cols: 0,
    rows: 0,
    cells: new Map(),
    seen: new Int32Array(seats.length),
    epoch: 0,
  }
  if (!Number.isFinite(minX)) return index

  index.cols = Math.max(1, Math.ceil((maxX - minX) / CELL) + 1)
  index.rows = Math.max(1, Math.ceil((maxY - minY) / CELL) + 1)

  for (let i = 0; i < seats.length; i++) {
    const s = seats[i]
    const gx0 = Math.floor((s.x - index.originX) / CELL)
    const gx1 = Math.floor((s.x + s.width - index.originX) / CELL)
    const gy0 = Math.floor((s.y - index.originY) / CELL)
    const gy1 = Math.floor((s.y + s.height - index.originY) / CELL)
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const key = gy * index.cols + gx
        const bucket = index.cells.get(key)
        if (bucket) bucket.push(i)
        else index.cells.set(key, [i])
      }
    }
  }

  return index
}

/** Kutu içinde kalan koltukları çakışmasız döndürür (her koltuk bir kez). */
export function indexRectHits(
  index: SeatIndex,
  rect: { x: number; y: number; width: number; height: number }
): SeatItem[] {
  const left = Math.min(rect.x, rect.x + rect.width)
  const right = Math.max(rect.x, rect.x + rect.width)
  const top = Math.min(rect.y, rect.y + rect.height)
  const bottom = Math.max(rect.y, rect.y + rect.height)
  if (index.cols === 0) return []

  const { gx0, gy0, gx1, gy1 } = cellRange(index, left, top, right, bottom)
  const hits: SeatItem[] = []
  index.epoch += 1
  const mark = index.epoch

  for (let gy = gy0; gy <= gy1; gy++) {
    for (let gx = gx0; gx <= gx1; gx++) {
      const bucket = index.cells.get(gy * index.cols + gx)
      if (!bucket) continue
      for (let b = 0; b < bucket.length; b++) {
        const i = bucket[b]
        if (index.seen[i] === mark) continue
        index.seen[i] = mark
        const s = index.seats[i]
        if (s.x < right && s.x + s.width > left && s.y < bottom && s.y + s.height > top) {
          hits.push(s)
        }
      }
    }
  }

  return hits
}

/** Noktaya denk gelen (görselde en üstte çizilen) koltuğu bulur. */
export function indexPointHit(index: SeatIndex, x: number, y: number, slop = 3): SeatItem | null {
  if (index.cols === 0) return null
  const { gx0, gy0, gx1, gy1 } = cellRange(index, x - slop, y - slop, x + slop, y + slop)
  index.epoch += 1
  const mark = index.epoch
  let best: SeatItem | null = null
  let bestIndex = -1

  for (let gy = gy0; gy <= gy1; gy++) {
    for (let gx = gx0; gx <= gx1; gx++) {
      const bucket = index.cells.get(gy * index.cols + gx)
      if (!bucket) continue
      for (let b = 0; b < bucket.length; b++) {
        const i = bucket[b]
        if (index.seen[i] === mark || i <= bestIndex) continue
        const s = index.seats[i]
        if (
          x >= s.x - slop &&
          x <= s.x + s.width + slop &&
          y >= s.y - slop &&
          y <= s.y + s.height + slop
        ) {
          best = s
          bestIndex = i
        }
      }
    }
  }

  return best
}
