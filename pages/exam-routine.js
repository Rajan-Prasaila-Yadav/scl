import { writePrintDocument } from '../lib/printDocument'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import { INITIAL_EXAMS } from '../lib/examFixtures'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  readStoredList,
  writeStoredList,
  makeId,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS
} from '../lib/academicData'

const ALL_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const INITIAL_ROUTINES = [
  // Exam ID 1 (Mid-Term), Class ID 1 (Grade 8 - A)
  { id: 1, examId: 1, classId: 1, subjectId: 1, date: '2026-03-10', day: 'Tuesday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 2, examId: 1, classId: 1, subjectId: 2, date: '2026-03-12', day: 'Thursday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 3, examId: 1, classId: 1, subjectId: 3, date: '2026-03-14', day: 'Saturday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 4, examId: 1, classId: 1, subjectId: 4, date: '2026-03-16', day: 'Monday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 5, examId: 1, classId: 1, subjectId: 5, date: '2026-03-18', day: 'Wednesday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 6, examId: 1, classId: 1, subjectId: 6, date: '2026-03-20', day: 'Friday', startTime: '09:00', endTime: '12:00', room: 'B-201' },

  // Exam ID 2 (Final), Class ID 1 (Grade 8 - A)
  { id: 7, examId: 2, classId: 1, subjectId: 1, date: '2026-06-28', day: 'Sunday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 8, examId: 2, classId: 1, subjectId: 2, date: '2026-06-30', day: 'Tuesday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 9, examId: 2, classId: 1, subjectId: 3, date: '2026-07-02', day: 'Thursday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 10, examId: 2, classId: 1, subjectId: 4, date: '2026-07-04', day: 'Saturday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 11, examId: 2, classId: 1, subjectId: 5, date: '2026-07-06', day: 'Monday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
  { id: 12, examId: 2, classId: 1, subjectId: 6, date: '2026-07-08', day: 'Wednesday', startTime: '09:00', endTime: '12:00', room: 'B-201' },
]

const DEFAULT_RULES = [
  "Students must present their printed Admit Card at the entrance of the examination hall.",
  "Candidates are advised to arrive at the hall at least 15 minutes before the exam begins.",
  "No calculators, smartwatches, smartphones, or textbooks are allowed inside.",
  "Possessing any unauthorized materials will lead to immediate disqualification.",
  "Check and clear any pending tuition/lab fees before the start of the exams."
]

const emptyRoutineForm = {
  examId: '',
  classId: '',
  subjectId: '',
  date: '',
  startTime: '09:00',
  endTime: '12:00',
  room: ''
}

export default function ExamRoutine() {
  // ── Data states ───────────────────────────────────────────────────────────
  const [exams, setExams] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [routines, setRoutines] = useState([])
  const [rules, setRules] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState(null)
  
  // ── UI states ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('routine') // 'routine' | 'rules' | 'admit'
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  
  // ── Routine Form states ───────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [routineForm, setRoutineForm] = useState(emptyRoutineForm)
  const [editingId, setEditingId] = useState(null)

  // ── Bulk Admit Card states ────────────────────────────────────────────────
  const [selectedStudents, setSelectedStudents] = useState([])

  // ── Class selection states inside scheduler modal ──────────────────────────
  const [classSelectionMode, setClassSelectionMode] = useState('specific')
  const [selectedModalClassIds, setSelectedModalClassIds] = useState([])

  // Helper: Get weekday from date
  const getDayOfWeek = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return ALL_WEEKDAYS[date.getDay()]
  }

  // Load from local storage
  useEffect(() => {
    setExams(readStoredList('educore.exams', INITIAL_EXAMS))
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    setSubjects(readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS))
    setStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setRoutines(readStoredList('educore.examRoutine', INITIAL_ROUTINES))
    setRules(readStoredList('educore.examRules', DEFAULT_RULES))
    setHydrated(true)
  }, [])

  // Auto-select initial dropdowns when data is loaded
  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id)
    }
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id)
    }
  }, [exams, classes])

  // Save back to local storage
  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.examRoutine', routines)
  }, [routines, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.examRules', rules)
  }, [rules, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getClassName = (id) => {
    const c = classes.find(c => String(c.id) === String(id))
    return c ? `${c.name}${c.section ? ` - ${c.section}` : ''}` : 'Unknown'
  }

  const getSubjectName = (id) => {
    const s = subjects.find(s => String(s.id) === String(id))
    return s ? s.name : 'Unknown'
  }

  const getExamName = (id) => {
    const e = exams.find(e => String(e.id) === String(id))
    return e ? e.name : 'Unknown'
  }

  // Check pending dues
  const hasPendingFees = (stu) => {
    return (stu.payments || []).some(p => p.status === 'pending')
  }

  const getPendingAmount = (stu) => {
    return (stu.payments || []).reduce((acc, p) => p.status === 'pending' ? acc + (p.amount - p.amountPaid) : acc, 0)
  }

  // ── Filtered routinely slots ──────────────────────────────────────────────
  const filteredRoutines = useMemo(() => {
    if (!selectedExamId) return []
    return routines.filter(r => 
      String(r.examId) === String(selectedExamId) &&
      (!selectedClassId || String(r.classId) === String(selectedClassId))
    ).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [routines, selectedExamId, selectedClassId])

  // ── Students under active filters ──────────────────────────────────────────
  const activeClassStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students.filter(s => String(s.classId) === String(selectedClassId))
  }, [students, selectedClassId])

  // Auto-select all students for bulk printing when list changes
  useEffect(() => {
    setSelectedStudents(activeClassStudents.map(s => s.id))
  }, [activeClassStudents])

  // ── Routine Form actions ──────────────────────────────────────────────────
  const openAddRoutine = () => {
    setRoutineForm({
      ...emptyRoutineForm,
      examId: selectedExamId || '',
      classId: selectedClassId || ''
    })
    setClassSelectionMode(selectedClassId ? 'specific' : 'all')
    setSelectedModalClassIds(selectedClassId ? [Number(selectedClassId)] : classes.map(c => c.id))
    setEditingId(null)
    setShowModal(true)
  }

  const openEditRoutine = (slot) => {
    setRoutineForm({
      examId: slot.examId,
      classId: slot.classId,
      subjectId: slot.subjectId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room
    })
    setClassSelectionMode('specific')
    setSelectedModalClassIds([slot.classId])
    setEditingId(slot.id)
    setShowModal(true)
  }

  const saveRoutine = (e) => {
    e?.preventDefault?.(); if (!requirePermission(editingId ? 'edit' : 'create')) return

    e.preventDefault()
    if (!routineForm.examId || !routineForm.subjectId || !routineForm.date || !routineForm.room) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    if (classSelectionMode === 'specific' && selectedModalClassIds.length === 0) {
      showToast('Please select at least one class', 'error')
      return
    }

    const exam = exams.find(item => String(item.id) === String(routineForm.examId))
    if (!routineForm.startTime || !routineForm.endTime || routineForm.endTime <= routineForm.startTime) { showToast('End time must be after start time', 'error'); return }
    if (exam && (routineForm.date < exam.startDate || (exam.endDate && routineForm.date > exam.endDate))) { showToast('Schedule the slot within the exam dates', 'error'); return }
    const targets = editingId ? [selectedModalClassIds[0] || routineForm.classId] : selectedModalClassIds
    if (!targets.length || (exam && targets.some(id => !exam.classIds.some(c => String(c) === String(id))))) { showToast('Select classes included in this exam', 'error'); return }
    if (routines.some(r => r.id !== editingId && r.date === routineForm.date && r.startTime < routineForm.endTime && routineForm.startTime < r.endTime && (targets.some(id => String(id) === String(r.classId)) || r.room.trim().toLowerCase() === routineForm.room.trim().toLowerCase()))) { showToast('This time overlaps another slot for the class or room', 'error'); return }
    const basePayload = {
      examId: Number(routineForm.examId),
      subjectId: Number(routineForm.subjectId),
      date: routineForm.date,
      day: getDayOfWeek(routineForm.date),
      startTime: routineForm.startTime,
      endTime: routineForm.endTime,
      room: routineForm.room.trim()
    }

    if (editingId) {
      const targetClass = selectedModalClassIds[0] || routineForm.classId
      setRoutines(prev => prev.map(r => r.id === editingId ? { ...r, ...basePayload, classId: Number(targetClass) } : r))
      showToast('Routine slot updated successfully')
    } else {
      const newSlots = selectedModalClassIds.map(cId => ({
        id: makeId(),
        ...basePayload,
        classId: Number(cId)
      }))
      setRoutines(prev => [...prev, ...newSlots])
      showToast(`Scheduled routine slot for ${selectedModalClassIds.length} classes`)
    }
    setShowModal(false)
  }

  const deleteRoutine = (id) => {
    if (!requirePermission('delete')) return

    if (!confirm('Are you sure you want to delete this routine slot?')) return
    setRoutines(prev => prev.filter(r => r.id !== id))
    showToast('Routine slot deleted', 'info')
  }

  // ── Rules Management ──────────────────────────────────────────────────────
  const updateRule = (idx, value) => {
    if (!requirePermission('edit')) return

    const updated = [...rules]
    updated[idx] = value
    setRules(updated)
  }

  const deleteRule = (idx) => {
    if (!requirePermission('delete')) return

    setRules(prev => prev.filter((_, i) => i !== idx))
  }

  const addRule = () => {
    if (!requirePermission('edit')) return

    setRules(prev => [...prev, 'New examination rule/regulation detail...'])
  }

  // ── Bulk Admit Card printing ──────────────────────────────────────────────
  const printAdmitCardsBulk = (studentIds, examId) => {
    const list = students.filter(s => studentIds.includes(s.id))
    if (list.length === 0) {
      showToast('No students selected for printing', 'error')
      return
    }

    const exam = exams.find(e => e.id === Number(examId))
    const examName = exam ? exam.name : 'Examination'
    
    // Group into pages of 6 admit cards
    const pages = []
    for (let i = 0; i < list.length; i += 6) {
      pages.push(list.slice(i, i + 6))
    }
    
    const pagesHtml = pages.map((pageStudents) => {
      const cardsHtml = pageStudents.map(stu => {
        const cls = classes.find(c => c.id === stu.classId)
        const className = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'N/A'
        
        // Find exam routine slots for this student
        const stuRoutine = routines
          .filter(r => r.examId === Number(examId) && r.classId === stu.classId)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          
        const routineRowsHtml = stuRoutine.map(r => {
          const subName = getSubjectName(r.subjectId)
          return `
            <tr>
              <td>${subName}</td>
              <td style="text-align:center">${r.date} (${r.day.slice(0,3)})</td>
              <td style="text-align:center">${r.startTime} - ${r.endTime}</td>
              <td style="text-align:center">${r.room}</td>
            </tr>
          `
        }).join('')
        
        // Check fee dues
        const hasPending = hasPendingFees(stu)
        const pendingAmount = getPendingAmount(stu)
        
        let alertHtml = ''
        if (hasPending) {
          alertHtml = `
            <div class="due-alert">
              ⚠️ PENDING FEES DUE: NPR ${pendingAmount.toLocaleString()}<br/>
              <span>NOTICE: Clear outstanding balance at accounts desk.</span>
            </div>
          `
        } else {
          alertHtml = `
            <div class="cleared-alert">
              ✓ DUES CLEARED — ADMITTED
            </div>
          `
        }
        
        const rulesListHtml = rules.slice(0, 3).map(rule => `<li>${rule}</li>`).join('')
        
        return `
          <div class="admit-card">
            <div class="card-header">
              <div class="school-logo">EC</div>
              <div>
                <div class="sch-name">Sunrise Public School</div>
                <div class="sch-sub">CBSE Board Affiliated • SPS-DEL-01</div>
              </div>
            </div>
            
            <div class="admit-title">ADMIT CARD — ${examName.toUpperCase()}</div>
            
            <div class="student-grid">
              <div class="grid-cell"><span class="lbl">Student</span><span class="val">${stu.name}</span></div>
              <div class="grid-cell"><span class="lbl">Adm No.</span><span class="val">${stu.admissionNo || '—'}</span></div>
              <div class="grid-cell"><span class="lbl">Class</span><span class="val">${className}</span></div>
              <div class="grid-cell"><span class="lbl">Roll No.</span><span class="val">${stu.rollNo || '—'}</span></div>
            </div>
            
            <div class="schedule-section">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th style="text-align:center">Date</th>
                    <th style="text-align:center">Time</th>
                    <th style="text-align:center">Room</th>
                  </tr>
                </thead>
                <tbody>
                  ${routineRowsHtml || '<tr><td colSpan="4" style="text-align:center">No routine scheduled</td></tr>'}
                </tbody>
              </table>
            </div>
            
            ${alertHtml}
            
            <div class="rules-section">
              <ul>
                ${rulesListHtml}
              </ul>
            </div>
            
            <div class="signature-section">
              <div class="sig-line">Class Teacher</div>
              <div class="sig-line">Controller of Exams</div>
            </div>
          </div>
        `
      }).join('')
      
      return `
        <div class="print-page">
          <div class="cards-grid">
            ${cardsHtml}
          </div>
        </div>
      `
    }).join('')
    
    const win = window.open('', '_blank')
    if (!win) return
    writePrintDocument(win, `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Admit Cards — ${examName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            @page { size: A4 portrait; margin: 0; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; -webkit-print-color-adjust: exact; }
            .no-print { position: fixed; bottom: 24px; right: 24px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.3); z-index: 10000; }
            .print-page { width: 210mm; height: 297mm; box-sizing: border-box; padding: 6mm; page-break-after: always; display: flex; align-items: center; justify-content: center; }
            .cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); gap: 4mm; width: 100%; height: 100%; box-sizing: border-box; }
            .admit-card { border: 1px dashed #64748b; border-radius: 8px; padding: 10px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; height: 90mm; position: relative; background: #fff; }
            .card-header { display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
            .school-logo { width: 28px; height: 28px; border-radius: 6px; background: #3b82f6; color: #fff; display: grid; place-items: center; font-weight: 800; font-size: 13px; }
            .sch-name { font-size: 11px; font-weight: 800; color: #1e3a8a; line-height: 1.2; }
            .sch-sub { font-size: 8px; color: #64748b; line-height: 1; }
            .admit-title { text-align: center; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: #eff6ff; color: #1e40af; padding: 3px 0; border-radius: 4px; margin: 4px 0; }
            .student-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 8px; margin-bottom: 4px; }
            .grid-cell { display: flex; flex-direction: column; }
            .lbl { font-size: 7px; text-transform: uppercase; color: #64748b; font-weight: 600; }
            .val { font-size: 10px; font-weight: 700; color: #0f172a; }
            .schedule-section { flex-grow: 1; margin: 4px 0; }
            .schedule-section table { width: 100%; border-collapse: collapse; font-size: 8px; }
            .schedule-section th { background: #0f172a; color: #fff; text-transform: uppercase; font-size: 7px; padding: 3px 6px; text-align: left; }
            .schedule-section td { padding: 3px 6px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .schedule-section tr:nth-child(even) td { background: #f8fafc; }
            .due-alert { border: 1px solid #ef4444; background: #fef2f2; color: #b91c1c; font-size: 8px; font-weight: 800; text-align: center; padding: 3px; border-radius: 4px; margin-bottom: 4px; text-transform: uppercase; line-height: 1.2; }
            .due-alert span { font-size: 6px; font-weight: 600; color: #7f1d1d; }
            .cleared-alert { border: 1px solid #22c55e; background: #f0fdf4; color: #15803d; font-size: 8px; font-weight: 800; text-align: center; padding: 3px; border-radius: 4px; margin-bottom: 4px; text-transform: uppercase; }
            .rules-section { font-size: 7px; color: #64748b; margin-bottom: 4px; }
            .rules-section ul { margin: 0; padding-left: 12px; }
            .signature-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 4px; }
            .sig-line { border-top: 1px solid #94a3b8; font-size: 7px; color: #64748b; width: 32%; text-align: center; padding-top: 2px; }
            @media print {
              .no-print { display: none !important; }
              .print-page { border: none; margin: 0; padding: 6mm; }
            }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()">🖨️ Print Admit Cards</button>
          ${pagesHtml}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
  }

  // ── Routine printing ─────────────────────────────────────────────────────
  const printRoutine = (examId, classId) => {
    const exam = exams.find(e => e.id === Number(examId))
    const cls = classes.find(c => c.id === Number(classId))
    const examName = exam ? exam.name : 'Examination'
    const className = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'All Classes'
    
    const targetClassId = (!classId || classId === 'all') ? null : Number(classId)
    
    const filtered = routines
      .filter(r => r.examId === Number(examId) && (!targetClassId || r.classId === targetClassId))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      
    // Group routines by class
    const classesWithRoutine = Array.from(new Set(filtered.map(r => r.classId)))
    
    let contentHtml = ''
    if (classesWithRoutine.length === 0) {
      contentHtml = '<div style="text-align:center; padding: 40px; color: #64748b;">No routines scheduled yet for this exam.</div>'
    } else if (targetClassId) {
      // Single Class
      const rowsHtml = filtered.map(r => {
        const subName = getSubjectName(r.subjectId)
        return `
          <tr>
            <td><strong>${subName}</strong></td>
            <td style="text-align:center;">${r.date}</td>
            <td style="text-align:center;">${r.day}</td>
            <td style="text-align:center;">${r.startTime} - ${r.endTime}</td>
            <td style="text-align:center;">${r.room}</td>
          </tr>
        `
      }).join('')
      contentHtml = `
        <div class="routine-section">
          <div class="class-header">Class: ${className}</div>
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th style="text-align:center;">Date</th>
                <th style="text-align:center;">Day</th>
                <th style="text-align:center;">Time Slot</th>
                <th style="text-align:center;">Room</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `
    } else {
      // Grouped by Class (each class on a new page)
      contentHtml = classesWithRoutine.map(cId => {
        const classRoutines = filtered.filter(r => r.classId === cId)
        const cName = getClassName(cId)
        const rowsHtml = classRoutines.map(r => {
          const subName = getSubjectName(r.subjectId)
          return `
            <tr>
              <td><strong>${subName}</strong></td>
              <td style="text-align:center;">${r.date}</td>
              <td style="text-align:center;">${r.day}</td>
              <td style="text-align:center;">${r.startTime} - ${r.endTime}</td>
              <td style="text-align:center;">${r.room}</td>
            </tr>
          `
        }).join('')
        return `
          <div class="routine-section class-page">
            <div class="class-header">Class: ${cName}</div>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th style="text-align:center;">Date</th>
                  <th style="text-align:center;">Day</th>
                  <th style="text-align:center;">Time Slot</th>
                  <th style="text-align:center;">Room</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `
      }).join('')
    }
    
    const rulesHtml = rules.map(rule => `<li>${rule}</li>`).join('')
    
    const win = window.open('', '_blank')
    if (!win) return
    writePrintDocument(win, `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Exam Routine — ${examName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 20mm 15mm;
            }
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1e293b; 
              background: #fff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }
            
            .print-btn { 
              position: fixed; 
              bottom: 24px; 
              right: 24px; 
              background: #3b82f6; 
              color: #fff; 
              padding: 12px 24px; 
              border: none; 
              border-radius: 8px; 
              font-size: 14px;
              font-weight: 700; 
              cursor: pointer; 
              box-shadow: 0 4px 12px rgba(59,130,246,0.3);
              z-index: 10000;
            }
            
            .header { 
              border-bottom: 3px solid #3b82f6; 
              padding-bottom: 12px; 
              margin-bottom: 24px; 
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            
            .sch-title { font-size: 22px; font-weight: 800; color: #1e3a8a; }
            .sub-title { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.5px; }
            .year-lbl { font-size: 13px; font-weight: 700; color: #3b82f6; text-align: right; }
            
            .class-header {
              font-size: 15px;
              font-weight: 800;
              color: #0f172a;
              background: #f1f5f9;
              padding: 8px 12px;
              border-left: 4px solid #3b82f6;
              border-radius: 0 6px 6px 0;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 24px; 
            }
            
            th { 
              background: #1e3a8a; 
              color: #fff; 
              text-transform: uppercase; 
              font-size: 10px; 
              font-weight: 700;
              letter-spacing: 0.5px;
              padding: 10px 12px; 
              text-align: left; 
            }
            
            td { 
              padding: 10px 12px; 
              border-bottom: 1px solid #e2e8f0; 
              font-size: 12px; 
              color: #334155;
            }
            
            tr:nth-child(even) td { background: #f8fafc; }
            
            .rules { 
              margin-top: 30px; 
              background: #f8fafc; 
              border: 1px solid #e2e8f0;
              padding: 18px; 
              border-radius: 8px; 
              page-break-inside: avoid;
            }
            
            .rules h3 { 
              margin-top: 0; 
              color: #1e3a8a; 
              font-size: 13px; 
              font-weight: 800;
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 10px;
            }
            
            .rules ul { margin: 0; padding-left: 18px; font-size: 11px; color: #475569; line-height: 1.6; }
            
            .class-page {
              page-break-after: always;
            }
            
            .class-page:last-child {
              page-break-after: avoid;
            }
            
            @media print { 
              .print-btn { display: none !important; } 
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ Print Exam Routine</button>
          
          <div class="header">
            <div>
              <div class="sch-title">🏫 Sunrise Public School</div>
              <div class="sub-title">Examination Routine — ${examName}</div>
            </div>
            <div>
              <div class="year-lbl">Academic Session 2026–2027</div>
              <div style="font-size:11px; color:#64748b; text-align:right;">Scope: ${className}</div>
            </div>
          </div>
          
          ${contentHtml}
          
          <div class="rules">
            <h3>Candidate Rules & Directions</h3>
            <ul>
              ${rulesHtml || '<li>Follow general school exam guidelines.</li>'}
            </ul>
          </div>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
  }

  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-calendar-days" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
            Exam Routines &amp; Admit Cards
          </h1>
          <p>Draft routines, define candidate rules, and generate print-ready Admit Cards with payment reminders.</p>
        </div>
        <div className="settings-actions">
          {activeTab === 'routine' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedExamId && (
                <button className="btn btn-ghost" onClick={() => printRoutine(selectedExamId, selectedClassId || 'all')}>
                  <i className="fa-solid fa-print"></i> Print Routine
                </button>
              )}
              <button className="btn btn-primary" onClick={openAddRoutine}>
                <i className="fa-solid fa-plus"></i> Add Routine Slot
              </button>
            </div>
          )}
          {activeTab === 'admit' && selectedExamId && selectedClassId && (
            <button className="btn btn-primary" onClick={() => printAdmitCardsBulk(selectedStudents, selectedExamId)}>
              <i className="fa-solid fa-print"></i> Bulk Print Admit Cards ({selectedStudents.length})
            </button>
          )}
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="roles-table-card academic-list-card" style={{ padding: '16px 20px', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6 }}>Academic Exam</label>
            <select aria-label="Academic Exam" className="form-select" value={selectedExamId} onChange={e => setSelectedExamId(Number(e.target.value) || '')}>
              <option value="">— Select Exam —</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.academicYear})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 6 }}>Filter by Class</label>
            <select aria-label="Filter by Class" className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(Number(e.target.value) || '')}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-nav" style={{ marginBottom: 20 }}>
        <button className={activeTab === 'routine' ? 'active' : ''} onClick={() => setActiveTab('routine')}>
          <i className="fa-solid fa-calendar-days"></i> Scheduled Routine
        </button>
        <button className={activeTab === 'rules' ? 'active' : ''} onClick={() => setActiveTab('rules')}>
          <i className="fa-solid fa-shield-halved"></i> Rules &amp; Regulations
        </button>
        <button className={activeTab === 'admit' ? 'active' : ''} onClick={() => setActiveTab('admit')}>
          <i className="fa-solid fa-id-card"></i> Admit Card Generator
        </button>
      </div>

      {/* ── TAB: ROUTINE LIST ── */}
      {activeTab === 'routine' && (
        <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
          <div className="table-wrap">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Time Slot</th>
                  <th>Room</th>
                  <th style={{ textAlign: 'right', paddingRight: 20 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutines.length === 0 ? (
                  <tr><td colSpan={7} className="roles-empty">No routine slots scheduled. Click "Add Routine Slot" to schedule.</td></tr>
                ) : filteredRoutines.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--t1)' }}>{getClassName(r.classId)}</td>
                    <td><strong>{getSubjectName(r.subjectId)}</strong></td>
                    <td>{r.date}</td>
                    <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{r.day}</span></td>
                    <td><strong>{r.startTime} - {r.endTime}</strong></td>
                    <td><span className="badge badge-blue">{r.room}</span></td>
                    <td style={{ textAlign: 'right', paddingRight: 16 }}>
                      <div className="roles-actions">
                        <button aria-label="Edit" className="btn-icon-sm" title="Edit" onClick={() => openEditRoutine(r)}><i className="fa-solid fa-pen"></i></button>
                        <button aria-label="Delete" className="btn-icon-sm danger" title="Delete" onClick={() => deleteRoutine(r.id)}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: RULES ── */}
      {activeTab === 'rules' && (
        <div className="roles-table-card academic-list-card" style={{ padding: '24px', width: '100%', background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>Candidate Rules &amp; Directions</h3>
            <button className="btn btn-primary btn-sm" onClick={addRule}>
              <i className="fa-solid fa-plus"></i> Add Direction
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rules.map((rule, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', width: 24 }}>#{idx + 1}</span>
                <input aria-label="Rule" 
                  className="form-input" 
                  value={rule} 
                  onChange={e => updateRule(idx, e.target.value)} 
                  style={{ flex: 1, padding: '8px 12px', fontSize: 13, textTransform: 'none' }}
                />
                <button aria-label="Delete Rule" className="btn-icon-sm danger" onClick={() => deleteRule(idx)} title="Delete Rule">
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: ADMIT CARDS ── */}
      {activeTab === 'admit' && (
        <div>
          {!selectedExamId || !selectedClassId ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <i className="fa-solid fa-id-card" style={{ fontSize: 36, display: 'block', marginBottom: 16 }}></i>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t2)' }}>Select Exam and Class to generate Admit Cards</div>
            </div>
          ) : activeClassStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)' }}>No students enrolled in this class.</div>
          ) : (
            <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  Admit Cards Registry — {getClassName(selectedClassId)}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost btn-xs" onClick={() => setSelectedStudents(activeClassStudents.map(s => s.id))}>Select All</button>
                  <button className="btn btn-ghost btn-xs" onClick={() => setSelectedStudents([])}>Deselect All</button>
                </div>
              </div>
              <div className="table-wrap">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Student Name</th>
                      <th>Admission No</th>
                      <th>Roll No</th>
                      <th style={{ textAlign: 'center' }}>Dues Status</th>
                      <th style={{ textAlign: 'center' }}>Admit Card Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClassStudents.map(stu => {
                      const isChecked = selectedStudents.includes(stu.id)
                      const isPending = hasPendingFees(stu)
                      const pendingAmt = getPendingAmount(stu)
                      return (
                        <tr key={stu.id}>
                          <td>
                            <input aria-label="Select record" 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={e => {
                                setSelectedStudents(prev => 
                                  e.target.checked ? [...prev, stu.id] : prev.filter(id => id !== stu.id)
                                )
                              }}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>{stu.name}</div>
                          </td>
                          <td><strong>{stu.admissionNo}</strong></td>
                          <td>{stu.rollNo}</td>
                          <td style={{ textAlign: 'center' }}>
                            {isPending ? (
                              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--redbg)', color: 'var(--red)', padding: '4px 10px', borderRadius: 20 }}>
                                Dues: NPR {pendingAmt.toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--greenbg)', color: 'var(--green)', padding: '4px 10px', borderRadius: 20 }}>
                                Fully Cleared
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-ghost btn-xs" onClick={() => printAdmitCardsBulk([stu.id], selectedExamId)}>
                              <i className="fa-solid fa-print"></i> Generate Admit Card
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ROUTINE SCHEDULER MODAL ── */}
      {showModal && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-calendar-days" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
                  {editingId ? 'Edit Routine Slot' : 'Schedule Routine Slot'}
                </h3>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={saveRoutine}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label>Exam Period <span className="req">*</span></label>
                    <select aria-label="Exam Period" className="form-select" value={routineForm.examId} onChange={e => setRoutineForm(f => ({ ...f, examId: e.target.value }))} required>
                      <option value="">— Select Exam —</option>
                      {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: 12 }}>Target Class Configuration <span className="req">*</span></label>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--t1)' }}>
                        <input aria-label="All Classes" 
                          type="radio" 
                          name="classMode" 
                          checked={classSelectionMode === 'all'} 
                          onChange={() => {
                            setClassSelectionMode('all')
                            setSelectedModalClassIds(classes.map(c => c.id))
                          }} 
                        />
                        All Classes
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--t1)' }}>
                        <input aria-label="All Classes" 
                          type="radio" 
                          name="classMode" 
                          checked={classSelectionMode === 'specific'} 
                          onChange={() => {
                            setClassSelectionMode('specific')
                            setSelectedModalClassIds(selectedClassId ? [Number(selectedClassId)] : [classes[0]?.id])
                          }} 
                        />
                        Select Specific Classes
                      </label>
                    </div>
                    
                    {classSelectionMode === 'specific' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, background: 'var(--bg3)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', maxHeight: 150, overflowY: 'auto' }}>
                        {classes.map(c => {
                          const isChecked = selectedModalClassIds.includes(c.id)
                          return (
                            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600, color: 'var(--t2)' }}>
                              <input aria-label="Target Class Configuration" 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={e => {
                                  setSelectedModalClassIds(prev => 
                                    e.target.checked 
                                      ? [...prev, c.id] 
                                      : prev.filter(id => id !== c.id)
                                  )
                                }} 
                              />
                              {c.name}{c.section ? ` - ${c.section}` : ''}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Subject <span className="req">*</span></label>
                    <select aria-label="Subject" className="form-select" value={routineForm.subjectId} onChange={e => setRoutineForm(f => ({ ...f, subjectId: e.target.value }))} required>
                      <option value="">— Select Subject —</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Exam Date <span className="req">*</span></label>
                    <input aria-label="Exam Date" className="form-input" type="date" value={routineForm.date} onChange={e => setRoutineForm(f => ({ ...f, date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Room Name <span className="req">*</span></label>
                    <input aria-label="Room Name" className="form-input" placeholder="e.g. Room 104" value={routineForm.room} onChange={e => setRoutineForm(f => ({ ...f, room: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Start Time <span className="req">*</span></label>
                    <input aria-label="Start Time" className="form-input" type="time" value={routineForm.startTime} onChange={e => setRoutineForm(f => ({ ...f, startTime: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>End Time <span className="req">*</span></label>
                    <input aria-label="End Time" className="form-input" type="time" value={routineForm.endTime} onChange={e => setRoutineForm(f => ({ ...f, endTime: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i> {editingId ? 'Update Slot' : 'Schedule Slot'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* TOAST SYSTEM */}
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
