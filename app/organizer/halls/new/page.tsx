'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Pencil, Upload, FileUp, Check } from 'lucide-react'

type CreationMode = 'select' | 'manual' | 'svg'

export default function NewHallPage() {
  const router = useRouter()
  const [mode, setMode] = useState<CreationMode>('select')
  const [isLoading, setIsLoading] = useState(false)
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [svgPreview, setSvgPreview] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    stageWidth: 800,
    stageHeight: 600,
  })

  const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'image/svg+xml') {
      setSvgFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSvgPreview(e.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/organizer/halls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: 'manual' }),
      })

      if (!res.ok) throw new Error('Failed to create hall')

      const hall = await res.json()
      router.push(`/organizer/halls/${hall.id}/editor`)
    } catch (error) {
      console.error('Error creating hall:', error)
      setIsLoading(false)
    }
  }

  const handleSvgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!svgFile) return

    setIsLoading(true)

    const formDataToSend = new FormData()
    formDataToSend.append('svg', svgFile)
    formDataToSend.append('name', formData.name)
    formDataToSend.append('description', formData.description)
    formDataToSend.append('address', formData.address)

    try {
      const res = await fetch('/api/organizer/halls/svg-import', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!res.ok) throw new Error('Failed to import hall')

      const hall = await res.json()
      router.push(`/organizer/halls/${hall.id}/svg-editor`)
    } catch (error) {
      console.error('Error importing hall:', error)
      setIsLoading(false)
    }
  }

  // Step 1: Select Mode
  if (mode === 'select') {
    return (
      <div>
        <Link href="/organizer/halls" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} />
          Geri dön
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Salon Oluştur</h1>
        <p className="text-gray-600 mb-8">Salon tasarım yöntemini seçin</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {/* Manual Design Option */}
          <button
            onClick={() => setMode('manual')}
            className="card p-8 text-left hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
              <Pencil size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Manuel Çizim</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Sürükle-bırak ile koltukları tek tek yerleştirin. Küçük salonlar ve basit düzenler için ideal.
            </p>
            <div className="mt-4 flex items-center gap-2 text-primary-600 text-sm font-medium">
              <Check size={16} />
              <span>Tam kontrol</span>
            </div>
          </button>

          {/* SVG Import Option */}
          <button
            onClick={() => setMode('svg')}
            className="card p-8 text-left hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <Upload size={28} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">SVG Import</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Mevcut salon planınızı (SVG) yükleyin. Otomatik koltuk tanıma ve düzenleme ile zamandan kazanın.
            </p>
            <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium">
              <Check size={16} />
              <span>Hızlı kurulum</span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Manual Design Form
  if (mode === 'manual') {
    return (
      <div>
        <button onClick={() => setMode('select')} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} />
          Geri dön
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manuel Salon Oluştur</h1>

        <form onSubmit={handleManualSubmit} className="max-w-2xl">
          <div className="card p-6 space-y-6">
            <div>
              <label className="label">Salon Adı *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={3}
              />
            </div>

            <div>
              <label className="label">Adres</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Sahne Genişliği (px)</label>
                <input
                  type="number"
                  value={formData.stageWidth}
                  onChange={(e) => setFormData({ ...formData, stageWidth: parseInt(e.target.value) })}
                  className="input"
                  min={400}
                  max={2000}
                />
              </div>
              <div>
                <label className="label">Sahne Yüksekliği (px)</label>
                <input
                  type="number"
                  value={formData.stageHeight}
                  onChange={(e) => setFormData({ ...formData, stageHeight: parseInt(e.target.value) })}
                  className="input"
                  min={300}
                  max={1500}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setMode('select')} className="btn-secondary flex-1 py-3">
                İptal
              </button>
              <button 
                type="submit" 
                className="btn-primary flex-1 py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Editörü Aç'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  // Step 3: SVG Import Form
  return (
    <div>
      <button onClick={() => setMode('select')} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} />
        Geri dön
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">SVG ile Salon Import</h1>

      <form onSubmit={handleSvgSubmit} className="max-w-2xl">
        <div className="card p-6 space-y-6">
          {/* SVG Upload */}
          <div>
            <label className="label">SVG Dosyası *</label>
            <div className="mt-2">
              <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary-500 focus:outline-none">
                <span className="flex items-center space-x-2">
                  <FileUp className="w-6 h-6 text-gray-600" />
                  <span className="font-medium text-gray-600">
                    {svgFile ? svgFile.name : 'SVG dosyası seçin'}
                  </span>
                </span>
                <input 
                  type="file" 
                  accept=".svg" 
                  className="hidden" 
                  onChange={handleSvgUpload}
                  required
                />
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Sadece .svg formatı desteklenir. Koltuklar circle, rect veya g.seat elementleri olarak tanınır.
            </p>
          </div>

          {/* Preview */}
          {svgPreview && (
            <div>
              <label className="label">Önizleme</label>
              <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-64">
                <div dangerouslySetInnerHTML={{ __html: svgPreview }} />
              </div>
            </div>
          )}

          <div>
            <label className="label">Salon Adı *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div>
            <label className="label">Adres</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setMode('select')} className="btn-secondary flex-1 py-3">
              İptal
            </button>
            <button 
              type="submit" 
              className="btn-primary flex-1 py-3"
              disabled={isLoading || !svgFile}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Koltukları Düzenle'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
