import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password, name, role, ...rest } = body
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const r = role === 'ORGANIZER' ? 'ORGANIZER' : role === 'CHECKER' ? 'CHECKER' : 'USER'

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'E-posta, ad soyad ve şifre zorunludur' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(String(password))

    if (r === 'ORGANIZER') {
      const companyName = String(rest.companyName || '').trim()
      const companyPhone = String(rest.companyPhone || '').trim()
      if (!companyName) {
        return NextResponse.json(
          { error: 'Firma adı zorunludur' },
          { status: 400 }
        )
      }
      if (!companyPhone) {
        return NextResponse.json(
          { error: 'Telefon numarası zorunludur' },
          { status: 400 }
        )
      }

      const orgDisplay = String(rest.organizationDisplayName || '').trim()
      const userPhone = String(rest.userPhone || rest.contactPhone || '').trim()

      const user = await createUserLegacySafe({
        email,
        name: String(name).trim(),
        phone: userPhone || null,
        password: hashedPassword,
        role: 'ORGANIZER',
        status: 'PENDING',
      })

      await createOrganizerLegacySafe(user.id, {
        companyName,
        organizationDisplayName: orgDisplay || null,
        companyEmail: email,
        companyPhone,
        taxNumber: rest.taxNumber ? String(rest.taxNumber).trim() : null,
        website: rest.website ? String(rest.website).trim() : null,
        description: rest.description ? String(rest.description).trim() : null,
        address: rest.address ? String(rest.address).trim() : null,
        city: rest.city ? String(rest.city).trim() : null,
        country: rest.country ? String(rest.country).trim() : 'Türkiye',
        postalCode: rest.postalCode ? String(rest.postalCode).trim() : null,
        status: 'PENDING',
      })

      return NextResponse.json({
        success: true,
        message:
          'Organizatör başvurunuz alındı. Yönetici onayından sonra giriş yapabilirsiniz.',
      })
    }

    if (r === 'CHECKER') {
      const phone = String(rest.phone || '').trim()
      if (!phone) {
        return NextResponse.json(
          { error: 'Telefon numarası zorunludur' },
          { status: 400 }
        )
      }

      const user = await createUserLegacySafe({
        email,
        name: String(name).trim(),
        phone,
        password: hashedPassword,
        role: 'CHECKER',
        status: 'PENDING',
      })

      await createTicketCheckerLegacySafe(user.id, phone)

      return NextResponse.json({
        success: true,
        message:
          'Bilet kontrolörü başvurunuz alındı. Yönetici onayından sonra giriş yapabilirsiniz.',
      })
    }

    // Normal bilet alıcı
    await prisma.user.create({
      data: {
        email,
        name: String(name).trim(),
        password: hashedPassword,
        role: 'USER',
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Hesabınız başarıyla oluşturuldu.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Kayıt işlemi sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}

async function createUserLegacySafe(data: {
  email: string
  name: string
  phone: string | null
  password: string
  role: 'ORGANIZER' | 'CHECKER'
  status: 'PENDING'
}) {
  const safeSelect = {
    id: true,
    email: true,
    emailVerified: true,
    password: true,
    name: true,
    image: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const

  try {
    return await prisma.user.create({ data, select: safeSelect })
  } catch (e) {
    if (isMissingColumnError(e, 'phone')) {
      return prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: data.password,
          role: data.role,
          status: data.status,
        },
        select: safeSelect,
      })
    }
    throw e
  }
}

async function createOrganizerLegacySafe(
  userId: string,
  data: {
    companyName: string
    organizationDisplayName: string | null
    companyEmail: string
    companyPhone: string
    taxNumber: string | null
    website: string | null
    description: string | null
    address: string | null
    city: string | null
    country: string
    postalCode: string | null
    status: 'PENDING'
  }
) {
  const safeSelect = {
    id: true,
    userId: true,
    companyName: true,
    companyEmail: true,
    companyPhone: true,
    status: true,
  } as const

  try {
    return await prisma.organizer.create({ data: { userId, ...data }, select: safeSelect })
  } catch (e) {
    if (isMissingColumnError(e, 'organizationDisplayName')) {
      const { organizationDisplayName: _ignored, ...legacySafe } = data
      return prisma.organizer.create({ data: { userId, ...legacySafe }, select: safeSelect })
    }
    throw e
  }
}

async function createTicketCheckerLegacySafe(userId: string, phone: string) {
  try {
    return await prisma.ticketChecker.create({
      data: { userId, phone, status: 'PENDING' },
    })
  } catch (e) {
    if (isMissingTableError(e, 'public.ticket_checkers')) {
      return null
    }
    throw e
  }
}

function isMissingColumnError(e: unknown, column: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === 'P2022' &&
    String(e.meta?.column || '').includes(column)
  )
}

function isMissingTableError(e: unknown, table: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === 'P2021' &&
    String(e.meta?.table || '').includes(table)
  )
}
