# Platformani 100% deploy qilishga tayyorlik

## ✅ Allaqachon tayyor

- **Kod:** TypeScript, ESLint, Prisma schema, build script (`prisma generate && next build`)
- **Auth:** Login, register, JWT sessiya, parol tiklash (hash, email)
- **DB:** Migrations mavjud, Direct connection (5432) hujjatlashtirilgan
- **i18n:** UZ/RU/EN, barcha asosiy sahifalar va bildirishnomalar tarjima qilingan
- **Xavfsizlik:** Parol hash, reset code hash, debug endpoint’lar production’da o‘chirilgan (404)

---

## ⚠️ Deploy oldidan tekshirish

### 1. Environment variables (Vercel)

Quyidagi o‘zgaruvchilar **barchasi** Production (va kerak bo‘lsa Preview) uchun o‘rnatilgan bo‘lishi kerak:

| O‘zgaruvchi | Majburiy | Izoh |
|-------------|----------|------|
| **JWT_SECRET** | ✅ | Kamida 16 belgi. `openssl rand -base64 32` |
| **DATABASE_URL** | ✅ | Port **5432** (Direct), Session Pooler (6543) emas |
| **NEXT_PUBLIC_SUPABASE_URL** | ✅ | Supabase → Settings → API |
| **NEXT_PUBLIC_SUPABASE_ANON_KEY** | ✅ | Supabase → Settings → API |
| **SUPABASE_SERVICE_ROLE_KEY** | ✅ | Supabase → Settings → API (maxfiy) |
| **SMTP_HOST**, **SMTP_PORT**, **SMTP_USER**, **SMTP_PASS** | ✅ | Parol tiklash email uchun (Gmail: App Password) |
| **APP_URL** | ✅ | Production URL (masalan `https://unistart-hub.vercel.app`) |

Batafsil: `ENV_VARIABLES.md`, `DEPLOY_CHECKLIST.md`.

### 2. Database

- Supabase’da barcha migration’lar qo‘llangan (yoki SQL Editor orqali jadvallar yaratilgan).
- `DATABASE_URL` **Direct connection** (5432), username formati: `postgres.PROJECT-REF`.

### 3. Build

```bash
npm install
npm run build
```

Build xatosiz tugashi kerak. Keyin lokalda tekshirish:

```bash
npm run start
```

---

## 🔒 Production’da qo‘shimcha tavsiyalar

1. **Custom domain:** Vercel’da domain ulang va `APP_URL`ni yangilang.
2. **SMTP:** Production’da parol tiklash uchun SMTP sozlash shart; sozlanmasa reset link ishlamaydi.
3. **Monitoring:** Vercel Analytics yoki boshqa monitoring (ixtiyoriy).

---

## 📋 Deploy keyin tekshirish

1. **Bosh sahifa** — Public Dashboard, til almashtirgich, statistikalar.
2. **Ro‘yxatdan o‘tish / Kirish** — JWT sessiya, redirect.
3. **Dashboard** — loyihalar, statistikalar, bildirishnomalar (tarjima).
4. **Parol tiklash** — Forgot password → email → Reset (SMTP ishlashi kerak).
5. **Loyiha yuborish / ko‘rib chiqish** — statuslar tarjima qilingan.

---

## Xulosa

- **Kod va xavfsizlik:** Tayyor; JWT_SECRET hujjatlashtirildi, debug endpoint’lar production’da o‘chirilgan.
- **Qilish kerak:** Vercel’da barcha env o‘zgaruvchilarni o‘rnatish, DB migration, build va yuqoridagi tekshiruvlarni o‘tkazish.

Bular bajarilsa, platforma 100% deploy qilishga tayyor hisoblanadi.
