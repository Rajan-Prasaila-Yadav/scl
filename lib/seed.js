import * as data from './academicData'
import { INITIAL_EXAMS, DEFAULT_GRADE_SCHEMA } from './examFixtures'
import { seedValue } from './storage'

export function seedDemoData() {
  const fixtures = { subjects: 'INITIAL_SUBJECTS', classes: 'INITIAL_CLASSES', students: 'INITIAL_STUDENTS', staff: 'INITIAL_STAFF', roles: 'INITIAL_ROLES', parents: 'INITIAL_PARENTS', timetable: 'INITIAL_TIMETABLE', events: 'INITIAL_EVENTS', periods: 'INITIAL_PERIODS', books: 'INITIAL_BOOKS', borrowings: 'INITIAL_BORROWINGS', vehicles: 'INITIAL_VEHICLES', routes: 'INITIAL_ROUTES', transportAssignments: 'INITIAL_TRANSPORT_ASSIGNMENTS' }
  Object.entries(fixtures).forEach(([key, fixture]) => seedValue(data.STORAGE_KEYS[key], data[fixture]))
  seedValue('educore.exams', INITIAL_EXAMS)
  seedValue('educore.gradeSchema', DEFAULT_GRADE_SCHEMA)
}
