import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Ro'yxatdan o'tishda tanlanadigan tashkilotlar (talaba: universitetlar, talaba emas: yoshlar agentligi) */
const REGISTRATION_ORGANIZATIONS = [
  { slug: 'sambhram', name: 'Sambhram Universiteti', logoUrl: '/sambhram.png' },
  { slug: 'kazan', name: 'Kazan Universiteti', logoUrl: '/kazan.png' },
  { slug: 'uzmu-jizzakh', name: "O'zbekiston Milliy Universiteti (Jizzax filiali)", logoUrl: '/uzmu-jizzakh.png' },
  { slug: 'jizzakh-pedagogical', name: 'Jizzax Pedagogika Universiteti', logoUrl: '/jizzakh-pedagogika.png' },
  { slug: 'jizzakh-polytechnic', name: 'Jizzax Politexnika Universiteti', logoUrl: '/jizzakh-politexnika.png' },
  { slug: 'youth-agency', name: 'Yoshlar ishlari agentligi', logoUrl: '/youth-agency.png' },
]

async function main() {
  console.log('Seeding database...')

  for (const org of REGISTRATION_ORGANIZATIONS) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      update: { name: org.name, logoUrl: org.logoUrl },
      create: { name: org.name, slug: org.slug, logoUrl: org.logoUrl },
    })
  }
  console.log('Upserted organizations:', REGISTRATION_ORGANIZATIONS.length)

  // Create initial invite codes
  // Admin invite code
  const adminInvite = await prisma.inviteCode.upsert({
    where: { code: 'ADMIN2024' },
    update: {},
    create: {
      code: 'ADMIN2024',
      role: 'admin',
    },
  })

  // Expert invite code
  const expertInvite = await prisma.inviteCode.upsert({
    where: { code: 'EXPERT2024' },
    update: {},
    create: {
      code: 'EXPERT2024',
      role: 'expert',
    },
  })

  console.log('Created invite codes:')
  console.log('- Admin invite:', adminInvite.code)
  console.log('- Expert invite:', expertInvite.code)

  console.log('\n🚀 Database seeded successfully!')
  console.log('\n📝 To create more invite codes, run:')
  console.log('npx prisma studio')
  console.log('Then add records to the InviteCode table with:')
  console.log('- code: unique string')
  console.log('- role: "admin" or "expert"')
  console.log('- used: false')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })