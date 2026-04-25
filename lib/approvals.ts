import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('Yetkisiz')
  }
  return session.user.id
}

/**
 * Admin: organizatör onayı — User ACTIVE + Organizer APPROVED
 */
export async function approveOrganizer(organizerId: string) {
  const adminId = await requireAdmin()
  const org = await prisma.organizer.findUnique({
    where: { id: organizerId },
    include: { user: true },
  })
  if (!org || org.user.role !== 'ORGANIZER') {
    throw new Error('Organizatör bulunamadı')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: org.userId },
      data: { status: 'ACTIVE' },
    }),
    prisma.organizer.update({
      where: { id: organizerId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
      },
    }),
  ])

  revalidatePath('/admin/organizers')
  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

/**
 * Admin: organizatör ret — User REJECTED + Organizer REJECTED
 */
export async function rejectOrganizer(organizerId: string, rejectionReason?: string) {
  await requireAdmin()
  const org = await prisma.organizer.findUnique({ where: { id: organizerId } })
  if (!org) throw new Error('Organizatör bulunamadı')

  await prisma.$transaction([
    prisma.user.update({
      where: { id: org.userId },
      data: { status: 'REJECTED' },
    }),
    prisma.organizer.update({
      where: { id: organizerId },
      data: {
        status: 'REJECTED',
        approvedAt: null,
        approvedBy: null,
        rejectionReason: rejectionReason?.trim() || null,
      },
    }),
  ])

  revalidatePath('/admin/organizers')
  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

/**
 * Admin: bilet kontrolörü onayı
 */
export async function approveChecker(checkerId: string) {
  const adminId = await requireAdmin()
  const c = await prisma.ticketChecker.findUnique({
    where: { id: checkerId },
    include: { user: true },
  })
  if (!c || c.user.role !== 'CHECKER') {
    throw new Error('Kontrolör bulunamadı')
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: c.userId },
      data: { status: 'ACTIVE' },
    }),
    prisma.ticketChecker.update({
      where: { id: checkerId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
      },
    }),
  ])

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

/**
 * Admin: bilet kontrolörü ret
 */
export async function rejectChecker(checkerId: string, rejectionReason?: string) {
  await requireAdmin()
  const c = await prisma.ticketChecker.findUnique({ where: { id: checkerId } })
  if (!c) throw new Error('Kontrolör bulunamadı')

  await prisma.$transaction([
    prisma.user.update({
      where: { id: c.userId },
      data: { status: 'REJECTED' },
    }),
    prisma.ticketChecker.update({
      where: { id: checkerId },
      data: {
        status: 'REJECTED',
        approvedAt: null,
        approvedBy: null,
        rejectionReason: rejectionReason?.trim() || null,
      },
    }),
  ])

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}
