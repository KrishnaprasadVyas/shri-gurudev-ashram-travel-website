import { describe, it, expect } from 'vitest'
import {
  calculateBookingPrice,
  reconcilePaymentBalance,
  sanitizeUtr,
} from '../../src/services/pricingEngine.js'

describe('Pricing Engine & Balance Reconciliation Tests', () => {
  const samplePackage = {
    price: 8000,
    train_ac_price: 1500,
    train_non_ac_price: 500,
    room_ac_price: 1000,
    room_non_ac_price: 0,
  }

  it('calculates price correctly for mixed AC and Non-AC passengers', () => {
    // 2 AC passengers, 1 Non-AC passenger
    // AC surcharge per person = 1500 (train) + 1000 (room) = 2500
    // Non-AC surcharge per person = 500 (train) + 0 (room) = 500
    // Base = 8000 * 3 = 24,000
    // AC extra = 2500 * 2 = 5,000
    // Non-AC extra = 500 * 1 = 500
    // Total = 24000 + 5000 + 500 = 29,500
    const passengers = [
      { travel_class: 'ac' },
      { travel_class: 'ac' },
      { travel_class: 'non_ac' },
    ]

    const result = calculateBookingPrice(samplePackage, passengers)

    expect(result.passengerCount).toBe(3)
    expect(result.acCount).toBe(2)
    expect(result.nonAcCount).toBe(1)
    expect(result.acSurchargePerPerson).toBe(2500)
    expect(result.nonAcSurchargePerPerson).toBe(500)
    expect(result.totalAmount).toBe(29500)
  })

  it('reconciles multiple payments and installment balances according to specification', () => {
    // Specification example:
    // Total = 40,000
    // Payment 1 = 10,000
    // Payment 2 = 15,000
    // Verified Paid = 25,000; Balance = 15,000
    const totalAmount = 40000
    const payments = [{ amount: 10000 }, { amount: 15000 }]

    const balance = reconcilePaymentBalance(totalAmount, payments)

    expect(balance.totalPaid).toBe(25000)
    expect(balance.pendingBalance).toBe(15000)
    expect(balance.paymentStatus).toBe('partially_paid')
  })

  it('sets paymentStatus to fully_paid when paid amount reaches total', () => {
    const totalAmount = 40000
    const payments = [{ amount: 25000 }, { amount: 15000 }]

    const balance = reconcilePaymentBalance(totalAmount, payments)

    expect(balance.totalPaid).toBe(40000)
    expect(balance.pendingBalance).toBe(0)
    expect(balance.paymentStatus).toBe('fully_paid')
  })

  it('sets paymentStatus to pending when no verified payments exist', () => {
    const balance = reconcilePaymentBalance(40000, [])

    expect(balance.totalPaid).toBe(0)
    expect(balance.pendingBalance).toBe(40000)
    expect(balance.paymentStatus).toBe('pending')
  })

  it('sanitizes UTR strings (case-insensitive and trimmed)', () => {
    expect(sanitizeUtr('  abc123xyz  ')).toBe('ABC123XYZ')
    expect(sanitizeUtr(null)).toBe('')
    expect(sanitizeUtr('utr-999')).toBe('UTR-999')
  })
})
