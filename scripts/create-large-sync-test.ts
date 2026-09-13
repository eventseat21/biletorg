import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const organizerEmail = 'organizer@example.com'
const hallId = 'sync-large-test-hall-001'
const eventSlug = 'sync-test-buyuk-salon'

async function main() {
  const user = await prisma.user.findUnique({ where: { email: organizerEmail }, include: { organizer: true } })
  if (!user?.organizer) throw new Error('Önce organizer hesabını oluşturun.')
  const hall = await prisma.hall.upsert({
    where: { id: hallId },
    update: { name: 'Sync Büyük Test Salonu', capacity: 200 },
    create: { id: hallId, organizerId: user.organizer.id, name: 'Sync Büyük Test Salonu', description: 'Sync testi', capacity: 200, stageWidth: 1600, stageHeight: 1000 },
  })
  const seatCount = await prisma.seat.count({ where: { hallId } })
  if (seatCount === 0) {
    const seats = []
    for (let rowIndex = 0; rowIndex < 10; rowIndex += 1) {
      for (let number = 1; number <= 20; number += 1) {
        seats.push({ hallId, row: String.fromCharCode(65 + rowIndex), number: String(number), x: 80 + (number - 1) * 55, y: 100 + rowIndex * 60, type: rowIndex < 2 ? 'VIP' : rowIndex < 5 ? 'PREMIUM' : 'NORMAL', status: 'available', width: 30, height: 30, shape: 'circle' })
      }
    }
    await prisma.seat.createMany({ data: seats })
  }
  const startDate = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
  startDate.setHours(20, 0, 0, 0)
  const event = await prisma.event.upsert({
    where: { slug: eventSlug },
    update: { hallId, status: 'PENDING_APPROVAL', isPublished: false, startDate, salesSyncStatus: null, salesSyncError: null },
    create: { organizerId: user.organizer.id, hallId, title: 'Sync Test Büyük Salon', slug: eventSlug, description: '200 koltuklu aktarım testi.', category: 'konser', startDate, status: 'PENDING_APPROVAL', isPublished: false },
  })
  await prisma.ticketCategory.deleteMany({ where: { eventId: event.id } })
  await prisma.ticketCategory.createMany({ data: [
    { eventId: event.id, name: 'VIP', price: 40, totalQuantity: 40, availableQuantity: 40, hasSeatSelection: true, seatType: 'VIP' },
    { eventId: event.id, name: 'Premium', price: 25, totalQuantity: 60, availableQuantity: 60, hasSeatSelection: true, seatType: 'PREMIUM' },
    { eventId: event.id, name: 'Genel', price: 15, totalQuantity: 100, availableQuantity: 100, hasSeatSelection: true, seatType: 'NORMAL' },
  ] })
  console.log(JSON.stringify({ eventId: event.id, eventSlug, hallId, seats: 200, status: event.status }, null, 2))
}
main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
