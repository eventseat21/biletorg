export type ParsedSeat = {
  x: number
  y: number
  width: number
  height: number
  shape: 'circle' | 'rect'
  type: string
  row: string
  number: string
  block: string
  svgId: string
}

export type SvgParseSummary = {
  circleCount: number
  rectCount: number
  totalSeats: number
  width: number
  height: number
  rowCount: number
  blockCount: number
  aisleCount: number
  collisionCount: number
  aisleRanges: Array<{ fromX: number; toX: number }>
}

const RECT_SIZE_THRESHOLD = 100

export function extractSVGBounds(svgContent: string): { width: number; height: number } {
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i)
  if (viewBoxMatch?.[1]) {
    const values = viewBoxMatch[1].trim().split(/\s+/).map((v) => Number(v))
    if (values.length >= 4 && values.every((n) => Number.isFinite(n))) {
      return { width: values[2], height: values[3] }
    }
  }

  const widthMatch = svgContent.match(/width=["']([^"']+)["']/i)
  const heightMatch = svgContent.match(/height=["']([^"']+)["']/i)

  return {
    width: widthMatch ? parseFloat(widthMatch[1]) || 800 : 800,
    height: heightMatch ? parseFloat(heightMatch[1]) || 600 : 600,
  }
}

export function parseSVGSeats(svgContent: string): {
  seats: ParsedSeat[]
  summary: SvgParseSummary
} {
  const seatsRaw: Array<Omit<ParsedSeat, 'row' | 'number' | 'block'>> = []
  let circleCount = 0
  let rectCount = 0

  const circleRegex =
    /<circle[^>]*cx=["']([^"']+)["'][^>]*cy=["']([^"']+)["'][^>]*r=["']([^"']+)["'][^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = circleRegex.exec(svgContent)) !== null) {
    const cx = parseFloat(match[1])
    const cy = parseFloat(match[2])
    const r = parseFloat(match[3])
    if (![cx, cy, r].every(Number.isFinite)) continue
    if (r <= 1 || r > RECT_SIZE_THRESHOLD) continue

    seatsRaw.push(buildSeatRaw(cx - r, cy - r, r * 2, r * 2, 'circle'))
    circleCount++
  }

  const rectRegex =
    /<rect[^>]*x=["']([^"']+)["'][^>]*y=["']([^"']+)["'][^>]*width=["']([^"']+)["'][^>]*height=["']([^"']+)["'][^>]*>/gi
  while ((match = rectRegex.exec(svgContent)) !== null) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    const width = parseFloat(match[3])
    const height = parseFloat(match[4])
    if (![x, y, width, height].every(Number.isFinite)) continue
    if (width <= 2 || height <= 2) continue
    if (width > RECT_SIZE_THRESHOLD || height > RECT_SIZE_THRESHOLD) continue

    seatsRaw.push(buildSeatRaw(x, y, width, height, 'rect'))
    rectCount++
  }

  const annotated = annotateRowsBlocksAndNumbers(seatsRaw)
  const collisionCount = countCollisions(annotated)
  const aisleRanges = detectAisles(annotated)
  const rowCount = new Set(annotated.map((s) => s.row)).size
  const blockCount = new Set(annotated.map((s) => s.block)).size
  const bounds = extractSVGBounds(svgContent)
  return {
    seats: annotated,
    summary: {
      circleCount,
      rectCount,
      totalSeats: annotated.length,
      width: bounds.width,
      height: bounds.height,
      rowCount,
      blockCount,
      aisleCount: aisleRanges.length,
      collisionCount,
      aisleRanges,
    },
  }
}

function buildSeatRaw(
  x: number,
  y: number,
  width: number,
  height: number,
  shape: 'circle' | 'rect'
): Omit<ParsedSeat, 'row' | 'number' | 'block'> {
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
    shape,
    type: 'NORMAL',
    svgId: '',
  }
}

function annotateRowsBlocksAndNumbers(
  seats: Array<Omit<ParsedSeat, 'row' | 'number' | 'block'>>
): ParsedSeat[] {
  if (!seats.length) return []
  const rowCenters = clusterRowsByY(seats)
  const aisleRanges = detectAisles(
    seats.map((s, i) => ({
      ...s,
      row: 'A',
      number: String(i + 1),
      block: 'B1',
      svgId: `seat-${i}`,
    }))
  )

  const sorted = [...seats].sort((a, b) => a.y - b.y || a.x - b.x)
  const rowBuckets = new Map<string, ParsedSeat[]>()

  sorted.forEach((seat, i) => {
    const rowIndex = nearestIndex(rowCenters, seat.y)
    const rowName = indexToRow(rowIndex)
    const blockIndex = resolveBlockIndex(seat.x + seat.width / 2, aisleRanges)
    const blockName = `B${blockIndex + 1}`
    const parsed: ParsedSeat = {
      ...seat,
      row: rowName,
      number: '0',
      block: blockName,
      svgId: `seat-${i}`,
    }
    const list = rowBuckets.get(rowName) ?? []
    list.push(parsed)
    rowBuckets.set(rowName, list)
  })

  const result: ParsedSeat[] = []
  Array.from(rowBuckets.keys())
    .sort()
    .forEach((rowName) => {
      const seatsInRow = rowBuckets.get(rowName)!.sort((a, b) => a.x - b.x)
      seatsInRow.forEach((seat, i) => {
        seat.number = String(i + 1)
        result.push(seat)
      })
    })

  return result
}

function clusterRowsByY(
  seats: Array<Omit<ParsedSeat, 'row' | 'number' | 'block'>>
): number[] {
  const ys = seats.map((s) => s.y + s.height / 2).sort((a, b) => a - b)
  if (!ys.length) return [0]
  const tolerance = 8
  const clusters: number[][] = [[ys[0]]]
  for (let i = 1; i < ys.length; i++) {
    const current = ys[i]
    const lastCluster = clusters[clusters.length - 1]
    const avg = lastCluster.reduce((a, b) => a + b, 0) / lastCluster.length
    if (Math.abs(current - avg) <= tolerance) {
      lastCluster.push(current)
    } else {
      clusters.push([current])
    }
  }
  return clusters.map((c) => c.reduce((a, b) => a + b, 0) / c.length)
}

function detectAisles(seats: ParsedSeat[]): Array<{ fromX: number; toX: number }> {
  if (seats.length < 4) return []
  const centers = Array.from(
    new Set(seats.map((s) => Math.round(s.x + s.width / 2)))
  ).sort((a, b) => a - b)
  if (centers.length < 4) return []

  const diffs: number[] = []
  for (let i = 1; i < centers.length; i++) diffs.push(centers[i] - centers[i - 1])
  const median = diffs.sort((a, b) => a - b)[Math.floor(diffs.length / 2)] || 0
  const threshold = Math.max(18, median * 2.1)

  const aisles: Array<{ fromX: number; toX: number }> = []
  for (let i = 1; i < centers.length; i++) {
    const gap = centers[i] - centers[i - 1]
    if (gap > threshold) {
      aisles.push({ fromX: centers[i - 1], toX: centers[i] })
    }
  }
  return aisles
}

function resolveBlockIndex(
  centerX: number,
  aisles: Array<{ fromX: number; toX: number }>
): number {
  let idx = 0
  for (const aisle of aisles) {
    const mid = (aisle.fromX + aisle.toX) / 2
    if (centerX > mid) idx++
  }
  return idx
}

function countCollisions(seats: ParsedSeat[]): number {
  const byPosition = new Set<string>()
  const byRowNum = new Set<string>()
  let collisions = 0
  for (const seat of seats) {
    const posKey = `${Math.round(seat.x)}:${Math.round(seat.y)}`
    const rowNumKey = `${seat.row}:${seat.number}`
    if (byPosition.has(posKey)) collisions++
    else byPosition.add(posKey)
    if (byRowNum.has(rowNumKey)) collisions++
    else byRowNum.add(rowNumKey)
  }
  return collisions
}

function nearestIndex(values: number[], target: number): number {
  let best = 0
  let bestDiff = Number.POSITIVE_INFINITY
  values.forEach((v, i) => {
    const d = Math.abs(v - target)
    if (d < bestDiff) {
      bestDiff = d
      best = i
    }
  })
  return best
}

function indexToRow(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (index < alphabet.length) return alphabet[index]
  const first = Math.floor(index / alphabet.length) - 1
  const second = index % alphabet.length
  return `${alphabet[Math.max(0, first)]}${alphabet[second]}`
}
