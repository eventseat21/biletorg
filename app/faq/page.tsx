'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Ticket, Search } from 'lucide-react'

const faqs = [
  {
    category: 'Genel',
    questions: [
      {
        q: 'BiletOrg nedir?',
        a: 'BiletOrg, etkinlik organizatörleri için profesyonel bilet satış ve yönetim platformudur. Kendi bilet mağazanızı oluşturun, salon planı tasarlayın ve etkinliklerinizi kolayca yönetin.'
      },
      {
        q: 'BiletOrg kimler için uygun?',
        a: 'Konser organizatörleri, tiyatro yöneticileri, konferans planlayıcıları, spor kulüpleri, eğitim kurumları ve her türlü etkinlik düzenleyen profesyoneller için idealdir.'
      },
      {
        q: 'Ücretsiz deneme süresi var mı?',
        a: 'Evet! BiletOrg\'u tamamen ücretsiz deneyebilirsiniz. Etkinlik oluşturmak, salon planı hazırlamak ve bilet satışına başlamak için hiçbir ücret ödemezsiniz. Sadece bilet sattığınızda %5 komisyon ödersiniz.'
      }
    ]
  },
  {
    category: 'Fiyatlandırma',
    questions: [
      {
        q: 'Fiyatlandırma nasıl çalışıyor?',
        a: 'Aylık ücret yok! Sadece sattığınız bilet başına %5 komisyon ödersiniz. Örneğin, 100 TL\'lik bilet satışından 95 TL sizin olur, 5 TL platform komisyonudur.'
      },
      {
        q: 'Gizli maliyet var mı?',
        a: 'Hayır. BiletOrg\'da gizli maliyet yoktur. İşlem ücretleri, entegrasyon ücretleri veya ekstra ücretler talep etmeyiz. Gördüğünüz %5 komisyon tek maliyetinizdir.'
      },
      {
        q: 'Ödemeler ne zaman hesabıma geçer?',
        a: 'Bilet satışlarından elde ettiğiniz gelir, etkinlik tarihinden 2 iş günü sonra otomatik olarak banka hesabınıza transfer edilir.'
      },
      {
        q: 'İptal edilen biletlerden komisyon alınır mı?',
        a: 'Hayır. İptal edilen biletlerden komisyon alınmaz. Müşteriye tam iade yapılır, sizden de kesinti olmaz.'
      }
    ]
  },
  {
    category: 'Bilet Satışı',
    questions: [
      {
        q: 'Bilet nasıl satarım?',
        a: 'Etkinliğinizi oluşturun, bilet kategorilerini ve fiyatlarını belirleyin, salon planınızı hazırlayın ve bilet mağazanızı yayına açın. Müşterileriniz online olarak bilet alabilir.'
      },
      {
        q: 'Müşteriler hangi ödeme yöntemlerini kullanabilir?',
        a: 'Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme seçenekleri sunulmaktadır. 3D Secure ile güvenli ödeme altyapısı kullanıyoruz.'
      },
      {
        q: 'Koltuk seçimi nasıl çalışıyor?',
        a: 'Görsel salon planı editörümüz ile koltuk düzeni oluşturabilirsiniz. Müşterileriniz salon planından istedikleri koltukları seçerek bilet alabilirler.'
      },
      {
        q: 'Biletler dijital mi yoksa fiziksel mi?',
        a: 'Biletler dijital olarak gönderilir. Her bilete benzersiz QR kod atanır. Müşteriler telefonlarında veya yazdırarak kullanabilir.'
      }
    ]
  },
  {
    category: 'Salon Planı',
    questions: [
      {
        q: 'Salon planı nasıl oluşturabilirim?',
        a: 'İki yöntem var: 1) Manuel olarak sürükle-bırak editörü ile koltukları yerleştirin, 2) Mevcut SVG dosyanızı import edip otomatik koltuk tanıma kullanın.'
      },
      {
        q: 'Hangi dosya formatlarını destekliyorsunuz?',
        a: 'SVG formatında salon planlarını import edebilirsiniz. SVG içindeki circle, rect ve g.seat elementleri otomatik olarak koltuk olarak tanınır.'
      },
      {
        q: 'VIP, Premium gibi koltuk kategorileri oluşturabilir miyim?',
        a: 'Evet! Koltuklara farklı kategoriler (VIP, Premium, Normal, Engelli Erişimli) atayabilir, her kategori için farklı fiyatlandırma yapabilirsiniz.'
      }
    ]
  },
  {
    category: 'Teknik',
    questions: [
      {
        q: 'Mobil uyumlu mu?',
        a: 'Evet, tüm sayfalarımız mobil cihazlara tam uyumludur. Müşterileriniz telefonlarından kolayca bilet alabilir.'
      },
      {
        q: 'Güvenlik nasıl sağlanıyor?',
        a: '256-bit SSL şifreleme, 3D Secure ödeme doğrulama ve PCI-DSS uyumlu altyapı kullanıyoruz. Verileriniz banka seviyesinde güvenliktedir.'
      },
      {
        q: 'Kendi domain\'im ile kullanabilir miyim?',
        a: 'Evet, Profesyonel ve Kurumsal paketlerde kendi domain adınızı kullanabilirsiniz. Markanıza özel bilet mağazası oluşturun.'
      }
    ]
  },
  {
    category: 'Destek',
    questions: [
      {
        q: 'Destek alabilir miyim?',
        a: 'Evet! 7/24 e-posta desteği ve canlı sohbet desteği sunuyoruz. Profesyonel pakette öncelikli destek, Kurumsal pakette telefon desteği de bulunmaktadır.'
      },
      {
        q: 'Eğitim kaynakları var mı?',
        a: 'Detaylı yardım merkezi, video eğitimler ve en iyi uygulama rehberleri platformumuzda mevcuttur.'
      },
      {
        q: 'Sorun yaşarsam ne yapmalıyım?',
        a: 'Canlı destek hattımızdan veya destek@biletorg.com adresinden bize ulaşabilirsiniz. Sorunlarınızı en kısa sürede çözüyoruz.'
      }
    ]
  }
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
           q.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

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
              <Link href="/benefits" className="text-gray-600 hover:text-gray-900">Avantajlar</Link>
              <Link href="/faq" className="text-indigo-600 font-medium">SSS</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Giriş Yap</Link>
              <Link href="/organizer/register" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 text-sm font-medium">Başla</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Yardım Merkezi
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Sık Sorulan Sorular
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            BiletOrg hakkında merak ettiğiniz tüm soruların cevapları burada.
            Aradığınızı bulamıyorsanız destek ekibimize ulaşın.
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Soru ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFaqs.map((category, catIndex) => (
            <div key={category.category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-lg">
                  {catIndex + 1}
                </span>
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, qIndex) => {
                  const id = `${category.category}-${qIndex}`
                  const isOpen = openItems.includes(id)
                  return (
                    <div
                      key={id}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isOpen ? 'border-indigo-200 shadow-md' : 'border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => toggleItem(id)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6">
                          <p className="text-gray-600 leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aradığınız soruyu bulamadık.</p>
              <p className="text-gray-400 text-sm mt-2">Farklı anahtar kelimeler deneyin veya destek ekibimize ulaşın.</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">
            Aradığınız Cevabı Bulamadınız mı?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Destek ekibimiz size yardımcı olmaya hazır. 
            7/24 canlı destek ve e-posta desteği sunuyoruz.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:destek@biletorg.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              E-posta Gönder
            </a>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-500 text-white border-2 border-indigo-400 rounded-xl font-semibold hover:bg-indigo-400 transition-colors"
            >
              İletişim Formu
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
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">BiletOrg</span>
              </div>
              <p className="text-sm">Profesyonel etkinlik yönetimi ve bilet satış platformu.</p>
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
                <li><Link href="/faq" className="hover:text-white">SSS</Link></li>
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
