'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function EventActions({ eventId, status, hallId }: { eventId: string; status: string; hallId: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hallId, action: 'SUBMIT' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Gönderilemedi')
      setMessage('Etkinlik onaya gönderildi.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gönderilemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {status === 'PUBLISHED' || status === 'APPROVED' ? (
          <span className="text-sm font-medium text-amber-900">Yayınlanmış etkinlik düzenlenebilir. Satılmış biletler ve onlara bağlı koltuklar korunur.</span>
        ) : (
          <button type="button" onClick={submit} disabled={busy || !hallId || status === 'PENDING_APPROVAL'} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50">
            {status === 'PENDING_APPROVAL' ? 'Onay bekliyor' : busy ? 'Gönderiliyor…' : 'Değişiklikleri kaydet ve onaya gönder'}
          </button>
        )}
        {!hallId ? <span className="text-xs text-amber-800">Onaya göndermek için önce bir salon seçin.</span> : null}
      </div>
      <p className="mt-2 text-xs text-amber-800">Etkinlik bilgileri, tarih, fiyat ve yeni koltuklar güncellenebilir. Satılmış veya aktif bilete bağlı koltuklar silinemez ve sıra/numaraları değiştirilemez.</p>
      {message ? <p className="mt-2 text-xs text-amber-800">{message}</p> : null}
    </div>
  )
}
