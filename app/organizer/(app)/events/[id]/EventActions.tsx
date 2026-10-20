'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

type HallOption = { id: string; name: string; seats: number }

export default function EventActions({
  eventId,
  status,
  hallId,
  halls,
}: {
  eventId: string
  status: string
  hallId: string | null
  halls: HallOption[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [pickedHallId, setPickedHallId] = useState(hallId ?? '')

  const selectedHall = halls.find((hall) => hall.id === pickedHallId) ?? null
  const hasPlan = Boolean(selectedHall && selectedHall.seats > 0)

  const patch = async (body: Record<string, unknown>, successText: string) => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/organizer/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'İşlem başarısız')
      const synced = data.hallSynced
      const syncText = synced
        ? ` Bilet kategorileri salon planından geldi (${synced.created} yeni, ${synced.updated} güncel, ${synced.totalSellable} satılabilir koltuk).`
        : ''
      setMessage(successText + syncText)
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'İşlem başarısız')
    } finally {
      setBusy(false)
    }
  }

  const submit = () => patch({ hallId: pickedHallId || null, action: 'SUBMIT' }, 'Etkinlik onaya gönderildi.')

  const attachHall = () =>
    patch({ hallId: pickedHallId || null, action: 'SAVE' }, pickedHallId ? 'Salon bağlandı.' : 'Salon bağlantısı kaldırıldı.')

  return (
    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-amber-900">
          Salon
          <select
            className="input mt-1 block w-full min-w-56 bg-white"
            value={pickedHallId}
            onChange={(event) => setPickedHallId(event.target.value)}
            disabled={busy}
          >
            <option value="">Salon seçilmedi</option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id} disabled={hall.seats === 0}>
                {hall.name} · {hall.seats} koltuk
                {hall.seats === 0 ? ' (koltuk planı yok)' : ''}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={attachHall}
          disabled={busy || pickedHallId === (hallId ?? '')}
          className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Salonu bağla
        </button>
        {selectedHall ? (
          <Link
            href={`/organizer/halls/${selectedHall.id}/seatmap`}
            className="text-sm font-medium text-indigo-700 hover:text-indigo-900"
          >
            Koltuk planını aç
          </Link>
        ) : (
          <Link href="/organizer/halls/new" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
            Yeni salon oluştur
          </Link>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status === 'PUBLISHED' || status === 'APPROVED' ? (
          <span className="text-sm font-medium text-amber-900">
            Yayınlanmış etkinlik düzenlenebilir. Satılmış biletler ve onlara bağlı koltuklar korunur.
          </span>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={busy || !hasPlan || status === 'PENDING_APPROVAL'}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'PENDING_APPROVAL' ? 'Onay bekliyor' : busy ? 'Gönderiliyor…' : 'Değişiklikleri kaydet ve onaya gönder'}
          </button>
        )}
        {!hasPlan ? (
          <span className="text-xs text-amber-800">
            Onaya göndermek için koltuk planı olan bir salon seçin.
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-amber-800">
        Etkinlik bilgileri, tarih, fiyat ve yeni koltuklar güncellenebilir. Satılmış veya aktif bilete bağlı koltuklar
        silinemez ve sıra/numaraları değiştirilemez.
      </p>
      {message ? <p className="mt-2 text-xs text-amber-800">{message}</p> : null}
    </div>
  )
}
