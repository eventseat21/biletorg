export const PERIODS = ['week', 'month', 'year', 'all'] as const
export type Period = (typeof PERIODS)[number]

const PERIOD_DAYS: Record<Period, number | null> = { week: 7, month: 30, year: 365, all: null }

export function readPeriod(value: string | null | undefined): Period {
  return (PERIODS as readonly string[]).includes(String(value)) ? (value as Period) : 'month'
}

export function periodStart(period: Period): Date | null {
  const days = PERIOD_DAYS[period]
  return days === null ? null : new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

export const PERIOD_LABELS: Record<Period, string> = {
  week: 'son 7 gün',
  month: 'son 30 gün',
  year: 'son 1 yıl',
  all: 'tüm dönem',
}

/** Türkçe Excel de noktalı virgülü ve ondalık virgülü kabul eder. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) => row.map((cell) => {
      const value = cell === null || cell === undefined ? '' : String(cell)
      return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
    }).join(';'))
    .join('\r\n')
}

export const euro = (value: number) => value.toFixed(2).replace('.', ',')
