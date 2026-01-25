# "Tenant or user not found" Xatolikni Hal Qilish

## Muammo

Vercel logs'da quyidagi xatolik ko'rinadi:

```
FATAL: Tenant or user not found
Error querying the database: FATAL: Tenant or user not found
```

Bu xatolik **Supabase'da username format noto'g'ri** bo'lganda yuzaga keladi.

## Sabab

Supabase'da username **`postgres.PROJECT-REF`** formatida bo'lishi kerak, lekin sizda ehtimol faqat **`postgres`** ishlatilmoqda.

## Yechim (Qadam-baqadam)

### 1️⃣ Supabase Dashboard'dan To'g'ri Connection String Olish

**MUHIM:** Connection string'ni **to'g'ridan-to'g'ri Supabase Dashboard'dan** oling!

1. **Supabase Dashboard'ga kiring:**
   - https://supabase.com/dashboard
   - Projectingizni tanlang

2. **Settings → Database ga o'ting**

3. **Connection string ni oling:**
   - **Connection pooling** bo'limida **Direct connection** tanlang (port 5432)
   - Yoki **Connection string** bo'limida **URI** formatini tanlang
   - Connection string ni **to'liq nusxalang**

4. **Format tekshiruvi:**
   - ✅ To'g'ri: `postgresql://postgres.abc123xyz:password@db.abc123xyz.supabase.co:5432/postgres`
   - ❌ Noto'g'ri: `postgresql://postgres:password@db.abc123xyz.supabase.co:5432/postgres`
   
   **Farqi:** Username `postgres.abc123xyz` bo'lishi kerak, `postgres` emas!

### 2️⃣ Username Formatini Tekshirish

Connection string'da username quyidagicha bo'lishi kerak:

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...
```

**Misol:**
- ✅ To'g'ri: `postgres.iabvbvsqnvrhllxbxsix`
- ❌ Noto'g'ri: `postgres`

**PROJECT-REF ni qayerdan topish:**
- Supabase Dashboard → Settings → General → Reference ID
- Yoki connection string'da hostname'dan: `db.abc123xyz.supabase.co` → `abc123xyz` bu PROJECT-REF

### 3️⃣ Vercel'da DATABASE_URL ni To'liq O'zgartirish

**MUHIM:** Eski `DATABASE_URL` ni o'chirib, yangisini qo'shing!

1. **Vercel Dashboard'ga kiring:**
   - https://vercel.com/dashboard
   - Projectingizni tanlang

2. **Settings → Environment Variables ga o'ting**

3. **Mavjud `DATABASE_URL` ni O'CHIRING:**
   - `DATABASE_URL` ni toping
   - "..." (three dots) → "Delete" ni bosing
   - Tasdiqlang

4. **Yangi `DATABASE_URL` qo'shing:**
   - "Add New" ni bosing
   - **Key**: `DATABASE_URL`
   - **Value**: Supabase Dashboard'dan olgan to'liq connection string
   - **Format tekshiruvi:**
     - Username `postgres.xxx` formatida bo'lishi kerak
     - Port `5432` bo'lishi kerak
     - Hostname `db.xxx.supabase.co` yoki `aws-x-xxx.pooler.supabase.com` bo'lishi kerak
   - **Environment**: Production, Preview, Development (hammasini tanlang)
   - "Save" ni bosing

5. **Redeploy qiling:**
   - Deployments → "..." → "Redeploy"

### 4️⃣ Parolda Maxsus Belgilar Bo'lsa

Agar parolingizda maxsus belgilar bo'lsa, ularni URL-encode qiling:

| Belgilar | URL-Encoded |
|----------|-------------|
| `@`      | `%40`       |
| `#`      | `%23`       |
| `$`      | `%24`       |
| `%`      | `%25`       |
| `&`      | `%26`       |
| `+`      | `%2B`       |
| `=`      | `%3D`       |

**Misol:**
- Parol: `MyP@ss#2024`
- URL-Encoded: `MyP%40ss%232024`
- To'liq URL: `postgresql://postgres.abc123:MyP%40ss%232024@db.abc123.supabase.co:5432/postgres`

### 5️⃣ Tekshirish

Redeploy'dan keyin Vercel logs'da quyidagilarni ko'rasiz:

✅ **To'g'ri:**
```
Database connection info: {
  username: 'postgres.abc123xyz',
  usernameFormatCorrect: true,
  isSupabase: true,
  ...
}
```

❌ **Noto'g'ri (xatolik davom etadi):**
```
FATAL: Tenant or user not found
```

Yoki:
```
Database connection info: {
  username: 'postgres',
  usernameFormatCorrect: false,
  isSupabase: true,
  ...
}
```

### 6️⃣ Debug Endpoint

Agar muammo davom etsa, debug endpoint'ni oching:

```
https://your-app.vercel.app/api/debug/database
```

Bu endpoint `DATABASE_URL` ni tekshiradi va username formatini ko'rsatadi.

## Muhim Eslatmalar

- ✅ **Username `postgres.PROJECT-REF` formatida** bo'lishi kerak
- ✅ **Connection string'ni Supabase Dashboard'dan to'g'ridan-to'g'ri** oling
- ✅ **Eski `DATABASE_URL` ni o'chirib, yangisini qo'shing**
- ✅ **Port 5432** bo'lishi kerak (Direct Connection)
- ❌ **Faqat `postgres` ishlatilmasligi kerak** (bu "Tenant or user not found" xatoligiga olib keladi)
- ❌ **Connection string'ni qo'lda yozmaslik** (Supabase Dashboard'dan nusxalash kerak)

## Qo'shimcha Yordam

Agar muammo hal bo'lmasa:

1. **Supabase Dashboard → Settings → Database**
   - Connection string'ni qayta ko'ring
   - **Direct connection** tanlang
   - To'liq connection string'ni nusxalang

2. **Vercel → Settings → Environment Variables**
   - `DATABASE_URL` ni o'chiring
   - Yangi `DATABASE_URL` qo'shing (Supabase'dan olgan to'liq string)
   - Redeploy qiling

3. **Vercel logs'ni to'liq ko'ring**
   - `Database connection info` ni tekshiring
   - `username` maydoni `postgres.xxx` formatida bo'lishi kerak

4. **Debug endpoint'ni oching:**
   - `/api/debug/database` endpoint'ni oching
   - `usernameFormatCorrect: false` bo'lsa, username noto'g'ri

## Tez Yechim

Agar hamma narsa noto'g'ri bo'lsa:

1. Supabase Dashboard → Settings → Database → **Direct connection** → Connection string'ni nusxalang
2. Vercel → Settings → Environment Variables → `DATABASE_URL` ni o'chiring
3. Yangi `DATABASE_URL` qo'shing (nusxalangan string)
4. Redeploy qiling

Bu muammoni hal qilishi kerak!
