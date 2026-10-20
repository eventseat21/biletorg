import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { findUserOrder } from '@/lib/checkout/orders'
import { ticketQrSvg } from '@/lib/tickets/qr'
import Header from '@/components/header'
import LanguageSwitch from '@/components/LanguageSwitch'
import RefreshWhilePending from '../refresh-while-pending'
import { intlLocale, t, tf } from '@/lib/i18n'
import { getLocale } from '@/lib/i18n-server'

export const dynamic = 'force-dynamic'

export default async function UserOrderPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { durum?: string }
}) {
  const locale = getLocale()
  const intl = intlLocale(locale)
  const euro = (value: number) => new Intl.NumberFormat(intl, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(value)
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto max-w-xl px-4 pb-12 pt-32 text-sm text-gray-700">
          {t(locale, 'loginForOrder')}{' '}
          <Link className="font-semibold text-indigo-600" href={`/login?callbackUrl=${encodeURIComponent(`/user/orders/${params.id}`)}`}>
            {t(locale, 'signIn')}
          </Link>
        </main>
      </div>
    )
  }

  const order = await findUserOrder(params.id, session.user.id)
  if (!order) notFound()

  const paid = order.paymentStatus === 'PAID'
  const refunded = order.paymentStatus === 'REFUNDED'

  const qrByTicket = new Map<string, string>()
  if (paid) {
    const rendered = await Promise.all(
      order.tickets
        .filter((ticket) => ticket.code)
        .map(async (ticket) => [ticket.id, await ticketQrSvg(ticket.code as string)] as const),
    )
    for (const [id, svg] of rendered) qrByTicket.set(id, svg)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 pb-16 pt-28">
        <div className="mb-4 flex justify-end">
          <LanguageSwitch next={`/user/orders/${params.id}`} />
        </div>
        {!paid && searchParams.durum === 'basarili' ? <RefreshWhilePending /> : null}

        <div
          className={`rounded-2xl border p-6 ${
            paid ? 'border-green-200 bg-green-50' : refunded || order.status === 'CANCELLED' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            {paid ? <CheckCircle2 className="text-green-600" size={22} /> : <ShieldCheck className={refunded ? 'text-red-600' : 'text-amber-600'} size={22} />}
            {paid
              ? t(locale, 'paymentReceived')
              : refunded
                ? t(locale, 'orderRefunded')
                : order.status === 'CANCELLED'
                  ? t(locale, 'orderCancelled')
                  : t(locale, 'paymentVerifying')}
          </p>
          <p className="mt-2 text-sm text-gray-700">
            {t(locale, 'orderNo')}: <strong>{order.orderNumber}</strong> · {new Date(order.createdAt).toLocaleString(intl)}
          </p>
          {refunded ? (
            <p className="mt-2 text-sm text-red-800">
              {tf(locale, 'refundTransferred', {
                amount: euro(order.totalAmount),
                when: order.refundedAt ? new Date(order.refundedAt).toLocaleString(intl) : t(locale, 'refundSoon'),
              })}
              {order.refundReason ? ` ${tf(locale, 'refundReason', { reason: order.refundReason })}` : ''} {t(locale, 'ticketsInvalidNow')}
            </p>
          ) : null}
          {!paid && !refunded && order.status !== 'CANCELLED' ? (
            <p className="mt-2 text-xs text-gray-600">{t(locale, 'autoRefreshNote')}</p>
          ) : null}
        </div>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">{order.event.title}</h1>
          <p className="mt-1 text-sm text-gray-600">{new Date(order.event.startDate).toLocaleString(intl)}</p>

          <div className="mt-5 space-y-3">
            {order.tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800">{ticket.category.name}</p>
                  <p className="text-xs text-gray-500">
                    {ticket.seat ? `${t(locale, 'seat')} ${ticket.seat.row}-${ticket.seat.number} · ` : ''}{euro(ticket.price)} ·{' '}
                    {ticket.status === 'ACTIVE'
                      ? t(locale, 'statusActive')
                      : ticket.status === 'USED'
                        ? ticket.checkedInAt
                          ? `${t(locale, 'statusEntered')} · ${new Date(ticket.checkedInAt).toLocaleString(intl)}`
                          : t(locale, 'statusUsed')
                        : ticket.status === 'CANCELLED'
                          ? t(locale, 'statusCancelled')
                          : ticket.status === 'REFUNDED'
                            ? t(locale, 'statusRefunded')
                            : t(locale, 'statusPending')}
                  </p>
                </div>
                {paid && ticket.code ? (
                  <div className="ml-4 shrink-0 text-center">
                    <div className="[&_svg]:h-24 [&_svg]:w-24" dangerouslySetInnerHTML={{ __html: qrByTicket.get(ticket.id) ?? '' }} />
                    <p className="mt-1 text-xs font-semibold tracking-widest text-gray-700">{ticket.code}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {paid ? <p className="mt-3 text-xs text-gray-500">{t(locale, 'doorHint')}</p> : null}

          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
            <span className="text-gray-600">{t(locale, 'totalPaid')}</span>
            <span className="font-semibold text-gray-900">{euro(order.totalAmount)}</span>
          </div>
        </section>

        <Link href={`/events/${order.event.slug}`} className="mt-6 inline-block text-sm text-indigo-600 hover:text-indigo-700">
          ← {t(locale, 'backToEvent')}
        </Link>
      </main>
    </div>
  )
}
