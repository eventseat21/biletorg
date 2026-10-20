// Salon planı (SeatCategory + Seat) → satış kategorileri (TicketCategory) köprüsü.
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Rezerve/aracıyla kalıcı işaretlenen koltuklar satışa çıkmaz. */
const NON_SELLABLE = ['held', 'blocked', 'unavailable']

export type HallSyncSummary = {
  created: number
  updated: number
  removed: number
  /** Satılmış bileti olduğu için silinemeyen kategori etiketleri. */
  kept: string[]
  totalSellable: number
}

type HallCategoryRow = { key: string; name: string; color: string; price: number | null }
type SeatAggregateRow = { type: string; sellable: number; seats: number; minPrice: number | null; maxPrice: number | null }
type ExistingCategoryRow = { id: string; name: string; seatType: string | null; price: number; totalQuantity: number; sold: number }

function keyOfSeatCategory(row: { id: string; description: string | null; name: string }): string {
  if (row.description) return row.description
  const index = row.id.indexOf(':')
  return index >= 0 ? row.id.slice(index + 1) : row.name
}

/** Salonun satılabilir koltuk sayısı, fiyat aralığı ve kategori tanımları. */
async function readHall(hallId: string): Promise<{ categories: HallCategoryRow[]; seatsByType: Map<string, SeatAggregateRow> }> {
  // Sorgu sayısı gecikmeyi belirliyor: kategori ve koltuk toplamları paralel okunur.
  const [rows, aggregates] = await Promise.all([
    prisma.seatCategory.findMany({
      where: { hallId },
      select: { id: true, name: true, color: true, price: true, description: true },
      orderBy: { name: 'asc' },
    }),
    prisma.$queryRaw<SeatAggregateRow[]>`
      SELECT "type",
             COUNT(*) FILTER (WHERE "status" NOT IN (${Prisma.join(NON_SELLABLE)}))::int AS "sellable",
             COUNT(*)::int AS "seats",
             MIN("price")::float AS "minPrice",
             MAX("price")::float AS "maxPrice"
      FROM "seats"
      WHERE "hallId" = ${hallId}
      GROUP BY "type"
    `,
  ])

  const seatsByType = new Map(aggregates.map((row) => [row.type, row]))
  const seen = new Set<string>()
  const categories: HallCategoryRow[] = []
  for (const row of rows) {
    const key = keyOfSeatCategory(row)
    if (seen.has(key)) continue
    const seats = seatsByType.get(key)
    // Salon planında bu kategoriyle koltuk yoksa satışa da çıkmaz.
    if (!seats || seats.seats === 0) continue
    seen.add(key)
    const uniformPrice = seats.minPrice !== null && seats.minPrice === seats.maxPrice ? seats.minPrice : null
    categories.push({ key, name: row.name, color: row.color, price: row.price ?? uniformPrice })
  }

  // Salonda kategori tanımlanmamış ama koltuğu olan tipler de satışa çıkabilsin.
  for (const [key, seats] of seatsByType) {
    if (seen.has(key)) continue
    seen.add(key)
    const uniformPrice = seats.minPrice !== null && seats.minPrice === seats.maxPrice ? seats.minPrice : null
    categories.push({ key, name: key, color: '#6b7280', price: uniformPrice })
  }

  return { categories, seatsByType }
}

/**
 * Salon planını etkinlik satış kategorilerine yansıtır.
 * Satılmış bileti olan kategoriler hiçbir zaman silinmez; stok hiç satılanın
 * altına indirilmez.
 */
export async function syncTicketCategoriesFromHall(eventId: string, hallId: string): Promise<HallSyncSummary> {
  const summary: HallSyncSummary = { created: 0, updated: 0, removed: 0, kept: [], totalSellable: 0 }
  const { categories, seatsByType } = await readHall(hallId)
  if (categories.length === 0) return summary

  const existingCats = await prisma.$queryRaw<ExistingCategoryRow[]>`
    SELECT tc."id", tc."name", tc."seatType", tc."price", tc."totalQuantity",
           COUNT(t."id") FILTER (WHERE t."status" NOT IN ('CANCELLED', 'REFUNDED'))::int AS "sold"
    FROM "ticket_categories" tc
    LEFT JOIN "tickets" t ON t."categoryId" = tc."id"
    WHERE tc."eventId" = ${eventId}
    GROUP BY tc."id"
  `
  const soldById = new Map(existingCats.map((row) => [row.id, row.sold]))
  const bySeatType = new Map<string, ExistingCategoryRow>()
  const byName = new Map<string, ExistingCategoryRow>()
  const matched = new Set<string>()

  for (const cat of existingCats) {
    if (cat.seatType) bySeatType.set(cat.seatType, cat)
    else byName.set(cat.name, cat)
  }

  await prisma.$transaction(async (tx) => {
    for (const category of categories) {
      const seats = seatsByType.get(category.key)?.sellable ?? 0
      summary.totalSellable += seats
      let target = bySeatType.get(category.key)
      if (!target) {
        const byLabel = byName.get(category.name)
        if (byLabel && !matched.has(byLabel.id)) target = byLabel
      }
      if (target) {
        matched.add(target.id)
        const sold = soldById.get(target.id) ?? 0
        const totalQuantity = Math.max(seats, sold)
        await tx.ticketCategory.update({
          where: { id: target.id },
          data: {
            name: category.name,
            color: category.color,
            seatType: category.key,
            hasSeatSelection: true,
            price: category.price ?? target.price,
            totalQuantity,
            availableQuantity: Math.max(0, totalQuantity - sold),
          },
        })
        summary.updated++
        continue
      }

      const created = await tx.ticketCategory.create({
        data: {
          eventId,
          name: category.name,
          description: category.key === category.name ? null : category.key,
          price: category.price ?? 0,
          seatType: category.key,
          color: category.color,
          hasSeatSelection: true,
          totalQuantity: seats,
          availableQuantity: seats,
        },
        select: { id: true },
      })
      soldById.set(created.id, 0)
      summary.created++
    }

    for (const cat of existingCats) {
      if (matched.has(cat.id)) continue
      // Elle açılmış kategori (salona bağlı değil) organizatörün kararıdır: korunur.
      if (!cat.seatType) continue
      const sold = soldById.get(cat.id) ?? 0
      if (sold > 0) {
        summary.kept.push(cat.name)
        continue
      }
      await tx.ticketCategory.delete({ where: { id: cat.id } })
      summary.removed++
    }
  }, { timeout: 60000 })

  return summary
}
