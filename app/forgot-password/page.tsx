'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Bir hata oluştu')
      } else {
        setIsSent(true)
      }
    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">E-posta Gönderildi!</h2>
          <p className="text-gray-600 mb-6">
            {email} adresine şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.
          </p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            Giriş sayfasına dön
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
          <p className="text-gray-600 mt-2">Şifrenizi sıfırlayın</p>
        </div>

        <div className="card p-8">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
          >
            <ArrowLeft size={16} />
            Girişe dön
          </Link>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Şifre sıfırlama bağlantısı göndermemiz için kayıtlı e-posta adresinizi girin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">E-posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                'Sıfırlama Bağlantısı Gönder'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
