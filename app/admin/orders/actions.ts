'use server'

import { redirect } from 'next/navigation'
import { requireAdminId } from '@/lib/approvals'
import { CheckoutError } from '@/lib/checkout/errors'
import { refundOrder } from '@/lib/checkout/refund'

function message(error: unknown): string {
  return error instanceof CheckoutError ? error.message : 'İade yapılamadı, tekrar deneyin.'
}

export async function refundOrderForPage(orderId: string, formData: FormData) {
  const adminId = await requireAdminId()
  const reason = String(formData.get('reason') ?? '').trim() || 'Yönetici tarafından iade'
  try {
    const result = await refundOrder(orderId, { reason, adminId })
    const viaStripe = result.stripeRefundId ? ' · Stripe üzerinden' : ' · ödeme manuel aktarılacak'
    redirect(`/admin/orders?mesaj=${encodeURIComponent(`${result.orderNumber} iade edildi: €${result.amount.toFixed(2)}${viaStripe}`)}`)
  } catch (error) {
    console.error('[admin refund] iade başarısız:', orderId, error)
    redirect(`/admin/orders?hata=${encodeURIComponent(message(error))}`)
  }
}
