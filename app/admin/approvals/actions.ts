'use server'

import { redirect } from 'next/navigation'
import { approveChecker, assignCheckerOrganizer, rejectChecker } from '@/lib/approvals'

function messageOf(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'İşlem yapılamadı.'
}

export async function approveCheckerForPage(checkerId: string, formData: FormData) {
  const organizerId = String(formData.get('organizerId') ?? '')
  let hata = ''
  try {
    await approveChecker(checkerId, organizerId)
  } catch (error) {
    hata = messageOf(error)
  }
  redirect(hata ? `/admin/approvals?hata=${encodeURIComponent(hata)}` : '/admin/approvals?mesaj=Kontrolör%20onayland%C4%B1.')
}

export async function rejectCheckerForPage(checkerId: string, formData: FormData) {
  const reason = (formData.get('reason') as string) || undefined
  await rejectChecker(checkerId, reason)
  redirect('/admin/approvals?mesaj=Ba%C5%9Fvuru%20reddedildi.')
}

export async function assignCheckerOrganizerForPage(checkerId: string, formData: FormData) {
  const organizerId = String(formData.get('organizerId') ?? '')
  let hata = ''
  try {
    await assignCheckerOrganizer(checkerId, organizerId || null)
  } catch (error) {
    hata = messageOf(error)
  }
  redirect(hata ? `/admin/approvals?hata=${encodeURIComponent(hata)}` : '/admin/approvals?mesaj=Atama%20kaydedildi.')
}
