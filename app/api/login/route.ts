import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 })
    }
    
    const isValid = await compare(password, user.password)
    
    if (!isValid) {
      return NextResponse.json({ error: 'Şifre hatalı' }, { status: 401 })
    }
    
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email,
      role: user.role || 'USER'
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
    
    const response = NextResponse.json({ 
      success: true,
      user: { email: user.email, name: user.name, role: user.role }
    })
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    return response
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}