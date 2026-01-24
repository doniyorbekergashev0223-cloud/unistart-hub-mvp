# Database Connection Fix

## Problem
The dashboard is not working because Prisma cannot connect to the database. The error shows it's trying to connect to port `5432`, but Supabase Session Pooler requires port `6543`.

## Solution

### Step 1: Update DATABASE_URL in `.env`

Your current `DATABASE_URL` is likely using port `5432`. Change it to use port `6543`:

**Current (WRONG):**
```env
DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**Correct (Session Pooler):**
```env
DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

### Step 2: Get the correct connection string from Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, select **Session mode** (not Transaction or Direct)
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. Make sure the port is `6543` (Session Pooler port)

### Step 3: URL-encode special characters in password

If your password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

### Step 4: Regenerate Prisma Client

After updating `.env`, run:
```bash
npx prisma generate
```

### Step 5: Test the connection

```bash
npx prisma db pull
```

If this succeeds, your database connection is working!

### Step 6: Restart the dev server

```bash
npm run dev
```

## Alternative: Direct Connection (for testing only)

If Session Pooler doesn't work, you can temporarily use direct connection:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

**Note:** Direct connections don't use pgbouncer and may have connection limits. Use Session Pooler (port 6543) for production.
