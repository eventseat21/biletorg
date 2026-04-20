import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession()
  
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const svgFile = formData.get('svg') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const address = formData.get('address') as string

    if (!svgFile || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Read SVG content
    const svgContent = await svgFile.text()

    // Parse SVG to extract seats
    const seats = parseSVGSeats(svgContent)

    // Calculate dimensions from SVG
    const stageDimensions = extractSVGBounds(svgContent)

    // Create hall
    const hall = await prisma.hall.create({
      data: {
        organizerId: session.user.organizerId,
        name,
        description,
        address,
        stageWidth: stageDimensions.width || 800,
        stageHeight: stageDimensions.height || 600,
        svgSource: svgContent, // Store original SVG
        source: 'svg',
      }
    })

    // Create seats from SVG
    if (seats.length > 0) {
      await prisma.seat.createMany({
        data: seats.map((seat, index) => ({
          hallId: hall.id,
          row: seat.row || String.fromCharCode(65 + Math.floor(index / 20)),
          number: seat.number || ((index % 20) + 1).toString(),
          x: seat.x,
          y: seat.y,
          type: seat.type || 'NORMAL',
          width: seat.width || 30,
          height: seat.height || 30,
          shape: seat.shape || 'circle',
          svgId: seat.svgId, // Original SVG element ID
        }))
      })
    }

    return NextResponse.json(hall)
  } catch (error) {
    console.error('Error importing SVG hall:', error)
    return NextResponse.json({ error: 'Failed to import SVG' }, { status: 500 })
  }
}

// Parse SVG to extract seat positions
function parseSVGSeats(svgContent: string): Array<{
  x: number
  y: number
  width: number
  height: number
  shape: string
  type: string
  row?: string
  number?: string
  svgId?: string
}> {
  const seats: any[] = []
  
  // Parse circles
  const circleRegex = /<circle[^>]*cx=["']([^"']+)["'][^>]*cy=["']([^"']+)["'][^>]*r=["']([^"']+)["'][^>]*>/gi
  let match
  let seatIndex = 0
  
  while ((match = circleRegex.exec(svgContent)) !== null) {
    const cx = parseFloat(match[1])
    const cy = parseFloat(match[2])
    const r = parseFloat(match[3])
    
    seats.push({
      x: cx - r,
      y: cy - r,
      width: r * 2,
      height: r * 2,
      shape: 'circle',
      type: 'NORMAL',
      row: String.fromCharCode(65 + Math.floor(seatIndex / 20)),
      number: ((seatIndex % 20) + 1).toString(),
      svgId: `seat-${seatIndex}`,
    })
    seatIndex++
  }

  // Parse rectangles
  const rectRegex = /<rect[^>]*x=["']([^"']+)["'][^>]*y=["']([^"']+)["'][^>]*width=["']([^"']+)["'][^>]*height=["']([^"']+)["'][^>]*>/gi
  
  while ((match = rectRegex.exec(svgContent)) !== null) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    const width = parseFloat(match[3])
    const height = parseFloat(match[4])
    
    // Skip if too large (probably not a seat)
    if (width > 100 || height > 100) continue
    
    seats.push({
      x,
      y,
      width,
      height,
      shape: 'rect',
      type: 'NORMAL',
      row: String.fromCharCode(65 + Math.floor(seatIndex / 20)),
      number: ((seatIndex % 20) + 1).toString(),
      svgId: `seat-${seatIndex}`,
    })
    seatIndex++
  }

  // Parse g.seat groups
  const groupRegex = /<g[^>]*class=["'][^"']*seat[^"']*["'][^>]*>/gi
  // Note: Full parsing of group content would require DOM parsing
  // This is a simplified version

  return seats
}

// Extract SVG bounds
function extractSVGBounds(svgContent: string): { width: number; height: number } {
  const viewBoxMatch = svgContent.match(/viewBox=["'][^"']+["']/i)
  if (viewBoxMatch) {
    const values = viewBoxMatch[0].match(/[\d.]+/g)
    if (values && values.length >= 4) {
      return {
        width: parseFloat(values[2]),
        height: parseFloat(values[3]),
      }
    }
  }

  const widthMatch = svgContent.match(/width=["']([^"']+)["']/i)
  const heightMatch = svgContent.match(/height=["']([^"']+)["']/i)
  
  return {
    width: widthMatch ? parseFloat(widthMatch[1]) : 800,
    height: heightMatch ? parseFloat(heightMatch[1]) : 600,
  }
}
