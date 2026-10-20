'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, RefreshCw, Plus } from 'lucide-react'

type Category = {
  id: string
  name: string
  description: string | null
  price: number
  totalQuantity: number
  availableQuantity: number
  color: string
  seatType: string | null
  salesStart: string | null
  salesEnd: string | null
}

type Props = {
  event: { id: string; title: string; titleDe: string | null; titleEn: string | null; titleKu: string | null; titleCkb: string | null; description: string | null; descriptionDe: string | null; descriptionEn: string | null; descriptionKu: string | null; descriptionCkb: string | null; startDate: string; image: string | null; category: string | null; hallId: string | null }
  categories: Category[]
}

/** UTC ISO → datetime-local değeri (yerel saatle). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
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
  const [startDate, setStartDate] = useState(toLocalInput(event.startDate))
  const [image, setImage] = useState(event.image ?? '')
  const [category, setCategory] = useState(event.category ?? '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [draft, setDraft] = useState({ name: '', price: 0, totalQuantity: 0, color: '#3b82f6' })

  const run = async (request: Promise<Response>, success: (data: any) => string, fallbackError: string) => {
    setBusy(true); setMessage('')
    try {
      const response = await request
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || fallbackError)
      setMessage(success(data))
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : fallbackError) } finally { setBusy(false) }
  }

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

  const saveEvent = () => run(
    fetch(`/api/organizer/events/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, titleTr: title, titleDe, titleEn, titleKu, titleCkb, description, descriptionTr: description, descriptionDe, descriptionEn, descriptionKu, descriptionCkb, startDate, image, category, action: 'SAVE' }),
    }),
    () => 'Etkinlik bilgileri kaydedildi.',
    'Etkinlik kaydedilemedi',
  )

  const saveCategory = (item: Category) => run(
    fetch(`/api/organizer/events/${event.id}/tickets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        totalQuantity: item.totalQuantity,
        color: item.color,
        salesStart: item.salesStart,
        salesEnd: item.salesEnd,
      }),
    }),
    () => 'Bilet kategorisi kaydedildi. Satılmış biletler korunuyor.',
    'Bilet kategorisi kaydedilemedi',
  )

  const addCategory = () => run(
    fetch(`/api/organizer/events/${event.id}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    }),
    () => {
      setDraft({ name: '', price: 0, totalQuantity: 0, color: '#3b82f6' })
      return 'Kategori eklendi.'
    },
    'Kategori eklenemedi',
  )

  const removeCategory = (item: Category) => run(
    fetch(`/api/organizer/events/${event.id}/tickets`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: item.id }),
    }),
    () => `“${item.name}” kategorisi silindi.`,
    'Kategori silinemedi',
  )

  const importFromHall = () => run(
    fetch(`/api/organizer/events/${event.id}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromHall: true }),
    }),
    (data) => {
      const s = data.summary ?? {}
      const kept = s.kept?.length ? ` Satılmış ${s.kept.join(', ')} kategorisine dokunulmadı.` : ''
      return `Salon planı aktarıldı: ${s.updated ?? 0} güncellendi, ${s.created ?? 0} eklendi, ${s.removed ?? 0} silindi; satılabilir ${s.totalSellable ?? 0} koltuk.${kept}`
    },
    'Salon kategorileri aktarılamadı',
  )

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-indigo-950">Bilet kategorileri, fiyatları ve stok</h3>
          {event.hallId ? (
            <button type="button" onClick={importFromHall} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50">
              <RefreshCw size={15} /> Salon kategorilerini aktar
            </button>
          ) : (
            <span className="text-xs text-indigo-700">Salon seçilince kategoriler koltuk planından doldurulur.</span>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {categories.map((item) => (
            <CategoryEditor key={item.id} category={item} disabled={busy} onSave={saveCategory} onDelete={removeCategory} />
          ))}
        </div>

        <div className="mt-3 grid gap-2 rounded-lg border border-dashed border-indigo-300 bg-white p-3 md:grid-cols-[1fr_110px_110px_64px_auto] md:items-end">
          <label className="label">Yeni kategori adı<input className="input mt-1 w-full" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="label">Fiyat (€)<input className="input mt-1 w-full" type="number" min="0" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></label>
          <label className="label">Stok<input className="input mt-1 w-full" type="number" min="0" step="1" value={draft.totalQuantity} onChange={(e) => setDraft({ ...draft, totalQuantity: Number(e.target.value) })} /></label>
          <label className="label">Renk<input className="mt-1 h-9 w-16 rounded border border-indigo-200 bg-white" type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></label>
          <button type="button" onClick={addCategory} disabled={busy || !draft.name.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Plus size={15} /> Ekle
          </button>
        </div>
      </div>
      {message ? <p className="text-sm text-indigo-900">{message}</p> : null}
    </div>
  )
}

function CategoryEditor({ category, disabled, onSave, onDelete }: { category: Category; disabled: boolean; onSave: (category: Category) => void; onDelete: (category: Category) => void }) {
  const [value, setValue] = useState({
    name: category.name,
    price: category.price,
    totalQuantity: category.totalQuantity,
    color: category.color,
    salesStart: toLocalInput(category.salesStart),
    salesEnd: toLocalInput(category.salesEnd),
  })
  const patch = (next: Partial<typeof value>) => setValue({ ...value, ...next })

  return (
    <div className="rounded-lg border border-indigo-100 bg-white p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_110px_120px_64px] md:items-end">
        <label className="label">Kategori adı<input className="input mt-1 w-full" value={value.name} onChange={(e) => patch({ name: e.target.value })} />
          {category.seatType ? <span className="mt-1 block text-[11px] text-indigo-500">Salon planı: {category.seatType}</span> : null}
        </label>
        <label className="label">Fiyat (€)<input className="input mt-1 w-full" type="number" min="0" step="0.01" value={value.price} onChange={(e) => patch({ price: Number(e.target.value) })} /></label>
        <label className="label">Toplam stok<input className="input mt-1 w-full" type="number" min="0" step="1" value={value.totalQuantity} onChange={(e) => patch({ totalQuantity: Number(e.target.value) })} />
          <span className="mt-1 block text-[11px] text-indigo-500">{category.availableQuantity} satışta</span>
        </label>
        <label className="label">Renk<input className="mt-1 h-9 w-16 rounded border border-indigo-200" type="color" value={value.color} onChange={(e) => patch({ color: e.target.value })} /></label>
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <label className="label">Satış başlangıcı<input className="input mt-1 w-full" type="datetime-local" value={value.salesStart} onChange={(e) => patch({ salesStart: e.target.value })} /></label>
        <label className="label">Satış bitişi<input className="input mt-1 w-full" type="datetime-local" value={value.salesEnd} onChange={(e) => patch({ salesEnd: e.target.value })} /></label>
        <button type="button" onClick={() => onSave({ ...category, ...value, salesStart: value.salesStart || null, salesEnd: value.salesEnd || null })} disabled={disabled} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Kaydet</button>
        <button type="button" onClick={() => onDelete(category)} disabled={disabled} title="Kategoriyi sil" className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
