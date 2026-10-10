const modules = { students:'Students', parents:'Parents', staff:'Staff', salary:'Fees', fees:'Fees', finance:'Fees', classes:'Classes', subjects:'Subjects', timetable:'Timetable', examinations:'Examinations', 'exam-routine':'Examinations', attendance:'Attendance', library:'Library', transport:'Transport', roles:'Roles', settings:'Settings', timeline:'Announcements' }
export function canPerform(action, moduleName) {
  if (typeof window === 'undefined') return false
  try {
    const user = localStorage.getItem('educore.currentUser') || 'Super Admin'
    if (user === 'Super Admin') return true
    const staff = JSON.parse(localStorage.getItem('educore.staff') || '[]')
    const roles = JSON.parse(localStorage.getItem('educore.roles') || '[]')
    const member = staff.find(s => String(s.id) === user)
    const role = roles.find(r => r.name === member?.role)
    const module = moduleName || modules[location.pathname.slice(1)]
    return role?.status === 'active' && (role.permissions?.[module] || []).includes(action)
  } catch { return false }
}
export function requirePermission(action, module) {
  if (canPerform(action, module)) return true
  window.alert(`The selected role cannot ${action} records in this module. Choose a role with this permission.`)
  return false
}
