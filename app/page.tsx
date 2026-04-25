import Link from 'next/link'
import { Calendar, Ticket, BarChart3, MapPin, ChevronRight, Star, ScanLine, Wallet, FileSpreadsheet } from 'lucide-react'
import Header from '@/components/header'
import { SiteFooter } from '@/components/site-footer'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Header />

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
              Organizatör başarısı,
              <br />
              güçlü bilet satışıyla başlar
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 leading-relaxed">
              BiletOrg; organizatörler için salon planı tasarlama, bilet
              kategorilerini oluşturma, online ve gişe satışını tek platformda
              birleştirir. Kendi bilet mağazanızı dakikalar içinde açıp satışa
              hemen başlayın.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/organizer/register" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg font-semibold">
                Şimdi Kayıt Olun
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
              Etkinlik biletleme için ihtiyacınız olan her şey
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Eventim benzeri uçtan uca akış, BiletOrg farkıyla salon tasarımını ve
              satışı tek panelde kolaylaştırır.
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

      {/* Homepage Module Overview */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Modüler ürün yapısı: kısa anlatım, detay sayfaları
            </h2>
            <p className="text-xl text-gray-600">
              Ana sayfada kısa özet; her başlık için ayrı detay sayfası
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ModuleCard
              icon={<MapPin className="w-6 h-6" />}
              title="Salon Tasarımı (SVG Destekli)"
              description="Hazır SVG yükleyin, sistem koltuk alanlarını hızlıca satışa uygun hale getirsin."
              href="/saalplan"
            />
            <ModuleCard
              icon={<Ticket className="w-6 h-6" />}
              title="Biletleme ve Kategori Yönetimi"
              description="VIP, Premium, Normal gibi kategorileri oluşturun; fiyat ve stokları tek ekrandan yönetin."
              href="/ticketshop"
            />
            <ModuleCard
              icon={<ScanLine className="w-6 h-6" />}
              title="QR ile Giriş Kontrolü"
              description="Etkinlik günü hızlı ve güvenli kontrol için QR tabanlı giriş sürecini yönetin."
              href="/benefits"
            />
            <ModuleCard
              icon={<Wallet className="w-6 h-6" />}
              title="Muhasebe ve Gelir Akışı"
              description="Satış, komisyon ve aktarım süreçlerini takip ederek operasyonu tek yerden yönetin."
              href="/pricing"
            />
            <ModuleCard
              icon={<FileSpreadsheet className="w-6 h-6" />}
              title="Fiyat Hesaplama Mekanizması"
              description="Şeffaf komisyon modeli ile bilet fiyatı, platform payı ve net kazancı anlık görün."
              href="/pricing"
            />
            <ModuleCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Raporlama ve Performans"
              description="Etkinlik bazlı satış eğilimlerini izleyin, sonraki kampanyaları veriye göre optimize edin."
              href="/benefits"
            />
          </div>
        </div>
      </section>

      {/* Visual Slots For Future Photos */}
      <section className="section bg-white">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="min-h-[220px] rounded-xl border border-gray-200 bg-white/80 p-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Sol görsel alanı</p>
                <p className="text-sm text-gray-500">
                  Buraya "salon tasarımı nasıl yapılır?" bölümünü destekleyen görsel
                  eklenebilir.
                </p>
              </div>
              <div className="min-h-[220px] rounded-xl border border-gray-200 bg-white/80 p-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Sağ görsel alanı</p>
                <p className="text-sm text-gray-500">
                  Buraya "satış ve raporlama" gibi modülleri anlatan ikinci görsel
                  eklenebilir.
                </p>
              </div>
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
                Organizatör başvurunuzu gönderin; onay sonrası etkinliklerinizi yönetmeye
                başlayın. Bireysel bilet alıcı üyeliği yoktur.
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

      <SiteFooter />
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

function ModuleCard({
  icon,
  title,
  description,
  href
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <div className="card p-6 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-700 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{description}</p>
      <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-800">
        Detayı aç
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
