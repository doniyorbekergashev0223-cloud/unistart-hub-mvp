# x-user-id va x-user-role Headerlarini Tekshirish va Qo'shish

## Muammo

Loyiha yuborishda quyidagi xatolik:
```
Kirish talab qilinadi (x-user-id va x-user-role headerlari yo'q)
```

Bu xatolik API request'da authentication headerlar yo'qligini anglatadi.

## Tekshirish (Browser Console)

### 1️⃣ Browser Console'ni Ochish

1. **F12** yoki **Right Click → Inspect** ni bosing
2. **Console** tab'ni oching
3. **Network** tab'ni oching

### 2️⃣ Request'ni Tekshirish

1. **Loyiha yuborish** form'ni to'ldiring
2. **"Yuborish"** tugmasini bosing
3. **Network** tab'da `/api/projects` request'ni toping
4. **Request'ni bosing** → **Headers** bo'limiga o'ting

### 3️⃣ Headerlarni Ko'rish

**Request Headers** bo'limida quyidagilarni ko'rasiz:

✅ **To'g'ri (headerlar bor):**
```
x-user-id: clxxxxx...
x-user-role: user
```

❌ **Noto'g'ri (headerlar yo'q):**
```
(headerlar ko'rinmaydi)
```

## Yechim

### Variant 1: User localStorage'dan Yuklanmagan

Agar headerlar yo'q bo'lsa, ehtimol user localStorage'dan yuklanmagan.

**Tekshirish:**
1. Browser Console → **Application** tab
2. **Local Storage** → `http://localhost:3000` yoki deployed URL
3. `unistart_auth_user` key'ni toping
4. Agar yo'q bo'lsa, qayta login qiling

**Yechim:**
1. **Logout** qiling
2. **Login** qiling
3. **Loyiha yuborish** ni qayta urinib ko'ring

### Variant 2: AuthContext'da User Yo'q

Agar user AuthContext'da yo'q bo'lsa, headerlar qo'shilmaydi.

**Tekshirish (Browser Console):**
```javascript
// Console'da quyidagilarni yozing:
localStorage.getItem('unistart_auth_user')
```

Agar `null` yoki `undefined` bo'lsa, user localStorage'da yo'q.

**Yechim:**
1. **Login** qiling
2. Browser'ni **yangilang**
3. **Loyiha yuborish** ni qayta urinib ko'ring

### Variant 3: Code'da Headerlar Qo'shilmagan

Agar ProjectForm'da headerlar qo'shilmagan bo'lsa.

**Tekshirish:**
`app/components/ProjectForm.tsx` faylida quyidagi kod bo'lishi kerak:

```typescript
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'x-user-id': user.id,
    'x-user-role': user.role,
  },
  body: formDataToSend,
});
```

**Yechim:**
Agar bu kod yo'q bo'lsa, qo'shing.

## Qo'lda Tekshirish (Browser Console)

Browser Console'da quyidagi kod'ni yozing:

```javascript
// 1. User localStorage'dan olish
const userStr = localStorage.getItem('unistart_auth_user');
console.log('User from localStorage:', userStr);

// 2. Parse qilish
const user = JSON.parse(userStr);
console.log('User ID:', user?.id);
console.log('User Role:', user?.role);

// 3. Headerlar tayyorlash
const headers = {
  'x-user-id': user?.id,
  'x-user-role': user?.role,
};
console.log('Headers:', headers);
```

Agar `user` `null` yoki `undefined` bo'lsa, qayta login qiling.

## Qo'lda Test Qilish (Browser Console)

Agar headerlar to'g'ri bo'lsa, quyidagi kod bilan test qiling:

```javascript
// User ma'lumotlarini olish
const userStr = localStorage.getItem('unistart_auth_user');
const user = JSON.parse(userStr);

// Test request
fetch('/api/projects', {
  method: 'POST',
  headers: {
    'x-user-id': user.id,
    'x-user-role': user.role,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Test Project',
    description: 'Test description',
    contact: 'test@example.com',
  }),
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

## Muammo Hal Qilish

### 1. User localStorage'da Yo'q

**Sabab:** Login qilmagansiz yoki session o'chib ketgan.

**Yechim:**
1. **Logout** qiling
2. **Login** qiling
3. Browser'ni **yangilang**

### 2. Headerlar Qo'shilmagan

**Sabab:** ProjectForm'da headerlar qo'shilmagan.

**Yechim:**
`app/components/ProjectForm.tsx` faylida headerlar qo'shilganligini tekshiring.

### 3. User AuthContext'da Yo'q

**Sabab:** AuthContext user'ni yuklamagan.

**Yechim:**
1. Browser'ni **yangilang**
2. Agar ishlamasa, **logout/login** qiling

## Tekshirish Ro'yxati

- [ ] Browser Console → Network → `/api/projects` → Headers → `x-user-id` bor
- [ ] Browser Console → Network → `/api/projects` → Headers → `x-user-role` bor
- [ ] Browser Console → Application → Local Storage → `unistart_auth_user` bor
- [ ] Browser Console → Console → `localStorage.getItem('unistart_auth_user')` null emas

## Qo'shimcha Yordam

Agar hali ham muammo bo'lsa:

1. **Browser Console'ni oching** (F12)
2. **Network** tab'ni oching
3. **Loyiha yuborish** ni urinib ko'ring
4. **Request'ni bosing** → **Headers** bo'limini ko'ring
5. **Screenshot** yuboring yoki **Request Headers** ni ko'rsating

Bu ma'lumotlar muammoni aniqlashga yordam beradi.
