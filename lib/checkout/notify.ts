// Ödeme sonrası alıcıya giden bilet e-postası: kodlar + okunabilir QR görselleri.
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendEmail, type EmailAttachment } from '@/lib/email'
import { ticketQrPng } from '@/lib/tickets/qr'

const BRAND = '#DC0B2C'

function esc(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function euro(value: number): string {
  return `€${value.toFixed(2)}`
}

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_ORG_SITE_URL || process.env.NEXTAUTH_URL || 'https://kurdevents.org').replace(/\/$/, '')
}

const orderSelect = {
  id: true,
  orderNumber: true,
  totalAmount: true,
  paymentStatus: true,
  customerEmail: true,
  customerName: true,
  event: {
    select: {
      title: true,
      startDate: true,
      doorsOpen: true,
      hall: { select: { name: true, address: true } },
      organizer: { select: { companyName: true } },
    },
  },
  tickets: {
    select: {
      id: true,
      code: true,
      ticketNumber: true,
      price: true,
      status: true,
      seat: { select: { row: true, number: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.OrderSelect

type NotifyOrder = Prisma.OrderGetPayload<{ select: typeof orderSelect }>

function ticketBlock(ticket: NotifyOrder['tickets'][number], qrFile: string): string {
  return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="120" style="vertical-align:middle;">
              <img src="cid:${qrFile}" alt="${esc(ticket.code)} QR kodu" width="112" height="112" style="display:block;border:0;" />
            </td>
            <td style="vertical-align:middle;padding-left:14px;">
              <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">${esc(ticket.category.name)}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
                ${esc(ticket.category.name)} · ${ticket.seat ? `${esc(ticket.seat.row)}-${esc(ticket.seat.number)} · ` : ''}${euro(ticket.price)}
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">${esc(ticket.ticketNumber)}</p>
              <p style="margin:8px 0 0;font-size:16px;font-weight:700;letter-spacing:2px;color:${BRAND};">${esc(ticket.code)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

export function buildOrderEmailHtml(order: NotifyOrder, tickets: NotifyOrder['tickets'], orderUrl: string): string {
  const when = new Date(order.event.startDate).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })
  const place = [order.event.hall?.name, order.event.hall?.address].filter(Boolean).join(' · ')
  return `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;">
    <tr>
      <td style="background:${BRAND};padding:18px 24px;">
        <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">kurdevents.org</p>
        <p style="margin:2px 0 0;color:#ffe4e6;font-size:13px;">Biletlerin hazır</p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 6px;font-size:15px;color:#374151;">Merhaba ${esc(order.customerName || order.customerEmail)},</p>
        <h1 style="margin:0 0 4px;font-size:22px;color:#111827;">${esc(order.event.title)}</h1>
        <p style="margin:0;font-size:14px;color:#6b7280;">${esc(when)}${place ? ` · ${esc(place)}` : ''}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#9ca3af;">Düzenleyen: ${esc(order.event.organizer.companyName)}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
          ${tickets.map((ticket) => ticketBlock(ticket, `qr-${ticket.id}`)).join('')}
        </table>

        <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">
          Kapıda telefonundaki QR kodu veya 16 haneli bilet kodu okutulur. Her kod yalnız bir kez giriş verir.
        </p>
        <p style="margin:10px 0 0;font-size:13px;color:#6b7280;">
          Sipariş no <strong>${esc(order.orderNumber)}</strong> · Ödenen <strong>${euro(order.totalAmount)}</strong>
        </p>
        <p style="margin:16px 0 0;">
          <a href="${esc(orderUrl)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:600;">
            Biletlerimi gör
          </a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 24px;background:#f9fafb;font-size:12px;color:#9ca3af;">
        Bu e-posta kurdevents.org tarafından ödeme tamamlandığında otomatik gönderilir.
      </td>
    </tr>
  </table>
</div>
  `
}

/**
 * Ödenmiş siparişin biletlerini e-postayla gönderir.
 * Çağıran taraf (Stripe webhook) e-posta hatasında ödemi geri almamalı; hata burada yutulur.
 */
export async function notifyOrderPaid(
  orderId: string,
): Promise<{ sent: boolean; reason: string; recipients?: number }> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: orderSelect })
    if (!order) return { sent: false, reason: 'order-missing' }
    if (order.paymentStatus !== 'PAID') return { sent: false, reason: 'unpaid' }
    if (!order.customerEmail) return { sent: false, reason: 'no-recipient' }

    const tickets = order.tickets.filter((ticket) => ticket.code && ticket.status !== 'CANCELLED')
    if (tickets.length === 0) return { sent: false, reason: 'no-codes' }

    const attachments: EmailAttachment[] = await Promise.all(
      tickets.map(async (ticket, index) => ({
        filename: `bilet-${index + 1}.png`,
        content: await ticketQrPng(ticket.code as string),
        cid: `qr-${ticket.id}`,
      })),
    )

    const orderUrl = `${siteBase()}/user/orders/${order.id}`
    const info = await sendEmail({
      to: order.customerEmail,
      subject: `Biletlerin hazır — ${order.event.title}`,
      html: buildOrderEmailHtml(order, tickets, orderUrl),
      attachments,
    })
    const mocked = info.messageId === 'mock'

    return { sent: !mocked, reason: mocked ? 'smtp-not-configured' : 'sent', recipients: tickets.length }
  } catch (error) {
    console.error('[notify] bilet e-postası gönderilemedi:', orderId, error)
    return { sent: false, reason: 'error' }
  }
}
