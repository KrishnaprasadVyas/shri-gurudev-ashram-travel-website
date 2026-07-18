export const QUERY_KEYS = {
  packages: ['packages'] as const,
  package: (id: string) => ['packages', id] as const,
  bookings: ['bookings'] as const,
  booking: (id: string) => ['bookings', id] as const,
  profile: ['profile'] as const,
  adminStats: ['admin', 'stats'] as const,
  adminUsers: (page: number, search: string, status: string) =>
    ['admin', 'users', page, search, status] as const,
  adminUser: (id: string) => ['admin', 'users', id] as const,
  adminBookings: (page: number, status: string) =>
    ['admin', 'bookings', page, status] as const,
  adminBooking: (id: string) => ['admin', 'bookings', id] as const,
  adminPackages: ['admin', 'packages'] as const,
  // F.6: Separate key for admin single-package fetch so it doesn't pollute
  // the public usePackage() cache (different endpoints, different shapes)
  adminPackage: (id: string) => ['admin', 'packages', id] as const,
  adminVerifications: (page: number, status: string) => 
    ['admin', 'verifications', page, status] as const,
}
