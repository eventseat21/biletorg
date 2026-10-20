'use client'

import { useEffect } from 'react'

/** Webhook birkaç saniye gecikebilir; ödeme doğrulanana kadar sayfa kendini yeniler. */
export default function RefreshWhilePending() {
  useEffect(() => {
    const timer = setInterval(() => window.location.reload(), 3000)
    return () => clearInterval(timer)
  }, [])
  return null
}
