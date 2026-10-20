import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export type EmailAttachment = {
  filename: string
  content: Buffer
  cid: string
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string
  subject: string
  html: string
  attachments?: EmailAttachment[]
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email would be sent:', { to, subject, attachments: attachments?.length ?? 0 })
    return { success: true, messageId: 'mock' }
  }

  try {
    const info = await transporter.sendMail({
      from: `"kurdevents.org" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}

export function getPasswordResetTemplate(resetUrl: string, name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Şifre Sıfırlama</h2>
      <p>Merhaba ${name},</p>
      <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Şifremi Sıfırla
      </a>
      <p style="margin-top: 20px; color: #666;">
        Bu bağlantı 24 saat geçerlidir. Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelin.
      </p>
    </div>
  `
}

export function getOrganizerApprovalTemplate(
  organizerName: string,
  status: 'approved' | 'rejected',
  reason?: string,
  commissionNote?: string,
): string {
  if (status === 'approved') {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Organizatör Hesabınız Onaylandı!</h2>
        <p>Merhaba ${organizerName},</p>
        <p>Organizatör hesabınız başarıyla onaylandı. Artık etkinlikler oluşturabilir ve bilet satışına başlayabilirsiniz.</p>
        ${commissionNote ? `<p style="background:#f3f4f6;border-left:4px solid #10b981;padding:10px 14px;margin:18px 0;">${commissionNote}</p>` : ''}
        <a href="${process.env.NEXTAUTH_URL}/organizer" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Panele Git
        </a>
      </div>
    `
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Organizatör Başvurunuz Reddedildi</h2>
      <p>Merhaba ${organizerName},</p>
      <p>Maalesef organizatör başvurunuz reddedildi.</p>
      ${reason ? `<p><strong>Sebep:</strong> ${reason}</p>` : ''}
      <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
    </div>
  `
}

/** Organizatör: para modeli talebinin yönetici kararı. */
export function getCommissionDecisionTemplate(
  organizerName: string,
  accepted: boolean,
  summary: string,
  reason?: string | null,
): string {
  const esc = (value: string) => value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${accepted ? '#10b981' : '#dc2626'};">
        ${accepted ? 'Para modeli talebiniz onaylandı' : 'Para modeli talebiniz reddedildi'}
      </h2>
      <p>Merhaba ${esc(organizerName)},</p>
      ${accepted
        ? `<p>Talebiniz yürürlüğe girdi. Yeni etkinliklerinizde bu anlaşma varsayılan olur:</p>
           <p style="background:#f3f4f6;border-left:4px solid #10b981;padding:10px 14px;margin:18px 0;">${esc(summary)}</p>
           <p>Etkinlik bazında farklı bir anlaşma isterseniz etkinlik onayında admin bunu düzenleyebilir.</p>`
        : `<p>Talebiniz kabul edilmedi; mevcut anlaşmanız değişmedi.</p>
           ${reason ? `<p><strong>Sebep:</strong> ${esc(reason)}</p>` : ''}`}
      <a href="${process.env.NEXTAUTH_URL}/organizer/settings" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Panele Git
      </a>
    </div>
  `
}

/** Alıcı: siparişin iade edildiği bildirimi. */
export function getRefundTemplate(
  customerName: string,
  orderNumber: string,
  eventTitle: string,
  amount: number,
  reason: string,
  stripeProcessed: boolean,
): string {
  const esc = (value: string) => value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Siparişiniz iade edildi</h2>
      <p>Merhaba ${esc(customerName)},</p>
      <p><strong>${esc(eventTitle)}</strong> etkinliği için ${esc(orderNumber)} numaralı siparişiniz iptal edildi ve
         <strong>€${amount.toFixed(2)}</strong> tutar ${stripeProcessed ? 'ödeme yönteminize iade edildi' : 'ödeme yönteminize manuel olarak aktarılacak'}.</p>
      ${reason ? `<p><strong>Sebep:</strong> ${esc(reason)}</p>` : ''}
      <p>Biletleriniz geçersiz kılınmıştır; kapıda okutulamaz. Sorularınız için bizimle iletişime geçebilirsiniz.</p>
      <a href="${process.env.NEXTAUTH_URL}/user/dashboard" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Siparişlerim
      </a>
    </div>
  `
}
