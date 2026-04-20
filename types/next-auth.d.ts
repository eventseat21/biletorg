import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'USER' | 'ORGANIZER' | 'ADMIN'
      organizerId?: string | null
      organizerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
    }
  }

  interface User {
    role: 'USER' | 'ORGANIZER' | 'ADMIN'
    organizerId?: string | null
    organizerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'USER' | 'ORGANIZER' | 'ADMIN'
    organizerId?: string | null
    organizerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
  }
}
