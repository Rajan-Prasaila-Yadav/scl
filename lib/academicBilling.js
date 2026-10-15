import { getRaw } from './storage.js'
export function academicBillingYears() {
  let years=['2025–2026','2026–2027','2027–2028']
  try { years=JSON.parse(getRaw('academicYears') || JSON.stringify(years)) } catch {}
  const active=getRaw('academicYear') || '2026–2027'
  return {active,years:[...new Set([active,...(Array.isArray(years)?years:[])])].filter(v=>typeof v==='string' && v.trim())}
}
export const invoiceYear = invoice => invoice.academicYear || 'Unassigned legacy'

export function academicYearRange(year) {
  try { return JSON.parse(getRaw('academicYearDates') || '{}')[year] || {} } catch { return {} }
}
const validDate = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value
export function academicRangeError(range) {
  if (!validDate(range.start) || !validDate(range.end) || range.start>range.end) return 'Set valid academic year start and end dates in Settings.'
  return ''
}
export function activationDateError(date, year, active, range) {
  if (year!==active) return 'Fee activation is allowed only in the active academic year. Reopen the editor.'
  const error=academicRangeError(range)
  if (error) return error
  if (!validDate(date) || date<range.start || date>range.end) return `Activation date must be between ${range.start} and ${range.end} in the active academic year.`
  return ''
}
