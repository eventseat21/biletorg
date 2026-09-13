'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; name: string; description: string | null; price: number; totalQuantity: number; availableQuantity: number }

type Props = {
  event: { id: string; title: string; titleDe: string | null; titleEn: string | null; titleKu: string | null; titleCkb: string | null; description: string | null; descriptionDe: string | null; descriptionEn: string | null; descriptionKu: string | null; descriptionCkb: string | null; startDate: string; image: string | null; category: string | null; hallId: string | null }
  categories: Category[]
}

export default function EventEditPanel({ event, categories }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description ?? '')
  const [titleDe, setTitleDe] = useState(event.titleDe ?? '')
  const [titleEn, setTitleEn] = useState(event.titleEn ?? '')
  const [titleKu, setTitleKu] = useState(event.titleKu ?? '')
  const [titleCkb, setTitleCkb] = useState(event.titleCkb ?? '')
  const [descriptionDe, setDescriptionDe] = useState(event.descriptionDe ?? '')
  const [descriptionEn, setDescriptionEn] = useState(event.descriptionEn ?? '')
  const [descriptionKu, setDescriptionKu] = useState(event.descriptionKu ?? '')
  const [descriptionCkb, setDescriptionCkb] = useState(event.descriptionCkb ?? '')
  const [startDate, setStartDate] = useState(event.startDate.slice(0, 16))
  const [image, setImage] = useState(event.image ?? '')
  const [category, setCategory] = useState(event.category ?? '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)

  const uploadImage = async (file: File) => {
    setUploading(true); setMessage('')
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await fetch('/api/organizer/uploads/event-image', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Görsel yüklenemedi')
      setImage(data.url)
      setMessage('Görsel yüklendi. Kaydetmeyi unutmayın.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Görsel yüklenemedi') } finally { setUploading(false) }
  }

  const saveEvent = async () => {
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/api/organizer/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, titleTr: title, titleDe, titleEn, titleKu, titleCkb, description, descriptionTr: description, descriptionDe, descriptionEn, descriptionKu, descriptionCkb, startDate, image, category, action: 'SAVE' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Etkinlik kaydedilemedi')
      setMessage('Etkinlik bilgileri kaydedildi.')
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Etkinlik kaydedilemedi') } finally { setBusy(false) }
  }

  const saveCategory = async (categoryItem: Category) => {
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/api/organizer/events/${event.id}/tickets`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryItem.id, name: categoryItem.name, description: categoryItem.description, price: categoryItem.price, totalQuantity: categoryItem.totalQuantity }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Bilet kategorisi kaydedilemedi')
      setMessage('Bilet kategorisi kaydedildi. Satılmış biletler korunuyor.')
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Bilet kategorisi kaydedilemedi') } finally { setBusy(false) }
  }

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
      <div>
        <h2 className="font-semibold text-indigo-950">Etkinliği düzenle</h2>
        <p className="mt-1 text-xs text-indigo-800">Fiyat, tarih ve etkinlik bilgileri değiştirilebilir. Satılmış biletler ve onlara bağlı koltuklar korunur.</p>
      </div>
      <label className="label">Etkinlik adı<input className="input mt-1 w-full bg-white" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="label">Türkçe açıklama<textarea className="input mt-1 min-h-[90px] w-full bg-white" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <div className="space-y-3 rounded-lg border border-indigo-200 bg-white p-3">
        <h3 className="font-semibold text-indigo-950">Diğer diller</h3>
        <label className="label">Deutsch başlık<input className="input mt-1 w-full" value={titleDe} onChange={(e) => setTitleDe(e.target.value)} /></label>
        <label className="label">English başlık<input className="input mt-1 w-full" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} /></label>
        <label className="label">Kurmancî başlık<input className="input mt-1 w-full" value={titleKu} onChange={(e) => setTitleKu(e.target.value)} /></label>
        <label className="label">سۆرانی başlık<input className="input mt-1 w-full" value={titleCkb} onChange={(e) => setTitleCkb(e.target.value)} /></label>
        <label className="label">Deutsch açıklama<textarea className="input mt-1 min-h-[70px] w-full" value={descriptionDe} onChange={(e) => setDescriptionDe(e.target.value)} /></label>
        <label className="label">English açıklama<textarea className="input mt-1 min-h-[70px] w-full" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} /></label>
        <label className="label">Kurmancî açıklama<textarea className="input mt-1 min-h-[70px] w-full" value={descriptionKu} onChange={(e) => setDescriptionKu(e.target.value)} /></label>
        <label className="label">سۆرانی açıklama<textarea className="input mt-1 min-h-[70px] w-full" value={descriptionCkb} onChange={(e) => setDescriptionCkb(e.target.value)} /></label>
      </div>
      <label className="label">Başlangıç tarihi<input className="input mt-1 w-full bg-white" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
      <label className="label">Görsel URL<input className="input mt-1 w-full bg-white" type="url" value={image} onChange={(e) => setImage(e.target.value)} /></label>
      <label className="label">Görsel dosyası<input className="input mt-1 w-full bg-white" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file) }} /></label>
      {image ? <img src={image} alt="Etkinlik görseli" className="h-40 w-full rounded-lg object-cover" /> : null}
      <label className="label">Kategori<input className="input mt-1 w-full bg-white" value={category} onChange={(e) => setCategory(e.target.value)} /></label>
      <button type="button" onClick={saveEvent} disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Etkinlik bilgilerini kaydet</button>
      <div className="border-t border-indigo-200 pt-4">
        <h3 className="font-semibold text-indigo-950">Bilet fiyatları ve stok</h3>
        <div className="mt-3 space-y-3">
          {categories.map((item) => (
            <CategoryEditor key={item.id} category={item} disabled={busy} onSave={saveCategory} />
          ))}
        </div>
      </div>
      {message ? <p className="text-sm text-indigo-900">{message}</p> : null}
    </div>
  )
}

function CategoryEditor({ category, disabled, onSave }: { category: Category; disabled: boolean; onSave: (category: Category) => void }) {
  const [value, setValue] = useState(category)
  return (
    <div className="grid gap-2 rounded-lg border border-indigo-100 bg-white p-3 md:grid-cols-[1fr_120px_120px_auto] md:items-end">
      <label className="label">Kategori adı<input className="input mt-1 w-full" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></label>
      <label className="label">Fiyat<input className="input mt-1 w-full" type="number" min="0" step="0.01" value={value.price} onChange={(e) => setValue({ ...value, price: Number(e.target.value) })} /></label>
      <label className="label">Toplam stok<input className="input mt-1 w-full" type="number" min="0" step="1" value={value.totalQuantity} onChange={(e) => setValue({ ...value, totalQuantity: Number(e.target.value) })} /></label>
      <button type="button" onClick={() => onSave(value)} disabled={disabled} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Kaydet</button>
    </div>
  )
}
