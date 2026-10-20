import { cookies } from 'next/headers'
import { LOCALE_COOKIE, normalizeLocale, type Locale } from '@/lib/i18n'

/** Sunucu bileşeni: alıcının seçtiği dil. Çerez yoksa Türkçe. Client bileşenleri bu modülü import etmez. */
export function getLocale(): Locale {
  return normalizeLocale(cookies().get(LOCALE_COOKIE)?.value)
}
