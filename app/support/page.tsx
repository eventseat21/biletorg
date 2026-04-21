'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  HelpCircle, 
  MessageSquare, 
  Ticket,
  Send,
  CheckCircle,
  Loader2,
  FileQuestion,
  AlertCircle,
  Bug,
  Lightbulb
} from 'lucide-react'
import MobileNav from '@/components/mobile-nav'

export default function SupportPage() {
  const [formData, setFormData] = useState({
    type: 'question',
    priority: 'normal',
    subject: '',
    message: '',
    ticketId: '',
    orderId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Generate random ticket number
    setTicketNumber(`TKT-${Date.now().toString(36).toUpperCase().slice(-6)}`)
    
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const supportTypes = [
    { id: 'question', label: 'Soru', icon: HelpCircle, desc: 'Bir şey hakkında bilgi almak istiyorum' },
    { id: 'problem', label: 'Sorun', icon: AlertCircle, desc: 'Bir sorun yaşıyorum ve çözüm istiyorum' },
    { id: 'bug', label: 'Hata Bildirimi', icon: Bug, desc: 'Bir teknik hata buldum' },
    { id: 'suggestion', label: 'Öneri', icon: Lightbulb, desc: 'Bir önerim veya fikrim var' }
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Destek Talebiniz Alındı!</h2>
          <p className="text-sm text-gray-600 mb-4">
            Bilet Numaranız: <span className="font-mono font-bold text-indigo-600">{ticketNumber}</span>
          </p>
          <p className="text-gray-600 mb-6">
            En kısa sürede size dönüş yapacağız. Bilet numaranızı kaydetmeyi unutmayın.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
            <button 
              onClick={() => {
                setIsSubmitted(false)
                setFormData({ 
                  type: 'question', 
                  priority: 'normal', 
                  subject: '', 
                  message: '', 
                  ticketId: '', 
                  orderId: '' 
                })
                setTicketNumber('')
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Yeni Talep Oluştur
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">BiletOrg</span>
            </Link>
            <div className="flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Ana Sayfa</Link>
              <Link href="/faq" className="text-gray-600 hover:text-gray-900">SSS</Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900">İletişim</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Giriş Yap</Link>
              <MobileNav />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Destek Al</h1>
          <p className="text-gray-600">
            Bir sorunuz mu var veya sorun mu yaşıyorsunuz? Size yardımcı olmak için buradayız.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Support Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Destek Talebi Türü
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {supportTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        formData.type === type.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        formData.type === type.id ? 'text-indigo-600' : 'text-gray-600'
                      }`} />
                      <span className={`block text-sm font-medium ${
                        formData.type === type.id ? 'text-indigo-700' : 'text-gray-700'
                      }`}>
                        {type.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {supportTypes.find(t => t.id === formData.type)?.desc}
              </p>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Öncelik
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'low', label: 'Düşük', color: 'bg-green-100 text-green-700' },
                  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
                  { value: 'high', label: 'Yüksek', color: 'bg-orange-100 text-orange-700' },
                  { value: 'urgent', label: 'Acil', color: 'bg-red-100 text-red-700' }
                ].map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.priority === priority.value
                        ? priority.color + ' ring-2 ring-offset-1 ring-gray-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konu
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Talebinizin kısa özeti"
              />
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bilet No (Varsa)
                </label>
                <div className="relative">
                  <FileQuestion className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="ticketId"
                    value={formData.ticketId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="TKT-XXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sipariş No (Varsa)
                </label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="orderId"
                    value={formData.orderId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="ORD-XXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detaylı Açıklama
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Sorununuzu veya sorunuzu detaylı bir şekilde açıklayın..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Ne kadar detaylı bilgi verirseniz, o kadar hızlı yardımcı olabiliriz.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Talep Oluşturuluyor...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  Destek Talebi Oluştur
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/faq"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">SSS</h3>
              <p className="text-sm text-gray-500">Sık sorulan sorular</p>
            </div>
          </Link>

          <Link 
            href="/contact"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">İletişim</h3>
              <p className="text-sm text-gray-500">Diğer iletişim kanalları</p>
            </div>
          </Link>

          <Link 
            href="/user/dashboard"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Biletlerim</h3>
              <p className="text-sm text-gray-500">Bilet işlemleriniz</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
