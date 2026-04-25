import Link from 'next/link'
import { Ticket, Building2, ScanLine, LogIn } from 'lucide-react'
import Header from '@/components/header'

/**
 * Bireysel (bilet alıcı) hesap açılmaz; yalnızca organizatör / kontrolör başvurusu.
 */
export default function RegisterInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-lg mx-auto px-4 pt-24 pb-16 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
          <Ticket className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Hesap türleri</h1>
        <p className="text-gray-600 mb-8">
          Bu sitede herkese açık bilet alıcı üyeliği bulunmaz. Yönetici, organizatör ve bilet
          kontrolörü dışındaki roller için kayıt yoktur. Yeni panel hesabı açmak için
          aşağıdaki başvurulardan birini kullanın; hesaplar yönetici onayından sonra
          etkinleşir.
        </p>
        <div className="space-y-3 text-left">
          <Link
            href="/organizer/register"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors"
          >
            <Building2 className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Organizatör başvurusu</p>
              <p className="text-sm text-gray-500">Etkinlik ve bilet yönetimi</p>
            </div>
          </Link>
          <Link
            href="/checker/register"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors"
          >
            <ScanLine className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Bilet kontrolörü başvurusu</p>
              <p className="text-sm text-gray-500">Giriş / doğrulama ekranları</p>
            </div>
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full p-3 text-sm font-medium text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-50"
          >
            <LogIn className="w-4 h-4" />
            Zaten hesabım var — Giriş
          </Link>
        </div>
      </div>
    </div>
  )
}
