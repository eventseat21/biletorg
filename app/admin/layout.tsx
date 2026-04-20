import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { Users, Building2, Calendar, BarChart3, Settings } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: BarChart3 },
    { href: '/admin/organizers', label: 'Organizatörler', icon: Building2 },
    { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
    { href: '/admin/events', label: 'Etkinlikler', icon: Calendar },
    { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold">
            Admin Panel
          </Link>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
