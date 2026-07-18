import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const VERIFICATIONS_DIR = path.resolve(__dirname, '../../uploads/verifications')
const BOOKINGS_DIR = path.resolve(__dirname, '../../uploads/bookings')

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const storage = multer.diskStorage({
  destination: (request, _file, callback) => {
    const { bookingId, passengerId } = request.params as Record<string, string>
    const userId = (request as { userId?: string }).userId

    if (bookingId && passengerId) {
      const dir = path.join(BOOKINGS_DIR, bookingId, passengerId)
      fs.mkdirSync(dir, { recursive: true })
      callback(null, dir)
    } else if (userId) {
      const userDir = path.join(VERIFICATIONS_DIR, userId)
      fs.mkdirSync(userDir, { recursive: true })
      callback(null, userDir)
    } else {
      callback(new Error('Missing identification parameters for upload'), VERIFICATIONS_DIR)
    }
  },
  filename: (request, file, callback) => {
    const { bookingId, passengerId } = request.params as Record<string, string>
    const userId = (request as { userId?: string }).userId

    if (!userId && (!bookingId || !passengerId)) {
      callback(new Error('Missing identification parameters for upload'), `${file.fieldname}-unknown`)
      return
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname) || '.jpg'
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  },
})

function fileFilter(_request: Express.Request, file: Express.Multer.File, callback: multer.FileFilterCallback) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true)
  } else {
    callback(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP`))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})
