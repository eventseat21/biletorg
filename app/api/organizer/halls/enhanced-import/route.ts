import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCategory } from '@/lib/seatmap/categories'
import { syncSeatCategories } from '@/lib/seatmap/persist'
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
    const seats = JSON.parse(formData.get('seats') as string || '[]')
    
    if (!svgFile || !name.trim()) {
      return NextResponse.json({ error: 'SVG file and hall name required' }, { status: 400 })
    }

    const svgText = await svgFile.text()
    const bounds = extractSVGBounds(svgText)
    const padding = 48

    // (satır, numara) salon içinde benzersiz olmalı; yinelenenler atlanır.
    const seenKeys = new Set<string>()
    const parsedSeats = seats.reduce((list: any[], seat: any) => {
      const row = seat.row || 'A'
      const number = String(seat.number || '1')
      const key = `${row}::${number}`
      if (seenKeys.has(key)) return list
      seenKeys.add(key)
      const type = seat.type || 'NORMAL'
      list.push({
        row,
        number,
        x: Math.round(seat.x || 0),
        y: Math.round(seat.y || 0),
        width: Math.max(8, Math.round(seat.width || 30)),
        height: Math.max(8, Math.round(seat.height || 30)),
        type,
        sectionId: getCategory(type).label,
        status: 'available',
        zone: seat.zone ?? null,
        blockId: seat.blockId ?? null,
        shape: seat.shape === 'rect' ? 'rect' : 'circle',
        svgId: seat.svgId || seat.id || `seat_${number}`,
      })
      return list
    }, [])

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

    // Editör layoutJson'ı tek kaynak olarak okur; içe aktarmada da yazılmalı.
    const organizerId = session.user.organizerId
    const usedTypes = Array.from(new Set<string>(parsedSeats.map((s: { type: string }) => s.type)))
    const layoutCategories = usedTypes.map((key) => {
      const category = getCategory(key)
      return { key: category.key, label: category.label, color: category.color, price: null }
    })
    const layoutJson = {
      categories: layoutCategories,
      zones: [],
      background: { image: null, opacity: 0.35, fit: 'contain' },
      stage: { width: stageWidth, height: stageHeight },
      stagePosition: { x: Math.max(30, (stageWidth - 260) / 2), y: 35 },
    }

    const hall = await prisma.$transaction(
      async (tx) => {
        const created = await tx.hall.create({
          data: {
            organizerId,
            name: name.trim(),
            description: description.trim() || null,
            address: address.trim() || null,
            capacity: parsedSeats.length,
            stageWidth,
            stageHeight,
            svgSource: svgText,
            layoutJson,
            source: 'enhanced-svg',
          },
        })
        if (parsedSeats.length > 0) {
          await tx.seat.createMany({
            data: parsedSeats.map((s: (typeof parsedSeats)[number]) => ({ hallId: created.id, ...s })),
            skipDuplicates: true,
          })
        }
        await syncSeatCategories(tx, created.id, layoutCategories)
        return created
      },
      { timeout: 120000 }
    )

    return NextResponse.json({
      success: true,
      hall: {
        id: hall.id,
        name: hall.name,
        capacity: hall.capacity,
        seatsCount: parsedSeats.length
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
