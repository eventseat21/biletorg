import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-12345'
const secret = new TextEncoder().encode(JWT_SECRET)

export async function GET(request: Request) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }
    
    const { payload } = await jwtVerify(token, secret)
    
    return NextResponse.json({
      user: {
        email: payload.email,
        name: payload.email?.split('@')[0],
        role: payload.role
      }
    })
  } catch (e) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}