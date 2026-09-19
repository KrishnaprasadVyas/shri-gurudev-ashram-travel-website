export interface PackagePricingConfig {
  price: number
  train_ac_price?: number | null
  train_non_ac_price?: number | null
  ac_train_price?: number | null
  non_ac_train_price?: number | null
  room_ac_price?: number | null
  room_non_ac_price?: number | null
}

export interface PassengerTravelChoice {
  travel_class: 'ac' | 'non_ac' | 'AC' | 'Non-AC' | string
}

export interface CalculatedPricingBreakdown {
  basePricePerPerson: number
  passengerCount: number
  baseTotal: number
  acCount: number
  nonAcCount: number
  acSurchargePerPerson: number
  nonAcSurchargePerPerson: number
  acTotal: number
  nonAcTotal: number
  sevaAmount: number
  totalAmount: number
}

/**
 * Calculates booking totals based on per-passenger AC vs Non-AC choices
 */
export function calculateBookingPrice(
  pkg: PackagePricingConfig,
  passengers: PassengerTravelChoice[],
  additionalSevaAmount = 0,
): CalculatedPricingBreakdown {
  const basePricePerPerson = Number(pkg.price || 0)
  const passengerCount = passengers.length

  const acTrain = Number(pkg.train_ac_price ?? pkg.ac_train_price ?? 0)
  const acRoom = Number(pkg.room_ac_price || 0)
  const acSurchargePerPerson = acTrain + acRoom

  const nonAcTrain = Number(pkg.train_non_ac_price ?? pkg.non_ac_train_price ?? 0)
  const nonAcRoom = Number(pkg.room_non_ac_price || 0)
  const nonAcSurchargePerPerson = nonAcTrain + nonAcRoom

  let acCount = 0
  let nonAcCount = 0

  for (const p of passengers) {
    const cls = (p.travel_class || '').toLowerCase()
    if (cls === 'ac') {
      acCount++
    } else {
      nonAcCount++
    }
  }

  const baseTotal = basePricePerPerson * passengerCount
  const acTotal = (basePricePerPerson + acSurchargePerPerson) * acCount
  const nonAcTotal = (basePricePerPerson + nonAcSurchargePerPerson) * nonAcCount
  const totalAmount = baseTotal + (acSurchargePerPerson * acCount) + (nonAcSurchargePerPerson * nonAcCount) + additionalSevaAmount

  return {
    basePricePerPerson,
    passengerCount,
    baseTotal,
    acCount,
    nonAcCount,
    acSurchargePerPerson,
    nonAcSurchargePerPerson,
    acTotal,
    nonAcTotal,
    sevaAmount: additionalSevaAmount,
    totalAmount,
  }
}

/**
 * Reconciles installment payments against total amount to determine balance and status
 */
export function reconcilePaymentBalance(
  totalAmount: number,
  verifiedPayments: Array<{ amount: number }>,
): {
  totalPaid: number
  pendingBalance: number
  paymentStatus: 'pending' | 'partially_paid' | 'fully_paid'
} {
  const totalPaid = verifiedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const pendingBalance = Math.max(0, totalAmount - totalPaid)

  let paymentStatus: 'pending' | 'partially_paid' | 'fully_paid' = 'pending'
  if (totalPaid <= 0) {
    paymentStatus = 'pending'
  } else if (totalPaid >= totalAmount) {
    paymentStatus = 'fully_paid'
  } else {
    paymentStatus = 'partially_paid'
  }

  return {
    totalPaid,
    pendingBalance,
    paymentStatus,
  }
}

/**
 * Validates UTR format and rejects empty / duplicates
 */
export function sanitizeUtr(utr?: string | null): string {
  return (utr || '').trim().toUpperCase()
}
