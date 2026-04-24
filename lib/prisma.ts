import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

/** Tek örnek: Vercel/serverless sıcak başlatmada bağlantı sızıntısını azaltır. */
globalForPrisma.prisma = prisma
