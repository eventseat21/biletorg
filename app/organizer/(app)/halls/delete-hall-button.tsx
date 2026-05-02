'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

interface DeleteHallButtonProps {
  hallId: string
  hallName: string
}

export function DeleteHallButton({ hallId, hallName }: DeleteHallButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`"${hallName}" salonunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return
    }

    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/organizer/halls', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hallId }),
      })

      if (!response.ok) {
        throw new Error('Salon silinemedi')
      }

      // Sayfayı yenile
      window.location.reload()
    } catch (error) {
      console.error('Error deleting hall:', error)
      alert('Salon silinirken bir hata oluştu')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-600 hover:text-red-700 font-medium text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Trash2 size={16} />
      {isDeleting ? 'Siliniyor...' : 'Sil'}
    </button>
  )
}
