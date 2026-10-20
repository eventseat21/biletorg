// Sipariş parası: bilet bedeli, KurdEvents payı ve organizatöre kalan.
import { randomBytes } from 'crypto'

export type CommissionInput = {
  type: string | null | undefined
  value: number | null | undefined
}

export type OrderAmounts = {
  /** Biletlerin etiket fiyatı toplamı. */
  baseAmount: number
  /** Karttan çekilen tutar. */
  totalAmount: number
  /** KurdEvents'in aldığı pay. */
  platformFee: number
  /** Organizatöre kalan. */
  organizerAmount: number
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * PERCENT_DEDUCT: komisyon bilet bedelinden düşülür, müşteri fazla ödemez.
 * FIXED_ADD: bilet başına sabit hizmet bedeli eklenir, organizatör payı korunur.
 */
export function computeOrderAmounts(
  baseAmount: number,
  ticketCount: number,
  commission: CommissionInput,
): OrderAmounts {
  const base = round2(Math.max(0, baseAmount))
  const value = Number(commission.value ?? 0)
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0

  if (commission.type === 'FIXED_ADD') {
    const platformFee = round2(safeValue * Math.max(0, ticketCount))
    return {
      baseAmount: base,
      totalAmount: round2(base + platformFee),
      platformFee,
      organizerAmount: base,
    }
  }

  const percent = Math.min(100, Math.max(0, safeValue))
  const platformFee = round2((base * percent) / 100)
  return {
    baseAmount: base,
    totalAmount: base,
    platformFee,
    organizerAmount: round2(base - platformFee),
  }
}

function randomSuffix(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}

export function makeOrderNumber(): string {
  return `OR-${Date.now().toString(36).toUpperCase()}-${randomSuffix(4)}`
}

export function makeTicketNumber(): string {
  return `TK-${Date.now().toString(36).toUpperCase()}-${randomSuffix(6)}`
}

/** Kapıda okutulacak kısa kod: XXXX-XXXX-XXXX-XXXX. */
export function makeTicketCode(): string {
  const raw = randomSuffix(16)
  return raw.match(/.{4}/g)!.join('-')
}
