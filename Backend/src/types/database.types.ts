// ─── Database Row Types (mirrors Supabase schema exactly) ────────────────────

export type UserVerificationStatus = 'not_submitted' | 'submitted' | 'verified' | 'rejected'
export type PassengerVerificationStatus = 'pending' | 'submitted' | 'verified' | 'rejected'
export type BookingStatus =
  | 'draft'
  | 'documents_pending'
  | 'payment_pending'
  | 'paid'
  | 'verification_pending'
  | 'verified'
  | 'ticket_generated'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type PassengerGender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type PaymentStatus = 'created' | 'captured' | 'failed' | 'refunded'
export type SevaBookingStatus = 'payment_pending' | 'paid' | 'cancelled'
export type SevaPackageType = 'guruji_aarti' | 'yajman' | 'gau_seva' | 'temple_seva' | 'event'
export type SevaBookingType = 'annadan' | 'yajman' | 'gau_seva' | 'temple_seva' | 'special_pooja' | 'event'
export type DocumentType = 'aadhaar_front' | 'aadhaar_back' | 'selfie'

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
  verification_status: UserVerificationStatus
  deleted_at: string | null
  push_token: string | null
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
  image_url: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
  flight_price: number | null
  train_ac_price: number | null
  train_non_ac_price: number | null
  room_ac_price: number | null
  room_non_ac_price: number | null
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
  admin_notes: string | null
  booking_reference: string
  full_name: string | null
  phone_number: string | null
  whatsapp_number: string | null
  dob: string | null
  address: string | null
  transport_type: string | null
  bus_type: string | null
  room_type: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  base_amount: number | null
  gateway_fee: number | null
  payable_amount: number | null
  expires_at: string | null
  transport_amount: number | null
  room_amount: number | null
  additional_seva_id: string | null
  additional_seva_type: string | null
  additional_seva_date: string | null
  additional_seva_amount: number | null
  subtotal_amount: number | null
  additional_seva_package_id: string | null
}

export interface BookingPassengerRow {
  id: string
  booking_id: string
  passenger_index: number
  is_primary: boolean
  full_name: string
  gender: PassengerGender
  dob: string
  phone: string
  address: string
  aadhaar_number: string
  verification_status: PassengerVerificationStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface PassengerDocumentRow {
  id: string
  passenger_id: string
  document_type: DocumentType
  file_path: string
  uploaded_at: string
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
  status: PaymentStatus
}

export interface RazorpayWebhookEventRow {
  id: string
  event_id: string
  created_at: string
}

export interface SevaPackageRow {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  seva_type: SevaPackageType
  title: string
  description: string | null
  image_url: string | null
  price: number
  is_active: boolean
  booking_enabled: boolean
  allow_date_selection: boolean
  max_bookings_per_day: number | null
  display_order: number | null
  color: string | null
  icon: string | null
  category: string | null
  available_from: string | null
  available_until: string | null
}

export interface SevaBookingRow {
  id: string
  booking_reference: string
  user_id: string
  seva_type: SevaBookingType
  seva_date: string
  full_name: string
  phone_number: string
  total_amount: number
  status: SevaBookingStatus
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  notes: string | null
  created_at: string
  updated_at: string
  travel_booking_id: string | null
  seva_package_id: string | null
}

export interface NotificationRow {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  metadata: Record<string, unknown> | null
}
