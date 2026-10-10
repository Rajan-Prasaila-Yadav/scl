import { readList, readObject } from './storage.js'

export function deletionReason(kind, record) {
  const id = String(record.id)
  const list = key => readList('educore.' + key, [])
  const match = value => value !== undefined && String(value) === id
  if (kind === 'student') {
    if ((record.payments || []).length || (record.exams || []).length) return 'This student has payment or exam history. Mark the student inactive to preserve it.'
    if (list('parents').some(p => (p.studentIds || p.childrenIds || []).some(match)) || list('transport_assignments').some(a => match(a.studentId)) || list('borrowings').some(b => String(b.recipientType).toLowerCase() === 'student' && match(b.recipientId))) return 'Remove parent, transport and library links before deleting this student.'
    const attendance = readObject('educore.studentAttendance', {})
    if (Object.values(attendance).some(months => Object.values(months).some(people => Object.hasOwn(people, id)))) return 'This student has attendance history. Mark the student inactive instead.'
  }
  if (kind === 'staff') {
    if ((record.salaryHistory || []).length) return 'This staff member has payroll history. Mark the member inactive instead.'
    if (list('classes').some(c => match(c.classTeacherId)) || list('timetable').some(t => match(t.teacherId))) return 'Reassign class and timetable duties before deleting this staff member.'
  }
  if (kind === 'class' && (list('students').some(s => match(s.classId)) || list('timetable').some(t => match(t.classId)) || list('examRoutine').some(r => match(r.classId)))) return 'Move students and remove schedules before deleting this class.'
  if (kind === 'subject' && (list('classes').some(c => (c.subjectIds || []).some(match)) || list('timetable').some(t => match(t.subjectId)) || list('examRoutine').some(r => match(r.subjectId)))) return 'Remove class and schedule assignments before deleting this subject.'
  return ''
}
export function allowDeletion(kind, record) {
  const reason = deletionReason(kind, record)
  if (reason) { window.alert(reason); return false }
  return true
}
