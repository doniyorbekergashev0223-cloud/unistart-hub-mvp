# Vercel Environment Variable Fix - EBADNAME Xatolik

## Muammo

Vercel Logs'da quyidagi xatolik:
```
Error: queryA EBADNAME smtp.gmail.com
hostname: 'smtp.gmail.com\n'
```

**Sabab:** `SMTP_HOST` environment variable'da **newline character** (`\n`) bor.

## Yechim: Vercel'da Environment Variables'ni Tozalash

### Qadam-baqadam:

1. **Vercel Dashboard** ga kiring: https://vercel.com/dashboard

2. **"unistart-hub-mvp"** loyihasini tanlang

3. **Settings** > **Environment Variables** ga o'ting

4. **`SMTP_HOST`** ni toping va **Edit** tugmasini bosing

5. **Qiymatni tozalang:**
   - Eski qiymatni **to'liq o'chiring**
   - Yangi qiymatni **qo'lda kiriting**: `smtp.gmail.com`
   - **Copy-paste qilmasdan**, qo'lda yozing (bu newline'larni oldini oladi)

6. **Save** tugmasini bosing

7. **Boshqa environment variables'ni ham tekshiring:**
   - `SMTP_PORT` - faqat `587` yoki `465` bo'lishi kerak
   - `SMTP_USER` - faqat email bo'lishi kerak (newline bo'lmasligi kerak)
   - `SMTP_PASS` - faqat App Password bo'lishi kerak (newline bo'lmasligi kerak)

8. **Redeploy qiling:**
   - Vercel Dashboard > **Deployments** tab
   - Eng so'nggi deployment'ni toping
   - **"..."** (three dots) > **"Redeploy"** tugmasini bosing

## Tekshirish

Redeploy qilgandan keyin:

1. **"Parolni unutdingizmi"** sahifasiga o'ting
2. Email kiriting va yuborish tugmasini bosing
3. **Vercel Logs'ni oching** (Live mode)
4. Logs'da quyidagilarni qidiring:

### Muvaffaqiyatli:
```
SMTP configuration loaded: { host: 'smtp.gmail.com', ... }
✅ SMTP connection verified successfully
✅ Password reset code sent to [email]
```

### Hali ham xatolik bo'lsa:
```
❌ Failed to send password reset email: { code: 'EAUTH', ... }
```

Agar `EAUTH` xatolik bo'lsa, Gmail App Password noto'g'ri. Yangi App Password yarating.

## Qo'shimcha Yaxshilanish

Kodga avtomatik trim qo'shildi - endi newline'lar avtomatik olib tashlanadi. Lekin **Vercel'da tozalash** hali ham tavsiya etiladi.

## Qisqa Yo'riqnoma

1. ✅ Vercel Dashboard > Settings > Environment Variables
2. ✅ `SMTP_HOST` ni Edit qiling
3. ✅ Qiymatni **qo'lda yozib** tozalang: `smtp.gmail.com`
4. ✅ Save
5. ✅ Redeploy
6. ✅ Test qiling

Bu muammoni hal qiladi!
