const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { organizer: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n========================================');
    console.log('         TÜM KULLANICILAR');
    console.log('========================================\n');
    
    users.forEach((user, index) => {
      console.log(`\n[${index + 1}] ${user.name}`);
      console.log('    ID:', user.id);
      console.log('    Email:', user.email);
      console.log('    Role:', user.role);
      console.log('    Password Hash:', user.password);
      console.log('    Created:', user.createdAt);
      console.log('    Updated:', user.updatedAt);
      if (user.organizer) {
        console.log('    Organizer:', user.organizer.companyName);
        console.log('    Status:', user.organizer.status);
      }
      console.log('    ----------------------------------------');
    });
    
    console.log(`\n\nToplam ${users.length} kullanıcı bulundu.\n`);
    
    // SQL formatında çıktı (Supabase için)
    console.log('\n========================================');
    console.log('    SUPABASE SQL SORGUSU');
    console.log('========================================\n');
    console.log('SELECT id, email, name, role, password, "createdAt" FROM "User";');
    console.log('\n-- VEYA email ile sorgula:\n');
    users.forEach(user => {
      console.log(`-- ${user.email}`);
      console.log(`SELECT * FROM "User" WHERE email = '${user.email}';`);
    });
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
