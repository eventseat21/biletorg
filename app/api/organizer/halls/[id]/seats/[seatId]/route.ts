import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; seatId: string } }
) {
  const session = await getServerSession()
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await request.json()

  try {
    // Verify hall belongs to organizer
    const hall = await prisma.hall.findFirst({
      where: { 
        id: params.id,
        organizerId: session.user.organizerId
      }
    })

    if (!hall) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
    }

    const seat = await prisma.seat.update({
      where: { id: params.seatId },
      data: {
        x: data.x,
        y: data.y,
      }
    })

    return NextResponse.json(seat)
  } catch (error) {
    console.error('Error updating seat:', error)
    return NextResponse.json({ error: 'Failed to update seat' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; seatId: string } }
) {
  const session = await getServerSession()
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify hall belongs to organizer
    const hall = await prisma.hall.findFirst({
      where: { 
        id: params.id,
        organizerId: session.user.organizerId
      }
    })

    if (!hall) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
    }

    await prisma.seat.delete({
      where: { id: params.seatId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting seat:', error)
    return NextResponse.json({ error: 'Failed to delete seat' }, { status: 500 })
  }
}
