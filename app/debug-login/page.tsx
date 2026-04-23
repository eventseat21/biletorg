'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'

export default function DebugLogin() {
  const [result, setResult] = useState('')

  const testLogin = async () => {
    const r = await signIn('credentials', {
      email: 'admin@biletorg.com',
      password: 'Mehmetcan21!',
      redirect: false,
    })
    setResult(JSON.stringify(r, null, 2))
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={testLogin}>Test Login</button>
      <pre>{result}</pre>
    </div>
  )
}