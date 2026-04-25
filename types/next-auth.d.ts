import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'USER' | 'ORGANIZER' | 'CHECKER' | 'ADMIN'
      organizerId?: string | null
      organizerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
      ticketCheckerId?: string | null
      ticketCheckerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
    }
  }

  interface User {
    role: 'USER' | 'ORGANIZER' | 'CHECKER' | 'ADMIN'
    organizerId?: string | null
    organizerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
    ticketCheckerId?: string | null
    ticketCheckerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'USER' | 'ORGANIZER' | 'CHECKER' | 'ADMIN'
    organizerId?: string | null
    organizerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
    ticketCheckerId?: string | null
    ticketCheckerStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | null
  }
}
