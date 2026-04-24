/**
 * Vercel/Supabase ortamlarında veritabanı URL'si farklı isimlerle gelir.
 * Prisma şeması DATABASE_URL bekler; çalışma zamanında eşleşen ilk değişkeni kullanırız.
 */
export function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.SUPABASE_DATABASE_URL,
  ]
  for (const raw of candidates) {
    const u = raw?.trim()
    if (u) return normalizePostgresUrl(u)
  }
  return undefined
}

/**
 * Supabase: TLS ve havuz için önerilen sorgu parametrelerini tamamlar (yoksa).
 */
export function normalizePostgresUrl(connectionString: string): string {
  try {
    const u = new URL(connectionString)
    const host = u.hostname

    if (host.endsWith('supabase.co')) {
      if (!u.searchParams.has('sslmode')) {
        u.searchParams.set('sslmode', 'require')
      }
      const isPooler =
        host.includes('pooler.') || u.port === '6543'
      if (isPooler && !u.searchParams.has('pgbouncer')) {
        u.searchParams.set('pgbouncer', 'true')
      }
    }

    return u.toString()
  } catch {
    return connectionString
  }
}
