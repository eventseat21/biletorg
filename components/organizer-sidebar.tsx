'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut,
  Users,
  Share2,
  Wand2
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import clsx from 'clsx'

function navItems(organizerId: string | null) {
  const items: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
    { href: '/organizer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/organizer/events', label: 'Etkinlikler', icon: Calendar },
    { href: '/organizer/halls', label: 'Salonlar', icon: MapPin },
    { href: '/organizer/halls/new', label: 'Yeni Salon Oluştur', icon: Wand2 },
    { href: '/organizer/accounting', label: 'Muhasebe', icon: BarChart3 },
  ]
  if (organizerId) items.push({ href: `/a/${organizerId}`, label: 'Organizatör sayfam', icon: Share2 })
  items.push({ href: '/organizer/settings', label: 'Ayarlar', icon: Settings })
  return items
}

export function OrganizerSidebar({ organizerId = null }: { organizerId?: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="flex shrink-0 flex-col border-b border-gray-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="border-b border-gray-200 px-4 py-3 md:border-b md:p-6">
        <Link href="/organizer" className="text-lg font-bold text-primary-600 md:text-xl">
          kurdevents.org
        </Link>
        <p className="mt-1 hidden text-sm text-gray-500 md:block">Organizatör Paneli</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-2 md:flex-1 md:flex-col md:space-y-1 md:p-4">
        {navItems(organizerId).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 transition-colors md:gap-3 md:px-4 md:py-3',
                isActive 
                  ? 'bg-primary-50 text-primary-700 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-gray-600 transition-colors hover:bg-gray-50 md:hidden"
        >
          <LogOut size={20} />
          Çıkış
        </button>
      </nav>

      <div className="hidden border-t border-gray-200 p-4 md:block">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
