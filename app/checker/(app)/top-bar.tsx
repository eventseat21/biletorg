'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function CheckerTopBar({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <span className="hidden sm:inline truncate max-w-[10rem]">{email}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/' })}
        className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-800"
      >
        <LogOut className="w-4 h-4" />
        Çıkış
      </button>
    </div>
  )
}
