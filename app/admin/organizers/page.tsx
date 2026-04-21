import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getOrganizers() {
  try {
    return await prisma.organizer.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching organizers:', error)
    return []
  }
}

export default async function AdminOrganizersPage() {
  const organizers = await getOrganizers()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"><CheckCircle size={14} /> Onaylı</span>
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm"><Clock size={14} /> Beklemede</span>
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"><XCircle size={14} /> Reddedildi</span>
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{status}</span>
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Organizatörler</h1>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Şirket</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">İletişim</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Durum</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Tarih</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {organizers.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{org.companyName}</div>
                  <div className="text-sm text-gray-500">{org.user.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{org.companyEmail}</div>
                  <div className="text-sm text-gray-500">{org.companyPhone}</div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(org.status)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(org.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin/organizers/${org.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Detay →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
