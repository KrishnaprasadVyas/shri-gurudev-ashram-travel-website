import type {
  TravelPackageRow,
  BookingRow,
  BookingPassengerRow,
  PassengerDocumentRow,
  SevaPackageRow,
  SevaBookingRow,
  PaymentRow,
  UserRow,
  PassengerGender,
} from './database.types'

export type TravelPackage = TravelPackageRow
export type Booking = BookingRow
export type BookingPassenger = BookingPassengerRow
export type PassengerDocument = PassengerDocumentRow
export type SevaPackage = SevaPackageRow
export type SevaBooking = SevaBookingRow
export type Payment = PaymentRow
export type User = UserRow

export interface PassengerInput {
  fullName: string
  phone: string
  dob: string
  address: string
  gender: PassengerGender
  aadhaarNumber: string
  aadhaarImagePath?: string
  selfieImagePath?: string
}

export interface CreateBookingInput {
  packageId: string
  travelerCount: number
  specialNotes?: string
  fullName: string
  phoneNumber: string
  whatsappNumber?: string
  dob?: string
  address: string
  transportType: 'Flight' | 'Train'
  busType?: 'AC Train' | 'Non-AC Train'
  roomType: 'AC Room' | 'Non-AC Room'
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  additionalSevaPackageId?: string
  additionalSevaType?: string
  additionalSevaDate?: string
  passengers: PassengerInput[]
}

export interface CreateSevaInput {
  sevaPackageId?: string
  sevaType?: string
  sevaDate: string
  fullName: string
  phoneNumber: string
  notes?: string
}
