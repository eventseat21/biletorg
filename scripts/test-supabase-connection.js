const { PrismaClient } = require('@prisma/client');

console.log('=== SUPABASE BAĞLANTI TESTİ ===\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Var' : '❌ Yok');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? '✅ Var' : '❌ Yok');
console.log('');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('1. Bağlantı deneniyor...');
    await prisma.$connect();
    console.log('✅ Bağlantı başarılı!\n');
    
    console.log('2. Kullanıcılar sorgulanıyor...');
    const users = await prisma.user.findMany();
    console.log(`✅ ${users.length} kullanıcı bulundu:\n`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    
    console.log('\n3. Yeni kullanıcı ekleme testi...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test-connection@biletorg.com',
        name: 'Test Connection',
        password: 'test-hash',
        role: 'USER',
      }
    });
    console.log(`✅ Test kullanıcı eklendi: ${testUser.id}`);
    
    console.log('\n4. Test kullanıcı siliniyor...');
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test kullanıcı silindi');
    
    console.log('\n✅ TÜM TESTLER BAŞARILI!');
    
  } catch (error) {
    console.error('\n❌ HATA:', error.message);
    console.error('\nDetay:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
