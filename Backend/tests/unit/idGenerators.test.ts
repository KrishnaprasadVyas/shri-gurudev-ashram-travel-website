import { describe, it, expect } from 'vitest'
import {
  formatGroupCode,
  formatBookingCode,
  formatPassengerCode,
  formatPaymentCode,
} from '../../src/services/idGenerators.js'

describe('ID Generators Specification Tests', () => {
  it('formats Group ID as GRP-XXXX with 4 digits', () => {
    expect(formatGroupCode(1)).toBe('GRP-0001')
    expect(formatGroupCode(42)).toBe('GRP-0042')
    expect(formatGroupCode(9999)).toBe('GRP-9999')
  })

  it('formats Booking ID as MVT-YYMMDD-XXXX matching specification', () => {
    // Test date: April 27, 2027 -> MVT-270427-0001
    const testDate = new Date(2027, 3, 27) // month is 0-indexed: 3 = April
    expect(formatBookingCode(testDate, 1)).toBe('MVT-270427-0001')

    const date2 = new Date(2026, 8, 15) // September 15, 2026
    expect(formatBookingCode(date2, 45)).toBe('MVT-260915-0045')
  })

  it('formats Passenger ID as P-XXXXXX with 6 digits', () => {
    expect(formatPassengerCode(1)).toBe('P-000001')
    expect(formatPassengerCode(700)).toBe('P-000700')
    expect(formatPassengerCode(10500)).toBe('P-010500')
  })

  it('formats Payment ID as PAY-XXXXXX with 6 digits', () => {
    expect(formatPaymentCode(1)).toBe('PAY-000001')
    expect(formatPaymentCode(350)).toBe('PAY-000350')
  })
})
