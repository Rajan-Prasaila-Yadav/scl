export const DEFAULT_GRADE_SCHEMA = [
  { grade: 'A+', minPct: 91, maxPct: 100, pass: true, color: '#22c55e', bg: 'var(--greenbg)' },
  { grade: 'A', minPct: 81, maxPct: 90, pass: true, color: '#10b981', bg: 'var(--greenbg)' },
  { grade: 'B+', minPct: 71, maxPct: 80, pass: true, color: '#3b82f6', bg: 'var(--bluebg)' },
  { grade: 'B', minPct: 61, maxPct: 70, pass: true, color: '#6366f1', bg: 'var(--bluebg)' },
  { grade: 'C', minPct: 51, maxPct: 60, pass: true, color: 'var(--amber)', bg: 'var(--amberbg)' },
  { grade: 'D', minPct: 40, maxPct: 50, pass: true, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  { grade: 'F', minPct: 0, maxPct: 39, pass: false, color: 'var(--red)', bg: 'var(--redbg)' },
]

// ─── INITIAL EXAMS ─────────────────────────────────────────────────────────────
// Exam schedules — separate from student marks
export const INITIAL_EXAMS = [
  {
    id: 1,
    name: 'Mid-Term Evaluation',
    academicYear: '2026–2027',
    classIds: [1, 2, 3],
    startDate: '2026-03-10',
    endDate: '2026-03-20',
    maxMarks: 100,
    passMark: 40,
    status: 'completed',
    description: 'Mid-academic year term evaluation covering all core subjects.',
    conductedBy: 'Super Admin',
    createdAt: '2026-02-15',
  },
  {
    id: 2,
    name: 'Final Term Examination',
    academicYear: '2026–2027',
    classIds: [1, 2, 3],
    startDate: '2026-06-28',
    endDate: '2026-07-10',
    maxMarks: 100,
    passMark: 40,
    status: 'upcoming',
    description: 'End-of-year comprehensive final exam for all grades.',
    conductedBy: 'Super Admin',
    createdAt: '2026-06-01',
  },
  {
    id: 3,
    name: 'Unit Test – Science & Math',
    academicYear: '2026–2027',
    classIds: [1],
    startDate: '2026-05-05',
    endDate: '2026-05-07',
    maxMarks: 50,
    passMark: 20,
    status: 'completed',
    description: 'Class-level unit test focused on Science and Mathematics.',
    conductedBy: 'Aditi Verma',
    createdAt: '2026-04-20',
  },
]

