'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewOrganizerEventPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startDate, description }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız')
        return
      }
      router.push(`/organizer/events/${data.event.id}`)
      router.refresh()
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/organizer/events"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Etkinliklere dön
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Yeni Etkinlik</h1>
      <p className="text-gray-600 text-sm mb-8">
        Taslak olarak oluşturulur; bilet fiyatı ve stok &quot;Genel&quot; kategorisinde
        sonradan düzenlenebilir.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 card p-6">
        <div>
          <label className="label">Etkinlik adı</label>
          <input
            className="input w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>
        <div>
          <label className="label">Başlangıç tarihi</label>
          <input
            type="datetime-local"
            className="input w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Açıklama (isteğe bağlı)</label>
          <textarea
            className="input w-full min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full py-2 rounded-lg" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Oluştur'}
        </button>
      </form>
    </div>
  )
}
