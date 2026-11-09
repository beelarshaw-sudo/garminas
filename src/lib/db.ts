import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (rawUrl.startsWith('postgres')) {
    // Parse the PostgreSQL URL manually — the Neon Pool doesn't reliably
    // parse connectionString, so we extract params individually.
    let url: URL
    try {
      url = new URL(rawUrl)
    } catch {
      throw new Error('Invalid DATABASE_URL format: ' + rawUrl.substring(0, 30))
    }

    const pool = new Pool({
      host: url.hostname,
      port: url.port ? parseInt(url.port) : 5432,
      database: url.pathname.slice(1),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      ssl: true,
      connectionTimeoutMillis: 15000,
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
