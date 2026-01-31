# Fix P4002: Remove Cross-Schema Reference to auth.users

## What’s wrong

Prisma reports:

```text
P4002: public.user_organizations points to auth.users in constraint user_organizations_user_id_fkey.
Please add `auth` to your schemas property...
```

That happens because there is a table **`public.user_organizations`** in your Supabase DB whose foreign key points to **`auth.users`** (Supabase Auth). Prisma only manages the **public** schema and your app uses **Prisma-only auth** (no Supabase Auth), so that table and its FK to `auth` must be removed.

## What to do

Run the following in **Supabase Dashboard → SQL Editor** (as a one-off):

```sql
-- Drop the table that references auth.users (leftover from Supabase Auth).
-- Prisma uses public.User + User.organizationId instead.
DROP TABLE IF EXISTS public.user_organizations CASCADE;
```

Then run:

```bash
npx prisma migrate dev --name add_organization_and_user_organization_id
```

(If you already applied the migration, use `npx prisma migrate dev` or `npx prisma db push` as needed.)

## Why this is safe

- Your app does **not** use `user_organizations` or `auth.users`; auth is handled by Prisma and the **public.User** table.
- Organization membership is modeled as **User.organizationId** → **Organization** in the Prisma schema.
- Dropping `public.user_organizations` only removes an unused, Auth-related table so Prisma can manage the public schema without cross-schema references.

---

## Drift: "Database schema is not in sync with migration history"

Agar Prisma "Drift detected" deb yozsa va reset taklif qilsa, **ma'lumotlarni saqlash kerak bo'lsa** `prisma migrate reset` ishlat**mang** — u barcha jadvallar va ma'lumotlarni o'chiradi.

### A) Bazada Organization va User.organizationId allaqachon bor

Agar bazada `Organization` jadvali va `User.organizationId` ustuni bor bo'lsa (SQL yoki `db push` orqali qo'shilgan), migratsiyani "qo'llangan" deb belgilang (bajarilmaydi):

```bash
npx prisma migrate resolve --applied "20260126120000_add_organization_and_user_organization_id"
```

Shundan keyin drift xabari ketadi.

### B) Bazada Organization / organizationId yo'q

Agar baza hali yangilanmagan bo'lsa:

```bash
npx prisma migrate deploy
```

### C) Development, ma'lumotlar muhim emas

Agar barcha ma'lumotlarni o'chirib, bazani qayta yaratmoqchi bo'lsangiz:

```bash
npx prisma migrate reset
```
