import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { parseSVGSeats } from '@/lib/svg-seat-parser'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const svgFile = formData.get('svg') as File | null
    if (!svgFile) {
      return NextResponse.json({ error: 'SVG file is required' }, { status: 400 })
    }
    if (svgFile.type !== 'image/svg+xml') {
      return NextResponse.json({ error: 'Only SVG file is supported' }, { status: 400 })
    }

    const svg = await svgFile.text()
    const { seats, summary } = parseSVGSeats(svg)

    return NextResponse.json({
      summary,
      preview: {
        seats: seats.slice(0, 25),
      },
    })
  } catch (error) {
    console.error('[wizard-parse] ', error)
    return NextResponse.json({ error: 'Failed to parse SVG' }, { status: 500 })
  }
}
