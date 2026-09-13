import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Armchair, MapPin, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OrganizerHallDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) redirect('/login')

  const hall = await prisma.hall.findFirst({
    where: { id: params.id, organizerId: session.user.organizerId },
    include: {
      _count: { select: { seats: true } },
      seats: {
        select: { row: true, status: true, type: true },
        orderBy: [{ row: 'asc' }, { number: 'asc' }],
      },
    },
  })
  if (!hall) notFound()

  const lockedCount = await prisma.ticket.count({
    where: { seat: { hallId: hall.id }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
  })
  const rows = new Set(hall.seats.map((seat) => seat.row)).size

  return (
    <div className="max-w-6xl">
      <Link href="/organizer/halls" className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Salonlara dön
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{hall.name}</h1>
          <p className="mt-1 text-gray-600">{hall.description || 'Salon açıklaması yok'}</p>
        </div>
        <Link href={`/organizer/halls/${hall.id}/seatmap`} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          <Armchair className="h-4 w-4" /> Salon editörünü aç
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-5"><Users className="mb-3 h-5 w-5 text-indigo-600" /><p className="text-2xl font-bold text-gray-900">{hall._count.seats}</p><p className="text-sm text-gray-500">Koltuk</p></div>
        <div className="card p-5"><MapPin className="mb-3 h-5 w-5 text-indigo-600" /><p className="text-2xl font-bold text-gray-900">{hall.capacity}</p><p className="text-sm text-gray-500">Kapasite</p></div>
        <div className="card p-5"><p className="mb-3 text-sm font-semibold text-indigo-600">Sıralar</p><p className="text-2xl font-bold text-gray-900">{rows}</p><p className="text-sm text-gray-500">Düzenlenebilir sıra</p></div>
        <div className="card p-5"><p className="mb-3 text-sm font-semibold text-amber-600">Kilitli</p><p className="text-2xl font-bold text-gray-900">{lockedCount}</p><p className="text-sm text-gray-500">Satılmış/aktif bilete bağlı</p></div>
      </div>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Satılmış veya aktif bilete bağlı koltuklar editörde kilitli görünür; silinemez ve sıra/numaraları değiştirilemez. Yeni koltuk ekleyebilir ve satılmamış koltukları düzenleyebilirsiniz.
      </div>
    </div>
  )
}
