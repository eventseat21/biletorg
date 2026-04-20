'use client'

import { useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Circle, Rect, Text, Group } from 'react-konva'
import { KonvaEventObject } from 'konva/lib/Node'
import { Seat } from '@prisma/client'

interface HallEditorProps {
  hallId: string
}

export default function HallEditor({ hallId }: HallEditorProps) {
  const [seats, setSeats] = useState<Seat[]>([])
  const [hall, setHall] = useState<{ stageWidth: number; stageHeight: number } | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const handleStageClick = async (e: KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage()
      const pointerPosition = stage.getPointerPosition()
      if (!pointerPosition) return

      const newSeat = {
        row: String.fromCharCode(65 + Math.floor(seats.length / 20)),
        number: ((seats.length % 20) + 1).toString(),
        x: pointerPosition.x,
        y: pointerPosition.y,
        type: 'NORMAL' as const,
        width: 30,
        height: 30,
        shape: 'circle' as const,
      }

      try {
        const res = await fetch(`/api/organizer/halls/${hallId}/seats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSeat),
        })
        const savedSeat = await res.json()
        setSeats([...seats, savedSeat])
      } catch (error) {
        console.error('Error adding seat:', error)
      }
    }
  }

  const handleSeatDragEnd = async (e: KonvaEventObject<DragEvent>, seat: Seat) => {
    const node = e.target
    const updatedSeat = { ...seat, x: node.x(), y: node.y() }

    try {
      await fetch(`/api/organizer/halls/${hallId}/seats/${seat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: node.x(), y: node.y() }),
      })
      setSeats(seats.map(s => s.id === seat.id ? updatedSeat : s))
    } catch (error) {
      console.error('Error updating seat:', error)
    }
  }

  const handleSeatRightClick = async (e: KonvaEventObject<MouseEvent>, seat: Seat) => {
    e.evt.preventDefault()
    
    try {
      await fetch(`/api/organizer/halls/${hallId}/seats/${seat.id}`, {
        method: 'DELETE',
      })
      setSeats(seats.filter(s => s.id !== seat.id))
    } catch (error) {
      console.error('Error deleting seat:', error)
    }
  }

  const getSeatColor = (type: string) => {
    switch (type) {
      case 'VIP': return '#fbbf24'
      case 'PREMIUM': return '#3b82f6'
      case 'ACCESSIBLE': return '#10b981'
      default: return '#6b7280'
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-full">Yükleniyor...</div>
  if (!hall) return <div className="flex items-center justify-center h-full">Salon bulunamadı</div>

  return (
    <div className="relative w-full h-full">
      <Stage
        width={hall.stageWidth}
        height={hall.stageHeight}
        onClick={handleStageClick}
        className="bg-white shadow-lg"
      >
        <Layer>
          <Text
            x={hall.stageWidth / 2 - 50}
            y={20}
            text="SAHNE"
            fontSize={24}
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
              onContextMenu={(e) => handleSeatRightClick(e, seat)}
            >
              <Circle
                radius={seat.width / 2}
                fill={getSeatColor(seat.type)}
                stroke="#374151"
                strokeWidth={1}
              />
              <Text
                text={`${seat.row}${seat.number}`}
                fontSize={10}
                fill="white"
                align="center"
                width={seat.width}
                height={seat.height}
                verticalAlign="middle"
                offsetY={-2}
              />
            </Group>
          ))}
        </Layer>
      </Stage>
      
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <h3 className="font-medium mb-2">Koltuk Tipleri</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-400" />
            <span>VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>Premium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span>Engelli</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-500" />
            <span>Normal</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Toplam: {seats.length} koltuk
          </p>
        </div>
      </div>
    </div>
  )
}
