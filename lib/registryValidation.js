import { finiteNumber, localDate } from './validation.js'

export function validateBirthDate(value, today = localDate()) {
  if (!value) return ''
  const parsed = new Date(`${value}T12:00:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || localDate(parsed) !== value) return 'Enter a valid date of birth.'
  return value > today ? 'Date of birth cannot be in the future.' : ''
}
export function validateStudentPlacement(form, students, classes, editingId) {
  const target = classes.find(c => String(c.id) === String(form.classId))
  if (!target) return 'Choose an existing class.'
  if (!finiteNumber(form.rollNo, 1) || !Number.isInteger(Number(form.rollNo))) return 'Roll number must be a positive whole number.'
  const peers = students.filter(s => String(s.id) !== String(editingId) && String(s.classId) === String(form.classId))
  if (peers.some(s => Number(s.rollNo) === Number(form.rollNo))) return 'That roll number is already used in this class.'
  if (form.status === 'active' && Number(target.capacity) > 0 && peers.filter(s => s.status === 'active').length >= Number(target.capacity)) return 'This class is full. Increase its capacity or choose another class.'
  return validateBirthDate(form.dob)
}
export function validateClassCapacity(value, enrolled) {
  if (!finiteNumber(value, 1) || !Number.isInteger(Number(value))) return 'Capacity must be a positive whole number.'
  return Number(value) < enrolled ? `Capacity cannot be below the ${enrolled} active students already enrolled.` : ''
}
