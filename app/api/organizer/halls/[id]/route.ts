import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hall = await prisma.hall.findFirst({
    where: { 
      id: params.id,
      organizerId: session.user.organizerId
    },
    include: { seats: { orderBy: [{ row: 'asc' }, { number: 'asc' }] } }
  })

  if (!hall) {
    return NextResponse.json({ error: 'Hall not found' }, { status: 404 })
  }

  return NextResponse.json(hall)
}
