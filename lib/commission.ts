import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdminId } from '@/lib/approvals'
import { getCommissionDecisionTemplate, sendEmail } from '@/lib/email'

export type CommissionType = 'PERCENT_DEDUCT' | 'FIXED_ADD'

export function commissionSummary(type: string | null | undefined, value: number | null | undefined): string {
  if (!type || value === null || value === undefined) return 'Henüz belirlenmedi'
  return type === 'FIXED_ADD'
    ? `Her bilet için €${value.toFixed(2)} hizmet bedeli`
    : `Bilet bedelinden %${value} komisyon`
}

/** Formdaki para modeli alanını doğrular; hata varsa kullanıcıya gösterilecek metni döndürür. */
export function readCommissionForm(
  typeRaw: FormDataEntryValue | null,
  valueRaw: FormDataEntryValue | null,
): { type: CommissionType; value: number } | { error: string } {
  const type: CommissionType = typeRaw === 'FIXED_ADD' ? 'FIXED_ADD' : 'PERCENT_DEDUCT'
  const value = Number(String(valueRaw ?? '').replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return { error: 'Değer olarak 0 veya üzeri bir sayı girin.' }
  if (type === 'PERCENT_DEDUCT' && value > 100) return { error: 'Yüzde komisyon 100’den büyük olamaz.' }
  if (type === 'FIXED_ADD' && value > 500) return { error: 'Bilet başına ücret €500’den büyük olamaz.' }
  return { type, value }
}

/** Organizatör: onaydan sonra para modeli değişikliği talebi oluşturur. */
export async function requestCommissionChange(
  organizerId: string,
  commission: { type: CommissionType; value: number },
  note: string,
) {
  const org = await prisma.organizer.findUnique({
    where: { id: organizerId },
    select: { id: true, status: true, commissionType: true, commissionValue: true },
  })
  if (!org) throw new Error('Organizatör bulunamadı')
  if (org.status !== 'APPROVED') throw new Error('Para modeli değişikliği talebi için hesabınızın onaylanmış olması gerekir.')

  const same = org.commissionType === commission.type && org.commissionValue === commission.value
  if (same) throw new Error('Seçtiğiniz model zaten yürürlükte, talep oluşturmanıza gerek yok.')

  await prisma.organizer.update({
    where: { id: organizerId },
    data: {
      commissionRequestType: commission.type,
      commissionRequestValue: commission.value,
      commissionRequestNote: note.trim() || null,
      commissionRequestedAt: new Date(),
    },
  })

  revalidatePath('/organizer/settings')
  revalidatePath('/admin/organizers')
  revalidatePath('/admin/approvals')
}

/** Organizatör: bekleyen talebini geri çeker. */
export async function withdrawCommissionRequest(organizerId: string) {
  await prisma.organizer.update({
    where: { id: organizerId },
    data: {
      commissionRequestType: null,
      commissionRequestValue: null,
      commissionRequestNote: null,
      commissionRequestedAt: null,
    },
  })
  revalidatePath('/organizer/settings')
  revalidatePath('/admin/organizers')
  revalidatePath('/admin/approvals')
}

/** Admin: bekleyen talebi kabul eder (yürürlüğe girer) veya reddeder. */
export async function decideCommissionRequest(organizerId: string, accept: boolean, reason?: string | null) {
  await requireAdminId()
  const org = await prisma.organizer.findUnique({
    where: { id: organizerId },
    include: { user: true },
  })
  if (!org) throw new Error('Organizatör bulunamadı')
  if (!org.commissionRequestType || org.commissionRequestValue === null) {
    throw new Error('Bekleyen bir para modeli talebi yok.')
  }

  const type = org.commissionRequestType as CommissionType
  const value = org.commissionRequestValue

  await prisma.organizer.update({
    where: { id: organizerId },
    data: accept
      ? {
          commissionType: type,
          commissionValue: value,
          commissionRequestType: null,
          commissionRequestValue: null,
          commissionRequestNote: null,
          commissionRequestedAt: null,
        }
      : {
          commissionRequestType: null,
          commissionRequestValue: null,
          commissionRequestNote: null,
          commissionRequestedAt: null,
        },
  })

  try {
    await sendEmail({
      to: org.user.email ?? org.companyEmail,
      subject: accept ? 'Para modeli talebiniz onaylandı' : 'Para modeli talebiniz reddedildi',
      html: getCommissionDecisionTemplate(
        org.companyName,
        accept,
        commissionSummary(type, value),
        accept ? undefined : reason?.trim() || null,
      ),
    })
  } catch (error) {
    console.error('[commission] karar e-postası gönderilemedi:', accept, org.user.email, error)
  }

  revalidatePath('/admin/organizers')
  revalidatePath(`/admin/organizers/${organizerId}`)
  revalidatePath('/admin/approvals')
  revalidatePath('/organizer/settings')
}
