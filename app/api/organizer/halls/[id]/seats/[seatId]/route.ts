import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; seatId: string } }
) {
  const session = await getServerSession(authOptions)
  
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

    const patch: {
      x?: number
      y?: number
      width?: number
      height?: number
      rotation?: number
      type?: string
      shape?: string
      row?: string
      number?: string
    } = {}
    if (data.x !== undefined) patch.x = Math.round(Number(data.x))
    if (data.y !== undefined) patch.y = Math.round(Number(data.y))
    if (data.width !== undefined) patch.width = Math.max(8, Math.round(Number(data.width)))
    if (data.height !== undefined) patch.height = Math.max(8, Math.round(Number(data.height)))
    if (data.rotation !== undefined) patch.rotation = Math.round(Number(data.rotation))
    if (data.type !== undefined) patch.type = String(data.type)
    if (data.shape !== undefined) patch.shape = String(data.shape)
    if (data.row !== undefined) patch.row = String(data.row)
    if (data.number !== undefined) patch.number = String(data.number)

    if (Object.keys(patch).length === 0) {
      const seat = await prisma.seat.findFirst({
        where: { id: params.seatId, hallId: params.id },
      })
      if (!seat) {
        return NextResponse.json({ error: 'Seat not found' }, { status: 404 })
      }
      return NextResponse.json(seat)
    }

    const seat = await prisma.seat.update({
      where: { id: params.seatId },
      data: patch,
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
