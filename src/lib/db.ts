import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
const isPostgres = dbUrl.startsWith('postgres')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  if (isPostgres) {
    // Neon serverless adapter — connects over HTTP/WebSocket instead of TCP
    // This is required for Vercel's serverless functions which can't use
    // direct TCP connections to external databases.
    const pool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 15000, // Allow time for Neon cold starts
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
