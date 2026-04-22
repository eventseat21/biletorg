import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    await prisma.user.update({
      where: { email: 'admin@biletorg.com' },
      data: { password: 'Mehmetcan21!' }
    })
    
    return Response.json({ success: true, message: 'Password set to plain text' })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}