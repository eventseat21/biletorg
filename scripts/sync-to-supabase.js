const { PrismaClient } = require('@prisma/client');

// Supabase'e bağlan (DATABASE_URL zaten Supabase'i gösteriyor)
const prisma = new PrismaClient();

const users = [
  {
    id: 'cmo9t8luu0000xdw5qj06dk2r',
    email: 'admin@biletorg.com',
    name: 'Admin',
    password: '$2a$12$phK24U5qrGxKrBqn.2jfNOY8rfAUxCaAw7h6.cs0RdTCfhPbxUUvm',
    role: 'ADMIN',
  },
  {
    id: 'cmo9527an0001r0hz31ueftmv',
    email: 'organizer@example.com',
    name: 'Demo Organizer',
    password: '$2a$12$Hbv1jZbxvvKCtbpLbOh4e.FOdHxRXqr9mJwb/0j/oEASwd4PeW0r.',
    role: 'ORGANIZER',
  }
];

async function syncUsers() {
  console.log('Supabase\'e kullanıcılar senkronize ediliyor...\n');
  
  for (const user of users) {
    try {
      // Önce varsa sil
      await prisma.user.deleteMany({
        where: { email: user.email }
      });
      
      // Yeni oluştur
      const created = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role,
        }
      });
      
      console.log(`✅ ${user.email} eklendi`);
    } catch (error) {
      console.error(`❌ ${user.email} hata:`, error.message);
    }
  }
  
  // Kontrol
  console.log('\n--- Supabase\'deki kullanıcılar ---');
  const allUsers = await prisma.user.findMany();
  console.log(`Toplam ${allUsers.length} kullanıcı:\n`);
  allUsers.forEach(u => {
    console.log(`  - ${u.email} (${u.role})`);
  });
  
  await prisma.$disconnect();
}

syncUsers();
