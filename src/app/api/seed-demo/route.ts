import { NextResponse } from "next/server";

/**
 * SEED DEMO ENDPOINT — DISABLED
 *
 * This endpoint was used during development to seed demo accounts.
 * It has been disabled for production. Demo accounts have been removed.
 *
 * To create an admin account in production, use the database directly
 * or create a secure first-run setup script.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Demo seeding is disabled. This endpoint was for development only.",
    },
    { status: 403 }
  );
}
