import {academicBillingYears} from './academicBilling.js'
export function finiteNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function intervalsOverlap(start, end, otherStart, otherEnd) {
  return !!(start && end && otherStart && otherEnd && start < otherEnd && otherStart < end)
}
export function validateExam(form) {
  if (!form.name.trim() || !form.startDate || !form.classIds.length) return 'Enter an exam name, start date and at least one class.'
  if (form.endDate && form.endDate < form.startDate) return 'End date must be on or after the start date.'
  if (!finiteNumber(form.maxMarks, 1, 1000)) return 'Maximum marks must be between 1 and 1000.'
  if (!finiteNumber(form.passMark, 0, Number(form.maxMarks))) return 'Pass mark must be between zero and maximum marks.'
  return ''
}
export function validateMarks(data, maximum) {
  if (!finiteNumber(maximum, 1, 1000)) return 'Maximum marks must be between 1 and 1000.'
  for (const [student, subjects] of Object.entries(data)) for (const [subject, value] of Object.entries(subjects)) {
    if (value === '' || value === null || value === undefined) continue
    if (!finiteNumber(value, 0, Number(maximum))) return `Student ${student}: ${subject} must be between 0 and ${maximum}. Blank means unmarked.`
  }
  return ''
}
export function validateGradeSchema(schema) {
  if (!schema.length) return 'Add at least one grade.'
  const ranges = [...schema].sort((a, b) => Number(a.minPct) - Number(b.minPct))
  const names = new Set()
  for (let i = 0; i < ranges.length; i++) {
    const row = ranges[i]
    if (!row.grade.trim() || names.has(row.grade.trim().toUpperCase())) return 'Grade names must be nonempty and unique.'
    names.add(row.grade.trim().toUpperCase())
    if (!finiteNumber(row.minPct, 0, 100) || !finiteNumber(row.maxPct, Number(row.minPct), 100)) return 'Grade ranges must be between 0 and 100.'
    if (!Number.isInteger(Number(row.minPct)) || !Number.isInteger(Number(row.maxPct))) return 'Use whole percentage boundaries. Results are rounded before grading.'
    if (i && Number(row.minPct) !== Number(ranges[i - 1].maxPct) + 1) return 'Grade ranges must be continuous and must not overlap.'
  }
  if (Number(ranges[0].minPct) !== 0 || Number(ranges.at(-1).maxPct) !== 100) return 'Grades must cover 0 through 100.'
  return ''
}
export function attendanceStats(record = {}, days, year, month) {
  let p = 0, a = 0, l = 0, h = 0, unmarked = 0
  const today = localDate()
  for (let day = 1; day <= days; day++) {
    if (year !== undefined && localDate(new Date(year, month, day)) > today) continue
    const status = record[day]
    if (status === 'P') p++; else if (status === 'A') a++; else if (status === 'L') l++; else if (status === 'H') h++; else unmarked++
  }
  const wd = p + a + l
  return { p, a, l, h, unmarked, wd, pct: wd ? Math.round((p + l) / wd * 100) : 0 }
}
export function eligibleFees(templates, student, year=academicBillingYears().active) {
  return templates.filter(f => f.status === 'active' && f.classStatuses?.[student.classId]?.[year]!=='inactive' && (f.classIds || []).some(id => String(id) === String(student.classId)))
}
export function normalizeBillingPeriod(value) {
  const date = /^\d{4}-\d{2}$/.test(value) ? new Date(`${value}-01T12:00:00`) : new Date(`1 ${value}`)
  return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
