'use server'

import { redirect } from 'next/navigation'
import { approveOrganizer, rejectOrganizer } from '@/lib/approvals'
import { decideCommissionRequest } from '@/lib/commission'

export async function approveOrganizerForPage(organizerId: string, formData: FormData) {
  const type = formData.get('commissionType') === 'FIXED_ADD' ? 'FIXED_ADD' : 'PERCENT_DEDUCT'
  const value = Number(String(formData.get('commissionValue') ?? '').replace(',', '.'))
  if (!Number.isFinite(value) || value < 0 || (type === 'PERCENT_DEDUCT' && value > 100)) {
    redirect(`/admin/organizers/${organizerId}?hata=komisyon`)
  }
  await approveOrganizer(organizerId, { type, value })
  redirect('/admin/organizers')
}

export async function rejectOrganizerForPage(organizerId: string, formData: FormData) {
  const reason = (formData.get('reason') as string) || undefined
  await rejectOrganizer(organizerId, reason)
  redirect('/admin/organizers')
}

export async function acceptCommissionRequestForPage(organizerId: string) {
  try {
    await decideCommissionRequest(organizerId, true)
  } catch (error) {
    redirect(`/admin/organizers/${organizerId}?hata=${encodeURIComponent(error instanceof Error ? error.message : 'Karar verilemedi')}`)
  }
  redirect(`/admin/organizers/${organizerId}?mesaj=Kabul`)
}

export async function rejectCommissionRequestForPage(organizerId: string, formData: FormData) {
  const reason = String(formData.get('reason') ?? '').trim()
  try {
    await decideCommissionRequest(organizerId, false, reason || null)
  } catch (error) {
    redirect(`/admin/organizers/${organizerId}?hata=${encodeURIComponent(error instanceof Error ? error.message : 'Karar verilemedi')}`)
  }
  redirect(`/admin/organizers/${organizerId}?mesaj=Ret`)
}
