// ─── Database Row Types (mirrors Supabase schema exactly) ────────────────────

export type VerificationStatus = 'not_submitted' | 'submitted' | 'verified' | 'rejected'
export type BookingStatus = 'draft' | 'documents_pending' | 'payment_pending' | 'paid' | 'verification_pending' | 'verified' | 'cancelled' | 'completed'

export interface UserRow {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  phone: string
  email: string | null
  role: string
  profile_image_url: string | null
  aadhaar_number: string | null
  aadhaar_image_path: string | null
  selfie_image_path: string | null
  verification_status: VerificationStatus
  admin_notes?: string | null
}

export interface TravelPackageRow {
  id: string
  created_at: string
  updated_at: string
  title: string
  description: string
  price: number
  duration: string
  total_seats: number
  remaining_seats: number
  image_url: string | null
  is_active: boolean
  flight_price?: number
  train_ac_price?: number
  train_non_ac_price?: number
  room_ac_price?: number
  room_non_ac_price?: number
}

export interface BookingRow {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  package_id: string
  status: BookingStatus
  total_amount: number
  traveler_count: number
  special_notes: string | null
  booking_reference: string
  full_name: string | null
  phone_number: string | null
  whatsapp_number: string | null
  dob: string | null
  address: string | null
  transport_type: string | null
  bus_type: string | null
  room_type: string | null
  admin_notes: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relationship?: string | null
  base_amount?: number | null
  gateway_fee?: number | null
  payable_amount?: number | null
  expires_at?: string | null
}

export interface PaymentRow {
  id: string
  created_at: string
  updated_at: string
  booking_id: string
  amount: number
  payment_method: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  gateway_fee: number | null
  status: string
}
