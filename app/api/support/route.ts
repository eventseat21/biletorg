import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { type, priority, subject, message, ticketId, orderId, name, email } = await request.json()

    // Debug log
    console.log('Support form data:', { type, priority, subject, message, ticketId, orderId, name, email })
    console.log('SMTP settings:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS ? '***' : 'NOT_SET'
    })

    // Validate required fields
    if (!type || !subject || !message || !name || !email) {
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

    // Check if we're in development (localhost)
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         process.env.NEXTAUTH_URL?.includes('localhost')

    if (isDevelopment) {
      // Test mode for development
      console.log('=== DEVELOPMENT MODE - Support form submission ===')
      console.log('Type:', type)
      console.log('Priority:', priority)
      console.log('From:', name, email)
      console.log('Subject:', subject)
      console.log('Message:', message)
      console.log('Ticket ID:', ticketId)
      console.log('Order ID:', orderId)
      console.log('=== END DEVELOPMENT MODE ===')

      const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase().slice(-6)}`
      return NextResponse.json(
        { 
          success: true, 
          message: 'Destek talebiniz başarıyla oluşturuldu! (Development Mode)',
          ticketNumber: ticketNumber
        },
        { status: 200 }
      )
    }

    // Production mode - send real email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'eventseat21@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    })

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase().slice(-6)}`

    // Email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">Yeni Destek Talebi</h2>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <p><strong>Talep Türü:</strong> ${type}</p>
            <p><strong>Öncelik:</strong> ${priority}</p>
            <p><strong>Ad Soyad:</strong> ${name}</p>
            <p><strong>E-posta:</strong> ${email}</p>
            ${ticketId ? `<p><strong>Bilet ID:</strong> ${ticketId}</p>` : ''}
            ${orderId ? `<p><strong>Sipariş ID:</strong> ${orderId}</p>` : ''}
            <p><strong>Konu:</strong> ${subject}</p>
            <p><strong>Talep Numarası:</strong> ${ticketNumber}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 5px;">
            <h3 style="color: #333; margin-bottom: 10px;">Mesaj:</h3>
            <p style="color: #666; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e9ecef;">
            <p style="color: #999; font-size: 12px;">
              Bu talep <a href="https://kurdevents.org/support" style="color: #007bff;">kurdevents.org/support</a> 
              sayfasından gönderilmiştir.
            </p>
          </div>
        </div>
      </div>
    `

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'eventseat21@gmail.com',
      to: 'eventseat21@gmail.com',
      subject: `Destek Talebi: ${subject} (${ticketNumber})`,
      html: emailContent,
      replyTo: email
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Destek talebiniz başarıyla oluşturuldu!',
        ticketNumber: ticketNumber
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Support form error:', error)
    return NextResponse.json(
      { error: 'Destek talebi oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
}
