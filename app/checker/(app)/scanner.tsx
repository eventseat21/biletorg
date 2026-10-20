'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, Loader2, LogIn, ScanLine, XCircle } from 'lucide-react'

type Ticket = {
  id: string
  code: string | null
  ticketNumber: string
  price: number
  checkedInAt: string | null
  category: { name: string; color: string }
  event: { id: string; title: string; slug: string; startDate: string }
  holder: { name: string | null; email: string }
}

type Result =
  | { state: 'ok'; ticket: Ticket }
  | { state: 'used'; ticket: Ticket }
  | { state: 'admitted'; ticket: Ticket }
  | { state: 'error'; message: string }

export default function Scanner() {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setCode('')
    setResult(null)
    inputRef.current?.focus()
  }

  const post = async (payload: Record<string, string>) => {
    const res = await fetch('/api/checker/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return { status: res.status, data: (await res.json()) as Result & { error?: string } }
  }

  const verify = async () => {
    const value = code.trim()
    if (!value || busy) return
    setBusy(true)
    try {
      const { status, data } = await post({ code: value })
      if (data.state === 'ok' || data.state === 'used') setResult(data)
      else if (status === 429) setResult({ state: 'error', message: data.error ?? 'Çok hızlı okuma, biraz bekleyin.' })
      else setResult({ state: 'error', message: (data as { message?: string }).message ?? data.error ?? 'Bilet doğrulanamadı.' })
    } catch {
      setResult({ state: 'error', message: 'Sunucuya ulaşılamadı, tekrar deneyin.' })
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const admit = async (ticket: Ticket) => {
    if (busy) return
    setBusy(true)
    try {
      const { status, data } = await post({ ticketId: ticket.id })
      const stamp = (data as { checkedInAt?: string | null }).checkedInAt
      if (status === 429) setResult({ state: 'error', message: data.error ?? 'Çok hızlı okuma, biraz bekleyin.' })
      else if (status === 200) setResult({ state: 'admitted', ticket: { ...ticket, checkedInAt: stamp ?? new Date().toISOString() } })
      else setResult({ state: 'used', ticket: { ...ticket, checkedInAt: stamp ?? null } })
    } catch {
      setResult({ state: 'error', message: 'Giriş kaydedilemedi, tekrar deneyin.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Bilet okutma</h1>
      <p className="mb-6 text-slate-400">
        Bilet sayfasındaki kodu yazın veya yapıştırın. Okutma yalnızca bileti doğrular; giriş
        ayrı düğmeyle işaretlenir.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void verify()
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          ref={inputRef}
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-4 font-mono text-lg tracking-widest text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || code.trim().length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
          Doğrula
        </button>
      </form>

      {result ? (
        <div
          className={`mt-6 rounded-xl border p-6 ${
            result.state === 'admitted'
              ? 'border-emerald-500 bg-emerald-950/60'
              : result.state === 'ok'
                ? 'border-emerald-700 bg-slate-900'
                : result.state === 'used'
                  ? 'border-amber-600 bg-amber-950/40'
                  : 'border-red-700 bg-red-950/40'
          }`}
        >
          {result.state === 'error' ? (
            <div>
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-400" />
                <div>
                  <p className="text-lg font-semibold text-red-200">Geçersiz bilet</p>
                  <p className="text-red-300/80">{result.message}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-5 rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800"
              >
                Yeni okutma
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                {result.state === 'ok' || result.state === 'admitted' ? (
                  <CheckCircle2 className={`h-7 w-7 shrink-0 ${result.state === 'admitted' ? 'text-emerald-400' : 'text-emerald-500'}`} />
                ) : (
                  <XCircle className="h-7 w-7 shrink-0 text-amber-400" />
                )}
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-white">
                    {result.state === 'admitted'
                      ? 'Giriş kaydedildi'
                      : result.state === 'ok'
                        ? 'Bilet geçerli'
                        : 'Bu bilet daha önce kullanılmış'}
                  </p>
                  <p className="truncate text-sm text-slate-400">
                    {result.ticket.event.title} ·{' '}
                    {new Date(result.ticket.event.startDate).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Kategori</dt>
                  <dd className="flex items-center gap-2 font-medium text-white">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: result.ticket.category.color }} />
                    {result.ticket.category.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Bilet</dt>
                  <dd className="font-medium text-white">{result.ticket.ticketNumber}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Sahibi</dt>
                  <dd className="font-medium text-white">{result.ticket.holder.name || result.ticket.holder.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">{result.ticket.checkedInAt ? 'İlk giriş' : 'Durum'}</dt>
                  <dd className="font-medium text-white">
                    {result.ticket.checkedInAt
                      ? new Date(result.ticket.checkedInAt).toLocaleString('tr-TR')
                      : 'Henüz giriş yapılmadı'}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {result.state === 'ok' ? (
                  <button
                    type="button"
                    onClick={() => admit(result.ticket)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <LogIn className="h-5 w-5" />
                    Giriş işaretle
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Yeni okutma
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
