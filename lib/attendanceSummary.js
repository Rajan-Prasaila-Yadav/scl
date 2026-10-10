import { attendanceStats } from './validation.js'

export function studentAttendanceSummary(student, data, date = new Date()) {
  const year = date.getFullYear(), month = date.getMonth()
  const record = data[String(student.classId)]?.[`${year}-${month}`]?.[student.id] || {}
  const stats = attendanceStats(record, new Date(year, month + 1, 0).getDate(), year, month)
  return {
    totalDays:stats.wd, presentDays:stats.p + stats.l, absentDays:stats.a,
    rate:stats.pct, status:stats.wd ? 'Recorded attendance' : 'No attendance recorded',
    color:'var(--blue)', bg:'var(--bluebg)',
    period:date.toLocaleDateString('en', {month:'long',year:'numeric'})
  }
}
