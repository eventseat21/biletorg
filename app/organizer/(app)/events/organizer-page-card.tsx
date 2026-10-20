'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Share2 } from 'lucide-react'

interface OrganizerPageCardProps {
  organizerId: string
  organizerName: string
}

export function OrganizerPageCard({ organizerId, organizerName }: OrganizerPageCardProps) {
  const [copied, setCopied] = useState(false)
  const [absoluteUrl, setAbsoluteUrl] = useState<string | null>(null)

  const path = `/a/${organizerId}`

  // Origin yalnız tarayıcıda bilinir; sunucu çıktısıyla eşleşmesi için efektte doldurulur.
  useEffect(() => {
    setAbsoluteUrl(`${window.location.origin}${path}`)
  }, [path])

  const handleCopy = async () => {
    const value = absoluteUrl ?? path
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Panoya erişim yoksa (güvensiz origin) klasik execCommand ile kopyala.
      const input = document.createElement('textarea')
      input.value = value
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <Share2 size={18} className="text-indigo-600" />
          Organizatör sayfam
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {organizerName} sayfası — tüm etkinlikler tek bağlantıda, yenileri otomatik eklenir.
        </p>
        <p className="mt-2 truncate font-mono text-sm text-gray-700">{absoluteUrl ?? path}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <ExternalLink size={16} />
          Görüntüle
        </a>
      </div>
    </div>
  )
}
