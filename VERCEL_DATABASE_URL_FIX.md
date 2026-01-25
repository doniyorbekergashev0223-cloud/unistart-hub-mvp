# Vercel DATABASE_URL Sozlash - MUHIM!

## Muammo

Build loglarda ko'rinib turibdiki:
- `DATABASE_URL preview: postgresql://postgres:uNISTARThUB2026@db.iabvbvsqn...`
- Xatolik: `Can't reach database server at db.iabvbvsqnvrhllxbxsix.supabase.co:5432`

## Sabab

Vercel'da `DATABASE_URL` noto'g'ri formatda sozlangan.

## To'g'ri Format

### Supabase Direct Connection (Port 5432)

**Format:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:5432/postgres
```

**Sizning holatingiz uchun:**
```
postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**YOKI (agar Supabase to'g'ridan-to'g'ri hostname ishlatsa):**
```
postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@db.iabvbvsqnvrhllxbxsix.supabase.co:5432/postgres
```

## Vercel'da Sozlash

1. **Vercel Dashboard** > Project Settings > Environment Variables
2. `DATABASE_URL` ni toping yoki yangi qo'shing
3. **To'g'ri formatni kiriting:**

```
postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**MUHIM:**
- Username: `postgres.iabvbvsqnvrhllxbxsix` (faqat `postgres` emas!)
- Port: `5432` (6543 emas!)
- `pgbouncer=true` parametri bo'lmasligi kerak

## Supabase'dan Olish

1. Supabase Dashboard > Settings > Database
2. "Connection string" bo'limiga o'ting
3. "Direct connection" ni tanlang (Session pooler emas!)
4. "URI" formatini ko'chiring
5. Port 5432 ekanligini tekshiring

## Tekshirish

Deploy keyin Runtime Logs'da:
- `DATABASE_URL preview` to'g'ri formatda ko'rinishi kerak
- `postgres.iabvbvsqnvrhllxbxsix:` username ko'rinishi kerak
- Database connection xatoliklari bo'lmasligi kerak

## Login/Register Ishlashi Uchun

Agar `DATABASE_URL` to'g'ri sozlansa:
- ✅ Login ishlaydi
- ✅ Register ishlaydi
- ✅ Database query'lar muvaffaqiyatli bajariladi
