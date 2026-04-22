const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NEW_PASSWORD_HASH = '$2a$12$qpoyPEPoXmwG8vinhWIxi.ktovuGkI3dGdyTMvPnufO3CgxUWQqHC';

async function updatePasswords() {
  try {
    const result = await prisma.user.updateMany({
      data: { password: NEW_PASSWORD_HASH }
    });
    
    console.log(`✅ ${result.count} kullanıcının şifresi güncellendi.`);
    console.log(`Yeni şifre: Mehmetcan21!`);
  } catch (e) {
    console.error('HATA:', e);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();