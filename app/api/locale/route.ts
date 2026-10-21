import { NextResponse } from 'next/server'
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n'

// Göreli Location döner: proxy arkasında request.url sunucunun bind adresini
// (0.0.0.0:3000) taşıyabildiği için mutlak adres üretmiyoruz.
function safeTarget(next: string): string {
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null)
  const locale = normalizeLocale(form?.get('lang'))
  const target = safeTarget(String(form?.get('next') ?? '/'))

  const response = new NextResponse(null, { status: 303, headers: { Location: target } })
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    sameSite: 'lax',
  })
  return response
}
