import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes without conflicts — shadcn/ui standard */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Get BCP 47 locale code for Indian regional languages */
export function getLocaleCode(lang?: string): string {
  if (lang === 'hi') return 'hi-IN'
  if (lang === 'mr') return 'mr-IN'
  return 'en-IN'
}

/** Format currency for Indian / international display */
export function formatCurrency(amount: number, currency = 'INR', lang = 'en') {
  return new Intl.NumberFormat(getLocaleCode(lang), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Formats a date string (ISO or YYYY-MM-DD) into human-readable localized date */
export function formatDate(
  date: string | Date | null | undefined,
  lang = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return String(date)
    const locale = getLocaleCode(lang)
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options,
    }
    return d.toLocaleDateString(locale, defaultOptions)
  } catch {
    return String(date)
  }
}

/** Formats a date range into a localized human-readable string without raw ISO timestamps */
export function formatDateRange(
  startDate?: string | Date | null,
  endDate?: string | Date | null,
  lang = 'en'
): string {
  if (!startDate && !endDate) return ''
  if (startDate && !endDate) return formatDate(startDate, lang)
  if (!startDate && endDate) return formatDate(endDate, lang)

  const startStr = formatDate(startDate, lang, { day: 'numeric', month: 'short' })
  const endStr = formatDate(endDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })
  return `${startStr} – ${endStr}`
}

/** Relative time label for activity feeds */
export function formatRelativeTime(date: string | Date, lang = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return lang === 'hi' ? 'अभी' : lang === 'mr' ? 'आत्ताच' : 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(getLocaleCode(lang), { month: 'short', day: 'numeric' })
}

/** Dynamic Razorpay Web Checkout SDK script loader */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
