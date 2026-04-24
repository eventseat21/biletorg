import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { Plus, MapPin, Users, ArrowRight } from 'lucide-react'

async function getHalls(organizerId: string) {
  return prisma.hall.findMany({
    where: { organizerId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { seats: true } }
    }
  })
}

export default async function HallsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    return null
  }

  const halls = await getHalls(session.user.organizerId)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salonlar</h1>
          <p className="text-gray-600 mt-1">Etkinlikleriniz için salon tasarımları</p>
        </div>
        <Link href="/organizer/halls/new" className="btn-primary inline-flex items-center gap-2">
          <Plus size={20} />
          Yeni Salon
        </Link>
      </div>

      {halls.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz salon oluşturmadınız</h3>
          <p className="text-gray-500 mb-6">Etkinlikleriniz için koltuk düzeni içeren salonlar oluşturun</p>
          <Link href="/organizer/halls/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={18} />
            İlk Salonu Oluştur
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {halls.map((hall) => (
            <div key={hall.id} className="card hover:shadow-md transition-shadow">
              <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <MapPin className="w-12 h-12 text-primary-600" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{hall.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{hall.description || 'Açıklama yok'}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    {hall._count.seats} koltuk
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {hall.capacity} kapasite
                  </span>
                </div>

                <Link 
                  href={`/organizer/halls/${hall.id}`}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
                >
                  Düzenle
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
