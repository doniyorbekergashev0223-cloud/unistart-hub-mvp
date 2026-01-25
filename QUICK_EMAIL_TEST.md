# Tezkor Email Test - Qadam-baqadam

## Muammo: 404 Xatolik

Rasmda ko'rsatilgan xatolik: `POST https://vercel.com/api/test-email 404`

**Sabab:** Noto'g'ri URL yoki endpoint deploy qilinmagan.

## Yechim: To'g'ridan-to'g'ri "Parolni Unutdingizmi" Funksiyasini Ishlatish

Test endpoint o'rniga, **to'g'ridan-to'g'ri "Parolni unutdingizmi" funksiyasini ishlating** - bu allaqachon deploy qilingan va ishlaydi.

## Qadam-baqadam:

### 1. Platformaga Kiring
```
https://unistart-hub-mvp.vercel.app
```

### 2. "Parolni Unutdingizmi" Sahifasiga O'ting
- **"Kirish"** sahifasiga o'ting
- **"Parolni unutdingizmi?"** havolasini bosing
- Yoki to'g'ridan-to'g'ri: `https://unistart-hub-mvp.vercel.app/auth/forgot-password`

### 3. Email Kiriting va Yuborish
- Email manzilingizni kiriting (ro'yxatdan o'tgan email)
- **"Tasdiqlash kodi yuborish"** tugmasini bosing

### 4. Vercel Logs'ni Ochish (MUHIM!)
1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **"unistart-hub-mvp"** loyihasini tanlang
3. **"Logs"** tab'ini bosing
4. **"Live"** tugmasini bosing (real-time logs)

### 5. Logs'da Qidirish

**5-10 soniya kutib turing**, keyin logs'da quyidagilarni qidiring:

#### Muvaffaqiyatli Holat:
```
POST /api/auth/forgot-password 200
SMTP configuration loaded: { host: 'smtp.gmail.com', port: 587, ... }
Attempting to verify SMTP connection...
✅ SMTP connection verified successfully
Attempting to send email...
✅ Password reset code sent to [email]
```

#### Xatolik Holati:
```
POST /api/auth/forgot-password 200
SMTP configuration loaded: { host: 'smtp.gmail.com', port: 587, ... }
Attempting to verify SMTP connection...
❌ Failed to send password reset email: { code: 'EAUTH', ... }
🔐 Authentication failed. Check:
  1. SMTP_USER is correct email address
  2. SMTP_PASS is Gmail App Password (not regular password)
  3. 2-Step Verification is enabled on Gmail account
```

### 6. Logs'ni Kattalashtirish

1. Logs'da `POST /api/auth/forgot-password` qatorini toping
2. Qatorni **bosing** (kattalashtirish uchun)
3. **"Messages"** ustunida batafsil xabarlarni ko'rasiz

## Agar Test Endpoint Kerak Bo'lsa

Agar test endpoint'ni ishlatmoqchi bo'lsangiz, **to'g'ri URL** ishlating:

### Browser Console'da:
```javascript
fetch('https://unistart-hub-mvp.vercel.app/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'sizning-email@gmail.com' })
})
.then(r => r.json())
.then(d => console.log('Natija:', d))
.catch(err => console.error('Xatolik:', err))
```

**MUHIM:** URL `https://unistart-hub-mvp.vercel.app` bo'lishi kerak, `https://vercel.com` emas!

## Eng Oson Usul

1. ✅ Platformaga kiring
2. ✅ "Parolni unutdingizmi" sahifasiga o'ting
3. ✅ Email kiriting va yuborish tugmasini bosing
4. ✅ Vercel Logs'ni oching (Live mode)
5. ✅ Logs'da xatolikni qidiring

Bu usul **100% ishlaydi**, chunki endpoint allaqachon deploy qilingan!
