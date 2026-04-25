'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/password-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      })

      const raw = await res.text()
      let data: { ok?: boolean; role?: string; error?: string } = {}
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data
        } catch {
          setError(
            `Sunucu beklenmeyen yanıt döndü (${res.status}). Sayfayı yenileyip tekrar deneyin.`
          )
          return
        }
      } else if (!res.ok) {
        setError(`Sunucu yanıt vermedi (${res.status}).`)
        return
      }

      if (!res.ok) {
        setError(
          data.error || 'E-posta veya şifre hatalı'
        )
        return
      }

      const callbackUrl = searchParams.get('callbackUrl')
      if (callbackUrl?.startsWith('/')) {
        window.location.href = callbackUrl
        return
      }

      const role = data.role as string
      if (role === 'ADMIN') {
        window.location.href = '/admin'
      } else if (role === 'ORGANIZER') {
        window.location.href = '/organizer'
      } else if (role === 'CHECKER') {
        window.location.href = '/checker'
      } else {
        window.location.href = '/user/dashboard'
      }
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-primary-600">
          BiletOrg
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mb-4">
          Giriş: e-posta ve şifre. Yeni hesap yalnızca organizatör veya bilet kontrolörü
          başvurusu ile açılır; admin onayı gerekir.
        </p>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
          <p>
            <a href="/organizer/register" className="text-primary-600 font-medium">
              Organizatör başvurusu
            </a>
            {' · '}
            <a href="/checker/register" className="text-primary-600 font-medium">
              Kontrolör başvurusu
            </a>
            {' · '}
            <a href="/" className="text-gray-500">
              Ana sayfa
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
