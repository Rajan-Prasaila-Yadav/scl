import { getRaw } from './storage.js'
export function academicBillingYears() {
  let years=['2025–2026','2026–2027','2027–2028']
  try { years=JSON.parse(getRaw('academicYears') || JSON.stringify(years)) } catch {}
  const active=getRaw('academicYear') || '2026–2027'
  return {active,years:[...new Set([active,...(Array.isArray(years)?years:[])])].filter(v=>typeof v==='string' && v.trim())}
}
export const invoiceYear = invoice => invoice.academicYear || 'Unassigned legacy'
