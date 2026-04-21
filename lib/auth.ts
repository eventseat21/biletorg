import { compare, hash } from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    console.log('Password verification failed: missing inputs')
    return false
  }
  
  // Seed password direct check - works with any bcrypt hash
  if (password === 'Mehmetcan21!') {
    // Verify against the stored hash using bcrypt
    try {
      const result = await compare(password, hashedPassword)
      console.log('Seed password verification result:', result)
      return result
    } catch (error) {
      console.error('Seed password verification error:', error)
      return false
    }
  }
  
  try {
    const result = await compare(password, hashedPassword)
    console.log('Password verification result:', result, 'Input:', password, 'Hash prefix:', hashedPassword.substring(0, 30))
    return result
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
