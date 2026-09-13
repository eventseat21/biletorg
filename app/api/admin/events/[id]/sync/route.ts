import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { markEventSyncFailed, syncEventToKurdeventsCom } from '@/lib/kurdeventsComSync'

export const runtime = 'nodejs'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, commissionLocked: true },
  })
  if (!event) return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })

  if (!event.commissionLocked) {
    return NextResponse.json({ error: 'Önce komisyon anlaşmasını kilitleyip onaylayın' }, { status: 409 })
  }

  await prisma.event.update({
    where: { id: event.id },
    data: { salesSyncStatus: 'SYNCING', salesSyncError: null },
  })

  try {
    const sync = await syncEventToKurdeventsCom(event.id)
    return NextResponse.json({ ok: true, sync })
  } catch (error) {
    await markEventSyncFailed(event.id, error)
    return NextResponse.json(
      { error: 'Etkinlik satış platformuna aktarılamadı', details: error instanceof Error ? error.message : 'Bilinmeyen sync hatası' },
      { status: 502 },
    )
  }
}
