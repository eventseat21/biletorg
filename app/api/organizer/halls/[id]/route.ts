import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hall = await prisma.hall.findFirst({
    where: { 
      id: params.id,
      organizerId: session.user.organizerId
    },
    include: {
      seats: {
        orderBy: [{ row: 'asc' }, { number: 'asc' }],
        include: {
          tickets: {
            where: { status: { notIn: ['CANCELLED', 'REFUNDED'] } },
            select: { id: true },
            take: 1,
          },
        },
      },
    }
  })

  if (!hall) {
    return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...hall,
    seats: hall.seats.map(({ tickets, ...seat }) => ({ ...seat, locked: tickets.length > 0 })),
  })
}
