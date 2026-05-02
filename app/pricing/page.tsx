'use client'

import { useState } from 'react'
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
  Calculator,
  Info,
  Store,
  Computer
} from 'lucide-react'
import Header from '@/components/header'
import { SiteFooter } from '@/components/site-footer'

export default function PricingPage() {
  const [ticketPrice, setTicketPrice] = useState<number>(10)
  const [showTooltip, setShowTooltip] = useState(false)
  const [includeFees, setIncludeFees] = useState(false)

  // Eventim Light commission formula
  const calculateCommission = (price: number): number => {
    if (price < 7) {
      return price * 0.035 + 0.49
    } else {
      return price * 0.035 + 0.99
    }
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatCurrencyInt = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const commission = calculateCommission(ticketPrice)
  
  // Inklusive Gebühren logic
  let basePrice = ticketPrice
  let organizerEarnings = ticketPrice
  
  if (includeFees) {
    // When "Inklusive Gebühren" is checked, ticketPrice is the customer's total
    // We need to calculate what the organizer earns after commission
    organizerEarnings = ticketPrice - commission
  } else {
    // When unchecked, ticketPrice is the organizer's base price
    organizerEarnings = ticketPrice
  }

  // Channel 1: Customer's own ticket sales point (iframe)
  const channel1Commission = commission
  const channel1CustomerTotal = includeFees ? ticketPrice : ticketPrice + channel1Commission

  // Channel 2: Box office - same tiered commission as channel 1
  const channel2Commission = commission
  const channel2CustomerTotal = includeFees ? ticketPrice : ticketPrice + channel2Commission

  // Channel 3: Eventim Shop - commission + 10% reservation fee
  const reservationFee = basePrice * 0.10
  const channel3Commission = commission + reservationFee
  const channel3CustomerTotal = includeFees ? ticketPrice : ticketPrice + channel3Commission

  return (
    <div className="min-h-screen bg-white">
<Header />

      {/* Hero Section with Eventim Calculator */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-primary-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Şeffaf Fiyatlandırma
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Komisyon Başına Ödeyin
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Aylık ücret yok, gizli maliyet yok. Sadece sattığınız bilet başına 
              komisyon ödersiniz. Gerisi tamamen sizin.
            </p>
          </div>

          {/* Interactive Price Calculator - Eventim Style */}
          <div className="max-w-7xl mx-auto">
            {/* Input Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Calculator className="w-6 h-6 text-primary-600" />
                <h3 className="text-xl font-semibold text-gray-900">Bilet Fiyat Hesaplayıcı</h3>
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  {showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-gray-900 text-white text-sm p-4 rounded-lg shadow-xl z-50">
                      <p className="font-semibold mb-2">Komisyon Hesaplama:</p>
                      <p>Bilet ücreti, 6,99 €'ya kadar olan taban fiyatlar için %3,5 artı bilet başına 0,49 €, 7,00 € ve üzeri taban fiyatlar için ise bilet başına %3,5 artı bilet başına 0,99 €'dur.</p>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Bilet Fiyatı (€)
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setTicketPrice(Math.max(1, ticketPrice - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-primary-100 text-primary-600 rounded-xl hover:bg-primary-200 transition-colors text-2xl font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    value={ticketPrice.toFixed(2)}
                    onChange={(e) => setTicketPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-32 px-4 py-3 text-center text-2xl font-bold border-2 border-primary-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  />
                  <button
                    onClick={() => setTicketPrice(Math.min(1000, ticketPrice + 1))}
                    className="w-12 h-12 flex items-center justify-center bg-primary-100 text-primary-600 rounded-xl hover:bg-primary-200 transition-colors text-2xl font-bold"
                  >
                    +
                  </button>
                </div>
                
                {/* Inklusive Gebühren Toggle */}
                <div className="flex items-center justify-center gap-3 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFees}
                      onChange={(e) => setIncludeFees(e.target.checked)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Inklusive Gebühren</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 3 Channel Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Channel 1: Customer's own ticket sales point */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col">
                <div className="h-14 flex items-center justify-center mb-4">
                  <p className="text-sm text-gray-500 text-center">İsteğe bağlı genişletilmiş menzil</p>
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Computer className="w-6 h-6 text-primary-600" />
                  <h4 className="text-lg font-bold text-center">KENDİ BİLET SATIŞ NOKTANIZ</h4>
                </div>
                <div className="flex-1 space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Komisyon:</span>
                    <span className="font-semibold">{formatCurrency(commission)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Ön rezervasyon:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Gönderim:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Toplam maliyet:</span>
                    <span className="font-bold text-lg">{formatCurrency(channel1CustomerTotal)}</span>
                  </div>
                </div>
                <div className="mt-6 bg-blue-500 text-white p-4 rounded-xl text-center">
                  <p className="text-lg mb-1">Kazancınız</p>
                  <p className="text-4xl font-bold">{formatCurrencyInt(organizerEarnings)}</p>
                </div>
              </div>

              {/* Channel 2: Box office - same calculation as channel 1 */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col">
                <div className="h-14 flex items-center justify-center mb-4">
                  <p className="text-sm text-gray-500 text-center">İsteğe bağlı genişletilmiş menzil</p>
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Store className="w-6 h-6 text-primary-600" />
                  <h4 className="text-lg font-bold text-center">GİŞE (GÜNDÜZ/GECE)</h4>
                </div>
                <div className="flex-1 space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Komisyon:</span>
                    <span className="font-semibold">{formatCurrency(commission)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Ön rezervasyon:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Gönderim:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Toplam maliyet:</span>
                    <span className="font-bold text-lg">{formatCurrency(ticketPrice + commission)}</span>
                  </div>
                </div>
                <div className="mt-6 bg-blue-500 text-white p-4 rounded-xl text-center">
                  <p className="text-lg mb-1">Kazancınız</p>
                  <p className="text-4xl font-bold">{formatCurrencyInt(organizerEarnings)}</p>
                </div>
              </div>

              {/* Channel 3: Eventim Shop */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col">
                <div className="h-14 flex items-center justify-center mb-4">
                  <p className="text-sm text-gray-500 text-center">İsteğe bağlı genişletilmiş menzil</p>
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Globe className="w-6 h-6 text-primary-600" />
                  <h4 className="text-lg font-bold text-center">BİLETORG BİLET SATIŞ NOKTALARI</h4>
                </div>
                <div className="flex-1 space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Komisyon:</span>
                    <span className="font-semibold">{formatCurrency(commission)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Ön rezervasyon (%10):</span>
                    <span className="font-semibold">{formatCurrency(reservationFee)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Gönderim:</span>
                    <span className="font-semibold">-</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Toplam maliyet:</span>
                    <span className="font-bold text-lg">{formatCurrency(channel3CustomerTotal)}</span>
                  </div>
                </div>
                <div className="mt-6 bg-blue-500 text-white p-4 rounded-xl text-center">
                  <p className="text-lg mb-1">Kazancınız</p>
                  <p className="text-4xl font-bold">{formatCurrencyInt(organizerEarnings)}</p>
                </div>
              </div>
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
              %3.5 komisyon ile aldığınız her şey
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
                Hayır, BiletOrg'da aylık ücret yoktur. Sadece sattığınız bilet başına komisyon ödersiniz. 
                Etkinlik oluşturmak, salon planı hazırlamak tamamen ücretsizdir.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Ödemeler ne zaman hesabıma geçer?
              </h4>
              <p className="text-gray-600">
                İlk etkinlikte etkinlik tamamlandıktan sonra 7. günde, sonraki etkinliklerde ise 2-3 gün sonra ödeme banka hesabınıza transfer edilir.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                Ücretsiz iptal edilen biletlerden komisyon alınır mı?
              </h4>
              <p className="text-gray-600">
                Partial Refund ücreti kesilir. Bilet için alınan komisyon iade edilmez.
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

      <SiteFooter />
    </div>
  )
}
