const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@biletorg.com' } });
  if (user) {
    console.log('User found:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Has password:', !!user.password);
    if (user.password) {
      const match = await compare('Mehmetcan21!', user.password);
      console.log('Password matches:', match);
    }
  } else {
    console.log('User not found');
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
});