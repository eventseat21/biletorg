import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const event = await prisma.event.findUnique({
    where: { slug: 'sync-test-kucuk-salon' },
    select: {
      id: true,
      title: true,
      status: true,
      salesSyncStatus: true,
      salesSyncError: true,
      salesVenueId: true,
      salesPlanId: true,
      salesEventId: true,
      salesSyncedAt: true,
      ticketCategories: {
        select: { name: true, price: true, totalQuantity: true, availableQuantity: true },
        orderBy: { name: 'asc' },
      },
    },
  })
  console.log(JSON.stringify(event, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
