import { compare } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { email: true, name: true, role: true, password: true }
    })
    
    const testResult = users[0]?.password ? await compare('Mehmetcan21!', users[0].password) : false
    
    return Response.json({ 
      users: users.map(u => ({ email: u.email, role: u.role, password: u.password?.substring(0, 30) })),
      testPassword: 'Mehmetcan21!',
      testResult
    })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}