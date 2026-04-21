'use client'

import { useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Circle, Rect, Group, Transformer, Text } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'

interface SvgHallEditorProps {
  hallId: string
}

type SeatType = 'NORMAL' | 'VIP' | 'PREMIUM' | 'ACCESSIBLE'

interface Seat {
  id: string
  row: string
  number: string
  x: number
  y: number
  width: number
  height: number
  type: SeatType
  shape: 'circle' | 'rect'
  svgId?: string
}

const SEAT_COLORS: Record<SeatType, string> = {
  NORMAL: '#6b7280',
  VIP: '#fbbf24',
  PREMIUM: '#3b82f6',
  ACCESSIBLE: '#10b981',
}

export default function SvgHallEditor({ hallId }: SvgHallEditorProps) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [hall, setHall] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<SeatType>('NORMAL')

  useEffect(() => {
    fetchHallData()
  }, [hallId])

  const fetchHallData = async () => {
    try {
      const res = await fetch(`/api/organizer/halls/${hallId}`)
      const data = await res.json()
      setHall(data)
      setSeats(data.seats || [])
    } catch (error) {
      console.error('Error fetching hall:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeatClick = (e: KonvaEventObject<MouseEvent>, seat: Seat) => {
    e.cancelBubble = true
    
    if (e.evt.shiftKey) {
      // Multi-select with shift
      setSelectedIds(prev => 
        prev.includes(seat.id) 
          ? prev.filter(id => id !== seat.id)
          : [...prev, seat.id]
      )
    } else {
      // Single select
      setSelectedIds([seat.id])
    }
  }

  const applyCategoryToSelected = async (category: SeatType) => {
    const updatedSeats = seats.map(seat => 
      selectedIds.includes(seat.id) 
        ? { ...seat, type: category }
        : seat
    )
    setSeats(updatedSeats)

    // Save to DB
    for (const seatId of selectedIds) {
      await fetch(`/api/organizer/halls/${hallId}/seats/${seatId}/type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: category }),
      })
    }
  }

  const handleSeatDragEnd = async (e: KonvaEventObject<DragEvent>, seat: Seat) => {
    const node = e.target
    const updatedSeat = { 
      ...seat, 
      x: node.x(), 
      y: node.y() 
    }

    setSeats(seats.map(s => s.id === seat.id ? updatedSeat : s))

    await fetch(`/api/organizer/halls/${hallId}/seats/${seat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: node.x(), y: node.y() }),
    })
  }

  const handleExportJson = () => {
    const exportData = {
      hallId,
      hallName: hall?.name,
      totalSeats: seats.length,
      seats: seats.map(s => ({
        id: s.id,
        row: s.row,
        number: s.number,
        x: s.x,
        y: s.y,
        type: s.type,
        category: s.type.toLowerCase(),
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${hall?.name || 'hall'}-seats.json`
    a.click()
  }

  const handleSaveToDatabase = async () => {
    const res = await fetch(`/api/organizer/halls/${hallId}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats }),
    })

    if (res.ok) {
      alert('Salon başarıyla kaydedildi!')
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-full">Yükleniyor...</div>
  if (!hall) return <div className="flex items-center justify-center h-full">Salon bulunamadı</div>

  return (
    <div className="h-screen flex">
      {/* Left Sidebar - Controls */}
      <div className="w-72 bg-white border-r border-gray-200 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Koltuk Düzenleme</h2>
        
        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">Toplam Koltuk: <span className="font-semibold">{seats.length}</span></p>
          <p className="text-sm text-gray-600">Seçili: <span className="font-semibold">{selectedIds.length}</span></p>
        </div>

        {/* Category Assignment */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Kategori Ata</label>
          <div className="space-y-2">
            {(['NORMAL', 'VIP', 'PREMIUM', 'ACCESSIBLE'] as SeatType[]).map((type) => (
              <button
                key={type}
                onClick={() => applyCategoryToSelected(type)}
                disabled={selectedIds.length === 0}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedIds.length === 0 
                    ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: SEAT_COLORS[type] }}
                />
                <span>
                  {type === 'NORMAL' && 'Normal'}
                  {type === 'VIP' && 'VIP'}
                  {type === 'PREMIUM' && 'Premium'}
                  {type === 'ACCESSIBLE' && 'Engelli Erişimli'}
                </span>
                {selectedIds.length > 0 && <span className="text-xs text-gray-400 ml-auto">({selectedIds.length})</span>}
              </button>
            ))}
          </div>
        </div>

        <hr className="my-4" />

        {/* Legend */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Renk Göstergesi</label>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span>VIP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Engelli</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span>Normal</span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <button
            onClick={handleExportJson}
            className="w-full btn-secondary py-2 text-sm"
          >
            JSON Export
          </button>
          <button
            onClick={handleSaveToDatabase}
            className="w-full btn-primary py-2 text-sm"
          >
            Kaydet & Bitir
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 bg-gray-100 overflow-auto p-8">
        <Stage
          width={hall.stageWidth}
          height={hall.stageHeight}
          className="bg-white shadow-lg"
        >
          <Layer>
            {/* Stage Label */}
            <Text
              x={hall.stageWidth / 2 - 30}
              y={30}
              text="SAHNE"
              fontSize={20}
              fontStyle="bold"
              fill="#374151"
            />

            {seats.map((seat) => (
              <Group
                key={seat.id}
                x={seat.x}
                y={seat.y}
                draggable
                onDragEnd={(e) => handleSeatDragEnd(e, seat)}
                onClick={(e) => handleSeatClick(e, seat)}
              >
                {seat.shape === 'circle' ? (
                  <Circle
                    radius={seat.width / 2}
                    fill={SEAT_COLORS[seat.type]}
                    stroke={selectedIds.includes(seat.id) ? '#dc2626' : '#374151'}
                    strokeWidth={selectedIds.includes(seat.id) ? 3 : 1}
                  />
                ) : (
                  <Rect
                    width={seat.width}
                    height={seat.height}
                    fill={SEAT_COLORS[seat.type]}
                    stroke={selectedIds.includes(seat.id) ? '#dc2626' : '#374151'}
                    strokeWidth={selectedIds.includes(seat.id) ? 3 : 1}
                    cornerRadius={4}
                  />
                )}
                <Text
                  text={`${seat.row}${seat.number}`}
                  fontSize={9}
                  fill="white"
                  align="center"
                  width={seat.width}
                  x={seat.shape === 'circle' ? -seat.width/2 : 0}
                  y={seat.height / 2 - 4}
                />
              </Group>
            ))}
          </Layer>
        </Stage>

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-500 text-center">
          <p>• Koltukları sürükleyerek hareket ettirin</p>
          <p>• Shift + tık ile çoklu seçim yapın</p>
          <p>• Seçili koltuklara kategori atamak için soldaki butonları kullanın</p>
        </div>
      </div>
    </div>
  )
}
