# Email Debug Yo'riqnomasi - Qadam-baqadam

## Muammo: "Parolni unutdingizmi" funksiyasi ishlamayapti

## 1. Vercel Runtime Logs'ni Qayerda Topish

1. **Vercel Dashboard** ga kiring: https://vercel.com/dashboard
2. **"unistart-hub-mvp"** loyihasini tanlang
3. Yuqoridagi **"Logs"** tab'ini bosing
4. **"Live"** tugmasini bosing (real-time logs uchun)

## 2. Test Endpoint Orqali Tekshirish

### Variant A: Browser Console Orqali

1. Platformangizga kiring: `https://unistart-hub-mvp.vercel.app`
2. Browser'da **F12** bosing (Developer Tools)
3. **Console** tab'iga o'ting
4. Quyidagi kodni kiriting:

```javascript
fetch('/api/test-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'sizning-email@example.com' // O'z emailingizni kiriting
  })
})
.then(res => res.json())
.then(data => console.log('Natija:', data))
.catch(err => console.error('Xatolik:', err))
```

5. **Enter** bosing
6. Vercel Logs'ga qayting va yangi loglar paydo bo'lishini kuting

### Variant B: Postman yoki curl Orqali

**Postman:**
- Method: `POST`
- URL: `https://unistart-hub-mvp.vercel.app/api/test-email`
- Headers: `Content-Type: application/json`
- Body (JSON):
```json
{
  "email": "sizning-email@example.com"
}
```

**curl (Terminal):**
```bash
curl -X POST https://unistart-hub-mvp.vercel.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"sizning-email@example.com"}'
```

## 3. "Parolni Unutdingizmi" Funksiyasini Ishlatish

1. Platformangizga kiring: `https://unistart-hub-mvp.vercel.app`
2. **"Kirish"** sahifasiga o'ting
3. **"Parolni unutdingizmi?"** havolasini bosing
4. Email manzilingizni kiriting
5. **"Tasdiqlash kodi yuborish"** tugmasini bosing
6. **Vercel Logs'ga qayting** va quyidagilarni qidiring:
   - `POST /api/auth/forgot-password` so'rovi
   - `SMTP configuration loaded`
   - `Attempting to verify SMTP connection...`
   - `✅ SMTP connection verified successfully` (muvaffaqiyatli)
   - `❌ Failed to send password reset email` (xatolik)

## 4. Logs'da Nimalarni Qidirish Kerak

### Muvaffaqiyatli Holat:
```
SMTP configuration loaded: { host: 'smtp.gmail.com', port: 587, ... }
Attempting to verify SMTP connection...
✅ SMTP connection verified successfully
Attempting to send email...
✅ Password reset code sent to [email]
```

### Xatolik Holatlari:

#### Xatolik 1: SMTP sozlanmagan
```
SMTP configuration incomplete. Email sending disabled.
```
**Yechim:** Vercel'da environment variables'ni tekshiring

#### Xatolik 2: Authentication failed (EAUTH)
```
❌ Failed to send password reset email: { code: 'EAUTH', ... }
🔐 Authentication failed. Check:
  1. SMTP_USER is correct email address
  2. SMTP_PASS is Gmail App Password (not regular password)
  3. 2-Step Verification is enabled on Gmail account
```
**Yechim:** Gmail App Password to'g'ri emas. Yangi App Password yarating.

#### Xatolik 3: Connection timeout
```
❌ Failed to send password reset email: { code: 'ETIMEDOUT', ... }
🌐 Connection failed. Check:
  1. SMTP_HOST is correct (smtp.gmail.com)
  2. SMTP_PORT is correct (587 for TLS or 465 for SSL)
```
**Yechim:** `SMTP_PORT=465` ni sinab ko'ring (SSL)

## 5. Vercel Logs'da "Messages" Ustunini Ko'rish

1. Vercel Logs'da har bir so'rov qatorini kattalashtiring (expand)
2. **"Messages"** ustunida console.log xabarlarini ko'rasiz
3. Agar "Messages" bo'sh bo'lsa, so'rovni kattalashtiring yoki boshqa vaqt oralig'ini tanlang

## 6. Qo'shimcha Tekshirish

### Environment Variables Tekshirish:

Test endpoint javobida quyidagilar ko'rinadi:
```json
{
  "ok": true,
  "data": {
    "emailSent": false,
    "envCheck": {
      "SMTP_HOST": true,
      "SMTP_PORT": true,
      "SMTP_USER": true,
      "SMTP_PASS": true,
      "APP_URL": true
    }
  }
}
```

Agar `envCheck` da `false` bo'lsa, o'sha variable Vercel'da sozlanmagan.

## 7. Tezkor Tekshirish

1. **Test endpoint'ni chaqiring** (yuqoridagi Variant A yoki B)
2. **Vercel Logs'ni oching** (Live mode)
3. **5-10 soniya kutib turing**
4. **Logs'da yangi so'rovni qidiring** (`POST /api/test-email`)
5. **So'rovni kattalashtiring** va "Messages" ustunini ko'ring
6. **Xatolikni ko'rsating** yoki muvaffaqiyatli bo'lsa, email qutisini tekshiring

## 8. Agar Hali Ham Ishlamasa

Vercel Logs'dan quyidagi ma'lumotlarni yuboring:
- Xatolik xabari (error message)
- Error code (masalan: EAUTH, ETIMEDOUT)
- SMTP configuration loaded xabari
- Boshqa console.log xabarlari

Bu ma'lumotlar bilan aniq sababni topamiz!
