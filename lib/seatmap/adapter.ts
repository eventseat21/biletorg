// Veritabanı <-> harita dönüşümleri (v3).
import type { SeatItem, SeatShape } from './types'
import { isPersistedId } from './geometry'

/** API'den gelen ham koltuk (Prisma Seat veya layout-sync yanıtı). */
export interface ApiSeat {
  id: string
  row: string
  number: string
  x: number
  y: number
  width?: number | null
  height?: number | null
  type?: string | null
  shape?: string | null
  rotation?: number | null
  status?: string | null
  price?: number | null
  zone?: string | null
  blockId?: string | null
  sectionId?: string | null
  svgId?: string | null
  locked?: boolean | null
}

function normalizeShape(shape: string | null | undefined): SeatShape {
  return shape === 'rect' ? 'rect' : 'circle'
}

function normalizeStatus(status: string | null | undefined): NonNullable<SeatItem['status']> {
  if (status === 'held' || status === 'blocked' || status === 'unavailable' || status === 'selected') {
    return status
  }
  return 'available'
}

export function seatFromApi(raw: ApiSeat): SeatItem {
  return {
    id: raw.id,
    row: String(raw.row ?? ''),
    number: String(raw.number ?? ''),
    x: Math.round(raw.x ?? 0),
    y: Math.round(raw.y ?? 0),
    width: Math.max(8, Math.round(raw.width ?? 28)),
    height: Math.max(8, Math.round(raw.height ?? 28)),
    type: raw.type || 'NORMAL',
    shape: normalizeShape(raw.shape),
    rotation: Math.round(raw.rotation ?? 0),
    status: normalizeStatus(raw.status),
    zone: raw.zone ?? null,
    blockId: raw.blockId ?? null,
    svgId: raw.svgId ?? null,
    locked: Boolean(raw.locked),
  }
}

/** layout-sync API'sine gönderilecek yük. */
export interface SeatPayload {
  id: string
  row: string
  number: string
  x: number
  y: number
  width: number
  height: number
  type: string
  shape: SeatShape
  rotation: number
  status?: string | null
  price?: number | null
  zone?: string | null
  blockId?: string | null
  sectionId?: string | null
  svgId?: string | null
}

export function seatToPayload(seat: SeatItem): SeatPayload {
  return {
    id: seat.id,
    row: seat.row,
    number: seat.number,
    x: Math.round(seat.x),
    y: Math.round(seat.y),
    width: Math.round(seat.width),
    height: Math.round(seat.height),
    type: seat.type,
    shape: seat.shape,
    rotation: Math.round(seat.rotation),
    status: seat.status ?? 'available',
    price: undefined,
    zone: seat.zone ?? null,
    blockId: seat.blockId ?? null,
    sectionId: undefined,
    svgId: seat.svgId ?? null,
  }
}

/** Kayıtlı (persisted) koltuk kimliklerini ayıklar. */
export function persistedIds(seats: SeatItem[]): string[] {
  return seats.filter((s) => isPersistedId(s.id)).map((s) => s.id)
}
