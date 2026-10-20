// Koltuk kategorileri ve renk paleti (v3).
import type { CategoryDef, SeatItem } from './types'

/**
 * Yeni salonda gelen başlangıç seti. Bilinçli olarak kısa: organizatör
 * "Kategoriler" sekmesinden ekler, araç çubuğu kalabalıklaşmaz.
 */
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { key: 'CATEGORY_1', label: 'Kategori 1', color: '#e11d48', textColor: '#ffffff' },
  { key: 'CATEGORY_2', label: 'Kategori 2', color: '#ea580c', textColor: '#ffffff' },
  { key: 'CATEGORY_3', label: 'Kategori 3', color: '#facc15', textColor: '#1f2937' },
  { key: 'CATEGORY_4', label: 'Kategori 4', color: '#16a34a', textColor: '#ffffff' },
  { key: 'VIP', label: 'VIP', color: '#7c3aed', textColor: '#ffffff' },
  { key: 'ACCESSIBLE', label: 'Engelli', color: '#0d9488', textColor: '#ffffff' },
]

/**
 * Eski salonlarda kalmış tip anahtarlarının renkleri. Yeni salonlarda listeye
 * girmez; veritabanından gelen tipler doğru renkle çizilsin diye tutulur.
 */
export const LEGACY_CATEGORY_COLORS: Record<string, { color: string; textColor: string }> = {
  NORMAL: { color: '#6b7280', textColor: '#ffffff' },
  PREMIUM: { color: '#3b82f6', textColor: '#ffffff' },
  CATEGORY_5: { color: '#2563eb', textColor: '#ffffff' },
  CATEGORY_6: { color: '#0284c7', textColor: '#ffffff' },
  CATEGORY_7: { color: '#7c3aed', textColor: '#ffffff' },
  CATEGORY_8: { color: '#c026d3', textColor: '#ffffff' },
  CATEGORY_9: { color: '#db2777', textColor: '#ffffff' },
  CATEGORY_10: { color: '#f43f5e', textColor: '#ffffff' },
}

/** Koltukta tipi olup kategorisi olmayan salonlar için canlı renk döngüsü. */
export const CATEGORY_AUTO_COLORS = [
  '#2563eb', '#db2777', '#0891b2', '#65a30d', '#f59e0b',
  '#dc2626', '#4f46e5', '#be123c', '#047857', '#b45309',
]

const CATEGORY_MAP: Record<string, CategoryDef> = {
  ...Object.fromEntries(
    Object.entries(LEGACY_CATEGORY_COLORS).map(([key, colors]) => [
      key,
      { key, label: key, ...colors },
    ]),
  ),
  ...Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.key, c])),
}

/** Verilen kategori listesinden hızlı arama tablosu üretir. */
export function buildCategoryMap(categories: CategoryDef[]): Record<string, CategoryDef> {
  const map: Record<string, CategoryDef> = {}
  for (let i = 0; i < categories.length; i++) map[categories[i].key] = categories[i]
  return map
}

/**
 * Koltuklarda kullanılan ama kategori listesinde olmayan tipleri listeye ekler.
 * `applyPrices` true ise kategori fiyatı koltuklara yazılır; false ise koltuğun
 * veritabanından gelen kendi fiyatı korunur.
 */
export function ensureSeatCategories(
  categories: CategoryDef[],
  seats: readonly Pick<SeatItem, 'type'>[],
  applyPrices = false,
): CategoryDef[] {
  const known = new Set(categories.map((c) => c.key))
  const missing: string[] = []
  for (let i = 0; i < seats.length; i++) {
    const type = seats[i].type
    if (!type || known.has(type)) continue
    known.add(type)
    missing.push(type)
  }
  if (missing.length === 0) return categories
  const priceByType = new Map<string, number>()
  if (applyPrices) {
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i] as SeatItem
      if (typeof seat.price === 'number' && !priceByType.has(seat.type)) {
        priceByType.set(seat.type, seat.price)
      }
    }
  }
  return [
    ...categories,
    ...missing.map((key, index) => {
      const legacy = LEGACY_CATEGORY_COLORS[key]
      const price = priceByType.get(key)
      return {
        key,
        label: key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (ch) => ch.toUpperCase()),
        color: legacy?.color ?? CATEGORY_AUTO_COLORS[index % CATEGORY_AUTO_COLORS.length],
        textColor: legacy?.textColor ?? '#ffffff',
        ...(price === undefined ? {} : { price }),
      }
    }),
  ]
}

/** Koltuğun kategori anahtarını, fiyatını ve .com bölüm adını koltuğa yazar. */
export function applyCategory(seat: SeatItem, category: CategoryDef | undefined): SeatItem {
  if (!category) return seat
  const label = (category.label || category.key).trim()
  return {
    ...seat,
    type: category.key,
    price: Number.isFinite(category.price as number) ? (category.price as number) : null,
    sectionId: label,
  }
}

/** Yeni kategori için çakışmayan bir anahtar üretir (CUSTOM_1, CUSTOM_2 ...). */
export function nextCategoryKey(existing: readonly CategoryDef[]): string {
  let n = 1
  const used: Record<string, true> = {}
  for (let i = 0; i < existing.length; i++) used[existing[i].key] = true
  while (used[`CUSTOM_${n}`]) n++
  return `CUSTOM_${n}`
}

/** Bilinmeyen bir kategori anahtarı için güvenli bir varsayılan üretir. */
export function getCategory(key: string | undefined | null): CategoryDef {
  if (!key) return CATEGORY_MAP.NORMAL
  return (
    CATEGORY_MAP[key] ?? {
      key,
      label: key,
      color: '#94a3b8',
      textColor: '#ffffff',
    }
  )
}
