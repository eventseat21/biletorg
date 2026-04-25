import Link from 'next/link'
import { 
  ShoppingCart, 
  Palette, 
  Clock, 
  QrCode, 
  BarChart3, 
  Shield,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  CreditCard,
  Users,
  Ticket,
  Smartphone
} from 'lucide-react'
import Header from '@/components/header'
import { SiteFooter } from '@/components/site-footer'

export default function TicketshopPage() {
  return (
<div className="min-h-screen bg-white">
       <Header />

      {/* Hero — diğer sayfalarla aynı filigran; tiyatro görseli */}
      <section className="relative text-white">
        <div className="absolute inset-0">
          <img
            src="/ticketshop-hero.png"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 to-purple-900/50" />
        </div>
        <div className="container relative mx-auto max-w-4xl px-4 py-24 text-center md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Yeni: SVG salon import
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            Kendi{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
              bilet mağazanızı
            </span>{' '}
            oluşturun
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-primary-100 md:text-2xl">
            Etkinlikleriniz için profesyonel, markanıza özel bilet satış sayfası. Hızlı
            kurulum, güvenli ödeme.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/organizer/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-4 font-semibold text-white shadow-lg shadow-primary-200 transition-all hover:from-primary-700 hover:to-primary-800"
            >
              Organizatör başvurusu
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/coming-soon"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
            >
              Demo görüntüle
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-primary-100/95">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" /> Aylık abonelik yok
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" /> %5 komisyon
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-300" /> 7/24 destek
            </span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Profesyonel Bilet Satışı için Her Şey Dahil
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Etkinliğiniz için ihtiyacınız olan tüm özellikler tek bir platformda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Markanıza Özel Tasarım</h3>
              <p className="text-gray-600">
                Logo, renkler ve marka kimliğinizle tamamen özelleştirilebilir bilet mağazası. 
                Kendi domain'inizi kullanın.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">7/24 Satış</h3>
              <p className="text-gray-600">
                Etkinliğinize kadar kesintisiz bilet satışı. Otomatik onay ve 
                anında bilet gönderimi.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">QR Kod ile Giriş</h3>
              <p className="text-gray-600">
                Her bilete benzersiz QR kod. Organizatör uygulaması ile 
                hızlı ve güvenli giriş kontrolü.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobil Uyumlu</h3>
              <p className="text-gray-600">
                Akıllı telefon, tablet ve bilgisayardan mükemmel görünüm. 
                Apple Wallet & Google Pay entegrasyonu.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Güvenli Ödeme</h3>
              <p className="text-gray-600">
                Kredi kartı, havale/EFT ve kapıda ödeme seçenekleri. 
                3D Secure ile güvenli işlemler.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Satış Analizi</h3>
              <p className="text-gray-600">
                Gerçek zamanlı satış raporları, gelir takibi ve 
                katılımcı istatistikleri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seat Selection Highlight */}
      <section className="relative overflow-hidden py-20 text-white">
        <div className="absolute inset-0" aria-hidden>
          <img
            src="/ticketshop-seat-section.png"
            alt=""
            className="h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900/70"
            aria-hidden
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Görsel Koltuk Seçimi
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                SVG'den İnteraktif Salon Planına
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Mevcut salon planınızı yükleyin, otomatik olarak koltukları tanıyın 
                ve satılabilir hale getirin. Manuel çizim veya SVG import seçenekleri.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>SVG dosya importu</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Otomatik koltuk tanıma</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>VIP, Premium, Normal kategori atama</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Sürükle-bırak düzenleme</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl p-6 text-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Salon Planı Editörü</span>
                  <span className="text-sm text-gray-500">Ana Tiyatro</span>
                </div>
                <div className="bg-gray-100 rounded-xl p-4 h-64 flex items-center justify-center">
                  <div className="grid grid-cols-8 gap-2">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-6 h-6 rounded-full ${
                          i < 8 ? 'bg-yellow-400' : i < 16 ? 'bg-blue-400' : 'bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" /> VIP
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-400" /> Premium
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-400" /> Normal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              3 Adımda Bilet Satışına Başlayın
            </h2>
            <p className="text-xl text-gray-600">
              Karmaşık kurulum yok, teknik bilgi gerektirmez
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="bg-primary-50 rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Hesap Oluşturun
                </h3>
                <p className="text-gray-600">
                  Organizatör başvurunuzu gönderin, şirket bilgilerinizi ekleyin
                  ve yönetici onayını bekleyin.
                </p>
              </div>
              <ArrowRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-gray-300" />
            </div>

            <div className="relative">
              <div className="bg-primary-50 rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Etkinliğinizi Ekleyin
                </h3>
                <p className="text-gray-600">
                  Etkinlik detaylarını girin, bilet fiyatlarını belirleyin 
                  ve salon planı oluşturun.
                </p>
              </div>
              <ArrowRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-gray-300" />
            </div>

            <div>
              <div className="bg-primary-50 rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Satışa Başlayın
                </h3>
                <p className="text-gray-600">
                  Bilet mağazanızı paylaşın, sosyal medyada tanıtın 
                  ve satışları izleyin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Örnek mağaza + Şeffaf Fiyatlandırma */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
                Örnek bilet mağazası
              </h2>
              <div className="relative mx-auto max-w-md lg:mx-0">
                <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
                  <div className="space-y-4 rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                          <Ticket className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Yıldız Konseri 2024</p>
                          <p className="text-sm text-gray-500">15 Mart 2024 · 20:00</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-primary-600">₺350</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg border-2 border-primary-500 bg-white p-3 text-center">
                          <p className="text-sm text-gray-600">VIP</p>
                          <p className="font-bold text-gray-900">₺500</p>
                          <p className="text-xs text-green-600">40 kalan</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                          <p className="text-sm text-gray-600">Premium</p>
                          <p className="font-bold text-gray-900">₺350</p>
                          <p className="text-xs text-gray-500">80 kalan</p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                          <p className="text-sm text-gray-600">Normal</p>
                          <p className="font-bold text-gray-900">₺200</p>
                          <p className="text-xs text-gray-500">120 kalan</p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-full rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 py-3 font-semibold text-white"
                    >
                      Bilet al
                    </button>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 rounded-xl border border-gray-100 bg-white p-4 shadow-lg md:-bottom-4 md:-right-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Güvenli ödeme</p>
                      <p className="text-sm text-gray-500">256-bit SSL</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 lg:text-4xl">
                Şeffaf Fiyatlandırma
              </h2>
              <p className="mb-8 text-xl text-gray-600">
                Gizli maliyet yok, aylık ücret yok. Sadece satılan bilet başına %5
                komisyon.
              </p>
              <div className="rounded-2xl bg-white p-8 shadow-xl md:p-12">
                <div className="mb-8 flex flex-col items-center justify-center gap-8 md:flex-row">
                  <div className="text-center">
                    <p className="mb-1 text-sm text-gray-500">Bilet fiyatı</p>
                    <p className="text-3xl font-bold text-gray-900">₺100</p>
                  </div>
                  <div className="text-gray-300">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-sm text-gray-500">Siz kazanırsınız</p>
                    <p className="text-3xl font-bold text-green-600">₺95</p>
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-sm text-gray-500">Platform</p>
                    <p className="text-3xl font-bold text-primary-600">₺5</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Örnek: ₺100’lük bilet satışında %5 komisyon (₺5) alınır, kalan ₺95
                  organizatöre aktarılır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
