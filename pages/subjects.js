import { allowDeletion } from '../lib/recordIntegrity'
import { requirePermission } from '../lib/permissions'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import {
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  STAFF,
  STORAGE_KEYS,
  SUBJECT_CATEGORIES,
  makeId,
  makeSubjectCode,
  readStoredList,
  writeStoredList,
} from '../lib/academicData'
import { exportToCSV, printToPDF } from '../lib/exportUtils'

const emptyForm = {
  name: '',
  category: 'Compulsory',
  publication: '',
  bookName: '',
  bookCode: '',
  status: 'active',
  classIds: [], // Selected classes where this subject is taught
}

export default function Subjects() {
  const router = useRouter()
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS)
  const [classes, setClasses] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  
  // Search, Filters, Sorting States
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name') // 'name' | 'code' | 'category' | 'classCount'
  const [sortDir, setSortDir] = useState('asc') // 'asc' | 'desc'
  
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)

  useEffect(() => {
    const storedSubjects = readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS)
    setSubjects(storedSubjects)
    
    const storedClasses = readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES)
    setClasses(storedClasses)

    setAllStudents(readStoredList(STORAGE_KEYS.students, []))
    setStaff(readStoredList(STORAGE_KEYS.staff, STAFF))
    
    // Choose initial selected subject
    setSelectedSubjectId(storedSubjects[0]?.id || null)
    setHydrated(true)
  }, [])

  // Handle deep-link selected subject ID via query parameter
  useEffect(() => {
    if (!hydrated || !router.query.id) return
    const qId = Number(router.query.id)
    if (qId) {
      setSelectedSubjectId(qId)
      setViewMode('detail')
    }
  }, [router.query.id, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.subjects, subjects)
  }, [subjects, hydrated])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0]

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  // Handle subject active/inactive block toggle
  const toggleSubjectStatus = (subjectId) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id === subjectId) {
          const nextStatus = s.status === 'active' ? 'inactive' : 'active'
          showToast(`Subject "${s.name}" is now ${nextStatus === 'active' ? 'active' : 'inactive'}.`, 'info')
          return { ...s, status: nextStatus }
        }
        return s
      })
    )
  }

  // Filtered and Sorted Subjects
  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase()
    return subjects
      .filter((subject) => {
        // Category filter
        if (categoryFilter !== 'all' && subject.category !== categoryFilter) return false
        
        // Status filter
        if (statusFilter !== 'all' && subject.status !== statusFilter) return false
        
        // Class filter
        if (classFilter !== 'all') {
          const cls = classes.find((c) => c.id === Number(classFilter))
          if (!cls || !(cls.subjectIds || []).includes(subject.id)) return false
        }

        // Search match
        if (!query) return true
        return [subject.name, subject.code, subject.publication, subject.bookName, subject.bookCode]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        let valA, valB
        if (sortBy === 'name') {
          valA = a.name
          valB = b.name
        } else if (sortBy === 'code') {
          valA = a.code
          valB = b.code
        } else if (sortBy === 'category') {
          valA = a.category
          valB = b.category
        } else if (sortBy === 'classCount') {
          valA = classes.filter((c) => (c.subjectIds || []).includes(a.id)).length
          valB = classes.filter((c) => (c.subjectIds || []).includes(b.id)).length
        }
        
        if (typeof valA === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        } else {
          return sortDir === 'asc' ? valA - valB : valB - valA
        }
      })
  }, [subjects, search, categoryFilter, statusFilter, classFilter, classes, sortBy, sortDir])

  const stats = useMemo(() => ({
    total: subjects.length,
    active: subjects.filter((s) => s.status === 'active').length,
    withBooks: subjects.filter((s) => s.bookName || s.publication || s.bookCode).length,
    categories: new Set(subjects.map((s) => s.category)).size,
  }), [subjects])

  // Exports handlers
  const handleExportCSV = () => {
    const headers = [
      'Subject Name',
      'Subject Code',
      'Category',
      'Book Name',
      'Publisher',
      'Book Code',
      'Classes Using',
      'Status',
    ]

    const rows = filteredSubjects.map((s) => {
      const clsUsing = classes
        .filter((c) => (c.subjectIds || []).includes(s.id))
        .map((c) => `${c.name}${c.section ? ` ${c.section}` : ''}`)
        .join('; ')

      return [
        s.name,
        s.code,
        s.category,
        s.bookName || 'Optional',
        s.publication || 'Optional',
        s.bookCode || 'Optional',
        clsUsing || 'None',
        s.status,
      ]
    })

    exportToCSV('subjects_list.csv', headers, rows)
    showToast('Subjects list exported to CSV successfully', 'success')
  }

  const handleExportPDF = () => {
    const headers = [
      'Subject Name',
      'Subject Code',
      'Category',
      'Textbook Mapping',
      'Classes Mapped',
      'Status',
    ]

    const rows = filteredSubjects.map((s) => {
      const classCount = classes.filter((c) => (c.subjectIds || []).includes(s.id)).length
      const bookDetail = s.bookName ? `${s.bookName} (${s.publication || 'N/A'})` : '—'
      return [
        s.name,
        s.code,
        s.category,
        bookDetail,
        `${classCount} Classes`,
        s.status.toUpperCase(),
      ]
    })

    printToPDF(
      'Subjects Registry Report',
      headers,
      rows,
      `Filtered Subjects List (${filteredSubjects.length} Subjects)`
    )
    showToast('Generating printable PDF...', 'info')
  }

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleToggleClassInForm = (classId) => {
    setForm((current) => {
      const classIds = current.classIds.includes(classId)
        ? current.classIds.filter((id) => id !== classId)
        : [...current.classIds, classId]
      return { ...current, classIds }
    })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const saveSubject = (event) => {
    event?.preventDefault?.(); if (!requirePermission(editingId ? 'edit' : 'create')) return

    event.preventDefault()
    const name = form.name.trim()

    if (!name) {
      showToast('Subject name is required', 'error')
      return
    }

    const duplicate = subjects.some(
      (subject) => subject.id !== editingId && subject.name.trim().toLowerCase() === name.toLowerCase()
    )

    if (duplicate) {
      showToast('A subject with this name already exists', 'error')
      return
    }

    const payload = {
      name,
      category: form.category,
      publication: form.publication.trim(),
      bookName: form.bookName.trim(),
      bookCode: form.bookCode.trim(),
      status: form.status,
    }

    let subjectId = editingId
    let updatedSubjects = []

    if (editingId) {
      updatedSubjects = subjects.map((subject) =>
        subject.id === editingId ? { ...subject, ...payload } : subject
      )
      setSubjects(updatedSubjects)
      showToast('Subject details updated successfully', 'success')
    } else {
      subjectId = makeId()
      const newSub = {
        id: subjectId,
        code: makeSubjectCode(name),
        ...payload,
      }
      updatedSubjects = [...subjects, newSub]
      setSubjects(updatedSubjects)
      setSelectedSubjectId(subjectId)
      showToast('Subject created and added to universal list', 'success')
    }

    // Update classes maps
    const updatedClasses = classes.map((c) => {
      const isSelected = form.classIds.includes(c.id)
      const subjectIds = c.subjectIds || []
      const subjectTeacherMap = c.subjectTeacherMap || {}

      if (isSelected) {
        // Link to class
        const nextSubjIds = subjectIds.includes(subjectId)
          ? subjectIds
          : [...subjectIds, subjectId]
        return { ...c, subjectIds: nextSubjIds }
      } else {
        // Unlink from class
        const nextSubjIds = subjectIds.filter((id) => id !== subjectId)
        const nextMap = { ...subjectTeacherMap }
        delete nextMap[subjectId]
        return { ...c, subjectIds: nextSubjIds, subjectTeacherMap: nextMap }
      }
    })

    setClasses(updatedClasses)
    writeStoredList(STORAGE_KEYS.classes, updatedClasses)

    resetForm()
    setViewMode('list')
  }

  const editSubject = (subject) => {
    setEditingId(subject.id)
    setSelectedSubjectId(subject.id)
    
    // Find classes linked to this subject
    const linkedClassIds = classes
      .filter((c) => (c.subjectIds || []).includes(subject.id))
      .map((c) => c.id)

    setForm({
      name: subject.name,
      category: subject.category,
      publication: subject.publication || '',
      bookName: subject.bookName || '',
      bookCode: subject.bookCode || '',
      status: subject.status,
      classIds: linkedClassIds,
    })
    setViewMode('edit')
  }

  const deleteSubject = (subject) => {
    if (!allowDeletion('subject', subject)) return
    if (!requirePermission('delete')) return

    if (!confirm(`Delete "${subject.name}"? This removes it from all assigned classes.`)) return
    
    // 1. Remove from universal subjects
    setSubjects((current) => current.filter((item) => item.id !== subject.id))
    
    // 2. Unlink from all classes
    const updatedClasses = classes.map((c) => {
      const nextSubjIds = (c.subjectIds || []).filter((id) => id !== subject.id)
      const nextMap = { ...(c.subjectTeacherMap || {}) }
      delete nextMap[subject.id]
      return { ...c, subjectIds: nextSubjIds, subjectTeacherMap: nextMap }
    })
    
    setClasses(updatedClasses)
    writeStoredList(STORAGE_KEYS.classes, updatedClasses)

    if (selectedSubjectId === subject.id) {
      const remaining = subjects.filter((item) => item.id !== subject.id)
      setSelectedSubjectId(remaining[0]?.id || null)
    }
    if (editingId === subject.id) resetForm()
    showToast('Subject deleted globally', 'info')
    setViewMode('list')
  }

  // Classes currently using the selected subject
  const mappedClasses = selectedSubject
    ? classes.filter((c) => (c.subjectIds || []).includes(selectedSubject.id))
    : []

  return (
    <Layout>
      {/* HEADER SECTION */}
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-book" style={{ color: 'var(--green)', marginRight: 8 }}></i>
            Universal Subjects
          </h1>
          <p>
            {viewMode === 'list' && 'Maintain the master registry of academic subjects, textbooks, and tracking references.'}
            {viewMode === 'create' && 'Register a new subject, map textbooks, and select linked classrooms.'}
            {viewMode === 'edit' && `Edit registry parameters for subject "${selectedSubject?.name}".`}
            {viewMode === 'detail' && `Course details and classroom deployments for subject "${selectedSubject?.name}".`}
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
                <i className="fa-solid fa-plus"></i> New Subject
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
            <div className="stat-card-icon" style={{ background: 'var(--accentbg)', color: 'var(--accent)' }}>
              <i className="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.total}</div>
              <div className="stat-card-label">Total Subjects</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--greenbg)', color: 'var(--green)' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.active}</div>
              <div className="stat-card-label">Active Registry</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}>
              <i className="fa-solid fa-book-open"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.withBooks}</div>
              <div className="stat-card-label">Textbooks Mapped</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--amberbg)', color: 'var(--amber)' }}>
              <i className="fa-solid fa-tags"></i>
            </div>
            <div>
              <div className="stat-card-value">{stats.categories}</div>
              <div className="stat-card-label">Categories</div>
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
                <input aria-label="Search subject name, code, textbook publisher..."
                  placeholder="Search subject name, code, textbook publisher..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              
              <select aria-label="Category Filter"
                className="roles-filter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All Categories</option>
                {SUBJECT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select aria-label="Status Filter"
                className="roles-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select aria-label="Class Filter"
                className="roles-filter"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
              >
                <option value="all">Filter by Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name} {c.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Table Wrap */}
            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                      Subject Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('code')} style={{ cursor: 'pointer' }}>
                      Subject Code {sortBy === 'code' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('category')} style={{ cursor: 'pointer' }}>
                      Category {sortBy === 'category' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Mapped Textbook details</th>
                    <th onClick={() => toggleSort('classCount')} style={{ cursor: 'pointer' }}>
                      Classes Assigned {sortBy === 'classCount' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="roles-empty">
                        No universal subjects match the search query.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((subject) => {
                      const classCount = classes.filter((c) => (c.subjectIds || []).includes(subject.id)).length
                      return (
                        <tr
                          key={subject.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedSubjectId(subject.id)
                            setViewMode('detail')
                          }}
                        >
                          <td>
                            <div className="roles-name-cell">
                              <div
                                className="roles-name-icon"
                                style={{ background: 'var(--greenbg)', color: 'var(--green)' }}
                              >
                               <i className="fa-solid fa-book"></i>
                              </div>
                              <div className="roles-name-text">{subject.name}</div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace' }}>{subject.code}</span>
                          </td>
                          <td>
                            <span className="badge badge-blue">{subject.category}</span>
                          </td>
                          <td>
                            <div className="academic-book-cell">
                              <strong>{subject.bookName || 'No book assigned'}</strong>
                              <span>{subject.publication || 'Publisher optional'}</span>
                              <small>{subject.bookCode || 'Catalog optional'}</small>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-teal">{classCount} Classes</span>
                          </td>
                          <td>
                            <span className={`badge ${subject.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                              {subject.status}
                            </span>
                          </td>
                          <td onClick={(event) => event.stopPropagation()} style={{ textAlign: 'right', paddingRight: '16px' }}>
                            <div className="roles-actions">
                              <button aria-label="View"
                                className="btn-icon-sm tooltip"
                                data-tooltip="View Details"
                                onClick={() => {
                                  setSelectedSubjectId(subject.id)
                                  setViewMode('detail')
                                }}
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                              <button aria-label="Edit"
                                className="btn-icon-sm tooltip"
                                data-tooltip="Edit Details"
                                onClick={() => editSubject(subject)}
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button
                                className="btn-icon-sm tooltip"
                                data-tooltip={subject.status === 'active' ? 'Block Subject' : 'Unblock Subject'}
                                onClick={() => toggleSubjectStatus(subject.id)}
                                style={{ color: subject.status === 'active' ? 'var(--amber)' : 'var(--green)' }}
                              >
                                <i className={`fa-solid ${subject.status === 'active' ? 'fa-ban' : 'fa-check'}`}></i>
                              </button>
                              <button aria-label="Delete"
                                className="btn-icon-sm danger tooltip"
                                data-tooltip="Delete Subject"
                                onClick={() => deleteSubject(subject)}
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
            <form className="roles-table-card academic-form-card" onSubmit={saveSubject}>
              <div className="section-divider" style={{ marginTop: 0 }}>
                <span className="section-divider-label">
                  {editingId ? 'Edit Subject Registry' : 'Create Universal Subject'}
                </span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Subject Name <span className="req">*</span></label>
                  <input aria-label="Subject Name"
                    className="form-input"
                    value={form.name}
                    onChange={(event) => updateForm('name', event.target.value)}
                    placeholder="e.g. Science"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select aria-label="Category"
                    className="form-select"
                    value={form.category}
                    onChange={(event) => updateForm('category', event.target.value)}
                  >
                    {SUBJECT_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Textbook Title (Optional)</label>
                  <input aria-label="Textbook Title (Optional)"
                    className="form-input"
                    value={form.bookName}
                    onChange={(event) => updateForm('bookName', event.target.value)}
                    placeholder="e.g. Modern Physics Guide"
                  />
                </div>
                <div className="form-group">
                  <label>Publisher (Optional)</label>
                  <input aria-label="Publisher (Optional)"
                    className="form-input"
                    value={form.publication}
                    onChange={(event) => updateForm('publication', event.target.value)}
                    placeholder="e.g. Oxford Press"
                  />
                </div>
                <div className="form-group">
                  <label>Book Catalog Code (Optional)</label>
                  <input aria-label="Book Catalog Code (Optional)"
                    className="form-input"
                    value={form.bookCode}
                    onChange={(event) => updateForm('bookCode', event.target.value)}
                    placeholder="ISBN or unique catalog code"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select aria-label="Status"
                    className="form-select"
                    value={form.status}
                    onChange={(event) => updateForm('status', event.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Connected Classes Checklist */}
              <div className="section-divider">
                <span className="section-divider-label">Deploy to Classrooms</span>
                <div className="section-divider-line"></div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--t2)', marginBottom: '12px' }}>
                Select classroom groups where this subject must be linked. 
              </p>

              <div className="academic-subject-picker" style={{ gap: '10px' }}>
                {classes.filter((c) => c.status === 'active').map((c) => {
                  const isChecked = form.classIds.includes(c.id)
                  return (
                    <label key={c.id} className={`perm-action ${isChecked ? 'checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleClassInForm(c.id)}
                      />
                      <span>
                        {c.name} {c.section ? ` - ${c.section}` : ''}
                      </span>
                    </label>
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
                  {editingId ? 'Save Configuration' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DETAIL VIEW */}
        {viewMode === 'detail' && selectedSubject && (
          <div className="roles-table-card academic-detail-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="role-detail-profile" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="role-detail-info">
                <div className="role-detail-icon" style={{ background: 'var(--greenbg)', color: 'var(--green)' }}>
                  <i className="fa-solid fa-book"></i>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--t1)' }}>{selectedSubject.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    <span className={`badge ${selectedSubject.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                      {selectedSubject.status}
                    </span>
                    <span>
                      <i className="fa-solid fa-barcode" style={{ marginRight: 4 }}></i> Code: {selectedSubject.code}
                    </span>
                    <span>
                      <i className="fa-solid fa-tags" style={{ marginRight: 4 }}></i> Category: {selectedSubject.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="role-detail-health">
                <div className="role-health-item">
                  <span className="role-health-val">{mappedClasses.length}</span>
                  <span className="role-health-lbl">Classes Used</span>
                </div>
                <div className="role-health-item">
                  <span className="role-health-val">{selectedSubject.bookName ? 1 : 0}</span>
                  <span className="role-health-lbl">Book Mapped</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <div className="role-overview-grid" style={{ marginBottom: '24px' }}>
                <div className="role-overview-card">
                  <h4><i className="fa-solid fa-book-open"></i> Textbook Mapping</h4>
                  <div className="role-overview-row">
                    <span>Book Title</span>
                    <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedSubject.bookName || 'Not mapped'}</span>
                  </div>
                  <div className="role-overview-row">
                    <span>Publisher</span>
                    <span>{selectedSubject.publication || 'Not specified'}</span>
                  </div>
                  <div className="role-overview-row">
                    <span>Book Code</span>
                    <span style={{ fontFamily: 'monospace' }}>{selectedSubject.bookCode || 'Not assigned'}</span>
                  </div>
                </div>
                <div className="role-overview-card">
                  <h4><i className="fa-solid fa-circle-info"></i> Subject Metadata</h4>
                  <div className="role-overview-row">
                    <span>Subject Code</span>
                    <span>{selectedSubject.code}</span>
                  </div>
                  <div className="role-overview-row">
                    <span>Category classification</span>
                    <span>{selectedSubject.category}</span>
                  </div>
                  <div className="role-overview-row">
                    <span>Active Status</span>
                    <span>{selectedSubject.status}</span>
                  </div>
                </div>
              </div>

              <div className="section-divider">
                <span className="section-divider-label">Classrooms Deployment ({mappedClasses.length})</span>
                <div className="section-divider-line"></div>
              </div>

              <div style={{ marginTop: '12px' }}>
                {mappedClasses.length === 0 ? (
                  <div style={{ color: 'var(--t3)', fontSize: 13, padding: '12px 0' }}>
                    This subject is not currently assigned to any classrooms.
                  </div>
                ) : (
                  <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <table className="roles-table">
                      <thead>
                        <tr>
                          <th>Classroom Name</th>
                          <th>Class Code</th>
                          <th>Room</th>
                          <th>Class Teacher</th>
                          <th>Subject Teacher Mapped</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedClasses.map((c) => {
                          const subjTeacherId = c.subjectTeacherMap?.[selectedSubject.id]
                          const subjTeacherName = staff.find((t) => t.id === Number(subjTeacherId))?.name || 'Not assigned'
                          const classTeacherName = staff.find((t) => t.id === Number(c.classTeacherId))?.name || 'Unassigned'
                          return (
                            <tr key={c.id}>
                              <td>
                                <strong style={{ color: 'var(--t1)' }}>
                                  {c.name} {c.section ? ` - ${c.section}` : ''}
                                </strong>
                              </td>
                              <td>
                                <span className="badge badge-gray">{c.classCode || '—'}</span>
                              </td>
                              <td>{c.room || '—'}</td>
                              <td>{classTeacherName}</td>
                              <td>
                                <span style={{ fontWeight: 600, color: 'var(--teal)' }}>
                                  <i className="fa-solid fa-chalkboard-user" style={{ marginRight: 4 }}></i>
                                  {subjTeacherName}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right', paddingRight: '12px' }}>
                                <button
                                  className="btn btn-ghost btn-xs tooltip"
                                  data-tooltip="View Classroom Details"
                                  onClick={() => router.push(`/classes?id=${c.id}`)}
                                >
                                  <i className="fa-solid fa-external-link"></i> View Class
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <button className="btn btn-ghost" onClick={() => setViewMode('list')}>
                  <i className="fa-solid fa-arrow-left"></i> Back to List
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost" onClick={() => editSubject(selectedSubject)}>
                    <i className="fa-solid fa-pen"></i> Edit Subject Registry
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                    onClick={() => deleteSubject(selectedSubject)}
                  >
                    <i className="fa-solid fa-trash"></i> Delete Subject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

