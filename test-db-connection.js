// Database connection test script
// Run: node test-db-connection.js

require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔍 Database Connection Test\n');
  console.log('='.repeat(50));
  
  // 1. Check DATABASE_URL exists
  console.log('\n1️⃣ DATABASE_URL tekshiruvi:');
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL mavjud emas!');
    return;
  }
  console.log('✅ DATABASE_URL mavjud');
  
  // 2. Show DATABASE_URL (masked)
  const url = process.env.DATABASE_URL;
  const masked = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`📋 Connection string: ${masked.substring(0, 80)}...`);
  
  // 3. Parse connection string
  console.log('\n2️⃣ Connection string tahlili:');
  try {
    const urlObj = new URL(url);
    console.log(`   Host: ${urlObj.hostname}`);
    console.log(`   Port: ${urlObj.port}`);
    console.log(`   Database: ${urlObj.pathname.slice(1)}`);
    console.log(`   Username: ${urlObj.username}`);
    console.log(`   Has password: ${urlObj.password ? '✅' : '❌'}`);
    
    // Check if it's Session Pooler
    if (urlObj.port === '6543' && url.includes('pgbouncer=true')) {
      console.log('   ✅ Session Pooler (to\'g\'ri)');
    } else if (urlObj.port === '5432') {
      console.log('   ⚠️  Direct Connection (Session Pooler tavsiya etiladi)');
    } else {
      console.log('   ⚠️  Port noto\'g\'ri bo\'lishi mumkin');
    }
  } catch (e) {
    console.error('❌ Connection string format noto\'g\'ri:', e.message);
    return;
  }
  
  // 4. Test Prisma connection
  console.log('\n3️⃣ Prisma connection testi:');
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    console.log('   Connecting...');
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000)
      )
    ]);
    console.log('   ✅ Database\'ga muvaffaqiyatli ulandi!');
    
    // 5. Test query
    console.log('\n4️⃣ Database query testi:');
    const userCount = await prisma.user.count();
    console.log(`   ✅ User jadvali mavjud: ${userCount} ta foydalanuvchi`);
    
    const projectCount = await prisma.project.count();
    console.log(`   ✅ Project jadvali mavjud: ${projectCount} ta loyiha`);
    
    console.log('\n✅ Barcha testlar muvaffaqiyatli!');
    
  } catch (error) {
    console.error('\n❌ Connection xatoligi:');
    console.error(`   Xatolik turi: ${error.constructor.name}`);
    console.error(`   Xatolik xabari: ${error.message}`);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('\n💡 Yechimlar:');
      console.error('   1. Supabase Dashboard → Settings → Database');
      console.error('   2. Connection string → Session mode tanlang');
      console.error('   3. Port 6543 bo\'lishi kerak (Session Pooler)');
      console.error('   4. pgbouncer=true parametri bo\'lishi kerak');
    } else if (error.message.includes('Authentication failed') || error.message.includes('password')) {
      console.error('\n💡 Yechimlar:');
      console.error('   1. Parol to\'g\'ri ekanligini tekshiring');
      console.error('   2. Agar parolda maxsus belgilar bo\'lsa, URL-encode qiling');
      console.error('   3. Supabase Dashboard\'dan yangi parol o\'rnating');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 Yechimlar:');
      console.error('   1. Internet aloqasini tekshiring');
      console.error('   2. Firewall/VPN o\'chirib ko\'ring');
      console.error('   3. Supabase project Active holatda ekanligini tekshiring');
    }
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('\n' + '='.repeat(50));
}

testConnection().catch(console.error);
