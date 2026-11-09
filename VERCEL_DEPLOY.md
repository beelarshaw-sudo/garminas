# GarMinas — Vercel Deployment Guide

## The Problem
Vercel uses serverless functions which don't support SQLite (file-based database).
The app uses SQLite locally and on z.ai, but needs PostgreSQL on Vercel.

## The Solution
This project includes a **dual-schema system** that automatically detects the database type:
- `DATABASE_URL=file:...` → uses SQLite (for z.ai / local dev)
- `DATABASE_URL=postgres:...` → uses PostgreSQL (for Vercel)

The `postinstall` script (`scripts/select-schema.js`) runs automatically during
`npm install` / `bun install` and copies the correct schema file.

## Steps to Deploy on Vercel

### Step 1: Create a Free PostgreSQL Database

1. Go to **https://neon.tech** (free, no credit card needed)
2. Sign up with GitHub or email
3. Create a new project
4. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

### Step 2: Import to Vercel

1. Go to **https://vercel.com/new**
2. Import your GitHub repo: `beelarshaw-sudo/garminas`
3. In the "Environment Variables" section, add:
   - **Name:** `DATABASE_URL`
   - **Value:** (paste the Neon connection string from Step 1)
4. Click **Deploy**

### Step 3: Create the Database Tables

After the first deploy, Vercel runs `postinstall` which generates the Prisma client.
But you need to create the tables in PostgreSQL:

Option A (via Vercel terminal):
```
vercel env pull .env.local
npx prisma db push
```

Option B (via Neon SQL Editor):
1. Go to your Neon dashboard
2. Open the SQL Editor
3. Run the SQL from `prisma/migrations/init.sql` (if available)
4. Or just visit your app's `/api/setup` endpoint which creates the admin account
   and the tables will be auto-created by Prisma

### Step 4: Create the Admin Account

Visit this URL in your browser:
```
https://your-app.vercel.app/api/setup
```

This creates the admin account:
- **Email:** admin@garminas.com
- **Password:** GosuloBalasapi2584$

### Step 5: Log In

Go to `https://your-app.vercel.app` and log in with the admin credentials.

## Environment Variables

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` (Neon connection string) | Yes |

## Notes

- The `postinstall` script automatically selects the right Prisma schema
- SQLite works on z.ai (persistent filesystem)
- PostgreSQL works on Vercel (serverless-compatible)
- File uploads (ID cards, bills, payment receipts) are stored locally in `public/uploads/`
  — for production on Vercel, consider using Vercel Blob or AWS S3
- The `/api/setup` endpoint creates the admin account on any fresh database
