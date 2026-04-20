'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Dynamic import to avoid SSR issues with Konva
const SvgHallEditor = dynamic(() => import('@/components/svg-hall-editor'), { ssr: false })

export default function SvgEditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="fixed inset-0 bg-white z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/organizer/halls" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">SVG Salon Editörü</h1>
        </div>
        <div className="text-sm text-gray-500">
          SVG içe aktarıldı • Koltukları düzenleyin
        </div>
      </div>

      {/* Editor */}
      <div className="h-[calc(100vh-56px)]">
        <SvgHallEditor hallId={params.id} />
      </div>
    </div>
  )
}
