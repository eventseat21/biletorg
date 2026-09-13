import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      status: true,
      salesVenueId: true,
      salesPlanId: true,
      salesEventId: true,
      salesSyncedAt: true,
      salesSyncStatus: true,
      salesSyncError: true,
    },
  })

  if (!event) return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })
  return NextResponse.json({ event })
}
