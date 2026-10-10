import { writePrintDocument } from '../lib/printDocument'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import { attendanceStats, localDate } from '../lib/validation'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  readStoredList,
  readStoredObject,
  writeStoredList,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STUDENTS,
  INITIAL_STAFF
} from '../lib/academicData'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const STATUS_MAP = { U: 'Unmarked', P: 'Present', A: 'Absent', L: 'Late', H: 'Holiday' }
const STATUS_COLORS = { U: 'var(--t2)', P: 'var(--green)', A: 'var(--red)', L: 'var(--amber)', H: '#94a3b8' }
const STATUS_BG    = { U: 'var(--bg3)', P: 'var(--greenbg)', A: 'var(--redbg)', L: 'var(--amberbg)', H: 'rgba(148,163,184,0.12)' }
const STATUS_CYCLE = ['U', 'P', 'A', 'L', 'H']

function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate()
}
function firstDayOfMonth(month, year) {
  return new Date(year, month, 1).getDay()
}

// ── Mini Calendar Component ────────────────────────────────────────────────────
function AttendanceCalendar({ personId, record, month, year, onToggle, readOnly }) {
  const days = getDaysInMonth(month, year)
  const firstDay = firstDayOfMonth(month, year)

  // Build calendar grid: blank cells + day cells
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {WEEKDAYS_SHORT.map(wd => (
          <div key={wd} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', padding: '2px 0' }}>
            {wd}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, idx) => {
          if (!d) return <div key={`blank-${idx}`} />
          const st = record?.[d] || 'U'
          const isSun = new Date(year, month, d).getDay() === 0
          return (
            <button
              key={d}
              disabled={readOnly || localDate(new Date(year, month, d)) > localDate()}
              aria-label={`Day ${d}: ${STATUS_MAP[st]}`}
              onClick={() => !readOnly && onToggle && onToggle(personId, d)}
              title={readOnly ? `Day ${d}: ${STATUS_MAP[st]}` : `Day ${d}: ${STATUS_MAP[st]} — click to cycle`}
              style={{
                border: 'none',
                borderRadius: 4,
                padding: '3px 0',
                background: isSun && st === 'H' ? 'rgba(148,163,184,0.10)' : STATUS_BG[st],
                color: STATUS_COLORS[st],
                fontWeight: 800,
                fontSize: 10,
                cursor: readOnly ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                transition: 'transform 0.1s, box-shadow 0.1s',
                minWidth: 0,
                outline: 'none',
              }}
              onMouseDown={e => { if (!readOnly) e.currentTarget.style.transform = 'scale(0.9)' }}
              onMouseUp={e => { if (!readOnly) e.currentTarget.style.transform = '' }}
              onMouseLeave={e => { if (!readOnly) e.currentTarget.style.transform = '' }}
            >
              <span style={{ fontSize: 8, opacity: 0.65, fontWeight: 600, lineHeight: 1 }}>{d}</span>
              <span style={{ fontSize: 10, lineHeight: 1 }}>{st}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Stat Pills ──────────────────────────────────────────────────────────────
function StatPills({ stats }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
      {[
        { k: 'P', label: 'P', color: STATUS_COLORS.P, bg: STATUS_BG.P },
        { k: 'A', label: 'A', color: STATUS_COLORS.A, bg: STATUS_BG.A },
        { k: 'L', label: 'L', color: STATUS_COLORS.L, bg: STATUS_BG.L },
        { k: 'H', label: 'H', color: STATUS_COLORS.H, bg: STATUS_BG.H },
      ].map(({ k, label, color, bg }) => (
        <span key={k} style={{ fontSize: 10, fontWeight: 700, color, background: bg, borderRadius: 20, padding: '1px 7px' }}>
          {label}:{stats[k.toLowerCase()] ?? stats[k] ?? 0}
        </span>
      ))}
      <span style={{
        fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '1px 8px',
        color: stats.pct >= 75 ? STATUS_COLORS.P : stats.pct >= 50 ? STATUS_COLORS.L : STATUS_COLORS.A,
        background: stats.pct >= 75 ? STATUS_BG.P : stats.pct >= 50 ? STATUS_BG.L : STATUS_BG.A,
      }}>
        {stats.pct}%
      </span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Attendance() {
  const [classes, setClasses]   = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [staff, setStaff]       = useState([])
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast]       = useState(null)

  const [activeTab, setActiveTab] = useState('students')
  const [selectedClassId, setSelectedClassId] = useState('')
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear())

  const [studentAttendance, setStudentAttendance] = useState({})
  const [teacherAttendance, setTeacherAttendance] = useState({})

  const [searchQuery, setSQ] = useState('')
  const [sortKey,  setSortKey]  = useState('name')
  const [sortDir,  setSortDir]  = useState('asc')
  const [analyticsSubTab, setAnalyticsSubTab] = useState('class')
  const [analyticsClassFilter, setAnalyticsClassFilter] = useState('all')

  // ── Selected person detail panel ───────────────────────────────────────────
  const [detailPerson, setDetailPerson] = useState(null) // { type: 'student'|'teacher', id }

  // ── Bulk-mark day modal ────────────────────────────────────────────────────
  const [bulkDay, setBulkDay] = useState(null) // day number

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const cls = readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES)
    setClasses(cls)
    if (cls.length > 0) setSelectedClassId(cls[0].id)
    setSubjects(readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS))
    setStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setStaff(readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF))

    const stuAtt = readStoredObject('educore.studentAttendance', {})
    if (stuAtt) setStudentAttendance(stuAtt)

    const teaAtt = readStoredObject('educore.teacherAttendance', {})
    if (teaAtt) setTeacherAttendance(teaAtt)

    setHydrated(true)
  }, [])

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
  const monthKey    = `${selectedYear}-${selectedMonth}`

  // New dates remain unmarked. Existing stored marks are preserved.
  useEffect(() => { if (hydrated) writeStoredList('educore.studentAttendance', studentAttendance) }, [studentAttendance, hydrated])
  useEffect(() => { if (hydrated) writeStoredList('educore.teacherAttendance', teacherAttendance) }, [teacherAttendance, hydrated])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getClassName = id => { const c = classes.find(c => String(c.id) === String(id)); return c ? `${c.name}${c.section ? ` - ${c.section}` : ''}` : 'Unknown' }
  const getSubjectName = id => subjects.find(s => String(s.id) === String(id))?.name || 'N/A'

  const classStudents = useMemo(() =>
    !selectedClassId ? [] : students.filter(s => String(s.classId) === String(selectedClassId)),
  [students, selectedClassId])

  const currentAtt     = studentAttendance[String(selectedClassId)]?.[monthKey] || {}
  const currentTeaAtt  = teacherAttendance[monthKey] || {}

  const selectedClass  = classes.find(c => String(c.id) === String(selectedClassId))
  const classTeacher   = selectedClass ? staff.find(s => s.id === selectedClass.classTeacherId) : null

  // ── Toggle attendance ──────────────────────────────────────────────────────
  const toggleStudent = (studentId, day) => {
    if (!requirePermission('edit')) return

    if (localDate(new Date(selectedYear, selectedMonth, day)) > localDate()) { showToast('Future dates cannot be marked', 'error'); return }
    const classKey = String(selectedClassId)
    const cur = currentAtt[studentId]?.[day] || 'U'
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
    setStudentAttendance(prev => ({
      ...prev,
      [classKey]: {
        ...(prev[classKey] || {}),
        [monthKey]: {
          ...(prev[classKey]?.[monthKey] || {}),
          [studentId]: { ...(prev[classKey]?.[monthKey]?.[studentId] || {}), [day]: next }
        }
      }
    }))
  }

  const toggleTeacher = (staffId, day) => {
    if (!requirePermission('edit')) return

    if (localDate(new Date(selectedYear, selectedMonth, day)) > localDate()) { showToast('Future dates cannot be marked', 'error'); return }
    const cur = currentTeaAtt[staffId]?.[day] || 'U'
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]
    setTeacherAttendance(prev => ({
      ...prev,
      [monthKey]: {
        ...(prev[monthKey] || {}),
        [staffId]: { ...(prev[monthKey]?.[staffId] || {}), [day]: next }
      }
    }))
  }

  // ── Bulk mark all students for a day ──────────────────────────────────────
  const markAllStudents = (day, status) => {
    if (!requirePermission('edit')) return

    if (localDate(new Date(selectedYear, selectedMonth, day)) > localDate()) { showToast('Future dates cannot be marked', 'error'); return }
    const classKey = String(selectedClassId)
    const updated = { ...(currentAtt || {}) }
    classStudents.forEach(s => { updated[s.id] = { ...(updated[s.id] || {}), [day]: status } })
    setStudentAttendance(prev => ({ ...prev, [classKey]: { ...(prev[classKey] || {}), [monthKey]: updated } }))
    showToast(`Marked all students ${STATUS_MAP[status]} for ${MONTHS[selectedMonth]} ${day}`)
    setBulkDay(null)
  }

  const markAllTeachers = (day, status) => {
    if (!requirePermission('edit')) return

    if (localDate(new Date(selectedYear, selectedMonth, day)) > localDate()) { showToast('Future dates cannot be marked', 'error'); return }
    const updated = { ...(currentTeaAtt || {}) }
    staff.forEach(s => { updated[s.id] = { ...(updated[s.id] || {}), [day]: status } })
    setTeacherAttendance(prev => ({ ...prev, [monthKey]: updated }))
    showToast(`Marked all staff ${STATUS_MAP[status]} for ${MONTHS[selectedMonth]} ${day}`)
    setBulkDay(null)
  }

  // ── Per-person stats ───────────────────────────────────────────────────────
  const getPersonStats = record => attendanceStats(record, daysInMonth, selectedYear, selectedMonth)

  // ── Sorting ────────────────────────────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }
  const sortIcon = (key) => {
    if (sortKey !== key) return <i className="fa-solid fa-sort" style={{ fontSize: 9, marginLeft: 4, opacity: 0.3 }} />
    return sortDir === 'asc'
      ? <i className="fa-solid fa-sort-up"   style={{ fontSize: 9, marginLeft: 4, color: 'var(--accent)' }} />
      : <i className="fa-solid fa-sort-down" style={{ fontSize: 9, marginLeft: 4, color: 'var(--accent)' }} />
  }

  const filteredStudents = useMemo(() => {
    let list = [...classStudents]
    const q = searchQuery.toLowerCase()
    if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || String(s.rollNo).includes(q))
    list.sort((a,b) => {
      const sa = getPersonStats(currentAtt[a.id])
      const sb = getPersonStats(currentAtt[b.id])
      let va, vb
      if (sortKey==='name') { va=a.name; vb=b.name }
      else if (sortKey==='rollNo') { va=a.rollNo||0; vb=b.rollNo||0 }
      else if (sortKey==='pct') { va=sa.pct; vb=sb.pct }
      else { va=a.name; vb=b.name }
      if (va<vb) return sortDir==='asc'?-1:1
      if (va>vb) return sortDir==='asc'?1:-1
      return 0
    })
    return list
  }, [classStudents, searchQuery, sortKey, sortDir, currentAtt, daysInMonth])

  const filteredStaff = useMemo(() => {
    let list = [...staff]
    const q = searchQuery.toLowerCase()
    if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || (s.department||'').toLowerCase().includes(q))
    list.sort((a,b) => {
      const sa = getPersonStats(currentTeaAtt[a.id])
      const sb = getPersonStats(currentTeaAtt[b.id])
      let va, vb
      if (sortKey==='name') { va=a.name; vb=b.name }
      else if (sortKey==='pct') { va=sa.pct; vb=sb.pct }
      else { va=a.name; vb=b.name }
      if (va<vb) return sortDir==='asc'?-1:1
      if (va>vb) return sortDir==='asc'?1:-1
      return 0
    })
    return list
  }, [staff, searchQuery, sortKey, sortDir, currentTeaAtt, daysInMonth])

  // ── Analytics data ─────────────────────────────────────────────────────────
  let workingDaysInMonth = 0
  for (let d=1; d<=daysInMonth; d++) {
    if (new Date(selectedYear, selectedMonth, d).getDay() !== 0) workingDaysInMonth++
  }

  const analyticsData = useMemo(() => {
    const classStats = classes.map(cls => {
      const clsStu = students.filter(s => String(s.classId) === String(cls.id))
      const clsAtt = studentAttendance[String(cls.id)]?.[monthKey] || {}
      let totalP=0, totalA=0, totalL=0, totalH=0
      clsStu.forEach(s => {
        for (let d=1; d<=daysInMonth; d++) {
          const st = clsAtt[s.id]?.[d] || 'U'
          if (st==='P') totalP++; else if (st==='A') totalA++; else if (st==='L') totalL++; else totalH++
        }
      })
      const totalWorking = (daysInMonth * clsStu.length) - totalH
      const avgPct = totalWorking > 0 ? Math.round(((totalP+totalL)/totalWorking)*100) : 0
      const teacher = staff.find(s => s.id === cls.classTeacherId)
      return { cls, studentCount: clsStu.length, totalP, totalA, totalL, totalH, avgPct, teacher }
    })
    const totalStudents = classStats.reduce((a,c) => a + c.studentCount, 0)
    const schoolAvgPct  = classStats.length > 0 ? Math.round(classStats.reduce((a,c)=>a+c.avgPct,0)/classStats.length) : 0
    const bestClass     = classStats.length > 0 ? classStats.reduce((b,c)=>c.avgPct>b.avgPct?c:b, classStats[0]) : null
    return { classStats, totalStudents, schoolAvgPct, bestClass }
  }, [classes, students, studentAttendance, monthKey, daysInMonth, staff])

  const perStudentData = useMemo(() => {
    let list = analyticsClassFilter === 'all' ? students : students.filter(s => String(s.classId)===String(analyticsClassFilter))
    return list.map(s => {
      const rec = studentAttendance[String(s.classId)]?.[monthKey]?.[s.id] || {}
      const stats = getPersonStats(rec)
      const cls = classes.find(c => String(c.id)===String(s.classId))
      return { ...s, ...stats, className: cls ? `${cls.name}${cls.section?' - '+cls.section:''}` : '—' }
    })
  }, [students, studentAttendance, monthKey, daysInMonth, analyticsClassFilter, classes])

  const perTeacherData = useMemo(() => staff.map(s => {
    const stats = getPersonStats(currentTeaAtt[s.id])
    const assignedClasses = classes.filter(c => c.classTeacherId===s.id).map(c => `${c.name}${c.section?' - '+c.section:''}`)
    return { ...s, ...stats, assignedClasses }
  }), [staff, currentTeaAtt, daysInMonth, classes])

  // ── Month options ──────────────────────────────────────────────────────────
  const monthOptions = []
  for (let i=0; i<12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push({ month: d.getMonth(), year: d.getFullYear(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` })
  }

  // ── Detail person ──────────────────────────────────────────────────────────
  const detailPersonData = useMemo(() => {
    if (!detailPerson) return null
    if (detailPerson.type === 'student') {
      const s = students.find(s => s.id === detailPerson.id)
      if (!s) return null
      const rec = currentAtt[s.id] || {}
      const stats = getPersonStats(rec)
      return { person: s, record: rec, stats, type: 'student' }
    } else {
      const s = staff.find(s => s.id === detailPerson.id)
      if (!s) return null
      const rec = currentTeaAtt[s.id] || {}
      const stats = getPersonStats(rec)
      return { person: s, record: rec, stats, type: 'teacher' }
    }
  }, [detailPerson, students, staff, currentAtt, currentTeaAtt, daysInMonth])

  // ── Print ──────────────────────────────────────────────────────────────────
  const printStudentRegister = () => {
    const monthName = MONTHS[selectedMonth]
    const className = getClassName(selectedClassId)
    const rowsHtml = filteredStudents.map(s => {
      const stats = getPersonStats(currentAtt[s.id])
      let dayCells = ''
      for (let d=1; d<=daysInMonth; d++) {
        const st = currentAtt[s.id]?.[d] || 'U'
        const color = st==='P'?'#16a34a':st==='A'?'#dc2626':st==='L'?'#d97706':'#94a3b8'
        dayCells += `<td style="text-align:center;font-size:9px;font-weight:700;color:${color}">${st}</td>`
      }
      return `<tr>
        <td style="font-weight:700;white-space:nowrap">${s.name}</td>
        <td style="text-align:center">${s.rollNo||'—'}</td>
        ${dayCells}
        <td style="text-align:center;font-weight:700;color:#16a34a">${stats.p}</td>
        <td style="text-align:center;font-weight:700;color:#dc2626">${stats.a}</td>
        <td style="text-align:center;font-weight:800">${stats.pct}%</td>
      </tr>`
    }).join('')
    let dayHeaders = ''
    for (let d=1; d<=daysInMonth; d++) {
      dayHeaders += `<th style="text-align:center;min-width:20px;font-size:9px">${d}</th>`
    }
    const win = window.open('', '_blank')
    if (!win) return
    writePrintDocument(win, `<!DOCTYPE html><html><head><title>Attendance — ${className} — ${monthName} ${selectedYear}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family:'Inter',sans-serif; color:#1e293b; margin:0; padding:20px; -webkit-print-color-adjust:exact; }
        .hdr { border-bottom:3px solid #3b82f6; padding-bottom:10px; margin-bottom:16px; }
        .hdr h1 { font-size:20px; color:#1e3a8a; margin:0; }
        .hdr p { font-size:12px; color:#64748b; margin:4px 0 0; }
        table { width:100%; border-collapse:collapse; font-size:11px; }
        th { background:#1e3a8a; color:#fff; padding:6px 4px; text-transform:uppercase; font-size:9px; }
        td { padding:5px 4px; border-bottom:1px solid #e2e8f0; }
        tr:nth-child(even) td { background:#f8fafc; }
        .btn { position:fixed; bottom:20px; right:20px; background:#3b82f6; color:#fff; padding:10px 20px; border:none; border-radius:8px; font-weight:700; cursor:pointer; }
        @media print { .btn { display:none; } }
      </style></head><body>
      <button class="btn" onclick="window.print()">🖨️ Print</button>
      <div class="hdr">
        <h1>🏫 Sunrise Public School — Attendance Register</h1>
        <p>${className} | ${monthName} ${selectedYear} | Working Days: ${workingDaysInMonth}</p>
        ${classTeacher ? `<p>Class Teacher: <strong>${classTeacher.name}</strong> | ${classTeacher.phone}</p>` : ''}
      </div>
      <table><thead><tr>
        <th style="text-align:left;min-width:120px">Student</th>
        <th style="text-align:center;min-width:36px">Roll</th>
        ${dayHeaders}
        <th style="text-align:center">P</th>
        <th style="text-align:center">A</th>
        <th style="text-align:center">%</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      </body></html>`)
    win.document.close(); win.focus()
  }

  const pctBadge = (pct) => (
    <span style={{ fontWeight:800, fontSize:11, padding:'2px 8px', borderRadius:20,
      color: pct>=75?'var(--green)':pct>=50?'var(--amber)':'var(--red)',
      background: pct>=75?'var(--greenbg)':pct>=50?'var(--amberbg)':'var(--redbg)' }}>
      {pct}%
    </span>
  )

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1><i className="fa-solid fa-clipboard-user" style={{ color: 'var(--accent)', marginRight: 8 }}></i>Attendance Management</h1>
          <p>Track daily attendance, view calendar overview, and generate reports.</p>
        </div>
        <div className="settings-actions">
          {activeTab === 'students' && selectedClassId && (
            <button className="btn btn-ghost" onClick={printStudentRegister}>
              <i className="fa-solid fa-print"></i> Print Register
            </button>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="roles-table-card" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        {activeTab === 'students' && (
          <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 5 }}>Class</label>
            <select aria-label="Class" className="form-select" value={selectedClassId} onChange={e => { setSelectedClassId(Number(e.target.value)||''); setDetailPerson(null) }}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>)}
            </select>
          </div>
        )}
        <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: 5 }}>Month</label>
          <select aria-label="Month" className="form-select" value={`${selectedMonth}-${selectedYear}`} onChange={e => {
            const [m,y] = e.target.value.split('-').map(Number)
            setSelectedMonth(m); setSelectedYear(y); setDetailPerson(null)
          }}>
            {monthOptions.map(o => <option key={o.label} value={`${o.month}-${o.year}`}>{o.label}</option>)}
          </select>
        </div>
        {(activeTab === 'students' || activeTab === 'teachers') && (
          <div className="roles-search" style={{ margin: 0, flex: 1, minWidth: 160 }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input aria-label="Search Query"
              placeholder={activeTab==='students' ? 'Search student or roll...' : 'Search staff or dept...'}
              value={searchQuery}
              onChange={e => setSQ(e.target.value)}
            />
            {searchQuery && <button aria-label="Close" className="roles-search-clear" onClick={() => setSQ('')}><i className="fa-solid fa-xmark"></i></button>}
          </div>
        )}
        {/* Legend */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginLeft: 'auto' }}>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <span key={k} style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[k], background: STATUS_BG[k], padding: '2px 8px', borderRadius: 20 }}>
              {k} = {v}
            </span>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-nav" style={{ marginBottom: 20 }}>
        <button className={activeTab==='students' ?'active':''} onClick={() => { setActiveTab('students'); setDetailPerson(null); setSQ('') }}>
          <i className="fa-solid fa-user-graduate"></i> Students
        </button>
        <button className={activeTab==='teachers' ?'active':''} onClick={() => { setActiveTab('teachers'); setDetailPerson(null); setSQ('') }}>
          <i className="fa-solid fa-chalkboard-user"></i> Teachers
        </button>
        <button className={activeTab==='analytics'?'active':''} onClick={() => { setActiveTab('analytics'); setDetailPerson(null) }}>
          <i className="fa-solid fa-chart-bar"></i> Analytics
        </button>
      </div>

      {/* ── STUDENT TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'students' && (
        <div>
          {/* Class Teacher Info Bar */}
          {classTeacher && (
            <div className="roles-table-card" style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                {classTeacher.name.split(' ').map(p => p[0]).join('').slice(0,2)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>{classTeacher.name}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{classTeacher.role} • {classTeacher.department}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span><strong>{classStudents.length}</strong> Students</span>
                <span><strong>{workingDaysInMonth}</strong> Working Days</span>
                <span>{MONTHS[selectedMonth]} {selectedYear}</span>
              </div>
            </div>
          )}

          {/* Stats overview cards */}
          {classStudents.length > 0 && (() => {
            let totalP=0, totalA=0, totalL=0, total=0
            classStudents.forEach(s => {
              const stats = getPersonStats(currentAtt[s.id])
              totalP += stats.p; totalA += stats.a; totalL += stats.l; total++
            })
            const avgPct = total > 0 ? Math.round((totalP+totalL)/((workingDaysInMonth*total)||1)*100) : 0
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 18 }}>
                {[
                  { l: 'Avg Attendance', v: `${avgPct}%`, ic: 'fa-chart-line', col: avgPct>=75?'var(--green)':avgPct>=50?'var(--amber)':'var(--red)', bg: avgPct>=75?'var(--greenbg)':avgPct>=50?'var(--amberbg)':'var(--redbg)' },
                  { l: 'Total Students', v: total,         ic: 'fa-users',      col: 'var(--blue)',   bg: 'var(--bluebg)'   },
                  { l: 'Total Present',  v: totalP,        ic: 'fa-circle-check',col: 'var(--green)',  bg: 'var(--greenbg)'  },
                  { l: 'Total Absent',   v: totalA,        ic: 'fa-circle-xmark',col: 'var(--red)',    bg: 'var(--redbg)'    },
                  { l: 'Total Late',     v: totalL,        ic: 'fa-clock',       col: 'var(--amber)',  bg: 'var(--amberbg)'  },
                ].map(({ l, v, ic, col, bg }) => (
                  <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: bg, color: col, display: 'grid', placeItems: 'center', fontSize: 15 }}>
                      <i className={`fa-solid ${ic}`}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>{v}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Calendar Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {filteredStudents.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <i className="fa-solid fa-user-graduate" style={{ fontSize: 32, marginBottom: 12, display: 'block' }}></i>
                No students found.
              </div>
            ) : filteredStudents.map(s => {
              const stats = getPersonStats(currentAtt[s.id])
              const isDetail = detailPerson?.type === 'student' && detailPerson?.id === s.id
              return (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--bg2)', border: `1px solid ${isDetail ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    boxShadow: isDetail ? '0 0 0 2px var(--accent)' : undefined,
                    transition: 'box-shadow 0.2s, border-color 0.2s'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: stats.pct>=75?'var(--greenbg)':stats.pct>=50?'var(--amberbg)':'var(--redbg)', color: stats.pct>=75?'var(--green)':stats.pct>=50?'var(--amber)':'var(--red)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {s.name.split(' ').map(p=>p[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>Roll {s.rollNo||'—'} • {s.admissionNo}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {pctBadge(stats.pct)}
                    </div>
                  </div>

                  {/* Calendar */}
                  <div style={{ padding: '10px 12px' }}>
                    <AttendanceCalendar
                      personId={s.id}
                      record={currentAtt[s.id]}
                      month={selectedMonth}
                      year={selectedYear}
                      onToggle={toggleStudent}
                    />
                    <StatPills stats={{ p: stats.p, a: stats.a, l: stats.l, h: stats.h, pct: stats.pct }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bulk Mark Row */}
          {classStudents.length > 0 && (
            <div className="roles-table-card" style={{ marginTop: 18, padding: '14px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-bolt" style={{ color: 'var(--amber)' }}></i>
                Bulk Mark — {MONTHS[selectedMonth]} {selectedYear}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                {/* Weekday headers */}
                {WEEKDAYS_SHORT.map(wd => (
                  <div key={wd} style={{ textAlign:'center', fontSize:9, fontWeight:700, color:'var(--t3)', padding:'2px 0' }}>{wd}</div>
                ))}
                {/* Blank cells */}
                {Array.from({ length: firstDayOfMonth(selectedMonth, selectedYear) }).map((_,i) => <div key={`b${i}`} />)}
                {/* Day buttons */}
                {Array.from({ length: daysInMonth }, (_, i) => i+1).map(d => {
                  const dow = new Date(selectedYear, selectedMonth, d).getDay()
                  const isSun = dow === 0
                  return (
                    <button
                      key={d}
                      onClick={() => setBulkDay(d)}
                      title={`Bulk mark Day ${d}`}
                      style={{
                        border: '1px solid var(--border)', borderRadius: 6, padding: '4px 2px',
                        background: isSun ? 'var(--bg3)' : 'var(--bg3)', color: isSun ? 'var(--t3)' : 'var(--t2)',
                        fontWeight: 700, fontSize: 11, cursor: 'pointer', textAlign: 'center',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--accent)' || (e.currentTarget.style.color='#fff')}
                      onMouseLeave={e => e.currentTarget.style.background=isSun?'var(--bg3)':'var(--bg3)' || (e.currentTarget.style.color=isSun?'var(--t3)':'var(--t2)')}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
              <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Click a date to bulk-mark all students for that day.</p>
            </div>
          )}
        </div>
      )}

      {/* ── TEACHER TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'teachers' && (
        <div>
          {/* Overview */}
          {staff.length > 0 && (() => {
            let totalP=0, totalA=0, totalL=0
            staff.forEach(s => {
              const stats = getPersonStats(currentTeaAtt[s.id])
              totalP += stats.p; totalA += stats.a; totalL += stats.l
            })
            const avgPct = staff.length > 0 ? Math.round((totalP+totalL)/((workingDaysInMonth*staff.length)||1)*100) : 0
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 18 }}>
                {[
                  { l: 'Avg Attendance', v: `${avgPct}%`, ic: 'fa-chart-line', col: avgPct>=75?'var(--green)':avgPct>=50?'var(--amber)':'var(--red)', bg: avgPct>=75?'var(--greenbg)':avgPct>=50?'var(--amberbg)':'var(--redbg)' },
                  { l: 'Total Staff',    v: staff.length, ic: 'fa-chalkboard-user', col: 'var(--blue)',   bg: 'var(--bluebg)' },
                  { l: 'Total Present',  v: totalP,       ic: 'fa-circle-check',    col: 'var(--green)',  bg: 'var(--greenbg)' },
                  { l: 'Total Absent',   v: totalA,       ic: 'fa-circle-xmark',    col: 'var(--red)',    bg: 'var(--redbg)' },
                  { l: 'Total Late',     v: totalL,       ic: 'fa-clock',           col: 'var(--amber)',  bg: 'var(--amberbg)' },
                ].map(({ l, v, ic, col, bg }) => (
                  <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: bg, color: col, display: 'grid', placeItems: 'center', fontSize: 15 }}>
                      <i className={`fa-solid ${ic}`}></i>
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>{v}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>{l}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Teacher Calendar Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filteredStaff.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--t3)', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <i className="fa-solid fa-chalkboard-user" style={{ fontSize: 32, marginBottom: 12, display: 'block' }}></i>
                No staff found.
              </div>
            ) : filteredStaff.map(s => {
              const stats = getPersonStats(currentTeaAtt[s.id])
              const assignedClasses = classes.filter(c => c.classTeacherId === s.id)
              return (
                <div
                  key={s.id}
                  style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: stats.pct>=75?'var(--greenbg)':stats.pct>=50?'var(--amberbg)':'var(--redbg)', color: stats.pct>=75?'var(--green)':stats.pct>=50?'var(--amber)':'var(--red)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {s.name.split(' ').map(p=>p[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>{s.role} • {s.department}</div>
                      {assignedClasses.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
                          Class Teacher: {assignedClasses.map(c=>`${c.name}${c.section?` - ${c.section}`:''}`).join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0 }}>{pctBadge(stats.pct)}</div>
                  </div>

                  {/* Calendar */}
                  <div style={{ padding: '10px 12px' }}>
                    <AttendanceCalendar
                      personId={s.id}
                      record={currentTeaAtt[s.id]}
                      month={selectedMonth}
                      year={selectedYear}
                      onToggle={toggleTeacher}
                    />
                    <StatPills stats={{ p: stats.p, a: stats.a, l: stats.l, h: stats.h, pct: stats.pct }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Teacher Bulk Mark */}
          <div className="roles-table-card" style={{ marginTop: 18, padding: '14px 18px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-bolt" style={{ color: 'var(--amber)' }}></i>
              Bulk Mark Teachers — {MONTHS[selectedMonth]} {selectedYear}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {WEEKDAYS_SHORT.map(wd => (
                <div key={wd} style={{ textAlign:'center', fontSize:9, fontWeight:700, color:'var(--t3)', padding:'2px 0' }}>{wd}</div>
              ))}
              {Array.from({ length: firstDayOfMonth(selectedMonth, selectedYear) }).map((_,i) => <div key={`b${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i+1).map(d => {
                const isSun = new Date(selectedYear, selectedMonth, d).getDay() === 0
                return (
                  <button
                    key={d}
                    onClick={() => setBulkDay(`t-${d}`)}
                    style={{
                      border: '1px solid var(--border)', borderRadius: 6, padding: '4px 2px',
                      background: 'var(--bg3)', color: isSun ? 'var(--t3)' : 'var(--t2)',
                      fontWeight: 700, fontSize: 11, cursor: 'pointer', textAlign: 'center',
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Click a date to bulk-mark all teachers for that day.</p>
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
            {[
              { l: 'Total Students',   v: analyticsData.totalStudents,  ic: 'fa-users',          col: 'var(--blue)',   bg: 'var(--bluebg)' },
              { l: 'School Avg Att.',  v: `${analyticsData.schoolAvgPct}%`, ic: 'fa-chart-line', col: 'var(--green)',  bg: 'var(--greenbg)' },
              { l: 'Working Days',     v: workingDaysInMonth,           ic: 'fa-calendar-check', col: 'var(--purple)', bg: 'var(--purplebg)' },
              { l: 'Best Class',       v: analyticsData.bestClass ? `${analyticsData.bestClass.cls.name}${analyticsData.bestClass.cls.section?' - '+analyticsData.bestClass.cls.section:''} (${analyticsData.bestClass.avgPct}%)` : '—', ic: 'fa-trophy', col: 'var(--amber)', bg: 'var(--amberbg)' },
              { l: 'Total Staff',      v: staff.length,                 ic: 'fa-chalkboard-user',col: 'var(--blue)',   bg: 'var(--bluebg)' },
            ].map(({ l, v, ic, col, bg }) => (
              <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: bg, color: col, display: 'grid', placeItems: 'center', fontSize: 16 }}>
                  <i className={`fa-solid ${ic}`}></i>
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--t1)' }}>{v}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>{l}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { k: 'class',   l: 'Per Class',   ic: 'fa-school' },
              { k: 'student', l: 'Per Student',  ic: 'fa-user-graduate' },
              { k: 'teacher', l: 'Per Teacher',  ic: 'fa-chalkboard-user' },
            ].map(t => (
              <button key={t.k} onClick={() => { setAnalyticsSubTab(t.k); setSQ('') }}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                  background: analyticsSubTab===t.k ? 'var(--accent)' : 'var(--bg2)',
                  color: analyticsSubTab===t.k ? '#fff' : 'var(--t2)',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <i className={`fa-solid ${t.ic}`}></i> {t.l}
              </button>
            ))}
            {analyticsSubTab === 'student' && (
              <select aria-label="Analytics Class Filter" className="form-select" value={analyticsClassFilter} onChange={e => setAnalyticsClassFilter(e.target.value)} style={{ marginLeft: 8, maxWidth: 200, fontSize: 12 }}>
                <option value="all">All Classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section?` - ${c.section}`:''}</option>)}
              </select>
            )}
            <div className="roles-search" style={{ margin: 0, marginLeft: 'auto', maxWidth: 220 }}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <input aria-label="Search..." placeholder="Search..." value={searchQuery} onChange={e => setSQ(e.target.value)} style={{ fontSize: 12 }} />
              {searchQuery && <button aria-label="Close" className="roles-search-clear" onClick={() => setSQ('')}><i className="fa-solid fa-xmark"></i></button>}
            </div>
          </div>

          {/* ── Per-Class ── */}
          {analyticsSubTab === 'class' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {analyticsData.classStats.filter(cs => {
                const q = searchQuery.toLowerCase()
                return !q || cs.cls.name.toLowerCase().includes(q) || (cs.cls.section||'').toLowerCase().includes(q) || (cs.teacher?.name||'').toLowerCase().includes(q)
              }).map(cs => {
                const avgPct = cs.avgPct
                return (
                  <div key={cs.cls.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--bluebg)', color: 'var(--blue)', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>
                        <i className="fa-solid fa-school"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{cs.cls.name}{cs.cls.section ? ` - ${cs.cls.section}` : ''}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{cs.studentCount} students • {cs.teacher?.name || 'No teacher'}</div>
                      </div>
                      {pctBadge(avgPct)}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      {/* Progress bar */}
                      <div style={{ background: 'var(--bg3)', borderRadius: 20, height: 8, overflow: 'hidden', marginBottom: 10 }}>
                        <div style={{ width: `${avgPct}%`, height: '100%', borderRadius: 20, background: avgPct>=75?'var(--green)':avgPct>=50?'var(--amber)':'var(--red)', transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, textAlign: 'center' }}>
                        {[
                          { l: 'Present', v: cs.totalP, col: STATUS_COLORS.P, bg: STATUS_BG.P },
                          { l: 'Absent',  v: cs.totalA, col: STATUS_COLORS.A, bg: STATUS_BG.A },
                          { l: 'Late',    v: cs.totalL, col: STATUS_COLORS.L, bg: STATUS_BG.L },
                          { l: 'Holiday', v: cs.totalH, col: STATUS_COLORS.H, bg: STATUS_BG.H },
                        ].map(({ l, v, col, bg }) => (
                          <div key={l} style={{ background: bg, borderRadius: 6, padding: '6px 4px' }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: col }}>{v}</div>
                            <div style={{ fontSize: 9, color: col, opacity: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Per-Student Summary Table ── */}
          {analyticsSubTab === 'student' && (
            <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  <i className="fa-solid fa-user-graduate" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
                  Student-Wise Summary — {MONTHS[selectedMonth]} {selectedYear}
                </div>
              </div>
              <div className="table-wrap">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>Student {sortIcon('name')}</th>
                      <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => toggleSort('rollNo')}>Roll {sortIcon('rollNo')}</th>
                      <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('className')}>Class {sortIcon('className')}</th>
                      <th style={{ textAlign: 'center' }}>Working Days</th>
                      <th style={{ textAlign: 'center', color: STATUS_COLORS.P }}>Present</th>
                      <th style={{ textAlign: 'center', color: STATUS_COLORS.A }}>Absent</th>
                      <th style={{ textAlign: 'center', color: STATUS_COLORS.L }}>Late</th>
                      <th style={{ textAlign: 'center' }}>Holiday</th>
                      <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => toggleSort('pct')}>Att % {sortIcon('pct')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perStudentData
                      .filter(s => { const q = searchQuery.toLowerCase(); return !q || s.name.toLowerCase().includes(q) || String(s.rollNo).includes(q) || s.className.toLowerCase().includes(q) })
                      .sort((a,b) => {
                        let va, vb
                        if (sortKey==='name') { va=a.name; vb=b.name }
                        else if (sortKey==='rollNo') { va=a.rollNo||0; vb=b.rollNo||0 }
                        else if (sortKey==='className') { va=a.className; vb=b.className }
                        else if (sortKey==='pct') { va=a.pct; vb=b.pct }
                        else { va=a.name; vb=b.name }
                        if (va<vb) return sortDir==='asc'?-1:1
                        if (va>vb) return sortDir==='asc'?1:-1
                        return 0
                      })
                      .map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700 }}>{s.name}</td>
                          <td style={{ textAlign: 'center' }}>{s.rollNo||'—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--t2)' }}>{s.className}</td>
                          <td style={{ textAlign: 'center' }}>{s.wd}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: STATUS_COLORS.P }}>{s.p}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: STATUS_COLORS.A }}>{s.a}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: STATUS_COLORS.L }}>{s.l}</td>
                          <td style={{ textAlign: 'center', color: '#94a3b8' }}>{s.h}</td>
                          <td style={{ textAlign: 'center' }}>{pctBadge(s.pct)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Per-Teacher Summary Table ── */}
          {analyticsSubTab === 'teacher' && (
            <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  <i className="fa-solid fa-chalkboard-user" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
                  Teacher-Wise Summary — {MONTHS[selectedMonth]} {selectedYear}
                </div>
              </div>
              <div className="table-wrap">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>Teacher {sortIcon('name')}</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th style={{ textAlign: 'center' }}>Working Days</th>
                      <th style={{ textAlign: 'center', color: STATUS_COLORS.P }}>Present</th>
                      <th style={{ textAlign: 'center', color: STATUS_COLORS.A }}>Absent</th>
                      <th style={{ textAlign: 'center', color: STATUS_COLORS.L }}>Late</th>
                      <th style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => toggleSort('pct')}>Att % {sortIcon('pct')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perTeacherData
                      .filter(s => { const q = searchQuery.toLowerCase(); return !q || s.name.toLowerCase().includes(q) || (s.department||'').toLowerCase().includes(q) })
                      .sort((a,b) => {
                        let va, vb
                        if (sortKey==='name') { va=a.name; vb=b.name }
                        else if (sortKey==='pct') { va=a.pct; vb=b.pct }
                        else { va=a.name; vb=b.name }
                        if (va<vb) return sortDir==='asc'?-1:1
                        if (va>vb) return sortDir==='asc'?1:-1
                        return 0
                      })
                      .map(s => (
                        <tr key={s.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{s.name}</div>
                            {s.assignedClasses.length > 0 && <div style={{ fontSize: 10, color: 'var(--accent)' }}>Class Teacher: {s.assignedClasses.join(', ')}</div>}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--t3)' }}>{s.department}</td>
                          <td style={{ fontSize: 12 }}>{s.role}</td>
                          <td style={{ textAlign: 'center' }}>{s.wd}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: STATUS_COLORS.P }}>{s.p}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: STATUS_COLORS.A }}>{s.a}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: STATUS_COLORS.L }}>{s.l}</td>
                          <td style={{ textAlign: 'center' }}>{pctBadge(s.pct)}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BULK MARK MODAL ──────────────────────────────────────────────────── */}
      {bulkDay !== null && (
        <Dialog className="modal-overlay">
          <div className="modal-panel" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-bolt" style={{ color: 'var(--amber)', marginRight: 8 }}></i>
                  Bulk Mark — {MONTHS[selectedMonth]} {typeof bulkDay === 'number' ? bulkDay : String(bulkDay).replace('t-','')}
                </h3>
                <p className="modal-sub">
                  {typeof bulkDay === 'number' ? `Mark all ${classStudents.length} students` : `Mark all ${staff.length} staff members`}
                </p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setBulkDay(null)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => {
                      if (typeof bulkDay === 'number') markAllStudents(bulkDay, k)
                      else markAllTeachers(Number(String(bulkDay).replace('t-', '')), k)
                    }}
                    style={{
                      padding: '14px 10px', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${STATUS_COLORS[k]}`,
                      background: STATUS_BG[k], color: STATUS_COLORS[k],
                      fontWeight: 800, fontSize: 15, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{k}</span>
                    <span style={{ fontSize: 12 }}>{v}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* TOAST */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast ${toast.type==='error'?'error':'success'}`}>
            <span>{toast.type==='error'?'❌':'✅'}</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </Layout>
  )
}
