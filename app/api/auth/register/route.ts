import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { email, password, name, role, ...organizerData } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Tüm alanlar zorunludur' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role === 'ORGANIZER' ? 'ORGANIZER' : 'USER',
      },
    })

    // If organizer, create organizer profile
    if (role === 'ORGANIZER') {
      await prisma.organizer.create({
        data: {
          userId: user.id,
          companyName: organizerData.companyName || name,
          companyEmail: email,
          companyPhone: organizerData.companyPhone,
          taxNumber: organizerData.taxNumber,
          website: organizerData.website,
          description: organizerData.description,
          address: organizerData.address,
          city: organizerData.city,
          country: organizerData.country,
          postalCode: organizerData.postalCode,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: role === 'ORGANIZER' 
        ? 'Organizatör başvurunuz alındı. Onaylandığında e-posta ile bilgilendirileceksiniz.'
        : 'Hesabınız başarıyla oluşturuldu.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Kayıt işlemi sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}
