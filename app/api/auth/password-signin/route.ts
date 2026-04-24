import { NextResponse } from 'next/server'
import {
  authenticateWithPassword,
  createEncodedSessionToken,
  getAuthSecretForSession,
  sessionCookieName,
  SESSION_MAX_AGE_SEC,
  useSecureAuthCookie,
} from '@/lib/auth'

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

    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: useSecureAuthCookie(),
      maxAge: SESSION_MAX_AGE_SEC,
    })

    return res
  } catch (e) {
    console.error('[password-signin]', e)
    return NextResponse.json(
      {
        error:
          'Giriş işlemi tamamlanamadı. Veritabanı veya sunucu kaynaklı olabilir.',
      },
      { status: 500 }
    )
  }
}
