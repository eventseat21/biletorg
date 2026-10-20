import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const data = await request.json()
  const name = typeof data?.name === 'string' ? data.name.trim() : ''

  if (!name) {
    return NextResponse.json({ error: 'Salon adı zorunludur' }, { status: 400 })
  }

  try {
    const hall = await prisma.hall.create({
      data: {
        organizerId: session.user.organizerId,
        name,
        description: typeof data.description === 'string' && data.description.trim() ? data.description.trim() : null,
        address: typeof data.address === 'string' && data.address.trim() ? data.address.trim() : null,
        stageWidth: Number(data.stageWidth) || 800,
        stageHeight: Number(data.stageHeight) || 600,
      }
    })

    return NextResponse.json(hall)
  } catch (error) {
    console.error('Error creating hall:', error)
    return NextResponse.json({ error: 'Salon oluşturulamadı' }, { status: 500 })
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
    select: {
      id: true,
      name: true,
      capacity: true,
      source: true,
      createdAt: true,
      _count: { select: { seats: true } },
    },
  })

  return NextResponse.json({ halls })
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

    const hall = await prisma.hall.findFirst({
      where: { id: hallId, organizerId: session.user.organizerId },
      select: { id: true, name: true },
    })

    if (!hall) {
      return NextResponse.json({ error: 'Salon bulunamadı' }, { status: 404 })
    }

    const linkedEvents = await prisma.event.count({ where: { hallId: hall.id } })
    if (linkedEvents > 0) {
      return NextResponse.json(
        {
          error: `Bu salon ${linkedEvents} etkinliğinde kullanılıyor. Önce etkinliklerden kaldırın veya etkinliği silin.`,
        },
        { status: 409 }
      )
    }

    const soldSeats = await prisma.ticket.count({
      where: { seat: { hallId: hall.id }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    })
    if (soldSeats > 0) {
      return NextResponse.json(
        { error: `Bu salonun planında ${soldSeats} satılmış bilet var, salon silinemez.` },
        { status: 409 }
      )
    }

    await prisma.$transaction([
      prisma.seat.deleteMany({ where: { hallId: hall.id } }),
      prisma.hall.delete({ where: { id: hall.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting hall:', error)
    return NextResponse.json({ error: 'Failed to delete hall' }, { status: 500 })
  }
}
