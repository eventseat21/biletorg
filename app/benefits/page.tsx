import Link from 'next/link'
import { 
  Check, 
  ArrowRight, 
  Sparkles,
  Ticket,
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
  Heart,
  Award,
  TrendingUp,
  Headphones,
  Lock,
  Palette,
  Layers,
  MapPin,
  Calendar,
  Star,
  ThumbsUp,
  Wallet
} from 'lucide-react'

export default function BenefitsPage() {
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
              <Link href="/events" className="text-gray-600 hover:text-gray-900">Etkinlikler</Link>
              <Link href="/ticketshop" className="text-gray-600 hover:text-gray-900">Ticketshop</Link>
              <Link href="/saalplan" className="text-gray-600 hover:text-gray-900">Salon Planı</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Fiyatlandırma</Link>
              <Link href="/benefits" className="text-indigo-600 font-medium">Avantajlar</Link>
              <Link href="/faq" className="text-gray-600 hover:text-gray-900">SSS</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Giriş Yap</Link>
              <Link href="/organizer/register" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm font-medium">Başla</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Neden BiletOrg?
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Etkinlik Düzenlemenin{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">
              En Akıllı Yolu
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Teknoloji, güvenlik ve kullanıcı deneyimini bir araya getirerek 
            etkinlik organizasyonunu kolaylaştırıyoruz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/organizer/register" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
            >
              Hemen Başla
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/demo" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Demo İzle
            </Link>
          </div>
        </div>
      </section>

      {/* Main Benefits Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Her Açıdan Üstün
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Organizatörler, katılımcılar ve etkinlikler için tasarlanmış 
              kapsamlı çözümler
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Hızlı Kurulum
              </h3>
              <p className="text-gray-600">
                10 dakikada etkinlik oluşturun, bilet satışına başlayın. 
                Karmaşık entegrasyonlar ve uzun öğrenme süreci yok.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Banka Seviyesinde Güvenlik
              </h3>
              <p className="text-gray-600">
                256-bit SSL şifreleme, 3D Secure ödemeler ve PCI-DSS uyumlu 
                altyapı ile tam güvenlik.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Şeffaf Fiyatlandırma
              </h3>
              <p className="text-gray-600">
                Aylık ücret yok, gizli maliyet yok. Sadece sattığınız bilet 
                başına %5 komisyon. Gerisi sizin.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Mobil Öncelikli
              </h3>
              <p className="text-gray-600">
                Tüm cihazlarda mükemmel görünüm. Apple Wallet ve Google Pay 
                entegrasyonu ile dijital biletler.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Akıllı Giriş Kontrolü
              </h3>
              <p className="text-gray-600">
                QR kod ile hızlı giriş, anlık kapasite takibi ve 
                sahte bilet önleme sistemi.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Gerçek Zamanlı Analitik
              </h3>
              <p className="text-gray-600">
                Satışları anlık izleyin, demografik verileri görün ve 
                stratejik kararlar alın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Organizers */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Organizatörler İçin
            </h2>
            <p className="text-xl text-gray-600">
              Etkinlik yönetimini kolaylaştıran profesyonel araçlar
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Markanıza Özel</h4>
                  <p className="text-gray-600">
                    Logo, renkler ve marka kimliğinizle özelleştirilebilir bilet mağazası. 
                    Kendi domain'inizi kullanın.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Çoklu Etkinlik</h4>
                  <p className="text-gray-600">
                    Aynı anda birden fazla etkinlik yönetin, hepsi tek hesaptan. 
                    Seri etkinlikler ve turneler için ideal.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Esnek Ödeme Seçenekleri</h4>
                  <p className="text-gray-600">
                    Kredi kartı, havale/EFT, kapıda ödeme ve taksit seçenekleri. 
                    İadeleri tek tıkla yapın.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Otomatik Yönetim</h4>
                  <p className="text-gray-600">
                    Bilet stoğu, erken kuş indirimleri ve satış dönemlerini 
                    otomatik yönetin.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-gray-900">Yıldız Konseri 2024</span>
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">Yayında</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-primary-600">1,240</p>
                    <p className="text-xs text-gray-500">Bilet Satıldı</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">₺142K</p>
                    <p className="text-xs text-gray-500">Gelir</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600">%85</p>
                    <p className="text-xs text-gray-500">Doluluk</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">VIP Biletler</span>
                  <span className="font-medium">42/50 satıldı</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: '84%' }}></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Normal Biletler</span>
                  <span className="font-medium">1,198/1,450 satıldı</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Attendees */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Katılımcılar İçin
            </h2>
            <p className="text-xl text-gray-600">
              Sorunsuz ve keyifli bir bilet satın alma deneyimi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Hızlı Satın Alma</h4>
              <p className="text-sm text-gray-600">
                60 saniyede bilet alın. Kayıtlı bilgilerle tek tıkla satın alma.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Güvenli Ödeme</h4>
              <p className="text-sm text-gray-600">
                3D Secure ve banka seviyesinde şifreleme ile güvenli işlemler.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Görsel Koltuk Seçimi</h4>
              <p className="text-sm text-gray-600">
                Salon planından istediğiniz koltuğu seçin, yerinizi önceden ayırtın.
              </p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Anında Bilet</h4>
              <p className="text-sm text-gray-600">
                Ödeme sonrası bilet e-postanıza anında gelsin, telefona kaydedin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Her Adımda Yanınızdayız
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Etkinliğinizin her aşamasında destek ekibimiz hazır
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">7/24 Destek</h4>
              <p className="text-gray-300">
                Teknik sorunlarınız için günün her saati destek ekibimize ulaşabilirsiniz.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Canlı Sohbet</h4>
              <p className="text-gray-300">
                Platform üzerinden anında canlı destek alın, sorularınızı hızla yanıtlayalım.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Eğitim ve Kaynaklar</h4>
              <p className="text-gray-300">
                Detaylı yardım merkezi, video eğitimler ve en iyi uygulama rehberleri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Güven ve Şeffaflık
            </h2>
            <p className="text-xl text-gray-600">
              Binlerce organizatörün ve milyonlarca katılımcının tercihi
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">5,000+</div>
              <p className="text-gray-600">Aktif Organizatör</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">50,000+</div>
              <p className="text-gray-600">Düzenlenen Etkinlik</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">2M+</div>
              <p className="text-gray-600">Satılan Bilet</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 mb-2">99.9%</div>
              <p className="text-gray-600">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Etkinliğinizi Bir Üst Seviyeye Taşıyın
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Ücretsiz hesap oluşturun, ilk etkinliğinizi dakikalar içinde kurun 
            ve profesyonel biletleme deneyimini keşfedin.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/organizer/register" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg"
            >
              Ücretsiz Başla
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/pricing" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-500 text-white border-2 border-primary-400 rounded-xl font-semibold hover:bg-primary-400 transition-all"
            >
              Fiyatlandırmayı Gör
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
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
                <li><Link href="/benefits" className="hover:text-white">Avantajlar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white">Yardım Merkezi</Link></li>
                <li><Link href="/contact" className="hover:text-white">İletişim</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hukuk</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Gizlilik</Link></li>
                <li><Link href="/terms" className="hover:text-white">Kullanım Şartları</Link></li>
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
