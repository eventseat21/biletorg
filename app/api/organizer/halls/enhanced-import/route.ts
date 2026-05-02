import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractSVGBounds } from '@/lib/svg-seat-parser'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const svgFile = formData.get('svg') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const address = formData.get('address') as string
    const categories = JSON.parse(formData.get('categories') as string || '[]')
    const seats = JSON.parse(formData.get('seats') as string || '[]')
    
    if (!svgFile || !name.trim()) {
      return NextResponse.json({ error: 'SVG file and hall name required' }, { status: 400 })
    }

    const svgText = await svgFile.text()
    const bounds = extractSVGBounds(svgText)
    const padding = 48

    const parsedSeats = seats.map((seat: any) => ({
      row: seat.row || 'A',
      number: String(seat.number || '1'),
      x: Math.round(seat.x || 0),
      y: Math.round(seat.y || 0),
      width: Math.max(8, Math.round(seat.width || 30)),
      height: Math.max(8, Math.round(seat.height || 30)),
      type: seat.type || 'NORMAL',
      shape: seat.shape === 'rect' ? 'rect' : 'circle',
      svgId: seat.svgId || seat.id || `seat_${seat.number || '1'}`
    }))

    const maxX = parsedSeats.reduce(
      (m: number, s: (typeof parsedSeats)[number]) => Math.max(m, s.x + s.width),
      0
    )
    const maxY = parsedSeats.reduce(
      (m: number, s: (typeof parsedSeats)[number]) => Math.max(m, s.y + s.height),
      0
    )
    const stageWidth = Math.max(Math.ceil(bounds.width), maxX + padding, 400)
    const stageHeight = Math.max(Math.ceil(bounds.height), maxY + padding, 400)

    const hall = await prisma.hall.create({
      data: {
        organizerId: session.user.organizerId,
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        capacity: seats.length,
        stageWidth,
        stageHeight,
        svgSource: svgText,
        source: 'enhanced-svg'
      }
    })

    await prisma.seat.createMany({
      data: parsedSeats.map((s: (typeof parsedSeats)[number]) => ({
        hallId: hall.id,
        row: s.row,
        number: s.number,
        x: s.x,
        y: s.y,
        width: s.width,
        height: s.height,
        type: s.type,
        shape: s.shape,
        svgId: s.svgId,
      }))
    })

    return NextResponse.json({
      success: true,
      hall: {
        id: hall.id,
        name: hall.name,
        capacity: hall.capacity,
        seatsCount: seats.length
      }
    })
    
  } catch (error) {
    console.error('Enhanced SVG import error:', error)
    return NextResponse.json({ 
      error: 'Failed to import enhanced SVG',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
