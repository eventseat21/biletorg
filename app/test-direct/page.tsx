'use client'
import { useEffect, useState } from 'react'

export default function TestLogin() {
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetch('/api/test-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@biletorg.com',
        password: 'Mehmetcan21!'
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('API Response:', data)
      setResult(data)
    })
    .catch(err => {
      console.error('Fetch error:', err)
      setResult({ error: err.message })
    })
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Test Login</h1>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}