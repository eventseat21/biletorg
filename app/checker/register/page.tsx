'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle, ScanLine } from 'lucide-react'

export default function CheckerRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'CHECKER',
          phone: formData.phone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız')
      } else {
        setSuccess(true)
      }
    } catch {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Başvurunuz Alındı</h2>
          <p className="text-gray-600 mb-6">
            Bilet kontrolörü hesabı yönetici onayına gönderildi. Onaylandıktan sonra e-posta
            ve şifre ile giriş yapabilirsiniz; onay öncesi giriş kabul edilmez.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Ana sayfa
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary-600">
            BiletOrg
          </Link>
          <p className="text-gray-600 mt-2 flex items-center justify-center gap-2">
            <ScanLine className="w-5 h-5" />
            Bilet kontrolörü başvurusu
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Giriş sayfasından farklıdır: burada yalnızca kontrolör hesabı için kayıt
            oluşturursunuz. Onay sonrası bilet okutma / giriş ekranlarını kullanacaksınız.
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Ad Soyad *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label">Telefon *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="input"
                required
                disabled={isLoading}
                placeholder="+90 …"
              />
            </div>
            <div>
              <label className="label">E-posta *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="label">Şifre *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pr-10"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Şifre tekrar *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="input"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Başvuruyu gönder'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <Link
              href="/login"
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Zaten onaylı hesabım var — giriş yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
