export type UserRole = 'admin' | 'coordinator' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  status: 'active' | 'inactive' | 'pending'
  joinedAt: string
  trips?: number
}

export interface ActivityItem {
  id: string
  type: 'booking' | 'payment' | 'user' | 'system'
  title: string
  description: string
  timestamp: string
  user?: string
}

export interface Transaction {
  id: string
  traveler: string
  package: string
  amount: number
  status: 'completed' | 'pending' | 'refunded' | 'failed'
  date: string
}

export interface StatMetric {
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  timestamp: string
  type: 'info' | 'success' | 'warning'
}

export interface AuthUser {
  id: string
  phone: string
  email?: string
  name?: string
  avatar?: string
}
