import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type SeatPayload = {
  id?: string
  row: string
  number: string
  x: number
  y: number
  width: number
  height: number
  type: string
  shape: string
  rotation?: number
  svgId?: string | null
}

export async function POST(
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
    const seats: SeatPayload[] = body.seats || []
    const deletedSeatIds: string[] = body.deletedSeatIds || []

    await prisma.$transaction(async (tx) => {
      if (deletedSeatIds.length > 0) {
        await tx.seat.deleteMany({
          where: { hallId: params.id, id: { in: deletedSeatIds } },
        })
      }

      for (const s of seats) {
        const rotation = Math.round(s.rotation ?? 0)
        const width = Math.max(8, Math.round(s.width || 24))
        const height = Math.max(8, Math.round(s.height || 24))
        const row = String(s.row || 'R')
        const number = String(s.number || '1')

        const isNew = !s.id || s.id.startsWith('new-')

        if (!isNew) {
          const existing = await tx.seat.findFirst({
            where: { id: s.id!, hallId: params.id },
          })
          if (!existing) continue
          await tx.seat.update({
            where: { id: s.id! },
            data: {
              row,
              number,
              x: Math.round(s.x),
              y: Math.round(s.y),
              width,
              height,
              type: s.type || 'NORMAL',
              shape: s.shape === 'rect' ? 'rect' : 'circle',
              rotation,
              svgId: s.svgId ?? undefined,
            },
          })
        } else {
          let num = number
          const clash = await tx.seat.findFirst({
            where: { hallId: params.id, row, number: num },
          })
          if (clash) {
            num = `${num}-${Math.floor(Math.random() * 9000 + 1000)}`
          }
          await tx.seat.create({
            data: {
              hallId: params.id,
              row,
              number: num,
              x: Math.round(s.x),
              y: Math.round(s.y),
              width,
              height,
              type: s.type || 'NORMAL',
              shape: s.shape === 'rect' ? 'rect' : 'circle',
              rotation,
              svgId: s.svgId ?? undefined,
            },
          })
        }
      }

      const count = await tx.seat.count({ where: { hallId: params.id } })
      await tx.hall.update({
        where: { id: params.id },
        data: { capacity: count },
      })
    })

    const updated = await prisma.hall.findUnique({
      where: { id: params.id },
      include: { seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('layout-sync:', error)
    return NextResponse.json(
      { error: 'Senkronizasyon başarısız', details: error instanceof Error ? error.message : '' },
      { status: 500 }
    )
  }
}
