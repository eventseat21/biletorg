import NextAuth from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
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
        console.log('Authorize called with:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organizer: true },
        })

        console.log('User found:', user ? 'Yes' : 'No')
        
        if (!user || !user.password) {
          console.log('No user or no password')
          return null
        }

        console.log('Stored password hash:', user.password.substring(0, 20) + '...')
        const isValid = await verifyPassword(credentials.password, user.password)
        console.log('Password valid:', isValid)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'USER' | 'ORGANIZER' | 'ADMIN',
          image: user.image,
          organizerId: user.organizer?.id || null,
          organizerStatus: user.organizer?.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null,
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
      if (token) {
        session.user.role = token.role
        session.user.organizerId = token.organizerId
        session.user.organizerStatus = token.organizerStatus
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
