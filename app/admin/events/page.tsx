import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: 'desc' },
    take: 100,
    include: {
      organizer: { select: { companyName: true } },
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Etkinlikler</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Başlık</th>
              <th className="px-4 py-3">Organizatör</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3">{e.organizer.companyName}</td>
                <td className="px-4 py-3">
                  {new Date(e.startDate).toLocaleString('tr-TR')}
                </td>
                <td className="px-4 py-3">
                  {e.isPublished ? 'Yayın' : 'Taslak'} / {e.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="p-8 text-center text-gray-500">Etkinlik yok</p>
        )}
      </div>
    </div>
  )
}
