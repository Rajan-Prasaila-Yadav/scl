import { eligibleFees, normalizeBillingPeriod } from './validation.js'

export const BILLING_FREQUENCIES = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'One-Time', 'Yearly']
export const money = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100

export function paymentTotals(subtotal, form) {
  subtotal = money(subtotal)
  let error = ''
  const adjustment = (type, raw, base, label) => {
    if (!type || type === 'none') return 0
    const percent = type.endsWith('%') || type === 'customPercent'
    const value = type.endsWith('%') ? Number(type.slice(0, -1)) : Number(raw)
    if ((raw === '' && type.startsWith('custom')) || !Number.isFinite(value) || value < 0 || (percent && value > 100)) { error = `${label} must be a valid nonnegative amount or percentage from 0 to 100.`; return 0 }
    const amount = money(percent ? base * value / 100 : value)
    if (label === 'Discount' && amount > base) { error = 'Discount cannot exceed the invoice subtotal.'; return 0 }
    return amount
  }
  const discount = adjustment(form.discountType, form.customDiscount, subtotal, 'Discount')
  const tax = adjustment(form.taxType, form.customTax, money(subtotal - discount), 'Tax')
  return { subtotal, discount, tax, grandTotal: money(subtotal - discount + tax), error }
}

export function billingWindow(frequency, start, quantity = 1) {
  const qty = Number(quantity)
  if (!BILLING_FREQUENCIES.includes(frequency)) throw new Error('Choose a billing frequency.')
  if (!Number.isFinite(qty) || qty <= 0 || qty > 1000 || (frequency !== 'Hourly' && !Number.isInteger(qty))) throw new Error('Use 1–1000 whole units, or fractional hours.')
  if (frequency === 'One-Time' && qty !== 1) throw new Error('One-time fees have exactly one unit.')
  const text = frequency === 'Hourly' ? `${start}:00Z` : `${start}T00:00:00Z`
  const date = new Date(text)
  if (!start || Number.isNaN(date.getTime()) || date.toISOString().slice(0, frequency === 'Hourly' ? 16 : 10) !== start) throw new Error('Enter a valid billing start date/time.')
  if (frequency === 'Monthly') date.setUTCDate(1)
  if (frequency === 'Yearly') { date.setUTCMonth(0); date.setUTCDate(1) }
  if (frequency === 'Weekly') date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7)
  const end = new Date(date)
  if (frequency === 'Hourly') end.setTime(end.getTime() + qty * 3600000)
  else if (frequency === 'Monthly') end.setUTCMonth(end.getUTCMonth() + qty)
  else if (frequency === 'Yearly') end.setUTCFullYear(end.getUTCFullYear() + qty)
  else end.setUTCDate(end.getUTCDate() + qty * (frequency === 'Weekly' ? 7 : 1))
  // ISO-like local wall-clock values: UTC arithmetic avoids browser DST differences.
  const from = date.toISOString().slice(0,16), until = end.toISOString().slice(0,16)
  return { start: from, end: until, quantity: qty, label: frequency === 'One-Time' ? `One-Time · ${start}` : `${frequency} · ${from.replace('T',' ')} → ${until.replace('T',' ')} (${qty} units)` }
}

export function buildBillingPreview(students, fees, form) {
  const period = billingWindow(form.frequency, form.start, form.quantity)
  const selected = fees.filter(f => form.feeIds.includes(f.id) && f.frequency === form.frequency)
  if (!selected.length) throw new Error('Select at least one fee.')
  let skipped = 0
  const invoices = []
  for (const student of students) {
    if (student.status !== 'active' || (form.classId !== 'all' && String(student.classId) !== String(form.classId))) continue
    const lines = []
    for (const fee of eligibleFees(selected, student)) {
      const duplicate = (student.payments || []).some(invoice => {
        const details = invoice.feesBreakdown || []
        const matching = details.filter(line => line.feeId !== undefined ? String(line.feeId) === String(fee.id) : line.name === fee.name)
        if (form.frequency === 'One-Time') return matching.length > 0
        if (matching.some(line => line.periodStart && line.periodEnd && line.periodStart < period.end && period.start < line.periodEnd)) return true
        // Legacy monthly invoices lack explicit periods. Avoid re-billing the covered month.
        if (form.frequency === 'Monthly' && (matching.some(line => !line.periodStart) || !details.length)) {
          const month = normalizeBillingPeriod(invoice.month || '')
          return month && month >= period.start.slice(0,7) && month < period.end.slice(0,7)
        }
        return false
      })
      if (duplicate) { skipped++; continue }
      const studentRate = student.feeOverrides?.[fee.id]
      const classRate = fee.classRates?.[student.classId]
      const rate = Number(studentRate !== undefined && studentRate !== '' ? studentRate : classRate !== undefined && classRate !== '' ? classRate : fee.amount)
      if (!Number.isFinite(rate) || rate < 0) throw new Error(`Invalid rate for ${fee.name} / ${student.name}.`)
      lines.push({ feeId: fee.id, name: fee.name, rate: money(rate), quantity: period.quantity, amount: money(money(rate) * period.quantity), frequency: fee.frequency, periodStart: period.start, periodEnd: period.end })
    }
    if (lines.length) invoices.push({ studentId: student.id, studentName: student.name, lines, amount: money(lines.reduce((sum,line)=>sum+line.amount,0)) })
  }
  return { period, invoices, skipped, total: money(invoices.reduce((sum,row)=>sum+row.amount,0)) }
}

export function normalizeRelationship(value) { return String(value || '').trim().replace(/\s+/g, ' ') }
export function relationshipError(value, existing, original = '') {
  const name = normalizeRelationship(value)
  if (!name || name.length > 60 || ['other','custom'].includes(name.toLowerCase())) return 'Enter a specific relationship (1–60 characters), such as Grandfather.'
  if (existing.some(item => item.toLowerCase() === name.toLowerCase() && item !== original)) return 'This relationship already exists.'
  return ''
}
