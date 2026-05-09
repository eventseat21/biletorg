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
  Lightbulb,
  Mail
} from 'lucide-react'
import Header from '@/components/header'
import { SiteFooter } from '@/components/site-footer'

interface SupportFormData {
  type: string
  priority: string
  name: string
  email: string
  subject: string
  message: string
  ticketId: string
  orderId: string
}

export default function SupportPage() {
  const [formData, setFormData] = useState<SupportFormData>({
    type: 'question',
    priority: 'normal',
    name: '',
    email: '',
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
    
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      
      if (response.ok) {
        setTicketNumber(result.ticketNumber)
        setIsSubmitted(true)
      } else {
        alert('Destek talebi oluşturulurken bir hata oluştu: ' + result.error)
      }
    } catch (error) {
      console.error('Support form error:', error)
      alert('Destek talebi oluşturulurken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
                  orderId: '', 
                  name: '', 
                  email: '' 
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
      <Header />
      <section className="relative text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/destek-hero.png"
            alt=""
            className="absolute -top-[80px] left-0 h-[calc(100%+80px)] w-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-purple-900/20" />
        </div>
        <div className="container relative mx-auto max-w-4xl px-4 py-24 text-center md:px-4 md:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            <MessageSquare className="h-4 w-4" />
            BiletOrg destek
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-6xl">
            Destek Al
          </h1>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-primary-100 md:text-2xl">
            Bir sorunuz veya sorununuz mu var? Yöneticiler ve ekip hesapları için
            destek talebi oluşturun; en kısa sürede dönüş yapalım.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
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

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Soyad *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Adınız Soyadınız"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-posta *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>
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
            href="/login"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Giriş</h3>
              <p className="text-sm text-gray-500">Hesabınız varsa panel</p>
            </div>
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
