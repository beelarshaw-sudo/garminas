import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (rawUrl.startsWith('postgres')) {
    // Clean the connection string for Neon + Vercel:
    // 1. Remove channel_binding=require (not supported by pg library)
    // 2. Add pgbouncer=true (required for Neon's connection pooler)
    // 3. Add connect_timeout=15 (allow time for Neon cold starts)
    let cleanUrl = rawUrl
      .replace(/&?channel_binding=require/g, '')
      .replace(/&&/g, '&')
      .replace(/\?&/, '?')
      .replace(/&$/, '')

    if (!cleanUrl.includes('pgbouncer=')) {
      cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'pgbouncer=true'
    }
    if (!cleanUrl.includes('connect_timeout=')) {
      cleanUrl += '&connect_timeout=15'
    }

    // Update the env var so Prisma reads the cleaned URL
    process.env.DATABASE_URL = cleanUrl

    return new PrismaClient({
      log: ['error', 'warn'],
    })
  } else {
    return new PrismaClient({
      log: ['error', 'warn'],
    })
  }
}

export const db =
  globalForPrisma.prisma ??
  (() => {
    const client = createPrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client
    }
    return client
  })()
