import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { SignJWT } from 'jose'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret-key')

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('Login attempt:', email)
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user || !user.password) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }
    
    const isValid = await compare(password, user.password)
    
    if (!isValid) {
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 })
    }
    
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
    
    return NextResponse.json({ 
      token,
      user: { email: user.email, name: user.name, role: user.role }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}