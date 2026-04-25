'use server'

import { redirect } from 'next/navigation'
import { approveOrganizer, rejectOrganizer } from '@/lib/approvals'

export async function approveOrganizerForPage(organizerId: string) {
  await approveOrganizer(organizerId)
  redirect('/admin/organizers')
}

export async function rejectOrganizerForPage(organizerId: string, formData: FormData) {
  const reason = (formData.get('reason') as string) || undefined
  await rejectOrganizer(organizerId, reason)
  redirect('/admin/organizers')
}
