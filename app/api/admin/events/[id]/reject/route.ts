import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  let body: { reason?: string } = {}
  try { body = await request.json() } catch { /* reason optional */ }
  const event = await prisma.event.updateMany({
    where: { id: params.id, status: 'PENDING_APPROVAL' },
    data: { status: 'REJECTED', isPublished: false, rejectionReason: body.reason?.trim() || 'Admin tarafından reddedildi' },
  })
  if (event.count === 0) return NextResponse.json({ error: 'Etkinlik bulunamadı veya onay beklemiyor' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
