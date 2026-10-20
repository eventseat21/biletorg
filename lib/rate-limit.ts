// Süreç içi kayan pencere sınırı. Tek sunucuda çalışır; çok örnekli yayında paylaşımlı sayaç gerekmez.
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_TRACKED = 2000

function pruneExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  if (buckets.size >= MAX_TRACKED) pruneExpired(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    // Süresi dolmuş eski kovalar yer kaplamasın.
    if (buckets.size >= MAX_TRACKED) buckets.clear()
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  return { ok: true }
}

export function tooManyRequests(retryAfterSec: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSec) },
  })
}
