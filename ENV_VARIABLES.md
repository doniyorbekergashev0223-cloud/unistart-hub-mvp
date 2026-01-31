# Environment Variables Documentation

This document describes all required and optional environment variables for UniStart Hub.

## Required Variables

### Authentication (JWT)

```env
JWT_SECRET="your-secret-at-least-16-chars"
```

**Important:**
- Used for signing session cookies (login). Must be at least 16 characters.
- Generate a strong random string (e.g. `openssl rand -base64 32`).
- Never commit this value; set it only in Vercel Environment Variables.

### Database (Supabase PostgreSQL)

Use two URLs for scalable connections:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
DATABASE_DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:5432/postgres"
```

**Important:**
- **DATABASE_URL**: Session pooler (port 6543, `?pgbouncer=true`) — used for auth, register, simple CRUD.
- **DATABASE_DIRECT_URL**: Direct connection (port 5432) — used for statistics, analytics, heavy queries.
- Get both from: Supabase Dashboard > Settings > Database > Connection string (Session pooler vs Direct).
- Do not remove DATABASE_URL.

### Supabase Storage

```env
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
```

**Where to find:**
- Supabase Dashboard > Settings > API
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: service_role key (keep secret!)

### Email (SMTP) - Required for Password Reset

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

**Common SMTP Providers:**
- **Gmail**: `smtp.gmail.com:587` (requires App Password)
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`
- **AWS SES**: `email-smtp.[region].amazonaws.com:587`

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate App Password: Google Account > Security > App passwords
3. Use App Password (not regular password) in `SMTP_PASS`

### Application URL

```env
APP_URL="https://your-domain.com"
```

**Usage:**
- Used in password reset emails to generate reset links
- Development: `http://localhost:3000`
- Production: Your Vercel deployment URL or custom domain

## Optional Variables

### Node Environment

```env
NODE_ENV="production"
```

**Values:**
- `development`: Development mode (enables Prisma query logging)
- `production`: Production mode (minimal logging)

## Security Notes

1. **Never commit `.env` file to git**
   - Already in `.gitignore`
   - Use Vercel Environment Variables for production

2. **Vercel Setup:**
   - Go to Project Settings > Environment Variables
   - Add all required variables
   - Set environment (Production, Preview, Development)

3. **Password Reset:**
   - If SMTP is not configured, password reset codes are logged to console (development only)
   - In production, SMTP MUST be configured for security

## Validation

The application will:
- ✅ Fail safely if `DATABASE_URL` is missing (returns 503 errors)
- ✅ Fail safely if SMTP is missing (logs codes to console in dev, returns success to user)
- ✅ Work without Supabase Storage keys (file uploads will fail gracefully)

## Example `.env` File

```env
# Database (Supabase Direct Connection)
DATABASE_URL="postgresql://postgres.abc123xyz:your-password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://abc123xyz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application
APP_URL="https://unistart-hub.vercel.app"
JWT_SECRET="your-long-random-secret-at-least-16-characters"
NODE_ENV="production"
```
