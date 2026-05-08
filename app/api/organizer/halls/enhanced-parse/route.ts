import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { extractSVGBounds } from '@/lib/svg-seat-parser'
import {
  extractSeatsWithTransforms,
  alignSeatRowsVertically,
  enforceMinSeatFootprint,
  separateOverlappingCandidates,
} from '@/lib/svg-transform-seats'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const svgFile = formData.get('svg') as File
    const rowGroupDistance = Number(formData.get('rowGroupDistance')) || 50

    console.log('API - Sıra Grup Mesafesi alındı:', rowGroupDistance)

    if (!svgFile) {
      return NextResponse.json({ error: 'SVG file required' }, { status: 400 })
    }

    const svgText = await svgFile.text()

    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' })
    const document = dom.window.document

    const getSection = (x: number) => {
      if (x < 200) return 'VIP'
      if (x < 400) return 'PREMIUM'
      return 'NORMAL'
    }

    const rawCandidates = extractSeatsWithTransforms(document)
    const sized = enforceMinSeatFootprint(rawCandidates, 16)
    const toleranceFactor = rowGroupDistance / 100
    console.log('API - rowToleranceFactor:', toleranceFactor)
    const aligned = alignSeatRowsVertically(sized, { rowToleranceFactor: toleranceFactor })
    const separated = separateOverlappingCandidates(aligned)

    let counter = 1
    const seats: any[] = separated.map((s) => {
      const category = getSection(s.x + s.width / 2)
      const num = counter++
      return {
        id: s.id,
        seatId: `S-${num}`,
        shape: s.shape,
        type: category,
        x: Math.round(s.x),
        y: Math.round(s.y),
        width: Math.round(s.width),
        height: Math.round(s.height),
        row: null,
        number: num,
        section: 'default',
        status: 'available',
      }
    })

    seats.sort((a, b) => a.y - b.y || a.x - b.x)

    let rowIndex = 1
    let lastY: number | null = null
    const rowTolerance = 18

    seats.forEach((seat) => {
      if (lastY === null || Math.abs(seat.y - lastY) > rowTolerance) {
        rowIndex++
        lastY = seat.y
      }
      seat.row = `R${rowIndex}`
    })

    const rowGroups: Record<string, any[]> = {}
    seats.forEach((seat) => {
      if (!rowGroups[seat.row]) rowGroups[seat.row] = []
      rowGroups[seat.row].push(seat)
    })

    Object.values(rowGroups).forEach((rowSeats) => {
      rowSeats.sort((a: any, b: any) => a.x - b.x)
      rowSeats.forEach((seat: any, index: number) => {
        seat.number = index + 1
        seat.seatId = `${seat.row}-${seat.number}`
      })
    })

    const totalSeats = seats.length
    const sections = Array.from(new Set(seats.map((s: any) => s.type)))
    const uniqueRows = Array.from(new Set(seats.map((s: any) => s.row)))

    const aisles: any[] = []
    const sortedByX = [...seats].sort((a: any, b: any) => a.x - b.x)
    for (let i = 1; i < sortedByX.length; i++) {
      const gap = sortedByX[i].x - sortedByX[i - 1].x
      if (gap > 50) {
        aisles.push({
          fromX: sortedByX[i - 1].x,
          toX: sortedByX[i].x,
          width: gap,
        })
      }
    }

    const bounds = extractSVGBounds(svgText)

    return NextResponse.json({
      success: true,
      summary: {
        totalSeats,
        sections: sections.length,
        rows: uniqueRows.length,
        aisles: aisles.length,
        circleCount: seats.filter((s: any) => s.shape === 'circle' || s.shape === 'ellipse').length,
        rectCount: seats.filter((s: any) => s.shape === 'rect').length,
        rowCount: uniqueRows.length,
        blockCount: sections.length,
        aisleCount: aisles.length,
        collisionCount: 0,
        aisleRanges: aisles,
        width: bounds.width,
        height: bounds.height,
      },
      seats,
      svgMetadata: {
        width: String(bounds.width),
        height: String(bounds.height),
      },
    })
  } catch (error) {
    console.error('Enhanced SVG parse error:', error)
    return NextResponse.json(
      {
        error: 'Failed to parse SVG',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
