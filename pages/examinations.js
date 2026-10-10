import { getRaw } from '../lib/storage'
import { writePrintDocument } from '../lib/printDocument'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import { DEFAULT_GRADE_SCHEMA, INITIAL_EXAMS } from '../lib/examFixtures'
import { validateExam, validateMarks, validateGradeSchema } from '../lib/validation'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STAFF,
  readStoredList,
  writeStoredList,
  makeId,
} from '../lib/academicData'

// ─── DEFAULT GRADE SCHEMA ─────────────────────────────────────────────────────
const emptyExamForm = {
  name: '',
  academicYear: '2026–2027',
  classIds: [],
  startDate: '',
  endDate: '',
  maxMarks: 100,
  passMark: 40,
  description: '',
  conductedBy: 'Super Admin',
  status: 'upcoming',
}

export default function Examinations() {
  // ── Data ──────────────────────────────────────────────────────────────────
  const [exams, setExams] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [staff, setStaff] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState(null)
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [gradeSchema, setGradeSchema] = useState([])

  // ── UI states ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('exams') // 'exams' | 'marks' | 'reports' | 'grading'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')

  // ── Exam form ─────────────────────────────────────────────────────────────
  const [showExamModal, setShowExamModal] = useState(false)
  const [examForm, setExamForm] = useState(emptyExamForm)
  const [editingExamId, setEditingExamId] = useState(null)

  // ── Marks Entry ───────────────────────────────────────────────────────────
  const [selectedExamId, setSelectedExamId] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [marksData, setMarksData] = useState({}) // { studentId: { subjectName: marksObtained } }
  const [marksMaxOverride, setMarksMaxOverride] = useState(100)
  const [marksRemarks, setMarksRemarks] = useState({}) // { studentId: string }

  // ── Report Card ───────────────────────────────────────────────────────────
  const [reportStudent, setReportStudent] = useState(null)
  const [reportExamId, setReportExamId] = useState(null)

  // ── Analytics Table states ────────────────────────────────────────────────
  const [reportSearch, setReportSearch] = useState('')
  const [sortField, setSortField] = useState('pct')
  const [sortOrder, setSortOrder] = useState('desc')
  const [reportFilterMode, setReportFilterMode] = useState('all') // 'all' | 'pass' | 'fail'

  // ── Dynamic Grade Helpers ─────────────────────────────────────────────────
  const calcGrade = (obtained, max) => {
    if (obtained === null || obtained === undefined || obtained === '' || !max) return '—'
    const pct = Math.round((obtained / max) * 100)
    const match = gradeSchema.find(s => pct >= s.minPct && pct <= s.maxPct)
    return match ? match.grade : 'F'
  }

  const gradeColor = (grade) => {
    if (!grade || grade === '—') return 'var(--t3)'
    const match = gradeSchema.find(s => s.grade === grade)
    return match ? match.color : 'var(--t3)'
  }

  const gradeBg = (grade) => {
    if (!grade || grade === '—') return 'var(--bg3)'
    const match = gradeSchema.find(s => s.grade === grade)
    return match ? match.bg : 'var(--bg3)'
  }

  const getPassFail = (obtained, max, exam = exams.find(e => e.id === selectedExamId)) => {
    if (obtained === null || obtained === undefined || obtained === '' || !max) return 'Unmarked'
    const threshold = exam ? Number(exam.passMark) / Number(exam.maxMarks) : 0.4
    return Number(obtained) / Number(max) >= threshold ? 'Pass' : 'Fail'
  }

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const renderSortIcon = (field) => {
    if (sortField !== field) return <i className="fa-solid fa-sort" style={{ marginLeft: 6, opacity: 0.35, fontSize: 10 }}></i>
    return sortOrder === 'asc' 
      ? <i className="fa-solid fa-sort-up" style={{ marginLeft: 6, color: 'var(--accent)', fontSize: 10 }}></i>
      : <i className="fa-solid fa-sort-down" style={{ marginLeft: 6, color: 'var(--accent)', fontSize: 10 }}></i>
  }

  // ── Hydration ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setExams(readStoredList('educore.exams', INITIAL_EXAMS))
    setStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    setSubjects(readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS))
    setStaff(readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF))
    setGradeSchema(readStoredList('educore.gradeSchema', DEFAULT_GRADE_SCHEMA))
    setCurrentUser(getRaw('educore.currentUser') || 'Super Admin')
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.exams', exams)
  }, [exams, hydrated])

  // Save marks back into students
  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.students, students)
  }, [students, hydrated])

  useEffect(() => {
    if (!hydrated) return
    if (!validateGradeSchema(gradeSchema)) writeStoredList('educore.gradeSchema', gradeSchema)
  }, [gradeSchema, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getClassName = (id) => {
    const c = classes.find(c => String(c.id) === String(id))
    return c ? `${c.name}${c.section ? ` - ${c.section}` : ''}` : 'Unknown'
  }

  const getExam = (id) => exams.find(e => e.id === id) || null

  const getStudentExam = (student, examId) =>
    (student.exams || []).find(e => e.examId === examId || e.id === examId) || null

  // ── Filtered exams list ───────────────────────────────────────────────────
  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase()
    return exams.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (classFilter !== 'all' && !e.classIds.includes(Number(classFilter))) return false
      if (q && !e.name.toLowerCase().includes(q) && !(e.description || '').toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  }, [exams, search, statusFilter, classFilter])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = exams.length
    const completed = exams.filter(e => e.status === 'completed').length
    const upcoming = exams.filter(e => e.status === 'upcoming').length
    const ongoing = exams.filter(e => e.status === 'ongoing').length
    return { total, completed, upcoming, ongoing }
  }, [exams])

  // ── Exam form handlers ────────────────────────────────────────────────────
  const openAddExam = () => {
    setExamForm({ ...emptyExamForm, conductedBy: currentUser === 'Super Admin' ? 'Super Admin' : (staff.find(s => String(s.id) === currentUser)?.name || 'Super Admin') })
    setEditingExamId(null)
    setShowExamModal(true)
  }

  const openEditExam = (exam) => {
    setExamForm({
      name: exam.name,
      academicYear: exam.academicYear || '2026–2027',
      classIds: exam.classIds || [],
      startDate: exam.startDate,
      endDate: exam.endDate,
      maxMarks: exam.maxMarks || 100,
      passMark: exam.passMark || 40,
      description: exam.description || '',
      conductedBy: exam.conductedBy || 'Super Admin',
      status: exam.status || 'upcoming',
    })
    setEditingExamId(exam.id)
    setShowExamModal(true)
  }

  const saveExam = (e) => {
    e?.preventDefault?.(); if (!requirePermission(editingExamId ? 'edit' : 'create')) return

    e.preventDefault()
    const validation = validateExam(examForm)
    if (validation) { showToast(validation, 'error'); return }
    if (!examForm.name.trim()) { showToast('Exam name is required', 'error'); return }
    if (!examForm.startDate) { showToast('Start date is required', 'error'); return }
    if (examForm.classIds.length === 0) { showToast('Select at least one class', 'error'); return }

    const payload = {
      name: examForm.name.trim(),
      academicYear: examForm.academicYear,
      classIds: examForm.classIds.map(Number),
      startDate: examForm.startDate,
      endDate: examForm.endDate,
      maxMarks: Number(examForm.maxMarks) || 100,
      passMark: Number(examForm.passMark),
      description: examForm.description.trim(),
      conductedBy: examForm.conductedBy,
      status: examForm.status,
    }

    if (editingExamId) {
      setExams(prev => prev.map(ex => ex.id === editingExamId ? { ...ex, ...payload } : ex))
      showToast('Exam updated successfully')
    } else {
      const id = makeId()
      setExams(prev => [...prev, { id, createdAt: new Date().toISOString().split('T')[0], ...payload }])
      showToast('Exam scheduled successfully')
    }
    setShowExamModal(false)
  }

  const deleteExam = (examId) => {
    if (!requirePermission('delete')) return

    if (!confirm('Delete this exam? All associated marks will remain in student records.')) return
    setExams(prev => prev.filter(e => e.id !== examId))
    showToast('Exam deleted', 'info')
  }

  // ── Marks entry ───────────────────────────────────────────────────────────
  const selectedExam = getExam(selectedExamId)

  const classStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students.filter(s => String(s.classId) === String(selectedClassId))
  }, [students, selectedClassId])

  // Get subjects for selected class
  const classSubjects = useMemo(() => {
    if (!selectedClassId || !selectedExam) return []
    const cls = classes.find(c => String(c.id) === String(selectedClassId))
    if (cls && cls.subjectIds && cls.subjectIds.length > 0) {
      return subjects.filter(s => cls.subjectIds.includes(s.id) && s.status === 'active')
    }
    return subjects.filter(s => s.status === 'active').slice(0, 5)
  }, [selectedClassId, classes, subjects, selectedExam])

  // Load existing marks when exam/class changes
  useEffect(() => {
    if (!selectedExamId || !selectedClassId) return
    const newMarks = {}
    const newRemarks = {}
    classStudents.forEach(stu => {
      const examEntry = (stu.exams || []).find(e => e.examId === selectedExamId || e.id === selectedExamId)
      newRemarks[stu.id] = examEntry?.remarks || ''
      const subMap = {}
      classSubjects.forEach(sub => {
        const found = examEntry?.subjects?.find(s => s.subjectName === sub.name)
        subMap[sub.name] = found ? found.marksObtained : ''
      })
      newMarks[stu.id] = subMap
    })
    setMarksData(newMarks)
    setMarksRemarks(newRemarks)
    if (selectedExam) setMarksMaxOverride(selectedExam.maxMarks || 100)
  }, [selectedExamId, selectedClassId, classStudents.length, classSubjects.length])

  const updateMark = (studentId, subjectName, val) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [subjectName]: val }
    }))
  }

  const saveMarks = () => {
    if (!requirePermission('edit')) return

    if (!selectedExamId || !selectedClassId) return
    const error = validateMarks(marksData, marksMaxOverride)
    if (error) { showToast(error, 'error'); return }
    const exam = getExam(selectedExamId)
    if (!exam) return

    setStudents(prev => prev.map(stu => {
      if (String(stu.classId) !== String(selectedClassId)) return stu
      const stuMarks = marksData[stu.id] || {}
      const subjectEntries = classSubjects.map(sub => {
        const raw = stuMarks[sub.name]
        const obtained = raw === '' || raw === undefined || raw === null ? null : Number(raw)
        return {
          subjectName: sub.name,
          marksObtained: obtained,
          maxMarks: marksMaxOverride,
          grade: calcGrade(obtained, marksMaxOverride)
        }
      })

      const existing = (stu.exams || []).filter(e => e.examId !== selectedExamId && e.id !== selectedExamId)
      const newEntry = {
        id: makeId(),
        examId: selectedExamId,
        examName: exam.name,
        year: new Date().getFullYear().toString(),
        date: exam.startDate,
        subjects: subjectEntries,
        remarks: marksRemarks[stu.id] || ''
      }

      return { ...stu, exams: [...existing, newEntry] }
    }))

    showToast(`Marks saved for ${classStudents.length} students`)
  }

  // ── Report Card print ─────────────────────────────────────────────────────
  const printReportCard = (student, examId) => {
    const exam = getExam(examId)
    const examEntry = (student.exams || []).find(e => e.examId === examId || e.id === examId)
    if (!examEntry) { showToast('No marks found for this student/exam', 'error'); return }

    const cls = classes.find(c => String(c.id) === String(student.classId))
    const className = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'N/A'
    const maxM = examEntry.subjects[0]?.maxMarks || exam?.maxMarks || 100
    const totalObtained = examEntry.subjects.reduce((a, s) => a + (s.marksObtained || 0), 0)
    const totalMax = examEntry.subjects.length * maxM
    const pct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0'
    const overallGrade = calcGrade(totalObtained, totalMax)
    const anyFail = examEntry.subjects.some(s => getPassFail(s.marksObtained, s.maxMarks || maxM, exam) === 'Fail')
    const result = examEntry.subjects.some(s => s.marksObtained == null) ? 'INCOMPLETE' : anyFail ? 'FAIL' : 'PASS'
    const resultColor = anyFail ? '#ef4444' : '#22c55e'

    const rows = examEntry.subjects.map(s => `
      <tr>
        <td>${s.subjectName}</td>
        <td style="text-align:center">${s.maxMarks || maxM}</td>
        <td style="text-align:center;font-weight:bold;">${s.marksObtained ?? '—'}</td>
        <td style="text-align:center;color:${gradeColor(calcGrade(s.marksObtained, s.maxMarks || maxM))};font-weight:bold;">${calcGrade(s.marksObtained, s.maxMarks || maxM)}</td>
        <td style="text-align:center;color:${getPassFail(s.marksObtained, s.maxMarks || maxM, exam) === 'Pass' ? '#22c55e' : '#ef4444'};font-weight:600;">${getPassFail(s.marksObtained, s.maxMarks || maxM, exam) || '—'}</td>
      </tr>
    `).join('')

    const win = window.open('', '_blank')
    if (!win) return
    writePrintDocument(win, `<!DOCTYPE html><html><head><title>Report Card – ${student.name}</title>
    <style>
      @media print { @page { size: A4; margin: 18mm; } body { margin: 0; } .no-print { display: none !important; } }
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; margin: 0; padding: 28px; }
      .report-card { max-width: 700px; margin: 0 auto; border: 2px solid #3b82f6; border-radius: 12px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #fff; padding: 24px 28px; text-align: center; }
      .school-name { font-size: 22px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; }
      .school-sub { font-size: 12px; opacity: 0.85; margin-bottom: 14px; }
      .exam-title { background: rgba(255,255,255,0.18); border-radius: 20px; display: inline-block; padding: 6px 22px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
      .student-info { padding: 18px 28px; background: #f8faff; border-bottom: 1px solid #e5e7eb; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
      .info-item label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; display: block; margin-bottom: 3px; }
      .info-item span { font-size: 13px; font-weight: 700; color: #1e3a8a; }
      .marks-section { padding: 18px 28px; }
      h3 { font-size: 13px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 0 0 12px 0; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #1e3a8a; color: #fff; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
      tr:nth-child(even) td { background: #f8faff; }
      .total-row td { font-weight: 800; background: #eff6ff !important; color: #1e3a8a; border-top: 2px solid #3b82f6; }
      .result-section { padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; background: #f8faff; border-top: 1px solid #e5e7eb; }
      .result-badge { padding: 10px 28px; border-radius: 50px; font-size: 18px; font-weight: 900; letter-spacing: 1px; color: #fff; background: ${resultColor}; }
      .grade-badge { padding: 10px 24px; border-radius: 50px; font-size: 18px; font-weight: 900; background: ${gradeBg(overallGrade)}; color: ${gradeColor(overallGrade)}; border: 2px solid ${gradeColor(overallGrade)}; }
      .remarks-section { padding: 14px 28px; border-top: 1px solid #e5e7eb; }
      .footer { padding: 14px 28px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; background: #f8faff; }
      .sig-line { border-top: 1px solid #999; padding-top: 6px; font-size: 11px; color: #6b7280; text-align: center; min-width: 120px; }
      .print-btn { position: fixed; bottom: 24px; right: 24px; background: #3b82f6; color: #fff; border: none; border-radius: 10px; padding: 14px 28px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 16px rgba(59,130,246,0.4); }
    </style></head><body>
    <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>
    <div class="report-card">
      <div class="header">
        <div class="school-name">🏫 Sunrise Public School</div>
        <div class="school-sub">Excellence in Education, Values for Life • SPS-DEL-01 • CBSE</div>
        <div class="exam-title">📋 ${examEntry.examName || exam?.name || 'Report Card'}</div>
      </div>

      <div class="student-info">
        <div class="info-item"><label>Student Name</label><span>${student.name}</span></div>
        <div class="info-item"><label>Admission No.</label><span>${student.admissionNo || 'N/A'}</span></div>
        <div class="info-item"><label>Roll No.</label><span>${student.rollNo || 'N/A'}</span></div>
        <div class="info-item"><label>Class / Section</label><span>${className}</span></div>
        <div class="info-item"><label>Academic Year</label><span>${exam?.academicYear || '2026–2027'}</span></div>
        <div class="info-item"><label>Exam Period</label><span>${exam?.startDate || examEntry.date} ${exam?.endDate ? '– ' + exam.endDate : ''}</span></div>
      </div>

      <div class="marks-section">
        <h3>Subject-Wise Marks</h3>
        <table>
          <thead><tr><th>Subject</th><th style="text-align:center">Max Marks</th><th style="text-align:center">Marks Obtained</th><th style="text-align:center">Grade</th><th style="text-align:center">Result</th></tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td>TOTAL</td>
              <td style="text-align:center">${totalMax}</td>
              <td style="text-align:center">${totalObtained} (${pct}%)</td>
              <td style="text-align:center;color:${gradeColor(overallGrade)}">${overallGrade}</td>
              <td style="text-align:center;color:${resultColor}">${result}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="result-section">
        <div>
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;margin-bottom:6px;">Overall Result</div>
          <span class="result-badge">${result}</span>
        </div>
        <div style="text-align:center">
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;margin-bottom:6px;">Overall Grade</div>
          <span class="grade-badge">${overallGrade}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;margin-bottom:6px;">Percentage</div>
          <div style="font-size:28px;font-weight:900;color:#1e3a8a">${pct}%</div>
        </div>
      </div>

      ${examEntry.remarks ? `<div class="remarks-section"><label style="font-size:11px;text-transform:uppercase;color:#6b7280;font-weight:600;">Teacher's Remarks</label><p style="margin:6px 0 0;font-size:13px;color:#374151;font-style:italic;">"${examEntry.remarks}"</p></div>` : ''}

      <div class="footer">
        <div class="sig-line">Class Teacher</div>
        <div style="text-align:center;font-size:11px;color:#9ca3af">Printed: ${new Date().toLocaleDateString('en-IN')}</div>
        <div class="sig-line">Principal</div>
      </div>
    </div>
    </body></html>`)
    win.document.close()
    win.focus()
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  const analyticsExam = useMemo(() => {
    if (!selectedExamId) return null
    return getExam(selectedExamId)
  }, [selectedExamId, exams])

  const analyticsData = useMemo(() => {
    if (!selectedExamId) return []
    return students.map(stu => {
      const entry = (stu.exams || []).find(e => e.examId === selectedExamId || e.id === selectedExamId)
      if (!entry) return null
      const totalObtained = entry.subjects.reduce((a, s) => a + (s.marksObtained || 0), 0)
      const totalMax = entry.subjects.reduce((a, s) => a + (s.maxMarks || 100), 0)
      const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
      const grade = calcGrade(totalObtained, totalMax)
      const pass = entry.subjects.some(s => s.marksObtained === null || s.marksObtained === undefined) ? null : !entry.subjects.some(s => getPassFail(s.marksObtained, s.maxMarks || 100) === 'Fail')
      return { student: stu, entry, totalObtained, totalMax, pct, grade, pass }
    }).filter(Boolean)
  }, [selectedExamId, students, gradeSchema])

  const classStats = useMemo(() => {
    const classData = classFilter === 'all' 
      ? analyticsData 
      : analyticsData.filter(a => String(a.student.classId) === String(classFilter))
      
    const total = classData.length
    const passed = classData.filter(a => a.pass).length
    const failed = classData.filter(a => a.pass === false).length
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
    const avgPct = total > 0 ? (classData.reduce((a, b) => a + b.pct, 0) / total).toFixed(1) : '0.0'
    
    return { total, passed, failed, passRate, avgPct }
  }, [analyticsData, classFilter])

  const classFilteredAnalytics = useMemo(() => {
    let data = analyticsData
    if (classFilter !== 'all') {
      data = data.filter(a => String(a.student.classId) === String(classFilter))
    }
    
    if (reportFilterMode === 'pass') {
      data = data.filter(a => a.pass)
    } else if (reportFilterMode === 'fail') {
      data = data.filter(a => !a.pass)
    }
    
    const query = reportSearch.trim().toLowerCase()
    if (query) {
      data = data.filter(a => 
        a.student.name.toLowerCase().includes(query) || 
        (a.student.admissionNo || '').toLowerCase().includes(query)
      )
    }
    
    return data.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.student.name.localeCompare(b.student.name)
      } else if (sortField === 'marks') {
        comparison = a.totalObtained - b.totalObtained
      } else if (sortField === 'pct') {
        comparison = a.pct - b.pct
      } else if (sortField === 'grade') {
        comparison = a.grade.localeCompare(b.grade)
      } else if (sortField === 'pass') {
        comparison = (a.pass ? 1 : 0) - (b.pass ? 1 : 0)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [analyticsData, classFilter, reportFilterMode, reportSearch, sortField, sortOrder])

  const gradeDistribution = useMemo(() => {
    const dist = {}
    gradeSchema.forEach(s => { dist[s.grade] = 0 })
    
    const classData = classFilter === 'all' 
      ? analyticsData 
      : analyticsData.filter(a => String(a.student.classId) === String(classFilter))
      
    classData.forEach(a => {
      if (dist[a.grade] !== undefined) {
        dist[a.grade]++
      } else {
        dist[a.grade] = 1
      }
    })
    return dist
  }, [analyticsData, classFilter, gradeSchema])

  const topStudents = useMemo(() => {
    const classData = classFilter === 'all' 
      ? analyticsData 
      : analyticsData.filter(a => String(a.student.classId) === String(classFilter))
    return [...classData].sort((a, b) => b.pct - a.pct).slice(0, 5)
  }, [analyticsData, classFilter])

  const subjectAnalytics = useMemo(() => {
    const classData = classFilter === 'all' 
      ? analyticsData 
      : analyticsData.filter(a => String(a.student.classId) === String(classFilter))
      
    if (classData.length === 0) return []
    
    const subStatsMap = {}
    classData.forEach(a => {
      a.entry.subjects.forEach(sub => {
        if (!subStatsMap[sub.subjectName]) {
          subStatsMap[sub.subjectName] = {
            name: sub.subjectName,
            marks: [],
            maxMarks: sub.maxMarks || 100
          }
        }
        subStatsMap[sub.subjectName].marks.push(sub.marksObtained)
      })
    })
    
    return Object.values(subStatsMap).map(s => {
      const totalMarks = s.marks.reduce((a, m) => a + m, 0)
      const count = s.marks.length
      const avg = count > 0 ? (totalMarks / count).toFixed(1) : 0
      const highest = count > 0 ? Math.max(...s.marks) : 0
      const passedCount = s.marks.filter(m => getPassFail(m, s.maxMarks) === 'Pass').length
      const passRate = count > 0 ? Math.round((passedCount / count) * 100) : 0
      
      return {
        name: s.name,
        avg,
        avgPct: s.maxMarks > 0 ? Math.round((avg / s.maxMarks) * 100) : 0,
        highest,
        maxMarks: s.maxMarks,
        passRate
      }
    })
  }, [analyticsData, classFilter, gradeSchema])

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {activeTab === 'grading' && validateGradeSchema(gradeSchema) && <p role="alert" className="validation-error">{validateGradeSchema(gradeSchema)} These edits are not saved until the ranges are valid.</p>}
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
            Examinations &amp; Report Cards
          </h1>
          <p>Schedule exams, enter subject-wise marks, generate analytics, and print official report cards.</p>
        </div>
        <div className="settings-actions">
          {activeTab === 'exams' && (
            <button className="btn btn-primary" onClick={openAddExam}>
              <i className="fa-solid fa-plus"></i> Schedule Exam
            </button>
          )}
          {activeTab === 'marks' && selectedExamId && selectedClassId && (
            <button className="btn btn-primary" onClick={saveMarks}>
              <i className="fa-solid fa-floppy-disk"></i> Save All Marks
            </button>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        {[
          { label: 'Total Exams', val: stats.total, icon: 'fa-file-pen', col: 'var(--blue)', bg: 'var(--bluebg)' },
          { label: 'Completed', val: stats.completed, icon: 'fa-circle-check', col: 'var(--green)', bg: 'var(--greenbg)' },
          { label: 'Upcoming', val: stats.upcoming, icon: 'fa-clock', col: 'var(--amber)', bg: 'var(--amberbg)' },
          { label: 'Ongoing', val: stats.ongoing, icon: 'fa-spinner', col: 'var(--purple)', bg: 'var(--purplebg)' },
        ].map(({ label, val, icon, col, bg }) => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, color: col, display: 'grid', placeItems: 'center', fontSize: 18 }}>
              <i className={`fa-solid ${icon}`}></i>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--t1)' }}>{val}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="tabs-nav" style={{ marginBottom: 20 }}>
        <button className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>
          <i className="fa-solid fa-list-check"></i> Exam Schedule
        </button>
        <button className={activeTab === 'marks' ? 'active' : ''} onClick={() => setActiveTab('marks')}>
          <i className="fa-solid fa-pen-to-square"></i> Marks Entry
        </button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
          <i className="fa-solid fa-chart-bar"></i> Analytics &amp; Reports
        </button>
        <button className={activeTab === 'grading' ? 'active' : ''} onClick={() => setActiveTab('grading')}>
          <i className="fa-solid fa-sliders"></i> Grading Settings
        </button>
      </div>

      {/* ── TAB: EXAM SCHEDULE ──────────────────────────────────────────── */}
      {activeTab === 'exams' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="roles-toolbar academic-toolbar">
            <div className="roles-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Search exam name..." placeholder="Search exam name..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}><i className="fa-solid fa-xmark"></i></button>}
            </div>
            <select aria-label="Status Filter" className="roles-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
            <select aria-label="Class Filter" className="roles-filter" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
          </div>

          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Classes</th>
                  <th>Date Range</th>
                  <th>Max Marks</th>
                  <th>Pass Mark</th>
                  <th>Conducted By</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.length === 0 ? (
                  <tr><td colSpan={8} className="roles-empty">No exams found</td></tr>
                ) : filteredExams.map(ex => (
                  <tr key={ex.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{ex.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{ex.academicYear || '—'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(ex.classIds || []).map(cid => (
                          <span key={cid} className="badge badge-blue" style={{ fontSize: 10 }}>{getClassName(cid)}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div>{ex.startDate}</div>
                      {ex.endDate && <div style={{ color: 'var(--t3)' }}>to {ex.endDate}</div>}
                    </td>
                    <td><strong>{ex.maxMarks}</strong></td>
                    <td><strong>{ex.passMark}</strong></td>
                    <td style={{ fontSize: 12 }}>{ex.conductedBy}</td>
                    <td>
                      <span className={`badge ${ex.status === 'completed' ? 'badge-active' : ex.status === 'ongoing' ? 'badge-pending' : 'badge-gray'}`}>
                        {ex.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <div className="roles-actions">
                        <button aria-label="Enter Marks" className="btn-icon-sm" title="Enter Marks" onClick={() => { setSelectedExamId(ex.id); setSelectedClassId(ex.classIds[0] ? String(ex.classIds[0]) : ''); setActiveTab('marks') }}>
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button aria-label="View Analytics" className="btn-icon-sm" title="View Analytics" onClick={() => { setSelectedExamId(ex.id); setClassFilter('all'); setActiveTab('reports') }}>
                          <i className="fa-solid fa-chart-bar"></i>
                        </button>
                        <button aria-label="Edit" className="btn-icon-sm" title="Edit" onClick={() => openEditExam(ex)}>
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button aria-label="Delete" className="btn-icon-sm danger" title="Delete" onClick={() => deleteExam(ex.id)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: MARKS ENTRY ────────────────────────────────────────────── */}
      {activeTab === 'marks' && (
        <div>
          {/* Selectors */}
          <div className="roles-table-card academic-list-card" style={{ padding: '16px 20px', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6 }}>Select Exam</label>
                <select aria-label="Select Exam" className="form-select" value={selectedExamId || ''} onChange={e => setSelectedExamId(Number(e.target.value) || null)}>
                  <option value="">— Choose Exam —</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6 }}>Select Class</label>
                <select aria-label="Select Class" className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                  <option value="">— Choose Class —</option>
                  {(selectedExam ? classes.filter(c => selectedExam.classIds.includes(c.id)) : classes).map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6 }}>Max Marks Per Subject</label>
                <input aria-label="Max Marks Per Subject" className="form-input" type="number" min={1} max={500} value={marksMaxOverride} onChange={e => setMarksMaxOverride(Number(e.target.value) || 100)} />
              </div>
            </div>
          </div>

          {!selectedExamId || !selectedClassId ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-pen-to-square" style={{ fontSize: 36, display: 'block', marginBottom: 16 }}></i>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t2)' }}>Select an Exam and Class to enter marks</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>You can enter subject-wise marks for each student below.</div>
            </div>
          ) : classStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)' }}>No students enrolled in this class.</div>
          ) : (
            <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--accent)' }}></i>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedExam?.name} — {getClassName(selectedClassId)}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>Max marks: {marksMaxOverride} • Pass mark: {selectedExam?.passMark || 40} • {classStudents.length} students</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 150 }}>Student</th>
                      {classSubjects.map(sub => <th key={sub.id} style={{ minWidth: 110, textAlign: 'center' }}>{sub.name}</th>)}
                      <th style={{ minWidth: 80, textAlign: 'center' }}>Total</th>
                      <th style={{ minWidth: 60, textAlign: 'center' }}>Grade</th>
                      <th style={{ minWidth: 60, textAlign: 'center' }}>Result</th>
                      <th style={{ minWidth: 160 }}>Remarks</th>
                      <th style={{ minWidth: 80, textAlign: 'center' }}>Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map(stu => {
                      const stuMarks = marksData[stu.id] || {}
                      const vals = classSubjects.map(sub => {
                        const v = stuMarks[sub.name]
                        return v === '' || v === undefined ? null : Number(v)
                      })
                      const totalObtained = vals.filter(v => v !== null).reduce((a, b) => a + b, 0)
                      const totalMax = vals.filter(v => v !== null).length * marksMaxOverride
                      const grade = totalMax > 0 ? calcGrade(totalObtained, totalMax) : '—'
                      const pass = vals.some(v => v === null) ? null : totalMax > 0 ? !vals.some(v => v !== null && getPassFail(v, marksMaxOverride) === 'Fail') : null
                      const hasEntry = (stu.exams || []).some(e => e.examId === selectedExamId || e.id === selectedExamId)

                      return (
                        <tr key={stu.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{stu.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{stu.admissionNo} • Roll {stu.rollNo}</div>
                          </td>
                          {classSubjects.map(sub => (
                            <td key={sub.id} style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                aria-label={`${stu.name}: ${sub.name} marks`}
                                min={0}
                                max={marksMaxOverride}
                                value={stuMarks[sub.name] ?? ''}
                                onChange={e => updateMark(stu.id, sub.name, e.target.value)}
                                style={{ width: 70, textAlign: 'center', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg3)', color: 'var(--t1)', fontSize: 13 }}
                                placeholder="—"
                              />
                            </td>
                          ))}
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{totalMax > 0 ? `${totalObtained}/${totalMax}` : '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 800, color: gradeColor(grade), background: gradeBg(grade), padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{grade}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {pass !== null && (
                              <span style={{ fontWeight: 700, fontSize: 11, color: pass ? 'var(--green)' : 'var(--red)' }}>
                                {pass === null ? 'Incomplete' : pass ? '✓ Pass' : '✗ Fail'}
                              </span>
                            )}
                          </td>
                          <td>
                            <input aria-label="Teacher's remarks..."
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: 12, textTransform: 'none' }}
                              placeholder="Teacher's remarks..."
                              value={marksRemarks[stu.id] || ''}
                              onChange={e => setMarksRemarks(prev => ({ ...prev, [stu.id]: e.target.value }))}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {hasEntry && (
                              <button aria-label="Print Report Card"
                                className="btn-icon-sm"
                                title="Print Report Card"
                                onClick={() => printReportCard(stu, selectedExamId)}
                                style={{ color: 'var(--accent)' }}
                              >
                                <i className="fa-solid fa-print"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={saveMarks}>
                  <i className="fa-solid fa-floppy-disk"></i> Save All Marks
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: ANALYTICS & REPORTS ────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div>
          {/* Selectors */}
          <div className="roles-table-card academic-list-card" style={{ padding: '16px 20px', marginBottom: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6 }}>Exam</label>
                <select aria-label="Exam" className="form-select" value={selectedExamId || ''} onChange={e => setSelectedExamId(Number(e.target.value) || null)}>
                  <option value="">— Choose Exam —</option>
                  {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6 }}>Filter by Class</label>
                <select aria-label="Filter by Class" className="form-select" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                  <option value="all">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                </select>
              </div>
            </div>
          </div>

          {!selectedExamId ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-chart-bar" style={{ fontSize: 36, display: 'block', marginBottom: 16 }}></i>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t2)' }}>Select an Exam to view Analytics</div>
            </div>
          ) : classFilteredAnalytics.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-inbox" style={{ fontSize: 32, display: 'block', marginBottom: 12 }}></i>
              No marks have been entered for this exam/class yet. Go to Marks Entry tab to add marks.
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
                {[
                  { id: 'all', label: 'Students Assessed', val: classStats.total, icon: 'fa-users', col: 'var(--blue)', bg: 'var(--bluebg)', borderCol: reportFilterMode === 'all' ? 'var(--blue)' : 'var(--border)' },
                  { id: 'pass', label: 'Pass Rate', val: `${classStats.passRate}% (${classStats.passed} Passed)`, icon: 'fa-circle-check', col: 'var(--green)', bg: 'var(--greenbg)', borderCol: reportFilterMode === 'pass' ? 'var(--green)' : 'var(--border)' },
                  { id: 'avg', label: 'Class Average', val: `${classStats.avgPct}%`, icon: 'fa-chart-line', col: 'var(--purple)', bg: 'var(--purplebg)', borderCol: 'var(--border)' },
                  { id: 'fail', label: 'Failed Students', val: `${classStats.failed} Failed`, icon: 'fa-triangle-exclamation', col: 'var(--red)', bg: 'var(--redbg)', borderCol: reportFilterMode === 'fail' ? 'var(--red)' : 'var(--border)' },
                ].map(({ id, label, val, icon, col, bg, borderCol }) => (
                  <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} 
                    key={label} 
                    onClick={() => {
                      if (id === 'avg') return
                      setReportFilterMode(id)
                    }}
                    style={{ 
                      background: 'var(--bg2)', 
                      border: `2px solid ${borderCol}`, 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '16px 18px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 14,
                      cursor: id === 'avg' ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      transform: (id !== 'avg' && reportFilterMode === id) ? 'translateY(-2px)' : 'none',
                      boxShadow: (id !== 'avg' && reportFilterMode === id) ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                    }}
                    onMouseOver={(e) => {
                      if (id !== 'avg') e.currentTarget.style.borderColor = col
                    }}
                    onMouseOut={(e) => {
                      if (id !== 'avg' && reportFilterMode !== id) e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, color: col, display: 'grid', placeItems: 'center', fontSize: 18 }}>
                      <i className={`fa-solid ${icon}`}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>{val}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subject-Wise Analytics */}
              {subjectAnalytics.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: 'var(--t1)' }}>
                    <i className="fa-solid fa-book-open" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
                    Subject Performance Insights
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                    {subjectAnalytics.map(sub => (
                      <div key={sub.name} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent2) 100%)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--t1)' }}>{sub.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--t3)' }}>
                            Max: {sub.maxMarks}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)' }}>{sub.avg}</div>
                            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Score</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--amber)' }}>{sub.highest}</div>
                            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Highest</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: sub.passRate >= 75 ? 'var(--green)' : sub.passRate >= 40 ? 'var(--amber)' : 'var(--red)' }}>
                              {sub.passRate}%
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', fontWeight: 600 }}>Pass Rate</div>
                          </div>
                        </div>
                        <div style={{ marginTop: 14, background: 'var(--bg3)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${sub.avgPct}%`, background: 'var(--accent)', height: '100%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
                {/* Grade Distribution */}
                <div className="roles-table-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: 'var(--t1)' }}>
                    <i className="fa-solid fa-chart-pie" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Grade Distribution
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(gradeDistribution).map(([grade, count]) => {
                      const pct = classFilteredAnalytics.length > 0 ? Math.round((count / classFilteredAnalytics.length) * 100) : 0
                      return (
                        <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, textAlign: 'center', fontWeight: 800, fontSize: 12, color: gradeColor(grade) }}>{grade}</div>
                          <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 20, height: 10, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, background: gradeColor(grade), height: '100%', borderRadius: 20, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ width: 40, textAlign: 'right', fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{count}</div>
                          <div style={{ width: 36, textAlign: 'right', fontSize: 11, color: 'var(--t3)' }}>{pct}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="roles-table-card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: 'var(--t1)' }}>
                    <i className="fa-solid fa-trophy" style={{ color: 'var(--amber)', marginRight: 8 }}></i>Top Performers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topStudents.map((a, idx) => (
                      <div key={a.student.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: idx === 0 ? 'var(--amberbg)' : idx === 1 ? '#e5e7eb' : '#f3f4f6', color: idx === 0 ? 'var(--amber)' : 'var(--t3)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{a.student.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{getClassName(a.student.classId)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: gradeColor(a.grade), fontSize: 13 }}>{a.pct.toFixed(1)}%</div>
                          <div style={{ fontSize: 11, fontWeight: 700, background: gradeBg(a.grade), color: gradeColor(a.grade), padding: '1px 8px', borderRadius: 20 }}>{a.grade}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    <i className="fa-solid fa-table-list" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
                    Full Results — {analyticsExam?.name} {reportFilterMode !== 'all' && `(${reportFilterMode === 'pass' ? 'Passed' : 'Failed'} Filter Active)`}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="roles-search" style={{ margin: 0, width: 220 }}>
                      <i className="fa-solid fa-magnifying-glass"></i>
                      <input aria-label="Search student or ADM..." 
                        placeholder="Search student or ADM..." 
                        value={reportSearch} 
                        onChange={e => setReportSearch(e.target.value)} 
                        style={{ padding: '6px 12px 6px 32px', fontSize: 12 }}
                      />
                      {reportSearch && (
                        <button aria-label="Close" className="roles-search-clear" onClick={() => setReportSearch('')} style={{ top: '50%', transform: 'translateY(-50%)' }}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      )}
                    </div>
                    
                    {reportFilterMode !== 'all' && (
                      <button 
                        className="btn btn-ghost btn-xs" 
                        onClick={() => setReportFilterMode('all')}
                        style={{ color: 'var(--red)', border: '1px solid var(--red)', padding: '5px 10px' }}
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="roles-table">
                    <thead>
                      <tr>
                        <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                          Student {renderSortIcon('name')}
                        </th>
                        <th>Class</th>
                        <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('marks')}>
                          Total Marks {renderSortIcon('marks')}
                        </th>
                        <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('pct')}>
                          Percentage {renderSortIcon('pct')}
                        </th>
                        <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('grade')}>
                          Grade {renderSortIcon('grade')}
                        </th>
                        <th style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => toggleSort('pass')}>
                          Result {renderSortIcon('pass')}
                        </th>
                        <th style={{ textAlign: 'center' }}>Report Card</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classFilteredAnalytics.length === 0 ? (
                        <tr><td colSpan={7} className="roles-empty">No results match filters</td></tr>
                      ) : classFilteredAnalytics.map(a => (
                        <tr key={a.student.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{a.student.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--t3)' }}>{a.student.admissionNo}</div>
                          </td>
                          <td style={{ fontSize: 12 }}>{getClassName(a.student.classId)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.totalObtained} / {a.totalMax}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                              <div style={{ flex: 1, maxWidth: 80, background: 'var(--bg3)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                                <div style={{ width: `${a.pct}%`, background: gradeColor(a.grade), height: '100%', borderRadius: 20 }} />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: 12 }}>{a.pct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 800, background: gradeBg(a.grade), color: gradeColor(a.grade), padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{a.grade}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: a.pass ? 'var(--green)' : 'var(--red)', fontSize: 12 }}>
                              {a.pass === null ? 'Incomplete' : a.pass ? '✓ Pass' : '✗ Fail'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => printReportCard(a.student, selectedExamId)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                            >
                              <i className="fa-solid fa-print"></i> Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB: GRADING SCHEMAS ────────────────────────────────────────── */}
      {activeTab === 'grading' && (
        <div className="roles-table-card academic-list-card" style={{ padding: '24px', width: '100%', background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                <i className="fa-solid fa-sliders" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                Grading System Schema Configuration
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '4px', margin: 0 }}>
                Define the minimum and maximum percentages required to secure each grade, and set their pass/fail statuses.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => {
                if (confirm('Are you sure you want to reset grading criteria to default values?')) {
                  setGradeSchema(DEFAULT_GRADE_SCHEMA)
                  showToast('Grading schema reset to default')
                }
              }}>
                <i className="fa-solid fa-arrow-rotate-left"></i> Reset Defaults
              </button>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => {
                const newRow = { grade: 'NEW', minPct: 0, maxPct: 10, pass: true, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
                setGradeSchema(prev => [...prev, newRow].sort((a, b) => b.minPct - a.minPct))
                showToast('Grade level added')
              }}>
                <i className="fa-solid fa-plus"></i> Add Grade Level
              </button>
            </div>
          </div>

          <div className="table-wrap" style={{ marginBottom: '20px' }}>
            <table className="roles-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>Grade Symbol</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Min % Required</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Max % Allowed</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Pass / Fail</th>
                  <th style={{ width: '220px' }}>Color Indicator</th>
                  <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {gradeSchema.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <input aria-label="Grade name" 
                        className="form-input" 
                        value={item.grade} 
                        onChange={(e) => {
                          const updated = [...gradeSchema]
                          updated[idx].grade = e.target.value.toUpperCase()
                          setGradeSchema(updated)
                        }}
                        style={{ fontWeight: 800, textTransform: 'uppercase', padding: '6px 10px' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input aria-label="Minimum percentage" 
                        className="form-input" 
                        type="number" 
                        min={0} 
                        max={100} 
                        value={item.minPct} 
                        onChange={(e) => {
                          const updated = [...gradeSchema]
                          updated[idx].minPct = Number(e.target.value) || 0
                          setGradeSchema(updated)
                        }}
                        style={{ textAlign: 'center', width: '90px', margin: '0 auto' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input aria-label="Maximum percentage" 
                        className="form-input" 
                        type="number" 
                        min={0} 
                        max={100} 
                        value={item.maxPct} 
                        onChange={(e) => {
                          const updated = [...gradeSchema]
                          updated[idx].maxPct = Number(e.target.value) || 0
                          setGradeSchema(updated)
                        }}
                        style={{ textAlign: 'center', width: '90px', margin: '0 auto' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <select aria-label="✓ Pass" 
                        className="form-select" 
                        value={item.pass ? 'pass' : 'fail'} 
                        onChange={(e) => {
                          const updated = [...gradeSchema]
                          updated[idx].pass = e.target.value === 'pass'
                          setGradeSchema(updated)
                        }}
                        style={{ width: '110px', margin: '0 auto', padding: '6px' }}
                      >
                        <option value="pass">✓ Pass</option>
                        <option value="fail">✗ Fail</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input aria-label="Value" 
                          type="color" 
                          value={item.color.startsWith('#') ? item.color : '#3b82f6'} 
                          onChange={(e) => {
                            const updated = [...gradeSchema]
                            updated[idx].color = e.target.value
                            updated[idx].bg = e.target.value + '1F'
                            setGradeSchema(updated)
                          }}
                          style={{ width: '30px', height: '30px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', padding: 0 }}
                        />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: item.color, background: item.bg, padding: '4px 10px', borderRadius: '12px' }}>
                          Preview Style
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                      <button aria-label="Delete Grade Level" className="btn-icon-sm danger" type="button" onClick={() => {
                        const updated = gradeSchema.filter((_, i) => i !== idx)
                        setGradeSchema(updated)
                        showToast('Grade level removed')
                      }} title="Delete Grade Level">
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EXAM MODAL ───────────────────────────────────────────────────── */}
      {showExamModal && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-file-pen" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
                  {editingExamId ? 'Edit Exam' : 'Schedule New Exam'}
                </h3>
                <p className="modal-sub">Fill in the exam details, assign classes, and set grading parameters.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowExamModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={saveExam}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Exam Name <span className="req">*</span></label>
                    <input aria-label="Exam Name" className="form-input" placeholder="e.g. Mid-Term Evaluation" value={examForm.name} onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Academic Year</label>
                    <input aria-label="Academic Year" className="form-input" value={examForm.academicYear} onChange={e => setExamForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="2026–2027" />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select aria-label="Status" className="form-select" value={examForm.status} onChange={e => setExamForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date <span className="req">*</span></label>
                    <input aria-label="Start Date" className="form-input" type="date" value={examForm.startDate} onChange={e => setExamForm(f => ({ ...f, startDate: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input aria-label="End Date" className="form-input" type="date" value={examForm.endDate} onChange={e => setExamForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Max Marks Per Subject</label>
                    <input aria-label="Max Marks Per Subject" className="form-input" type="number" min={1} value={examForm.maxMarks} onChange={e => setExamForm(f => ({ ...f, maxMarks: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Pass Mark</label>
                    <input aria-label="Pass Mark" className="form-input" type="number" min={1} value={examForm.passMark} onChange={e => setExamForm(f => ({ ...f, passMark: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Conducted By</label>
                    <input aria-label="Conducted By" className="form-input" value={examForm.conductedBy} onChange={e => setExamForm(f => ({ ...f, conductedBy: e.target.value }))} placeholder="e.g. Super Admin" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Applicable Classes <span className="req">*</span></label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {classes.map(c => {
                        const isChecked = examForm.classIds.includes(c.id)
                        return (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: isChecked ? 'var(--bluebg)' : 'var(--bg3)', border: `1px solid ${isChecked ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: isChecked ? 'var(--blue)' : 'var(--t2)', transition: 'all 0.15s' }}>
                            <input aria-label="Applicable Classes" type="checkbox" checked={isChecked} style={{ display: 'none' }} onChange={e => {
                              setExamForm(f => ({
                                ...f,
                                classIds: e.target.checked ? [...f.classIds, c.id] : f.classIds.filter(id => id !== c.id)
                              }))
                            }} />
                            {isChecked && <i className="fa-solid fa-check" style={{ fontSize: 10 }}></i>}
                            {c.name}{c.section ? ` - ${c.section}` : ''}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Description</label>
                    <textarea aria-label="Description" className="form-input" rows={2} value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes about this exam..." style={{ resize: 'vertical', textTransform: 'none', minHeight: 60 }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowExamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i> {editingExamId ? 'Update Exam' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast ${toast.type === 'error' ? 'error' : 'success'}`}>
            <span>{toast.type === 'error' ? '❌' : '✅'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </Layout>
  )
}
