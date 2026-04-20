import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Geçersiz istek' },
        { status: 400 }
      )
    }

    // Find valid token
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş bağlantı' },
        { status: 400 }
      )
    }

    // Update password
    const hashedPassword = await hashPassword(password)
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    })

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}
