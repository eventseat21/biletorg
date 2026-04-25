'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Dynamic import to avoid SSR issues with Konva
const HallEditor = dynamic(() => import('@/components/hall-editor'), { ssr: false })

export default function HallEditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Link href="/organizer/halls" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Salon Editörü</h1>
        </div>
        <div className="text-sm text-gray-500">
          Koltuk eklemek için sağ tıklayın • Sürüklemek için tutun
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-gray-100">
        <HallEditor hallId={params.id} />
      </div>
    </div>
  )
}
