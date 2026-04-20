import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { revalidatePath } from 'next/cache'

async function getOrganizer(id: string) {
  return prisma.organizer.findUnique({
    where: { id },
    include: { user: true }
  })
}

async function updateOrganizerStatus(id: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) {
  'use server'
  
  await prisma.organizer.update({
    where: { id },
    data: { 
      status,
      rejectionReason: rejectionReason || null,
      approvedAt: status === 'APPROVED' ? new Date() : null
    }
  })

  revalidatePath('/admin/organizers')
  redirect('/admin/organizers')
}

export default async function OrganizerDetailPage({ params }: { params: { id: string } }) {
  const organizer = await getOrganizer(params.id)

  if (!organizer) {
    redirect('/admin/organizers')
  }

  const approveOrganizer = async () => {
    'use server'
    await updateOrganizerStatus(params.id, 'APPROVED')
  }

  const rejectOrganizer = async (formData: FormData) => {
    'use server'
    const reason = formData.get('reason') as string
    await updateOrganizerStatus(params.id, 'REJECTED', reason)
  }

  return (
    <div>
      <Link href="/admin/organizers" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={18} />
        Geri dön
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{organizer.companyName}</h1>
        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
          organizer.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
          organizer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {organizer.status}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Şirket Bilgileri</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Şirket Adı</dt>
              <dd className="font-medium">{organizer.companyName}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Vergi Numarası</dt>
              <dd className="font-medium">{organizer.taxNumber || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Web Sitesi</dt>
              <dd className="font-medium">{organizer.website || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Açıklama</dt>
              <dd className="font-medium">{organizer.description || '-'}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">İletişim Bilgileri</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Yetkili</dt>
              <dd className="font-medium">{organizer.user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">E-posta</dt>
              <dd className="font-medium">{organizer.companyEmail}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Telefon</dt>
              <dd className="font-medium">{organizer.companyPhone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Adres</dt>
              <dd className="font-medium">
                {organizer.address}<br />
                {organizer.city}, {organizer.country} {organizer.postalCode}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {organizer.status === 'PENDING' && (
        <div className="card p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">Onay İşlemi</h2>
          <div className="flex gap-4">
            <form action={approveOrganizer}>
              <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white inline-flex items-center gap-2">
                <CheckCircle size={18} />
                Onayla
              </button>
            </form>
            <form action={rejectOrganizer} className="flex gap-2">
              <input 
                type="text" 
                name="reason" 
                placeholder="Ret sebebi (opsiyonel)" 
                className="input"
              />
              <button type="submit" className="btn bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2">
                <XCircle size={18} />
                Reddet
              </button>
            </form>
          </div>
        </div>
      )}

      {organizer.status === 'REJECTED' && organizer.rejectionReason && (
        <div className="card p-6 mt-8 border-red-200">
          <h2 className="text-lg font-semibold mb-2 text-red-700">Ret Sebebi</h2>
          <p className="text-gray-700">{organizer.rejectionReason}</p>
        </div>
      )}
    </div>
  )
}
