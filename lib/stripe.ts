// Stripe hesabı: tek hesap üzerinden tahsilat (KurdEvents satıcı, organizatöre sonra ödeme).
import Stripe from 'stripe'

export const STRIPE_SECRET_ENV = 'STRIPE_SECRET_KEY'
export const STRIPE_WEBHOOK_SECRET_ENV = 'STRIPE_WEBHOOK_SECRET'

export class StripeNotConfiguredError extends Error {
  constructor() {
    super(`Ödeme sistemi hazır değil: ${STRIPE_SECRET_ENV} tanımlı değil.`)
    this.name = 'StripeNotConfiguredError'
  }
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env[STRIPE_SECRET_ENV]?.trim())
}

let client: Stripe | null = null

export function getStripe(): Stripe {
  const secret = process.env[STRIPE_SECRET_ENV]?.trim()
  if (!secret) throw new StripeNotConfiguredError()
  if (!client) client = new Stripe(secret)
  return client
}

/** Webhook imza anahtarı; tanımlı değilse null döner ve çağırıcı 503 vererek olayı reddeder. */
export function getStripeWebhookSecret(): string | null {
  return process.env[STRIPE_WEBHOOK_SECRET_ENV]?.trim() || null
}

/**
 * Webhook'un hangi olayları bildirmesi gerektiği — panelde elle eklenirken ezberlenmesin diye
 * tek yerde tutuluyor.
 */
export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
] as const
