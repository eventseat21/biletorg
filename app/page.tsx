import Link from 'next/link'
import { Calendar, Ticket, BarChart3, MapPin, ChevronRight } from 'lucide-react'
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
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Etkinlik biletleme işlemlerinize birkaç dakika içinde başlayın
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Kendi çevrimiçi bilet satış mağazanızda sadece birkaç dakika içinde bilet satmaya başlayın ve bunu web sitenize kolayca entegre edin. Etkinliğin türü ne olursa olsun, organizatör olarak bilet satışlarınıza bugün başlayın.
              </p>
              <Link 
                href="/organizer/register" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Hemen Başlayın
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="relative">
              <img 
                src="/21.png" 
                alt="Bilet satışı başlatma" 
                className="rounded-2xl shadow-xl w-full"
              />
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
              Salon tasarımı, bilet kategorileri ve satış yönetimini tek platformda birleştirdik.
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
