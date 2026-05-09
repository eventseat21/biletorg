import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const FORM_RECIPIENT_EMAIL = 'eventseat21@gmail.com'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await request.json()

    // Debug log
    console.log('Contact form data:', { name, email, phone, subject, message })
    console.log('SMTP settings:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '***' : 'NOT_SET'
    })

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Lütfen tüm zorunlu alanları doldurun' },
        { status: 400 }
      )
    }

    // Check if SMTP credentials are configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: 'Mail sunucusu yapılandırılmamış. Lütfen sistem yöneticisi ile iletişime geçin.' },
        { status: 500 }
      )
    }

    console.log('Attempting to send contact form email...')
    console.log('SMTP Settings:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '***SET***' : 'NOT_SET',
      recipient: FORM_RECIPIENT_EMAIL,
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL
    })

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || FORM_RECIPIENT_EMAIL,
        pass: process.env.SMTP_PASS?.replace(/\s/g, '') || 'your-app-password'
      }
    })

    // Email content (commented out for testing)
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Yeni İletişim Mesajı</h2>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <p><strong>Gönderen:</strong> ${name}</p>
            <p><strong>E-posta:</strong> ${email}</p>
            ${phone ? `<p><strong>Telefon:</strong> ${phone}</p>` : ''}
            <p><strong>Konu:</strong> ${subject}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px;">
            <h3 style="color: #333; margin-bottom: 10px;">Mesaj:</h3>
            <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 12px;">
              Bu mesaj <a href="https://kurdevents.org/contact" style="color: #007bff;">kurdevents.org/contact</a> 
              sayfasından gönderilmiştir.
            </p>
          </div>
        </div>
      </div>
    `

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER || FORM_RECIPIENT_EMAIL,
      to: FORM_RECIPIENT_EMAIL,
      subject: `İletişim Formu: ${subject}`,
      html: emailContent,
      replyTo: email
    })

    return NextResponse.json(
      { success: true, message: 'Mesajınız başarıyla gönderildi!' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Mesaj gönderilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
