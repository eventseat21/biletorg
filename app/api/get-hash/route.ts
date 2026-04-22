import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@biletorg.com' },
      select: { email: true, password: true }
    })
    
    return Response.json({
      found: !!user,
      email: user?.email,
      hash: user?.password,
      hashLength: user?.password?.length
    })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}