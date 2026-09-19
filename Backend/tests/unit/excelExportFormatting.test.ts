import { describe, it, expect } from 'vitest'
import {
  generateTrainManifestWorkbook,
  TrainExportPassenger,
} from '../../src/services/excelExporter.js'

describe('Train Manifest Excel Exporter Specification Tests', () => {
  const samplePassengers: TrainExportPassenger[] = [
    // Group 1: Sharma Family (Going AC)
    {
      groupId: 'g1',
      groupCode: 'GRP-0001',
      groupName: 'Sharma Family',
      bookingId: 'b1',
      bookingCode: 'MVT-270427-0001',
      passengerId: 'p1',
      passengerCode: 'P-000001',
      passengerName: 'Rajesh Sharma',
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
      groupId: 'g1',
      groupCode: 'GRP-0001',
      groupName: 'Sharma Family',
      bookingId: 'b1',
      bookingCode: 'MVT-270427-0001',
      passengerId: 'p2',
      passengerCode: 'P-000002',
      passengerName: 'Sunita Sharma',
      age: 42,
      gender: 'F',
      mobile: '9876543210',
      travelClass: 'ac',
      journeyType: 'going',
      journeyDate: '2027-04-27',
      boardingStation: 'NDLS',
      destinationStation: 'SVDK',
    },
    // Group 2: Patil Family (Going AC)
    {
      groupId: 'g2',
      groupCode: 'GRP-0002',
      groupName: 'Patil Family',
      bookingId: 'b2',
      bookingCode: 'MVT-270427-0002',
      passengerId: 'p3',
      passengerCode: 'P-000003',
      passengerName: 'Ramesh Patil',
      age: 50,
      gender: 'M',
      mobile: '9876543211',
      travelClass: 'ac',
      journeyType: 'going',
      journeyDate: '2027-04-27',
      boardingStation: 'BCT',
      destinationStation: 'SVDK',
    },
    // Group 3: Verma Family (Going Non-AC)
    {
      groupId: 'g3',
      groupCode: 'GRP-0003',
      groupName: 'Verma Family',
      bookingId: 'b3',
      bookingCode: 'MVT-270427-0003',
      passengerId: 'p4',
      passengerCode: 'P-000004',
      passengerName: 'Suresh Verma',
      age: 38,
      gender: 'M',
      mobile: '9876543212',
      travelClass: 'non_ac',
      journeyType: 'going',
      journeyDate: '2027-04-27',
      boardingStation: 'NDLS',
      destinationStation: 'SVDK',
    },
  ]

  it('creates workbook with all 4 required sheets and never mixes AC and Non-AC', async () => {
    const workbook = await generateTrainManifestWorkbook(samplePassengers)

    expect(workbook.worksheets.length).toBe(4)
    expect(workbook.getWorksheet('Going - AC')).toBeDefined()
    expect(workbook.getWorksheet('Going - Non-AC')).toBeDefined()
    expect(workbook.getWorksheet('Return - AC')).toBeDefined()
    expect(workbook.getWorksheet('Return - Non-AC')).toBeDefined()

    const goingAcSheet = workbook.getWorksheet('Going - AC')!
    const goingNonAcSheet = workbook.getWorksheet('Going - Non-AC')!

    // Verify AC sheet has Sharma (2) + Patil (1) = 3 passenger rows
    // Verify Non-AC sheet has Verma (1) passenger row
    const acValues = goingAcSheet.getSheetValues().flat().filter(Boolean).map(String)
    expect(acValues.some((v) => v.includes('Rajesh Sharma'))).toBe(true)
    expect(acValues.some((v) => v.includes('Ramesh Patil'))).toBe(true)
    expect(acValues.some((v) => v.includes('Suresh Verma'))).toBe(false) // Never in AC!

    const nonAcValues = goingNonAcSheet.getSheetValues().flat().filter(Boolean).map(String)
    expect(nonAcValues.some((v) => v.includes('Suresh Verma'))).toBe(true)
    expect(nonAcValues.some((v) => v.includes('Rajesh Sharma'))).toBe(false) // Never in Non-AC!
  })

  it('formats Group Name header and exactly ONE blank row between groups', async () => {
    const workbook = await generateTrainManifestWorkbook(samplePassengers)
    const sheet = workbook.getWorksheet('Going - AC')!

    // Row 1: Header row (Passenger ID, Booking ID, ...)
    expect(sheet.getRow(1).getCell(1).value).toBe('Passenger ID')

    // Row 2: Group Header for Sharma Family
    const r2 = String(sheet.getRow(2).getCell(1).value)
    expect(r2).toContain('GROUP: GRP-0001 - SHARMA FAMILY')

    // Row 3 & 4: Passengers Rajesh & Sunita
    expect(sheet.getRow(3).getCell(3).value).toBe('Rajesh Sharma')
    expect(sheet.getRow(4).getCell(3).value).toBe('Sunita Sharma')

    // Row 5: EXACTLY ONE BLANK ROW!
    const r5Cell = sheet.getRow(5).getCell(1).value
    expect(r5Cell === null || r5Cell === undefined || r5Cell === '').toBe(true)

    // Row 6: Group Header for Patil Family
    const r6 = String(sheet.getRow(6).getCell(1).value)
    expect(r6).toContain('GROUP: GRP-0002 - PATIL FAMILY')

    // Row 7: Passenger Ramesh Patil
    expect(sheet.getRow(7).getCell(3).value).toBe('Ramesh Patil')
  })

  it('guarantees Booking ID, Passenger ID, and all mandatory passenger fields exist on every devotee row', async () => {
    const returnPassengers: TrainExportPassenger[] = [
      {
        groupId: 'g1',
        groupCode: 'GRP-0001',
        groupName: 'Sharma Family',
        bookingId: 'b1',
        bookingCode: 'MVT-270427-0001',
        passengerId: 'p1',
        passengerCode: 'P-000001',
        passengerName: 'Rajesh Sharma',
        age: 45,
        gender: 'M',
        berthPreference: 'Lower',
        mobile: '9876543210',
        foodPreference: 'Pure Veg',
        travelClass: 'ac',
        journeyType: 'return',
        journeyDate: '2027-05-02',
        boardingStation: 'SVDK',
        destinationStation: 'NDLS',
        idProofType: 'Aadhaar',
        idProofNumber: 'XXXX-XXXX-1234',
      },
    ]

    const workbook = await generateTrainManifestWorkbook(returnPassengers)
    const returnAcSheet = workbook.getWorksheet('Return - AC')!
    expect(returnAcSheet).toBeDefined()

    // Row 1: Column Headers
    expect(returnAcSheet.getRow(1).getCell(1).value).toBe('Passenger ID')
    expect(returnAcSheet.getRow(1).getCell(2).value).toBe('Booking ID')
    expect(returnAcSheet.getRow(1).getCell(3).value).toBe('Passenger Name')
    expect(returnAcSheet.getRow(1).getCell(6).value).toBe('Berth Pref')
    expect(returnAcSheet.getRow(1).getCell(8).value).toBe('Food / Seva')

    // Row 3: Devotee Row (Row 2 is Group Header)
    const devoteeRow = returnAcSheet.getRow(3)
    expect(devoteeRow.getCell(1).value).toBe('P-000001')
    expect(devoteeRow.getCell(2).value).toBe('MVT-270427-0001')
    expect(devoteeRow.getCell(3).value).toBe('Rajesh Sharma')
    expect(devoteeRow.getCell(4).value).toBe(45)
    expect(devoteeRow.getCell(5).value).toBe('M')
    expect(devoteeRow.getCell(6).value).toBe('Lower')
    expect(devoteeRow.getCell(7).value).toBe('9876543210')
    expect(devoteeRow.getCell(8).value).toBe('Pure Veg')
    expect(devoteeRow.getCell(9).value).toBe('AC')
    expect(devoteeRow.getCell(10).value).toBe('RETURN')
    expect(devoteeRow.getCell(11).value).toBe('2027-05-02')
    expect(devoteeRow.getCell(12).value).toBe('SVDK')
    expect(devoteeRow.getCell(13).value).toBe('NDLS')
    expect(devoteeRow.getCell(14).value).toBe('Aadhaar')
    expect(devoteeRow.getCell(15).value).toBe('XXXX-XXXX-1234')
  })
})
