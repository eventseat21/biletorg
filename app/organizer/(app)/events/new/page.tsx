'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewOrganizerEventPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [titleDe, setTitleDe] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [titleKu, setTitleKu] = useState('')
  const [titleCkb, setTitleCkb] = useState('')
  const [startDate, setStartDate] = useState('')
  const [image, setImage] = useState('')
  const [category, setCategory] = useState('konser')
  const [startingPrice, setStartingPrice] = useState('')
  const [initialQuantity, setInitialQuantity] = useState('100')
  const [description, setDescription] = useState('')
  const [descriptionDe, setDescriptionDe] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionKu, setDescriptionKu] = useState('')
  const [descriptionCkb, setDescriptionCkb] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [halls, setHalls] = useState<{ id: string; name: string; capacity: number }[]>([])
  const [hallId, setHallId] = useState('')

  useEffect(() => {
    fetch('/api/organizer/halls')
      .then((response) => response.ok ? response.json() : { halls: [] })
      .then((data) => setHalls(Array.isArray(data.halls) ? data.halls : []))
      .catch(() => setHalls([]))
  }, [])

  const uploadImage = async (file: File) => {
    setUploading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/organizer/uploads/event-image', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Görsel yüklenemedi')
      setImage(data.url)
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Görsel yüklenemedi') } finally { setUploading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/organizer/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, titleTr: title, titleDe, titleEn, titleKu, titleCkb, startDate, description, descriptionTr: description, descriptionDe, descriptionEn, descriptionKu, descriptionCkb, image, category, startingPrice, initialQuantity, hallId: hallId || null }),
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
    <div className="w-full max-w-7xl">
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

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="card space-y-4 p-6">
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
            <label className="label">Türkçe açıklama</label>
            <textarea
              className="input min-h-[100px] w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        <div>
          <label className="label">Etkinlik görseli URL</label>
          <input className="input w-full" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://.../etkinlik-gorseli.jpg" />
          <input className="input mt-2 w-full" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file) }} />
          {image ? <img src={image} alt="Etkinlik önizleme" className="mt-3 h-40 w-full rounded-lg object-cover" /> : null}
        </div>
        <div>
          <label className="label">Kategori</label>
          <select className="input w-full" value={category} onChange={(e) => setCategory(e.target.value)}><option value="konser">Konser</option><option value="tiyatro">Tiyatro</option><option value="festival">Festival</option><option value="stand-up">Stand-up</option><option value="diger">Diğer</option></select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="label">Başlangıç fiyatı (€)<input className="input mt-1 w-full" type="number" min="0" step="0.01" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} required /></label>
          <label className="label">İlk bilet stoğu<input className="input mt-1 w-full" type="number" min="1" step="1" value={initialQuantity} onChange={(e) => setInitialQuantity(e.target.value)} required /></label>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h2 className="font-semibold text-blue-950">Çok dilli içerik</h2>
          <p className="mt-1 text-xs text-blue-800">Türkçe başlık ve açıklama zorunludur. Diğer diller boş bırakılırsa satış sitesinde Türkçe gösterilir.</p>
          <div className="mt-3 space-y-3">
            <label className="label">Deutsch başlık<input className="input mt-1 w-full" value={titleDe} onChange={(e) => setTitleDe(e.target.value)} /></label>
            <label className="label">English başlık<input className="input mt-1 w-full" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} /></label>
            <label className="label">Kurmancî başlık<input className="input mt-1 w-full" value={titleKu} onChange={(e) => setTitleKu(e.target.value)} /></label>
            <label className="label">سۆرانی başlık<input className="input mt-1 w-full" value={titleCkb} onChange={(e) => setTitleCkb(e.target.value)} /></label>
            <label className="label">Deutsch açıklama<textarea className="input mt-1 min-h-[80px] w-full" value={descriptionDe} onChange={(e) => setDescriptionDe(e.target.value)} /></label>
            <label className="label">English açıklama<textarea className="input mt-1 min-h-[80px] w-full" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} /></label>
            <label className="label">Kurmancî açıklama<textarea className="input mt-1 min-h-[80px] w-full" value={descriptionKu} onChange={(e) => setDescriptionKu(e.target.value)} /></label>
            <label className="label">سۆرانی açıklama<textarea className="input mt-1 min-h-[80px] w-full" value={descriptionCkb} onChange={(e) => setDescriptionCkb(e.target.value)} /></label>
          </div>
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
          <label className="label">Salon</label>
          <select className="input w-full" value={hallId} onChange={(e) => setHallId(e.target.value)}>
            <option value="">Salon seçin (sonradan da seçebilirsiniz)</option>
            {halls.map((hall) => <option key={hall.id} value={hall.id}>{hall.name} · {hall.capacity} koltuk</option>)}
          </select>
        </div>
        <button type="submit" className="btn-primary w-full rounded-lg py-2" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Oluştur'}
        </button>
        </div>
        <aside className="lg:sticky lg:top-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Etkinlik önizlemesi</h2>
            {image ? <img src={image} alt="Etkinlik önizlemesi" className="mt-4 h-44 w-full rounded-lg object-cover" /> : <div className="mt-4 flex h-44 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-blue-200 text-sm text-indigo-500">Görsel eklenmedi</div>}
            <p className="mt-4 text-xl font-bold text-gray-900">{title || 'Etkinlik adı'}</p>
            <p className="mt-1 text-sm text-gray-600">{startDate ? new Date(startDate).toLocaleString('tr-TR') : 'Başlangıç tarihi'} · {category}</p>
            {startingPrice ? <p className="mt-3 font-semibold text-indigo-600">€{Number(startingPrice).toFixed(2)}’dan başlayan fiyatlarla</p> : null}
            {description ? <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{description}</p> : <p className="mt-3 text-sm text-gray-400">Türkçe açıklama burada görünecek.</p>}
          </div>
        </aside>
      </form>
    </div>
  )
}
