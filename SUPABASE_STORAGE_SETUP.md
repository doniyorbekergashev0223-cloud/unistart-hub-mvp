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
