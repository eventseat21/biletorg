import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Ticket, Calendar, ChevronRight, Clock, MapPin, Bell, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=/user/dashboard')

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      createdAt: true,
      event: { select: { id: true, title: true, slug: true, startDate: true, hall: { select: { name: true } } } },
      tickets: { select: { id: true, status: true, category: { select: { name: true, color: true } } } },
    },
  })

  const activeTickets = orders.reduce(
    (sum, order) => sum + order.tickets.filter((ticket) => ticket.status === 'ACTIVE').length,
    0,
  )
  const pendingOrders = orders.filter((order) => order.paymentStatus === 'PENDING' && order.status !== 'CANCELLED').length
  const paidTotal = orders
    .filter((order) => order.paymentStatus === 'PAID')
    .reduce((sum, order) => sum + order.totalAmount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">kurdevents.org</span>
          </Link>
          <span className="text-sm text-gray-600">{session.user.name || session.user.email}</span>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Hoş Geldiniz, {(session.user.name || 'Kullanıcı').split(' ')[0]}!
          </h1>
          <p className="mt-1 text-gray-600">Biletlerinizi ve siparişlerinizi buradan izleyin.</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Stat icon={<Ticket className="h-6 w-6 text-indigo-600" />} tint="bg-indigo-100" label="Kullanılmamış bilet" value={String(activeTickets)} />
          <Stat icon={<Clock className="h-6 w-6 text-amber-600" />} tint="bg-amber-100" label="Bekleyen sipariş" value={String(pendingOrders)} />
          <Stat icon={<Wallet className="h-6 w-6 text-green-600" />} tint="bg-green-100" label="Toplam ödeme" value={`€${paidTotal.toFixed(2)}`} />
        </div>

        <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Siparişlerim</h2>
          </div>
          {orders.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">
              Henüz bir siparişiniz yok.{' '}
              <Link href="/events" className="font-medium text-indigo-600 hover:text-indigo-700">
                Etkinliklere göz atın
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map((order) => {
                const paid = order.paymentStatus === 'PAID'
                return (
                  <Link
                    key={order.id}
                    href={`/user/orders/${order.id}`}
                    className="flex items-start justify-between gap-4 p-6 transition-colors hover:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900">{order.event.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.event.startDate).toLocaleString('tr-TR')}
                        </span>
                        {order.event.hall?.name ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {order.event.hall.name}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" />
                          {order.tickets.length} bilet · {order.orderNumber}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {order.tickets.map((ticket) => (
                          <span
                            key={ticket.id}
                            className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
                            style={{ backgroundColor: `${ticket.category.color}1a`, color: ticket.category.color }}
                          >
                            {ticket.category.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-sm ${
                          paid
                            ? 'bg-green-100 text-green-700'
                            : order.paymentStatus === 'REFUNDED'
                              ? 'bg-gray-100 text-gray-700'
                              : order.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {paid
                          ? 'Ödendi'
                          : order.paymentStatus === 'REFUNDED'
                            ? 'İade edildi'
                            : order.status === 'CANCELLED'
                              ? 'İptal'
                              : 'Bekliyor'}
                      </span>
                      <span className="font-semibold text-gray-900">€{order.totalAmount.toFixed(2)}</span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/events" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Etkinlikler
          </Link>
          <Link href="/support" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Bell className="h-4 w-4" />
            Destek Al
          </Link>
        </div>
      </div>
    </div>
  )
}

function Stat({ icon, tint, label, value }: { icon: React.ReactNode; tint: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
