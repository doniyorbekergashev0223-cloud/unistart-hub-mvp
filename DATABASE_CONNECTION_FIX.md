# Database Connection Muammosini Hal Qilish

## Muammo
Database serverga ulanib bo'lmayapti: `Can't reach database server at 'aws-1-ap-south-1.pooler.supabase.com:6543'`

## Yechimlar (qadam-baqadam)

### 1️⃣ Supabase Dashboard'dan To'g'ri Connection String Olish

1. **Supabase Dashboard'ga kiring:**
   - https://supabase.com/dashboard
   - Projectingizni tanlang

2. **Settings → Database ga o'ting**

3. **Connection string ni oling:**
   - **Session mode** tanlang (Transaction yoki Direct emas!)
   - Connection string ni nusxalang
   - Format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`

4. **Parolni almashtiring:**
   - `[PASSWORD]` o'rniga real database parolingizni yozing
   - Agar parolda maxsus belgilar bo'lsa, URL-encode qiling:
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
     - `%` → `%25`
     - `&` → `%26`

### 2️⃣ .env Faylini To'g'rilash

`.env` faylida `DATABASE_URL` quyidagicha bo'lishi kerak:

```env
DATABASE_URL="postgresql://postgres.iabvbsqnvzhlxlbxsix:uNISTARThUB2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

**Muhim:**
- ✅ Port **6543** bo'lishi kerak (Session Pooler)
- ✅ `pgbouncer=true` parametri bo'lishi kerak
- ✅ Username `postgres.PROJECT-REF` formatida bo'lishi kerak
- ❌ Bo'sh joylar bo'lmasligi kerak
- ❌ Qo'shtirnoqlar ichida bo'lishi kerak

### 3️⃣ Prisma Client'ni Regenerate Qilish

```bash
npx prisma generate
```

### 4️⃣ Development Server'ni Qayta Ishga Tushirish

```bash
# Server'ni to'xtating (Ctrl+C)
npm run dev
```

### 5️⃣ Connection'ni Test Qilish

Terminal'da quyidagi xabarlarni ko'rasiz:
- ✅ `Creating new Prisma client...`
- ✅ `Prisma client created successfully`
- ✅ `Database connection established`

Agar xatolik bo'lsa:
- ❌ `Can't reach database server` - Connection muammosi
- ❌ `Authentication failed` - Parol noto'g'ri
- ❌ `Connection timeout` - Network muammosi

### 6️⃣ Alternative: Direct Connection (Test Uchun)

Agar Session Pooler ishlamasa, vaqtincha Direct Connection ishlatishingiz mumkin:

```env
DATABASE_URL="postgresql://postgres.iabvbsqnvzhlxlbxsix:uNISTARThUB2026@db.iabvbsqnvzhlxlbxsix.supabase.co:5432/postgres"
```

**Eslatma:** Direct connection production uchun tavsiya etilmaydi, faqat test uchun.

### 7️⃣ Supabase Project Status'ni Tekshirish

1. Supabase Dashboard → Project Settings
2. Project'ingiz **Active** holatda ekanligini tekshiring
3. Agar **Paused** bo'lsa, uni **Resume** qiling

### 8️⃣ Network va Firewall'ni Tekshirish

- Internet aloqasini tekshiring
- Firewall database port'larini bloklamayotganini tekshiring
- VPN ishlatayotgan bo'lsangiz, o'chirib ko'ring

## Tekshirish Ro'yxati

- [ ] Supabase Dashboard'dan to'g'ri connection string olindi
- [ ] `.env` faylida `DATABASE_URL` to'g'ri formatda
- [ ] Port 6543 (Session Pooler)
- [ ] Username `postgres.PROJECT-REF` formatida
- [ ] Parol to'g'ri va URL-encoded (agar kerak bo'lsa)
- [ ] `npx prisma generate` bajarildi
- [ ] Development server qayta ishga tushirildi
- [ ] Supabase project Active holatda
- [ ] Internet aloqasi mavjud

## Yordam

Agar barcha qadamlarni bajardikdan keyin ham muammo davom etsa:

1. Terminal'dagi to'liq xatolik xabarini yuboring
2. Supabase Dashboard'dan connection string'ni qayta nusxalang
3. `.env` faylini to'liq ko'rsating (parolni yashirib)
