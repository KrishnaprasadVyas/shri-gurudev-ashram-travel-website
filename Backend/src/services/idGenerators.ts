import { supabaseAdmin } from './supabaseAdmin.js'

/**
 * Formats a sequence number into a padded string
 */
export function formatSequence(seq: number, padLength: number): string {
  return String(seq).padStart(padLength, '0')
}

/**
 * Formats a Group ID: GRP-0001, GRP-0002...
 */
export function formatGroupCode(seq: number): string {
  return `GRP-${formatSequence(seq, 4)}`
}

/**
 * Formats a Booking ID: MVT-YYMMDD-XXXX
 * Example: MVT-270427-0001
 */
export function formatBookingCode(date: Date, seq: number): string {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `MVT-${yy}${mm}${dd}-${formatSequence(seq, 4)}`
}

/**
 * Formats a Passenger ID: P-000001, P-000002...
 */
export function formatPassengerCode(seq: number): string {
  return `P-${formatSequence(seq, 6)}`
}

/**
 * Formats a Payment ID: PAY-000001, PAY-000002...
 */
export function formatPaymentCode(seq: number): string {
  return `PAY-${formatSequence(seq, 6)}`
}

/**
 * Generates the next sequential Group Code from database
 */
export async function getNextGroupCode(): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('groups')
    .select('*', { count: 'exact', head: true })

  let nextSeq = (error || count === null ? 0 : count) + 1
  let candidate = formatGroupCode(nextSeq)

  while (true) {
    const { data: existing } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('group_code', candidate)
      .maybeSingle()

    if (!existing) {
      break
    }
    nextSeq++
    candidate = formatGroupCode(nextSeq)
  }

  return candidate
}

/**
 * Generates the next sequential Booking Code for today's journey/creation date
 */
export async function getNextBookingCode(journeyDate?: Date): Promise<string> {
  const d = journeyDate || new Date()
  const { count, error } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  let nextSeq = (error || count === null ? 0 : count) + 1
  let candidate = formatBookingCode(d, nextSeq)

  while (true) {
    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('booking_code', candidate)
      .maybeSingle()

    if (!existing) {
      break
    }
    nextSeq++
    candidate = formatBookingCode(d, nextSeq)
  }

  return candidate
}

/**
 * Generates the next sequential Passenger Code
 */
export async function getNextPassengerCode(offset = 0): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('passengers')
    .select('*', { count: 'exact', head: true })

  let nextSeq = (error || count === null ? 0 : count) + 1 + offset
  let candidate = formatPassengerCode(nextSeq)

  while (true) {
    const { data: existing } = await supabaseAdmin
      .from('passengers')
      .select('id')
      .eq('passenger_code', candidate)
      .maybeSingle()

    if (!existing) {
      break
    }
    nextSeq++
    candidate = formatPassengerCode(nextSeq)
  }

  return candidate
}

/**
 * Generates the next sequential Payment Code
 */
export async function getNextPaymentCode(): Promise<string> {
  const { count, error } = await supabaseAdmin
    .from('payments')
    .select('*', { count: 'exact', head: true })

  let nextSeq = (error || count === null ? 0 : count) + 1
  let candidate = formatPaymentCode(nextSeq)

  while (true) {
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('payment_code', candidate)
      .maybeSingle()

    if (!existing) {
      break
    }
    nextSeq++
    candidate = formatPaymentCode(nextSeq)
  }

  return candidate
}
