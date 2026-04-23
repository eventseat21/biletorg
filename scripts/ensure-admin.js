const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('Mehmetcan21!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@biletorg.com' },
    update: { password: passwordHash },
    create: {
      email: 'admin@biletorg.com',
      name: 'Admin',
      password: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user upserted:', user.email);
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
  })
  .finally(() => {
    prisma.$disconnect();
  });