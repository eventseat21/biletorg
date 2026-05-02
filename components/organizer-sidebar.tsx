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
  Wand2
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import clsx from 'clsx'

const navItems = [
  { href: '/organizer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/organizer/events', label: 'Etkinlikler', icon: Calendar },
  { href: '/organizer/halls', label: 'Salonlar', icon: MapPin },
  { href: '/organizer/halls/new', label: 'Yeni Salon Oluştur', icon: Wand2 },
  { href: '/organizer/accounting', label: 'Muhasebe', icon: BarChart3 },
  { href: '/organizer/settings', label: 'Ayarlar', icon: Settings },
]

export function OrganizerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <Link href="/organizer" className="text-xl font-bold text-primary-600">
          BiletOrg
        </Link>
        <p className="text-sm text-gray-500 mt-1">Organizatör Paneli</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
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
      </nav>

      <div className="p-4 border-t border-gray-200">
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
