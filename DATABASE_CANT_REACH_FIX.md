# Bazaga ulanib bo‘lmayapti (Can't reach database server)

## Xato

```
Can't reach database server at `aws-1-ap-south-1.pooler.supabase.com:5432`
```

Bu xato **kompyuter yoki server Supabase hostiga ulana olmayapti** degani.

---

## ⚠️ Loyiha faol (yashil) lekin baribir ulanilmayapti

Agar Supabase’da **Project Status** yashil ko‘rinsa ham xato davom etsa, **pooler** hostiga (`aws-1-ap-south-1.pooler.supabase.com`) sizning tarmoq/firewall ulanishni bloklayapti. **Direct** hostga o‘tish kerak.

### Qadam 1: Loyiha ID (Project ref) ni olish

1. [Supabase Dashboard](https://supabase.com/dashboard) → loyihangizni oching.
2. **Settings** (chap pastda) → **General**.
3. **Reference ID** yoki **Project ID** ni nusxalang (masalan: `iabvbvsqnvrhllxbxsix` — harf-raqamlar).

### Qadam 2: Direct connection string olish

1. **Settings** → **Database**.
2. **Connection string** bo‘limiga tushing.
3. **"Direct connection"** yoki **"URI"** tanlang (Session pooler emas).
4. **Host** qatorda **`db.XXXXXXXX.supabase.co`** ko‘rinadigan variantni tanlang (XXXXXXXX — Qadam 1 dagi ID).
5. **"Copy"** yoki **"Use connection string"** orqali to‘liq stringni nusxalang. Format shunga o‘xshash bo‘ladi:
   ```
   postgresql://postgres.[LOYIHA_ID]:[PAROL]@db.[LOYIHA_ID].supabase.co:5432/postgres
   ```
6. Parolni o‘zingiz bilasiz; agar Supabase parolni yashirib ko‘rsatsa, **Database** → **Database password** bo‘limida parolni yangilab olishingiz yoki eslab qolgan parolingizni ishlatishingiz mumkin.

### Qadam 3: .env ni yangilash

1. Loyiha papkasida **`.env`** faylini oching.
2. **`DATABASE_URL`** qatorini toping.
3. Eski qiymatni **to‘liq o‘chiring** va Qadam 2 da nusxalagan **Direct** stringni qo‘ying (host **`db....supabase.co`** bo‘lishi kerak, **pooler.supabase.com** emas).
4. Parolda `@`, `#`, `%` kabi belgilar bo‘lsa, ularni URL-encode qiling: `@` → `%40`, `#` → `%23`, `%` → `%25`.
5. Faylni saqlang.

### Qadam 4: Serverni qayta ishga tushirish

1. Terminalda ishlayotgan `npm run dev` ni to‘xtating (Ctrl+C).
2. Qayta ishga tushiring: `npm run dev`.
3. Brauzerda register/login ni qayta sinab ko‘ring.

Agar baribir "Can't reach" chiqsa, **Qadam 5** ga o‘ting (boshqa tarmoq).

### Qadam 5: Boshqa tarmoqdan sinash

Ba’zi uy/ofis provayderlari 5432 portini bloklaydi. Tekshirish:

- Telefoningizdan **Wi‑Fi hotspot** yoqing va kompyuteringizni shu orqali internetga ulang.
- Loyihani qayta `npm run dev` qilib, register’ni sinab ko‘ring.

Agar hotspot orqali ishlasa, muammo **asl tarmoq/firewall** da; Direct host bilan ham o‘sha tarmoqda blok bo‘lishi mumkin. Bunda VPN (masalan, Cloudflare WARP) yoki boshqa tarmoqdan ishlatish kerak.

---

## 1. Supabase loyihasi pauza qilingan bo‘lishi mumkin

**Bepul** loyihalar 1 hafta ishlatilmasa **avtomatik pauza**ga o‘tadi.

1. [Supabase Dashboard](https://supabase.com/dashboard) → loyihangizni tanlang.
2. Agar **“Project paused”** yoki **“Restore project”** ko‘rinsa — **Restore project** tugmasini bosing.
3. Bir necha daqiqa kuting, keyin loyihani qayta ishga tushiring (`npm run dev` yoki deploy).

---

## 2. Pooler o‘rniga Direct host ishlatish

Ba’zi tarmoq yoki kompyuterlardan **pooler** hostiga ulanish ishlamaydi. **Direct connection** hostini sinab ko‘ring.

1. Supabase Dashboard → **Settings** → **Database**.
2. **Connection string** bo‘limida **“Direct connection”** (yoki **“URI”**) tanlang.
3. **Host** qatorida ikki variant bo‘ladi:
   - **Transaction pooler:** `aws-1-ap-south-1.pooler.supabase.com:5432`
   - **Direct (recommended):** `db.XXXXXXXX.supabase.co:5432` (XXXXXXXX — loyiha ID)

**.env** faylida `DATABASE_URL` ni **Direct** host bilan yozing:

```
postgresql://postgres.XXXXXXXX:PAROLINGIZ@db.XXXXXXXX.supabase.co:5432/postgres
```

- `XXXXXXXX` o‘rniga Supabase loyiha ID (Settings → General da ko‘rinadi).
- `PAROLINGIZ` — Database parolingiz (maxsus belgilar bo‘lsa URL-encode qiling, masalan `@` → `%40`).

Saqlang va serverni qayta ishga tushiring.

---

## 3. Tarmoq va firewall

- **Antivirus / firewall** 5432 portini bloklamayotganiga ishonch hosil qiling.
- **VPN** ishlatayotgan bo‘lsangiz, bir marta o‘chirib sinab ko‘ring.
- **Uy yoki ofis tarmog‘i** 5432 portini chetga chiqishga ruxsat beradimi tekshiring (ba’zi provayderlar bloklaydi).

---

## 4. Tezkor tekshirish

Terminalda (parol va loyiha ID ni o‘zingiznikiga almashtiring):

```bash
# Windows (PowerShell) — port ochiqligini tekshirish
Test-NetConnection -ComputerName db.XXXXXXXX.supabase.co -Port 5432
```

Agar **TcpTestSucceeded: True** bo‘lsa, tarmoq ulanishga imkon beradi; **False** bo‘lsa, hostga yoki portga yetib borilmayapti (firewall/VPN/provayder).

---

## Xulosa

1. Supabase loyihasi **pauza**da bo‘lmasin — **Restore project**.
2. **DATABASE_URL** da **Direct** host ishlatilsin: `db.XXXXXXXX.supabase.co:5432`.
3. Tarmoq/firewall/VPN 5432 portiga ruxsat bersin.

Shundan keyin **“Can't reach database server”** xatosi odatda yo‘qoladi.
