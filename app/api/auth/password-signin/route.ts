import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import {
  applySessionTokenCookies,
  authenticateWithPassword,
  createEncodedSessionToken,
  getAuthSecretForSession,
  SESSION_MAX_AGE_SEC,
} from '@/lib/auth'

export const runtime = 'nodejs'

function sameOriginOk(request: Request): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin) return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!sameOriginOk(request)) {
    return NextResponse.json({ error: 'İstek reddedildi' }, { status: 403 })
  }

  let body: { email?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 })
  }

  try {
    getAuthSecretForSession()
  } catch {
    return NextResponse.json(
      { error: 'Sunucu yapılandırması eksik (NEXTAUTH_SECRET)' },
      { status: 500 }
    )
  }

  try {
    const user = await authenticateWithPassword(body.email, body.password)
    if (!user) {
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı' },
        { status: 401 }
      )
    }

    const token = await createEncodedSessionToken(user)
    const res = NextResponse.json({
      ok: true,
      role: user.role,
      email: user.email,
    })

    applySessionTokenCookies(res, token, SESSION_MAX_AGE_SEC)

    return res
  } catch (e) {
    console.error('[password-signin]', e)

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      const dbUnreachable = ['P1001', 'P1017', 'P1000', 'P1012', 'P2024']
      if (dbUnreachable.includes(e.code)) {
        return NextResponse.json(
          {
            error:
              'Veritabanına ulaşılamıyor. Supabase kullanıyorsanız havuz bağlantısı kullanın: port 6543 ve adres sonuna ?pgbouncer=true ekleyin (DATABASE_URL).',
          },
          { status: 503 }
        )
      }
    }

    if (e instanceof Prisma.PrismaClientInitializationError) {
      console.error('[password-signin] Prisma init:', e.message, e.errorCode)
      return NextResponse.json(
        {
          error:
            'Veritabanı bağlantısı kurulamıyor. Vercel (veya hosting) ortam değişkenlerinde DATABASE_URL tanımlı olmalı. Supabase entegrasyonu yalnızca POSTGRES_PRISMA_URL veriyorsa, aynı adresi DATABASE_URL olarak da ekleyin. Supabase’te "Transaction pooler" (port 6543) URI kullanın; şifrede @ veya özel karakter varsa bağlantı dizesinde URL-encode edin. Proje ayarlarından değişkenleri kaydedip yeniden deploy edin.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error:
          'Giriş işlemi tamamlanamadı. Veritabanı veya sunucu kaynaklı olabilir.',
      },
      { status: 500 }
    )
  }
}
