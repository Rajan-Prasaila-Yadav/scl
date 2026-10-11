export function teachingMember(staff, id) {
  return staff.find(member => String(member.id) === String(id) && member.status === 'active' && (!member.userType || member.userType === 'teaching'))
}
export function subjectAssignmentError(form, subjectId, classes, staff, timetable, routines = []) {
  for (const classId of form.classIds) {
    const teacherId = form.teacherByClass?.[classId]
    if (teacherId && !teachingMember(staff,teacherId)) return 'Choose an active teaching staff member for each assigned teacher.'
  }
  if (!subjectId) return ''
  for (const cls of classes) {
    const linked = form.classIds.some(id=>String(id)===String(cls.id))
    const slots = timetable.filter(slot=>String(slot.subjectId)===String(subjectId) && String(slot.classId)===String(cls.id))
    const exams = routines.filter(slot=>String(slot.subjectId)===String(subjectId) && String(slot.classId)===String(cls.id))
    if ((!linked || form.status !== 'active') && (slots.length || exams.length)) return `Remove ${cls.name}'s timetable/exam sessions before unlinking or deactivating this subject.`
    if (slots.length && String(form.teacherByClass?.[cls.id] || '') !== String(cls.subjectTeacherMap?.[subjectId] || '')) return `Update or remove ${cls.name}'s scheduled sessions before changing its subject teacher.`
  }
  return ''
}
export function scheduleAssignmentError(form, classes, subjects, staff) {
  const cls = classes.find(c=>String(c.id)===String(form.classId) && c.status==='active')
  const subject = subjects.find(s=>String(s.id)===String(form.subjectId) && s.status==='active')
  if (!cls || !subject || !(cls.subjectIds || []).some(id=>String(id)===String(subject.id))) return 'Choose an active subject assigned to this active class.'
  if (!teachingMember(staff,form.teacherId)) return 'Choose an active teaching staff member.'
  const assigned = cls.subjectTeacherMap?.[subject.id]
  if (assigned && String(assigned)!==String(form.teacherId)) return 'This class subject has a different assigned teacher. Update the subject assignment first.'
  return ''
}
