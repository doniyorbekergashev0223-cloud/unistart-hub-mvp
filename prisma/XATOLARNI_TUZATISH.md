# Register route'dagi TypeScript xatolari — sababi va yechimi

## Nima sababdan xato chiqyapti?

`app/api/auth/register/route.ts` da uchta xato:

1. **`Property 'organization' does not exist`** — `tx.organization` ishlatilmoqda, lekin Prisma client tiplarida `organization` modeli yo‘q deb ko‘rsatiladi.
2. **`'organizationId' does not exist in UserCreateInput`** — `user.create` da `organizationId` berilmoqda, lekin generatsiya qilingan tiplarda bu maydon yo‘q.
3. **`'organizationId' does not exist in UserSelect`** — `select` da `organizationId` so‘ralmoqda, lekin tipda yo‘q.

**Asosiy sabab:** `prisma/schema.prisma` da **Organization** modeli va **User.organizationId** allaqachon bor, lekin **Prisma client** (TypeScript tiplari) eski schema asosida generatsiya qilingan. Ya’ni schema yangilangan, `npx prisma generate` esa muvaffaqiyatli ishlamagan yoki umuman ishlatilmagan.

## Qanday tuzatish kerak?

Terminalda (loyiha papkasida) bajarishingiz kerak:

```bash
npx prisma generate
```

Bu buyruq `schema.prisma` dan yangi Prisma client va tiplarni generatsiya qiladi. Shundan keyin:

- `prisma.organization` (yoki `tx.organization`) tipda mavjud bo‘ladi
- `UserCreateInput` va `UserSelect` da `organizationId` paydo bo‘ladi
- Register route’dagi barcha uchta TypeScript xatosi yo‘qoladi

## Eslatma

Agar `npx prisma generate` xato bersa (masalan, EPERM — fayl boshqa dastur tomonidan ishlatilmoqda):

- Cursor / VS Code va boshqa terminal oynalarini yopib, qayta urinib ko‘ring
- Yoki Cursor ni administrator emas, oddiy foydalanuvchi sifatida ishga tushiring

Schema o‘zgarishlarini bazaga qo‘llash uchun (migratsiya) avval `public.user_organizations` jadvalini Supabase da o‘chirishingiz kerak (batafsil: `prisma/FIX_P4002_USER_ORGANIZATIONS.md`), keyin:

```bash
npx prisma migrate dev --name add_organization_and_user_organization_id
```
