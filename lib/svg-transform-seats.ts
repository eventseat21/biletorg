/**
 * SVG içindeki <g transform> / <use> zincirini uygulayarak koltuk adaylarının
 * küresel koordinatlarını üretir (querySelectorAll ile dağınık sonuçları önler).
 */

export type RawSeatCandidate = {
  id: string
  shape: 'circle' | 'rect'
  x: number
  y: number
  width: number
  height: number
}

type Matrix = { a: number; b: number; c: number; d: number; e: number; f: number }

const ID: Matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

function multiply(m1: Matrix, m2: Matrix): Matrix {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  }
}

function translate(tx: number, ty: number): Matrix {
  return { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty }
}

function parseFloatSafe(s: string): number {
  const n = parseFloat(s.trim())
  return Number.isFinite(n) ? n : 0
}

/** SVG transform özniteliğini soldan sağa sırayla birleştirir */
export function parseTransformAttribute(str: string | null): Matrix {
  if (!str?.trim()) return ID
  let acc = ID
  const re = /([a-zA-Z]+)\s*\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(str)) !== null) {
    const name = m[1].trim().toLowerCase()
    const raw = m[2]
    const nums = raw
      .replace(/,/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(parseFloatSafe)
    const next = transformPrimitive(name, nums)
    acc = multiply(acc, next)
  }
  return acc
}

function transformPrimitive(name: string, args: number[]): Matrix {
  switch (name) {
    case 'matrix':
      if (args.length >= 6) {
        return { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] }
      }
      return ID
    case 'translate':
      if (args.length >= 1) return translate(args[0], args.length >= 2 ? args[1] : 0)
      return ID
    case 'scale':
      if (args.length >= 1) {
        const sx = args[0]
        const sy = args.length >= 2 ? args[1] : sx
        return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }
      }
      return ID
    case 'rotate': {
      if (args.length < 1) return ID
      const deg = (args[0] * Math.PI) / 180
      const cos = Math.cos(deg)
      const sin = Math.sin(deg)
      if (args.length >= 3) {
        const cx = args[1]
        const cy = args[2]
        return multiply(multiply(translate(cx, cy), { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }), translate(-cx, -cy))
      }
      return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }
    }
    case 'skewx': {
      if (args.length < 1) return ID
      const t = Math.tan((args[0] * Math.PI) / 180)
      return { a: 1, b: 0, c: t, d: 1, e: 0, f: 0 }
    }
    case 'skewy': {
      if (args.length < 1) return ID
      const t = Math.tan((args[0] * Math.PI) / 180)
      return { a: 1, b: t, c: 0, d: 1, e: 0, f: 0 }
    }
    default:
      return ID
  }
}

export function transformPoint(m: Matrix, x: number, y: number): { x: number; y: number } {
  return {
    x: m.a * x + m.c * y + m.e,
    y: m.b * x + m.d * y + m.f,
  }
}

/** Dikdörtgenin dört köşesini dönüştürüp eksenl hizalı sınırlayıcı kutu (sol üst + w/h) */
function bboxAfterTransform(
  m: Matrix,
  x: number,
  y: number,
  w: number,
  h: number
): { x: number; y: number; width: number; height: number } {
  const corners = [
    transformPoint(m, x, y),
    transformPoint(m, x + w, y),
    transformPoint(m, x + w, y + h),
    transformPoint(m, x, y + h),
  ]
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
}

function getNumber(el: Element, attr: string): number | null {
  const v = el.getAttribute(attr)
  return v != null && v !== '' ? parseFloat(v) : null
}

/** Aynı sıraya düşen koltukların dikey kaymasını giderir; X ve aralıkları korur (fan/kavis planlar bozulmaz). */
export function alignSeatRowsVertically(
  seats: RawSeatCandidate[],
  opts?: { rowToleranceFactor?: number }
): RawSeatCandidate[] {
  if (seats.length === 0) return seats
  const factor = opts?.rowToleranceFactor ?? 0.55
  const heights = seats.map((s) => s.height).sort((a, b) => a - b)
  const medianH = heights[Math.floor(heights.length / 2)] || 24
  const rowTol = Math.max(12, medianH * factor)

  const sorted = [...seats].sort((a, b) => a.y - b.y || a.x - b.x)
  const rows: RawSeatCandidate[][] = []
  let current: RawSeatCandidate[] = []
  let rowMeanY = sorted[0].y + sorted[0].height / 2

  for (const s of sorted) {
    const cy = s.y + s.height / 2
    if (current.length === 0) {
      current.push(s)
      rowMeanY = cy
      continue
    }
    if (Math.abs(cy - rowMeanY) <= rowTol) {
      current.push(s)
      rowMeanY = current.reduce((acc, t) => acc + t.y + t.height / 2, 0) / current.length
    } else {
      rows.push(current)
      current = [s]
      rowMeanY = cy
    }
  }
  if (current.length) rows.push(current)

  const out: RawSeatCandidate[] = []
  for (const row of rows) {
    const targetY =
      row.reduce((acc, t) => acc + t.y + t.height / 2, 0) / row.length
    for (const s of row) {
      out.push({
        ...s,
        y: Math.round(targetY - s.height / 2),
      })
    }
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x)
}

/** Çok küçük kutuları büyütür (üst üste binme ve tıklanamazlık azalır). */
export function enforceMinSeatFootprint(
  seats: RawSeatCandidate[],
  min = 16
): RawSeatCandidate[] {
  return seats.map((s) => {
    let { x, y, width, height } = s
    if (width < min) {
      const d = min - width
      x -= d / 2
      width = min
    }
    if (height < min) {
      const d = min - height
      y -= d / 2
      height = min
    }
    return {
      ...s,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    }
  })
}

function overlapArea(a: RawSeatCandidate, b: RawSeatCandidate): number {
  const ax2 = a.x + a.width
  const ay2 = a.y + a.height
  const bx2 = b.x + b.width
  const by2 = b.y + b.height
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x))
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y))
  return ix * iy
}

/** Kesişen koltukları hafifçe iteratif ayırır. */
export function separateOverlappingCandidates(
  seats: RawSeatCandidate[],
  minClearance = 2
): RawSeatCandidate[] {
  const result = seats.map((s) => ({ ...s }))
  for (let it = 0; it < 10; it++) {
    let moved = false
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        if (overlapArea(a, b) <= 0) continue
        const cxA = a.x + a.width / 2
        const cyA = a.y + a.height / 2
        const cxB = b.x + b.width / 2
        const cyB = b.y + b.height / 2
        let dx = cxB - cxA
        let dy = cyB - cyA
        const len = Math.hypot(dx, dy) || 1
        dx /= len
        dy /= len
        const push = Math.max(a.width, b.width) * 0.35 + minClearance
        result[j].x += Math.round(dx * push)
        result[j].y += Math.round(dy * push)
        moved = true
      }
    }
    if (!moved) break
  }
  return result
}

export function extractSeatsWithTransforms(document: Document): RawSeatCandidate[] {
  const svg = document.querySelector('svg')
  if (!svg) return []

  const svgBase = parseTransformAttribute(svg.getAttribute('transform'))

  const candidates: RawSeatCandidate[] = []
  let autoId = 1

  function walk(el: Element, parentMatrix: Matrix) {
    const tag = el.tagName.toLowerCase()
    const local = parseTransformAttribute(el.getAttribute('transform'))
    const m = multiply(parentMatrix, local)

    if (tag === 'defs' || tag === 'clippath' || tag === 'mask' || tag === 'pattern') {
      return
    }

    if (tag === 'use') {
      const href = el.getAttribute('href') || el.getAttribute('xlink:href')
      const id = href?.replace(/^#/, '').trim()
      const ux = getNumber(el, 'x') ?? 0
      const uy = getNumber(el, 'y') ?? 0
      const useM = multiply(m, translate(ux, uy))
      if (id) {
        const ref = document.getElementById(id)
        if (ref) {
          const refTag = ref.tagName.toLowerCase()
          const refLocal = parseTransformAttribute(ref.getAttribute('transform'))
          const innerM = multiply(useM, refLocal)
          if (refTag === 'symbol' || refTag === 'g' || refTag === 'svg') {
            for (const child of Array.from(ref.children)) {
              walk(child as Element, innerM)
            }
          } else {
            walk(ref, innerM)
          }
          return
        }
      }
      for (const child of Array.from(el.children)) {
        walk(child as Element, useM)
      }
      return
    }

    if (tag === 'circle') {
      const cx = getNumber(el, 'cx') ?? 0
      const cy = getNumber(el, 'cy') ?? 0
      const r = getNumber(el, 'r') ?? 0
      if (r <= 0 || r > 100) return
      const box = bboxAfterTransform(m, cx - r, cy - r, r * 2, r * 2)
      candidates.push({
        id: el.getAttribute('id') || `seat_${autoId++}`,
        shape: 'circle',
        ...box,
      })
      return
    }

    if (tag === 'rect') {
      const x = getNumber(el, 'x') ?? 0
      const y = getNumber(el, 'y') ?? 0
      const w = getNumber(el, 'width') ?? 0
      const h = getNumber(el, 'height') ?? 0
      if (w <= 2 || h <= 2) return
      if (w > 80 || h > 80) return
      const box = bboxAfterTransform(m, x, y, w, h)
      candidates.push({
        id: el.getAttribute('id') || `seat_${autoId++}`,
        shape: 'rect',
        ...box,
      })
      return
    }

    if (tag === 'ellipse') {
      const cx = getNumber(el, 'cx') ?? 0
      const cy = getNumber(el, 'cy') ?? 0
      const rx = getNumber(el, 'rx') ?? 0
      const ry = getNumber(el, 'ry') ?? 0
      if (rx <= 0 || ry <= 0) return
      const box = bboxAfterTransform(m, cx - rx, cy - ry, rx * 2, ry * 2)
      candidates.push({
        id: el.getAttribute('id') || `seat_${autoId++}`,
        shape: 'circle',
        ...box,
      })
      return
    }

    if (tag === 'path') {
      const d = el.getAttribute('d')
      if (!d || d.length > 200) return
      const match = d.match(/M\s*([-\d.]+)\s*[,\s]\s*([-\d.]+)/i)
      if (!match) return
      const lx = parseFloat(match[1])
      const ly = parseFloat(match[2])
      if (!Number.isFinite(lx) || !Number.isFinite(ly)) return
      const p = transformPoint(m, lx, ly)
      const pw = 18
      const ph = 18
      candidates.push({
        id: el.getAttribute('id') || `path_${autoId++}`,
        shape: 'circle',
        x: p.x - pw / 2,
        y: p.y - ph / 2,
        width: pw,
        height: ph,
      })
      return
    }

    for (const child of Array.from(el.children)) {
      walk(child as Element, m)
    }
  }

  for (const child of Array.from(svg.children)) {
    walk(child as Element, svgBase)
  }

  return candidates
}
