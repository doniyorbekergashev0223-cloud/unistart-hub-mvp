# CORS Xatolikni Tuzatish - Aniq Yo'riqnoma

## Muammo

Rasmda ko'rsatilgan xatolik:
```
Access to fetch at 'https://unistart-hub-mvp.vercel.app/api/test-email' 
from origin 'https://vercel.com' has been blocked by CORS policy
```

**Sabab:** Browser console `vercel.com` dan ochilgan, lekin API endpoint boshqa domain'da.

## Yechim 1: Platformaning O'zida Console Ochish (ENG OSON)

### Qadam-baqadam:

1. **Platformangizga kiring:**
   ```
   https://unistart-hub-mvp.vercel.app
   ```

2. **F12 bosing** (Developer Tools)

3. **Console tab'iga o'ting**

4. **Quyidagi kodni kiriting:**
   ```javascript
   fetch('/api/test-email', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'sizning-email@gmail.com' })
   })
   .then(r => r.json())
   .then(d => console.log('Natija:', d))
   .catch(err => console.error('Xatolik:', err))
   ```

5. **Enter bosing**

**MUHIM:** URL `/api/test-email` bo'lishi kerak (to'liq URL emas), chunki siz platformaning o'zidasiz!

## Yechim 2: To'g'ridan-to'g'ri "Parolni Unutdingizmi" Funksiyasini Ishlatish (TAVSIYA ETILADI)

Bu eng oson va ishonchli usul:

### Qadam-baqadam:

1. **Platformaga kiring:**
   ```
   https://unistart-hub-mvp.vercel.app/auth/forgot-password
   ```

2. **Email kiriting** (ro'yxatdan o'tgan email)

3. **"Tasdiqlash kodi yuborish" tugmasini bosing**

4. **Vercel Logs'ni oching:**
   - Vercel Dashboard > unistart-hub-mvp > **Logs** tab
   - **"Live"** tugmasini bosing

5. **5-10 soniya kutib turing**

6. **Logs'da quyidagilarni qidiring:**
   - `POST /api/auth/forgot-password` so'rovini toping
   - Qatorni **kattalashtiring** (bosing)
   - **"Messages"** ustunida quyidagilarni ko'rasiz:
     - `SMTP configuration loaded`
     - `✅ SMTP connection verified successfully` (muvaffaqiyatli)
     - `❌ Failed to send password reset email` (xatolik bo'lsa)

## Yechim 3: Postman yoki curl Ishlatish

Agar browser console ishlamasa, Postman yoki curl ishlating:

### Postman:
- Method: `POST`
- URL: `https://unistart-hub-mvp.vercel.app/api/test-email`
- Headers: `Content-Type: application/json`
- Body (raw JSON):
  ```json
  {
    "email": "sizning-email@gmail.com"
  }
  ```

### curl (Terminal):
```bash
curl -X POST https://unistart-hub-mvp.vercel.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"sizning-email@gmail.com"}'
```

## Nima Qilish Kerak?

**TAVSIYA:** **Yechim 2** ni ishlating - bu eng oson va ishonchli:
1. ✅ Platformaga kiring
2. ✅ "Parolni unutdingizmi" sahifasiga o'ting
3. ✅ Email kiriting va yuborish tugmasini bosing
4. ✅ Vercel Logs'ni oching (Live mode)
5. ✅ Logs'da xatolikni qidiring

Bu usul **100% ishlaydi** va CORS muammosi bo'lmaydi!

## Logs'da Nimalarni Qidirish Kerak?

### Muvaffaqiyatli:
```
✅ SMTP connection verified successfully
✅ Password reset code sent to [email]
```

### Xatolik (EAUTH - Authentication failed):
```
❌ Failed to send password reset email: { code: 'EAUTH', ... }
🔐 Authentication failed. Check:
  1. SMTP_USER is correct email address
  2. SMTP_PASS is Gmail App Password (not regular password)
  3. 2-Step Verification is enabled on Gmail account
```

Agar `EAUTH` xatolik bo'lsa, Gmail App Password noto'g'ri. Yangi App Password yarating va Vercel'da yangilang.
