'use server'

import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { readCommissionForm, requestCommissionChange, withdrawCommissionRequest } from '@/lib/commission'

async function ownOrganizerId(): Promise<string> {
  const session = await getServerSession(authOptions)
  const id = session?.user?.organizerId
  if (!id) throw new Error('Giriş gerekli')
  return id
}

export async function requestCommissionChangeForPage(formData: FormData) {
  const organizerId = await ownOrganizerId()
  const commission = readCommissionForm(formData.get('commissionType'), formData.get('commissionValue'))
  if ('error' in commission) redirect(`/organizer/settings?mesaj=${encodeURIComponent(commission.error)}`)

  const note = String(formData.get('note') ?? '')
  if (note.length > 500) redirect(`/organizer/settings?mesaj=${encodeURIComponent('Açıklama 500 karakteri aşabilir.')}`)

  try {
    await requestCommissionChange(organizerId, commission, note)
  } catch (error) {
    redirect(`/organizer/settings?mesaj=${encodeURIComponent(error instanceof Error ? error.message : 'Talep oluşturulamadı.')}`)
  }
  redirect('/organizer/settings?mesaj=Talebiniz%20yöneticiye%20iletildi.')
}

export async function withdrawCommissionRequestForPage() {
  const organizerId = await ownOrganizerId()
  await withdrawCommissionRequest(organizerId)
  redirect('/organizer/settings?mesaj=Talebiniz%20geri%20alindi.')
}
