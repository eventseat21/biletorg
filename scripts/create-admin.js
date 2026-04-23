const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@biletorg.com';
  const password = 'admin123';
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  try {
    // Delete existing admin if exists
    await prisma.user.deleteMany({
      where: { email }
    });
    
    // Create new admin
    const admin = await prisma.user.create({
      data: {
        email,
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    
    console.log('✅ Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', admin.role);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
