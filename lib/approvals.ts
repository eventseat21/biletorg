import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrganizerApprovalTemplate, sendEmail } from '@/lib/email'

/** Oturumdaki yöneticinin id'si; değilse hata. */
export async function requireAdminId(): Promise<string> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('Yetkisiz')
  }
  return session.user.id
}

function commissionNote(type: string, value: number): string {
  return type === 'FIXED_ADD'
    ? `Ödeme anlaşmanız: her bilet için €${value.toFixed(2)} Kurdevents hizmet bedeli bilet fiyatına eklenir.`
    : `Ödeme anlaşmanız: bilet bedelinden %${value} Kurdevents komisyonu kesilir, satış fiyatınız değişmez.`
}

/** Karar verildikten sonra e-posta gönderilir; e-posta hatası admin işlemini geri aldırmaz. */
async function notifyOrganizerDecision(
  email: string | null,
  organizerName: string,
  status: 'approved' | 'rejected',
  options: { reason?: string | null; commission?: { type: string; value: number } },
) {
  if (!email) return
  try {
    await sendEmail({
      to: email,
      subject: status === 'approved' ? 'Organizatör başvurunuz onaylandı' : 'Organizatör başvurunuz reddedildi',
      html: getOrganizerApprovalTemplate(
        organizerName,
        status,
        options.reason ?? undefined,
        options.commission ? commissionNote(options.commission.type, options.commission.value) : undefined,
      ),
    })
  } catch (error) {
    console.error('[approvals] organizatör e-postası gönderilemedi:', status, email, error)
  }
}

/**
 * Admin: organizatör onayı — User ACTIVE + Organizer APPROVED + para modeli
 */
export async function approveOrganizer(
  organizerId: string,
  commission: { type: 'PERCENT_DEDUCT' | 'FIXED_ADD'; value: number },
) {
  const adminId = await requireAdminId()
  if (!Number.isFinite(commission.value) || commission.value < 0) {
    throw new Error('Komisyon değeri geçersiz')
  }
  if (commission.type === 'PERCENT_DEDUCT' && commission.value > 100) {
    throw new Error('Yüzde komisyon 100’den büyük olamaz')
  }
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
        commissionType: commission.type,
        commissionValue: commission.value,
      },
    }),
  ])

  await notifyOrganizerDecision(org.user.email, org.companyName, 'approved', { commission })

  revalidatePath('/admin/organizers')
  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

/**
 * Admin: organizatör ret — User REJECTED + Organizer REJECTED
 */
export async function rejectOrganizer(organizerId: string, rejectionReason?: string) {
  await requireAdminId()
  const org = await prisma.organizer.findUnique({ where: { id: organizerId }, include: { user: true } })
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

  await notifyOrganizerDecision(org.user.email, org.companyName, 'rejected', { reason: rejectionReason })

  revalidatePath('/admin/organizers')
  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

/**
 * Admin: bilet kontrolörü onayı — kontrolör onaylandığı organizasyona atanır ve
 * kapıda yalnız o organizasyonun biletlerini okuyabilir.
 */
export async function approveChecker(checkerId: string, organizerId: string) {
  const adminId = await requireAdminId()
  const [c, organizer] = await Promise.all([
    prisma.ticketChecker.findUnique({ where: { id: checkerId }, include: { user: true } }),
    prisma.organizer.findUnique({ where: { id: organizerId }, select: { id: true, status: true } }),
  ])
  if (!c || c.user.role !== 'CHECKER') {
    throw new Error('Kontrolör bulunamadı')
  }
  if (!organizer || organizer.status !== 'APPROVED') {
    throw new Error('Kontrolör yalnız onaylı bir organizasyona atanabilir.')
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
        organizerId,
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: null,
      },
    }),
  ])

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
}

/** Admin: onaylı kontrolörü başka organizasyona taşı (boş bırakılırsa atama kalkar). */
export async function assignCheckerOrganizer(checkerId: string, organizerId: string | null) {
  await requireAdminId()
  const checker = await prisma.ticketChecker.findUnique({ where: { id: checkerId }, select: { id: true } })
  if (!checker) throw new Error('Kontrolör bulunamadı')

  if (organizerId) {
    const organizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
      select: { status: true },
    })
    if (!organizer || organizer.status !== 'APPROVED') {
      throw new Error('Kontrolör yalnız onaylı bir organizasyona atanabilir.')
    }
  }

  await prisma.ticketChecker.update({ where: { id: checkerId }, data: { organizerId } })
  revalidatePath('/admin/approvals')
}

/**
 * Admin: bilet kontrolörü ret
 */
export async function rejectChecker(checkerId: string, rejectionReason?: string) {
  await requireAdminId()
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
