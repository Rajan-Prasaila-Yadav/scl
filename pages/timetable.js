import { scheduleAssignmentError } from '../lib/academicAssignments'
import { getRaw, setRaw } from '../lib/storage'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import { intervalsOverlap } from '../lib/validation'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  INITIAL_TIMETABLE,
  INITIAL_PERIODS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_STAFF,
  readStoredList,
  writeStoredList,
  makeId,
} from '../lib/academicData'
import { exportToCSV, printToPDF } from '../lib/exportUtils'

const ALL_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const emptyPeriodForm = {
  name: '',
  type: 'Academic',
  startTime: '09:00',
  endTime: '09:45'
}

const emptyScheduleForm = {
  classId: '',
  selectedClassIds: [],
  day: 'Monday',
  periodId: '',
  subjectId: '',
  teacherId: '',
  room: '',
  formType: 'subject', // 'subject' | 'break'
  breakName: 'Recess'
}

// Duration Calculator Helper
const calculateDurationInMinutes = (start, end) => {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff : 0
}

export default function Timetable() {
  const [timetable, setTimetable] = useState([])
  const [periods, setPeriods] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Week configuration states
  const [weekStartDay, setWeekStartDay] = useState('Monday')
  const [activeDays, setActiveDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])

  // Tabs Nav
  const [activeTab, setActiveTab] = useState('grid') // 'grid' | 'periods'

  // View Settings (for Grid)
  const [viewMode, setViewMode] = useState('class') // 'class' | 'teacher'
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  // Schedule slot Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm)

  // Period manager Modal
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [editingPeriodId, setEditingPeriodId] = useState(null)
  const [periodForm, setPeriodForm] = useState(emptyPeriodForm)

  useEffect(() => {
    setTimetable(readStoredList(STORAGE_KEYS.timetable, INITIAL_TIMETABLE))
    setPeriods(readStoredList(STORAGE_KEYS.periods, INITIAL_PERIODS))
    
    const storedClasses = readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES)
    setClasses(storedClasses)
    if (storedClasses.length > 0) {
      setSelectedClassId(storedClasses[0].id)
    }

    const storedSubjects = readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS)
    setSubjects(storedSubjects)

    const storedStaff = readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF)
    setStaff(storedStaff)
    if (storedStaff.length > 0) {
      setSelectedTeacherId(storedStaff[0].id)
    }

    setRoles(readStoredList(STORAGE_KEYS.roles, []))
    
    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)

    const savedStart = getRaw('educore.weekStartDay') || 'Monday'
    setWeekStartDay(savedStart)
    const savedActive = getRaw('educore.activeDays')
    if (savedActive) {
      try {
        setActiveDays(JSON.parse(savedActive))
      } catch (e) {}
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.timetable, timetable)
  }, [timetable, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.periods, periods)
  }, [periods, hydrated])

  useEffect(() => {
    if (!hydrated) return
    setRaw('educore.weekStartDay', weekStartDay)
    setRaw('educore.activeDays', JSON.stringify(activeDays))
  }, [weekStartDay, activeDays, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Permissions check
  const hasEditPermission = useMemo(() => {
    if (currentUser === 'Super Admin') return true
    const activeStaff = staff.find((s) => String(s.id) === String(currentUser))
    if (!activeStaff) return false
    const activeRole = roles.find((r) => r.name === activeStaff.role)
    if (!activeRole) return false
    return (activeRole.permissions?.Timetable || []).includes('edit')
  }, [currentUser, staff, roles])

  // Dynamic timetable days computation
  const timetableDays = useMemo(() => {
    const startIndex = ALL_WEEKDAYS.indexOf(weekStartDay)
    const reordered = [
      ...ALL_WEEKDAYS.slice(startIndex),
      ...ALL_WEEKDAYS.slice(0, startIndex)
    ]
    return reordered.filter(day => activeDays.includes(day))
  }, [weekStartDay, activeDays])

  const toggleActiveDay = (day) => {
    if (!hasEditPermission) {
      showToast('You do not have permission to modify active days', 'error')
      return
    }
    setActiveDays(prev => {
      if (prev.includes(day)) {
        if (prev.length === 1) {
          showToast('Must have at least one active day', 'error')
          return prev
        }
        return prev.filter(d => d !== day)
      } else {
        return [...prev, day]
      }
    })
  }

  // Sort periods chronologically
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [periods])

  // Get filtered schedule entries
  const filteredTimetable = useMemo(() => {
    if (viewMode === 'class') {
      return timetable.filter((t) => String(t.classId) === String(selectedClassId))
    } else {
      return timetable.filter((t) => String(t.teacherId) === String(selectedTeacherId))
    }
  }, [timetable, viewMode, selectedClassId, selectedTeacherId])

  // Lookup helper for cells
  const getSlot = (day, pId) => {
    return filteredTimetable.find((t) => t.day === day && Number(t.periodId) === Number(pId))
  }

  const getSubjectName = (subId) => {
    return subjects.find((s) => s.id === Number(subId))?.name || 'Unknown'
  }

  const getTeacherName = (tId) => {
    return staff.find((s) => s.id === Number(tId))?.name || 'Unassigned'
  }

  const getClassName = (clsId) => {
    const cls = classes.find((c) => c.id === Number(clsId))
    if (!cls) return 'Class'
    return `${cls.name} - ${cls.section}`
  }

  // Live Durations for periods list
  const activePeriodDuration = useMemo(() => {
    return calculateDurationInMinutes(periodForm.startTime, periodForm.endTime)
  }, [periodForm.startTime, periodForm.endTime])

  // Search Matching Helper
  const isSlotMatched = (slot) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase().trim()
    if (slot.isBreak) {
      return (slot.breakName || '').toLowerCase().includes(query)
    }
    const subjectName = getSubjectName(slot.subjectId).toLowerCase()
    const teacherName = getTeacherName(slot.teacherId).toLowerCase()
    const className = getClassName(slot.classId).toLowerCase()
    const room = (slot.room || '').toLowerCase()
    return (
      subjectName.includes(query) ||
      teacherName.includes(query) ||
      className.includes(query) ||
      room.includes(query)
    )
  }

  // Exports data formatter
  const generateExportData = () => {
    const headers = ['Period & Time', ...timetableDays]
    const rows = sortedPeriods.map(p => {
      const timeStr = `${p.name} (${p.startTime} - ${p.endTime})`
      if (p.type === 'Break') {
        return [timeStr, ...timetableDays.map(() => `${p.name} Break`)]
      }
      
      const daySlots = timetableDays.map(day => {
        const slot = getSlot(day, p.id)
        if (!slot) return ''
        if (slot.isBreak) return slot.breakName || 'Break'
        
        const sub = getSubjectName(slot.subjectId)
        const roomStr = slot.room ? ` (Room ${slot.room})` : ''
        if (viewMode === 'class') {
          const teach = getTeacherName(slot.teacherId)
          return `${sub} - ${teach}${roomStr}`
        } else {
          const cls = getClassName(slot.classId)
          return `${sub} - ${cls}${roomStr}`
        }
      })
      
      return [timeStr, ...daySlots]
    })
    
    return { headers, rows }
  }

  const handleExportExcel = () => {
    const { headers, rows } = generateExportData()
    let filename = 'timetable.csv'
    if (viewMode === 'class') {
      const cls = classes.find(c => String(c.id) === String(selectedClassId))
      const className = cls ? `${cls.name}_${cls.section}` : 'class'
      filename = `timetable_class_${className}.csv`
    } else {
      const teacherName = getTeacherName(selectedTeacherId)
      filename = `timetable_teacher_${teacherName.replace(/\s+/g, '_')}.csv`
    }
    exportToCSV(filename, headers, rows)
    showToast('Excel CSV exported successfully', 'success')
  }

  const handleExportPDF = () => {
    const { headers, rows } = generateExportData()
    let title = 'School Timetable'
    let subtitle = ''
    if (viewMode === 'class') {
      const cls = classes.find(c => String(c.id) === String(selectedClassId))
      const className = cls ? `${cls.name} - Section ${cls.section}` : 'Class'
      title = `Weekly Class Timetable - ${className}`
      subtitle = `Schedule matrix for ${className}`
    } else {
      const teacherName = getTeacherName(selectedTeacherId)
      title = `Faculty Timetable - ${teacherName}`
      subtitle = `Teaching load schedules for ${teacherName}`
    }
    printToPDF(title, headers, rows, subtitle)
    showToast('PDF print layout opened', 'success')
  }

  // -------------------------------------------------------------
  // SCHEDULE MODAL FORM CONTROL
  // -------------------------------------------------------------
  const openAddSchedule = (dayName = '', pId = '') => {
    if (!hasEditPermission) {
      showToast('You do not have permission to manage schedules', 'error')
      return
    }

    const currentClass = classes.find((c) => String(c.id) === String(selectedClassId))
    const defaultRoom = currentClass ? currentClass.room : ''
    const initialClassId = viewMode === 'class' ? String(selectedClassId) : (classes[0]?.id || '')

    setScheduleForm({
      classId: initialClassId,
      selectedClassIds: [initialClassId],
      day: dayName || timetableDays[0] || 'Monday',
      periodId: String(pId),
      subjectId: '',
      teacherId: viewMode === 'teacher' ? String(selectedTeacherId) : '',
      room: defaultRoom,
      formType: 'subject',
      breakName: 'Recess'
    })
    setEditingScheduleId(null)
    setShowScheduleModal(true)
  }

  const openEditSchedule = (slot, e) => {
    e.stopPropagation()
    if (!hasEditPermission) {
      showToast('You do not have permission to edit schedules', 'error')
      return
    }
    setScheduleForm({
      classId: String(slot.classId),
      selectedClassIds: [String(slot.classId)],
      day: slot.day,
      periodId: String(slot.periodId),
      subjectId: slot.isBreak ? '' : String(slot.subjectId),
      teacherId: slot.isBreak ? '' : String(slot.teacherId),
      room: slot.room || '',
      formType: slot.isBreak ? 'break' : 'subject',
      breakName: slot.breakName || 'Recess'
    })
    setEditingScheduleId(slot.id)
    setShowScheduleModal(true)
  }

  const handleDeleteSchedule = (slotId, e) => {
    if (!requirePermission('delete')) return

    e.stopPropagation()
    if (!hasEditPermission) {
      showToast('You do not have permission to remove slots', 'error')
      return
    }
    if (!confirm('Are you sure you want to remove this scheduled slot?')) return
    setTimetable((prev) => prev.filter((t) => t.id !== slotId))
    showToast('Scheduled slot removed', 'info')
  }

  const handleSubjectChange = (subId) => {
    const selectedSubId = Number(subId)
    setScheduleForm(prev => {
      const next = { ...prev, subjectId: subId }
      const currentClass = classes.find(c => String(c.id) === String(prev.classId))
      if (currentClass && currentClass.subjectTeacherMap) {
        const assignedTeacherId = currentClass.subjectTeacherMap[String(selectedSubId)]
        if (assignedTeacherId) {
          next.teacherId = String(assignedTeacherId)
        }
      }
      return next
    })
  }

  const handleClassChangeInForm = (clsId) => {
    const currentClass = classes.find((c) => String(c.id) === String(clsId))
    const defaultRoom = currentClass ? currentClass.room : ''
    setScheduleForm(prev => ({
      ...prev,
      classId: clsId,
      room: defaultRoom,
      subjectId: '',
      teacherId: ''
    }))
  }

  // Conflict Validator checks
  const conflicts = useMemo(() => {
    if (!showScheduleModal) return { teacherConflict: null, roomConflict: null, classConflict: null }

    const isBreakForm = scheduleForm.formType === 'break'
    const targetTeacherId = Number(scheduleForm.teacherId)
    const targetRoom = scheduleForm.room.trim().toUpperCase()
    
    // For breaks, check conflicts for all selected class IDs
    const targetClassIds = isBreakForm 
      ? scheduleForm.selectedClassIds.map(Number)
      : [Number(scheduleForm.classId)]
      
    const targetDay = scheduleForm.day
    const targetPeriodId = Number(scheduleForm.periodId)

    let teacherConflict = null
    let roomConflict = null
    let classConflict = null

    if (!targetDay || !targetPeriodId) return { teacherConflict, roomConflict, classConflict }

    // Retrieve active period details
    const activePeriod = periods.find(p => p.id === targetPeriodId)
    const activePeriodName = activePeriod ? activePeriod.name : `Period ID: ${targetPeriodId}`

    timetable.forEach(t => {
      if (editingScheduleId && t.id === editingScheduleId) return

      const otherPeriod = periods.find(p => Number(p.id) === Number(t.periodId))
      if (t.day === targetDay && activePeriod && otherPeriod && intervalsOverlap(activePeriod.startTime,activePeriod.endTime,otherPeriod.startTime,otherPeriod.endTime)) {
        // 1. Class overlap check: target class or any of the target classes cannot have a slot
        if (targetClassIds.includes(Number(t.classId))) {
          const name = t.isBreak ? (t.breakName || 'Break') : getSubjectName(t.subjectId)
          classConflict = `Class ${getClassName(t.classId)} already has scheduled slot "${name}" during ${activePeriodName}!`
        }

        // Only validate teacher & room if scheduling a subject module (not a break)
        if (!isBreakForm) {
          // 2. Teacher clash: single teacher cannot be in two classes at the same time
          if (!t.isBreak && targetTeacherId && Number(t.teacherId) === targetTeacherId) {
            teacherConflict = `Teacher ${getTeacherName(targetTeacherId)} is already scheduled to teach in Class ${getClassName(t.classId)} during ${activePeriodName}!`
          }
          // 3. Room clash
          if (!t.isBreak && targetRoom && t.room && t.room.trim().toUpperCase() === targetRoom) {
            roomConflict = `Room ${targetRoom} is already booked by Class ${getClassName(t.classId)} during ${activePeriodName}!`
          }
        }
      }
    })

    return { teacherConflict, roomConflict, classConflict }
  }, [showScheduleModal, scheduleForm, timetable, editingScheduleId, periods, subjects, staff, classes])

  const submitScheduleForm = (e) => {
    e.preventDefault(); if (!requirePermission(editingScheduleId ? 'edit' : 'create')) return
    e.preventDefault()
    
    const isBreakForm = scheduleForm.formType === 'break'
    if (isBreakForm) {
      if (scheduleForm.selectedClassIds.length === 0 || !scheduleForm.breakName.trim()) {
        showToast('Please select at least one Class and fill in Break Name', 'error')
        return
      }
    } else {
      if (!scheduleForm.classId || !scheduleForm.periodId || !scheduleForm.subjectId || !scheduleForm.teacherId) {
        showToast('Please fill in Class, Period, Subject and Teacher', 'error')
        return
      }
    }

    if (!isBreakForm) {
      const assignmentIssue = scheduleAssignmentError(scheduleForm, classes, subjects, staff)
      if (assignmentIssue) { showToast(assignmentIssue, 'error'); return }
    }

    if (conflicts.teacherConflict) {
      alert(`Teacher Clash Detected:\n${conflicts.teacherConflict}\n\nPlease choose a different period or a different teacher.`);
      return
    }
    if (conflicts.roomConflict) {
      alert(`Room Clash Detected:\n${conflicts.roomConflict}\n\nPlease change classroom location or period.`);
      return
    }
    if (conflicts.classConflict) {
      alert(`Class Overlap Detected:\n${conflicts.classConflict}\n\nPlease resolve the conflict.`);
      return
    }

    if (isBreakForm) {
      // Create entries for each selected class
      setTimetable(prev => {
        // If editing, remove the single slot that was being edited first
        const base = editingScheduleId ? prev.filter(t => t.id !== editingScheduleId) : prev
        const newSlots = scheduleForm.selectedClassIds.map(cid => ({
          id: makeId(),
          classId: Number(cid),
          day: scheduleForm.day,
          periodId: Number(scheduleForm.periodId),
          isBreak: true,
          breakName: scheduleForm.breakName.trim(),
          subjectId: '',
          teacherId: '',
          room: ''
        }))
        return [...base, ...newSlots]
      })
      showToast('Custom breaks scheduled successfully', 'success')
    } else {
      const payload = {
        classId: Number(scheduleForm.classId),
        day: scheduleForm.day,
        periodId: Number(scheduleForm.periodId),
        subjectId: Number(scheduleForm.subjectId),
        teacherId: Number(scheduleForm.teacherId),
        room: scheduleForm.room.trim() || 'General',
        isBreak: false,
        breakName: ''
      }

      if (editingScheduleId) {
        setTimetable(prev => prev.map(t => t.id === editingScheduleId ? { ...t, ...payload } : t))
        showToast('Timetable schedule slot updated successfully', 'success')
      } else {
        const newId = makeId()
        setTimetable(prev => [...prev, { id: newId, ...payload }])
        showToast('New slot scheduled successfully', 'success')
      }
    }

    setShowScheduleModal(false)
  }

  // -------------------------------------------------------------
  // PERIOD CONFIG MODAL FORM CONTROL
  // -------------------------------------------------------------
  const openAddPeriod = () => {
    if (!hasEditPermission) {
      showToast('You do not have permission to manage periods', 'error')
      return
    }
    setPeriodForm(emptyPeriodForm)
    setEditingPeriodId(null)
    setShowPeriodModal(true)
  }

  const openEditPeriod = (p) => {
    if (!hasEditPermission) {
      showToast('You do not have permission to edit periods', 'error')
      return
    }
    setPeriodForm({
      name: p.name,
      type: p.type,
      startTime: p.startTime,
      endTime: p.endTime
    })
    setEditingPeriodId(p.id)
    setShowPeriodModal(true)
  }

  const handleDeletePeriod = (pId) => {
    if (!requirePermission('delete')) return

    if (!hasEditPermission) {
      showToast('You do not have permission to remove periods', 'error')
      return
    }
    if (!confirm('Are you sure you want to delete this period? This will clear all scheduled subjects associated with it.')) return
    
    setPeriods(prev => prev.filter(p => p.id !== pId))
    setTimetable(prev => prev.filter(t => Number(t.periodId) !== Number(pId)))
    showToast('Period structure deleted successfully', 'info')
  }

  const submitPeriodForm = (e) => {
    e.preventDefault(); if (!requirePermission(editingPeriodId ? 'edit' : 'create')) return
    if (periods.some(p => p.id !== editingPeriodId && intervalsOverlap(p.startTime,p.endTime,periodForm.startTime,periodForm.endTime))) { showToast('This period overlaps another period. Choose a non-overlapping time.', 'error'); return }
    e.preventDefault()
    if (!periodForm.name || !periodForm.startTime || !periodForm.endTime) {
      showToast('All period fields are required', 'error')
      return
    }

    if (calculateDurationInMinutes(periodForm.startTime, periodForm.endTime) <= 0) {
      showToast('End Time must be later than Start Time', 'error')
      return
    }

    const payload = {
      name: periodForm.name.trim(),
      type: periodForm.type,
      startTime: periodForm.startTime,
      endTime: periodForm.endTime
    }

    if (editingPeriodId) {
      setPeriods(prev => prev.map(p => p.id === editingPeriodId ? { ...p, ...payload } : p))
      showToast('Period structure updated successfully', 'success')
    } else {
      const newId = makeId()
      setPeriods(prev => [...prev, { id: newId, ...payload }])
      showToast('New period structure created successfully', 'success')
    }

    setShowPeriodModal(false)
  }

  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>Class Weekly Timetable Planner</h1>
          <p>Configure the school day structure first (academic periods vs. breaks), then schedule teachers, rooms, and subject modules class-wise.</p>
        </div>
        <div className="settings-actions">
          {activeTab === 'grid' && (
            <>
              <button className="btn btn-export" onClick={handleExportExcel}>
                <i className="fa-solid fa-file-excel" style={{ color: '#107c41', marginRight: '6px' }}></i> Export Excel
              </button>
              <button className="btn btn-export" onClick={handleExportPDF}>
                <i className="fa-solid fa-file-pdf" style={{ color: '#e01e22', marginRight: '6px' }}></i> Download PDF
              </button>
            </>
          )}
          {hasEditPermission && activeTab === 'grid' && (
            <button className="btn btn-primary" onClick={() => openAddSchedule(timetableDays[0] || 'Monday', '')}>
              <i className="fa-solid fa-calendar-plus"></i> Schedule Period
            </button>
          )}
          {hasEditPermission && activeTab === 'periods' && (
            <button className="btn btn-primary" onClick={openAddPeriod}>
              <i className="fa-solid fa-clock"></i> Configure Time Slot
            </button>
          )}
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="tabs-nav">
        <button className={activeTab === 'grid' ? 'active' : ''} onClick={() => setActiveTab('grid')}>
          <i className="fa-solid fa-calendar-days"></i> Weekly Timetable Grid
        </button>
        <button className={activeTab === 'periods' ? 'active' : ''} onClick={() => setActiveTab('periods')}>
          <i className="fa-solid fa-clock-rotate-left"></i> Day Structure &amp; Periods ({periods.length})
        </button>
      </div>

      {/* ── TAB 1: WEEKLY GRID VIEW ── */}
      {activeTab === 'grid' && (
        <>
          {/* VIEW CONTROLS */}
          <div className="roles-table-card academic-list-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: '6px' }}>Filter Schedule View</label>
                <div className="roles-view-toggle" style={{ margin: 0 }}>
                  <button className={viewMode === 'class' ? 'active' : ''} onClick={() => setViewMode('class')}>
                    <i className="fa-solid fa-school" style={{ marginRight: '6px' }}></i> By Class
                  </button>
                  <button className={viewMode === 'teacher' ? 'active' : ''} onClick={() => setViewMode('teacher')}>
                    <i className="fa-solid fa-chalkboard-user" style={{ marginRight: '6px' }}></i> By Teacher
                  </button>
                </div>
              </div>

              {viewMode === 'class' ? (
                <div style={{ minWidth: '200px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: '6px' }}>Choose Class</label>
                  <select aria-label="Choose Class" className="roles-filter" style={{ width: '100%', margin: 0 }} value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ minWidth: '240px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: '6px' }}>Choose Faculty Member</label>
                  <select aria-label="Choose Faculty Member" className="roles-filter" style={{ width: '100%', margin: 0 }} value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)}>
                    {staff.filter(s => s.userType === 'teaching').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* SEARCH INPUT */}
              <div style={{ minWidth: '220px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: '6px' }}>Search Schedule</label>
                <div style={{ position: 'relative' }}>
                  <input aria-label="Search Schedule"
                    type="text"
                    className="roles-filter"
                    placeholder="Search subject, teacher, room..."
                    style={{ width: '100%', margin: 0, paddingLeft: '32px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', fontSize: '12px' }}></i>
                </div>
              </div>

              {!hasEditPermission && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <i className="fa-solid fa-lock" style={{ color: 'var(--amber)' }}></i>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t2)' }}>Read-Only Mode</span>
                </div>
              )}
            </div>
          </div>
                    {/* DYNAMIC WEEKLY GRID */}
          <div className="timetable-container">
            <div className="timetable-grid-wrap">
              <table className="timetable-grid-table">
                <thead>
                  <tr>
                    <th>Period &amp; Time</th>
                    {timetableDays.map(day => (
                      <th key={day}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods.length === 0 ? (
                    <tr>
                      <td colSpan={timetableDays.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--t3)' }}>
                        No periods configured yet. Please switch to the "Day Structure &amp; Periods" tab to define slots first.
                      </td>
                    </tr>
                  ) : sortedPeriods.map(p => {
                    const dur = calculateDurationInMinutes(p.startTime, p.endTime)
                    
                    // If it is a BREAK/LUNCH period:
                    if (p.type === 'Break') {
                      return (
                        <tr key={p.id}>
                          <td className="timetable-period-col">
                            <div className="timetable-period-num" style={{ color: 'var(--amber)' }}>{p.name}</div>
                            <div className="timetable-period-time">{p.startTime} - {p.endTime}</div>
                          </td>
                          <td colSpan={timetableDays.length} className="timetable-break-row">
                            <div className="timetable-break-content">
                              <i className="fa-solid fa-mug-hot timetable-break-icon"></i>
                              <span>{p.name} Break — {dur} mins ({p.startTime} - {p.endTime})</span>
                            </div>
                          </td>
                        </tr>
                      )
                    }
 
                    // Otherwise, ACADEMIC period (renders day cells):
                    return (
                      <tr key={p.id}>
                        <td className="timetable-period-col">
                          <div className="timetable-period-num">{p.name}</div>
                          <div className="timetable-period-time">{p.startTime} - {p.endTime}</div>
                          <div style={{ fontSize: '9px', color: 'var(--t3)', fontWeight: 'normal' }}>({dur} mins)</div>
                        </td>
                        {timetableDays.map(day => {
                          const slot = getSlot(day, p.id)
                          const matched = slot ? isSlotMatched(slot) : true
                          const fadedClass = slot && !matched ? 'timetable-card-faded' : ''

                          return (
                            <td key={day} style={{ position: 'relative' }}>
                              {slot ? (
                                slot.isBreak ? (
                                  <div className={`timetable-card custom-break ${fadedClass}`}>
                                    <div className="timetable-card-subject">{slot.breakName || 'Break'}</div>
                                    <div className="timetable-card-teacher">
                                      <i className="fa-solid fa-mug-hot" style={{ marginRight: '6px', color: 'var(--amber)' }}></i>
                                      Class Break
                                    </div>
                                    <div className="timetable-card-room">
                                      No Faculty / Room
                                    </div>

                                    {hasEditPermission && (
                                      <div className="timetable-card-actions">
                                        <button aria-label="Edit Break" className="timetable-card-action-btn" title="Edit Break" onClick={(e) => openEditSchedule(slot, e)}>
                                          <i className="fa-solid fa-pencil"></i>
                                        </button>
                                        <button aria-label="Delete Break" className="timetable-card-action-btn danger" title="Delete Break" onClick={(e) => handleDeleteSchedule(slot.id, e)}>
                                          <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className={`timetable-card sub-${slot.subjectId} ${fadedClass}`}>
                                    <div className="timetable-card-subject">{getSubjectName(slot.subjectId)}</div>
                                    <div className="timetable-card-teacher">
                                      <i className="fa-solid fa-chalkboard-user"></i>
                                      {viewMode === 'class' ? getTeacherName(slot.teacherId) : getClassName(slot.classId)}
                                    </div>
                                    <div className="timetable-card-room">
                                      <i className="fa-solid fa-door-open" style={{ marginRight: '4px' }}></i>
                                      Room {slot.room || 'General'}
                                    </div>

                                    {hasEditPermission && (
                                      <div className="timetable-card-actions">
                                        <button aria-label="Edit Schedule" className="timetable-card-action-btn" title="Edit Schedule" onClick={(e) => openEditSchedule(slot, e)}>
                                          <i className="fa-solid fa-pencil"></i>
                                        </button>
                                        <button aria-label="Delete Schedule" className="timetable-card-action-btn danger" title="Delete Schedule" onClick={(e) => handleDeleteSchedule(slot.id, e)}>
                                          <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )
                              ) : (
                                hasEditPermission && (
                                  <button
                                    onClick={() => openAddSchedule(day, p.id)}
                                    className="timetable-empty-btn"
                                  >
                                    <i className="fa-solid fa-plus" style={{ fontSize: '12px' }}></i> Add Subject
                                  </button>
                                )
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TAB 2: DAY STRUCTURE & PERIODS CONFIG ── */}
      {activeTab === 'periods' && (
        <div className="timetable-settings-grid">
          {/* Active Time Slots & Breaks Panel */}
          <div className="roles-table-card academic-list-card" style={{ padding: '24px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)' }}>Active Time Slots &amp; Breaks</h3>
                <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '2px' }}>Configure standard durations, recesses, or academic schedules representing your school day template.</p>
              </div>
              {hasEditPermission && (
                <button className="btn btn-primary btn-sm" onClick={openAddPeriod}>
                  <i className="fa-solid fa-plus"></i> New Time Slot
                </button>
              )}
            </div>

            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Time Slot Name</th>
                    <th>Slot Category</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Total Duration</th>
                    {hasEditPermission && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedPeriods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="roles-empty">No time slots registered yet. Click "New Time Slot" to start.</td>
                    </tr>
                  ) : sortedPeriods.map(p => {
                    const dur = calculateDurationInMinutes(p.startTime, p.endTime)
                    return (
                      <tr key={p.id}>
                        <td>
                          <strong style={{ color: p.type === 'Break' ? 'var(--amber)' : 'var(--t1)' }}>{p.name}</strong>
                        </td>
                        <td>
                          <span className={`badge ${p.type === 'Break' ? 'badge-pending' : 'badge-valid'}`}>
                            {p.type === 'Break' ? '☕ Recess / Break' : '📚 Academic Study'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontFamily: 'monospace' }}>{p.startTime}</strong>
                        </td>
                        <td>
                          <strong style={{ fontFamily: 'monospace' }}>{p.endTime}</strong>
                        </td>
                        <td>
                          <span className="duration-tag">{dur} mins</span>
                        </td>
                        {hasEditPermission && (
                          <td>
                            <div className="roles-actions">
                              <button aria-label="Edit Time" className="btn-icon-sm" title="Edit Time" onClick={() => openEditPeriod(p)}>
                                <i className="fa-solid fa-pencil"></i>
                              </button>
                              <button aria-label="Delete Time" className="btn-icon-sm danger" title="Delete Time" onClick={() => handleDeletePeriod(p.id)}>
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timetable Layout Settings (Right-Side Configuration Card) */}
          <div className="roles-table-card academic-list-card" style={{ padding: '24px', margin: 0 }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)' }}>Timetable Layout &amp; Days</h3>
              <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '2px' }}>Configure your school week start day and active weekdays.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Week start day */}
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: '8px' }}>Week Starting Day</label>
                <select aria-label="Week Starting Day" 
                  className="form-select" 
                  value={weekStartDay} 
                  onChange={(e) => setWeekStartDay(e.target.value)}
                  disabled={!hasEditPermission}
                  style={{ width: '100%', margin: 0 }}
                >
                  {ALL_WEEKDAYS.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Active weekdays checklists */}
              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t2)', display: 'block', marginBottom: '8px' }}>Active School Days</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {ALL_WEEKDAYS.map(day => {
                    const isActive = activeDays.includes(day)
                    return (
                      <label 
                        key={day} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '10px 12px', 
                          background: isActive ? 'var(--accentbg)' : 'var(--bg3)', 
                          borderRadius: 'var(--radius-sm)', 
                          border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)', 
                          cursor: hasEditPermission ? 'pointer' : 'default',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <input aria-label="Active School Days" 
                          type="checkbox" 
                          checked={isActive}
                          onChange={() => toggleActiveDay(day)}
                          disabled={!hasEditPermission || (isActive && activeDays.length === 1)}
                          style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                        />
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--t1)' }}>{day}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              
              {!hasEditPermission && (
                <div style={{ background: 'var(--bg3)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-lock" style={{ color: 'var(--amber)' }}></i>
                  <span style={{ fontSize: '11px', color: 'var(--t3)' }}>Only administrators can configure layout settings.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SCHEDULE ITEM MODAL
          ------------------------------------------------------------- */}
      {showScheduleModal && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-calendar-plus" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  {editingScheduleId ? 'Edit Schedule Slot' : 'Schedule Subject Period'}
                </h3>
                <p className="modal-sub">
                  Day: {scheduleForm.day} • Time Slot: {
                    (() => {
                      const match = periods.find(p => String(p.id) === String(scheduleForm.periodId))
                      return match ? `${match.name} (${match.startTime} - ${match.endTime})` : 'Select Period'
                    })()
                  }
                </p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowScheduleModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={submitScheduleForm}>
              <div className="modal-body">
                {/* Slot Type Toggle */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Slot Schedule Type</label>
                  <div className="roles-view-toggle" style={{ margin: 0, display: 'flex', width: '100%' }}>
                    <button 
                      type="button" 
                      style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                      className={scheduleForm.formType === 'subject' ? 'active' : ''} 
                      onClick={() => setScheduleForm({ ...scheduleForm, formType: 'subject' })}
                    >
                      📚 Subject Module
                    </button>
                    <button 
                      type="button" 
                      style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                      className={scheduleForm.formType === 'break' ? 'active' : ''} 
                      onClick={() => setScheduleForm({ ...scheduleForm, formType: 'break' })}
                    >
                      ☕ Custom Break
                    </button>
                  </div>
                </div>

                {/* Class selector */}
                {scheduleForm.formType === 'break' ? (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ margin: 0 }}>Select Target Classes <span className="req">*</span></label>
                      <button 
                        type="button" 
                        className="btn-link" 
                        style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                        onClick={() => {
                          const allIds = classes.map(c => String(c.id))
                          const areAllSelected = scheduleForm.selectedClassIds.length === classes.length
                          setScheduleForm({
                            ...scheduleForm,
                            selectedClassIds: areAllSelected ? [] : allIds
                          })
                        }}
                      >
                        {scheduleForm.selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div style={{ 
                      maxHeight: '130px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '10px', 
                      background: 'var(--bg2)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px'
                    }}>
                      {classes.map(c => {
                        const cid = String(c.id)
                        const isChecked = scheduleForm.selectedClassIds.includes(cid)
                        return (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--t1)', userSelect: 'none' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              style={{ width: '15px', height: '15px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                              onChange={() => {
                                setScheduleForm(prev => {
                                  const updated = prev.selectedClassIds.includes(cid)
                                    ? prev.selectedClassIds.filter(id => id !== cid)
                                    : [...prev.selectedClassIds, cid]
                                  return { ...prev, selectedClassIds: updated }
                                })
                              }}
                            />
                            <span>{c.name} - {c.section}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Select Target Class <span className="req">*</span></label>
                    <select aria-label="Select Target Class" 
                      className="form-select" 
                      value={scheduleForm.classId} 
                      onChange={(e) => handleClassChangeInForm(e.target.value)}
                      required={scheduleForm.formType === 'subject'}
                    >
                      <option value="">Select Class...</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Day & Period Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Day of Week</label>
                    <select aria-label="Day of Week" className="form-select" value={scheduleForm.day} onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })}>
                      {timetableDays.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Slot Period</label>
                    <select aria-label="Time Slot Period" className="form-select" value={scheduleForm.periodId} onChange={(e) => setScheduleForm({ ...scheduleForm, periodId: e.target.value })}>
                      <option value="">Select Time Slot...</option>
                      {periods.filter(p => p.type === 'Academic').map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.startTime} - {p.endTime})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {scheduleForm.formType === 'break' ? (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Break Name / Label <span className="req">*</span></label>
                    <input aria-label="Break Name / Label" 
                      className="form-input" 
                      placeholder="e.g. Tea Break, Fruit Recess, Homeroom" 
                      value={scheduleForm.breakName} 
                      onChange={(e) => setScheduleForm({ ...scheduleForm, breakName: e.target.value })}
                      required={scheduleForm.formType === 'break'}
                    />
                  </div>
                ) : (
                  <>
                    {/* Subject Selector */}
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label>Select Subject Module <span className="req">*</span></label>
                      <select aria-label="Select Subject Module" 
                        className="form-select" 
                        value={scheduleForm.subjectId} 
                        onChange={(e) => handleSubjectChange(e.target.value)}
                        required={scheduleForm.formType === 'subject'}
                      >
                        <option value="">Choose Subject...</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher Selector */}
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label>Assign Teaching Faculty <span className="req">*</span></label>
                      <select aria-label="Assign Teaching Faculty" 
                        className="form-select" 
                        value={scheduleForm.teacherId} 
                        onChange={(e) => setScheduleForm({ ...scheduleForm, teacherId: e.target.value })}
                        required={scheduleForm.formType === 'subject'}
                      >
                        <option value="">Choose Teacher...</option>
                        {staff.filter(s => s.userType === 'teaching').map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                        ))}
                      </select>
                    </div>

                    {/* Classroom room */}
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label>Classroom Room Override</label>
                      <input aria-label="Classroom Room Override" 
                        className="form-input" 
                        placeholder="e.g. Room B-201" 
                        value={scheduleForm.room} 
                        onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })} 
                      />
                    </div>
                  </>
                )}

                {/* WARNING CONFLICTS */}
                {(conflicts.teacherConflict || conflicts.roomConflict || conflicts.classConflict) && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {conflicts.classConflict && (
                      <div className="role-warning">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>{conflicts.classConflict}</span>
                      </div>
                    )}
                    {conflicts.teacherConflict && (
                      <div className="role-warning" style={{ background: 'var(--redbg)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--red)' }}>
                        <i className="fa-solid fa-ban"></i>
                        <span>{conflicts.teacherConflict}</span>
                      </div>
                    )}
                    {conflicts.roomConflict && (
                      <div className="role-warning" style={{ background: 'var(--redbg)', borderColor: 'rgba(239,68,68,.3)', color: 'var(--red)' }}>
                        <i className="fa-solid fa-ban"></i>
                        <span>{conflicts.roomConflict}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!!conflicts.teacherConflict || !!conflicts.roomConflict || !!conflicts.classConflict}
                  style={{ opacity: (conflicts.teacherConflict || conflicts.roomConflict || conflicts.classConflict) ? 0.6 : 1 }}
                >
                  <i className="fa-solid fa-floppy-disk"></i> Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* -------------------------------------------------------------
          PERIOD STRUCTURE CONFIG MODAL
          ------------------------------------------------------------- */}
      {showPeriodModal && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-clock" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  {editingPeriodId ? 'Configure Time Slot' : 'Create New Day Period'}
                </h3>
                <p className="modal-sub">Configure day layout intervals representing study hours or lunch recess.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowPeriodModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={submitPeriodForm}>
              <div className="modal-body">
                {/* Name */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Slot Interval Label <span className="req">*</span></label>
                  <input aria-label="Slot Interval Label"
                    className="form-input"
                    placeholder="e.g. Period 1, Short Break, Lunch Recess"
                    value={periodForm.name}
                    onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* Type Selection */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Slot Interval Type</label>
                  <select aria-label="Slot Interval Type" 
                    className="form-select" 
                    value={periodForm.type} 
                    onChange={(e) => setPeriodForm({ ...periodForm, type: e.target.value })}
                  >
                    <option value="Academic">📚 Academic (Assign subjects and teachers)</option>
                    <option value="Break">☕ Recess / Lunch Break (Locked across all days)</option>
                  </select>
                </div>

                {/* Times */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Start Time <span className="req">*</span></label>
                    <input aria-label="Start Time"
                      className="form-input"
                      type="time"
                      value={periodForm.startTime}
                      onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time <span className="req">*</span></label>
                    <input aria-label="End Time"
                      className="form-input"
                      type="time"
                      value={periodForm.endTime}
                      onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Calculated Duration */}
                <div style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--t2)' }}>Calculated Duration:</span>
                  <strong style={{ fontSize: '13px', color: activePeriodDuration > 0 ? 'var(--green)' : 'var(--red)', marginLeft: 'auto' }}>
                    {activePeriodDuration > 0 ? `${activePeriodDuration} minutes` : 'Invalid Range'}
                  </strong>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPeriodModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={activePeriodDuration <= 0}>
                  <i className="fa-solid fa-circle-check"></i> Save Slot Config
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast success`}>
            <span>🎉</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </Layout>
  )
}
