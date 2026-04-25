import Link from 'next/link'
import Image from 'next/image'
import { 
  Map, 
  MousePointer, 
  Palette, 
  Layers, 
  Upload, 
  Grid3X3,
  Check,
  ArrowRight,
  Sparkles,
  ZoomIn,
  Move,
  Trash2,
  Save,
  Download,
  QrCode,
  Ticket,
  Users,
  Armchair,
  Maximize2,
  Eye,
  RotateCcw
} from 'lucide-react'
import Header from '@/components/header'
import { SiteFooter } from '@/components/site-footer'

export default function SaalplanPage() {
  return (
    <div className="min-h-screen bg-white">
<Header />

      {/* Hero Section with Background Image */}
      <section className="relative pt-32 pb-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/concert-saalplan.jpg" 
            alt="Theater interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-indigo-900/70 to-indigo-900/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Yeni: SVG Import
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
                Dijital{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                  Salon Planı
                </span>{' '}
                Oluşturun
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed drop-shadow">
                Etkinlik mekanınızın dijital kopyasını oluşturun, koltukları yönetin 
                ve biletleme sistemine entegre edin. Manuel çizim veya SVG import seçenekleri.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/organizer/register"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-200"
                >
                  Organizatör başvurusu
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/coming-soon"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  Demo görüntüle
                </Link>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-yellow-400" /> Sürükle-bırak
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-yellow-400" /> SVG Import
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-yellow-400" /> 3D Önizleme
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                {/* Mock Hall Editor */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-900">Ana Salon Editörü</span>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <ZoomIn className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Move className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 h-64 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Stage */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium">
                      SAHNE
                    </div>
                    {/* Seats Grid */}
                    <div className="mt-12 grid grid-cols-10 gap-2">
                      {Array.from({ length: 60 }).map((_, i) => {
                        const row = Math.floor(i / 10)
                        const isVIP = row < 2
                        const isPremium = row >= 2 && row < 4
                        return (
                          <div 
                            key={i} 
                            className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                              isVIP ? 'bg-yellow-400 border-2 border-yellow-500' : 
                              isPremium ? 'bg-blue-400 border-2 border-blue-500' : 
                              'bg-gray-300 border-2 border-gray-400'
                            }`}
                            title={`${String.fromCharCode(65 + row)}${(i % 10) + 1}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" /> VIP (A-B)
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-400 border border-blue-500" /> Premium (C-D)
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gray-300 border border-gray-400" /> Normal
                    </span>
                  </div>
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">120 koltuk</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Grid3X3 className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="font-medium text-gray-900">6x20 Düzen</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Methods Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              İki Yöntem, Aynı Sonuç
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              İster sıfırdan çizin, ister mevcut planı import edin. 
              Her iki yöntemde de profesyonel sonuç.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Method 1: Manual */}
            <div className="group bg-gradient-to-br from-primary-50 to-white rounded-2xl p-8 border border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MousePointer className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Manuel Çizim
              </h3>
              <p className="text-gray-600 mb-6">
                Sürükle-bırak arayüzü ile koltukları tek tek yerleştirin. 
                Küçük mekanlar ve özel düzenler için ideal.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-primary-500" />
                  <span>Tam kontrol üzerinde düzenleme</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-primary-500" />
                  <span>Satır/sütun otomatik oluşturma</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-primary-500" />
                  <span>Koltuk şekli ve boyut özelleştirme</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-primary-500" />
                  <span>Boşluk ve koridor tanımlama</span>
                </li>
              </ul>
              <div className="bg-white rounded-xl p-4 border border-primary-100">
                <p className="text-sm text-gray-500 mb-2">En iyi kullanım:</p>
                <p className="text-sm font-medium text-gray-900">
                  Küçük tiyatro, toplantı salonu, sınıf düzeni
                </p>
              </div>
            </div>

            {/* Method 2: SVG Import */}
            <div className="group bg-gradient-to-br from-green-50 to-white rounded-2xl p-8 border border-green-100 hover:border-green-300 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                SVG Import
              </h3>
              <p className="text-gray-600 mb-6">
                Mevcut salon planınızı (SVG formatında) yükleyin. 
                Sistem otomatik olarak koltukları tanır ve interaktif hale getirir.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Saniyeler içinde hazır plan</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Otomatik circle/rect tanıma</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Vektör kalitesinde görsel</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <Check className="w-5 h-5 text-green-500" />
                  <span>Sonradan düzenleme imkanı</span>
                </li>
              </ul>
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-500 mb-2">En iyi kullanım:</p>
                <p className="text-sm font-medium text-gray-900">
                  Stadyum, konser salonu, sinema, büyük tiyatro
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SVG Workflow */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-sm font-medium mb-6">
              <Upload className="w-4 h-4" />
              SVG → Konva → Biletleme
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              SVG Import Akışı
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Mevcut planınızı dakikalar içinde satılabilir koltuk düzenine dönüştürün
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center h-full">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <Upload className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">SVG Yükle</h4>
                <p className="text-sm text-gray-400">
                  Organizatör salon planını SVG olarak yükler
                </p>
              </div>
              <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 text-gray-600" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center h-full">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <Eye className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Tanıma</h4>
                <p className="text-sm text-gray-400">
                  Sistem circle ve rect elementlerini algılar
                </p>
              </div>
              <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 text-gray-600" />
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center h-full">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <Palette className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Kategori Ata</h4>
                <p className="text-sm text-gray-400">
                  VIP, Premium, Normal kategorileri belirle
                </p>
              </div>
              <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 text-gray-600" />
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center h-full">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  4
                </div>
                <Save className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">JSON Export</h4>
                <p className="text-sm text-gray-400">
                  Koltuk verileri JSON formatında kaydedilir
                </p>
              </div>
              <ArrowRight className="hidden md:block absolute top-1/2 -right-3 w-6 h-6 text-gray-600" />
            </div>

            {/* Step 5 */}
            <div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center h-full">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  5
                </div>
                <QrCode className="w-8 h-8 text-primary-400 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Satışa Açıl</h4>
                <p className="text-sm text-gray-400">
                  Müşteri koltuk seçimi yapar ve satın alır
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editor Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Profesyonel Editör Özellikleri
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Konva.js tabanlı görsel editör ile tam kontrol
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MousePointer className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sürükle-Bırak</h3>
              <p className="text-sm text-gray-600">
                Koltukları istediğiniz yere sürükleyin, anında pozisyon güncellemesi
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Maximize2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Zoom & Pan</h3>
              <p className="text-sm text-gray-600">
                Büyük salonlarda yakınlaştırma ve kaydırma ile kolay düzenleme
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Katmanlar</h3>
              <p className="text-sm text-gray-600">
                Koltuklar, koridorlar, sahne ve öğeler katmanlı yapıda
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Palette className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Renk Kodlama</h3>
              <p className="text-sm text-gray-600">
                VIP, Premium, Normal kategoriler için farklı renkler
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Grid Sistem</h3>
              <p className="text-sm text-gray-600">
                Hizalama grid'i ile düzenli koltuk yerleşimi
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Armchair className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Koltuk Şekilleri</h3>
              <p className="text-sm text-gray-600">
                Daire, kare veya özel şekillerde koltuk tasarımı
              </p>
            </div>

            {/* Feature 7 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Toplu Silme</h3>
              <p className="text-sm text-gray-600">
                Çoklu seçim ve sağ tık ile hızlı silme
              </p>
            </div>

            {/* Feature 8 */}
            <div className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Geri Al</h3>
              <p className="text-sm text-gray-600">
                Son işlemleri geri alma ve değişiklik geçmişi
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Her Mekan İçin Uygun
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Küçük salonlardan büyük stadyumlara, her türlü mekan için esnek çözümler
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Ticket className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Tiyatro</h4>
              <p className="text-sm text-gray-600">
                Orkestra, balkon, loca düzeni. Koltuk numaralandırma ve görüş açısı optimizasyonu.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Konser Salonu</h4>
              <p className="text-sm text-gray-600">
                Parterre, mezzanine, loge. Ayakta ve oturaraki alan tanımlama.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                <Map className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Stadyum</h4>
              <p className="text-sm text-gray-600">
                Tribün, blok, sıra yapısı. Binlerce koltuklu büyük kapasite yönetimi.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <Armchair className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Sinema</h4>
              <p className="text-sm text-gray-600">
                Eğimli salon, engelli koltukları, çift koltuk düzeni.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Biletleme ile Tam Entegrasyon
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Oluşturduğunuz salon planı otomatik olarak biletleme sistemine entegre olur. 
                Her koltuk için ayrı fiyatlandırma ve stok yönetimi.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Koltuk Bazlı Satış</h4>
                    <p className="text-gray-600">Müşteri görsel olarak koltuk seçer ve satın alır</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Kategori Fiyatlandırması</h4>
                    <p className="text-gray-600">VIP, Premium, Normal için farklı fiyatlar</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Gerçek Zamanlı Stok</h4>
                    <p className="text-gray-600">Satılan koltuklar anında işaretlenir, çifte satış engellenir</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-semibold text-gray-900">Koltuk Seçimi</p>
                    <p className="text-sm text-gray-500">Yıldız Konseri 2024</p>
                  </div>
                  <span className="text-sm text-gray-500">4/200 koltuk seçildi</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                          i === 5 || i === 6 || i === 13 || i === 14
                            ? 'bg-primary-500 text-white'
                            : i < 8 ? 'bg-yellow-200 border border-yellow-300' :
                              i < 16 ? 'bg-blue-200 border border-blue-300' :
                              'bg-gray-200'
                        }`}
                      >
                        {i === 5 || i === 6 || i === 13 || i === 14 ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">B6 - VIP</span>
                    <span className="font-medium">₺500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">B7 - VIP</span>
                    <span className="font-medium">₺500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">C5 - Premium</span>
                    <span className="font-medium">₺350</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">C6 - Premium</span>
                    <span className="font-medium">₺350</span>
                  </div>
                </div>
                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Toplam</span>
                    <span>₺1.700</span>
                  </div>
                </div>
                <button className="w-full mt-4 py-3 bg-primary-600 text-white rounded-lg font-semibold">
                  Ödemeye Git
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            İlk salon planınızı oluşturun
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Organizatör hesabı onaylandıktan sonra salona girip salon planı ve koltukları
            yönetebilirsiniz. Başvuru için aşağıdaki formu kullanın.
          </p>
          <Link
            href="/organizer/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg"
          >
            Organizatör başvurusu
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
