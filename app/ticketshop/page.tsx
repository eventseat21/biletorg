import Link from 'next/link'
import Image from 'next/image'
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

export default function TicketshopPage() {
  return (
<div className="min-h-screen bg-white">
       <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Yeni: SVG Salon Import
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Kendi{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
                  Bilet Mağazanızı
                </span>{' '}
                Oluşturun
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Etkinlikleriniz için profesyonel, markanıza özel bir bilet satış sayfası oluşturun. 
                Dakikalar içinde kurulum, saniyeler içinde satış.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/organizer/register" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200"
                >
                  Hemen Başla
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                  href="/coming-soon" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Demo Görüntüle
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> Ücretsiz kurulum
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> %5 komisyon
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> 7/24 destek
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                {/* Mock Ticket Shop UI */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Yıldız Konseri 2024</p>
                        <p className="text-sm text-gray-500">15 Mart 2024 • 20:00</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-primary-600">₺350</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg text-center border-2 border-primary-500">
                        <p className="text-sm text-gray-600">VIP</p>
                        <p className="font-bold text-gray-900">₺500</p>
                        <p className="text-xs text-green-600">40 kalan</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                        <p className="text-sm text-gray-600">Premium</p>
                        <p className="font-bold text-gray-900">₺350</p>
                        <p className="text-xs text-gray-500">80 kalan</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center border border-gray-200">
                        <p className="text-sm text-gray-600">Normal</p>
                        <p className="font-bold text-gray-900">₺200</p>
                        <p className="text-xs text-gray-500">120 kalan</p>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold">
                    Bilet Al
                  </button>
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Güvenli Ödeme</p>
                    <p className="text-sm text-gray-500">256-bit SSL</p>
                  </div>
                </div>
              </div>
            </div>
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
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  Ücretsiz organizatör hesabı açın, şirket bilgilerinizi ekleyin 
                  ve onay alın.
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

      {/* Pricing Teaser */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Şeffaf Fiyatlandırma
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Gizli maliyet yok, aylık ücret yok. Sadece satılan bilet başına %5 komisyon.
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Bilet Fiyatı</p>
                <p className="text-3xl font-bold text-gray-900">₺100</p>
              </div>
              <div className="text-gray-300">
                <ArrowRight className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Siz Kazanırsınız</p>
                <p className="text-3xl font-bold text-green-600">₺95</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Platform</p>
                <p className="text-3xl font-bold text-primary-600">₺5</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              Örnek: ₺100'lük bilet satışında %5 komisyon (₺5) alınır, 
              kalan ₺95 organizatöre aktarılır.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Etkinliğinizi Hemen Satışa Açın
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Ücretsiz hesap oluşturun, ilk etkinliğinizi ekleyin ve dakikalar içinde 
            bilet satmaya başlayın.
          </p>
          <Link 
            href="/organizer/register" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200"
          >
            Ücretsiz Başla
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
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
                <li><Link href="/coming-soon" className="hover:text-white">Özellikler</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Fiyatlandırma</Link></li>
                <li><Link href="/ticketshop" className="hover:text-white">Ticketshop</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="hover:text-white">SSS</Link></li>
                <li><Link href="/support" className="hover:text-white">Destek Al</Link></li>
                <li><Link href="/contact" className="hover:text-white">İletişim</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hukuk</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/coming-soon" className="hover:text-white">Gizlilik</Link></li>
                <li><Link href="/coming-soon" className="hover:text-white">Kullanım Şartları</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © 2024 BiletOrg. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  )
}
