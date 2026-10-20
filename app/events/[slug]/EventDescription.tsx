'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

const CLAMP = 'line-clamp-[10]'

export default function EventDescription({ text, locale }: { text: string; locale: Locale }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 600

  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="text-base font-bold text-gray-900">{t(locale, 'description')}</h2>
      <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700 ${long && !open ? CLAMP : ''}`}>{text}</p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {open ? t(locale, 'showLess') : t(locale, 'showMore')}
        </button>
      ) : null}
    </section>
  )
}
