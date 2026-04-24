import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(halls)
}
