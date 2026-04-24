import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify hall belongs to organizer
    const hall = await prisma.hall.findFirst({
      where: { 
        id: params.id,
        organizerId: session.user.organizerId
      },
      include: { seats: true }
    })

    if (!hall) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
    }

    // Update hall capacity based on seats
    await prisma.hall.update({
      where: { id: params.id },
      data: { 
        capacity: hall.seats.length,
        updatedAt: new Date()
      }
    })

    // Return complete hall data with seats
    const updatedHall = await prisma.hall.findUnique({
      where: { id: params.id },
      include: { 
        seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] }
      }
    })

    return NextResponse.json(updatedHall)
  } catch (error) {
    console.error('Error finalizing hall:', error)
    return NextResponse.json({ error: 'Failed to finalize hall' }, { status: 500 })
  }
}
