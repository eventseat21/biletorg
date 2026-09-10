// Hazır salon şablonları (v3).
// Her şablon, merkezi (0,0) kabul ederek koltuk üretir; editör bunları
// tıklanan noktaya taşır.

import type { SeatItem } from './types'
import { generateArcRows, generateRows, generateTableSeats } from './geometry'

export interface VenueTemplate {
  key: string
  label: string
  hint: string
  build: () => SeatItem[]
}

function blockWidth(count: number, seatWidth: number, gapX: number): number {
  return count * seatWidth + Math.max(0, count - 1) * gapX
}

function markBlock(seats: SeatItem[], blockId: string): SeatItem[] {
  return seats.map((seat) => ({ ...seat, blockId }))
}

export const VENUE_TEMPLATES: VenueTemplate[] = [
  {
    key: 'theatre',
    label: 'Tiyatro',
    hint: 'Ön VIP sıralar + ana blok',
    build: () => {
      // 1200 kişilik tiyatro: ana salon + alt/üst balkon + iki yan balkon.
      const mainCols = 30
      const mainWidth = blockWidth(mainCols, 26, 6)
      const main = generateRows({
        rows: 16,
        seatsPerRow: mainCols,
        gapX: 6,
        gapY: 12,
        seatWidth: 26,
        seatHeight: 26,
        shape: 'circle',
        type: 'PREMIUM',
        originX: -mainWidth / 2,
        originY: 70,
        startRowIndex: 0,
        curve: 48,
      })
      const lowerBalcony = generateRows({
        rows: 10,
        seatsPerRow: 30,
        gapX: 6,
        gapY: 12,
        seatWidth: 26,
        seatHeight: 26,
        shape: 'circle',
        type: 'NORMAL',
        originX: -mainWidth / 2,
        originY: -330,
        startRowIndex: 16,
        curve: 32,
      })
      const upperBalcony = generateRows({
        rows: 8,
        seatsPerRow: 30,
        gapX: 6,
        gapY: 12,
        seatWidth: 26,
        seatHeight: 26,
        shape: 'circle',
        type: 'NORMAL',
        originX: -mainWidth / 2,
        originY: -650,
        startRowIndex: 26,
        curve: 24,
      })
      const sideWidth = blockWidth(15, 24, 7)
      const leftBalcony = generateRows({
        rows: 6,
        seatsPerRow: 15,
        gapX: 7,
        gapY: 14,
        seatWidth: 24,
        seatHeight: 24,
        shape: 'rect',
        type: 'VIP',
        originX: -mainWidth / 2 - sideWidth - 90,
        originY: -160,
        startRowIndex: 34,
        curve: 18,
      })
      const rightBalcony = generateRows({
        rows: 6,
        seatsPerRow: 15,
        gapX: 7,
        gapY: 14,
        seatWidth: 24,
        seatHeight: 24,
        shape: 'rect',
        type: 'VIP',
        originX: mainWidth / 2 + 90,
        originY: -160,
        startRowIndex: 40,
        curve: -18,
      })
      return [
        ...markBlock(main, 'template-theatre-main'),
        ...markBlock(lowerBalcony, 'template-theatre-balcony-lower'),
        ...markBlock(upperBalcony, 'template-theatre-balcony-upper'),
        ...markBlock(leftBalcony, 'template-theatre-balcony-left'),
        ...markBlock(rightBalcony, 'template-theatre-balcony-right'),
      ]
    },
  },
  {
    key: 'arena',
    label: 'Konser Arenası',
    hint: 'Zemin + kavisli tribün',
    build: () => {
      const cols = 16
      const w = blockWidth(cols, 28, 8)
      const floor = generateRows({
        rows: 8,
        seatsPerRow: cols,
        gapX: 8,
        gapY: 16,
        seatWidth: 28,
        seatHeight: 28,
        shape: 'rect',
        type: 'PREMIUM',
        originX: -w / 2,
        originY: -60,
        startRowIndex: 0,
      })
      const tier = generateArcRows({
        rows: 7,
        seatsPerRow: 26,
        centerX: 0,
        // Dış yarıçapın en yüksek noktası bile zeminden uzak kalsın.
        // (centerY + 544 = -306; zemin -60'tan başlar.)
        centerY: -850,
        startRadius: 340,
        rowGap: 34,
        startAngleDeg: 35,
        endAngleDeg: 145,
        seatWidth: 26,
        seatHeight: 26,
        shape: 'circle',
        type: 'NORMAL',
        startRowIndex: 8,
      })
      return [
        ...markBlock(floor, 'template-arena-floor'),
        ...markBlock(tier, 'template-arena-tier'),
      ]
    },
  },
  {
    key: 'stadium',
    label: 'Stadyum',
    hint: 'Halka şeklinde tribünler',
    build: () => {
      const lower = generateArcRows({
        rows: 10,
        seatsPerRow: 28,
        centerX: 0,
        centerY: 0,
        startRadius: 220,
        rowGap: 30,
        startAngleDeg: 0,
        endAngleDeg: 360,
        seatWidth: 24,
        seatHeight: 24,
        shape: 'circle',
        type: 'PREMIUM',
        startRowIndex: 0,
      })
      const upper = generateArcRows({
        rows: 12,
        seatsPerRow: 28,
        centerX: 0,
        centerY: 0,
        startRadius: 560,
        rowGap: 30,
        startAngleDeg: 0,
        endAngleDeg: 360,
        seatWidth: 24,
        seatHeight: 24,
        shape: 'circle',
        type: 'NORMAL',
        startRowIndex: 10,
      })
      return [
        ...markBlock(lower, 'template-stadium-lower'),
        ...markBlock(upper, 'template-stadium-upper'),
      ]
    },
  },
  {
    key: 'festival',
    label: 'Festival',
    hint: 'Ön saha + yan tribünler',
    build: () => {
      const cols = 20
      const w = blockWidth(cols, 26, 6)
      const floor = generateRows({
        rows: 6,
        seatsPerRow: cols,
        gapX: 6,
        gapY: 14,
        seatWidth: 26,
        seatHeight: 26,
        shape: 'circle',
        type: 'NORMAL',
        originX: -w / 2,
        originY: -40,
        startRowIndex: 0,
      })
      const left = generateArcRows({
        rows: 6,
        seatsPerRow: 12,
        centerX: 0,
        centerY: 120,
        startRadius: 520,
        rowGap: 28,
        startAngleDeg: 200,
        endAngleDeg: 250,
        seatWidth: 24,
        seatHeight: 24,
        shape: 'rect',
        type: 'VIP',
        startRowIndex: 6,
      })
      const right = generateArcRows({
        rows: 6,
        seatsPerRow: 12,
        centerX: 0,
        centerY: 120,
        startRadius: 520,
        rowGap: 28,
        startAngleDeg: 290,
        endAngleDeg: 340,
        seatWidth: 24,
        seatHeight: 24,
        shape: 'rect',
        type: 'VIP',
        startRowIndex: 6,
      })
      return [
        ...markBlock(floor, 'template-festival-floor'),
        ...markBlock(left, 'template-festival-left'),
        ...markBlock(right, 'template-festival-right'),
      ]
    },
  },
  {
    key: 'gala',
    label: 'Gala / Düğün',
    hint: 'Yuvarlak masalar',
    build: () => {
      const seats: SeatItem[] = []
      const spacing = 260
      let tableNo = 1
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          seats.push(
            ...markBlock(generateTableSeats({
              centerX: (c - 1) * spacing,
              centerY: (r - 1) * spacing,
              radius: 88,
              count: 8,
              seatWidth: 26,
              seatHeight: 26,
              shape: 'circle',
              type: tableNo === 5 ? 'VIP' : 'NORMAL',
              rowName: `T${tableNo}`,
              startNumber: 1,
            }), `template-gala-table-${tableNo}`)
          )
          tableNo++
        }
      }
      return seats
    },
  },
]

export function getTemplate(key: string): VenueTemplate | undefined {
  return VENUE_TEMPLATES.find((t) => t.key === key)
}
