import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

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