# Register xatosi: "The column `new` does not exist"

Bu xato odatda **User** jadvali ustidagi **trigger** yoki **RLS (Row Level Security) policy** noto‘g‘ri yozilganda chiqadi: qayerdadir `new` ustuni sifatida ishlatilgan (aslida bunday ustun yo‘q).

## Qanday tuzatish

### 1. Supabase Dashboard’da tekshirish

1. [Supabase Dashboard](https://supabase.com/dashboard) → loyihangizni tanlang.
2. **Database** → **Tables** → **User** jadvalini oching.
3. **Triggers** va **RLS** bo‘limlarini tekshiring.

### 2. Trigger bo‘lsa

- **Database** → **Triggers** — `User` jadvaliga bog‘liq trigger bormi, tekshiring.
- Agar trigger ichida `new` (kichik harf) yoki noto‘g‘ri ustun nomi ishlatilgan bo‘lsa, trigger funksiyasini to‘g‘rilang.
- Triggerda yangi qatorga murojaat **NEW** (katta harf) orqali bo‘ladi, masalan: `NEW.id`, `NEW.email`. Kichik `new` ustun sifatida qidiriladi va xato beradi.

### 3. RLS policy bo‘lsa

- **Database** → **Tables** → **User** → **Policies** (yoki **RLS**).
- INSERT / UPDATE uchun policy’da `new` (kichik harf) ishlatilmasin.
- INSERT policy’da odatda jadval ustunlari to‘g‘ridan-to‘g‘ri ishlatiladi (masalan `id`, `email`), `new.id` emas.

### 4. SQL orqali tekshirish

Supabase **SQL Editor**’da quyidagini ishga tushiring:

```sql
-- User jadvalidagi triggerlar
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'User';

-- User jadvalidagi RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'User';
```

Natijada `User` jadvaliga bog‘liq trigger yoki policy ko‘rinsa, ularning matnida `new` (kichik harf) yoki noto‘g‘ri ustun bor-yo‘qligini tekshiring.

### 5. RLS o‘chirish (faqat sinov uchun)

Agar **User** jadvalida RLS yoqilgan bo‘lsa va siz hali policy’larni to‘g‘rilamagan bo‘lsangiz, vaqtincha RLS’ni o‘chirib register’ni sinab ko‘rishingiz mumkin (keyin policy’larni to‘g‘ri yozib, RLS’ni qayta yoqing):

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
```

**Eslatma:** Ishlab chiqishdan keyin xavfsizlik uchun RLS’ni qayta yoqib, to‘g‘ri policy’lar yozishingiz kerak.

---

Xato tuzatilgach, register qayta ishlashi kerak.
