import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

/** Dev-only: reset admin password to a bcrypt hash. Never store plain text. */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const plain = process.env.DEV_ADMIN_PASSWORD || 'Mehmetcan21!'
    const hashed = await hashPassword(plain)
    await prisma.user.update({
      where: { email: 'admin@biletorg.com' },
      data: { password: hashed },
    })

    return NextResponse.json({
      success: true,
      message: 'Admin password reset (bcrypt) for local dev only',
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
