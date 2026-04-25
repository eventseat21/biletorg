import type { NextResponse } from 'next/server'
import type { NextAuthOptions } from 'next-auth'
import { Prisma } from '@prisma/client'
import type { User } from '@prisma/client'
import CredentialsProvider from 'next-auth/providers/credentials'
import { encode } from 'next-auth/jwt'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { compare, hash } from 'bcryptjs'

/** Kullanıcı + organizatör / kontrol profili (oturum için) */
export type AuthUser = User & {
  organizer: { id: string; status: string } | null
  ticketChecker: { id: string; status: string } | null
}

export type AuthPasswordResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'invalid_credentials' }
  | {
      ok: false
      reason: 'not_active'
      notActive: 'PENDING' | 'REJECTED' | 'SUSPENDED'
    }

/** next-auth/core/lib/cookie ile aynı mantık: büyük şifreli JWT için parçalı çerez. */
const SESSION_COOKIE_MAX_BYTES = 4096
const SESSION_COOKIE_OVERHEAD = 163
const SESSION_COOKIE_CHUNK_SIZE = SESSION_COOKIE_MAX_BYTES - SESSION_COOKIE_OVERHEAD

/** NextAuth default session max age (seconds). */
export const SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60

const DEV_AUTH_SECRET_FALLBACK =
  'biletorg-local-dev-nextauth-secret-min-32-chars!'

function credentialString(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  return ''
}

/** Secret for JWT encode/decode; must match NextAuth `secret` option. */
export function getAuthSecretForSession(): string {
  const s = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (s && s.length > 0) return s
  if (process.env.NODE_ENV !== 'production') {
    return DEV_AUTH_SECRET_FALLBACK
  }
  throw new Error('NEXTAUTH_SECRET (or AUTH_SECRET) is required in production')
}

export function useSecureAuthCookie(): boolean {
  return (
    !!process.env.NEXTAUTH_URL?.startsWith('https://') || !!process.env.VERCEL
  )
}

export function sessionCookieName(): string {
  const prefix = useSecureAuthCookie() ? '__Secure-' : ''
  return `${prefix}next-auth.session-token`
}

/** NextAuth ile uyumlu: tek veya .0, .1, … parçalı Set-Cookie. */
export function applySessionTokenCookies(
  res: NextResponse,
  token: string,
  maxAge: number
): void {
  const base = sessionCookieName()
  const secure = useSecureAuthCookie()
  const opts = {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    path: '/',
    secure,
    maxAge,
  }

  for (let i = 0; i < 12; i++) {
    res.cookies.set(`${base}.${i}`, '', { ...opts, maxAge: 0 })
  }
  res.cookies.set(base, '', { ...opts, maxAge: 0 })

  if (token.length <= SESSION_COOKIE_CHUNK_SIZE) {
    res.cookies.set(base, token, opts)
    return
  }

  const n = Math.ceil(token.length / SESSION_COOKIE_CHUNK_SIZE)
  for (let i = 0; i < n; i++) {
    const part = token.slice(
      i * SESSION_COOKIE_CHUNK_SIZE,
      (i + 1) * SESSION_COOKIE_CHUNK_SIZE
    )
    res.cookies.set(`${base}.${i}`, part, opts)
  }
}

const STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const

/**
 * Oturum açma sonucu (hata mesajı için: invalid vs onay).
 */
export async function authenticateWithPasswordResult(
  emailRaw: unknown,
  passwordRaw: unknown
): Promise<AuthPasswordResult> {
  const email = credentialString(emailRaw).trim().toLowerCase()
  const password = credentialString(passwordRaw)
  if (!email || !password) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  const userBase = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      password: true,
      name: true,
      image: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!userBase) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  const ok = await verifyStoredPassword(userBase.id, password, userBase.password)
  if (!ok) {
    return { ok: false, reason: 'invalid_credentials' }
  }

  // Legacy DB compatibility: some environments may not have new tables/columns yet.
  const organizer = await safeLoadOrganizer(userBase.id)
  const ticketChecker = await safeLoadTicketChecker(userBase.id)
  const user: AuthUser = { ...(userBase as User), organizer, ticketChecker }

  if (user.role === 'ADMIN') {
    return { ok: true, user }
  }

  if (user.status === STATUS.PENDING) {
    return { ok: false, reason: 'not_active', notActive: 'PENDING' }
  }
  if (user.status === STATUS.REJECTED) {
    return { ok: false, reason: 'not_active', notActive: 'REJECTED' }
  }
  if (user.status === STATUS.SUSPENDED) {
    return { ok: false, reason: 'not_active', notActive: 'SUSPENDED' }
  }

  if (user.status !== STATUS.ACTIVE) {
    return { ok: false, reason: 'not_active', notActive: 'PENDING' }
  }

  return { ok: true, user }
}

async function safeLoadOrganizer(userId: string): Promise<{ id: string; status: string } | null> {
  try {
    return await prisma.organizer.findUnique({
      where: { userId },
      select: { id: true, status: true },
    })
  } catch (e) {
    if (isLegacySchemaError(e)) return null
    throw e
  }
}

async function safeLoadTicketChecker(
  userId: string
): Promise<{ id: string; status: string } | null> {
  try {
    return await prisma.ticketChecker.findUnique({
      where: { userId },
      select: { id: true, status: true },
    })
  } catch (e) {
    if (isLegacySchemaError(e)) return null
    throw e
  }
}

function isLegacySchemaError(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false
  return e.code === 'P2021' || e.code === 'P2022'
}

/**
 * Sadece geçerli oturum — NextAuth `authorize` ve kısa yol.
 * Onaysız / askıdaki hesap: null
 */
export async function authenticateWithPassword(
  emailRaw: unknown,
  passwordRaw: unknown
): Promise<AuthUser | null> {
  const r = await authenticateWithPasswordResult(emailRaw, passwordRaw)
  return r.ok ? r.user : null
}

type CheckerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
type OrgStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null

const roles = ['USER', 'ORGANIZER', 'CHECKER', 'ADMIN'] as const
type AppRole = (typeof roles)[number]

function toAppRole(role: string): AppRole {
  return (roles as readonly string[]).includes(role) ? (role as AppRole) : 'USER'
}

export async function createEncodedSessionToken(user: AuthUser): Promise<string> {
  const sessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: toAppRole(user.role),
    organizerId: user.organizer?.id ?? null,
    organizerStatus: (user.organizer?.status as OrgStatus) ?? null,
    ticketCheckerId: user.ticketChecker?.id ?? null,
    ticketCheckerStatus: (user.ticketChecker?.status as CheckerStatus) ?? null,
  }

  const tokenAfterJwtCallback = {
    name: sessionUser.name,
    email: sessionUser.email,
    picture: user.image,
    sub: sessionUser.id,
    role: sessionUser.role,
    organizerId: sessionUser.organizerId,
    organizerStatus: sessionUser.organizerStatus,
    ticketCheckerId: sessionUser.ticketCheckerId,
    ticketCheckerStatus: sessionUser.ticketCheckerStatus,
  }

  return encode({
    token: tokenAfterJwtCallback,
    secret: getAuthSecretForSession(),
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

/** Stored password is bcrypt, or legacy plain text (e.g. after /api/set-plain). */
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$/

export async function verifyStoredPassword(
  userId: string,
  plain: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false
  if (BCRYPT_HASH_RE.test(stored)) {
    try {
      return await compare(plain, stored)
    } catch {
      return false
    }
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
    maxAge: SESSION_MAX_AGE_SEC,
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV !== 'production'
      ? DEV_AUTH_SECRET_FALLBACK
      : undefined),
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
        try {
          const user = await authenticateWithPassword(
            credentials?.email,
            credentials?.password
          )
          if (!user) return null
          const r = toAppRole(user.role)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: r,
            organizerId: user.organizer?.id ?? null,
            organizerStatus: (user.organizer?.status as OrgStatus) ?? null,
            ticketCheckerId: user.ticketChecker?.id ?? null,
            ticketCheckerStatus:
              (user.ticketChecker?.status as CheckerStatus) ?? null,
          }
        } catch (e) {
          console.error('[NextAuth authorize]', e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          role: AppRole
          organizerId?: string | null
          organizerStatus?: OrgStatus
          ticketCheckerId?: string | null
          ticketCheckerStatus?: CheckerStatus
        }
        token.role = u.role
        token.organizerId = u.organizerId
        token.organizerStatus = u.organizerStatus
        token.ticketCheckerId = u.ticketCheckerId
        token.ticketCheckerStatus = u.ticketCheckerStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id
        session.user.role = token.role as typeof session.user.role
        session.user.organizerId = (token.organizerId as string | null | undefined) ?? null
        session.user.organizerStatus =
          (token.organizerStatus as typeof session.user.organizerStatus) ?? null
        session.user.ticketCheckerId = (token.ticketCheckerId as string | null | undefined) ?? null
        session.user.ticketCheckerStatus =
          (token.ticketCheckerStatus as typeof session.user.ticketCheckerStatus) ?? null
      }
      return session
    },
  },
}
