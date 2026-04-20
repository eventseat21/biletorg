import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import { sendEmail, getPasswordResetTemplate } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-posta adresi gerekli' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const token = generateToken(32)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    // Save token
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    await sendEmail({
      to: user.email,
      subject: 'Şifre Sıfırlama',
      html: getPasswordResetTemplate(resetUrl, user.name || ''),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}
