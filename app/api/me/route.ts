import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        email: session.user.email,
        name: session.user.name ?? session.user.email.split('@')[0] ?? '',
        role: session.user.role,
      },
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
