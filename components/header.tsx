'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ticket, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navLinks = [
    { href: '/events', label: 'Etkinlikler' },
    { href: '/ticketshop', label: 'Ticketshop' },
    { href: '/saalplan', label: 'Salon Planı' },
    { href: '/pricing', label: 'Fiyatlandırma' },
    { href: '/benefits', label: 'Avantajlar' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              BiletOrg
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/organizer/register"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Organizatör Ol
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Üye Ol
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium ${
                    pathname === link.href
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/organizer/register"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Organizatör Ol
              </Link>
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <Link
                  href="/login"
                  className="flex-1 px-4 py-2 text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  className="flex-1 px-4 py-2 text-center text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Üye Ol
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
