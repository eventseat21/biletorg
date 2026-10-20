import { NextResponse } from 'next/server'
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n'

function safeTarget(next: string, base: string): string {
  if (!next.startsWith('/') || next.startsWith('//')) return new URL('/', base).toString()
  return new URL(next, base).toString()
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const locale = normalizeLocale(form?.get('lang'))
  const target = safeTarget(String(form?.get('next') ?? '/'), request.url)

  const response = NextResponse.redirect(target, 303)
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
  })
  return response
}
