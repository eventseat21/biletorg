import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { admitTicket, scanTicket, type ScanScope } from '@/lib/checkin/scan'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Kapıda saniyede 2 okuma bile bu sınırın altındadır; amaç kod tahminini ve spam'i kesmek. */
const SCAN_LIMIT = 120
const SCAN_WINDOW_MS = 60 * 1000

type Guard = { error: string; status: number } | { session: Session; scope: ScanScope }

async function guard(): Promise<Guard> {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role
  if (!session?.user?.id || !role) return { error: 'Giriş yapın.', status: 401 }
  if (role === 'ADMIN') return { session, scope: { admin: true } }
  if (role !== 'CHECKER' || session.user.ticketCheckerStatus !== 'APPROVED') {
    return { error: 'Bu ekran yalnızca onaylı kontrolörler içindir.', status: 403 }
  }

  const checker = await prisma.ticketChecker.findUnique({
    where: { userId: session.user.id },
    select: { organizerId: true },
  })
  if (!checker?.organizerId) {
    return { error: 'Hesabınız henüz bir organizatöre atanmadı, yönetici atamasından sonra okutabilirsiniz.', status: 403 }
  }
  return { session, scope: { organizerId: checker.organizerId } }
}

export async function POST(request: Request) {
  const auth = await guard()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const limit = rateLimit(`scan:${auth.session.user.id}`, SCAN_LIMIT, SCAN_WINDOW_MS)
  if (!limit.ok) {
    return tooManyRequests(limit.retryAfterSec, 'Çok hızlı okuma. Birkaç saniye bekleyin.')
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'İstek okunamadı.' }, { status: 400 })
  }

  const ticketId = typeof body.ticketId === 'string' ? body.ticketId : ''
  if (ticketId) {
    const result = await admitTicket(ticketId, auth.scope)
    if (result.forbidden) {
      return NextResponse.json({ error: 'Bu bilet sizin organizasyonunuza ait değil.' }, { status: 403 })
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 409 })
  }

  const outcome = await scanTicket(typeof body.code === 'string' ? body.code : '', auth.scope)
  if (outcome.state === 'ok' || outcome.state === 'used') {
    return NextResponse.json({ ...outcome, admitted: outcome.ticket.checkedInAt != null })
  }
  return NextResponse.json(outcome, { status: outcome.state === 'notfound' ? 404 : 400 })
}
