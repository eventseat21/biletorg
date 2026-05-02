import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hall = await prisma.hall.findFirst({
    where: { id: params.id, organizerId: session.user.organizerId },
  })

  if (!hall) {
    return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const seatIds: string[] = body.seatIds
    const updates: { type?: string } = body.updates || {}

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: 'seatIds required' }, { status: 400 })
    }

    if (!updates.type) {
      return NextResponse.json({ error: 'updates.type required' }, { status: 400 })
    }

    await prisma.$transaction(
      seatIds.map((id) =>
        prisma.seat.updateMany({
          where: { id, hallId: params.id },
          data: { type: updates.type },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('batch-update seats:', error)
    return NextResponse.json({ error: 'Batch update failed' }, { status: 500 })
  }
}
