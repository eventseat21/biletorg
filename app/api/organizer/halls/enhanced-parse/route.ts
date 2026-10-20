import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { extractSVGBounds } from '@/lib/svg-seat-parser'
import {
  alignSeatRowsVertically,
  enforceMinSeatFootprint,
  extractSeatsWithTransforms,
  groupSeatsIntoGrid,
  separateOverlappingCandidates,
} from '@/lib/svg-transform-seats'
import { rowLabel } from '@/lib/seatmap/geometry'

/** Kullanıcı koridor eşiğini px olarak verirse medyan koltuk genişliğine oranlanır. */
function aisleFactorFrom(rowGroupDistance: number): number {
  if (!Number.isFinite(rowGroupDistance) || rowGroupDistance <= 0) return 1.5
  return Math.min(Math.max(rowGroupDistance / 33, 1.1), 4)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const svgFile = formData.get('svg') as File
    const rowGroupDistance = Number(formData.get('rowGroupDistance')) || 50

    if (!svgFile) {
      return NextResponse.json({ error: 'SVG file required' }, { status: 400 })
    }

    const svgText = await svgFile.text()
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(svgText, { contentType: 'image/svg+xml' })

    const rowToleranceFactor = Math.min(Math.max(rowGroupDistance / 100, 0.2), 2)
    const rawCandidates = extractSeatsWithTransforms(dom.window.document)
    const sized = enforceMinSeatFootprint(rawCandidates, 16)
    const aligned = alignSeatRowsVertically(sized, { rowToleranceFactor })
    const separated = separateOverlappingCandidates(aligned)
    const grid = groupSeatsIntoGrid(separated, {
      rowToleranceFactor,
      aisleFactor: aisleFactorFrom(rowGroupDistance),
    })

    // Satır etiketi y konumundan, numara soldan sağa sıradan gelir.
    const byRow = new Map<number, typeof grid.seats>()
    for (const seat of grid.seats) {
      const row = byRow.get(seat.rowIndex)
      if (row) row.push(seat)
      else byRow.set(seat.rowIndex, [seat])
    }

    const seats: Record<string, unknown>[] = []
    for (const rowIndex of Array.from(byRow.keys()).sort((a, b) => a - b)) {
      const rowSeats = byRow.get(rowIndex)!.sort((a, b) => a.x - b.x)
      const label = rowLabel(rowIndex)
      rowSeats.forEach((seat, index) => {
        seats.push({
          id: seat.id,
          seatId: `${label}-${index + 1}`,
          shape: seat.shape,
          // Kategori ataması editörde yapılır; içe aktarma renk/fiyat uydurmaz.
          type: 'NORMAL',
          x: Math.round(seat.x),
          y: Math.round(seat.y),
          width: Math.round(seat.width),
          height: Math.round(seat.height),
          row: label,
          number: index + 1,
          blockId: `svg-block-${seat.columnIndex}`,
          status: 'available',
        })
      })
    }

    seats.sort((a, b) => Number(a.y) - Number(b.y) || Number(a.x) - Number(b.x))

    const aisleRanges = grid.columns.slice(1).map((column, index) => ({
      fromX: Math.round(grid.columns[index].end),
      toX: Math.round(column.start),
      width: Math.round(column.start - grid.columns[index].end),
    }))

    const bounds = extractSVGBounds(svgText)

    return NextResponse.json({
      success: true,
      summary: {
        totalSeats: seats.length,
        sections: 1,
        rows: grid.rowCount,
        rowCount: grid.rowCount,
        aisles: aisleRanges.length,
        aisleCount: aisleRanges.length,
        aisleRanges,
        blocks: grid.columnCount,
        blockCount: grid.columnCount,
        collisionCount: grid.collisions,
        circleCount: seats.filter((s) => s.shape === 'circle').length,
        rectCount: seats.filter((s) => s.shape === 'rect').length,
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
        error: 'SVG çözümlenemedi',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
