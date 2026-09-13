import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { markEventSyncFailed, syncEventToKurdeventsCom } from '@/lib/kurdeventsComSync'

export const runtime = 'nodejs'

type Body = {
  commissionType?: 'PERCENT_DEDUCT' | 'FIXED_ADD'
  commissionValue?: number | string
  publishOrg?: boolean
  publishCom?: boolean
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  let body: Body
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 }) }
  const commissionType = body.commissionType === 'FIXED_ADD' ? 'FIXED_ADD' : 'PERCENT_DEDUCT'
  const normalized = typeof body.commissionValue === 'string'
    ? Number(body.commissionValue.replace(',', '.'))
    : Number(body.commissionValue)
  if (!Number.isFinite(normalized) || normalized < 0) {
    return NextResponse.json({ error: 'Komisyon değeri 0 veya daha büyük olmalı' }, { status: 400 })
  }
  if (commissionType === 'PERCENT_DEDUCT' && normalized > 100) {
    return NextResponse.json({ error: 'Yüzde komisyon 100’den büyük olamaz' }, { status: 400 })
  }

  const event = await prisma.event.findUnique({ where: { id: params.id }, select: { id: true, status: true } })
  if (!event) return NextResponse.json({ error: 'Etkinlik bulunamadı' }, { status: 404 })
  if (event.status !== 'PENDING_APPROVAL' && event.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Bu etkinlik onaylanabilir durumda değil' }, { status: 409 })
  }

  await prisma.event.update({
    where: { id: params.id },
    data: {
      commissionType,
      commissionValue: normalized,
      commissionLocked: true,
      commissionSetAt: new Date(),
      commissionSetBy: session.user.id,
      salesSyncStatus: 'SYNCING',
      salesSyncError: null,
    },
  })

  let sync
  try {
    sync = await syncEventToKurdeventsCom(params.id)
  } catch (error) {
    await markEventSyncFailed(params.id, error)
    return NextResponse.json(
      { error: 'Etkinlik satış platformuna aktarılamadı', details: error instanceof Error ? error.message : 'Bilinmeyen sync hatası' },
      { status: 502 },
    )
  }

  const updated = await prisma.event.update({
    where: { id: params.id },
    data: {
      status: 'PUBLISHED',
      isPublished: Boolean(body.publishOrg ?? true) || Boolean(body.publishCom ?? true),
      publishedAt: new Date(),
    },
    include: { organizer: { select: { companyEmail: true, user: { select: { email: true } } } } },
  })

  const orgBase = process.env.NEXT_PUBLIC_ORG_SITE_URL || process.env.NEXTAUTH_URL || 'https://kurdevents.org'
  const publicBase = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || 'https://kurdevents.com'
  const orgUrl = `${orgBase.replace(/\/$/, '')}/events/${updated.id}`
  const publicUrl = updated.salesEventId
    ? `${publicBase.replace(/\/$/, '')}/de/etkinlik/${updated.salesEventId}/`
    : null
  const embedUrl = updated.salesEventId
    ? `${publicBase.replace(/\/$/, '')}/de/etkinlik/${updated.salesEventId}/`
    : null
  const embedCode = embedUrl
    ? `<iframe src="${embedUrl}" width="100%" height="850" style="border:0" allow="payment" loading="lazy"></iframe>`
    : null

  return NextResponse.json({
    event: updated,
    sync,
    links: { orgUrl, publicUrl, embedUrl, embedCode },
    email: updated.organizer.companyEmail || updated.organizer.user.email,
  })
}
