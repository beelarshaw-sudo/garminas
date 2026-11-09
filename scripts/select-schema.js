/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Selects the correct Prisma schema based on the DATABASE_URL format.
 *
 * - SQLite (file:...) → uses schema-sqlite.prisma (for z.ai / local dev)
 * - PostgreSQL (postgres:...) → uses schema-postgres.prisma (for Vercel)
 *
 * This runs as a postinstall script so the right schema is in place
 * before `prisma generate` runs.
 */
const fs = require("fs");
const path = require("path");

const dbUrl = process.env.DATABASE_URL || "file:./db/custom.db";
const schemaDir = path.join(__dirname, "..", "prisma");
const target = path.join(schemaDir, "schema.prisma");

let source;
if (dbUrl.startsWith("file:") || dbUrl.startsWith("sqlite:")) {
  source = path.join(schemaDir, "schema-sqlite.prisma");
  console.log("[schema-select] Using SQLite schema (file-based database)");
} else if (
  dbUrl.startsWith("postgres:") ||
  dbUrl.startsWith("postgresql:")
) {
  source = path.join(schemaDir, "schema-postgres.prisma");
  console.log("[schema-select] Using PostgreSQL schema (serverless-compatible)");
} else {
  // Default to SQLite
  source = path.join(schemaDir, "schema-sqlite.prisma");
  console.log("[schema-select] Unknown DATABASE_URL format, defaulting to SQLite");
}

fs.copyFileSync(source, target);
console.log(`[schema-select] Copied ${path.basename(source)} → schema.prisma`);
