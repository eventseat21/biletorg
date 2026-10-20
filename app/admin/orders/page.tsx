import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Banknote, RotateCcw } from 'lucide-react'
import { refundOrderForPage } from './actions'

export const dynamic = 'force-dynamic'

const TABS = [
  { key: 'paid', label: 'Ödenmiş', where: { paymentStatus: 'PAID' } },
  { key: 'refunded', label: 'İade edilmiş', where: { paymentStatus: 'REFUNDED' } },
  { key: 'pending', label: 'Bekleyen', where: { paymentStatus: 'PENDING' } },
] as const

type TabKey = (typeof TABS)[number]['key']

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { durum?: string; mesaj?: string; hata?: string }
}) {
  const tab: TabKey = TABS.some((t) => t.key === searchParams.durum) ? (searchParams.durum as TabKey) : 'paid'
  const where = TABS.find((t) => t.key === tab)!.where

  const [orders, sum] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        event: { select: { id: true, title: true, slug: true, startDate: true } },
        tickets: {
          select: {
            id: true,
            status: true,
            price: true,
            seat: { select: { row: true, number: true } },
            category: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.order.aggregate({ where, _sum: { totalAmount: true, platformFee: true, organizerAmount: true } }),
  ])

  const euro = (value: number) => `€${value.toFixed(2)}`

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Siparişler</h1>
      <p className="text-gray-600 mb-6">
        Ödemeler tek Stripe hesabından toplanır; iade edilen siparişin parası alıcıya geri aktarılır ve koltuklar satışa döner.
      </p>

      {searchParams.mesaj && (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{searchParams.mesaj}</p>
      )}
      {searchParams.hata && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{searchParams.hata}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/orders?durum=${t.key}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${t.key === tab ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {t.label}
          </Link>
        ))}
        <span className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <Banknote size={16} />
          {orders.length} sipariş · toplam {euro(sum._sum.totalAmount ?? 0)} · organizatör payı {euro(sum._sum.organizerAmount ?? 0)}
        </span>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">Bu durumda sipariş yok.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const used = order.tickets.some((ticket) => ticket.status === 'USED')
            return (
              <li key={order.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      <Link href={`/events/${order.event.slug}`} className="hover:underline">{order.event.title}</Link>
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.orderNumber} · {new Date(order.createdAt).toLocaleString('tr-TR')} ·{' '}
                      {new Date(order.event.startDate).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-sm text-gray-600">{order.customerName ?? '-'} · {order.customerEmail}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {order.tickets.map((ticket) => `${ticket.category.name}${ticket.seat ? ` ${ticket.seat.row}-${ticket.seat.number}` : ''} (${ticket.status})`).join(' · ')}
                    </p>
                    {order.paymentStatus === 'REFUNDED' && (
                      <p className="mt-1 text-xs text-red-700">
                        İade: {order.refundReason ?? '-'} {order.refundedAt ? new Date(order.refundedAt).toLocaleString('tr-TR') : ''} {order.stripeRefundId ? `· ${order.stripeRefundId}` : '· manuel ödeme gerekli'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{euro(order.totalAmount)}</p>
                    <p className="text-xs text-gray-500">
                      komisyon {euro(order.platformFee)} · organizatör {euro(order.organizerAmount)}
                    </p>
                  </div>
                </div>

                {order.paymentStatus === 'PAID' && (
                  <form
                    action={refundOrderForPage.bind(null, order.id)}
                    className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3"
                  >
                    <input
                      type="text"
                      name="reason"
                      maxLength={300}
                      placeholder="İade sebebi (alıcıya e-posta ile gider)"
                      className="input min-w-[18rem] flex-1 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={used}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RotateCcw size={16} />
                      {used ? 'Kapıdan geçmiş bilet' : 'Siparişi iade et'}
                    </button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
