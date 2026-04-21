import Link from 'next/link'
import { 
  Check, 
  X, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  Ticket,
  Percent,
  Zap,
  Shield,
  Clock,
  Users,
  CreditCard,
  BarChart3,
  QrCode,
  Smartphone,
  Globe,
  Mail,
  MessageCircle,
  Calculator
} from 'lucide-react'
import MobileNav from '@/components/mobile-nav'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                BiletOrg
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Ana Sayfa</Link>
              <Link href="/events" className="text-gray-600 hover:text-gray-900">Etkinlikler</Link>
              <Link href="/ticketshop" className="text-gray-600 hover:text-gray-900">Ticketshop</Link>
              <Link href="/saalplan" className="text-gray-600 hover:text-gray-900">Salon Planı</Link>
              <Link href="/pricing" className="text-indigo-600 font-medium">Fiyatlandırma</Link>
              <Link href="/benefits" className="text-gray-600 hover:text-gray-900">Avantajlar</Link>
              <Link href="/faq" className="text-gray-600 hover:text-gray-900">SSS</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Giriş Yap</Link>
              <Link href="/organizer/register" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm font-medium">Başla</Link>
            </div>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Şeffaf Fiyatlandırma
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Komisyon Başına Ödeyin
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Aylık ücret yok, gizli maliyet yok. Sadece sattığınız bilet başına 
            %5 komisyon ödersiniz. Gerisi tamamen sizin.
          </p>
          
          {/* Price Calculator */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto border border-gray-100">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Calculator className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Komisyon Hesaplayıcı</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Bilet Fiyatı</p>
                <p className="text-3xl font-bold text-gray-900">₺100</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                  <Percent className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-sm text-gray-500">Platform Komisyonu</p>
                <p className="text-lg font-semibold text-primary-600">%5</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Siz Kazanırsınız</p>
                <p className="text-3xl font-bold text-green-600">₺95</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tüm Özellikler Dahil
            </h2>
            <p className="text-xl text-gray-600">
              Her etkinlik için aynı düşük komisyon, tüm özellikler açık
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Başlangıç</h3>
                <p className="text-gray-500 text-sm">Küçük etkinlikler için</p>
              </div>
              <div className="text-center mb-6">
                <span className="text-5xl font-bold text-gray-900">%5</span>
                <span className="text-gray-500">/bilet</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>500'e kadar katılımcı</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Temel bilet mağazası</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>E-posta desteği</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span>Koltuk seçimi</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-400">
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span>Özel domain</span>
                </li>
              </ul>
              <Link 
                href="/organizer/register" 
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-200 transition-colors"
              >
                Ücretsiz Başla
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="bg-gradient-to-b from-primary-600 to-primary-700 rounded-2xl p-8 text-white relative transform scale-105 shadow-2xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                  En Popüler
                </span>
              </div>
              <div className="text-center mb-6 pt-4">
                <h3 className="text-xl font-semibold mb-2">Profesyonel</h3>
                <p className="text-primary-100 text-sm">Profesyonel organizatörler için</p>
              </div>
              <div className="text-center mb-6">
                <span className="text-5xl font-bold">%5</span>
                <span className="text-primary-200">/bilet</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-primary-100">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Sınırsız katılımcı</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-primary-100">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Markalı bilet mağazası</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-primary-100">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Görsel koltuk seçimi</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-primary-100">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Özel domain desteği</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-primary-100">
                  <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span>Öncelikli destek</span>
                </li>
              </ul>
              <Link 
                href="/organizer/register" 
                className="block w-full py-3 px-4 bg-white text-primary-600 rounded-xl font-semibold text-center hover:bg-gray-100 transition-colors"
              >
                Hemen Başla
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Kurumsal</h3>
                <p className="text-gray-500 text-sm">Büyük organizasyonlar için</p>
              </div>
              <div className="text-center mb-6">
                <span className="text-5xl font-bold text-gray-900">Özel</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Profesyonel paketteki her şey</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Özel komisyon oranı</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>API erişimi</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Özel entegrasyonlar</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>7/24 telefon desteği</span>
                </li>
              </ul>
              <Link 
                href="/coming-soon" 
                className="block w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-200 transition-colors"
              >
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Included */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tüm Paketlerde Dahil
            </h2>
            <p className="text-xl text-gray-600">
              %5 komisyon ile aldığınız her şey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Sınırsız Etkinlik</h4>
                <p className="text-sm text-gray-600">İstediğiniz kadar etkinlik oluşturun</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Sınırsız Katılımcı</h4>
                <p className="text-sm text-gray-600">Profesyonel ve Kurumsal pakette limit yok</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Ödeme Altyapısı</h4>
                <p className="text-sm text-gray-600">Kredi kartı ve havale/EFT entegrasyonu</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">QR Kod Biletler</h4>
                <p className="text-sm text-gray-600">Her bilete özel QR kod ve kontrol</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Satış Analizi</h4>
                <p className="text-sm text-gray-600">Gerçek zamanlı raporlar ve istatistikler</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">E-posta Bildirimleri</h4>
                <p className="text-sm text-gray-600">Otomatik bilet ve hatırlatma e-postaları</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Mobil Uyumlu</h4>
                <p className="text-sm text-gray-600">Tüm cihazlarda mükemmel görünüm</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">SSL Güvenliği</h4>
                <p className="text-sm text-gray-600">256-bit şifreleme ile güvenli ödeme</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">7/24 Erişim</h4>
                <p className="text-sm text-gray-600">Platforma her zaman, her yerden erişin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Sık Sorulan Sorular
            </h2>
            <p className="text-xl text-gray-600">
              Fiyatlandırma hakkında bilmeniz gerekenler
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Aylık ücret var mı?
              </h4>
              <p className="text-gray-600">
                Hayır, BiletOrg'da aylık ücret yoktur. Sadece sattığınız bilet başına %5 komisyon ödersiniz. 
                Etkinlik oluşturmak, salon planı hazırlamak tamamen ücretsizdir.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Ödemeler ne zaman hesabıma geçer?
              </h4>
              <p className="text-gray-600">
                Bilet satışlarından elde ettiğiniz gelir, etkinlik tarihinden 2 iş günü sonra 
                otomatik olarak banka hesabınıza transfer edilir.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Ücretsiz iptal edilen biletlerden komisyon alınır mı?
              </h4>
              <p className="text-gray-600">
                İptal edilen biletlerden komisyon alınmaz. Müşteriye tam iade yapılır, 
                sizden de kesinti olmaz.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Kurumsal paket için minimum satış şartı var mı?
              </h4>
              <p className="text-gray-600">
                Evet, Kurumsal paket için yıllık minimum 10.000 bilet satışı şartı vardır. 
                Detaylar için satış ekibimizle iletişime geçin.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Paketimi sonradan yükseltebilir miyim?
              </h4>
              <p className="text-gray-600">
                Evet, istediğiniz zaman paketinizi yükseltebilir veya düşürebilirsiniz. 
                Değişiklikler bir sonraki etkinliğinizden itibaren geçerli olur.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ücretsiz Başlayın, Sattıkça Ödeyin
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Hemen ücretsiz hesap oluşturun, ilk etkinliğinizi kurun ve 
            sadece bilet sattığınızda komisyon ödeyin.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/organizer/register" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg"
            >
              Ücretsiz Hesap Oluştur
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/coming-soon" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white border-2 border-primary-400 rounded-xl font-semibold hover:bg-primary-400 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Satış Ekibiyle Konuş
            </Link>
          </div>
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
                <li><Link href="/ticketshop" className="hover:text-white">Ticketshop</Link></li>
                <li><Link href="/saalplan" className="hover:text-white">Salon Planı</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Fiyatlandırma</Link></li>
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
