'use server'

import { redirect } from 'next/navigation'
import { approveChecker, rejectChecker } from '@/lib/approvals'

export async function approveCheckerForPage(checkerId: string) {
  await approveChecker(checkerId)
  redirect('/admin/approvals')
}

export async function rejectCheckerForPage(
  checkerId: string,
  formData: FormData
) {
  const reason = (formData.get('reason') as string) || undefined
  await rejectChecker(checkerId, reason)
  redirect('/admin/approvals')
}
