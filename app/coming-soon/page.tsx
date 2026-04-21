import Link from 'next/link'
import { Ticket, ArrowLeft, Clock } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
      <div className="text-center text-white px-4">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <Clock className="w-10 h-10" />
        </div>
        <h1 className="text-5xl font-bold mb-4">Hazırlanıyor</h1>
        <p className="text-xl text-white/80 mb-8 max-w-md mx-auto">
          Bu sayfa yapım aşamasındadır. Çok yakında hizmetinize sunulacaktır.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
