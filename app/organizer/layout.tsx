import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { OrganizerSidebar } from '@/components/organizer-sidebar'

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session?.user) {
    redirect('/login?callbackUrl=/organizer')
  }

  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    redirect('/')
  }

  if (session.user.organizerStatus !== 'APPROVED' && session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            ⏳
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Onay Bekleniyor</h2>
          <p className="text-gray-600 mb-4">
            Organizatör hesabınız henüz onaylanmadı. Onaylandığında e-posta ile bilgilendirileceksiniz.
          </p>
          <a href="/" className="btn-primary inline-block">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <OrganizerSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
