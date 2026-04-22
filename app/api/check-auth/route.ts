import { NextResponse } from 'next/server'
import { compare } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { email: 'admin@biletorg.com' },
      select: { email: true, name: true, role: true, password: true }
    })
    
    if (!users[0]) {
      return NextResponse.json({ error: 'User not found' })
    }
    
    const user = users[0]
    const testPassword = 'Mehmetcan21!'
    const match = await compare(testPassword, user.password)
    
    return NextResponse.json({ 
      email: user.email,
      storedHash: user.password,
      testPassword,
      match
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 })
  }
}