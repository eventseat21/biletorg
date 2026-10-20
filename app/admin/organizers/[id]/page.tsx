import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { commissionSummary } from '@/lib/commission'
import {
  acceptCommissionRequestForPage,
  approveOrganizerForPage,
  rejectCommissionRequestForPage,
  rejectOrganizerForPage,
} from '../actions'

async function getOrganizer(id: string) {
  return prisma.organizer.findUnique({
    where: { id },
    include: { user: true },
  })
}

export default async function OrganizerDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { hata?: string; mesaj?: string }
}) {
  const organizer = await getOrganizer(params.id)

  if (!organizer) {
    redirect('/admin/organizers')
  }

  return (
    <div>
      <Link
        href="/admin/organizers"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} />
        Geri dön
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {organizer.companyName}
        </h1>
        <span
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            organizer.status === 'APPROVED'
              ? 'bg-green-100 text-green-700'
              : organizer.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {organizer.status}
        </span>
      </div>

      {searchParams.hata === 'komisyon' && (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Komisyon değeri geçersiz. Yüzde için 0–100, bilet başına ücret için 0 veya üzeri bir sayı girin.
        </p>
      )}

      {searchParams.mesaj && (
        <p className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Para modeli talebi {searchParams.mesaj === 'Kabul' ? 'kabul edildi, yeni anlaşma yürürlükte.' : 'reddedildi; mevcut anlaşma değişmedi.'}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Şirket Bilgileri</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Firma / yasal ünvan</dt>
              <dd className="font-medium">{organizer.companyName}</dd>
            </div>
            {organizer.organizationDisplayName && (
              <div>
                <dt className="text-sm text-gray-500">
                  Organizasyon (yayında görünecek ad)
                </dt>
                <dd className="font-medium">
                  {organizer.organizationDisplayName}
                </dd>
              </div>
            )}
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
          <h2 className="text-lg font-semibold mb-4">İletişim & adres</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Yetkili (ad soyad)</dt>
              <dd className="font-medium">{organizer.user.name}</dd>
            </div>
            {organizer.user.phone && (
              <div>
                <dt className="text-sm text-gray-500">Yetkili telefon</dt>
                <dd className="font-medium">{organizer.user.phone}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">E-posta</dt>
              <dd className="font-medium">{organizer.companyEmail}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">İş yeri / firma telefonu</dt>
              <dd className="font-medium">{organizer.companyPhone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Adres</dt>
              <dd className="font-medium">
                {organizer.address}
                <br />
                {organizer.city}
                {organizer.postalCode ? `, ${organizer.postalCode}` : ''}{' '}
                {organizer.country}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {organizer.status === 'PENDING' && (
        <div className="card p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">Onay İşlemi</h2>
          <div className="flex flex-wrap gap-4">
            <form
              action={approveOrganizerForPage.bind(null, organizer.id)}
              className="flex flex-wrap items-end gap-3 rounded-lg border border-green-200 bg-green-50 p-4"
            >
              <label className="text-sm text-green-950">
                Para modeli
                <select
                  name="commissionType"
                  className="input mt-1 block bg-white"
                  defaultValue="PERCENT_DEDUCT"
                >
                  <option value="PERCENT_DEDUCT">Organizatörden yüzde kes (%)</option>
                  <option value="FIXED_ADD">Bilet fiyatına sabit ücret ekle (€)</option>
                </select>
              </label>
              <label className="text-sm text-green-950">
                Değer
                <input
                  name="commissionValue"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="örn. 10"
                  className="input mt-1 block w-32 bg-white"
                />
              </label>
              <button
                type="submit"
                className="btn bg-green-600 hover:bg-green-700 text-white inline-flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Onayla
              </button>
            </form>
            <form
              action={rejectOrganizerForPage.bind(null, organizer.id)}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                type="text"
                name="reason"
                placeholder="Ret sebebi (opsiyonel)"
                className="input min-w-[12rem]"
              />
              <button
                type="submit"
                className="btn bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2"
              >
                <XCircle size={18} />
                Reddet
              </button>
            </form>
          </div>
        </div>
      )}

      {organizer.status === 'APPROVED' && organizer.commissionRequestType !== null && organizer.commissionRequestValue !== null && (
        <div className="card p-6 mt-8 border-amber-300 bg-amber-50">
          <h2 className="text-lg font-semibold mb-2 text-amber-900">Para modeli değişiklik talebi</h2>
          <p className="text-sm text-amber-900">
            İstenen: <strong>{commissionSummary(organizer.commissionRequestType, organizer.commissionRequestValue)}</strong> ·
            Mevcut: {commissionSummary(organizer.commissionType, organizer.commissionValue)}
          </p>
          {organizer.commissionRequestNote && (
            <p className="mt-2 text-sm text-amber-900">Gerekçe: {organizer.commissionRequestNote}</p>
          )}
          <p className="mt-2 text-xs text-amber-700">
            {organizer.commissionRequestedAt ? new Date(organizer.commissionRequestedAt).toLocaleString('tr-TR') : ''} tarihinde talep edildi.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form action={acceptCommissionRequestForPage.bind(null, organizer.id)}>
              <button
                type="submit"
                className="btn bg-green-600 hover:bg-green-700 text-white inline-flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Talebi kabul et
              </button>
            </form>
            <form
              action={rejectCommissionRequestForPage.bind(null, organizer.id)}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                type="text"
                name="reason"
                placeholder="Ret sebebi (organizatöre e-posta ile gider)"
                className="input min-w-[16rem] bg-white"
              />
              <button
                type="submit"
                className="btn bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2"
              >
                <XCircle size={18} />
                Reddet
              </button>
            </form>
          </div>
        </div>
      )}

      {organizer.status === 'APPROVED' && (
        <div className="card p-6 mt-8">
          <h2 className="text-lg font-semibold mb-2">Para modeli</h2>
          <p className="mb-4 text-sm text-gray-600">
            Etkinlik onayında varsayılan olarak bu anlaşma önerilir.
            {organizer.commissionValue !== null &&
              ` Mevcut: ${
                organizer.commissionType === 'FIXED_ADD'
                  ? `bilet başına €${organizer.commissionValue.toFixed(2)}`
                  : `%${organizer.commissionValue} organizatör payından`
              }.`}
          </p>
          <form
            action={approveOrganizerForPage.bind(null, organizer.id)}
            className="flex flex-wrap items-end gap-3"
          >
            <label className="text-sm text-gray-700">
              Yöntem
              <select
                name="commissionType"
                className="input mt-1 block"
                defaultValue={organizer.commissionType ?? 'PERCENT_DEDUCT'}
              >
                <option value="PERCENT_DEDUCT">Organizatörden yüzde kes (%)</option>
                <option value="FIXED_ADD">Bilet fiyatına sabit ücret ekle (€)</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Değer
              <input
                name="commissionValue"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={organizer.commissionValue ?? ''}
                className="input mt-1 block w-32"
              />
            </label>
            <button type="submit" className="btn bg-green-600 hover:bg-green-700 text-white">
              Para modelini kaydet
            </button>
          </form>
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
