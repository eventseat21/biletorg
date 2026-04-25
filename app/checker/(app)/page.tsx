import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { QrCode } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CheckerHomePage() {
  const session = await getServerSession(authOptions)
  const name = session?.user?.name || 'Kontrolör'

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Merhaba, {name}</h1>
      <p className="text-slate-400 mb-8">
        Etkinlik girişlerinde bilet QR kodlarını bu ekran üzerinden doğrulayacaksınız. Okutma
        arayüzü bir sonraki sürümde eklenecek.
      </p>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
        <QrCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Bilet tarama alanı (yakında)</p>
      </div>
    </div>
  )
}
