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

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email would be sent:', { to, subject })
    return { success: true, messageId: 'mock' }
  }

  try {
    const info = await transporter.sendMail({
      from: `"BiletOrg" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
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

export function getOrganizerApprovalTemplate(organizerName: string, status: 'approved' | 'rejected', reason?: string): string {
  if (status === 'approved') {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Organizatör Hesabınız Onaylandı!</h2>
        <p>Merhaba ${organizerName},</p>
        <p>Organizatör hesabınız başarıyla onaylandı. Artık etkinlikler oluşturabilir ve bilet satışına başlayabilirsiniz.</p>
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
