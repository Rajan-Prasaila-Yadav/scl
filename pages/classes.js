import ClassFees, { assignedToClass } from '../components/ClassFees'
import { INITIAL_FEES } from '../lib/feeData'
import { validateClassCapacity } from '../lib/registryValidation'
import { allowDeletion } from '../lib/recordIntegrity'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  STAFF,
  STORAGE_KEYS,
  SUBJECT_CATEGORIES,
  makeId,
  readStoredList,
  writeStoredList,
  makeSubjectCode,
} from '../lib/academicData'
import { exportToCSV, printToPDF } from '../lib/exportUtils'

const emptyForm = {
  name: '',
  section: '',
  classCode: '',
  description: '',
  room: '',
  capacity: 40,
  classTeacherId: '',
  monitorId: '',
  subjectIds: [],
  subjectTeacherMap: {}, // Maps subjectId -> teacherId
  status: 'active',
}

export default function Classes() {
  const [fees, setFees] = useState([])
  const [classes, setClasses] = useState(INITIAL_CLASSES)
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS)
  const [allStudents, setAllStudents] = useState(INITIAL_STUDENTS)
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const teachingStaff = useMemo(() => {
    return staff.filter((t) => t.userType === 'teaching' || !t.userType || t.userType === '')
  }, [staff])
  
  // Search, Filters, Sorting States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [capacityFilter, setCapacityFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name') // 'name' | 'classCode' | 'room' | 'capacity' | 'students'
  const [sortDir, setSortDir] = useState('asc') // 'asc' | 'desc'
  
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [detailTab, setDetailTab] = useState('overview') // 'overview' | 'subjects' | 'students' | 'teachers'

  // Subject CRUD Modal inside Class Details states
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false)
  const [subjectModalMode, setSubjectModalMode] = useState('assign') // 'assign' | 'create' | 'edit'
  const [subModalForm, setSubModalForm] = useState({
    subjectId: '', // For assigning existing
    teacherId: '', // Assigned teacher
    name: '', // For creating new
    category: 'Compulsory',
    publication: '',
    bookName: '',
    bookCode: '',
  })
  const [editingSubjectId, setEditingSubjectId] = useState(null)

  useEffect(() => {
    const storedClasses = readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES)
    setClasses(storedClasses)
    setFees(readStoredList('educore.fees', INITIAL_FEES))
    setSelectedClassId(storedClasses[0]?.id || null)
    setSubjects(readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS))
    setAllStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setStaff(readStoredList(STORAGE_KEYS.staff, STAFF))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.classes, classes)
  }, [classes, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.subjects, subjects)
  }, [subjects, hydrated])

  const selectedClass = classes.find((item) => item.id === selectedClassId) || classes[0]
  
  const studentsInFormClass = allStudents.filter(
    (student) => student.classId === (editingId || selectedClass?.id)
  )
  const studentsInSelectedClass = selectedClass
    ? allStudents.filter((student) => student.classId === selectedClass.id)
    : []

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  const getTeacherName = (id) => {
    return staff.find((teacher) => teacher.id === Number(id))?.name || 'Not assigned'
  }

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  // Handle class block/unblock status toggle
  const toggleClassStatus = (classId) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const nextStatus = c.status === 'active' ? 'inactive' : 'active'
          showToast(`Class "${c.name}" has been ${nextStatus === 'active' ? 'unblocked' : 'blocked'}.`, 'info')
          return { ...c, status: nextStatus }
        }
        return c
      })
    )
  }

  // Filtered and Sorted Classes
  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase()
    return classes
      .filter((item) => {
        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        
        // Teacher filter
        if (teacherFilter !== 'all' && String(item.classTeacherId) !== teacherFilter) return false
        
        // Capacity filter
        const studentCount = allStudents.filter((s) => s.classId === item.id).length
        if (capacityFilter === 'full' && studentCount < (item.capacity || 0)) return false
        if (capacityFilter === 'available' && studentCount >= (item.capacity || 0)) return false

        // Search text matching
        if (!query) return true
        const teacherName = getTeacherName(item.classTeacherId)
        const monitorName = allStudents.find((s) => s.id === item.monitorId)?.name || ''
        const code = item.classCode || ''
        const desc = item.description || ''
        return [item.name, item.section, item.room, teacherName, monitorName, code, desc]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        let valA, valB
        if (sortBy === 'name') {
          valA = `${a.name} ${a.section || ''}`
          valB = `${b.name} ${b.section || ''}`
        } else if (sortBy === 'classCode') {
          valA = a.classCode || ''
          valB = b.classCode || ''
        } else if (sortBy === 'room') {
          valA = a.room || ''
          valB = b.room || ''
        } else if (sortBy === 'capacity') {
          valA = Number(a.capacity) || 0
          valB = Number(b.capacity) || 0
        } else if (sortBy === 'students') {
          valA = allStudents.filter((s) => s.classId === a.id).length
          valB = allStudents.filter((s) => s.classId === b.id).length
        }
        
        if (typeof valA === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        } else {
          return sortDir === 'asc' ? valA - valB : valB - valA
        }
      })
  }, [classes, search, statusFilter, teacherFilter, capacityFilter, sortBy, sortDir, allStudents])

  // Exports handlers
  const handleExportCSV = () => {
    const headers = [
      'Class Name',
      'Section',
      'Class Code',
      'Class Room',
      'Class Teacher',
      'Monitor',
      'Capacity (Full)',
      'Occupied Capacity',
      'Available Seats',
      'Status',
      'Description',
    ]

    const rows = filteredClasses.map((item) => {
      const studentCount = allStudents.filter((s) => s.classId === item.id).length
      const monitor = allStudents.find((s) => s.id === item.monitorId)?.name || 'Not assigned'
      const available = Math.max(0, (item.capacity || 0) - studentCount)
      return [
        item.name,
        item.section || '',
        item.classCode || `CLS-${item.id}`,
        item.room || 'Not assigned',
        getTeacherName(item.classTeacherId),
        monitor,
        item.capacity || 40,
        studentCount,
        available,
        item.status,
        item.description || '',
      ]
    })

    exportToCSV('classes_list.csv', headers, rows)
    showToast('Classes list exported to CSV successfully', 'success')
  }

  const handleExportPDF = () => {
    const headers = [
      'Class Name',
      'Code',
      'Room',
      'Teacher',
      'Monitor',
      'Occupied / Capacity',
      'Status',
    ]

    const rows = filteredClasses.map((item) => {
      const studentCount = allStudents.filter((s) => s.classId === item.id).length
      const monitor = allStudents.find((s) => s.id === item.monitorId)?.name || 'N/A'
      return [
        `${item.name}${item.section ? ` - ${item.section}` : ''}`,
        item.classCode || '—',
        item.room || '—',
        getTeacherName(item.classTeacherId),
        monitor,
        `${studentCount} / ${item.capacity || 40}`,
        item.status.toUpperCase(),
      ]
    })

    printToPDF(
      'Classes Registry Report',
      headers,
      rows,
      `Filtered Classes List (${filteredClasses.length} Classes)`
    )
    showToast('Generating printable PDF...', 'info')
  }

  const stats = useMemo(() => ({
    total: classes.length,
    active: classes.filter((item) => item.status === 'active').length,
    students: allStudents.length,
    subjectLinks: classes.reduce((sum, item) => sum + (item.subjectIds || []).length, 0),
  }), [classes, allStudents])

  const updateForm = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'name' || key === 'section') {
        next.monitorId = ''
      }
      return next
    })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const saveClass = (event) => {
    event?.preventDefault?.(); if (!requirePermission(editingId ? 'edit' : 'create')) return

    event.preventDefault()
    const name = form.name.trim()
    const section = form.section.trim().toUpperCase()

    if (!name) {
      showToast('Class name is required', 'error')
      return
    }

    if (!form.classTeacherId) {
      showToast('Select a class teacher', 'error')
      return
    }

    const duplicate = classes.some(
      (item) =>
        item.id !== editingId &&
        item.name.trim().toLowerCase() === name.toLowerCase() &&
        (item.section || '').trim().toLowerCase() === section.toLowerCase()
    )

    if (duplicate) {
      showToast('This class and section already exists', 'error')
      return
    }

    const capacityError = validateClassCapacity(form.capacity, allStudents.filter(s => String(s.classId) === String(editingId) && s.status === 'active').length)
    if (capacityError) { showToast(capacityError, 'error'); return }
    const validMonitor = form.monitorId
      ? allStudents.some(
          (student) => student.id === Number(form.monitorId) && student.classId === editingId
        )
      : true

    if (editingId && !validMonitor) {
      showToast('Class monitor must be from this class only', 'error')
      return
    }

    // Generate class code if empty
    const generatedCode = form.classCode.trim() || `CLS-${name.replace(/\s+/g, '').toUpperCase()}${section}`

    const payload = {
      name,
      section,
      classCode: generatedCode,
      description: form.description.trim(),
      room: form.room.trim(),
      capacity: Number(form.capacity) || 0,
      classTeacherId: Number(form.classTeacherId),
      monitorId: form.monitorId ? Number(form.monitorId) : '',
      subjectIds: form.subjectIds,
      subjectTeacherMap: form.subjectTeacherMap || {},
      status: form.status,
    }

    if (editingId) {
      setClasses((current) =>
        current.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
      )
      showToast('Class updated successfully', 'success')
    } else {
      const id = makeId()
      setClasses((current) => [...current, { id, ...payload }])
      setSelectedClassId(id)
      showToast('Class created successfully', 'success')
    }

    resetForm()
    setViewMode('list')
  }

  const editClass = (item) => {
    setEditingId(item.id)
    setSelectedClassId(item.id)
    setForm({
      name: item.name,
      section: item.section || '',
      classCode: item.classCode || '',
      description: item.description || '',
      room: item.room || '',
      capacity: item.capacity || 0,
      classTeacherId: String(item.classTeacherId || ''),
      monitorId: item.monitorId ? String(item.monitorId) : '',
      subjectIds: item.subjectIds || [],
      subjectTeacherMap: item.subjectTeacherMap || {},
      status: item.status,
    })
    setViewMode('edit')
  }

  const deleteClass = (item) => {
    if (!allowDeletion('class', item)) return
    if (!requirePermission('delete')) return

    const classDisplayName = `${item.name}${item.section ? ` - ${item.section}` : ''}`
    if (!confirm(`Delete class ${classDisplayName}? This action cannot be undone.`)) return
    setClasses((current) => current.filter((record) => record.id !== item.id))
    if (selectedClassId === item.id) {
      const remaining = classes.filter((record) => record.id !== item.id)
      setSelectedClassId(remaining[0]?.id || null)
    }
    if (editingId === item.id) resetForm()
    showToast('Class deleted successfully', 'info')
    setViewMode('list')
  }

  // Add / Assign Subject Logic
  const handleOpenSubjectModal = (mode, subjId = null) => {
    setSubjectModalMode(mode)
    if (mode === 'assign') {
      // Find a subject not currently in this class
      const remaining = subjects.filter((s) => !(selectedClass.subjectIds || []).includes(s.id))
      setSubModalForm({
        subjectId: remaining[0]?.id || '',
        teacherId: '',
        name: '',
        category: 'Compulsory',
        publication: '',
        bookName: '',
        bookCode: '',
      })
    } else if (mode === 'create') {
      setSubModalForm({
        subjectId: '',
        teacherId: '',
        name: '',
        category: 'Compulsory',
        publication: '',
        bookName: '',
        bookCode: '',
      })
    } else if (mode === 'edit' && subjId) {
      const sObj = subjects.find((s) => s.id === subjId)
      if (sObj) {
        setEditingSubjectId(subjId)
        setSubModalForm({
          subjectId: String(subjId),
          teacherId: String(selectedClass.subjectTeacherMap?.[subjId] || ''),
          name: sObj.name,
          category: sObj.category,
          publication: sObj.publication || '',
          bookName: sObj.bookName || '',
          bookCode: sObj.bookCode || '',
        })
      }
    }
    setIsSubjectModalOpen(true)
  }

  const handleSaveSubjectModal = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    
    if (subjectModalMode === 'assign') {
      const subId = Number(subModalForm.subjectId)
      if (!subId) {
        showToast('Please select a subject to assign', 'error')
        return
      }

      setClasses((prev) =>
        prev.map((c) => {
          if (c.id === selectedClassId) {
            const nextSubjIds = [...(c.subjectIds || [])]
            if (!nextSubjIds.includes(subId)) nextSubjIds.push(subId)
            
            const nextMap = { ...(c.subjectTeacherMap || {}) }
            if (subModalForm.teacherId) {
              nextMap[subId] = Number(subModalForm.teacherId)
            }

            return { ...c, subjectIds: nextSubjIds, subjectTeacherMap: nextMap }
          }
          return c
        })
      )
      showToast('Subject assigned to class', 'success')
    } else if (subjectModalMode === 'create') {
      const name = subModalForm.name.trim()
      if (!name) {
        showToast('Subject name is required', 'error')
        return
      }

      const duplicate = subjects.some(
        (s) => s.name.trim().toLowerCase() === name.toLowerCase()
      )
      if (duplicate) {
        showToast('A subject with this name already exists', 'error')
        return
      }

      const newSubId = makeId()
      const newSubject = {
        id: newSubId,
        name,
        code: makeSubjectCode(name),
        category: subModalForm.category,
        publication: subModalForm.publication.trim(),
        bookName: subModalForm.bookName.trim(),
        bookCode: subModalForm.bookCode.trim(),
        status: 'active',
      }

      // 1. Add to universal subjects
      setSubjects((prev) => [...prev, newSubject])

      // 2. Link to this class
      setClasses((prev) =>
        prev.map((c) => {
          if (c.id === selectedClassId) {
            const nextSubjIds = [...(c.subjectIds || []), newSubId]
            const nextMap = { ...(c.subjectTeacherMap || {}) }
            if (subModalForm.teacherId) {
              nextMap[newSubId] = Number(subModalForm.teacherId)
            }
            return { ...c, subjectIds: nextSubjIds, subjectTeacherMap: nextMap }
          }
          return c
        })
      )
      showToast('Subject created and assigned to class', 'success')
    } else if (subjectModalMode === 'edit') {
      const name = subModalForm.name.trim()
      if (!name) {
        showToast('Subject name is required', 'error')
        return
      }

      // Update universal subject list
      setSubjects((prev) =>
        prev.map((s) => {
          if (s.id === editingSubjectId) {
            return {
              ...s,
              name,
              category: subModalForm.category,
              publication: subModalForm.publication.trim(),
              bookName: subModalForm.bookName.trim(),
              bookCode: subModalForm.bookCode.trim(),
            }
          }
          return s
        })
      )

      // Update class-specific teacher
      setClasses((prev) =>
        prev.map((c) => {
          if (c.id === selectedClassId) {
            const nextMap = { ...(c.subjectTeacherMap || {}) }
            if (subModalForm.teacherId) {
              nextMap[editingSubjectId] = Number(subModalForm.teacherId)
            } else {
              delete nextMap[editingSubjectId]
            }
            return { ...c, subjectTeacherMap: nextMap }
          }
          return c
        })
      )
      showToast('Subject details and teacher updated', 'success')
    }

    setIsSubjectModalOpen(false)
  }

  // Unlink Subject from Class (Disconnect)
  const handleUnlinkSubject = (subjId) => {
    if (!confirm('Are you sure you want to remove this subject from this class?')) return
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === selectedClassId) {
          const nextSubjIds = (c.subjectIds || []).filter((id) => id !== subjId)
          const nextMap = { ...(c.subjectTeacherMap || {}) }
          delete nextMap[subjId]
          return { ...c, subjectIds: nextSubjIds, subjectTeacherMap: nextMap }
        }
        return c
      })
    )
    showToast('Subject removed from class', 'info')
  }

  // Delete subject completely
  const handleCompleteDeleteSubject = (subjId) => {
    if (!confirm('This will delete the subject from the universal registry and remove it from all classes. Continue?')) return
    // Remove from universal list
    setSubjects((prev) => prev.filter((s) => s.id !== subjId))
    // Remove from all classes
    setClasses((prev) =>
      prev.map((c) => {
        const nextSubjIds = (c.subjectIds || []).filter((id) => id !== subjId)
        const nextMap = { ...(c.subjectTeacherMap || {}) }
        delete nextMap[subjId]
        return { ...c, subjectIds: nextSubjIds, subjectTeacherMap: nextMap }
      })
    )
    showToast('Subject deleted globally', 'info')
  }

  // Inline Subject Teacher Change
  const handleInlineTeacherChange = (subjId, val) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === selectedClassId) {
          const nextMap = { ...(c.subjectTeacherMap || {}) }
          if (val === '') {
            delete nextMap[subjId]
          } else {
            nextMap[subjId] = Number(val)
          }
          return { ...c, subjectTeacherMap: nextMap }
        }
        return c
      })
    )
    showToast('Teacher assignment updated', 'success')
  }

  // Detail Tab Computations
  const selectedSubjects = selectedClass
    ? subjects.filter((subject) => (selectedClass.subjectIds || []).includes(subject.id))
    : []

  const selectedMonitor = selectedClass
    ? allStudents.find(
        (student) => student.id === selectedClass.monitorId && student.classId === selectedClass.id
      )
    : null

  // Get teachers list for the selected class (Class teacher + subject teachers)
  const teachersInSelectedClass = useMemo(() => {
    if (!selectedClass) return []
    const mappedIds = new Set()
    if (selectedClass.classTeacherId) mappedIds.add(Number(selectedClass.classTeacherId))
    
    Object.values(selectedClass.subjectTeacherMap || {}).forEach((tId) => {
      if (tId) mappedIds.add(Number(tId))
    })

    return staff.filter((teacher) => mappedIds.has(teacher.id))
  }, [selectedClass, staff])

  return (
    <Layout>
      {/* HEADER SECTION */}
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-school" style={{ color: 'var(--amber)', marginRight: 8 }}></i>
            Classes Registry
          </h1>
          <p>
            {viewMode === 'list' && 'Create classes, assign teachers, pick monitor roles, map room allocations, and manage class workloads.'}
            {viewMode === 'create' && 'Register a new classroom, configure layout limits, and assign teachers.'}
            {viewMode === 'edit' && `Modify configuration details for ${selectedClass?.name}${selectedClass?.section ? ` - ${selectedClass.section}` : ''}.`}
            {viewMode === 'detail' && `Overview, student enrollment, and subject curriculum for ${selectedClass?.name}${selectedClass?.section ? ` - ${selectedClass.section}` : ''}.`}
          </p>
        </div>
        <div className="settings-actions">
          {viewMode === 'list' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={handleExportCSV}>
                <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> Excel
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleExportPDF}>
                <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  resetForm()
                  setViewMode('create')
                }}
              >
                <i className="fa-solid fa-plus"></i> New Class
              </button>
            </>
          )}
          {viewMode !== 'list' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                resetForm()
                setViewMode('list')
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Back to List
            </button>
          )}
        </div>
      </div>

      {/* STATISTICS CARDS */}
      {viewMode === 'list' && (
        <div className="roles-stats">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--amberbg)', color: 'var(--amber)' }}>
              <i className="fa-solid fa-school"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.total}</div>
              <div className="stat-card-label">Total Classes</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--greenbg)', color: 'var(--green)' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.active}</div>
              <div className="stat-card-label">Active</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}>
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.students}</div>
              <div className="stat-card-label">Total Students</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--purplebg)', color: 'var(--purple)' }}>
              <i className="fa-solid fa-book"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.subjectLinks}</div>
              <div className="stat-card-label">Subject Mappings</div>
            </div>
          </div>
        </div>
      )}

      {/* BODY PANEL */}
      <div>
        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
            {/* Search and Filters Toolbar */}
            <div className="roles-toolbar academic-toolbar">
              <div className="roles-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search class, section, code, room, teacher..."
                  placeholder="Search class, section, code, room, teacher..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              
              <select aria-label="Status Filter"
                className="roles-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Blocked</option>
              </select>

              <select aria-label="Teacher Filter"
                className="roles-filter"
                value={teacherFilter}
                onChange={(event) => setTeacherFilter(event.target.value)}
              >
                <option value="all">All Teachers</option>
                {teachingStaff.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select aria-label="Capacity Filter"
                className="roles-filter"
                value={capacityFilter}
                onChange={(event) => setCapacityFilter(event.target.value)}
              >
                <option value="all">All Capacities</option>
                <option value="available">Has Vacancies</option>
                <option value="full">At Full Capacity</option>
              </select>
            </div>

            {/* Table Wrap */}
            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                      Class Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('classCode')} style={{ cursor: 'pointer' }}>
                      Class Code {sortBy === 'classCode' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Class Teacher Name</th>
                    <th>Class Monitor Name</th><th>Fees</th>
                    <th onClick={() => toggleSort('room')} style={{ cursor: 'pointer' }}>
                      Classroom Number {sortBy === 'room' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('capacity')} style={{ cursor: 'pointer' }}>
                      Capacity (Occupied / Full Capacity) {sortBy === 'capacity' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('students')} style={{ cursor: 'pointer' }}>
                      Total Students {sortBy === 'students' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="roles-empty">
                        No classrooms match the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((item) => {
                      const studentCount = allStudents.filter((student) => student.classId === item.id).length
                      const isFull = studentCount >= (item.capacity || 0)
                      return (
                        <tr
                          key={item.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedClassId(item.id)
                            setDetailTab('overview')
                            setViewMode('detail')
                          }}
                        >
                          <td>
                            <div className="roles-name-cell">
                              <div className="roles-name-icon" style={{ background: 'var(--amberbg)', color: 'var(--amber)' }}>
                                <i className="fa-solid fa-school"></i>
                              </div>
                              <div>
                                <div className="roles-name-text">
                                  {item.name}
                                  {item.section ? ` - ${item.section}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-gray">{item.classCode || `CLS-${item.id}`}</span>
                          </td>
                          <td>
                            <div>{getTeacherName(item.classTeacherId)}</div>
                          </td>
                          <td>
                            {item.monitorId ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                <i className="fa-solid fa-crown" style={{ color: 'var(--amber)', fontSize: '10px' }}></i>
                                <span>{allStudents.find((s) => s.id === item.monitorId)?.name || 'N/A'}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--t3)', fontSize: '11px' }}>Not assigned</span>
                            )}
                          </td>
                          <td onClick={event => event.stopPropagation()}><button className="btn btn-ghost btn-sm" onClick={() => {setSelectedClassId(item.id);setDetailTab('fees');setViewMode('detail')}}>{fees.filter(f => assignedToClass(f,item.id)).length} fees</button></td>
                          <td>{item.room || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: isFull ? 'var(--red)' : 'var(--green)',
                                }}
                              >
                                {studentCount} / {item.capacity || 40}
                              </span>
                              <span
                                className={`badge ${
                                  isFull ? 'badge-expiring' : 'badge-valid'
                                }`}
                                style={{ fontSize: '9px', padding: '1px 6px' }}
                              >
                                {isFull ? 'Full' : 'Available'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-blue">{studentCount} Students</span>
                          </td>
                          <td>
                            <span className={`badge ${item.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                              {item.status === 'active' ? 'Active' : 'Blocked'}
                            </span>
                          </td>
                          <td onClick={(event) => event.stopPropagation()} style={{ textAlign: 'right', paddingRight: '16px' }}>
                            <div className="roles-actions">
                              <button aria-label="view"
                                className="btn-icon-sm tooltip"
                                data-tooltip="view"
                                title="view"
                                onClick={() => {
                                  showToast("Action: view", "info")
                                  setSelectedClassId(item.id)
                                  setDetailTab('overview')
                                  setViewMode('detail')
                                }}
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                              <button aria-label="edit"
                                className="btn-icon-sm tooltip"
                                data-tooltip="edit"
                                title="edit"
                                onClick={() => {
                                  showToast("Action: edit", "info")
                                  editClass(item)
                                }}
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button
                                className="btn-icon-sm tooltip"
                                data-tooltip={item.status === 'active' ? 'block' : 'unblock'}
                                title={item.status === 'active' ? 'block' : 'unblock'}
                                onClick={() => {
                                  showToast(`Action: ${item.status === 'active' ? 'block' : 'unblock'}`, "info")
                                  toggleClassStatus(item.id)
                                }}
                                style={{ color: item.status === 'active' ? 'var(--amber)' : 'var(--green)' }}
                              >
                                <i className={`fa-solid ${item.status === 'active' ? 'fa-ban' : 'fa-check'}`}></i>
                              </button>
                              <button aria-label="delete"
                                className="btn-icon-sm danger tooltip"
                                data-tooltip="delete"
                                title="delete"
                                onClick={() => {
                                  showToast("Action: delete", "info")
                                  deleteClass(item)
                                }}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CREATE / EDIT VIEW */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <form className="roles-table-card academic-form-card" onSubmit={saveClass}>
              <div className="section-divider" style={{ marginTop: 0 }}>
                <span className="section-divider-label">
                  {editingId ? 'Edit Configuration' : 'Register New Classroom'}
                </span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Class Name <span className="req">*</span></label>
                  <input aria-label="Class Name"
                    className="form-input"
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                    placeholder="e.g. Class 8"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Section (Optional)</label>
                  <input aria-label="Section (Optional)"
                    className="form-input"
                    value={form.section}
                    onChange={(event) => updateForm('section', event.target.value)}
                    placeholder="e.g. A"
                  />
                </div>
                <div className="form-group">
                  <label>Class Code (Optional)</label>
                  <input aria-label="Class Code (Optional)"
                    className="form-input"
                    value={form.classCode}
                    onChange={(event) => updateForm('classCode', event.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="form-group">
                  <label>Room Number</label>
                  <input aria-label="Room Number"
                    className="form-input"
                    value={form.room}
                    onChange={(event) => updateForm('room', event.target.value)}
                    placeholder="e.g. B-201"
                  />
                </div>
                <div className="form-group">
                  <label>Capacity</label>
                  <input aria-label="Capacity"
                    className="form-input"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={(event) => updateForm('capacity', event.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Class Teacher <span className="req">*</span></label>
                  <select aria-label="Class Teacher"
                    className="form-select"
                    value={form.classTeacherId}
                    onChange={(event) => updateForm('classTeacherId', event.target.value)}
                    required
                  >
                    <option value="">Select teacher</option>
                    {teachingStaff.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.department}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Class Monitor</label>
                  <select aria-label="Class Monitor"
                    className="form-select"
                    value={form.monitorId}
                    onChange={(event) => updateForm('monitorId', event.target.value)}
                    disabled={!editingId || studentsInFormClass.length === 0}
                  >
                    <option value="">
                      {!editingId ? 'Save class configuration first' : studentsInFormClass.length === 0 ? 'No students assigned yet' : 'Select from classroom students'}
                    </option>
                    {studentsInFormClass.map((student) => (
                      <option key={student.id} value={student.id}>
                        Roll {student.rollNo}: {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select aria-label="Status"
                    className="form-select"
                    value={form.status}
                    onChange={(event) => updateForm('status', event.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label>Class Room Short Description</label>
                <textarea aria-label="Class Room Short Description"
                  className="form-input"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder="Provide a short description of the class goals, achievements or specific rules..."
                />
              </div>

              <div className="section-divider">
                <span className="section-divider-label">Subject Mappings &amp; Teachers</span>
                <div className="section-divider-line"></div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '12px' }}>
                Pick universal subjects assigned to this classroom and map the respective subject teacher.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subjects.map((subject) => {
                  const isChecked = form.subjectIds.includes(subject.id)
                  return (
                    <div
                      key={subject.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isChecked ? 'var(--bg3)' : 'var(--bg2)',
                        border: `1px solid ${isChecked ? 'var(--accentglow)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newSubjectIds = isChecked
                              ? form.subjectIds.filter((id) => id !== subject.id)
                              : [...form.subjectIds, subject.id]
                            const newMap = { ...form.subjectTeacherMap }
                            if (isChecked) {
                              delete newMap[subject.id]
                            }
                            setForm((prev) => ({
                              ...prev,
                              subjectIds: newSubjectIds,
                              subjectTeacherMap: newMap,
                            }))
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--t1)' }}>{subject.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{subject.code}</div>
                        </div>
                      </label>

                      {isChecked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--t2)' }}>Teacher:</span>
                          <select aria-label="Select subject teacher"
                            className="form-select"
                            style={{ width: '180px', padding: '4px 8px', fontSize: '12px' }}
                            value={form.subjectTeacherMap[subject.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              const newMap = { ...form.subjectTeacherMap }
                              if (val) {
                                newMap[subject.id] = Number(val)
                              } else {
                                delete newMap[subject.id]
                              }
                              setForm((prev) => ({ ...prev, subjectTeacherMap: newMap }))
                            }}
                          >
                            <option value="">Select subject teacher</option>
                            {teachingStaff.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="academic-form-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '24px' }}>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    resetForm()
                    setViewMode('list')
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  <i className={`fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}`}></i>
                  {editingId ? 'Update Configuration' : 'Save Registry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DETAIL VIEW */}
        {viewMode === 'detail' && selectedClass && (
          <div className="roles-table-card academic-detail-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="role-detail-profile" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="role-detail-info">
                <div className="role-detail-icon" style={{ background: 'var(--amberbg)', color: 'var(--amber)' }}>
                  <i className="fa-solid fa-school"></i>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedClass.name}
                    {selectedClass.section ? ` - ${selectedClass.section}` : ''}
                    <span className="badge badge-gray" style={{ fontSize: '11px', fontWeight: 500 }}>
                      Code: {selectedClass.classCode || `CLS-${selectedClass.id}`}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    <span className={`badge ${selectedClass.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                      {selectedClass.status === 'active' ? 'Active' : 'Blocked'}
                    </span>
                    <span>
                      <i className="fa-solid fa-chalkboard-user" style={{ marginRight: 6, color: 'var(--amber)' }}></i>
                      Class Teacher: {getTeacherName(selectedClass.classTeacherId)}
                    </span>
                    <span>
                      <i className="fa-solid fa-door-open" style={{ marginRight: 6, color: 'var(--blue)' }}></i>
                      Room: {selectedClass.room || 'Not assigned'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="role-detail-health">
                <div className="role-health-item">
                  <span className="role-health-val">{studentsInSelectedClass.length}</span>
                  <span className="role-health-lbl">Students</span>
                </div>
                <div className="role-health-item">
                  <span className="role-health-val">{selectedSubjects.length}</span>
                  <span className="role-health-lbl">Subjects</span>
                </div>
                <div className="role-health-item">
                  <span className="role-health-val">{teachersInSelectedClass.length}</span>
                  <span className="role-health-lbl">Teachers</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTORS */}
            <div className="role-detail-tabs">
              <button className={detailTab === 'overview' ? 'active' : ''} onClick={() => setDetailTab('overview')}>
                <i className="fa-solid fa-circle-info"></i> Overview
              </button>
              <button className={detailTab === 'students' ? 'active' : ''} onClick={() => setDetailTab('students')}>
                <i className="fa-solid fa-user-graduate"></i> Students ({studentsInSelectedClass.length})
              </button>
              <button className={detailTab === 'subjects' ? 'active' : ''} onClick={() => setDetailTab('subjects')}>
                <i className="fa-solid fa-book"></i> Subjects Curriculum ({selectedSubjects.length})
              </button>
              <button className={detailTab === 'fees' ? 'active' : ''} onClick={() => setDetailTab('fees')}>Fees ({fees.filter(f => assignedToClass(f,selectedClass.id)).length})</button>
              <button className={detailTab === 'teachers' ? 'active' : ''} onClick={() => setDetailTab('teachers')}>
                <i className="fa-solid fa-chalkboard-user"></i> Teaching Faculty ({teachersInSelectedClass.length})
              </button>
            </div>

            {detailTab === 'fees' && <ClassFees key={selectedClass.id} classroom={selectedClass} fees={fees} onSaved={updated => {setFees(updated);showToast('Class fees saved', 'success')}} />}

            {/* TAB CONTENT: OVERVIEW */}
            {detailTab === 'overview' && (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--t1)', marginBottom: '8px' }}>Class Description</h3>
                  <div style={{ padding: '14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--t2)' }}>
                    {selectedClass.description || 'No descriptive guide is configured for this classroom. Tap edit to write a classroom introduction.'}
                  </div>
                </div>

                <div className="role-overview-grid">
                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-crown" style={{ color: 'var(--amber)' }}></i> Leadership Roles</h4>
                    <div className="role-overview-row">
                      <span>Class Teacher</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{getTeacherName(selectedClass.classTeacherId)}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Class Monitor</span>
                      <span style={{ fontWeight: 600, color: 'var(--teal)' }}>
                        {selectedMonitor ? (
                          <>
                            <i className="fa-solid fa-crown" style={{ color: 'var(--amber)', marginRight: '4px' }}></i>
                            {selectedMonitor.name} (Roll {selectedMonitor.rollNo})
                          </>
                        ) : (
                          'No monitor assigned'
                        )}
                      </span>
                    </div>
                    <div className="role-overview-row">
                      <span>Room Code</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedClass.room || '—'}</span>
                    </div>
                  </div>

                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-users"></i> Classroom Capacity Matrix</h4>
                    <div className="role-overview-row">
                      <span>Maximum Seats</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedClass.capacity || 0} seats</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Seats Occupied</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{studentsInSelectedClass.length} seats</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Available Seats</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: studentsInSelectedClass.length >= (selectedClass.capacity || 0) ? 'var(--red)' : 'var(--green)',
                        }}
                      >
                        {Math.max(0, (selectedClass.capacity || 0) - studentsInSelectedClass.length)} seats
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: STUDENTS */}
            {detailTab === 'students' && (
              <div style={{ padding: '24px' }}>
                {studentsInSelectedClass.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                    <i className="fa-solid fa-user-slash" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                    No student registry matches this classroom. Add students and assign them to this class.
                  </div>
                ) : (
                  <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <table className="roles-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th>Admission Number</th>
                          <th>Gender</th>
                          <th>Guardian Details</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsInSelectedClass
                          .sort((a, b) => a.rollNo - b.rollNo)
                          .map((student) => {
                            const isMonitor = selectedClass.monitorId === student.id
                            return (
                              <tr key={student.id} className={isMonitor ? 'selected' : ''}>
                                <td>
                                  <strong style={{ color: 'var(--t1)' }}>{student.rollNo}</strong>
                                </td>
                                <td>
                                  <div className="roles-name-cell">
                                    <div
                                      className="roles-name-icon"
                                      style={{
                                        background: isMonitor ? 'var(--tealbg)' : 'var(--bluebg)',
                                        color: isMonitor ? 'var(--teal)' : 'var(--blue)',
                                      }}
                                    >
                                      <i className={`fa-solid ${isMonitor ? 'fa-crown' : 'fa-user-graduate'}`}></i>
                                    </div>
                                    <span style={{ fontWeight: isMonitor ? 700 : 500, color: 'var(--t1)' }}>
                                      {student.name}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{student.admissionNo}</span>
                                </td>
                                <td>{student.gender || '—'}</td>
                                <td>
                                  <div>
                                    <div style={{ fontSize: '12px', color: 'var(--t1)' }}>{student.guardianName || '—'}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--t3)' }}>{student.contact || '—'}</div>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${student.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                                    {student.status}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '14px' }}>
                                  {isMonitor ? (
                                    <span className="badge badge-teal">
                                      <i className="fa-solid fa-crown" style={{ color: 'var(--amber)', marginRight: '4px' }}></i>
                                      Class Monitor
                                    </span>
                                  ) : (
                                    <span className="badge badge-gray">Class Student</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: SUBJECTS CURRICULUM (CRUD LEVEL) */}
            {detailTab === 'subjects' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)' }}>
                    Assigned Subjects &amp; Teacher Mapping
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenSubjectModal('assign')}
                    >
                      <i className="fa-solid fa-link"></i> Link Existing Subject
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ borderColor: 'var(--accent)', color: 'var(--accent2)' }}
                      onClick={() => handleOpenSubjectModal('create')}
                    >
                      <i className="fa-solid fa-plus"></i> Create &amp; Add New
                    </button>
                  </div>
                </div>

                {selectedSubjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                    <i className="fa-solid fa-book-open" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                    No subject curriculums are mapped to this class room yet. Link existing ones or create new subjects above.
                  </div>
                ) : (
                  <div className="subject-crud-grid">
                    {selectedSubjects.map((subject) => {
                      const currentTeacherId = selectedClass.subjectTeacherMap?.[subject.id] || ''
                      return (
                        <div key={subject.id} className="subject-crud-card">
                          <div>
                            <div className="subject-crud-header">
                              <div
                                className="roles-name-icon"
                                style={{ background: 'var(--greenbg)', color: 'var(--green)' }}
                              >
                                <i className="fa-solid fa-book"></i>
                              </div>
                              <div>
                                <span className="subject-crud-title">{subject.name}</span>
                                <div className="subject-crud-code">{subject.code}</div>
                              </div>
                            </div>

                            <div style={{ fontSize: '12px', color: 'var(--t2)', marginTop: '8px' }}>
                              Category: <span className="badge badge-gray">{subject.category}</span>
                            </div>

                            {subject.bookName && (
                              <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '6px', lineHeight: 1.3 }}>
                                <i className="fa-solid fa-book-open" style={{ marginRight: 4 }}></i>
                                <strong>{subject.bookName}</strong> ({subject.publication || 'Optional Publisher'})
                              </div>
                            )}

                            {/* Dynamic teacher mapping */}
                            <div className="subject-crud-teacher">
                              <label>Subject Teacher</label>
                              <select aria-label="Subject Teacher"
                                className="form-select"
                                style={{ padding: '4px 8px', fontSize: '12px', marginTop: '3px' }}
                                value={currentTeacherId}
                                onChange={(e) => handleInlineTeacherChange(subject.id, e.target.value)}
                              >
                                <option value="">Select subject teacher</option>
                                {teachingStaff.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="subject-crud-actions">
                            <button
                              className="btn btn-ghost btn-xs tooltip"
                              data-tooltip="Edit Universal Details"
                              onClick={() => handleOpenSubjectModal('edit', subject.id)}
                            >
                              <i className="fa-solid fa-pen"></i> Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-xs tooltip"
                              style={{ color: 'var(--amber)' }}
                              data-tooltip="Remove from this Class"
                              onClick={() => handleUnlinkSubject(subject.id)}
                            >
                              <i className="fa-solid fa-unlink"></i> Unlink
                            </button>
                            <button
                              className="btn btn-ghost btn-xs danger tooltip"
                              data-tooltip="Delete Subject Globally"
                              onClick={() => handleCompleteDeleteSubject(subject.id)}
                            >
                              <i className="fa-solid fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: TEACHING FACULTY */}
            {detailTab === 'teachers' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)' }}>
                    Active Teaching Faculty Mapped to Class Tasks
                  </h3>
                  <span className="badge badge-blue">{teachersInSelectedClass.length} Unique Instructors</span>
                </div>

                <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                  <table className="roles-table">
                    <thead>
                      <tr>
                        <th>Teacher Name</th>
                        <th>Employee ID</th>
                        <th>Department</th>
                        <th>Global Role</th>
                        <th>Assigned Classroom Subject</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachersInSelectedClass.map((teacher) => {
                        // Gather what this teacher does in this class
                        const tasks = []
                        if (Number(selectedClass.classTeacherId) === teacher.id) {
                          tasks.push('Class Teacher')
                        }

                        // Check subjects mapping
                        Object.entries(selectedClass.subjectTeacherMap || {}).forEach(([subId, tId]) => {
                          if (Number(tId) === teacher.id) {
                            const subName = subjects.find((s) => s.id === Number(subId))?.name || 'Subject'
                            tasks.push(`Teaches: ${subName}`)
                          }
                        })

                        return (
                          <tr key={teacher.id}>
                            <td>
                              <div className="roles-name-cell">
                                <div
                                  className="roles-name-icon"
                                  style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}
                                >
                                  <i className="fa-solid fa-chalkboard-user"></i>
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{teacher.name}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace' }}>{teacher.employeeId}</span>
                            </td>
                            <td>{teacher.department}</td>
                            <td>{teacher.role}</td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {tasks.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className={`badge ${
                                      t === 'Class Teacher' ? 'badge-teal' : 'badge-purple'
                                    }`}
                                    style={{ fontSize: '10px' }}
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DETAIL VIEW FOOTER */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '18px',
                }}
              >
                <button className="btn btn-ghost" onClick={() => setViewMode('list')}>
                  <i className="fa-solid fa-arrow-left"></i> Back to Classes List
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost" onClick={() => editClass(selectedClass)}>
                    <i className="fa-solid fa-pen"></i> Edit Class Settings
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                    onClick={() => deleteClass(selectedClass)}
                  >
                    <i className="fa-solid fa-trash"></i> Delete Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUBJECT CRUD / ASSIGNMENT DIALOG MODAL */}
      {isSubjectModalOpen && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  {subjectModalMode === 'assign' && 'Link Universal Subject to Class'}
                  {subjectModalMode === 'create' && 'Create & Link Brand New Subject'}
                  {subjectModalMode === 'edit' && 'Edit Universal Subject Details'}
                </h3>
                <span className="modal-sub">
                  Target Classroom: {selectedClass?.name} {selectedClass?.section}
                </span>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setIsSubjectModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveSubjectModal}>
              <div className="modal-body">
                {subjectModalMode === 'assign' && (
                  <>
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label>Select Subject <span className="req">*</span></label>
                      <select aria-label="Select Subject"
                        className="form-select"
                        value={subModalForm.subjectId}
                        onChange={(e) => setSubModalForm({ ...subModalForm, subjectId: e.target.value })}
                        required
                      >
                        <option value="">Choose universal subject</option>
                        {subjects
                          .filter((s) => !(selectedClass?.subjectIds || []).includes(s.id))
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                )}

                {(subjectModalMode === 'create' || subjectModalMode === 'edit') && (
                  <>
                    <div className="form-grid" style={{ marginBottom: '14px' }}>
                      <div className="form-group">
                        <label>Subject Name <span className="req">*</span></label>
                        <input aria-label="Subject Name"
                          className="form-input"
                          value={subModalForm.name}
                          onChange={(e) => setSubModalForm({ ...subModalForm, name: e.target.value })}
                          placeholder="e.g. Physics"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select aria-label="Category"
                          className="form-select"
                          value={subModalForm.category}
                          onChange={(e) => setSubModalForm({ ...subModalForm, category: e.target.value })}
                        >
                          {SUBJECT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid" style={{ marginBottom: '14px' }}>
                      <div className="form-group">
                        <label>Book Title (Optional)</label>
                        <input aria-label="Book Title (Optional)"
                          className="form-input"
                          value={subModalForm.bookName}
                          onChange={(e) => setSubModalForm({ ...subModalForm, bookName: e.target.value })}
                          placeholder="Textbook title"
                        />
                      </div>
                      <div className="form-group">
                        <label>Publisher (Optional)</label>
                        <input aria-label="Publisher (Optional)"
                          className="form-input"
                          value={subModalForm.publication}
                          onChange={(e) => setSubModalForm({ ...subModalForm, publication: e.target.value })}
                          placeholder="Oxford, NCERT etc."
                        />
                      </div>
                      <div className="form-group">
                        <label>Book Code (Optional)</label>
                        <input aria-label="Book Code (Optional)"
                          className="form-input"
                          value={subModalForm.bookCode}
                          onChange={(e) => setSubModalForm({ ...subModalForm, bookCode: e.target.value })}
                          placeholder="ISBN or Catalog Code"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Subject Teacher mapping is universal across all modes of subject assignment */}
                <div className="form-group">
                  <label>Assign Subject Teacher</label>
                  <select aria-label="Assign Subject Teacher"
                    className="form-select"
                    value={subModalForm.teacherId}
                    onChange={(e) => setSubModalForm({ ...subModalForm, teacherId: e.target.value })}
                  >
                    <option value="">Select subject teacher</option>
                    {teachingStaff.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  {subjectModalMode === 'assign' && 'Link to Class'}
                  {subjectModalMode === 'create' && 'Create & Link'}
                  {subjectModalMode === 'edit' && 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* TOAST SYSTEM */}
      {toast && (
        <div className={`roles-toast roles-toast-${toast.type}`}>
          <i
            className={`fa-solid ${
              toast.type === 'success'
                ? 'fa-check-circle'
                : toast.type === 'error'
                ? 'fa-exclamation-circle'
                : 'fa-info-circle'
            }`}
          ></i>{' '}
          {toast.msg}
        </div>
      )}
    </Layout>
  )
}

