import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Kullanıcılar</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">{u.name || '—'}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-8 text-center text-gray-500">Kayıt yok</p>
        )}
      </div>
      <p className="mt-4 text-sm text-gray-500">Son 100 kullanıcı listelenir.</p>
    </div>
  )
}
