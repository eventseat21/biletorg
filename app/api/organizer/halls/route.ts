import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  console.log('Session in halls POST:', session)
  console.log('User:', session?.user)
  console.log('OrganizerId:', session?.user?.organizerId)
  
  if (!session?.user?.organizerId) {
    console.log('No organizerId in session')
    return NextResponse.json({ error: 'Unauthorized - No organizer ID' }, { status: 401 })
  }

  const data = await request.json()

  try {
    const hall = await prisma.hall.create({
      data: {
        organizerId: session.user.organizerId,
        name: data.name,
        description: data.description,
        address: data.address,
        stageWidth: data.stageWidth || 800,
        stageHeight: data.stageHeight || 600,
      }
    })

    return NextResponse.json(hall)
  } catch (error) {
    console.error('Error creating hall:', error)
    return NextResponse.json({ error: 'Failed to create hall' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const halls = await prisma.hall.findMany({
    where: { organizerId: session.user.organizerId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          seats: true
        }
      }
    }
  })

  return NextResponse.json(halls)
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { hallId } = await request.json()
    
    if (!hallId) {
      return NextResponse.json({ error: 'Hall ID required' }, { status: 400 })
    }

    // First delete all seats for this hall
    await prisma.seat.deleteMany({
      where: { hallId }
    })

    // Then delete the hall
    await prisma.hall.delete({
      where: { 
        id: hallId,
        organizerId: session.user.organizerId 
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting hall:', error)
    return NextResponse.json({ error: 'Failed to delete hall' }, { status: 500 })
  }
}
