import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/diagnostic
 * Tests the actual database connection used by the app.
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "(not set)";
  const isPostgres = dbUrl.startsWith("postgres");
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ":****@");

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    database: {
      url_set: !!process.env.DATABASE_URL,
      url_masked: maskedUrl,
      type: isPostgres ? "postgresql" : "sqlite",
      using_neon_adapter: isPostgres,
    },
  };

  // Test database connection using the actual db instance (with Neon adapter)
  try {
    const userCount = await db.user.count();
    (result.database as Record<string, unknown>).connected = true;
    (result.database as Record<string, unknown>).userCount = userCount;
    (result.database as Record<string, unknown>).message =
      userCount === 0
        ? "Database connected! No users yet. Visit /api/setup to create the admin account."
        : `Database connected! ${userCount} users found.`;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    (result.database as Record<string, unknown>).connected = false;
    (result.database as Record<string, unknown>).error = errMsg;

    if (errMsg.includes("does not exist") || errMsg.includes("relation")) {
      (result.database as Record<string, unknown>).fix =
        "Tables don't exist. The prebuild script should create them. Check Vercel build logs. You may need to run 'npx prisma db push' with your DATABASE_URL set.";
    }
    if (errMsg.includes("Can't reach") || errMsg.includes("connect")) {
      (result.database as Record<string, unknown>).fix =
        "Cannot connect to database. If using Neon, make sure the connection string uses the pooled endpoint (with '-pooler' in hostname) and includes ?sslmode=require.";
    }
  }

  return NextResponse.json(result, { status: 200 });
}
