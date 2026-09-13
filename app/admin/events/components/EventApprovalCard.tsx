'use client'

import { useState } from 'react'

type ApprovalEvent = {
  id: string
  slug: string
  title: string
  organizer: { companyName: string; companyEmail: string }
  hall: { name: string; capacity: number } | null
  startDate: string
  commissionType: string
  commissionValue: number
  status?: string
  salesSyncStatus?: string | null
  salesSyncError?: string | null
}

export default function EventApprovalCard({ event }: { event: ApprovalEvent }) {
  const [type, setType] = useState<'PERCENT_DEDUCT' | 'FIXED_ADD'>(event.commissionType === 'FIXED_ADD' ? 'FIXED_ADD' : 'PERCENT_DEDUCT')
  const [value, setValue] = useState(String(event.commissionValue ?? 0))
  const [publishOrg, setPublishOrg] = useState(true)
  const [publishCom, setPublishCom] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ publicUrl: string | null; orgUrl: string; embedCode: string | null } | null>(null)
  const [message, setMessage] = useState('')

  const approve = async () => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/events/${event.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionType: type, commissionValue: value, publishOrg, publishCom }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.details || data.error || 'Onay başarısız')
      setResult(data.links)
      setMessage(`Onaylandı. Bağlantılar ${data.email} adresine gönderilmeye hazır.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Onay başarısız')
    } finally {
      setBusy(false)
    }
  }

  const syncAgain = async () => {
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/admin/events/${event.id}/sync`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.details || data.error || 'Sync başarısız')
      setMessage('Satış platformu aktarımı başarıyla tekrarlandı.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sync başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="card space-y-4 p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
        <p className="text-sm text-gray-600">{event.organizer.companyName} · {event.organizer.companyEmail}</p>
        <p className="text-sm text-gray-600">{new Date(event.startDate).toLocaleString('tr-TR')} · Salon: {event.hall?.name || 'Seçilmemiş'}</p>
      </div>
      {event.salesSyncStatus ? <p className={`rounded border p-3 text-sm ${event.salesSyncStatus === 'FAILED' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}><strong>Satış platformu aktarımı:</strong> {event.salesSyncStatus}{event.salesSyncError ? ` — ${event.salesSyncError}` : ''}</p> : null}
      {event.status === 'PUBLISHED' ? (
        <button type="button" onClick={syncAgain} disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Tekrar aktarılıyor…' : 'Satış platformunu tekrar senkronize et'}</button>
      ) : (
        <>
          <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 md:grid-cols-2">
            <label className="text-sm text-blue-950">Komisyon yöntemi<select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input mt-1 w-full bg-white"><option value="PERCENT_DEDUCT">Organizatörden yüzde kes</option><option value="FIXED_ADD">Bilet fiyatına sabit ücret ekle</option></select></label>
            <label className="text-sm text-blue-950">{type === 'FIXED_ADD' ? 'Bilet başına ek ücret (€)' : 'Komisyon oranı (%)'}<input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="input mt-1 w-full bg-white" /></label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={publishOrg} onChange={(e) => setPublishOrg(e.target.checked)} /> kurdevents.org’da yayınla</label><label className="flex items-center gap-2"><input type="checkbox" checked={publishCom} onChange={(e) => setPublishCom(e.target.checked)} /> kurdevents.com’da yayınla</label></div>
          <button type="button" onClick={approve} disabled={busy || (!publishOrg && !publishCom)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{busy ? 'Onaylanıyor…' : 'Onayla ve yayınla'}</button>
        </>
      )}
      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
      {result ? <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs"><p><strong>.org:</strong> {result.orgUrl}</p><p><strong>.com:</strong> {result.publicUrl}</p><p><strong>Embed:</strong> {result.embedCode}</p></div> : null}
    </li>
  )
}
