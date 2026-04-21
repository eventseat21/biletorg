'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/events', label: 'Etkinlikler' },
    { href: '/ticketshop', label: 'Ticketshop' },
    { href: '/saalplan', label: 'Salon Planı' },
    { href: '/pricing', label: 'Fiyatlandırma' },
    { href: '/benefits', label: 'Avantajlar' },
    { href: '/faq', label: 'SSS' },
    { href: '/support', label: 'Destek Al' },
    { href: '/contact', label: 'İletişim' },
  ]

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Menü"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 right-0 w-72 h-full bg-white z-50 shadow-xl transform transition-transform">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-lg text-gray-900">Menü</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Kapat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="p-4">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/organizer/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center font-medium"
                >
                  Organizatör Ol
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
