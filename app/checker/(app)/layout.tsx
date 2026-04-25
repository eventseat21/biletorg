import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { ScanLine } from 'lucide-react'
import { CheckerTopBar } from './top-bar'

export default async function CheckerAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/login?callbackUrl=/checker')
  }

  if (session.user.role !== 'CHECKER' && session.user.role !== 'ADMIN') {
    redirect('/')
  }

  if (session.user.role === 'CHECKER') {
    if (session.user.ticketCheckerStatus !== 'APPROVED') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="card p-8 text-center max-w-md">
            <p className="text-gray-600">
              Bu ekran yalnızca onaylı kontrolörler içindir. Hesabınız yönetici onayı
              sonrası aktif olacaktır.
            </p>
            <a href="/" className="btn-primary inline-block mt-4">
              Ana sayfa
            </a>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/checker"
            className="flex items-center gap-2 font-semibold text-white"
          >
            <ScanLine className="w-5 h-5 text-emerald-400" />
            Bilet kontrol
          </Link>
          <CheckerTopBar email={session.user.email ?? ''} />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
