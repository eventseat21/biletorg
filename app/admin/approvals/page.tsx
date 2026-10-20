import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  approveCheckerForPage,
  assignCheckerOrganizerForPage,
  rejectCheckerForPage,
} from './actions'
import {
  approveOrganizerForPage,
  rejectOrganizerForPage,
} from '../organizers/actions'
import { commissionSummary } from '@/lib/commission'
import { Building2, ScanLine, Percent } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: { mesaj?: string; hata?: string }
}) {
  const [pendingOrgs, pendingCheckers, commissionRequests, approvedOrganizers, approvedCheckers] = await Promise.all([
    prisma.organizer.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.ticketChecker.findMany({
      where: { status: 'PENDING' },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.organizer.findMany({
      where: { status: 'APPROVED', commissionRequestType: { not: null } },
      include: { user: true },
      orderBy: { commissionRequestedAt: 'asc' },
    }),
    prisma.organizer.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, companyName: true, organizationDisplayName: true },
      orderBy: { companyName: 'asc' },
    }),
    prisma.ticketChecker.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: { select: { name: true, email: true } },
        organizer: { select: { id: true, companyName: true, organizationDisplayName: true } },
      },
      orderBy: { approvedAt: 'desc' },
      take: 100,
    }),
  ])

  const orgOptions = approvedOrganizers.map((o) => (
    <option key={o.id} value={o.id}>
      {o.organizationDisplayName || o.companyName}
    </option>
  ))

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Onay bekleyenler</h1>
      <p className="text-gray-600 mb-8">
        Organizatör ve bilet kontrolörü başvurularını buradan yönetin. Onaylanan kullanıcılar
        e-posta ve şifre ile giriş yapabilir; reddedilenler giriş yapamaz.
      </p>

      {searchParams.mesaj ? (
        <p className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {searchParams.mesaj}
        </p>
      ) : null}
      {searchParams.hata ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchParams.hata}
        </p>
      ) : null}

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5" />
          Para modeli değişiklik talepleri ({commissionRequests.length})
        </h2>
        {commissionRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">Bekleyen para modeli talebi yok.</p>
        ) : (
          <ul className="space-y-4">
            {commissionRequests.map((o) => (
              <li
                key={o.id}
                className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{o.companyName}</p>
                  <p className="text-sm text-gray-600">
                    Mevcut: {commissionSummary(o.commissionType, o.commissionValue)} → İstenen:{' '}
                    <strong className="text-gray-900">
                      {commissionSummary(o.commissionRequestType, o.commissionRequestValue)}
                    </strong>
                  </p>
                  {o.commissionRequestNote && (
                    <p className="text-sm text-gray-600">Gerekçe: {o.commissionRequestNote}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {o.user.email} ·{' '}
                    {o.commissionRequestedAt ? new Date(o.commissionRequestedAt).toLocaleString('tr-TR') : ''}
                  </p>
                </div>
                <Link
                  href={`/admin/organizers/${o.id}`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 self-start"
                >
                  Karar ver
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5" />
          Organizatörler ({pendingOrgs.length})
        </h2>
        {pendingOrgs.length === 0 ? (
          <p className="text-gray-500 text-sm">Bekleyen organizatör yok.</p>
        ) : (
          <ul className="space-y-4">
            {pendingOrgs.map((o) => (
              <li
                key={o.id}
                className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{o.companyName}</p>
                  {o.organizationDisplayName && (
                    <p className="text-sm text-gray-500">
                      Yayın adı: {o.organizationDisplayName}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    {o.user.name} · {o.user.email} · {o.companyPhone}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(o.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form
                    action={approveOrganizerForPage.bind(null, o.id)}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <label className="text-xs text-gray-600">
                      Para modeli
                      <select
                        name="commissionType"
                        className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="PERCENT_DEDUCT">Yüzde komisyon (%)</option>
                        <option value="FIXED_ADD">Bilet başına ücret (€)</option>
                      </select>
                    </label>
                    <label className="text-xs text-gray-600">
                      Değer
                      <input
                        name="commissionValue"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="örn. 10"
                        className="mt-1 block w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Onayla
                    </button>
                  </form>
                  <form
                    action={rejectOrganizerForPage.bind(null, o.id)}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="reason"
                      placeholder="Ret sebebi"
                      className="text-sm border rounded-md px-2 py-1 w-40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Reddet
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <ScanLine className="w-5 h-5" />
          Bilet kontrolörleri ({pendingCheckers.length})
        </h2>
        {pendingCheckers.length === 0 ? (
          <p className="text-gray-500 text-sm">Bekleyen kontrolör yok.</p>
        ) : (
          <ul className="space-y-4">
            {pendingCheckers.map((c) => (
              <li
                key={c.id}
                className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{c.user.name}</p>
                  <p className="text-sm text-gray-600">
                    {c.user.email} · {c.phone}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveCheckerForPage.bind(null, c.id)} className="flex flex-wrap items-end gap-2">
                    <label className="text-xs text-gray-600">
                      Organizasyon
                      <select
                        name="organizerId"
                        required
                        className="mt-1 block min-w-40 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="">Seçin</option>
                        {orgOptions}
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Onayla
                    </button>
                  </form>
                  <form
                    action={rejectCheckerForPage.bind(null, c.id)}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="reason"
                      placeholder="Ret sebebi"
                      className="text-sm border rounded-md px-2 py-1 w-40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Reddet
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <ScanLine className="w-5 h-5" />
          Onaylı kontrolörler ({approvedCheckers.length})
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Kontrolör yalnız atanmış olduğu organizasyonun biletlerini okutabilir. Ataması boş
          olanlar kapıda bilet okuyamaz.
        </p>
        {approvedCheckers.length === 0 ? (
          <p className="text-gray-500 text-sm">Onaylı kontrolör yok.</p>
        ) : (
          <ul className="space-y-4">
            {approvedCheckers.map((c) => (
              <li
                key={c.id}
                className="card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{c.user.name}</p>
                  <p className="text-sm text-gray-600">
                    {c.user.email} · {c.phone}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Organizasyon:{' '}
                    {c.organizer ? c.organizer.organizationDisplayName || c.organizer.companyName : 'atanmamış'}
                  </p>
                </div>
                <form
                  action={assignCheckerOrganizerForPage.bind(null, c.id)}
                  className="flex flex-wrap items-end gap-2"
                >
                  <label className="text-xs text-gray-600">
                    Ata
                    <select
                      name="organizerId"
                      defaultValue={c.organizer?.id ?? ''}
                      className="mt-1 block min-w-40 rounded-md border border-gray-300 px-2 py-1 text-sm"
                    >
                      <option value="">Atamasız</option>
                      {orgOptions}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                  >
                    Kaydet
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
