'use client'

import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

export default function ShareButton({ title, locale }: { title: string; locale: Locale }) {
  const [url, setUrl] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => setUrl(window.location.href), [])

  const share = async () => {
    if (!url) return
    const navigatorWithShare = navigator as Navigator & { share?: (data: ShareData) => Promise<void> }
    if (navigatorWithShare.share) {
      try {
        await navigatorWithShare.share({ title, url })
        return
      } catch {
        // kullanıcı paylaşımdan vazgeçti, kopyalamaya düş
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    } catch {
      window.prompt(t(locale, 'pageLink'), url)
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      title={t(locale, 'shareEvent')}
      className="relative shrink-0 rounded-full border border-gray-300 p-2.5 text-gray-700 hover:bg-gray-50"
    >
      <Share2 size={18} />
      {done ? <span className="absolute -top-8 right-0 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white">{t(locale, 'linkCopied')}</span> : null}
    </button>
  )
}
