'use client'

import { useEffect, useState } from 'react'
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
import { DollarSign, TrendingUp, Ticket, Percent } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function AccountingPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/organizer/accounting?period=${period}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching accounting data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-64">Yükleniyor...</div>
  if (!data) return <div className="text-center text-gray-500">Veri bulunamadı</div>

  const chartData = {
    labels: data.revenueByDate.map((d: any) => d.date),
    datasets: [
      {
        label: 'Gelir (₺)',
        data: data.revenueByDate.map((d: any) => d.revenue),
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Gelir Grafiği' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Muhasebe</h1>
          <p className="text-gray-600 mt-1">Gelir raporları ve finansal özet</p>
        </div>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="input w-auto"
        >
          <option value="week">Son 7 Gün</option>
          <option value="month">Son 30 Gün</option>
          <option value="year">Son 1 Yıl</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Toplam Gelir"
          value={`${data.totalRevenue.toLocaleString('tr-TR')} ₺`}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          title="Platform Komisyonu"
          value={`${data.totalCommission.toLocaleString('tr-TR')} ₺`}
          subtitle={`${data.commissionRate}%`}
          icon={<Percent className="w-6 h-6 text-orange-600" />}
          color="orange"
        />
        <StatCard
          title="Net Kazanç"
          value={`${data.netRevenue.toLocaleString('tr-TR')} ₺`}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          color="green"
        />
        <StatCard
          title="Toplam Satış"
          value={data.totalSales.toString()}
          icon={<Ticket className="w-6 h-6 text-blue-600" />}
          color="blue"
        />
      </div>

      {/* Chart */}
      <div className="card p-6 mb-8">
        <Bar data={chartData} options={chartOptions} />
      </div>

      {/* Event Revenue Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Etkinlik Bazlı Gelir</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Etkinlik</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Satış</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Toplam</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Komisyon</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.eventRevenue.map((event: any) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                <td className="px-6 py-4 text-right">{event.sales}</td>
                <td className="px-6 py-4 text-right">{event.total.toLocaleString('tr-TR')} ₺</td>
                <td className="px-6 py-4 text-right text-orange-600">-{event.commission.toLocaleString('tr-TR')} ₺</td>
                <td className="px-6 py-4 text-right font-medium text-green-600">{event.net.toLocaleString('tr-TR')} ₺</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon, color }: {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  color: string
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50',
    orange: 'bg-orange-50',
    green: 'bg-green-50',
    blue: 'bg-blue-50',
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${colors[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
