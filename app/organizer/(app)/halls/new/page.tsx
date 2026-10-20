'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  Armchair,
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  Upload,
} from 'lucide-react'

type CreationMode = 'blank' | 'svg'

type ParsedSeat = {
  id?: string | null
  x: number
  y: number
  width: number
  height: number
  row: string
  number: number
  type: string
  shape: string
  blockId?: string | null
  status: string
}

type ParseSummary = {
  totalSeats: number
  rowCount: number
  circleCount: number
  rectCount: number
  aisleCount: number
  blockCount: number
  collisionCount: number
  width: number
  height: number
}

export default function NewHallPage() {
  const router = useRouter()
  const [mode, setMode] = useState<CreationMode>('blank')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [rowGroupDistance, setRowGroupDistance] = useState(50)
  const [parsed, setParsed] = useState<{ seats: ParsedSeat[]; summary: ParseSummary } | null>(null)
  const [busy, setBusy] = useState<'parse' | 'create' | null>(null)
  const [error, setError] = useState('')

  const isBusy = busy !== null

  function resetParse(file: File | null) {
    setSvgFile(file)
    setParsed(null)
    setError('')
  }

  async function handleParse() {
    if (!svgFile) {
      setError('SVG dosyası seçin.')
      return
    }
    setBusy('parse')
    setError('')
    try {
      const fd = new FormData()
      fd.append('svg', svgFile)
      fd.append('rowGroupDistance', String(rowGroupDistance))
      const res = await fetch('/api/organizer/halls/enhanced-parse', { method: 'POST', body: fd })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'SVG çözümlenemedi')
        return
      }
      setParsed({ seats: (data.seats ?? []) as ParsedSeat[], summary: data.summary as ParseSummary })
    } catch {
      setError('SVG çözümlenirken bir hata oluştu')
    } finally {
      setBusy(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Salon adı zorunludur')
      return
    }
    if (mode === 'svg' && !parsed) {
      setError('Önce SVG dosyasını çözümleyin')
      return
    }

    setBusy('create')
    setError('')
    try {
      let res: Response
      if (mode === 'svg') {
        const fd = new FormData()
        fd.append('svg', svgFile as File)
        fd.append('name', name.trim())
        fd.append('description', description.trim())
        fd.append('address', address.trim())
        fd.append('seats', JSON.stringify(parsed?.seats ?? []))
        res = await fetch('/api/organizer/halls/enhanced-import', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/organizer/halls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), description: description.trim(), address: address.trim() }),
        })
      }

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(data?.error || 'Salon oluşturulamadı')
        setBusy(null)
        return
      }

      const hallId = mode === 'svg' ? data?.hall?.id : data?.id
      if (!hallId) {
        setError('Salon kaydedildi ama kimliği alınamadı')
        setBusy(null)
        return
      }
      router.push(`/organizer/halls/${hallId}/seatmap`)
    } catch {
      setError('Salon oluşturulurken bir hata oluştu')
      setBusy(null)
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/organizer/halls"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" /> Salonlara dön
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Armchair className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yeni Salon</h1>
          <p className="text-sm text-gray-600">
            Salonu oluşturun, koltuk planını editörde çizin veya SVG planınızı içe aktarın.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6 p-6">
        <div>
          <label className="label" htmlFor="hall-name">Salon adı *</label>
          <input
            id="hall-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn. Amed Kültür Merkezi – Büyük Salon"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="hall-address">Adres</label>
          <input
            id="hall-address"
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Mekan adresi"
          />
        </div>

        <div>
          <label className="label" htmlFor="hall-description">Açıklama</label>
          <textarea
            id="hall-description"
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="label">Koltuk planı</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModeCard
              active={mode === 'blank'}
              icon={<Pencil className="h-5 w-5" />}
              title="Boş plan"
              description="Editörde tek tek ya da toplu olarak koltuk çizin."
              onClick={() => setMode('blank')}
            />
            <ModeCard
              active={mode === 'svg'}
              icon={<Upload className="h-5 w-5" />}
              title="SVG içe aktar"
              description="Hazır salon planını yükle, koltuklar otomatik tanınsın."
              onClick={() => setMode('svg')}
            />
          </div>
        </fieldset>

        {mode === 'svg' && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex-1">
                <span className="label">SVG dosyası *</span>
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="input w-full text-sm"
                  onChange={(e) => resetParse(e.target.files?.[0] ?? null)}
                />
              </label>
              <label className="w-36">
                <span className="label">Sıra gruplama (px)</span>
                <input
                  type="number"
                  min={10}
                  max={200}
                  className="input w-full"
                  value={rowGroupDistance}
                  onChange={(e) => setRowGroupDistance(Number(e.target.value) || 50)}
                />
              </label>
              <button
                type="button"
                onClick={handleParse}
                disabled={!svgFile || isBusy}
                className="btn-secondary inline-flex items-center gap-2 py-2 disabled:opacity-50"
              >
                {busy === 'parse' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Çözümle
              </button>
            </div>

            {parsed && (
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <Stat label="Koltuk" value={parsed.summary.totalSeats} />
                <Stat label="Sıra" value={parsed.summary.rowCount} />
                <Stat label="Blok" value={parsed.summary.blockCount} />
                <Stat label="Koridor" value={parsed.summary.aisleCount} />
                <Stat label="Çakışan" value={parsed.summary.collisionCount} />
                <Stat label="Yuvarlak" value={parsed.summary.circleCount} />
                <Stat label="Kare" value={parsed.summary.rectCount} />
                <Stat label="Plan ölçüsü" value={`${Math.round(parsed.summary.width)}×${Math.round(parsed.summary.height)}`} />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/organizer/halls" className="btn-secondary flex-1 py-3 text-center">
            Vazgeç
          </Link>
          <button type="submit" className="btn-primary flex-1 py-3" disabled={isBusy}>
            {busy === 'create' ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              'Salonu oluştur ve editörü aç'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function ModeCard({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className={`mb-2 flex items-center gap-2 ${active ? 'text-indigo-700' : 'text-gray-500'}`}>
        {icon}
        <span className="font-semibold text-gray-900">{title}</span>
        {active && <Check className="ml-auto h-4 w-4 text-indigo-600" />}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  )
}
