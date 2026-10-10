export function schoolSettings() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('educore.settings') || '{}') } catch { return {} }
}
export function currencySymbol() {
  return schoolSettings().field28?.includes('NPR') ? 'रु' : '₹'
}
export function schoolName() { return schoolSettings().field1?.trim() || 'Sunrise Public School' }
