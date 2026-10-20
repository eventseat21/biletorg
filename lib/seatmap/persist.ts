// Salon düzeninin (layoutJson) veritabanı tarafıyla eşitlenmesi.
import { Prisma } from '@prisma/client'

/** layoutJson içinde serbestçe bulunabilen kategori kaydı. */
export type LayoutCategoryInput = {
  key?: string
  label?: string
  color?: string
  price?: number | null
}

/**
 * layoutJson içindeki kategorileri sorgulanabilir `seat_categories` tablosuna yansıtır.
 * Satır adı bölüm etiketi (= .com `ticket_type_label`), açıklama kategori anahtarıdır.
 *
 * Kimlik hallId + kategori anahtarından türetilir: böylece aynı kategori yeniden
 * adlandırılsa bile satır korunur ve tüm yansıma tek bir sorguda yapılır. Salon
 * kaydının gecikmesi çoğunlukla sorgu sayısından gelir, veri boyutundan değil.
 */
export async function syncSeatCategories(
  client: Prisma.TransactionClient,
  hallId: string,
  categories: LayoutCategoryInput[]
) {
  const rows: { id: string; name: string; color: string; price: number | null; description: string | null }[] = []
  const seen = new Set<string>()

  for (const category of categories) {
    const key = String(category.key ?? '').trim()
    const name = String(category.label ?? category.key ?? '').trim()
    if (!name) continue
    const id = `${hallId}:${key || name}`
    if (seen.has(id)) continue
    seen.add(id)
    rows.push({
      id,
      name,
      color: typeof category.color === 'string' ? category.color : '#6b7280',
      price: typeof category.price === 'number' && Number.isFinite(category.price) ? category.price : null,
      description: key || null,
    })
  }

  if (rows.length === 0) {
    await client.seatCategory.deleteMany({ where: { hallId } })
    return
  }

  await client.$executeRaw(Prisma.sql`
    INSERT INTO "seat_categories" ("id", "hallId", "name", "color", "price", "description", "createdAt", "updatedAt")
    VALUES ${Prisma.join(
      rows.map(
        (row) => Prisma.sql`(
          ${row.id}, ${hallId}, ${row.name}, ${row.color}, ${row.price}::double precision,
          ${row.description}, now(), now()
        )`
      )
    )}
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "color" = EXCLUDED."color",
      "price" = EXCLUDED."price",
      "description" = EXCLUDED."description",
      "updatedAt" = now()
  `)

  await client.$executeRaw(Prisma.sql`
    DELETE FROM "seat_categories"
    WHERE "hallId" = ${hallId}
      AND "id" NOT IN (${Prisma.join(rows.map((row) => row.id))})
  `)
}
