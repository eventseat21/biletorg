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
    price: typeof raw.price === 'number' && Number.isFinite(raw.price) ? raw.price : null,
    sectionId: raw.sectionId ?? null,
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
    price: typeof seat.price === 'number' && Number.isFinite(seat.price) ? seat.price : null,
    zone: seat.zone ?? null,
    blockId: seat.blockId ?? null,
    sectionId: seat.sectionId ?? null,
    svgId: seat.svgId ?? null,
  }
}

const DB_STATUSES = ['available', 'held', 'blocked', 'unavailable']

/**
 * Sunucuya yazılacak değerlerin imzası. Sunucu tarafındaki normalizasyonla
 * (yuvarlama, durum listesi, boş alanlar) aynı olmalı; aksi halde koltuk
 * gereksiz yere her kayıtta yeniden gönderilir.
 */
export function seatSignature(seat: SeatItem): string {
  const status = seat.status && DB_STATUSES.includes(seat.status) ? seat.status : 'available'
  return [
    seat.row,
    seat.number,
    Math.round(seat.x),
    Math.round(seat.y),
    Math.max(8, Math.round(seat.width)),
    Math.max(8, Math.round(seat.height)),
    seat.type || 'NORMAL',
    status,
    typeof seat.price === 'number' && Number.isFinite(seat.price) ? seat.price : '',
    seat.zone ?? '',
    seat.blockId ?? '',
    seat.sectionId ?? '',
    seat.shape === 'rect' ? 'rect' : 'circle',
    Math.round(seat.rotation ?? 0),
    seat.svgId ?? '',
  ].join('|')
}

/** Kayıtli koltukların id -> imza haritası; yalnız değişenlerin gönderilmesini sağlar. */
export function seatSyncMap(seats: SeatItem[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const seat of seats) {
    if (isPersistedId(seat.id)) map.set(seat.id, seatSignature(seat))
  }
  return map
}

/** Haritada veritabanından farklı olan (değişmiş veya silinmiş) koltuk var mı? */
export function hasUnsavedSeats(seats: SeatItem[], synced: Map<string, string>): boolean {
  for (const seat of seats) {
    if (synced.get(seat.id) !== seatSignature(seat)) return true
  }
  const ids = new Set(seats.map((seat) => seat.id))
  for (const id of Array.from(synced.keys())) {
    if (!ids.has(id)) return true
  }
  return false
}
