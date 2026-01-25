# Database Connection Diagnostika Qo'llanmasi

## Muammo Aniqlash

Agar Supabase project ishlab turibdi, lekin connection xatoligi bo'lsa, quyidagi qadamlarni bajaring:

## 1️⃣ Connection String'ni Tekshirish

### Supabase Dashboard'dan To'g'ri Connection String Olish:

1. **Supabase Dashboard'ga kiring:**
   - https://supabase.com/dashboard
   - Projectingizni tanlang

2. **Settings → Database ga o'ting**

3. **Connection string ni oling:**
   - **Session mode** tanlang (Transaction yoki Direct emas!)
   - Connection string ni nusxalang
   - Format quyidagicha bo'lishi kerak:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
     ```

4. **Muhim nuqtalar:**
   - ✅ Port **6543** bo'lishi kerak (Session Pooler)
   - ✅ `pgbouncer=true` parametri bo'lishi kerak
   - ✅ Username `postgres.[PROJECT-REF]` formatida
   - ✅ Host `aws-1-ap-south-1.pooler.supabase.com` yoki `aws-0-[region].pooler.supabase.com`

## 2️⃣ .env Faylini Tekshirish

`.env` faylida quyidagilarni tekshiring:

```env
DATABASE_URL="postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Tekshirish ro'yxati:**
- [ ] Port 6543 (Session Pooler)
- [ ] `pgbouncer=true` parametri mavjud
- [ ] Username `postgres.[PROJECT-REF]` formatida
- [ ] Parol to'g'ri
- [ ] Bo'sh joylar yo'q
- [ ] Qo'shtirnoqlar to'g'ri

## 3️⃣ Diagnostika Script'ni Ishlatish

Terminal'da quyidagi buyruqlarni bajaring:

```bash
# 1. dotenv paketini o'rnatish (agar yo'q bo'lsa)
npm install dotenv

# 2. Diagnostika script'ni ishga tushirish
node test-db-connection.js
```

Bu script quyidagilarni tekshiradi:
- ✅ DATABASE_URL mavjudligi
- ✅ Connection string format
- ✅ Port va parametrlar
- ✅ Database connection
- ✅ Jadval mavjudligi

## 4️⃣ Umumiy Muammolar va Yechimlar

### Muammo 1: Port 5432 ishlatilmoqda
**Xatolik:** `Can't reach database server at ...:5432`
**Yechim:** Port'ni 6543 ga o'zgartiring va `pgbouncer=true` qo'shing

### Muammo 2: Username noto'g'ri
**Xatolik:** `Authentication failed`
**Yechim:** Username `postgres.[PROJECT-REF]` formatida bo'lishi kerak

### Muammo 3: Parol noto'g'ri
**Xatolik:** `password authentication failed`
**Yechim:** 
- Supabase Dashboard → Settings → Database → Database password
- Yangi parol o'rnating yoki eski parolni tekshiring
- Agar parolda maxsus belgilar bo'lsa, URL-encode qiling

### Muammo 4: Project Paused
**Xatolik:** Connection timeout
**Yechim:** Supabase Dashboard → Project Settings → Resume project

### Muammo 5: Network/Firewall
**Xatolik:** Connection timeout
**Yechim:**
- Internet aloqasini tekshiring
- VPN o'chirib ko'ring
- Firewall database port'larini bloklamayotganini tekshiring

## 5️⃣ Terminal'dan Tekshirish

Development server'ni ishga tushirganda terminal'da quyidagi xabarlarni ko'rasiz:

**Muvaffaqiyatli:**
```
Creating new Prisma client...
Database URL configured: postgresql://postgres.iabvbvsqnvrhllxbxsix...
Prisma client created successfully
Database connection established
```

**Xatolik:**
```
Can't reach database server at ...
Authentication failed for user ...
Connection timeout after 10 seconds
```

## 6️⃣ Supabase Dashboard'dan Tekshirish

1. **Project Status:**
   - Dashboard → Project Settings
   - Project **Active** holatda bo'lishi kerak

2. **Database Settings:**
   - Settings → Database
   - Connection string → **Session mode** tanlang
   - Connection pooling **Enabled** bo'lishi kerak

3. **Network Access:**
   - Settings → Database → Network Restrictions
   - IP whitelist bo'lsa, sizning IP'ingiz qo'shilgan bo'lishi kerak

## 7️⃣ Prisma Client'ni Regenerate Qilish

Connection string'ni o'zgartirgandan keyin:

```bash
npx prisma generate
npm run dev
```

## 8️⃣ Alternative: Direct Connection (Test Uchun)

Agar Session Pooler ishlamasa, vaqtincha Direct Connection ishlatishingiz mumkin:

```env
DATABASE_URL="postgresql://postgres.iabvbvsqnvrhllxbxsix:uNISTARThUB2026@db.iabvbvsqnvrhllxbxsix.supabase.co:5432/postgres"
```

**Eslatma:** Direct connection production uchun tavsiya etilmaydi.

## Yordam

Agar barcha qadamlarni bajardikdan keyin ham muammo davom etsa:

1. `node test-db-connection.js` natijasini yuboring
2. Terminal'dagi to'liq xatolik xabarini yuboring
3. Supabase Dashboard'dan connection string'ni qayta nusxalang va yuboring
