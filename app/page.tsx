import Link from 'next/link'
import { Calendar, Ticket, BarChart3, MapPin, ChevronRight, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
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
              <Link href="/benefits" className="text-gray-600 hover:text-gray-900">Avantajlar</Link>
              <Link href="/faq" className="text-gray-600 hover:text-gray-900">SSS</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Giriş Yap</Link>
              <Link href="/organizer/register" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm font-medium">Başla</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/concert-hero.jpg" 
            alt="Concert" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/70 to-purple-900/50" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Etkinliklerinizi<br />Profesyonel Yönetin
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 leading-relaxed">
              Bilet satışından muhasebeye kadar her şey tek platformda. 
              Organizatörler için tasarlanmış, kullanıcı dostu çözüm.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/organizer/register" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold">
                Organizatör Ol
              </Link>
              <Link href="/events" className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg font-semibold">
                Etkinlikleri Keşfet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden BiletOrg?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Etkinlik yönetimini kolaylaştıran tüm özellikler tek çatı altında
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Calendar className="w-8 h-8" />}
              title="Kolay Etkinlik Yönetimi"
              description="Etkinliklerinizi dakikalar içinde oluşturun, düzenleyin ve yayınlayın."
            />
            <FeatureCard 
              icon={<MapPin className="w-8 h-8" />}
              title="Görsel Salon Editörü"
              description="Koltuk düzenini sürükle-bırak ile tasarlayın, VIP alanlarını belirleyin."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8" />}
              title="Detaylı Raporlama"
              description="Gelir, satış ve katılımcı istatistiklerini gerçek zamanlı takip edin."
            />
            <FeatureCard 
              icon={<Ticket className="w-8 h-8" />}
              title="Akıllı Bilet Yönetimi"
              description="QR kod ile giriş kontrolü, aktarılabilir biletler ve daha fazlası."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-xl text-gray-600">
              4 adımda etkinlik oluşturmaya başlayın
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <StepCard 
              number="1"
              title="Hesap Oluştur"
              description="Organizatör başvurunuzu yapın, onaylanması 24 saati bulmaz."
            />
            <StepCard 
              number="2"
              title="Salonunuzu Tasarlayın"
              description="Görsel editör ile koltuk düzenini oluşturun."
            />
            <StepCard 
              number="3"
              title="Etkinlik Oluşturun"
              description="Detayları girin, bilet kategorilerini belirleyin."
            />
            <StepCard 
              number="4"
              title="Satışa Başlayın"
              description="Etkinliğinizi yayınlayın, gelirlerinizi takip edin."
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-primary-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-primary-200">Aktif Etkinlik</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
              <div className="text-primary-200">Satılan Bilet</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">200+</div>
              <div className="text-primary-200">Organizatör</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA with Background Image */}
      <section className="section bg-white">
        <div className="container mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img 
                src="/concert-crowd.jpg" 
                alt="Concert crowd" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/70 to-gray-900/50" />
            </div>
            <div className="relative p-8 md:p-16 text-center text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 drop-shadow-lg">
                Hemen Başlamaya Hazır mısınız?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
                Ücretsiz hesap oluşturun, ilk etkinliğinizi oluşturmaya başlayın. 
                Kredi kartı gerekmez.
              </p>
              <Link 
                href="/organizer/register" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Organizatör Hesabı Aç
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">BiletOrg</div>
              <p className="text-sm">
                Organizatörler için profesyonel bilet yönetim sistemi.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/events" className="hover:text-white">Etkinlikler</Link></li>
                <li><Link href="/organizer/register" className="hover:text-white">Organizatör Ol</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Fiyatlandırma</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/help" className="hover:text-white">Yardım Merkezi</Link></li>
                <li><Link href="/contact" className="hover:text-white">İletişim</Link></li>
                <li><Link href="/faq" className="hover:text-white">SSS</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white">Kullanım Şartları</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Gizlilik Politikası</Link></li>
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
