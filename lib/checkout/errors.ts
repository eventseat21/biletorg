/** Kullanıcıya gösterilebilir satın alma hatası: HTTP durumuyla birlikte taşınır. */
export class CheckoutError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
    this.name = 'CheckoutError'
  }
}
