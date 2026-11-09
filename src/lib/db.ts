import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (rawUrl.startsWith('postgres')) {
    // Neon serverless adapter — connects over HTTP/WebSocket instead of TCP
    // Required for Vercel serverless functions which can't use direct TCP.

    // Clean the connection string: remove channel_binding (not supported by pg)
    // and ensure sslmode is present
    let cleanUrl = rawUrl.replace(/&?channel_binding=require/g, '')
    // Clean up any double && or trailing & left after removal
    cleanUrl = cleanUrl.replace(/&&/g, '&').replace(/\?&/, '?').replace(/&$/, '')

    // Use dynamic import to avoid issues if packages aren't available in SQLite mode
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('@neondatabase/serverless')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require('@prisma/adapter-neon')

    const pool = new Pool({
      connectionString: cleanUrl,
      connectionTimeoutMillis: 15000,
      ssl: true,
    })

    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  } else {
    // Standard Prisma client for SQLite (z.ai / local dev)
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
