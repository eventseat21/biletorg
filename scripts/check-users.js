require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('=== DATABASE BAĞLANTI TESTİ ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('');

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true, password: true }
    });
    
    console.log(`Toplam kullanıcı: ${users.length}\n`);
    
    users.forEach((u, i) => {
      console.log(`${i+1}. Email: ${u.email}`);
      console.log(`   Name: ${u.name}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Password: ${u.password ? 'VAR (' + u.password.substring(0, 20) + '...)' : 'YOK'}`);
      console.log('');
    });
  } catch (e) {
    console.error('HATA:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();