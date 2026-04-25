import { prisma } from '@/lib/prisma'
import {
  approveCheckerForPage,
  rejectCheckerForPage,
} from './actions'
import {
  approveOrganizerForPage,
  rejectOrganizerForPage,
} from '../organizers/actions'
import { Building2, ScanLine } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminApprovalsPage() {
  const [pendingOrgs, pendingCheckers] = await Promise.all([
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
  ])

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Onay bekleyenler</h1>
      <p className="text-gray-600 mb-8">
        Organizatör ve bilet kontrolörü başvurularını buradan yönetin. Onaylanan kullanıcılar
        e-posta ve şifre ile giriş yapabilir; reddedilenler giriş yapamaz.
      </p>

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
                  <form action={approveOrganizerForPage.bind(null, o.id)}>
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
                  <form action={approveCheckerForPage.bind(null, c.id)}>
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
    </div>
  )
}
