import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getKurdeventsComSupabase,
  isKurdeventsComConfigured,
} from '@/lib/kurdeventsComSupabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  if (!isKurdeventsComConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: 'kurdevents.com Supabase ortam değişkenleri tanımlı değil',
      },
      { status: 503 },
    )
  }

  try {
    const { error } = await getKurdeventsComSupabase()
      .from('events')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('[kurdevents-com] health check failed:', error.message)
      return NextResponse.json(
        { ok: false, configured: true, error: 'Satış veritabanına erişilemedi' },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, configured: true })
  } catch (error) {
    console.error(
      '[kurdevents-com] health check exception:',
      error instanceof Error ? error.message : 'unknown error',
    )
    return NextResponse.json(
      { ok: false, configured: true, error: 'Satış veritabanı bağlantısı kurulamadı' },
      { status: 502 },
    )
  }
}
