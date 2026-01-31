# Supabase Storage Setup - Avatar Upload

## Muammo

Rasm yuklashda quyidagi xatolik ko'rinadi:
```
Rasm yuklashda xatolik: Bucket not found
```

Bu xatolik Supabase Storage'da **"avatars"** bucket mavjud emasligini anglatadi.

## Yechim (Qadam-baqadam)

### 1️⃣ Supabase Dashboard'ga Kiring

1. **Supabase Dashboard'ga kiring:**
   - https://supabase.com/dashboard
   - Projectingizni tanlang

### 2️⃣ Storage Bucket Yaratish

1. **Storage bo'limiga o'ting:**
   - Left sidebar'dan **"Storage"** ni bosing
   - Yoki **Settings → Storage** ga o'ting

2. **Yangi bucket yarating:**
   - **"New bucket"** yoki **"Create bucket"** tugmasini bosing
   - **Bucket name**: `avatars` (aniq shu nom!)
   - **Public bucket**: ✅ **Yoqing** (Public bo'lishi kerak, aks holda rasm ko'rinmaydi)
   - **File size limit**: 2MB (yoki istalgan)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp` (ixtiyoriy)
   - **"Create bucket"** ni bosing

### 3️⃣ Bucket Policy Sozlash (Ixtiyoriy)

Agar bucket public bo'lsa, policy sozlash shart emas. Lekin agar xavfsizlik kerak bo'lsa:

1. **Bucket'ni tanlang** → **"Policies"** tab
2. **"New policy"** ni bosing
3. **Policy template**: "Allow public read access" yoki "Allow authenticated uploads"
4. **Save** qiling

### 4️⃣ Project Files Bucket (Agar kerak bo'lsa)

Agar loyiha fayllari yuklash ham ishlamayotgan bo'lsa:

1. **Yangi bucket yarating**: `project-files`
2. **Public bucket**: ✅ Yoqing
3. **File size limit**: 10MB (yoki istalgan)

### 5️⃣ Tekshirish

Bucket yaratilgandan keyin:

1. **Storage → Buckets** ga o'ting
2. **"avatars"** bucket ko'rinishi kerak
3. **Public** holatda bo'lishi kerak

### 6️⃣ Vercel'da Environment Variables

Agar hali sozlanmagan bo'lsa, quyidagi o'zgaruvchilarni qo'shing:

1. **Vercel Dashboard → Settings → Environment Variables**
2. Quyidagilarni qo'shing:
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side uchun)

### 7️⃣ Redeploy

Bucket yaratilgandan keyin:

1. **Vercel Dashboard → Deployments**
2. **"Redeploy"** ni bosing
3. Yoki Git push qiling

## Tez Yechim

Agar hamma narsa noto'g'ri bo'lsa:

1. **Supabase Dashboard → Storage**
2. **"New bucket"** → **Name**: `avatars` → **Public**: ✅ → **Create**
3. **Vercel → Redeploy**

Bu muammoni hal qilishi kerak!

## Qo'shimcha Yordam

Agar muammo davom etsa:

1. **Supabase Dashboard → Storage → Buckets** - bucket mavjudligini tekshiring
2. **Bucket name**: `avatars` (aniq shu nom, katta-kichik harf muhim!)
3. **Public bucket**: ✅ Yoqilgan bo'lishi kerak
4. **Vercel logs** - aniq xatolikni ko'ring

## Muhim Eslatmalar

- ✅ **Bucket name**: `avatars` (aniq shu nom!)
- ✅ **Public bucket**: Yoqilgan bo'lishi kerak
- ✅ **Environment variables**: To'g'ri sozlangan bo'lishi kerak
- ❌ **Bucket name noto'g'ri**: `avatar` yoki `Avatar` emas, `avatars` bo'lishi kerak

---

# Loyiha fayllari yuklash (project-files) – tekshirish ro'yxati

Fayl yuklashda xato chiqsa (**Invalid Compact JWS**, **Bucket not found**, **Permission denied** va boshqalar) quyidagilarni ketma-ket tekshiring.

## 1. Environment variables (.env)

Loyiha ildizida `.env` yoki `.env.local` fayli borligini va ichida quyidagilar **to'liq va ortiqcha bo'shliqsiz** yozilganini tekshiring:

| O'zgaruvchi | Qayerdan olinadi | Misol |
|-------------|------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → **Settings → API** → Project URL | `https://xxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → **Settings → API** → **anon public** (uzun JWT) | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (3 qism, nuqta bilan ajratilgan) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → **Settings → API** → **service_role** (server uchun) | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

- **Invalid Compact JWS** ko'p hollarda anon key bo'sh, kesilgan yoki noto'g'ri formatda bo'lganda chiqadi.
- Key'da yangi qator, ortiqcha bo'shliq yoki qo'sh tirnoq bo'lmasin.
- O'zgartirgandan keyin dev server'ni qayta ishga tushiring: `npm run dev`.

## 2. Supabase Dashboard – bucket "project-files"

1. **Supabase Dashboard** → https://supabase.com/dashboard → loyihangizni tanlang.
2. Chap menyudan **Storage** → **Buckets**.
3. Ro'yxatda **project-files** bucket bor-yo'qligini tekshiring.
4. **Agar yo'q bo'lsa – yarating:**
   - **New bucket** → **Name**: `project-files` (aniq shu nom, kichik harf, tire).
   - **Public bucket**: ✅ Yoqing (fayl linklari ishlashi uchun).
   - **File size limit**: 10 MB (yoki loyiha talabiga qarab).
   - **Create bucket** ni bosing.

## 3. Storage policies (RLS) – client yuklash uchun

Brauzer **anon** key bilan yuklaydi. Bucket yaratilganda policy bo'lmasa, yuklash **Permission denied** berishi mumkin.

1. **Storage** → **Buckets** → **project-files** ni tanlang.
2. **Policies** tabiga o'ting.
3. **New policy** → **For full customization** (yoki "Allow public upload" mavjud bo'lsa).
4. **Policy name**: masalan `Allow anon upload`.
5. **Allowed operation(s)**: **INSERT** (yuklash) va kerak bo'lsa **SELECT** (o'qish).
6. **Target roles**: `anon` (yoki "public").
7. **USING expression**: `true` (yoki `bucket_id = 'project-files'`).
8. **WITH CHECK expression**: `true`.
9. **Review** → **Save policy**.

Yoki SQL orqali (Supabase Dashboard → **SQL Editor**):

```sql
-- project-files bucket ga yuklash (anon)
CREATE POLICY "Allow anon upload to project-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'project-files');

-- o'qish (public URL uchun)
CREATE POLICY "Allow public read project-files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-files');
```

## 4. Tez tekshirish ro'yxati

- [ ] `.env` da `NEXT_PUBLIC_SUPABASE_URL` va `NEXT_PUBLIC_SUPABASE_ANON_KEY` bor va to'g'ri.
- [ ] `.env` da `SUPABASE_SERVICE_ROLE_KEY` bor (server yuklash / API uchun).
- [ ] Supabase Dashboard → Storage → **project-files** bucket mavjud.
- [ ] Bucket **Public**.
- [ ] **project-files** uchun INSERT (va kerak bo'lsa SELECT) policy yoqilgan.
- [ ] O'zgartirgandan keyin `npm run dev` qayta ishga tushirilgan.

## 5. Xato bo'yicha qisqa yo'riqnoma

| Xato | Asosiy sabab | Nima qilish |
|------|----------------|-------------|
| **Invalid Compact JWS** | Anon key yo'q / noto'g'ri | .env da anon key ni Dashboard → Settings → API dan nusxalang, formatni tekshiring. |
| **Bucket not found** | project-files yaratilmagan | Storage → New bucket → `project-files`, Public ✅. |
| **Permission denied** / 403 | RLS policy yo'q | project-files uchun INSERT (anon) policy qo'shing (3-band). |
| **new row violates row-level security** | Policy shartiga mos kelmayapti | USING / WITH CHECK da `bucket_id = 'project-files'` va role `anon` yoki `public` bo'lsin. |

Agar barchasi to'g'ri bo'lsa ham xato davom etsa: **faylsiz** (Loyiha fayli maydonini bo'sh qoldirib) yuborib ko'ring – loyiha yozuvi yaratiladi, faqat fayl bo'lmaydi. Bu Storage sozlamalarini tekshirishda yordam beradi.
