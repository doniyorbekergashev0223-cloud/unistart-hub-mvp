# Database Authentication Error Fix

## Muammo

Vercel logs'da quyidagi xatolik ko'rinadi:

```
Authentication failed against database server, the provided database credentials for `postgres` are not valid`.
```

Bu xatolik `DATABASE_URL` da **parol noto'g'ri** yoki **maxsus belgilar to'g'ri URL-encode qilinmagan** bo'lganda yuzaga keladi.

## Yechim (Qadam-baqadam)

### 1️⃣ Supabase'dan To'g'ri Connection String Olish

1. **Supabase Dashboard'ga kiring:**
   - https://supabase.com/dashboard
   - Projectingizni tanlang

2. **Settings → Database ga o'ting**

3. **Connection string ni oling:**
   - **Connection pooling** bo'limida **Direct connection** tanlang (port 5432)
   - Connection string ni nusxalang
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### 2️⃣ Parolda Maxsus Belgilar Bo'lsa, URL-Encode Qiling

Agar parolingizda quyidagi belgilar bo'lsa, ularni URL-encode qilish kerak:

| Belgilar | URL-Encoded |
|----------|-------------|
| `@`      | `%40`       |
| `#`      | `%23`       |
| `$`      | `%24`       |
| `%`      | `%25`       |
| `&`      | `%26`       |
| `+`      | `%2B`       |
| `=`      | `%3D`       |
| ` ` (space) | `%20`    |

**Misol:**
- Parol: `MyP@ss#2024`
- URL-Encoded: `MyP%40ss%232024`
- To'liq URL: `postgresql://postgres.abc123:MyP%40ss%232024@db.abc123.supabase.co:5432/postgres`

### 3️⃣ Vercel'da DATABASE_URL ni Yangilash

1. **Vercel Dashboard'ga kiring:**
   - https://vercel.com/dashboard
   - Projectingizni tanlang

2. **Settings → Environment Variables ga o'ting**

3. **Mavjud `DATABASE_URL` ni o'chiring:**
   - `DATABASE_URL` ni toping
   - "..." (three dots) → "Delete" ni bosing
   - Tasdiqlang

4. **Yangi `DATABASE_URL` qo'shing:**
   - "Add New" ni bosing
   - **Key**: `DATABASE_URL`
   - **Value**: To'g'ri formatdagi connection string (parol URL-encoded bo'lsa)
   - **Environment**: Production, Preview, Development (hammasini tanlang)
   - "Save" ni bosing

5. **Redeploy qiling:**
   - Deployments → "..." → "Redeploy"

### 4️⃣ Tekshirish

Redeploy'dan keyin Vercel logs'da quyidagilarni ko'rasiz:

✅ **To'g'ri:**
```
Database connection info: {
  hasUrl: true,
  protocol: 'postgresql:',
  hostname: 'db.abc123.supabase.co',
  port: '5432',
  username: 'postgres.abc123',
  hasPassword: true,
  usesDirectConnection: true
}
```

❌ **Noto'g'ri (authentication error):**
```
Authentication failed against database server
```

### 5️⃣ Parolni Tekshirish

Agar hali ham xatolik bo'lsa:

1. **Supabase Dashboard → Settings → Database**
2. **Database password** ni ko'ring yoki yangilang
3. **Yangi parolni oling**
4. **Maxsus belgilar bo'lsa, URL-encode qiling**
5. **Vercel'da `DATABASE_URL` ni yangilang**
6. **Redeploy qiling**

## Online URL Encoder

Parolni URL-encode qilish uchun:
- https://www.urlencoder.org/
- Yoki JavaScript: `encodeURIComponent('your-password')`

## Muhim Eslatmalar

- ✅ **Port 5432** bo'lishi kerak (Direct Connection)
- ✅ **Parol to'g'ri** bo'lishi kerak
- ✅ **Maxsus belgilar URL-encode qilingan** bo'lishi kerak
- ✅ **Username format**: `postgres.PROJECT-REF`
- ❌ **Port 6543** ishlatilmasligi kerak (Session Pooler - Vercel'da ishlamaydi)
- ❌ **Bo'sh joylar** bo'lmasligi kerak

## Qo'shimcha Yordam

Agar muammo hal bo'lmasa:
1. Vercel logs'ni to'liq ko'ring
2. `DATABASE_URL preview` ni tekshiring (parol ko'rinmaydi, lekin format ko'rinadi)
3. Supabase Dashboard'dan yangi connection string oling
4. Parolni yangilang va qayta urinib ko'ring
