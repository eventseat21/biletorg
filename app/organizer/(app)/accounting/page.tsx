'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Banknote, Percent, Receipt, Download, Ticket } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type Ledger = {
  period: string
  commissionType: string | null
  commissionValue: number | null
  total: number
  fee: number
  net: number
  orders: number
  tickets: number
  eventRevenue: { id: string; title: string; orders: number; tickets: number; total: number; fee: number; net: number }[]
  revenueByDate: { date: string; revenue: number; net: number }[]
}

const eur = (value: number) => `€${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function commissionLabel(type: string | null, value: number | null): string {
  if (!type || value === null) return 'Ödeme anlaşman henüz belirlenmedi; admin etkinlik onayında kararlaştırır.'
  return type === 'FIXED_ADD'
    ? `Ödeme anlaşman: her bilet fiyatına ${eur(value)} Kurdevents ücreti eklenir.`
    : `Ödeme anlaşman: hasılattan %${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Kurdevents komisyonu kesilir.`
}

export default function AccountingPage() {
  const [data, setData] = useState<Ledger | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    let active = true
    setIsLoading(true)
    fetch(`/api/organizer/accounting?period=${period}`)
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || 'Defter yüklenemedi')
        if (active) { setData(json); setError('') }
      })
      .catch((fetchError) => { if (active) setError(fetchError instanceof Error ? fetchError.message : 'Defter yüklenemedi') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [period])

  const chartData = {
    labels: data?.revenueByDate.map((row) => row.date) ?? [],
    datasets: [
      { label: 'Brüt satış (€)', data: data?.revenueByDate.map((row) => row.revenue) ?? [], backgroundColor: 'rgba(220, 11, 44, 0.75)', borderRadius: 4 },
      { label: 'Sana kalan (€)', data: data?.revenueByDate.map((row) => row.net) ?? [], backgroundColor: 'rgba(16, 185, 129, 0.75)', borderRadius: 4 },
    ],
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Ödeme defteri</h1>
          <p className="mt-1 text-sm text-gray-600">Tahsilatı Kurdevents kendi Stripe hesabından yapar; bu defter sana ödenecek tutarı gösterir.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input w-auto bg-white">
            <option value="week">Son 7 gün</option>
            <option value="month">Son 30 gün</option>
            <option value="year">Son 1 yıl</option>
            <option value="all">Tüm dönem</option>
          </select>
          <Link
            href={`/api/organizer/accounting/export?period=${period}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            <Download size={16} /> CSV indir
          </Link>
        </div>
      </div>

      {error ? <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {isLoading && !data ? <p className="text-sm text-gray-500">Defter yükleniyor…</p> : null}

      {data ? (
        <>
          <p className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">{commissionLabel(data.commissionType, data.commissionValue)}</p>

          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Brüt satış" value={eur(data.total)} icon={<Receipt className="h-6 w-6 text-red-600" />} tone="bg-red-50" />
            <StatCard title="Kurdevents komisyonu" value={`−${eur(data.fee)}`} icon={<Percent className="h-6 w-6 text-orange-600" />} tone="bg-orange-50" />
            <StatCard title="Sana ödenecek" value={eur(data.net)} icon={<Banknote className="h-6 w-6 text-emerald-600" />} tone="bg-emerald-50" />
            <StatCard title="Satılan bilet" value={`${data.tickets}`} subtitle={`${data.orders} sipariş`} icon={<Ticket className="h-6 w-6 text-blue-600" />} tone="bg-blue-50" />
          </div>

          <div className="card mb-8 p-4 md:p-6">
            {data.revenueByDate.length === 0 ? (
              <p className="text-sm text-gray-500">Bu dönemde ödenmiş sipariş yok.</p>
            ) : (
              <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true } } }} />
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 p-4 md:p-6">
              <h2 className="text-lg font-semibold text-gray-900">Etkinlik bazında</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium md:px-6">Etkinlik</th>
                    <th className="px-4 py-3 text-right font-medium md:px-6">Bilet</th>
                    <th className="px-4 py-3 text-right font-medium md:px-6">Brüt</th>
                    <th className="px-4 py-3 text-right font-medium md:px-6">Komisyon</th>
                    <th className="px-4 py-3 text-right font-medium md:px-6">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.eventRevenue.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500 md:px-6">Bu dönemde satılmış bilet yok.</td></tr>
                  ) : data.eventRevenue.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 md:px-6">{row.title}</td>
                      <td className="px-4 py-3 text-right md:px-6">{row.tickets}</td>
                      <td className="px-4 py-3 text-right md:px-6">{eur(row.total)}</td>
                      <td className="px-4 py-3 text-right text-orange-600 md:px-6">−{eur(row.fee)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700 md:px-6">{eur(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, tone }: { title: string; value: string; subtitle?: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="card p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
    </div>
  )
}
