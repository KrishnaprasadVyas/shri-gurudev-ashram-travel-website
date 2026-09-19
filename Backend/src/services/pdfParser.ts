// @ts-ignore
import * as pdfParseModule from 'pdf-parse'
const pdfParseFn: any = typeof pdfParseModule === 'function'
  ? pdfParseModule
  : (pdfParseModule as any)?.default?.default || (pdfParseModule as any)?.default || pdfParseModule

export interface ParsedTicketData {
  pnr?: string
  trainNumber?: string
  trainName?: string
  journeyDate?: string
  boardingStation?: string
  destinationStation?: string
  suggestedPassengers: Array<{
    name: string
    coach?: string
    seatBerth?: string
  }>
  rawTextPreview: string
}

/**
 * Extracts PNR and passenger details from an uploaded IRCTC/Akbar ticket PDF
 */
export async function parseTicketPdf(fileBuffer: Buffer): Promise<ParsedTicketData> {
  try {
    let text = ''
    if (typeof pdfParseFn === 'function') {
      try {
        const data = await pdfParseFn(fileBuffer)
        text = data?.text || ''
      } catch (err: any) {
        console.warn('[PDF Parser Warning] pdf-parse error, falling back to buffer text scan:', err.message)
        text = fileBuffer.toString('latin1')
      }
    } else {
      text = fileBuffer.toString('latin1')
    }

    // 1. Extract 10-digit PNR (standard Indian Railways format)
    const pnrMatch = text.match(/PNR\s*(?:No\.?)?\s*[:#-]?\s*(\d{10})/i) || text.match(/\b(\d{10})\b/)
    const pnr = pnrMatch ? pnrMatch[1] : undefined

    // 2. Extract 5-digit Train Number
    const trainMatch = text.match(/Train\s*(?:No\.?)?\s*[:#-]?\s*(\d{5})/i) || text.match(/\b(\d{5})\b/)
    const trainNumber = trainMatch ? trainMatch[1] : undefined

    // 3. Extract Coach and Berths
    // e.g. Coach S4 / Berth 42 or B1-45 or S-5 21
    const coachSeatMatches = Array.from(
      text.matchAll(/\b([A-Z]\d{1,2}|HA\d|S\d{1,2}|SL|CC|EC|B\d{1,2}|A\d{1,2})\s*[-/,\s]\s*(\d{1,3})\b/g),
    )

    // 4. Extract possible passenger lines
    const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean)
    const suggestedPassengers: ParsedTicketData['suggestedPassengers'] = []

    // Look for lines that look like devotee names followed by age/gender or coach
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Match patterns like: "1. SHARMA/RAJESH 45 M" or "RAJESH SHARMA 45 MALE"
      const nameMatch = line.match(/^(?:\d+[\.\)]\s*)?([A-Z\s]{3,35})\s+(\d{1,2})\s*(?:Years?|\/)?\s*(M|F|Male|Female)/i)
      if (nameMatch) {
        const rawName = nameMatch[1].trim()
        // Skip common header words
        if (!rawName.includes('INDIAN RAILWAYS') && !rawName.includes('PASSENGER') && !rawName.includes('IRCTC')) {
          const matchIndex = suggestedPassengers.length
          const cs = coachSeatMatches[matchIndex] as any
          suggestedPassengers.push({
            name: rawName,
            coach: cs ? cs[1] : undefined,
            seatBerth: cs ? cs[2] : undefined,
          })
        }
      }
    }

    return {
      pnr,
      trainNumber,
      suggestedPassengers,
      rawTextPreview: text.slice(0, 500),
    }
  } catch (error) {
    console.warn('[PDF Parser Warning] Failed to parse PDF text:', error)
    return {
      suggestedPassengers: [],
      rawTextPreview: '',
    }
  }
}
