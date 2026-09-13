import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const hall = await prisma.hall.findUnique({ where: { id: 'sync-large-test-hall-001' }, select: { id: true, name: true, capacity: true, _count: { select: { seats: true } } } })
  console.log(JSON.stringify(hall, null, 2))
}
main().finally(() => prisma.$disconnect())
