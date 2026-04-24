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

  const data = await request.json()

  try {
    const hall = await prisma.hall.findFirst({
      where: { 
        id: params.id,
        organizerId: session.user.organizerId
      }
    })

    if (!hall) {
      return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
    }

    const seat = await prisma.seat.create({
      data: {
        hallId: params.id,
        row: data.row,
        number: data.number,
        x: data.x,
        y: data.y,
        type: data.type || 'NORMAL',
        width: data.width || 30,
        height: data.height || 30,
        shape: data.shape || 'circle',
      }
    })

    return NextResponse.json(seat)
  } catch (error) {
    console.error('Error creating seat:', error)
    return NextResponse.json({ error: 'Failed to create seat' }, { status: 500 })
  }
}
