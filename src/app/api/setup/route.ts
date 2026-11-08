import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, recordAudit } from "@/lib/auth";

/**
 * POST /api/setup
 *
 * Creates the initial admin account on a fresh deployment.
 * This is safe to call multiple times — it only creates the admin
 * if no users exist in the database.
 *
 * Call this once after deploying to z.ai or any other platform:
 *   curl -X POST https://your-app-url/api/setup
 *
 * Or visit https://your-app-url/api/setup in a browser after deployment.
 */
export async function POST(req: NextRequest) {
  const userCount = await db.user.count();
  if (userCount > 0) {
    return NextResponse.json({
      ok: true,
      message: "Database already has users. Setup not needed.",
      userCount,
    });
  }

  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Use defaults
  }

  const email = (body.email || "admin@garminas.com").trim().toLowerCase();
  const password = body.password || "GosuloBalasapi2584$";

  const { hash, salt } = await hashPassword(password);

  const user = await db.user.create({
    data: {
      email,
      phone: "+92000000000",
      passwordHash: hash,
      passwordSalt: salt,
      emailVerified: true,
      phoneVerified: true,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isProfileApproved: true,
      accountType: "INDIVIDUAL",
      country: "PK",
      nationality: "Pakistan",
      callingCode: "+92",
      currency: "PKR",
      subscriptionStatus: "ACTIVE",
      subscriptionAmount: 5000,
      subscriptionStartsAt: new Date(),
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      applicationStatus: "APPROVED",
      communityVerificationStatus: "VERIFIED",
    },
  });

  await db.adminRole.create({
    data: {
      userId: user.id,
      canManageMembers: true,
      canVerifyIdentity: true,
      canVerifyCommunity: true,
      canModerate: true,
      canViewAnalytics: true,
      canManageAdmins: true,
    },
  });

  await db.profile.create({
    data: { userId: user.id, fullName: "Administrator" },
  });

  await recordAudit({
    userId: user.id,
    action: "initial_setup_admin_created",
  });

  return NextResponse.json({
    ok: true,
    message: "Admin account created successfully.",
    credentials: { email },
  });
}

/**
 * GET /api/setup
 * Easy browser-accessible setup — visit this URL after deployment
 * to auto-create the admin account.
 */
export async function GET() {
  const userCount = await db.user.count();
  if (userCount > 0) {
    return NextResponse.json({
      ok: true,
      message: "Database already has users. Setup not needed.",
      userCount,
    });
  }

  const { hash, salt } = await hashPassword("GosuloBalasapi2584$");

  const user = await db.user.create({
    data: {
      email: "admin@garminas.com",
      phone: "+92000000000",
      passwordHash: hash,
      passwordSalt: salt,
      emailVerified: true,
      phoneVerified: true,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isProfileApproved: true,
      accountType: "INDIVIDUAL",
      country: "PK",
      nationality: "Pakistan",
      callingCode: "+92",
      currency: "PKR",
      subscriptionStatus: "ACTIVE",
      subscriptionAmount: 5000,
      subscriptionStartsAt: new Date(),
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      applicationStatus: "APPROVED",
      communityVerificationStatus: "VERIFIED",
    },
  });

  await db.adminRole.create({
    data: {
      userId: user.id,
      canManageMembers: true,
      canVerifyIdentity: true,
      canVerifyCommunity: true,
      canModerate: true,
      canViewAnalytics: true,
      canManageAdmins: true,
    },
  });

  await db.profile.create({
    data: { userId: user.id, fullName: "Administrator" },
  });

  return NextResponse.json({
    ok: true,
    message: "Admin account created successfully. You can now log in.",
    credentials: {
      email: "admin@garminas.com",
      password: "GosuloBalasapi2584$",
    },
  });
}
