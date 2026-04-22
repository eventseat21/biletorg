import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    console.log('=== TEST LOGIN ===')
    console.log('DB URL:', process.env.DATABASE_URL?.substring(0, 50))
    
    const body = await request.json()
    const { email, password } = body
    
    console.log('Looking for:', email)
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    console.log('User found:', !!user)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found in DB' })
    }
    
    console.log('Stored hash:', user.password)
    console.log('Input pass:', password)
    
    const match = await compare(password, user.password)
    console.log('Match:', match)
    
    return NextResponse.json({
      email: user.email,
      storedHash: user.password,
      passwordLength: password.length,
      match
    })
  } catch (e: any) {
    console.log('Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}