# Vercel Deploy Fix - PrismaClientUnknownRequestError

## Muammo

`PrismaClientUnknownRequestError` xatoligi Vercel'da deploy qilganda yuzaga kelmoqda.

## Sabab

Bu xatolik odatda quyidagi sabablarga ko'ra yuzaga keladi:

1. **Prisma Client to'liq generate qilinmagan** - Build vaqtida Prisma client to'liq yaratilmagan
2. **Database connection muammosi** - Supabase bilan bog'lanishda xatolik
3. **Schema mismatch** - Prisma schema va database jadvallari mos kelmaydi

## Yechim

### 1. Build Script Tekshirish

`package.json`'da build script to'g'ri bo'lishi kerak:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 2. Vercel Build Settings

Vercel Dashboard > Project Settings > Build & Development Settings:

- **Build Command**: `prisma generate && next build` (yoki package.json'dagi script ishlatiladi)
- **Install Command**: `npm install` (yoki `yarn install`)

### 3. Environment Variables

Vercel'da quyidagi o'zgaruvchilar sozlangan bo'lishi kerak:

```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:5432/postgres
```

**MUHIM:** 
- Port **5432** bo'lishi kerak (Direct connection)
- `pgbouncer=true` parametri bo'lmasligi kerak
- `pooler.supabase.com` hostname ishlatilganda ham port 5432 bo'lishi kerak

### 4. Prisma Client Generate

Vercel build loglarida quyidagilar ko'rinishi kerak:

```
Running "prisma generate"
✔ Generated Prisma Client
```

Agar bu ko'rinmasa, build script'ni tekshiring.

### 5. Database Migration

Supabase'da barcha jadvallar yaratilgan bo'lishi kerak:

- User
- Project
- ProjectComment
- Notification
- PasswordReset (yangi qo'shilgan)

Migration qilish:

```bash
# Local'da
npx prisma migrate dev

# Yoki Supabase SQL Editor'da MIGRATION_GUIDE.md'dagi SQL'ni ishga tushirish
```

## Tekshirish

### Build Logs

Vercel Dashboard > Deployments > Latest > Build Logs:

1. `prisma generate` muvaffaqiyatli bajarilganini tekshiring
2. TypeScript xatoliklari yo'qligini tekshiring
3. Build muvaffaqiyatli tugaganini tekshiring

### Runtime Logs

Deploy keyin Runtime Logs'da:

1. `DATABASE_URL exists: true` ko'rinishi kerak
2. `Prisma client created successfully` ko'rinishi kerak
3. Database query xatoliklari bo'lmasligi kerak

## Agar Muammo Davom Etsa

### 1. Prisma Client Cache'ni Tozalash

```bash
# Local'da
rm -rf node_modules/.prisma
rm -rf .next
npx prisma generate
```

### 2. Vercel Build Cache'ni Tozalash

Vercel Dashboard > Project Settings > General > Clear Build Cache

### 3. Database Connection Tekshirish

```bash
# Local'da test qilish
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('OK')).catch(e => console.error('Error:', e));"
```

### 4. Schema Tekshirish

```bash
# Prisma schema va database mosligini tekshirish
npx prisma db pull
npx prisma generate
```

## Kod O'zgarishlari

Dashboard stats route'da xatolarni yaxshiroq boshqarish qo'shildi:

- `$connect()` o'rniga `$queryRaw` ishlatiladi (ishonchliroq)
- Har bir query individual error handling'ga ega
- Xatolik bo'lganda 0 qaytaradi (dashboard crash bo'lmaydi)

Bu o'zgarishlar kodga qo'shildi va endi deploy qilish mumkin.
