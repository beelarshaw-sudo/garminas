import { NextResponse } from "next/server";

/**
 * GET /api/diagnostic
 * Diagnostic endpoint to troubleshoot Vercel deployment issues.
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "(not set)";
  const isPostgres = dbUrl.startsWith("postgres");
  const isFile = dbUrl.startsWith("file:");
  const hasSsl = dbUrl.includes("sslmode=");
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      url_set: !!process.env.DATABASE_URL,
      url_masked: maskedUrl,
      type: isPostgres ? "postgresql" : isFile ? "sqlite" : "unknown",
      has_ssl: hasSsl,
      ssl_warning:
        isPostgres && !hasSsl
          ? "Your PostgreSQL URL should include ?sslmode=require — add it to the end of your Neon connection string"
          : null,
    },
  };

  // Test database connection
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({ log: ["error"] });
    const userCount = await prisma.user.count();
    (result.database as Record<string, unknown>).connected = true;
    (result.database as Record<string, unknown>).userCount = userCount;
    (result.database as Record<string, unknown>).tables_exist = true;
    await prisma.$disconnect();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    (result.database as Record<string, unknown>).connected = false;
    (result.database as Record<string, unknown>).error = errMsg;
    (result.database as Record<string, unknown>).error_type =
      error instanceof Error ? error.constructor.name : "Unknown";

    if (
      errMsg.includes("does not exist") ||
      errMsg.includes("no such table") ||
      errMsg.includes("relation")
    ) {
      (result.database as Record<string, unknown>).tables_exist = false;
      (result.database as Record<string, unknown>).fix =
        "Database tables don't exist. The prebuild script should have created them. Check your Vercel build logs for 'prisma db push' errors.";
    }
    if (
      errMsg.includes("connect") ||
      errMsg.includes("timeout") ||
      errMsg.includes("ECONNREFUSED") ||
      errMsg.includes("TLS")
    ) {
      (result.database as Record<string, unknown>).fix =
        "Cannot connect to database. Make sure your Neon connection string includes ?sslmode=require at the end. Example: postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require";
    }
  }

  // Check Prisma client
  try {
    await import("@prisma/client");
    result.prisma = { client_loaded: true };
  } catch (error) {
    result.prisma = {
      client_loaded: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return NextResponse.json(result, { status: 200 });
}
