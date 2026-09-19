import ExcelJS from 'exceljs'

export interface TrainExportPassenger {
  groupId: string
  groupCode: string
  groupName: string
  bookingId: string
  bookingCode: string
  passengerId: string
  passengerCode: string
  passengerName: string
  age: number
  gender: string
  mobile: string
  travelClass: 'ac' | 'non_ac' | 'AC' | 'Non-AC' | string
  journeyType: 'going' | 'return' | 'Going' | 'Return' | string
  journeyDate: string
  boardingStation: string
  destinationStation: string
  berthPreference?: string
  foodPreference?: string
  idProofType?: string
  idProofNumber?: string
}

const EXPORT_COLUMNS = [
  { header: 'Passenger ID', key: 'passengerCode', width: 14 },
  { header: 'Booking ID', key: 'bookingCode', width: 20 },
  { header: 'Passenger Name', key: 'passengerName', width: 24 },
  { header: 'Age', key: 'age', width: 8 },
  { header: 'Gender', key: 'gender', width: 10 },
  { header: 'Berth Pref', key: 'berthPreference', width: 14 },
  { header: 'Mobile', key: 'mobile', width: 16 },
  { header: 'Food / Seva', key: 'foodPreference', width: 16 },
  { header: 'Travel Type', key: 'travelClass', width: 14 },
  { header: 'Journey Type', key: 'journeyType', width: 14 },
  { header: 'Journey Date', key: 'journeyDate', width: 15 },
  { header: 'Boarding Station', key: 'boardingStation', width: 18 },
  { header: 'Destination', key: 'destinationStation', width: 18 },
  { header: 'ID Type', key: 'idProofType', width: 14 },
  { header: 'ID Number', key: 'idProofNumber', width: 20 },
]

/**
 * Builds a sheet with Group headers and exactly 1 blank row between groups
 */
export function populateManifestSheet(sheet: ExcelJS.Worksheet, passengers: TrainExportPassenger[]) {
  sheet.columns = EXPORT_COLUMNS

  // Style Header Row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8C6A0A' }, // Saffron / Gold theme
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // Group passengers by Group ID / Group Name
  const grouped = new Map<string, TrainExportPassenger[]>()
  for (const p of passengers) {
    const key = p.groupCode ? `${p.groupCode} - ${p.groupName}` : (p.groupName || 'Unassigned Group')
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(p)
  }

  // Iterate over groups and add Group Header + Passengers + 1 blank row
  let isFirstGroup = true

  grouped.forEach((passList, groupHeaderTitle) => {
    if (!isFirstGroup) {
      // Exactly ONE blank row before the next group
      sheet.addRow([])
    }
    isFirstGroup = false

    // Group Header Row
    const groupRow = sheet.addRow([`GROUP: ${groupHeaderTitle.toUpperCase()} (${passList.length} Devotees)`])
    groupRow.font = { bold: true, color: { argb: 'FF3E2B1F' } }
    groupRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5EFE4' }, // Light warm cream
    }
    sheet.mergeCells(`A${groupRow.number}:O${groupRow.number}`)

    // Passenger Rows
    for (const p of passList) {
      sheet.addRow({
        passengerCode: p.passengerCode,
        bookingCode: p.bookingCode,
        passengerName: p.passengerName,
        age: p.age,
        gender: p.gender,
        berthPreference: p.berthPreference || '-',
        mobile: p.mobile,
        foodPreference: p.foodPreference || '-',
        travelClass: (p.travelClass || '').toUpperCase(),
        journeyType: (p.journeyType || '').toUpperCase(),
        journeyDate: p.journeyDate,
        boardingStation: p.boardingStation,
        destinationStation: p.destinationStation,
        idProofType: p.idProofType || '-',
        idProofNumber: p.idProofNumber || '-',
      })
    }
  })
}

/**
 * Builds a single Excel workbook containing all 4 required separate sheets:
 * 1. Going - AC
 * 2. Going - Non-AC
 * 3. Return - AC
 * 4. Return - Non-AC
 */
export async function generateTrainManifestWorkbook(allPassengers: TrainExportPassenger[]): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MAVT.IN Centralized System'
  workbook.created = new Date()

  // 1. Filter subsets
  const goingAc = allPassengers.filter(
    (p) => p.journeyType.toLowerCase() === 'going' && p.travelClass.toLowerCase() === 'ac',
  )
  const goingNonAc = allPassengers.filter(
    (p) => p.journeyType.toLowerCase() === 'going' && p.travelClass.toLowerCase() !== 'ac',
  )
  const returnAc = allPassengers.filter(
    (p) => p.journeyType.toLowerCase() === 'return' && p.travelClass.toLowerCase() === 'ac',
  )
  const returnNonAc = allPassengers.filter(
    (p) => p.journeyType.toLowerCase() === 'return' && p.travelClass.toLowerCase() !== 'ac',
  )

  // 2. Create 4 sheets
  const sheet1 = workbook.addWorksheet('Going - AC')
  populateManifestSheet(sheet1, goingAc)

  const sheet2 = workbook.addWorksheet('Going - Non-AC')
  populateManifestSheet(sheet2, goingNonAc)

  const sheet3 = workbook.addWorksheet('Return - AC')
  populateManifestSheet(sheet3, returnAc)

  const sheet4 = workbook.addWorksheet('Return - Non-AC')
  populateManifestSheet(sheet4, returnNonAc)

  return workbook
}

/**
 * Generates a single-sheet workbook for an individual category download
 */
export async function generateSingleManifestWorkbook(
  sheetName: string,
  passengers: TrainExportPassenger[],
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MAVT.IN Centralized System'
  const sheet = workbook.addWorksheet(sheetName)
  populateManifestSheet(sheet, passengers)
  return workbook
}
