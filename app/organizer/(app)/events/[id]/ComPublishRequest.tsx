'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Globe } from 'lucide-react'

interface ComPublishRequestProps {
  eventId: string
  requested: boolean
  publishedToCom: boolean
  comUrl?: string | null
}

export default function ComPublishRequest({
  eventId,
  requested,
  publishedToCom,
  comUrl,
}: ComPublishRequestProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(requested)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const toggle = async (next: boolean) => {
    setBusy(true)
    setMessage('')
    setChecked(next)
    try {
      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishComRequested: next }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'İşlem başarısız')
      setMessage(next ? 'Talebiniz kaydedildi, yayın kararını Kurdevents verir.' : 'Talebiniz geri alındı.')
      router.refresh()
    } catch (error) {
      setChecked(!next)
      setMessage(error instanceof Error ? error.message : 'İşlem başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <Globe size={17} className="text-indigo-600" />
        kurdevents.com yayını
      </h2>
      {publishedToCom ? (
        <>
          <p className="mt-1 text-sm text-green-700">Bu etkinlik kurdevents.com üzerinde yayında.</p>
          {comUrl ? (
            <a
              href={comUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Satış sayfasını aç
            </a>
          ) : null}
        </>
      ) : (
        <>
          <label className="mt-2 flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={checked}
              disabled={busy}
              onChange={(event) => toggle(event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              Etkinliğim kurdevents.com üzerinde de yayınlansın
              <span className="mt-0.5 block text-xs text-gray-500">
                Yayınlanıp yayınlanmayacağına Kurdevents admini karar verir; kurdevents.org üzerindeki sayfanız bundan etkilenmez.
              </span>
            </span>
          </label>
          {checked && !publishedToCom ? (
            <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
              Talep alındı — onaylandığında etkinlik kurdevents.com&apos;a aktarılır.
            </p>
          ) : null}
          {message ? <p className="mt-2 text-xs text-gray-600">{message}</p> : null}
        </>
      )}
    </div>
  )
}
