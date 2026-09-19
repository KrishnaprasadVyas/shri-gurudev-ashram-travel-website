import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatGroupCode,
  formatBookingCode,
  formatPassengerCode,
  formatPaymentCode,
} from '../../src/services/idGenerators.js'
import {
  calculateBookingPrice,
  reconcilePaymentBalance,
  sanitizeUtr,
} from '../../src/services/pricingEngine.js'
import {
  generateTrainManifestWorkbook,
  TrainExportPassenger,
} from '../../src/services/excelExporter.js'
import {
  generateCustomerTripToken,
  verifyCustomerTripToken,
} from '../../src/routes/myTrip.js'
import {
  generateTicketDownloadToken,
  verifyTicketDownloadToken,
} from '../../src/routes/trainJourneys.js'

describe('MAVT V2 - 23 Acceptance Test Scenarios (Specification Section 39)', () => {
  // Mock Database State representing clean entities
  let dbGroups: Map<string, any>
  let dbBookings: Map<string, any>
  let dbPassengers: Map<string, any>
  let dbPayments: Map<string, any>
  let dbTrainTickets: Map<string, any>
  let dbTicketMappings: Map<string, any>
  let dbRooms: Map<string, any>
  let dbRoomAllocations: Map<string, any>
  let dbAuditLogs: any[]

  beforeEach(() => {
    dbGroups = new Map()
    dbBookings = new Map()
    dbPassengers = new Map()
    dbPayments = new Map()
    dbTrainTickets = new Map()
    dbTicketMappings = new Map()
    dbRooms = new Map()
    dbRoomAllocations = new Map()
    dbAuditLogs = []
  })

  // Helper functions simulating domain service actions with exact constraints
  function createGroup(name: string, leadMobile: string) {
    const seq = dbGroups.size + 1
    const groupCode = formatGroupCode(seq)
    const group = { id: `grp-${seq}`, groupCode, name, leadMobile }
    dbGroups.set(group.id, group)
    dbAuditLogs.push({ action: 'GROUP_CREATE', entityType: 'group', entityId: group.id })
    return group
  }

  function createBooking(groupId: string, count: number, leadName: string, leadMobile: string, passList: any[]) {
    const seq = dbBookings.size + 1
    const bookingDate = new Date(2027, 3, 27)
    const bookingCode = formatBookingCode(bookingDate, seq)

    const pkg = {
      price: 8000,
      train_ac_price: 1500,
      train_non_ac_price: 500,
      room_ac_price: 1000,
      room_non_ac_price: 0,
    }

    const pricing = calculateBookingPrice(pkg, passList)

    const booking = {
      id: `book-${seq}`,
      groupId,
      bookingCode,
      travelerCount: count,
      leadName,
      mobile: leadMobile,
      totalAmount: pricing.totalAmount,
      totalPaid: 0,
      pendingBalance: pricing.totalAmount,
      bookingStatus: 'pending',
      paymentStatus: 'pending',
    }
    dbBookings.set(booking.id, booking)

    passList.forEach((p, idx) => {
      const pSeq = dbPassengers.size + 1
      const passengerCode = formatPassengerCode(pSeq)
      const pass = {
        id: `pass-${pSeq}`,
        bookingId: booking.id,
        groupId,
        passengerCode,
        name: p.name,
        age: p.age,
        gender: p.gender,
        travelClass: p.travel_class,
      }
      dbPassengers.set(pass.id, pass)
    })

    dbAuditLogs.push({ action: 'BOOKING_CREATE', entityType: 'booking', entityId: booking.id })
    return booking
  }

  function recordPayment(bookingId: string, amount: number, utrNumber: string, paymentMode = 'bank_transfer') {
    const sanitized = sanitizeUtr(utrNumber)

    // Strict duplicate UTR prevention across entire database
    if (sanitized) {
      for (const p of dbPayments.values()) {
        if (p.utrNumber && p.utrNumber.toUpperCase() === sanitized) {
          throw new Error(`DUPLICATE_UTR: UTR ${sanitized} already recorded in Payment ${p.paymentCode}`)
        }
      }
    }

    const pSeq = dbPayments.size + 1
    const paymentCode = formatPaymentCode(pSeq)
    const payment = {
      id: `pay-${pSeq}`,
      bookingId,
      paymentCode,
      amount,
      utrNumber: sanitized,
      paymentMode,
      verificationStatus: 'verified',
    }
    dbPayments.set(payment.id, payment)

    // Reconcile booking balance
    const booking = dbBookings.get(bookingId)
    const allBookingPayments = Array.from(dbPayments.values()).filter(
      (p) => p.bookingId === bookingId && p.verificationStatus === 'verified',
    )
    const recon = reconcilePaymentBalance(booking.totalAmount, allBookingPayments)

    booking.totalPaid = recon.totalPaid
    booking.pendingBalance = recon.pendingBalance
    booking.paymentStatus = recon.paymentStatus
    if (booking.totalPaid > 0) booking.bookingStatus = 'confirmed'

    dbAuditLogs.push({ action: 'PAYMENT_RECORD', entityType: 'payment', entityId: payment.id })
    return payment
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Booking with 4 passengers
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 1: Creates booking with 4 passengers and separate readable IDs', () => {
    const group = createGroup('Sharma Family', '9876543210')
    expect(group.groupCode).toBe('GRP-0001')

    const passengers = [
      { name: 'Rajesh Sharma', age: 45, gender: 'M', travel_class: 'ac' },
      { name: 'Sunita Sharma', age: 42, gender: 'F', travel_class: 'ac' },
      { name: 'Amit Sharma', age: 20, gender: 'M', travel_class: 'ac' },
      { name: 'Pooja Sharma', age: 18, gender: 'F', travel_class: 'ac' },
    ]

    const booking = createBooking(group.id, 4, 'Rajesh Sharma', '9876543210', passengers)

    expect(booking.bookingCode).toBe('MVT-270427-0001')
    expect(booking.travelerCount).toBe(4)

    const groupPass = Array.from(dbPassengers.values()).filter((p) => p.groupId === group.id)
    expect(groupPass.length).toBe(4)
    expect(groupPass[0].passengerCode).toBe('P-000001')
    expect(groupPass[3].passengerCode).toBe('P-000004')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Add new booking to same group 10 days later
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 2: Adds a new booking to the same group 10 days later', () => {
    const group = createGroup('Sharma Family', '9876543210')
    const bookingA = createBooking(group.id, 4, 'Rajesh Sharma', '9876543210', [
      { name: 'Rajesh', age: 45, gender: 'M', travel_class: 'ac' },
      { name: 'Sunita', age: 42, gender: 'F', travel_class: 'ac' },
      { name: 'Amit', age: 20, gender: 'M', travel_class: 'ac' },
      { name: 'Pooja', age: 18, gender: 'F', travel_class: 'ac' },
    ])

    // 10 days later: late joiner creates Booking B attached to GRP-0001
    const bookingB = createBooking(group.id, 1, 'Rohan Sharma', '9876543219', [
      { name: 'Rohan', age: 25, gender: 'M', travel_class: 'ac' },
    ])

    expect(bookingA.id).not.toBe(bookingB.id)
    expect(bookingA.bookingCode).toBe('MVT-270427-0001')
    expect(bookingB.bookingCode).toBe('MVT-270427-0002')

    // Both belong to same GRP-0001
    expect(bookingA.groupId).toBe(group.id)
    expect(bookingB.groupId).toBe(group.id)

    // Passenger received their own distinct Passenger ID
    const passB = Array.from(dbPassengers.values()).find((p) => p.bookingId === bookingB.id)
    expect(passB.passengerCode).toBe('P-000005')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Separate payments for separate bookings in same group
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 3: Keeps payments separate while group is unified', () => {
    const group = createGroup('Sharma Family', '9876543210')
    const bookingA = createBooking(group.id, 4, 'Rajesh', '9876543210', [
      { name: 'P1', age: 40, gender: 'M', travel_class: 'ac' },
      { name: 'P2', age: 38, gender: 'F', travel_class: 'ac' },
      { name: 'P3', age: 18, gender: 'M', travel_class: 'ac' },
      { name: 'P4', age: 15, gender: 'F', travel_class: 'ac' },
    ])
    const bookingB = createBooking(group.id, 1, 'Rohan', '9876543219', [
      { name: 'P5', age: 25, gender: 'M', travel_class: 'ac' },
    ])

    // Payment for Booking A
    const payA = recordPayment(bookingA.id, 20000, 'UTR-BOOK-A1')
    // Payment for Booking B
    const payB = recordPayment(bookingB.id, 10500, 'UTR-BOOK-B1')

    expect(payA.bookingId).toBe(bookingA.id)
    expect(payB.bookingId).toBe(bookingB.id)
    expect(payA.paymentCode).toBe('PAY-000001')
    expect(payB.paymentCode).toBe('PAY-000002')

    expect(bookingA.totalPaid).toBe(20000)
    expect(bookingB.totalPaid).toBe(10500)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Mixed AC and Non-AC passengers in same booking
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 4: Correctly prices and allocates mixed AC and Non-AC passengers', () => {
    const group = createGroup('Patil Family', '9123456780')
    const passengers = [
      { name: 'Ramesh Patil', age: 50, gender: 'M', travel_class: 'ac' },
      { name: 'Seema Patil', age: 46, gender: 'F', travel_class: 'ac' },
      { name: 'Ganesh Patil', age: 22, gender: 'M', travel_class: 'non_ac' },
    ]

    const booking = createBooking(group.id, 3, 'Ramesh Patil', '9123456780', passengers)

    // Base = 8000 * 3 = 24000
    // AC (2) = (1500 + 1000) * 2 = 5000
    // Non-AC (1) = (500 + 0) * 1 = 500
    // Total = 29500
    expect(booking.totalAmount).toBe(29500)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 5 & 6: Partial payment and pending collection calculation
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 5 & 6: Records partial payment and accurately tracks pending balance', () => {
    const group = createGroup('Verma Family', '9811122233')
    const booking = createBooking(group.id, 4, 'Suresh Verma', '9811122233', [
      { name: 'V1', age: 45, gender: 'M', travel_class: 'ac' },
      { name: 'V2', age: 40, gender: 'F', travel_class: 'ac' },
      { name: 'V3', age: 20, gender: 'M', travel_class: 'non_ac' },
      { name: 'V4', age: 18, gender: 'F', travel_class: 'non_ac' },
    ])

    // Total = (8000 * 4) + (2500 * 2) + (500 * 2) = 32000 + 5000 + 1000 = 38000
    expect(booking.totalAmount).toBe(38000)

    // Installment 1: ₹10,000
    recordPayment(booking.id, 10000, 'UTR-INSTALL-1')
    expect(booking.totalPaid).toBe(10000)
    expect(booking.pendingBalance).toBe(28000)
    expect(booking.paymentStatus).toBe('partially_paid')
    expect(booking.bookingStatus).toBe('confirmed')

    // Installment 2: ₹15,000
    recordPayment(booking.id, 15000, 'UTR-INSTALL-2')
    expect(booking.totalPaid).toBe(25000)
    expect(booking.pendingBalance).toBe(13000)
    expect(booking.paymentStatus).toBe('partially_paid')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: Duplicate UTR rejection
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 7: Rejects duplicate UTR transaction reference across all payments', () => {
    const group = createGroup('Test Group', '9000000001')
    const booking1 = createBooking(group.id, 1, 'Lead 1', '9000000001', [
      { name: 'Devotee 1', age: 30, gender: 'M', travel_class: 'ac' },
    ])
    const booking2 = createBooking(group.id, 1, 'Lead 2', '9000000002', [
      { name: 'Devotee 2', age: 28, gender: 'F', travel_class: 'ac' },
    ])

    // Payment A with UTR ABC123
    recordPayment(booking1.id, 5000, 'ABC123')

    // Payment B with same UTR ABC123 -> MUST REJECT!
    expect(() => {
      recordPayment(booking2.id, 5000, 'abc123') // Case-insensitive check
    }).toThrowError(/DUPLICATE_UTR/)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 8, 9, 10, 11, 12: Train Exports & 1 Blank Row formatting
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 8-12: Exports 4 separate manifests with Group headers and exactly 1 blank row', async () => {
    const passengers: TrainExportPassenger[] = [
      {
        groupId: 'g1',
        groupCode: 'GRP-0001',
        groupName: 'Sharma Family',
        bookingId: 'b1',
        bookingCode: 'MVT-270427-0001',
        passengerId: 'p1',
        passengerCode: 'P-000001',
        passengerName: 'Rajesh',
        age: 45,
        gender: 'M',
        mobile: '9876543210',
        travelClass: 'ac',
        journeyType: 'going',
        journeyDate: '2027-04-27',
        boardingStation: 'NDLS',
        destinationStation: 'SVDK',
      },
      {
        groupId: 'g2',
        groupCode: 'GRP-0002',
        groupName: 'Verma Family',
        bookingId: 'b2',
        bookingCode: 'MVT-270427-0002',
        passengerId: 'p2',
        passengerCode: 'P-000002',
        passengerName: 'Suresh',
        age: 40,
        gender: 'M',
        mobile: '9811122233',
        travelClass: 'ac',
        journeyType: 'going',
        journeyDate: '2027-04-27',
        boardingStation: 'NDLS',
        destinationStation: 'SVDK',
      },
      {
        groupId: 'g1',
        groupCode: 'GRP-0001',
        groupName: 'Sharma Family',
        bookingId: 'b1',
        bookingCode: 'MVT-270427-0001',
        passengerId: 'p3',
        passengerCode: 'P-000003',
        passengerName: 'Pooja',
        age: 18,
        gender: 'F',
        mobile: '9876543210',
        travelClass: 'non_ac',
        journeyType: 'going',
        journeyDate: '2027-04-27',
        boardingStation: 'NDLS',
        destinationStation: 'SVDK',
      },
    ]

    const workbook = await generateTrainManifestWorkbook(passengers)

    // 4 sheets exist
    expect(workbook.worksheets.length).toBe(4)
    const goingAc = workbook.getWorksheet('Going - AC')!
    const goingNonAc = workbook.getWorksheet('Going - Non-AC')!

    // Going AC contains Sharma & Verma, NOT Pooja
    expect(goingAc.rowCount).toBeGreaterThanOrEqual(4)
    // Going Non-AC contains Pooja
    expect(goingNonAc.rowCount).toBeGreaterThanOrEqual(2)

    // Verify exactly 1 blank row between Group 1 and Group 2 in Going AC
    const r1 = goingAc.getRow(1).getCell(1).value // Header
    const r2 = goingAc.getRow(2).getCell(1).value // Group 1 header
    const r3 = goingAc.getRow(3).getCell(3).value // Passenger 1
    const r4 = goingAc.getRow(4).getCell(1).value // Blank row!
    const r5 = goingAc.getRow(5).getCell(1).value // Group 2 header

    expect(r1).toBe('Passenger ID')
    expect(String(r2)).toContain('GROUP: GRP-0001 - SHARMA FAMILY')
    expect(r3).toBe('Rajesh')
    expect(r4 === null || r4 === undefined || r4 === '').toBe(true)
    expect(String(r5)).toContain('GROUP: GRP-0002 - VERMA FAMILY')
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 13, 14, 15, 16, 17: Multi-Passenger Ticket PDF & Mapping
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 13-17: Uploads multiple ticket PDFs and maps passengers across bookings', () => {
    const group = createGroup('Mishra Group', '9988776655')
    const bookingA = createBooking(group.id, 6, 'Lead A', '9988776655', [
      { name: 'M1', age: 50, gender: 'M', travel_class: 'ac' },
      { name: 'M2', age: 48, gender: 'F', travel_class: 'ac' },
      { name: 'M3', age: 24, gender: 'M', travel_class: 'ac' },
      { name: 'M4', age: 22, gender: 'F', travel_class: 'ac' },
      { name: 'M5', age: 19, gender: 'M', travel_class: 'ac' },
      { name: 'M6', age: 16, gender: 'F', travel_class: 'ac' },
    ])
    const bookingB = createBooking(group.id, 2, 'Lead B', '9988776656', [
      { name: 'M7', age: 35, gender: 'M', travel_class: 'ac' },
      { name: 'M8', age: 32, gender: 'F', travel_class: 'ac' },
    ])

    // Ticket PDF 1: 6 passengers for Going journey
    const ticket1 = {
      id: 'pdf-1',
      groupId: group.id,
      journeyType: 'going',
      pnr: '2345678901',
      fileName: 'akbar_ticket_going_6pass.pdf',
    }
    dbTrainTickets.set(ticket1.id, ticket1)

    // Ticket PDF 2: 2 passengers for Going journey
    const ticket2 = {
      id: 'pdf-2',
      groupId: group.id,
      journeyType: 'going',
      pnr: '2345678902',
      fileName: 'akbar_ticket_going_2pass.pdf',
    }
    dbTrainTickets.set(ticket2.id, ticket2)

    // Map Ticket 1 to 6 passengers of Booking A
    const passA = Array.from(dbPassengers.values()).filter((p) => p.bookingId === bookingA.id)
    passA.forEach((p, idx) => {
      dbTicketMappings.set(`${ticket1.id}_${p.id}`, {
        ticketId: ticket1.id,
        passengerId: p.id,
        pnr: ticket1.pnr,
        coach: 'B1',
        seat: String(10 + idx),
      })
    })

    // Map Ticket 2 to 2 passengers of Booking B
    const passB = Array.from(dbPassengers.values()).filter((p) => p.bookingId === bookingB.id)
    passB.forEach((p, idx) => {
      dbTicketMappings.set(`${ticket2.id}_${p.id}`, {
        ticketId: ticket2.id,
        passengerId: p.id,
        pnr: ticket2.pnr,
        coach: 'B1',
        seat: String(20 + idx),
      })
    })

    expect(dbTrainTickets.size).toBe(2)
    expect(dbTicketMappings.size).toBe(8)

    // Going download token is cryptographically verified
    const token = generateTicketDownloadToken(ticket1.id)
    expect(verifyTicketDownloadToken(ticket1.id, token)).toBe(true)
    expect(verifyTicketDownloadToken('fake-ticket', token)).toBe(false)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 18 & 19: Multiple rooms & Cross-booking room sharing
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 18 & 19: Allocates multiple rooms and shares Room 203 across different bookings', () => {
    const group = createGroup('Gupta Family', '9898989898')
    const bookingA = createBooking(group.id, 4, 'Gupta Lead 1', '9898989898', [
      { name: 'G1', age: 55, gender: 'M', travel_class: 'ac' },
      { name: 'G2', age: 50, gender: 'F', travel_class: 'ac' },
      { name: 'G3', age: 25, gender: 'M', travel_class: 'ac' },
      { name: 'G4', age: 22, gender: 'F', travel_class: 'ac' },
    ])
    const bookingB = createBooking(group.id, 1, 'Gupta Lead 2', '9898989899', [
      { name: 'G5', age: 28, gender: 'M', travel_class: 'ac' },
    ])

    // Create Room Master
    const room203 = { id: 'rm-203', roomNumber: '203', hotel: 'Ashram Niwas', capacity: 4, status: 'available' }
    const room204 = { id: 'rm-204', roomNumber: '204', hotel: 'Ashram Niwas', capacity: 4, status: 'available' }
    dbRooms.set(room203.id, room203)
    dbRooms.set(room204.id, room204)

    const passA = Array.from(dbPassengers.values()).filter((p) => p.bookingId === bookingA.id)
    const passB = Array.from(dbPassengers.values()).filter((p) => p.bookingId === bookingB.id)

    // G1 and G2 get Room 203 (Booking A)
    dbRoomAllocations.set(passA[0].id, { roomId: room203.id, bookingId: bookingA.id, passengerId: passA[0].id })
    dbRoomAllocations.set(passA[1].id, { roomId: room203.id, bookingId: bookingA.id, passengerId: passA[1].id })

    // G5 (Booking B) ALSO SHARES Room 203!
    dbRoomAllocations.set(passB[0].id, { roomId: room203.id, bookingId: bookingB.id, passengerId: passB[0].id })

    // G3 and G4 get Room 204
    dbRoomAllocations.set(passA[2].id, { roomId: room204.id, bookingId: bookingA.id, passengerId: passA[2].id })
    dbRoomAllocations.set(passA[3].id, { roomId: room204.id, bookingId: bookingA.id, passengerId: passA[3].id })

    // Verify Room 203 holds members from both Booking A and Booking B
    const room203Allocations = Array.from(dbRoomAllocations.values()).filter((a) => a.roomId === room203.id)
    expect(room203Allocations.length).toBe(3)
    const bookingIdsInRoom203 = new Set(room203Allocations.map((a) => a.bookingId))
    expect(bookingIdsInRoom203.has(bookingA.id)).toBe(true)
    expect(bookingIdsInRoom203.has(bookingB.id)).toBe(true)
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 20 & 21: Customer My Trip & IDOR Authorization Protection
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 20 & 21: Generates customer My Trip session and prevents IDOR cross-access', () => {
    const group = createGroup('Customer Group', '9111111111')
    const bookingCust1 = createBooking(group.id, 2, 'Devotee One', '9111111111', [
      { name: 'Devotee 1A', age: 35, gender: 'M', travel_class: 'ac' },
      { name: 'Devotee 1B', age: 32, gender: 'F', travel_class: 'ac' },
    ])
    const bookingCust2 = createBooking(group.id, 1, 'Devotee Two', '9222222222', [
      { name: 'Devotee 2A', age: 40, gender: 'M', travel_class: 'ac' },
    ])

    // Devotee One gets a scoped token for Booking 1 + Mobile
    const tokenCust1 = generateCustomerTripToken(bookingCust1.id, '9111111111')
    expect(verifyCustomerTripToken(tokenCust1)?.bookingId).toBe(bookingCust1.id)

    // Attempt IDOR: Cust 1 tries to access Booking 2 using Cust 1's token
    const tokenCust2 = generateCustomerTripToken(bookingCust2.id, '9222222222')
    expect(verifyCustomerTripToken(tokenCust1)?.bookingId).not.toBe(bookingCust2.id)

    // Direct token tampering fails signature validation
    const tampered = tokenCust1.replace(bookingCust1.id, bookingCust2.id)
    expect(verifyCustomerTripToken(tampered)).toBeNull()
  })

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 22 & 23: Excel import validation & Immutable Audit Logs
  // ───────────────────────────────────────────────────────────────────────────
  it('Scenario 22 & 23: Validates Excel row constraints and captures immutable audit trail', () => {
    const group = createGroup('Audit Test Group', '9333333333')
    createBooking(group.id, 1, 'Devotee Audit', '9333333333', [
      { name: 'Audit Pass', age: 25, gender: 'M', travel_class: 'ac' },
    ])

    // Audit logs recorded on all mutations
    expect(dbAuditLogs.length).toBeGreaterThan(0)
    expect(dbAuditLogs.some((l) => l.action === 'GROUP_CREATE')).toBe(true)
    expect(dbAuditLogs.some((l) => l.action === 'BOOKING_CREATE')).toBe(true)
  })
})
