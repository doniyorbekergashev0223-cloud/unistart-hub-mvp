# Supabase Connection Pool Muammosi - Yechim

## Muammo

Vercel Logs'da quyidagi xatolik:
```
FATAL: MaxClientsInSessionMode: max clients reached - in Session mode max clients are limited to pool_size
```

**Sabab:** `DATABASE_URL` Session Pooler (port 6543) ishlatilmoqda, lekin Direct Connection (port 5432) kerak.

## Yechim: Direct Connection Ishlatish

### 1. Vercel'da DATABASE_URL'ni To'g'rilash

**Vercel Dashboard** > **Settings** > **Environment Variables**:

#### ❌ NOTO'G'RI (Session Pooler):
```
postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### ✅ TO'G'RI (Direct Connection):
```
postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

**YOKI (agar Supabase to'g'ridan-to'g'ri hostname ishlatsa):**
```
postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@db.iabvbvsqnvrhllxbxsix.supabase.co:5432/postgres
```

### 2. MUHIM Farqlar

| Xususiyat | Session Pooler (6543) | Direct Connection (5432) |
|-----------|----------------------|-------------------------|
| Port | 6543 | 5432 |
| `pgbouncer=true` | Ha | Yo'q |
| Max connections | Cheklangan (pool_size) | Ko'proq |
| Serverless uchun | ❌ Yaxshi emas | ✅ Yaxshi |
| Vercel uchun | ❌ Muammo | ✅ Tavsiya etiladi |

### 3. Supabase'dan To'g'ri Connection String Olish

1. **Supabase Dashboard** ga kiring
2. **Settings** > **Database** ga o'ting
3. **Connection string** bo'limiga o'ting
4. **"Direct connection"** ni tanlang (Session pooler emas!)
5. **"URI"** formatini ko'chiring
6. Port **5432** ekanligini tekshiring

### 4. Vercel'da Yangilash

1. Vercel Dashboard > Settings > Environment Variables
2. `DATABASE_URL` ni toping
3. **Edit** tugmasini bosing
4. **To'g'ri formatni kiriting** (port 5432, `pgbouncer=true` yo'q)
5. **Save** tugmasini bosing
6. **Redeploy** qiling

### 5. Tekshirish

Redeploy qilgandan keyin Vercel Logs'da:
- ✅ `DATABASE_URL preview` port 5432 ko'rsatishi kerak
- ✅ `max clients reached` xatolik bo'lmasligi kerak
- ✅ Login/Register ishlashi kerak

## Qo'shimcha Yaxshilanish

Kodga connection pool management qo'shildi:
- Connection'lar to'g'ri yopiladi
- Process exit'da cleanup qilinadi
- Serverless muhit uchun optimallashtirildi

## Qisqa Yo'riqnoma

1. ✅ Supabase Dashboard > Settings > Database
2. ✅ "Direct connection" ni tanlang
3. ✅ Connection string'ni ko'chiring (port 5432)
4. ✅ Vercel'da `DATABASE_URL` ni yangilang
5. ✅ Redeploy qiling

Bu muammoni hal qiladi!
