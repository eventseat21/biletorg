import Link from 'next/link'
import { Ticket } from 'lucide-react'

/**
 * Tüm pazarlama sayfalarında aynı alt bilgi: başvurular sadece footer’da.
 */
export function SiteFooter() {
  return (
    <footer className="bg-blue-900 text-blue-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">BiletOrg</span>
            </div>
            <p className="text-sm">
              Profesyonel etkinlik yönetimi ve bilet satış platformu.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Ürün</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/events" className="hover:text-white">
                  Etkinlikler
                </Link>
              </li>
              <li>
                <Link href="/ticketshop" className="hover:text-white">
                  Ticketshop
                </Link>
              </li>
              <li>
                <Link href="/saalplan" className="hover:text-white">
                  Salon planı
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Fiyatlandırma
                </Link>
              </li>
              <li>
                <Link href="/benefits" className="hover:text-white">
                  Avantajlar
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Destek</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-white">
                  SSS
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white">
                  Destek Al
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Hesap</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/organizer/register" className="hover:text-white">
                  Organizatör başvurusu
                </Link>
              </li>
              <li>
                <Link href="/checker/register" className="hover:text-white">
                  Bilet kontrolörü
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  Giriş
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-1">
            <h4 className="text-white font-semibold mb-4">Hukuk</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/coming-soon" className="hover:text-white">
                  Gizlilik
                </Link>
              </li>
              <li>
                <Link href="/coming-soon" className="hover:text-white">
                  Kullanım şartları
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-sm text-center">
          © {new Date().getFullYear()} BiletOrg. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  )
}
