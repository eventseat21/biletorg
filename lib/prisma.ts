import { PrismaClient } from '@prisma/client'
import { resolveDatabaseUrl } from '@/lib/db-url'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const databaseUrl = resolveDatabaseUrl()

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  console.error(
    '[prisma] Veritabanı URL bulunamadı. Vercel’de şunlardan en az biri tanımlı olmalı: DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL'
  )
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

/** Tek örnek: Vercel/serverless sıcak başlatmada bağlantı sızıntısını azaltır. */
globalForPrisma.prisma = prisma
