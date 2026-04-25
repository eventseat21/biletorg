import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Building2, Mail, MapPin, Phone, Globe, Hash } from 'lucide-react'

export default async function OrganizerSettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    redirect('/login')
  }

  const org = await prisma.organizer.findUnique({
    where: { id: session.user.organizerId },
  })

  if (!org) {
    redirect('/organizer')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayarlar</h1>
      <p className="text-gray-600 mb-8">Şirket bilgileriniz (salt okunur; değişiklik için destekle iletişim)</p>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 text-gray-900">
          <Building2 className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-xs text-gray-500">Firma / yasal ünvan</p>
            <p className="font-medium">{org.companyName}</p>
            {org.organizationDisplayName && (
              <p className="text-sm text-gray-600 mt-0.5">
                Yayında görünecek ad: {org.organizationDisplayName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-gray-900">
          <Mail className="w-5 h-5 text-primary-600" />
          <div>
            <p className="text-xs text-gray-500">Şirket e-posta</p>
            <p className="font-medium">{org.companyEmail}</p>
          </div>
        </div>
        {org.companyPhone && (
          <div className="flex items-center gap-3 text-gray-900">
            <Phone className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Telefon</p>
              <p className="font-medium">{org.companyPhone}</p>
            </div>
          </div>
        )}
        {org.taxNumber && (
          <div className="flex items-center gap-3 text-gray-900">
            <Hash className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Vergi no</p>
              <p className="font-medium">{org.taxNumber}</p>
            </div>
          </div>
        )}
        {org.website && (
          <div className="flex items-center gap-3 text-gray-900">
            <Globe className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Web</p>
              <a href={org.website} className="font-medium text-primary-600 hover:underline" target="_blank" rel="noreferrer">
                {org.website}
              </a>
            </div>
          </div>
        )}
        {(org.address || org.city) && (
          <div className="flex items-start gap-3 text-gray-900">
            <MapPin className="w-5 h-5 text-primary-600 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Adres</p>
              <p className="font-medium">
                {[org.address, org.postalCode, org.city, org.country].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        )}
        <div className="pt-4 border-t border-gray-100 text-sm text-gray-500">
          Onay durumu: <strong className="text-gray-800">{org.status}</strong>
        </div>
      </div>
    </div>
  )
}
