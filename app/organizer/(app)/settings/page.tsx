import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Building2, Mail, MapPin, Phone, Globe, Hash } from 'lucide-react'
import { commissionSummary } from '@/lib/commission'
import { requestCommissionChangeForPage, withdrawCommissionRequestForPage } from './actions'

export default async function OrganizerSettingsPage({
  searchParams,
}: {
  searchParams: { mesaj?: string }
}) {
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

      {searchParams.mesaj && (
        <p className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
          {searchParams.mesaj}
        </p>
      )}

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

      {org.status === 'APPROVED' && (
        <div className="card p-6 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Para modeli</h2>
          <p className="text-sm text-gray-600 mb-4">
            Yürürlükteki anlaşma: <strong className="text-gray-900">{commissionSummary(org.commissionType, org.commissionValue)}</strong>
          </p>

          {org.commissionRequestType && org.commissionRequestValue !== null ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                Değişiklik talebiniz yöneticide bekliyor: {commissionSummary(org.commissionRequestType, org.commissionRequestValue)}
              </p>
              {org.commissionRequestNote && (
                <p className="mt-1 text-sm text-amber-800">Gerekçeniz: {org.commissionRequestNote}</p>
              )}
              <form action={withdrawCommissionRequestForPage} className="mt-3">
                <button type="submit" className="btn border border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                  Talebi geri al
                </button>
              </form>
            </div>
          ) : (
            <form action={requestCommissionChangeForPage} className="flex flex-wrap items-end gap-3">
              <label className="text-sm text-gray-700">
                Yeni yöntem
                <select name="commissionType" className="input mt-1 block" defaultValue={org.commissionType ?? 'PERCENT_DEDUCT'}>
                  <option value="PERCENT_DEDUCT">Organizatörden yüzde kes (%)</option>
                  <option value="FIXED_ADD">Bilet fiyatına sabit ücret ekle (€)</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                Değer
                <input name="commissionValue" type="number" min="0" step="0.01" required placeholder="örn. 10" className="input mt-1 block w-32" />
              </label>
              <label className="text-sm text-gray-700 grow">
                Gerekçe (opsiyonel)
                <input name="note" type="text" maxLength={500} placeholder="örn. salon kirası arttı" className="input mt-1 block" />
              </label>
              <button type="submit" className="btn bg-primary-600 hover:bg-primary-700 text-white">
                Değişiklik talebi gönder
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-gray-500">
            Talep yönetici onaylanana kadar yürürlüğe girmez; satışlarınız mevcut anlaşma üzerinden sürer.
          </p>
        </div>
      )}
    </div>
  )
}
