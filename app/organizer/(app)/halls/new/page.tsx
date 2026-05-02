'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Pencil, Upload, Check } from 'lucide-react'

type CreationMode = 'select' | 'manual'

export default function NewHallPage() {
  const router = useRouter()
  const [mode, setMode] = useState<CreationMode>('select')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    stageWidth: 1200,
    stageHeight: 800,
  })

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

  // Step 1: Select Mode
  if (mode === 'select') {
    return (
      <div>
        <Link href="/organizer/halls" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={18} />
          Geri dön
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Salon Oluştur</h1>
        <p className="text-gray-600 mb-8">Salonunuzu nasıl oluşturmak istersiniz?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
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
          <Link
            href="/organizer/halls/wizard"
            className="card p-8 text-left hover:border-primary-300 hover:shadow-md transition-all group block"
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
          </Link>
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

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setMode('select')} className="btn-secondary flex-1 py-3">
                İptal
              </button>
              <button type="submit" className="btn-primary flex-1 py-3" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Salon Oluştur'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

  return null
}
