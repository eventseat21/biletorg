import { LOCALES } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n-server'

/** Satış yolundaki dil seçimi: JS olmadan çalışan üç düğmeli form. */
export default function LanguageSwitch({ next }: { next: string }) {
  const current = getLocale()
  return (
    <form action="/api/locale" method="post" className="flex items-center gap-1" aria-label="Dil / Sprache / Language">
      <input type="hidden" name="next" value={next} />
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="submit"
          name="lang"
          value={locale}
          aria-pressed={locale === current}
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
            locale === current ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {locale}
        </button>
      ))}
    </form>
  )
}
