import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user with password Mehmetcan21!
  const adminPassword = await bcrypt.hash('Mehmetcan21!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@biletorg.com' },
    update: { status: 'ACTIVE' },
    create: {
      email: 'admin@biletorg.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })

  // Create organizer user with password Mehmetcan21!
  const orgPassword = await bcrypt.hash('Mehmetcan21!', 12)
  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: { status: 'ACTIVE' },
    create: {
      email: 'organizer@example.com',
      name: 'Demo Organizer',
      password: orgPassword,
      role: 'ORGANIZER',
      status: 'ACTIVE',
      emailVerified: new Date(),
    },
  })

  // Create approved organizer profile
  const organizer = await prisma.organizer.upsert({
    where: { userId: organizerUser.id },
    update: {},
    create: {
      userId: organizerUser.id,
      companyName: 'Demo Event Company',
      organizationDisplayName: 'Demo Events',
      companyEmail: 'organizer@example.com',
      companyPhone: '+90 555 123 4567',
      taxNumber: '1234567890',
      website: 'https://example.com',
      description: 'A demo organizer for testing',
      address: 'Demo Street 123',
      city: 'Istanbul',
      country: 'Turkey',
      postalCode: '34000',
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: admin.id,
    },
  })

  // Create a demo hall with seats
  const hall = await prisma.hall.upsert({
    where: { id: 'demo-hall-001' },
    update: {},
    create: {
      id: 'demo-hall-001',
      organizerId: organizer.id,
      name: 'Ana Salon',
      description: '500 kişilik ana etkinlik salonu',
      address: 'Demo Street 123, Istanbul',
      capacity: 500,
      stageWidth: 1000,
      stageHeight: 800,
    },
  })

  // Create seats for the hall if not exists
  const existingSeats = await prisma.seat.count({ where: { hallId: hall.id } })
  
  if (existingSeats === 0) {
    const seats = []
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    const seatsPerRow = 20
    
    let x = 50
    let y = 100
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      x = 50
      
      for (let j = 1; j <= seatsPerRow; j++) {
        const type = i < 2 ? 'VIP' : i < 4 ? 'PREMIUM' : 'NORMAL'
        
        seats.push({
          hallId: hall.id,
          row,
          number: j.toString(),
          x,
          y,
          type,
          width: 25,
          height: 25,
          shape: 'circle',
        })
        
        x += 35
      }
      
      y += 40
    }
    
    await prisma.seat.createMany({ data: seats })
  }

  // Create demo event
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 30)
  
  const event = await prisma.event.upsert({
    where: { slug: 'demo-concert-2024' },
    update: {},
    create: {
      organizerId: organizer.id,
      hallId: hall.id,
      title: 'Demo Konser 2024',
      slug: 'demo-concert-2024',
      description: 'Bu bir demo etkinliktir. Koltuk seçimi deneyebilirsiniz.',
      category: 'Müzik',
      startDate,
      endDate: new Date(startDate.getTime() + 3 * 60 * 60 * 1000),
      doorsOpen: new Date(startDate.getTime() - 60 * 60 * 1000),
      status: 'PUBLISHED',
      isPublished: true,
      publishedAt: new Date(),
    },
  })

  // Create ticket categories
  await prisma.ticketCategory.upsert({
    where: { id: 'vip-cat-001' },
    update: {},
    create: {
      id: 'vip-cat-001',
      eventId: event.id,
      name: 'VIP',
      description: 'Sahne yakını özel alan',
      price: 500.00,
      totalQuantity: 40,
      availableQuantity: 40,
      hasSeatSelection: true,
      seatType: 'VIP',
      color: '#fbbf24',
      salesStart: new Date(),
    },
  })

  await prisma.ticketCategory.upsert({
    where: { id: 'premium-cat-001' },
    update: {},
    create: {
      id: 'premium-cat-001',
      eventId: event.id,
      name: 'Premium',
      description: 'Orta alan, iyi görüş açısı',
      price: 350.00,
      totalQuantity: 80,
      availableQuantity: 80,
      hasSeatSelection: true,
      seatType: 'PREMIUM',
      color: '#3b82f6',
      salesStart: new Date(),
    },
  })

  await prisma.ticketCategory.upsert({
    where: { id: 'normal-cat-001' },
    update: {},
    create: {
      id: 'normal-cat-001',
      eventId: event.id,
      name: 'Normal',
      description: 'Standart oturma alanı',
      price: 200.00,
      totalQuantity: 380,
      availableQuantity: 380,
      hasSeatSelection: true,
      seatType: 'NORMAL',
      color: '#10b981',
      salesStart: new Date(),
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log('Admin: admin@biletorg.com / Mehmetcan21!')
  console.log('Organizer: organizer@example.com / Mehmetcan21!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
