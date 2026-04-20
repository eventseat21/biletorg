'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Building2, User } from 'lucide-react'

export default function OrganizerRegisterPage() {
  const router = useRouter()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1: Account
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2: Company
    companyName: '',
    companyPhone: '',
    taxNumber: '',
    website: '',
    description: '',
    // Step 3: Address
    address: '',
    city: '',
    country: 'Türkiye',
    postalCode: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Tüm alanları doldurun')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Şifreler eşleşmiyor')
        return
      }
    }
    if (step === 2) {
      if (!formData.companyName) {
        setError('Şirket adı zorunlu')
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'ORGANIZER',
          companyName: formData.companyName,
          companyPhone: formData.companyPhone,
          taxNumber: formData.taxNumber,
          website: formData.website,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          postalCode: formData.postalCode,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Başvuru işlemi başarısız')
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h2>
          <p className="text-gray-600 mb-6">
            Organizatör başvurunuz incelemeye alındı. Onaylandığında e-posta ile bilgilendirileceksiniz.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary-600">
            BiletOrg
          </Link>
          <p className="text-gray-600 mt-2">Organizatör Başvurusu</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                s === step ? 'bg-primary-600 text-white' : 
                s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-primary-600" />
                  <h3 className="text-lg font-semibold">Hesap Bilgileri</h3>
                </div>
                
                <div>
                  <label className="label">Ad Soyad *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">E-posta Adresi *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Şifre *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="label">Şifre Tekrar *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-6 h-6 text-primary-600" />
                  <h3 className="text-lg font-semibold">Şirket Bilgileri</h3>
                </div>
                
                <div>
                  <label className="label">Şirket Adı *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Vergi Numarası</label>
                  <input
                    type="text"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Web Sitesi</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="input"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="label">Şirket Açıklaması</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 mb-6">
                  <Building2 className="w-6 h-6 text-primary-600" />
                  <h3 className="text-lg font-semibold">Adres Bilgileri</h3>
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
                    <label className="label">Şehir</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Posta Kodu</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Ülke</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="btn-secondary flex-1 py-3"
                  disabled={isLoading}
                >
                  Geri
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary flex-1 py-3"
                >
                  Devam Et
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Başvuruyu Gönder'
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Zaten hesabınız var mı? </span>
            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Giriş yapın
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
