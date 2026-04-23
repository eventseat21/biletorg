const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  const email = 'mcantoprak@gmail.com';
  const password = 'Mehmetcan21!';
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  try {
    // Delete if exists
    await prisma.user.deleteMany({
      where: { email }
    });
    
    // Create user as ORGANIZER
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Mehmet Can',
        password: hashedPassword,
        role: 'ORGANIZER',
      },
    });
    
    // Create organizer profile
    await prisma.organizer.create({
      data: {
        userId: user.id,
        companyName: 'Can Organizasyon',
        companyEmail: email,
        status: 'APPROVED',
      },
    });
    
    console.log('✅ User created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', user.role);
    console.log('ID:', user.id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
