import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  hashPassword,
  isStrongPassword,
  generateOtp,
  generateToken,
  createSession,
  rateLimit,
  isDev,
  recordAudit,
} from "@/lib/auth";

const RegisterSchema = z.object({
  // Account type: INDIVIDUAL (self) or PARENT (searching for child)
  accountType: z.enum(["INDIVIDUAL", "PARENT"]).default("INDIVIDUAL"),
  // If PARENT, the parent's own details + child details
  parentRelationship: z.string().optional(), // "father", "mother", "guardian"
  // The person whose profile this is (self, or child if parent is registering)
  fullName: z.string().min(2, "Full name is required."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  gender: z.enum(["Male", "Female", "Prefer not to say"]),
  email: z.string().trim().toLowerCase().email("A valid email is required."),
  mobile: z.string().min(7, "A valid mobile number is required."),
  password: z.string().min(1, "Password is required."),
  city: z.string().min(2, "Current city or district is required."),
  connectionToGB: z
    .string()
    .min(2, "Your connection to Gilgit-Baltistan is required."),
  // Compulsory document uploads (file paths returned by /api/upload)
  idCardFrontPath: z.string().min(1, "ID card (front) is compulsory."),
  idCardBackPath: z.string().min(1, "ID card (back) is compulsory."),
  electricityBillPath: z.string().min(1, "Latest electricity bill is compulsory."),
  ismailiEligibilityConfirmed: z.boolean().refine((v) => v === true, {
    message: "You must confirm your Ismaili community eligibility.",
  }),
  matrimonialOnlyConfirmed: z.boolean().refine((v) => v === true, {
    message: "You must accept the matrimonial-only usage policy.",
  }),
  privacyPolicyAccepted: z.boolean().refine((v) => v === true, {
    message: "You must accept the Privacy Policy.",
  }),
  ageConfirmed: z.boolean().refine((v) => v === true, {
    message: "You must confirm you are 18 or older.",
  }),
  subscriptionAccepted: z.boolean().refine((v) => v === true, {
    message: "You must acknowledge the monthly subscription fee of 5000 PKR.",
  }),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }
  const d = parsed.data;

  // Age check (must be 18+)
  const dob = new Date(d.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const mo = today.getMonth() - dob.getMonth();
  if (mo < 0 || (mo === 0 && today.getDate() < dob.getDate())) age--;
  if (age < 18) {
    return NextResponse.json(
      { error: "You must be 18 or older to use GarMinas." },
      { status: 422 }
    );
  }

  // Password strength
  const pwdCheck = isStrongPassword(d.password);
  if (!pwdCheck.ok) {
    return NextResponse.json(
      { error: `Password is not strong enough: ${pwdCheck.reason}` },
      { status: 422 }
    );
  }

  // Rate limit by IP and email
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rlIp = rateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!rlIp.ok) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }
  const rlEmail = rateLimit(
    `register:email:${d.email.toLowerCase()}`,
    3,
    60 * 60 * 1000
  );
  if (!rlEmail.ok) {
    return NextResponse.json(
      { error: "Too many attempts for this email. Please try again later." },
      { status: 429 }
    );
  }

  // Duplicate detection (by email OR phone)
  const existing = await db.user.findFirst({
    where: {
      OR: [{ email: d.email.toLowerCase() }, { phone: d.mobile }],
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "An account with this email or mobile number already exists. Please sign in or recover your account.",
      },
      { status: 409 }
    );
  }

  const { hash, salt } = await hashPassword(d.password);
  const emailToken = generateToken();
  const emailExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const user = await db.user.create({
    data: {
      email: d.email.toLowerCase(),
      phone: d.mobile,
      passwordHash: hash,
      passwordSalt: salt,
      emailVerifyToken: emailToken,
      emailVerifyExpires: emailExpires,
      phoneOtpHash: otp, // sandbox only — production should hash
      phoneOtpExpires: otpExpires,
      role: "MEMBER",
      status: "PENDING",
      accountType: d.accountType,
      // Subscription starts as NONE — user must pay 5000 PKR after document verification
      subscriptionStatus: "NONE",
      subscriptionAmount: 5000,
    },
  });

  // Profile skeleton
  const profile = await db.profile.create({
    data: {
      userId: user.id,
      fullName: d.fullName,
      dateOfBirth: dob,
      age,
      gender: d.gender,
      city: d.city,
      connectionToGB: d.connectionToGB,
      // If parent is registering, record the parent relationship
      createdByParentId: d.accountType === "PARENT" ? user.id : null,
      parentRelationship: d.accountType === "PARENT" ? d.parentRelationship : null,
    },
  });

  // Verification skeleton
  await db.verificationRecord.create({
    data: { profileId: profile.id, communityConsent: false },
  });

  // The 3 compulsory documents were uploaded via /api/upload (anonymous)
  // and the paths were passed in. Create VerificationDocument records now.
  await db.verificationDocument.createMany({
    data: [
      {
        userId: user.id,
        verificationId: profile.id,
        type: "id_card_front",
        filePath: d.idCardFrontPath,
        mimeType: "image/jpeg",
        reviewStatus: "PENDING",
      },
      {
        userId: user.id,
        verificationId: profile.id,
        type: "id_card_back",
        filePath: d.idCardBackPath,
        mimeType: "image/jpeg",
        reviewStatus: "PENDING",
      },
      {
        userId: user.id,
        verificationId: profile.id,
        type: "electricity_bill",
        filePath: d.electricityBillPath,
        mimeType: "image/jpeg",
        reviewStatus: "PENDING",
      },
    ],
  });

  // Record consents
  await db.privacyConsent.createMany({
    data: [
      {
        userId: user.id,
        consentType: "privacy_policy",
        version: "1.0",
        accepted: d.privacyPolicyAccepted,
        acceptedAt: new Date(),
      },
      {
        userId: user.id,
        consentType: "matrimonial_only",
        version: "1.0",
        accepted: d.matrimonialOnlyConfirmed,
        acceptedAt: new Date(),
      },
      {
        userId: user.id,
        consentType: "community_eligibility",
        version: "1.0",
        accepted: d.ismailiEligibilityConfirmed,
        acceptedAt: new Date(),
      },
      {
        userId: user.id,
        consentType: "age_confirmation",
        version: "1.0",
        accepted: d.ageConfirmed,
        acceptedAt: new Date(),
      },
    ],
  });

  await recordAudit({
    userId: user.id,
    action: "register",
    targetType: "user",
    targetId: user.id,
    ipAddress: ip,
  });

  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    userId: user.id,
    // In sandbox only: return OTP and verify token so the dev can complete flows.
    // Production: OTP would only ever be sent by SMS, never returned.
    dev: isDev ? { otp, emailToken } : undefined,
    message:
      "Account created. Verify your email and phone to continue. A profile reviewer will approve your account before matchmaking unlocks.",
  });
}
