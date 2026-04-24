import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

/** Stored password is bcrypt, or legacy plain text (e.g. after /api/set-plain). */
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/

export async function verifyStoredPassword(
  userId: string,
  plain: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false
  if (BCRYPT_HASH_RE.test(stored)) {
    return compare(plain, stored)
  }
  if (plain === stored) {
    try {
      const hashed = await hash(plain, 12)
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashed },
      })
    } catch {
      /* login still succeeds */
    }
    return true
  }
  return false
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export function generateToken(bytesLength = 32): string {
  return randomBytes(bytesLength).toString('hex')
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.trim().toLowerCase()

        const user = await prisma.user.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
          },
          include: { organizer: true },
        })

        if (!user) {
          return null
        }

        const isValid = await verifyStoredPassword(
          user.id,
          credentials.password,
          user.password
        )
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'USER' | 'ORGANIZER' | 'ADMIN',
          organizerId: user.organizer?.id ?? null,
          organizerStatus:
            (user.organizer?.status as
              | 'PENDING'
              | 'APPROVED'
              | 'REJECTED'
              | 'SUSPENDED'
              | null) ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.organizerId = user.organizerId
        token.organizerStatus = user.organizerStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id
        session.user.role = token.role as typeof session.user.role
        session.user.organizerId = token.organizerId ?? null
        session.user.organizerStatus =
          (token.organizerStatus as typeof session.user.organizerStatus) ?? null
      }
      return session
    },
  },
}
