# UniStart Hub

A platform for startup idea incubation built with Next.js, Prisma, and Supabase.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
# Database (Supabase Session Pooler URL)
DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://[project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run database migrations and seed initial invite codes:
```bash
npx prisma db push
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

## Invite Code System

UniStart Hub uses invite codes for role-based registration:

- **Regular users**: Can register without invite code (role: "user")
- **Admins/Experts**: Must provide valid, unused invite code

### Initial Invite Codes (after seeding):
- **Admin**: `ADMIN2024`
- **Expert**: `EXPERT2024`

### Adding More Invite Codes:
```bash
npx prisma studio
```
Then add records to the `InviteCode` table with:
- `code`: Unique string
- `role`: "admin" or "expert"
- `used`: false

## Database Configuration

- Uses Supabase PostgreSQL
- Session Pooler URL for server-side connections
- Prisma ORM for type-safe database operations
- Automatic fallback to mock data when database is not configured

## Features

- User authentication and role management
- Project submission with file uploads
- Admin dashboard with real-time statistics
- Expert review system with comments
- File storage via Supabase Storage