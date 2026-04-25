import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseSVGSeats } from '@/lib/svg-seat-parser'

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
    const categoriesRaw = formData.get('categories') as string | null
    const blockMapRaw = formData.get('blockCategoryMap') as string | null

    if (!svgFile || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (svgFile.type !== 'image/svg+xml') {
      return NextResponse.json({ error: 'Only SVG file is supported' }, { status: 400 })
    }

    const svgContent = await svgFile.text()
    const { seats, summary } = parseSVGSeats(svgContent)

    const categories = parseCategories(categoriesRaw)
    const blockCategoryMap = parseBlockCategoryMap(blockMapRaw)
    const typedSeats =
      blockCategoryMap.size > 0
        ? assignSeatTypesByBlockMap(seats, blockCategoryMap)
        : assignSeatTypesByRatio(seats, categories)

    const hall = await prisma.hall.create({
      data: {
        organizerId: session.user.organizerId,
        name,
        description: description || null,
        address: address || null,
        capacity: typedSeats.length,
        stageWidth: summary.width || 800,
        stageHeight: summary.height || 600,
        svgSource: svgContent,
        source: 'svg',
      },
    })

    if (typedSeats.length > 0) {
      await prisma.seat.createMany({
        data: typedSeats.map((seat) => ({
          hallId: hall.id,
          row: seat.row,
          number: seat.number,
          x: seat.x,
          y: seat.y,
          type: seat.type,
          width: seat.width || 30,
          height: seat.height || 30,
          shape: seat.shape,
          svgId: seat.svgId,
        })),
      })
    }

    return NextResponse.json({
      hall,
      summary: {
        ...summary,
        categories,
        blockCategoryMap: Object.fromEntries(blockCategoryMap),
      },
    })
  } catch (error) {
    console.error('Error importing SVG hall:', error)
    return NextResponse.json({ error: 'Failed to import SVG' }, { status: 500 })
  }
}

function parseCategories(raw: string | null): Array<{ type: string; ratio: number }> {
  if (!raw) {
    return [
      { type: 'VIP', ratio: 0.2 },
      { type: 'PREMIUM', ratio: 0.3 },
      { type: 'NORMAL', ratio: 0.5 },
    ]
  }
  try {
    const parsed = JSON.parse(raw) as Array<{ type?: string; ratio?: number }>
    const cleaned = parsed
      .map((x) => ({
        type: String(x.type || '').toUpperCase(),
        ratio: Number(x.ratio || 0),
      }))
      .filter((x) => x.type && Number.isFinite(x.ratio) && x.ratio > 0)
    const total = cleaned.reduce((acc, c) => acc + c.ratio, 0)
    if (!cleaned.length || total <= 0) throw new Error('invalid')
    return cleaned.map((c) => ({ ...c, ratio: c.ratio / total }))
  } catch {
    return [
      { type: 'VIP', ratio: 0.2 },
      { type: 'PREMIUM', ratio: 0.3 },
      { type: 'NORMAL', ratio: 0.5 },
    ]
  }
}

function assignSeatTypesByRatio<T extends { type: string }>(
  seats: T[],
  categories: Array<{ type: string; ratio: number }>
): T[] {
  if (!seats.length) return seats
  let cursor = 0
  return seats.map((seat, i) => {
    const progress = (i + 1) / seats.length
    while (
      cursor < categories.length - 1 &&
      progress > categories.slice(0, cursor + 1).reduce((acc, c) => acc + c.ratio, 0)
    ) {
      cursor++
    }
    return { ...seat, type: categories[cursor].type }
  })
}

function parseBlockCategoryMap(raw: string | null): Map<string, string> {
  if (!raw) return new Map()
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    const entries = Object.entries(parsed)
      .map(([block, type]) => [String(block), String(type).toUpperCase()] as const)
      .filter(([block, type]) => block && type)
    return new Map(entries)
  } catch {
    return new Map()
  }
}

function assignSeatTypesByBlockMap<T extends { type: string; block?: string }>(
  seats: T[],
  blockCategoryMap: Map<string, string>
): T[] {
  return seats.map((seat) => ({
    ...seat,
    type: blockCategoryMap.get(seat.block || '') || seat.type || 'NORMAL',
  }))
}
