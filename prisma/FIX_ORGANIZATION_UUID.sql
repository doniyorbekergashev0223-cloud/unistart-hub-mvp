-- Organization va User.organizationId: ikkala ustun ham UUID bo'lishi kerak (FK turi mos bo'lishi uchun).
-- Supabase SQL Editor da barchasini tanlab Run qiling.

-- 1) FK ni o'chirish (agar mavjud bo'lsa)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";

-- 2) Organization jadvalini o'chirib, UUID id bilan qayta yaratish (ichidagi ma'lumot o'chadi)
DROP TABLE IF EXISTS "Organization" CASCADE;
CREATE TABLE "Organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- 3) User.organizationId: eski ustunni o'chirib, UUID bilan qo'shish
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "User" ADD COLUMN "organizationId" UUID;

-- 4) Index va FK
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
