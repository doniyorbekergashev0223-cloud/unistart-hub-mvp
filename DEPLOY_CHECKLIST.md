# Deploy Checklist - UniStart Hub

## ✅ Kod Tayyorligi

- [x] Barcha API route'lar `nodejs` runtime ishlatadi
- [x] TypeScript xatoliklari yo'q
- [x] Linter xatoliklari yo'q
- [x] Prisma schema to'liq (PasswordReset model qo'shilgan)
- [x] Barcha dependencies package.json'da
- [x] Build script to'g'ri (`prisma generate && next build`)

## ⚠️ Deploy Oldidan Qilish Kerak

### 1. Database Migration (MUHIM!)

**Supabase'da PasswordReset jadvalini yaratish kerak:**

```bash
# Local'da migration yaratish
npx prisma migrate dev --name add_password_reset

# Yoki Supabase SQL Editor'da quyidagi SQL'ni ishga tushirish:
```

```sql
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");
CREATE INDEX "PasswordReset_userId_idx" ON "PasswordReset"("userId");
CREATE INDEX "PasswordReset_expiresAt_idx" ON "PasswordReset"("expiresAt");

ALTER TABLE "PasswordReset" ADD CONSTRAINT "PasswordReset_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 2. Vercel Environment Variables

Vercel Dashboard > Project Settings > Environment Variables'ga quyidagilarni qo'shing:

**REQUIRED:**
```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
APP_URL=https://your-domain.vercel.app
```

**Eslatma:**
- `DATABASE_URL` - Direct connection (port 5432) bo'lishi kerak
- `APP_URL` - Production URL (Vercel deployment URL yoki custom domain)
- `SMTP_PASS` - Gmail uchun App Password (oddiy parol emas!)

### 3. Git Push

```bash
git add .
git commit -m "Production ready: Add password reset, fix auth"
git push
```

Vercel avtomatik deploy qiladi.

## 🔍 Deploy Keyin Tekshirish

1. **Build Logs**
   - Vercel Dashboard > Deployments > Latest
   - Build muvaffaqiyatli bo'lishi kerak
   - TypeScript xatoliklari bo'lmasligi kerak

2. **Database Connection**
   - Login/Register ishlashini tekshiring
   - Dashboard stats yuklanishini tekshiring

3. **Password Reset**
   - Forgot password sahifasiga o'ting
   - Email yuborishni tekshiring
   - Reset code bilan parolni o'zgartirishni tekshiring

4. **Environment Variables**
   - Agar SMTP sozlanmagan bo'lsa, reset code console'da ko'rinadi (dev)
   - Production'da SMTP sozlash shart!

## ❌ Muammo Bo'lsa

### Build Xatolik
- `prisma generate` ishlatilganini tekshiring
- TypeScript xatoliklarini tekshiring
- Dependencies to'liq install qilinganini tekshiring

### Database Xatolik
- `DATABASE_URL` to'g'ri ekanligini tekshiring (port 5432)
- Supabase project faol ekanligini tekshiring
- Migration qilinganini tekshiring

### Email Xatolik
- SMTP sozlamalarini tekshiring
- Gmail uchun App Password ishlatilganini tekshiring
- `APP_URL` to'g'ri ekanligini tekshiring

## ✅ Tayyor!

Agar yuqoridagi barcha qadamlarni bajarsangiz, deploy muvaffaqiyatli bo'lishi kerak!
