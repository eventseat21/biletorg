'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ticket, Menu, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navLinks = [
  { href: '/', label: 'Ana sayfa' },
  { href: '/events', label: 'Etkinlikler' },
  { href: '/ticketshop', label: 'Ticketshop' },
  { href: '/saalplan', label: 'Salon Planı' },
  { href: '/pricing', label: 'Fiyatlandırma' },
  { href: '/benefits', label: 'Avantajlar' },
  { href: '/faq', label: 'SSS' },
  { href: '/support', label: 'Destek' },
  { href: '/contact', label: 'İletişim' },
]

function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'fixed top-0 left-0 right-0 z-50',
          'bg-white border-b border-gray-200 shadow-sm',
          'supports-[backdrop-filter]:bg-white'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-16 py-1 gap-4">
            <Link href="/" className="flex items-center gap-2 min-w-0 shrink-0">
              <div className="flex items-center gap-2 min-w-0 shrink-0">
              <img 
                src="/org-logo.png" 
                alt="Kurdevents Logo" 
                className="h-20 w-auto max-w-[357px] object-contain"
              />
            </div>
            </Link>

            <div className="hidden lg:flex flex-1 flex-wrap items-center justify-end gap-x-3 gap-y-1 min-w-0">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${
                    isNavActive(pathname, link.href)
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
              >
                Giriş
              </Link>
            </div>

            <button
              type="button"
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 shrink-0"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Menüyü kapat"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-0 right-0 w-[min(100vw-2rem,20rem)] h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <span className="font-semibold text-gray-900">Menü</span>
              <button
                type="button"
                className="p-2 rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-white">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-3 rounded-lg text-sm font-medium ${
                    isNavActive(pathname, link.href)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-3 text-center text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Giriş
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
