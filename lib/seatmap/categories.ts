// Koltuk kategorileri ve renk paleti (v3).
import type { CategoryDef } from './types'

// Mevcut veritabanındaki koltuk tipleriyle birebir uyumlu renk paleti.
// (eski svg-hall-editor.tsx içindeki SEAT_COLORS ile aynı)
export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { key: 'NORMAL', label: 'Normal', color: '#6b7280', textColor: '#ffffff' },
  { key: 'VIP', label: 'VIP', color: '#fbbf24', textColor: '#1f2937' },
  { key: 'PREMIUM', label: 'Premium', color: '#3b82f6', textColor: '#ffffff' },
  { key: 'ACCESSIBLE', label: 'Engelli', color: '#10b981', textColor: '#ffffff' },
  { key: 'CATEGORY_1', label: 'Kategori 1', color: '#ef4444', textColor: '#ffffff' },
  { key: 'CATEGORY_2', label: 'Kategori 2', color: '#f97316', textColor: '#ffffff' },
  { key: 'CATEGORY_3', label: 'Kategori 3', color: '#eab308', textColor: '#1f2937' },
  { key: 'CATEGORY_4', label: 'Kategori 4', color: '#84cc16', textColor: '#1f2937' },
  { key: 'CATEGORY_5', label: 'Kategori 5', color: '#06b6d4', textColor: '#ffffff' },
  { key: 'CATEGORY_6', label: 'Kategori 6', color: '#0ea5e9', textColor: '#ffffff' },
  { key: 'CATEGORY_7', label: 'Kategori 7', color: '#8b5cf6', textColor: '#ffffff' },
  { key: 'CATEGORY_8', label: 'Kategori 8', color: '#d946ef', textColor: '#ffffff' },
  { key: 'CATEGORY_9', label: 'Kategori 9', color: '#ec4899', textColor: '#ffffff' },
  { key: 'CATEGORY_10', label: 'Kategori 10', color: '#f43f5e', textColor: '#ffffff' },
]

const CATEGORY_MAP: Record<string, CategoryDef> = Object.fromEntries(
  DEFAULT_CATEGORIES.map((c) => [c.key, c])
)

/** Verilen kategori listesinden hızlı arama tablosu üretir. */
export function buildCategoryMap(categories: CategoryDef[]): Record<string, CategoryDef> {
  const map: Record<string, CategoryDef> = {}
  for (let i = 0; i < categories.length; i++) map[categories[i].key] = categories[i]
  return map
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
