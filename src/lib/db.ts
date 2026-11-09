import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (rawUrl.startsWith('postgres')) {
    // Parse the PostgreSQL URL manually and pass individual params to Pool
    // The Neon Pool doesn't reliably parse connectionString, so we parse it ourselves.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('@neondatabase/serverless')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaNeon } = require('@prisma/adapter-neon')

    let url: URL
    try {
      url = new URL(rawUrl)
    } catch {
      throw new Error('Invalid DATABASE_URL format')
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
