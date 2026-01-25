# Database Migration Guide

## Prisma Schema Changes

The schema has been updated to include the `PasswordReset` model for the forgot password feature.

## Running Migrations

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Create Migration

```bash
npx prisma migrate dev --name add_password_reset
```

This will:
- Create a new migration file in `prisma/migrations/`
- Apply the migration to your database
- Regenerate Prisma Client

### 3. For Production (Vercel)

Vercel will automatically run `prisma generate` during build (configured in `package.json`).

**Important:** You must run migrations manually on your Supabase database:

```bash
# Option 1: Using Prisma Migrate Deploy (recommended for production)
npx prisma migrate deploy

# Option 2: Using Supabase SQL Editor
# Copy the SQL from prisma/migrations/[timestamp]_add_password_reset/migration.sql
# Paste and run in Supabase Dashboard > SQL Editor
```

## Migration SQL (Manual)

If you prefer to run the migration manually via Supabase SQL Editor:

```sql
-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");

-- CreateIndex
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

-- AddForeignKey
ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Verification

After migration, verify the table exists:

```sql
SELECT * FROM "PasswordReset" LIMIT 1;
```

If the query runs without error, the migration was successful.
