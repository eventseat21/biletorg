'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Upload,
  Eye,
  Palette,
  FileJson,
  ShoppingCart,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Wand2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const wizardSteps = [
  {
    id: 1,
    title: 'SVG Yukle',
    description:
      'Organizator salon planini SVG olarak yukler. Wizard dosya yapisini hizlica dogrular.',
    icon: Upload,
  },
  {
    id: 2,
    title: 'Akilli Tanima',
    description:
      'Circle ve rect elementleri koltuk adayi olarak algilanir. Koridor ve sahne alanlari ayrilir.',
    icon: Eye,
  },
  {
    id: 3,
    title: 'Kategori ve Fiyat',
    description:
      'VIP, Premium, Normal gibi kategoriler atanir. Her kategoriye fiyat ve kapasite kurali eklenir.',
    icon: Palette,
  },
  {
    id: 4,
    title: 'JSON ve Kayit',
    description:
      'Koltuk haritasi JSON formatinda kaydedilir. Etkinlikte tekrar kullanmak icin versiyonlanir.',
    icon: FileJson,
  },
  {
    id: 5,
    title: 'Satisa Ac',
    description:
      'Koltuklar biletleme ile eslenir. Musteri gorerek koltuk secer ve satin alma akisi baslar.',
    icon: ShoppingCart,
  },
]

const highlights = [
  'Saniyeler icinde hazir plan',
  'Otomatik circle/rect tanima',
  'Vektor kalitesinde gorunum',
  'Sonradan duzenleme ve tekrar yayinlama',
]

type ParsedSummary = {
  circleCount: number
  rectCount: number
  totalSeats: number
  width: number
  height: number
  rowCount: number
  blockCount: number
  aisleCount: number
  collisionCount: number
  aisleRanges: Array<{ fromX: number; toX: number }>
}

type Category = {
  type: string
  ratio: number
  price: number
}

export default function HallWizardPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [hallName, setHallName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ParsedSummary | null>(null)
  const [createdHallId, setCreatedHallId] = useState<string | null>(null)
  const [blockCategoryMap, setBlockCategoryMap] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Category[]>([
    { type: 'VIP', ratio: 0.2, price: 750 },
    { type: 'PREMIUM', ratio: 0.3, price: 550 },
    { type: 'NORMAL', ratio: 0.5, price: 350 },
  ])

  const activeStep = useMemo(
    () => wizardSteps.find((step) => step.id === currentStep) ?? wizardSteps[0],
    [currentStep]
  )

  async function goNext() {
    setError('')
    if (currentStep === 1) {
      if (!svgFile || !hallName.trim()) {
        setError('Devam etmek icin salon adi ve SVG dosyasi gerekli.')
        return
      }
      await handleParse()
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length))
  }

  function goPrev() {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  async function handleParse() {
    if (!svgFile) return
    setIsParsing(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('svg', svgFile)
      const res = await fetch('/api/organizer/halls/wizard/parse', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'SVG parse basarisiz')
        return
      }
      const summary = data.summary as ParsedSummary
      setParsed(summary)
      setBlockCategoryMap(buildDefaultBlockMap(summary.blockCount))
      setCurrentStep(2)
    } catch {
      setError('Parse asamasinda hata olustu')
    } finally {
      setIsParsing(false)
    }
  }

  async function finalizeAndSave() {
    if (!svgFile || !hallName.trim()) {
      setError('SVG ve salon adi zorunlu.')
      return
    }
    setIsSaving(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('svg', svgFile)
      fd.append('name', hallName.trim())
      fd.append('description', description.trim())
      fd.append('address', address.trim())
      fd.append(
        'categories',
        JSON.stringify(categories.map((c) => ({ type: c.type, ratio: c.ratio })))
      )
      fd.append('blockCategoryMap', JSON.stringify(blockCategoryMap))
      const res = await fetch('/api/organizer/halls/svg-import', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Kayit basarisiz')
        return
      }
      setCreatedHallId(data.hall.id as string)
      setCurrentStep(5)
    } catch {
      setError('Kayit sirasinda hata olustu')
    } finally {
      setIsSaving(false)
    }
  }

  function updateCategory(
    index: number,
    field: keyof Category,
    value: string
  ) {
    setCategories((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]:
                field === 'type'
                  ? value.toUpperCase()
                  : Number.isFinite(Number(value))
                    ? Number(value)
                    : 0,
            }
          : row
      )
    )
  }

  function applyBulkCategoryReassignment() {
    if (!parsed?.blockCount) return
    setBlockCategoryMap(buildDefaultBlockMap(parsed.blockCount))
  }

  function updateBlockCategory(block: string, type: string) {
    setBlockCategoryMap((prev) => ({ ...prev, [block]: type.toUpperCase() }))
  }

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-6">
            <p className="mb-4 text-sm font-medium text-indigo-700">SVG Dosyasi Yukleme ve Temel Bilgiler</p>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Salon adi *</label>
                <input
                  value={hallName}
                  onChange={(e) => setHallName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Orn. Ana Sahne"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Adres</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Mekan adresi"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">Aciklama</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Upload className="mx-auto mb-3 h-8 w-8 text-indigo-500" />
              <p className="font-medium text-gray-900">{svgFile ? svgFile.name : 'SVG dosyanizi secin'}</p>
              <p className="mt-1 text-sm text-gray-500">circle/rect elemanlari otomatik taninir</p>
              <label className="mt-4 inline-block cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Dosya Sec
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => setSvgFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Circle tespit</p>
                <p className="text-2xl font-bold text-gray-900">{parsed?.circleCount ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Rect tespit</p>
                <p className="text-2xl font-bold text-gray-900">{parsed?.rectCount ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Otomatik satir</p>
                <p className="text-2xl font-bold text-gray-900">{parsed?.rowCount ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Toplam koltuk</p>
                <p className="text-2xl font-bold text-gray-900">{parsed?.totalSeats ?? 0}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Akilli koridor tespiti</p>
                <p className="text-2xl font-bold text-gray-900">{parsed?.aisleCount ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Otomatik blok</p>
                <p className="text-2xl font-bold text-gray-900">{parsed?.blockCount ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Numara cakisma</p>
                <p className={`text-2xl font-bold ${(parsed?.collisionCount ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {parsed?.collisionCount ?? 0}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Tespit edilen koridor araliklari</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {(parsed?.aisleRanges?.length ?? 0) > 0 ? (
                  parsed!.aisleRanges.map((a, idx) => (
                    <span key={idx} className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
                      X:{Math.round(a.fromX)} - {Math.round(a.toX)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Belirgin koridor boslugu tespit edilmedi.</span>
                )}
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {categories.map((row, i) => (
                <div
                  key={`${row.type}-${i}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="grid w-full gap-3 md:grid-cols-3">
                    <input
                      value={row.type}
                      onChange={(e) => updateCategory(i, 'type', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={row.ratio}
                      onChange={(e) => updateCategory(i, 'ratio', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min="0"
                      value={row.price}
                      onChange={(e) => updateCategory(i, 'price', e.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500">Oranlar toplamı 1.0 olacak sekilde kaydetmeniz onerilir.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">Toplu kategori yeniden atama (blok bazli)</p>
                <button
                  type="button"
                  onClick={applyBulkCategoryReassignment}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  Otomatik Dagit
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {Object.keys(blockCategoryMap).length > 0 ? (
                  Object.entries(blockCategoryMap).map(([block, type]) => (
                    <div key={block} className="flex items-center gap-2 rounded-lg bg-white p-2 border border-gray-200">
                      <span className="w-14 text-sm font-semibold text-gray-700">{block}</span>
                      <select
                        value={type}
                        onChange={(e) => updateBlockCategory(block, e.target.value)}
                        className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c.type} value={c.type}>
                            {c.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Blok verisi parse sonrasi olusur.</p>
                )}
              </div>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="rounded-xl border border-gray-200 bg-gray-900 p-4 text-green-300">
            <p className="mb-3 text-sm text-gray-400">ornek-hall-map.json</p>
            <pre className="overflow-auto text-xs leading-relaxed">
{`{
  "hallName": "${hallName || 'Ana Sahne'}",
  "version": 3,
  "seats": ${parsed?.totalSeats ?? 0},
  "categories": [${categories.map((c) => `"${c.type}"`).join(', ')}],
  "svgImported": true
}`}
            </pre>
            <button
              type="button"
              onClick={finalizeAndSave}
              disabled={isSaving}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Kaydediliyor...' : 'JSON ve Salonu Kaydet'}
            </button>
          </div>
        )
      case 5:
        return (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="mb-3 flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">Salon plani satisa hazir</p>
            </div>
            <p className="text-sm text-green-800">
              Koltuklar etkinlik biletleme akisina baglandi. Simdi etkinlige gidip satisi
              baslatabilirsiniz.
            </p>
            <Link
              href={createdHallId ? `/organizer/halls/${createdHallId}/svg-editor` : '/organizer/halls'}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Salonu Ac
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4" />
              Salon Plani Wizard
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
              SVG'den Satisa Hazir Koltuk Planina
            </h1>
            <p className="text-lg text-gray-600">
              Bu ekran, organizatorler icin salon plani import surecini adim adim yonetir:
              tanima, kategori atama, JSON kayit ve biletleme entegrasyonu.
            </p>
          </div>
          <Link
            href="/organizer/halls/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Yeni Salon Olustur
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Wizard Akisi</h2>
          <p className="mb-6 text-gray-600">
            SVG → Konva → Biletleme akisinin operasyonel hali. Her adimda kaydet, geri al,
            tekrar duzenle.
          </p>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {wizardSteps.map((step) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isDone = step.id < currentStep
              return (
                <button
                  type="button"
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    isActive
                      ? 'border-indigo-300 bg-indigo-50'
                      : isDone
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div
                    className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white ${
                      isDone ? 'bg-green-500' : isActive ? 'bg-indigo-600' : 'bg-yellow-500'
                    }`}
                  >
                    {step.id}
                  </div>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-yellow-600'}`} />
                    <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Adim {activeStep.id}</p>
                <h3 className="text-xl font-semibold text-gray-900">{activeStep.title}</h3>
              </div>
              <p className="max-w-md text-right text-sm text-gray-600">{activeStep.description}</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {renderStepContent()}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentStep === 1}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Geri
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={currentStep === wizardSteps.length || isParsing || isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isParsing ? 'SVG Analiz Ediliyor...' : 'Ileri'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Neler Kazandirir?</h3>
            <ul className="space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
            <div className="mb-3 flex items-center gap-2 text-indigo-700">
              <Wand2 className="h-5 w-5" />
              <p className="font-semibold">Wizard Otomasyonlari Aktif</p>
            </div>
            <ul className="space-y-2 text-sm text-indigo-900">
              <li>- Otomatik blok / sira isimlendirme</li>
              <li>- Akilli koridor tespiti</li>
              <li>- Koltuk numara cakisma kontrolu</li>
              <li>- Toplu kategori yeniden atama (blok bazli)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildDefaultBlockMap(blockCount: number): Record<string, string> {
  if (!blockCount) return {}
  const categories = ['VIP', 'PREMIUM', 'NORMAL']
  const result: Record<string, string> = {}
  for (let i = 1; i <= blockCount; i++) {
    const idx = i <= Math.max(1, Math.floor(blockCount * 0.2))
      ? 0
      : i <= Math.max(2, Math.floor(blockCount * 0.55))
        ? 1
        : 2
    result[`B${i}`] = categories[idx]
  }
  return result
}
