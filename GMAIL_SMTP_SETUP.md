# Gmail SMTP Sozlash - Parolni Tiklash Uchun

## Muammo

Agar "Parolni unutdingizmi" funksiyasi ishlamayotgan bo'lsa, ehtimol Gmail SMTP sozlamalari noto'g'ri.

## Gmail SMTP Sozlash

### 1. Gmail App Password Yaratish

Gmail oddiy parol bilan ishlamaydi. **App Password** kerak:

1. **Google Account** ga kiring: https://myaccount.google.com/
2. **Security** bo'limiga o'ting
3. **2-Step Verification** yoqilgan bo'lishi kerak (agar yo'q bo'lsa, avval yoqing)
4. **App passwords** ga o'ting:
   - Agar ko'rinmasa: https://myaccount.google.com/apppasswords
5. **Select app**: "Mail" ni tanlang
6. **Select device**: "Other (Custom name)" ni tanlang va "UniStart Hub" deb nomlang
7. **Generate** tugmasini bosing
8. **16 ta belgidan iborat parol** ko'rsatiladi (masalan: `abcd efgh ijkl mnop`)

### 2. Vercel'da Environment Variables

Vercel Dashboard > Project Settings > Environment Variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=doniyorbekergashev0223@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  (App Password - bo'shliqlarsiz yoki bo'shliqlar bilan)
```

**MUHIM:**
- `SMTP_PASS` da **App Password** bo'lishi kerak (oddiy Gmail parol emas!)
- App Password'da bo'shliqlar bo'lsa, ularni olib tashlang yoki qoldiring (ikkalasi ham ishlaydi)
- `SMTP_PORT=587` (TLS uchun) yoki `465` (SSL uchun)

### 3. Tekshirish

1. Vercel Dashboard > Project > **Runtime Logs** ga o'ting
2. "Parolni unutdingizmi" sahifasida email kiriting
3. Logs'da quyidagilarni qidiring:
   - ✅ `SMTP connection verified successfully` - muvaffaqiyatli
   - ❌ `Failed to send password reset email` - xatolik

### 4. Xatoliklar va Yechimlar

#### Xatolik: "Invalid login"
- **Sabab**: App Password emas, oddiy parol ishlatilgan
- **Yechim**: App Password yarating va `SMTP_PASS` ga qo'ying

#### Xatolik: "Less secure app access"
- **Sabab**: 2-Step Verification yo'q
- **Yechim**: 2-Step Verification ni yoqing, keyin App Password yarating

#### Xatolik: "Connection timeout"
- **Sabab**: Firewall yoki network muammosi
- **Yechim**: Vercel'da `SMTP_PORT=465` (SSL) ni sinab ko'ring

#### Email yuborilmayapti, lekin xatolik yo'q
- **Sabab**: Email spam qutisiga tushgan bo'lishi mumkin
- **Yechim**: Spam qutisini tekshiring

### 5. Alternative: SendGrid yoki Mailgun

Agar Gmail ishlamasa, professional email service ishlatish mumkin:

#### SendGrid:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=[SendGrid API Key]
```

#### Mailgun:
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=[Mailgun SMTP Username]
SMTP_PASS=[Mailgun SMTP Password]
```

## Tekshirish Kodi

Vercel Runtime Logs'da quyidagi kodlarni qidiring:

```bash
# Muvaffaqiyatli:
"SMTP connection verified successfully"
"Password reset code sent to [email]"

# Xatolik:
"Failed to send password reset email"
"SMTP configuration incomplete"
"Invalid login"
```

## Qo'shimcha Ma'lumot

- Gmail App Password: https://support.google.com/accounts/answer/185833
- Vercel Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
