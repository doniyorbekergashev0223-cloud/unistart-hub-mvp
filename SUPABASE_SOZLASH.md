# Supabase ni UniStart Hub uchun 100% sozlash (sodda qo‘llanma)

Register ishlashi uchun **bitta Supabase loyihasi** ichida 3 narsa kerak: **Baza (Postgres)**, **Auth**, **.env**. Quyidagi qadamlarni ketma-ket bajaring.

---

## QISM 1: Supabase loyihasi

### 1.1 Loyiha ochish

1. Brauzerda **https://supabase.com/dashboard** oching.
2. Akkauntga kiring (yoki ro‘yxatdan o‘ting).
3. **New project** bosing.
4. **Name:** `unistart-hub` (yoki istalgan).
5. **Database Password:** mustaqil parol yarating va **yozib qoling** (keyin DATABASE_URL da kerak).
6. **Region:** o‘zingizga yaqinini tanlang (masalan Singapore).
7. **Create new project** bosing va 1–2 daqiqa kuting (loyiha tayyor bo‘ladi).

---

## QISM 2: .env dagi 4 ta o‘zgaruvchi

Loyiha tayyor bo‘lgach, **chap pastda Settings (⚙️)** ga boring. Har bir qiymatni **Settings** ichidagi tegishli bo‘limdan nusxalaysiz va **.env** faylida mos qatorga qo‘yasiz.

### 2.1 NEXT_PUBLIC_SUPABASE_URL va kalitlar (Auth uchun)

1. **Settings** → **API**.
2. **Project URL** — butun linkni nusxalang (masalan `https://xxxxxxxx.supabase.co`).
3. **.env** da qatorni shunday qiling (o‘zingizning URL ingiz bilan):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
   ```
4. Yana **API** sahifasida **Project API keys** bo‘limiga tushing.
5. **anon** **public** — bu kalitni nusxalang (odatda `eyJ...` bilan boshlanadi).
6. **.env** ga qo‘shing:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (nusxalagan butun kalit)
   ```
7. **service_role** **secret** kalitni ham nusxalang (ehtiyotkorlik bilan, maxfiy).
8. **.env** ga qo‘shing:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (nusxalagan butun kalit)
   ```

### 2.2 DATABASE_URL (Prisma / baza uchun)

1. **Settings** → **Database**.
2. **Connection string** bo‘limiga tushing.
3. **"Direct connection"** (yoki **URI** va host **db.xxx.supabase.co** bo‘lgan) variantni tanlang. **Session pooler (6543)** emas.
4. **Copy** qiling. Format shunga o‘xshash:
   ```
   postgresql://postgres.XXXXXXXX:PASSWORD@db.XXXXXXXX.supabase.co:5432/postgres
   ```
5. **PASSWORD** o‘rniga 1.5 qadamda yozib qolgan **Database parolingizni** qo‘ying.
6. Parolda **@**, **#**, **%** bo‘lsa, URL-encode qiling: `@` → `%40`, `#` → `%23`, `%` → `%25`.
7. **.env** ga qo‘shing (bitta qator, qo‘shtirnoq ichida):
   ```env
   DATABASE_URL="postgresql://postgres.XXXXXXXX:PAROL@db.XXXXXXXX.supabase.co:5432/postgres"
   ```

**Muhim:** Host **db.XXXXXXXX.supabase.co** bo‘lishi kerak. **pooler.supabase.com** bo‘lmasin (ulanish xatoligi beradi).

---

## QISM 3: Bazada jadvallar (Prisma migrate)

Tizim **Prisma** orqali jadvallarni yaratadi. Terminalda loyiha papkasida:

```bash
npx prisma migrate deploy
```

Agar birinchi marta bo‘lsa va migrate fayllar bor bo‘lsa, barcha jadvalar (User, Project, va b.) yaratiladi. Xato chiqsa, avval **.env** da **DATABASE_URL** to‘g‘ri ekanini tekshiring (db.xxx.supabase.co, to‘g‘ri parol).

---

## QISM 4: Auth sozlamalari (Register uchun)

1. Supabase Dashboard da **Authentication** → **Providers**.
2. **Email** yoqilgan bo‘lishi kerak (default yoqilgan).
3. **Confirm email** — agar sinov uchun tez ro‘yxatdan o‘tishni xohlasangiz, **Confirm email** ni vaqtincha o‘chiring (keyin production da qayta yoqasiz).

---

## QISM 5: .env ning yakuniy ko‘rinishi

**.env** faylida quyidagilar bo‘lishi kerak (qiymatlar o‘zingiznikiga almashtirilgan):

```env
# Supabase (Auth + Storage)
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Baza (Prisma) — Direct connection, host db.xxx.supabase.co
DATABASE_URL="postgresql://postgres.XXXXXXXX:SIZNING_PAROL@db.XXXXXXXX.supabase.co:5432/postgres"
```

**Tekshirish:**

- **NEXT_PUBLIC_SUPABASE_URL** — `https://` bilan boshlanadi, `...supabase.co` bilan tugaydi.
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** va **SUPABASE_SERVICE_ROLE_KEY** — odatda **eyJ** bilan boshlanadi (JWT). Agar **sb_publishable_** yoki **sb_secret_** ko‘rinsa, bu tizim uchun to‘g‘ri format emas; **Settings → API → Project API keys** dan **anon** va **service_role** kalitlarni qayta nusxalang.
- **DATABASE_URL** — host **db.XXXXXXXX.supabase.co**, port **5432**.

---

## QISM 6: Loyihani ishga tushirish

1. **.env** ni saqlang.
2. Terminalda:
   ```bash
   npm run dev
   ```
3. Brauzerda **http://localhost:3000/auth/register** ochib, ro‘yxatdan o‘tishni sinab ko‘ring.

---

## Tez tekshiruv ro‘yxati

| Narsa | Qayerda | Qanday |
|--------|---------|--------|
| Project faol | Dashboard | Yashil "Project Status" |
| Auth yoqilgan | Authentication → Providers | Email yoqilgan |
| DATABASE_URL | .env | Host `db....supabase.co`, port 5432 |
| Kalitlar | .env | anon va service_role **eyJ...** formatida |
| Jadvallar | Baza | `npx prisma migrate deploy` bajarilgan |

Agar register hali ham ishlamasa, brauzer konsolida (F12) va terminaldagi xabar matnini yozib yuboring.
