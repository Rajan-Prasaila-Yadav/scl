import { studentAttendanceSummary } from '../lib/attendanceSummary'
import { readObject } from '../lib/storage'
import { currencySymbol } from '../lib/schoolConfig'
import { requirePermission } from '../lib/permissions'
import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  INITIAL_PARENTS,
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  readStoredList,
  writeStoredList,
  makeId,
} from '../lib/academicData'

const emptyForm = {
  name: '',
  parentId: '',
  phone: '',
  email: '',
  occupation: '',
  relationship: 'Father',
  status: 'active',
  studentIds: [],
  permanentAddress: {
    district: '',
    country: '',
    city: '',
    zip: '',
    state: '',
    street: '',
    wardNo: '',
    municipalityType: '',
  },
  temporaryAddress: {
    district: '',
    country: '',
    city: '',
    zip: '',
    state: '',
    street: '',
    wardNo: '',
    municipalityType: '',
  },
  sameAsPermanent: true,
}

function makeParentIdCode() {
  return `PRN-${makeId().toString(36).toUpperCase()}`
}


const DEFAULT_RELATIONS = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Brother', 'Sister']

export default function Parents() {
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedParentId, setSelectedParentId] = useState(null)
  const [detailTab, setDetailTab] = useState('overview') // 'overview' | 'children'

  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const [selectedClassId, setSelectedClassId] = useState('')
  const [tempSelectedStudentIds, setTempSelectedStudentIds] = useState([])

  // Custom relation designations (persisted)
  const [customRelations, setCustomRelations] = useState([])
  const [otherRelationText, setOtherRelationText] = useState('')

  // All available relations = defaults + saved custom ones
  const allRelations = useMemo(() => {
    const combined = [...DEFAULT_RELATIONS]
    customRelations.forEach(r => { if (!combined.includes(r)) combined.push(r) })
    return combined
  }, [customRelations])

  // Is the current form value a non-default (custom) relation?
  const isOtherSelected = form.relationship === '__other__'

  useEffect(() => {
    const storedParents = readStoredList(STORAGE_KEYS.parents, INITIAL_PARENTS)
    setParents(storedParents)
    setSelectedParentId(storedParents[0]?.id || null)
    setStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    // Load custom relations from localStorage
    const saved = readStoredList('educore.customRelations', [])
    setCustomRelations(saved)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.parents, parents)
  }, [parents, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.customRelations', customRelations)
  }, [customRelations, hydrated])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  const selectedParent = parents.find((p) => p.id === selectedParentId) || parents[0]

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  const filteredParents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return parents
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false
        if (!query) return true
        
        // Match parent details or their linked children name
        const linkedChildrenNames = (p.studentIds || [])
          .map(id => students.find(s => s.id === id)?.name || '')
          .join(' ')
          .toLowerCase()

        return [
          p.name,
          p.parentId,
          p.phone,
          p.email,
          p.occupation,
          linkedChildrenNames
        ]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        let valA = a[sortBy] || ''
        let valB = b[sortBy] || ''

        if (typeof valA === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        } else {
          return sortDir === 'asc' ? valA - valB : valB - valA
        }
      })
  }, [parents, students, search, statusFilter, sortBy, sortDir])

  const classStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students.filter(s => String(s.classId) === String(selectedClassId) && !form.studentIds.includes(s.id))
  }, [selectedClassId, students, form.studentIds])

  const updateForm = (key, value) => setForm((c) => ({ ...c, [key]: value }))

  const updateAddressField = (addressKey, fieldKey, val) => {
    setForm((prev) => {
      const nextAddress = {
        ...(prev[addressKey] || {}),
        [fieldKey]: val
      }
      const nextState = {
        ...prev,
        [addressKey]: nextAddress
      }
      if (nextState.sameAsPermanent && addressKey === 'permanentAddress') {
        nextState.temporaryAddress = { ...nextAddress }
      }
      return nextState
    })
  }

  const handleSameAsPermanentToggle = (checked) => {
    setForm((prev) => {
      const nextState = {
        ...prev,
        sameAsPermanent: checked
      }
      if (checked) {
        nextState.temporaryAddress = {
          ...(prev.permanentAddress || {})
        }
      }
      return nextState
    })
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setSelectedClassId('')
    setTempSelectedStudentIds([])
    setOtherRelationText('')
  }

  const saveParent = (e) => {
    e?.preventDefault?.(); if (!requirePermission(editingId ? 'edit' : 'create')) return

    e.preventDefault()
    const name = form.name.trim()
    const phone = form.phone.trim()

    // Resolve final relationship value (handle custom "Other" entry)
    let finalRelationship = form.relationship
    if (form.relationship === '__other__') {
      const customVal = otherRelationText.trim()
      if (!customVal) {
        showToast('Please enter a custom relation name', 'error')
        return
      }
      finalRelationship = customVal
      // Persist so it appears in dropdown next time
      if (!customRelations.includes(customVal)) {
        setCustomRelations(prev => [...prev, customVal])
      }
    }

    if (!name) {
      showToast('Parent name is required', 'error')
      return
    }
    if (!phone) {
      showToast('Phone number is required', 'error')
      return
    }

    const parentIdCode = form.parentId.trim() || makeParentIdCode()
    const duplicateId = parents.some((p) => p.id !== editingId && p.parentId === parentIdCode)
    if (duplicateId) {
      showToast('Parent ID code already exists', 'error')
      return
    }

    const payload = {
      name,
      parentId: parentIdCode,
      phone,
      email: form.email ? form.email.trim() : '',
      occupation: form.occupation.trim(),
      relationship: finalRelationship,
      status: form.status,
      studentIds: form.studentIds,
      permanentAddress: {
        district: (form.permanentAddress?.district || '').trim(),
        country: (form.permanentAddress?.country || '').trim(),
        city: (form.permanentAddress?.city || '').trim(),
        zip: (form.permanentAddress?.zip || '').trim(),
        state: (form.permanentAddress?.state || '').trim(),
        street: (form.permanentAddress?.street || '').trim(),
        wardNo: (form.permanentAddress?.wardNo || '').trim(),
        municipalityType: form.permanentAddress?.municipalityType || '',
      },
      temporaryAddress: {
        district: (form.temporaryAddress?.district || '').trim(),
        country: (form.temporaryAddress?.country || '').trim(),
        city: (form.temporaryAddress?.city || '').trim(),
        zip: (form.temporaryAddress?.zip || '').trim(),
        state: (form.temporaryAddress?.state || '').trim(),
        street: (form.temporaryAddress?.street || '').trim(),
        wardNo: (form.temporaryAddress?.wardNo || '').trim(),
        municipalityType: form.temporaryAddress?.municipalityType || '',
      },
      sameAsPermanent: !!form.sameAsPermanent,
    }

    if (editingId) {
      setParents((current) =>
        current.map((p) => (p.id === editingId ? { ...p, ...payload } : p))
      )
      showToast('Parent updated successfully', 'success')
    } else {
      const id = makeId()
      setParents((current) => [...current, { id, ...payload }])
      setSelectedParentId(id)
      showToast('Parent registered successfully', 'success')
    }

    resetForm()
    setViewMode('list')
  }

  const editParent = (p) => {
    setEditingId(p.id)
    setSelectedParentId(p.id)
    setOtherRelationText('')
    setForm({
      name: p.name,
      parentId: p.parentId || '',
      phone: p.phone || '',
      email: p.email || '',
      occupation: p.occupation || '',
      relationship: p.relationship || 'Father',
      status: p.status || 'active',
      studentIds: p.studentIds || [],
      permanentAddress: {
        district: p.permanentAddress?.district || '',
        country: p.permanentAddress?.country || '',
        city: p.permanentAddress?.city || p.address?.city || (typeof p.address === 'string' ? p.address : ''),
        zip: p.permanentAddress?.zip || p.address?.zip || '',
        state: p.permanentAddress?.state || p.address?.state || '',
        street: p.permanentAddress?.street || p.address?.street || '',
        wardNo: p.permanentAddress?.wardNo || '',
        municipalityType: p.permanentAddress?.municipalityType || '',
      },
      temporaryAddress: {
        district: p.temporaryAddress?.district || '',
        country: p.temporaryAddress?.country || '',
        city: p.temporaryAddress?.city || '',
        zip: p.temporaryAddress?.zip || '',
        state: p.temporaryAddress?.state || '',
        street: p.temporaryAddress?.street || '',
        wardNo: p.temporaryAddress?.wardNo || '',
        municipalityType: p.temporaryAddress?.municipalityType || '',
      },
      sameAsPermanent: p.sameAsPermanent !== undefined ? !!p.sameAsPermanent : true,
    })
    setViewMode('edit')
  }

  const deleteParent = (p) => {
    if (!requirePermission('delete')) return

    if (!confirm(`Are you sure you want to delete parent "${p.name}"?`)) return
    setParents((current) => current.filter((item) => item.id !== p.id))
    if (selectedParentId === p.id) {
      const remaining = parents.filter((item) => item.id !== p.id)
      setSelectedParentId(remaining[0]?.id || null)
    }
    if (editingId === p.id) resetForm()
    showToast('Parent record deleted', 'info')
    setViewMode('list')
  }

  const toggleParentStatus = (pId) => {
    setParents((prev) =>
      prev.map((p) => {
        if (p.id === pId) {
          const nextStatus = p.status === 'active' ? 'inactive' : 'active'
          showToast(`Parent status updated to ${nextStatus}`, 'info')
          return { ...p, status: nextStatus }
        }
        return p
      })
    )
  }

  const getClassName = (classId) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return 'Unassigned'
    return `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`
  }

  const getLinkedChildrenBadges = (studentIds = []) => {
    if (studentIds.length === 0) return <span style={{ color: 'var(--t3)', fontStyle: 'italic' }}>None linked</span>
    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {studentIds.map((id) => {
          const child = students.find((s) => s.id === id)
          if (!child) return null
          return (
            <span key={id} className="badge badge-blue" style={{ fontSize: '10px' }}>
              {child.name} ({getClassName(child.classId)})
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <Layout>
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-people-roof" style={{ color: 'var(--blue)', marginRight: 8 }}></i>
            Parents
          </h1>
          <p>
            {viewMode === 'list' && 'Manage parent details, map relationships with students, and inspect associated student metrics.'}
            {viewMode === 'create' && 'Register a new parent/guardian profile with address and student mappings.'}
            {viewMode === 'edit' && `Update records and linked children checklist for ${selectedParent?.name}.`}
            {viewMode === 'detail' && `Overview records, contact details, and student mapping card for ${selectedParent?.name}.`}
          </p>
        </div>
        <div className="settings-actions">
          {viewMode === 'list' && (
            <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setViewMode('create'); }}>
              <i className="fa-solid fa-plus"></i> New Parent
            </button>
          )}
          {viewMode !== 'list' && (
            <button className="btn btn-ghost btn-sm" onClick={() => { resetForm(); setViewMode('list'); }}>
              <i className="fa-solid fa-arrow-left"></i> Back to List
            </button>
          )}
        </div>
      </div>

      <div>
        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
            <div className="roles-toolbar academic-toolbar">
              <div className="roles-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search name, ID, phone, child..."
                  placeholder="Search name, ID, phone, child..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              <select aria-label="Status Filter" className="roles-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Parent Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('parentId')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Parent ID {sortBy === 'parentId' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Phone Number</th>
                    <th onClick={() => toggleSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Email Address {sortBy === 'email' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Relation</th>
                    <th>Linked Children (Students)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParents.length === 0 ? (
                    <tr><td colSpan={8} className="roles-empty">No parent profiles found</td></tr>
                  ) : filteredParents.map((p) => (
                    <tr
                      key={p.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedParentId(p.id)
                        setDetailTab('overview')
                        setViewMode('detail')
                      }}
                    >
                      <td>
                        <div className="roles-name-cell">
                          <div className="roles-name-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}>
                            <i className="fa-solid fa-user-tie"></i>
                          </div>
                          <div>
                            <div className="roles-name-text">{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{p.occupation || 'No occupation logged'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.parentId}</span>
                      </td>
                      <td>{p.phone}</td>
                      <td><span style={{ textTransform: 'none' }}>{p.email || '—'}</span></td>
                      <td>{p.relationship}</td>
                      <td>{getLinkedChildrenBadges(p.studentIds)}</td>
                      <td>
                        <span className={`badge ${p.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                          {p.status || 'active'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <div className="roles-actions">
                          <button aria-label="View" className="btn-icon-sm" title="View" onClick={() => { setSelectedParentId(p.id); setDetailTab('overview'); setViewMode('detail'); }}>
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button aria-label="Edit" className="btn-icon-sm" title="Edit" onClick={() => editParent(p)}>
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button className="btn-icon-sm" title={p.status === 'active' ? 'Block' : 'Unblock'} onClick={() => toggleParentStatus(p.id)} style={{ color: p.status === 'active' ? 'var(--amber)' : 'var(--green)' }}>
                            <i className={`fa-solid ${p.status === 'active' ? 'fa-ban' : 'fa-check'}`}></i>
                          </button>
                          <button aria-label="Delete" className="btn-icon-sm danger" title="Delete" onClick={() => deleteParent(p)}>
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

        {/* CREATE / EDIT FORM */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <form className="roles-table-card academic-form-card" onSubmit={saveParent}>
              <div className="section-divider" style={{ marginTop: 0 }}>
                <span className="section-divider-label">
                  {editingId ? 'Edit Parent Profile' : 'Add New Parent'}
                </span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name <span className="req">*</span></label>
                  <input aria-label="Full Name"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="e.g. Suresh Mehta"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Parent ID Code</label>
                  <input aria-label="Parent ID Code"
                    className="form-input"
                    value={form.parentId}
                    onChange={(e) => updateForm('parentId', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number <span className="req">*</span></label>
                  <input aria-label="Phone Number"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input aria-label="Email Address"
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="e.g. email@domain.com"
                  />
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input aria-label="Occupation"
                    className="form-input"
                    value={form.occupation}
                    onChange={(e) => updateForm('occupation', e.target.value)}
                    placeholder="e.g. Doctor, Businessman"
                  />
                </div>
                <div className="form-group">
                  <label>Relation Designation</label>
                  <select aria-label="Relation Designation"
                    className="form-select"
                    value={isOtherSelected ? '__other__' : (allRelations.includes(form.relationship) ? form.relationship : form.relationship)}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '__other__') {
                        updateForm('relationship', '__other__')
                        setOtherRelationText('')
                      } else {
                        updateForm('relationship', val)
                        setOtherRelationText('')
                      }
                    }}
                  >
                    {allRelations.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                    <option value="__other__">Other (Custom)…</option>
                  </select>

                  {/* Show text input when Other is selected */}
                  {isOtherSelected && (
                    <div style={{ marginTop: '8px', position: 'relative' }}>
                      <input aria-label="Relation Designation"
                        className="form-input"
                        autoFocus
                        value={otherRelationText}
                        onChange={(e) => setOtherRelationText(e.target.value)}
                        placeholder="Type custom relation e.g. Grandfather, Step-Father…"
                        style={{ paddingRight: '36px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const val = otherRelationText.trim()
                            if (!val) return
                            if (!customRelations.includes(val)) {
                              setCustomRelations(prev => [...prev, val])
                            }
                            updateForm('relationship', val)
                            setOtherRelationText('')
                          }
                        }}
                      />
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--t3)', pointerEvents: 'none' }}>↵ Enter to confirm</span>
                    </div>
                  )}

                  {/* Show hint if current value is a saved custom one (not in defaults) */}
                  {!isOtherSelected && !DEFAULT_RELATIONS.includes(form.relationship) && form.relationship && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fa-solid fa-tag"></i> Custom relation saved: <strong>{form.relationship}</strong>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select aria-label="Status" className="form-select" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Child checkboxes multi-selector */}
              <div className="section-divider">
                <span className="section-divider-label">Link Children (Students)</span>
                <div className="section-divider-line"></div>
              </div>

              <div style={{ padding: '0 8px 12px 8px', fontSize: '12px', color: 'var(--t3)' }}>
                Select a class to load its active students. Choose multiple students using checkboxes, click the "Add to Linked Children" button, and repeat for other classes if necessary.
              </div>

              <div style={{ padding: '0 8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ margin: 0, minWidth: '220px', flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Choose Class Name</label>
                    <select aria-label="Choose Class Name"
                      className="form-select"
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value)
                        setTempSelectedStudentIds([])
                      }}
                      style={{ height: '36px' }}
                    >
                      <option value="">-- Select Class --</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.section ? `- ${cls.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ height: '36px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      if (tempSelectedStudentIds.length === 0) {
                        showToast('Select at least one student to link', 'error')
                        return
                      }
                      setForm((prev) => ({
                        ...prev,
                        studentIds: [...new Set([...prev.studentIds, ...tempSelectedStudentIds])]
                      }))
                      setTempSelectedStudentIds([])
                      showToast(`${tempSelectedStudentIds.length} child(ren) added to list`, 'success')
                    }}
                    disabled={!selectedClassId || tempSelectedStudentIds.length === 0}
                  >
                    <i className="fa-solid fa-plus"></i> Add to Linked Children
                  </button>
                </div>

                {selectedClassId && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', background: 'var(--bg3)', marginBottom: '20px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 800, color: 'var(--t1)' }}>
                      Available Students in {getClassName(Number(selectedClassId))}:
                    </h5>
                    {classStudents.length === 0 ? (
                      <div style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic' }}>
                        No additional students available in this class.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {classStudents.map((student) => {
                          const isChecked = tempSelectedStudentIds.includes(student.id)
                          return (
                            <label
                              key={student.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: isChecked ? 'var(--bluebg)' : 'var(--bg)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                margin: 0,
                                color: 'var(--t1)',
                                fontWeight: 600
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setTempSelectedStudentIds((prev) =>
                                    isChecked ? prev.filter(id => id !== student.id) : [...prev, student.id]
                                  )
                                }}
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                              <span>{student.name} {student.rollNo ? `(Roll: ${student.rollNo})` : ''}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 800, color: 'var(--t1)' }}>
                    Currently Linked Children ({form.studentIds.length})
                  </h5>
                  {form.studentIds.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--t3)', fontStyle: 'italic' }}>
                      No children linked to this parent profile yet. Select a class above to link students.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {form.studentIds.map((id) => {
                        const child = students.find((s) => s.id === id)
                        if (!child) return null
                        return (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                            <div>
                              <strong style={{ fontSize: '12px', color: 'var(--t1)' }}>{child.name}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--t3)', marginLeft: '10px' }}>
                                {getClassName(child.classId)} {child.rollNo ? `• Roll: ${child.rollNo}` : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              style={{ borderColor: 'var(--red)', color: 'var(--red)', padding: '4px 10px', height: '28px' }}
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  studentIds: prev.studentIds.filter(cid => cid !== id)
                                }))
                                showToast(`${child.name} unlinked from form`, 'info')
                              }}
                            >
                              <i className="fa-solid fa-user-minus"></i> Remove
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Permanent Address Details */}
              <div className="section-divider">
                <span className="section-divider-label">Permanent Address Details</span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Village / Street <span className="req">*</span></label>
                  <input aria-label="Village / Street"
                    className="form-input"
                    value={form.permanentAddress?.street || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'street', e.target.value)}
                    placeholder="Village, Street, House/Apt No."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ward No. <span className="req">*</span></label>
                  <input aria-label="Ward No."
                    className="form-input"
                    value={form.permanentAddress?.wardNo || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'wardNo', e.target.value)}
                    placeholder="e.g. Ward 4"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>City <span className="req">*</span></label>
                  <input aria-label="City"
                    className="form-input"
                    value={form.permanentAddress?.city || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'city', e.target.value)}
                    placeholder="e.g. Kathmandu"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Municipality Type</label>
                  <select aria-label="Municipality Type"
                    className="form-select"
                    value={form.permanentAddress?.municipalityType || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'municipalityType', e.target.value)}
                  >
                    <option value="">Select type (Optional)</option>
                    <option value="Municipality">Municipality</option>
                    <option value="Rural Municipality">Rural Municipality</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>District <span className="req">*</span></label>
                  <input aria-label="District"
                    className="form-input"
                    value={form.permanentAddress?.district || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'district', e.target.value)}
                    placeholder="e.g. Lalitpur"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State / Province <span className="req">*</span></label>
                  <input aria-label="State / Province"
                    className="form-input"
                    value={form.permanentAddress?.state || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'state', e.target.value)}
                    placeholder="e.g. Bagmati"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ZIP / Postal Code <span className="req">*</span></label>
                  <input aria-label="ZIP / Postal Code"
                    className="form-input"
                    value={form.permanentAddress?.zip || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'zip', e.target.value)}
                    placeholder="e.g. 44600"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Country <span className="req">*</span></label>
                  <input aria-label="Country"
                    className="form-input"
                    value={form.permanentAddress?.country || ''}
                    onChange={(e) => updateAddressField('permanentAddress', 'country', e.target.value)}
                    placeholder="e.g. Nepal"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0 10px 0', padding: '10px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)' }}>
                <input
                  type="checkbox"
                  id="sameAsPermanentParent"
                  checked={!!form.sameAsPermanent}
                  onChange={(e) => handleSameAsPermanentToggle(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="sameAsPermanentParent" style={{ cursor: 'pointer', margin: 0, fontWeight: 700, fontSize: '13px', color: 'var(--t1)' }}>
                  Temporary Address same as Permanent Address
                </label>
              </div>

              {!form.sameAsPermanent && (
                <>
                  <div className="section-divider">
                    <span className="section-divider-label">Temporary Address Details</span>
                    <div className="section-divider-line"></div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Village / Street <span className="req">*</span></label>
                      <input aria-label="Village / Street"
                        className="form-input"
                        value={form.temporaryAddress?.street || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'street', e.target.value)}
                        placeholder="Village, Street, House/Apt No."
                        required={!form.sameAsPermanent}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ward No. <span className="req">*</span></label>
                      <input aria-label="Ward No."
                        className="form-input"
                        value={form.temporaryAddress?.wardNo || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'wardNo', e.target.value)}
                        placeholder="e.g. Ward 4"
                        required={!form.sameAsPermanent}
                      />
                    </div>
                    <div className="form-group">
                      <label>City <span className="req">*</span></label>
                      <input aria-label="City"
                        className="form-input"
                        value={form.temporaryAddress?.city || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'city', e.target.value)}
                        placeholder="e.g. Kathmandu"
                        required={!form.sameAsPermanent}
                      />
                    </div>
                    <div className="form-group">
                      <label>Municipality Type</label>
                      <select aria-label="Municipality Type"
                        className="form-select"
                        value={form.temporaryAddress?.municipalityType || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'municipalityType', e.target.value)}
                        disabled={!!form.sameAsPermanent}
                      >
                        <option value="">Select type (Optional)</option>
                        <option value="Municipality">Municipality</option>
                        <option value="Rural Municipality">Rural Municipality</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>District <span className="req">*</span></label>
                      <input aria-label="District"
                        className="form-input"
                        value={form.temporaryAddress?.district || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'district', e.target.value)}
                        placeholder="e.g. Lalitpur"
                        required={!form.sameAsPermanent}
                      />
                    </div>
                    <div className="form-group">
                      <label>State / Province <span className="req">*</span></label>
                      <input aria-label="State / Province"
                        className="form-input"
                        value={form.temporaryAddress?.state || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'state', e.target.value)}
                        placeholder="e.g. Bagmati"
                        required={!form.sameAsPermanent}
                      />
                    </div>
                    <div className="form-group">
                      <label>ZIP / Postal Code <span className="req">*</span></label>
                      <input aria-label="ZIP / Postal Code"
                        className="form-input"
                        value={form.temporaryAddress?.zip || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'zip', e.target.value)}
                        placeholder="e.g. 44600"
                        required={!form.sameAsPermanent}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country <span className="req">*</span></label>
                      <input aria-label="Country"
                        className="form-input"
                        value={form.temporaryAddress?.country || ''}
                        onChange={(e) => updateAddressField('temporaryAddress', 'country', e.target.value)}
                        placeholder="e.g. Nepal"
                        required={!form.sameAsPermanent}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="academic-form-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '24px' }}>
                <button className="btn btn-ghost" type="button" onClick={() => { resetForm(); setViewMode('list'); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  <i className={`fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}`}></i>
                  {editingId ? ' Update Profile' : ' Register Parent'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DETAIL VIEW */}
        {viewMode === 'detail' && selectedParent && (
          <div className="roles-table-card academic-detail-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="role-detail-profile" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="role-detail-info">
                <div className="role-detail-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}>
                  <i className="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedParent.name}
                    <span className="badge badge-teal" style={{ fontSize: 10, padding: '2px 8px' }}>
                      {selectedParent.relationship}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    <span className={`badge ${selectedParent.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                      {selectedParent.status || 'active'}
                    </span>
                    <span>
                      <i className="fa-solid fa-id-card" style={{ marginRight: 4 }}></i>
                      {selectedParent.parentId}
                    </span>
                    <span>
                      <i className="fa-solid fa-briefcase" style={{ marginRight: 4 }}></i>
                      {selectedParent.occupation || 'No occupation logged'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="role-detail-health">
                <div className="role-health-item">
                  <span className="role-health-val">{selectedParent.studentIds?.length || 0}</span>
                  <span className="role-health-lbl">Children</span>
                </div>
              </div>
            </div>

            <div className="role-detail-tabs">
              <button className={detailTab === 'overview' ? 'active' : ''} onClick={() => setDetailTab('overview')}>
                <i className="fa-solid fa-circle-info"></i> Parent Overview
              </button>
              <button className={detailTab === 'children' ? 'active' : ''} onClick={() => setDetailTab('children')}>
                <i className="fa-solid fa-user-graduate"></i> Linked Children ({selectedParent.studentIds?.length || 0})
              </button>
            </div>

            {/* OVERVIEW TAB */}
            {detailTab === 'overview' && (
              <div style={{ padding: '24px' }}>
                <div className="role-overview-grid" style={{ marginBottom: '24px' }}>
                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-user"></i> General Credentials</h4>
                    <div className="role-overview-row">
                      <span>Full Name</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedParent.name}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Parent ID Code</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)', fontFamily: 'monospace' }}>{selectedParent.parentId}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Email address</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)', textTransform: 'none' }}>{selectedParent.email || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Phone number</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedParent.phone || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Occupation</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedParent.occupation || '—'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Primary Relation</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedParent.relationship}</span>
                    </div>
                  </div>

                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-graduation-cap"></i> Mapped Student list</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
                      {(selectedParent.studentIds || []).length === 0 ? (
                        <div style={{ fontStyle: 'italic', color: 'var(--t3)', fontSize: '12px' }}>No linked student records.</div>
                      ) : selectedParent.studentIds.map((id) => {
                        const child = students.find(s => s.id === id)
                        if (!child) return null
                        return (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg3)' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--t1)' }}>{child.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--t3)' }}>Roll {child.rollNo || '—'} • {getClassName(child.classId)}</div>
                            </div>
                            <span className="badge badge-blue" style={{ fontSize: '10px' }}>{child.admissionNo}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Residential Address Details */}
                <div className="role-overview-card" style={{ width: '100%' }}>
                  <h4><i className="fa-solid fa-map-location-dot"></i> Residential Address Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '10px' }}>
                    {/* Permanent Address */}
                    <div style={{ padding: '14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-house-chimney" style={{ color: 'var(--blue)' }}></i> Permanent Address
                      </h5>
                      {selectedParent.permanentAddress?.street || (typeof selectedParent.address === 'string' ? selectedParent.address : selectedParent.address?.street) ? (
                        <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                          <div><strong>Street/Village:</strong> {selectedParent.permanentAddress?.street || selectedParent.address?.street || selectedParent.address || '—'}</div>
                          {selectedParent.permanentAddress && (
                            <>
                              <div><strong>Ward No:</strong> {selectedParent.permanentAddress.wardNo || '—'}</div>
                              {selectedParent.permanentAddress.municipalityType && (
                                <div><strong>Municipality Type:</strong> {selectedParent.permanentAddress.municipalityType}</div>
                              )}
                              <div><strong>City &amp; District:</strong> {selectedParent.permanentAddress.city || '—'}, {selectedParent.permanentAddress.district || '—'}</div>
                              <div><strong>State &amp; Country:</strong> {selectedParent.permanentAddress.state || '—'}, {selectedParent.permanentAddress.country || '—'}</div>
                              <div><strong>ZIP / Postal Code:</strong> {selectedParent.permanentAddress.zip || '—'}</div>
                            </>
                          )}
                          {!selectedParent.permanentAddress && typeof selectedParent.address === 'object' && (
                            <>
                              <div><strong>City:</strong> {selectedParent.address.city || '—'}</div>
                              <div><strong>State:</strong> {selectedParent.address.state || '—'}</div>
                              <div><strong>ZIP Code:</strong> {selectedParent.address.zip || '—'}</div>
                            </>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--t3)', fontSize: '12px' }}>No permanent address logged.</span>
                      )}
                    </div>

                    {/* Temporary Address */}
                    <div style={{ padding: '14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--amber)' }}></i> Temporary Address
                      </h5>
                      {selectedParent.sameAsPermanent ? (
                        <div style={{ fontSize: '12px', color: 'var(--teal)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-circle-check"></i> Same as Permanent Address
                        </div>
                      ) : selectedParent.temporaryAddress?.street ? (
                        <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                          <div><strong>Street/Village:</strong> {selectedParent.temporaryAddress.street || '—'}</div>
                          <div><strong>Ward No:</strong> {selectedParent.temporaryAddress.wardNo || '—'}</div>
                          {selectedParent.temporaryAddress.municipalityType && (
                            <div><strong>Municipality Type:</strong> {selectedParent.temporaryAddress.municipalityType}</div>
                          )}
                          <div><strong>City &amp; District:</strong> {selectedParent.temporaryAddress.city || '—'}, {selectedParent.temporaryAddress.district || '—'}</div>
                          <div><strong>State &amp; Country:</strong> {selectedParent.temporaryAddress.state || '—'}, {selectedParent.temporaryAddress.country || '—'}</div>
                          <div><strong>ZIP / Postal Code:</strong> {selectedParent.temporaryAddress.zip || '—'}</div>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--t3)', fontSize: '12px' }}>No temporary address logged.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHILDREN DASHBOARD TAB */}
            {detailTab === 'children' && (
              <div style={{ padding: '24px' }}>
                {(selectedParent.studentIds || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--t3)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <i className="fa-solid fa-graduation-cap" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                    No children linked to this parent profile yet. Go to edit mode to checklist link students.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    {selectedParent.studentIds.map((cId) => {
                      const child = students.find(s => s.id === cId)
                      if (!child) return null

                      // Compute child stats
                      const paidList = (child.payments || []).filter(p => p.status === 'paid')
                      const pendingCount = (child.payments || []).filter(p => p.status === 'pending' || p.status === 'overdue').length
                      const totalPaid = paidList.reduce((sum, p) => sum + p.amountPaid, 0)
                      const lastExam = child.exams?.[child.exams.length - 1]

                      return (
                        <div key={child.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg)' }}>
                          
                          {/* Child header bar */}
                          <div style={{ background: 'var(--bg2)', padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: child.gender === 'Female' ? 'var(--purplebg)' : 'var(--bluebg)',
                                color: child.gender === 'Female' ? 'var(--purple)' : 'var(--blue)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
                              }}>
                                <i className="fa-solid fa-graduation-cap"></i>
                              </div>
                              <div>
                                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)' }}>{child.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
                                  Admission No: <strong>{child.admissionNo}</strong> • Class: <strong>{getClassName(child.classId)}</strong> • Roll No: <strong>{child.rollNo || '—'}</strong>
                                </div>
                              </div>
                            </div>
                            <span className={`badge ${child.status === 'active' ? 'badge-active' : 'badge-gray'}`} style={{ fontSize: '10px' }}>
                              {child.status || 'active'}
                            </span>
                          </div>

                          <div style={{ padding: '20px' }}>
                            
                            {/* Child Grid details */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                              
                              {/* Child Financial Ledger */}
                              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)' }}>
                                <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--green)' }}></i> Billing & Fees Overview
                                </h5>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                  <span>Total fees settled:</span>
                                  <strong style={{ color: 'var(--green)' }}>{currencySymbol()}{totalPaid}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px' }}>
                                  <span>Unpaid billing periods:</span>
                                  <strong style={{ color: pendingCount > 0 ? 'var(--red)' : 'var(--t3)' }}>{pendingCount} month(s)</strong>
                                </div>

                                <div style={{ fontSize: '11px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                  <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--t2)' }}>Recent Billing Slip Ledger:</div>
                                  {(child.payments || []).length === 0 ? (
                                    <div style={{ fontStyle: 'italic', color: 'var(--t3)' }}>No billing slots allocated.</div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {child.payments.map((p) => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                          <span>{p.month}</span>
                                          <span style={{ fontWeight: 600, color: p.status === 'paid' ? 'var(--green)' : p.status === 'overdue' ? 'var(--red)' : 'var(--amber)' }}>
                                            {p.status === 'paid' ? `${currencySymbol()}${p.amountPaid}` : p.status.toUpperCase()}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Child Attendance Summary */}
                              {(() => {
                                const att = studentAttendanceSummary(child, readObject('educore.studentAttendance', {}))
                                return (
                                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)' }}>
                                    <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <i className="fa-solid fa-calendar-check" style={{ color: 'var(--blue)' }}></i> Attendance Tracking
                                    </h5>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                      <span>Attendance Rate:</span>
                                      <strong style={{ color: att.color }}>{att.totalDays ? `${att.rate}%` : '—'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
                                      <span>Status:</span>
                                      <span className="badge" style={{ backgroundColor: att.bg, color: att.color, padding: '2px 8px', fontSize: '10px', fontWeight: 700, border: 'none' }}>
                                        {att.status}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px' }}>
                                      <span>Present / Absent:</span>
                                      <strong>{att.presentDays}d / {att.absentDays}d <span style={{ color: 'var(--t3)', fontWeight: 'normal' }}>({att.totalDays} total)</span></strong>
                                    </div>

                                    <div style={{ fontSize: '11px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                                      <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--t2)' }}>Recorded days this month:</div>
                                      <div style={{ width: '100%', height: '8px', background: 'var(--bg3)', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px', position: 'relative' }}>
                                        <div style={{ width: `${att.rate}%`, height: '100%', background: att.color, borderRadius: '99px', transition: 'width 0.5s ease' }}></div>
                                      </div>
                                      <div style={{ color: 'var(--t3)', fontSize: '10px', lineHeight: 1.4 }}>
                                        Present includes late arrivals. Holidays and unmarked days are excluded.
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}

                              {/* Child Verification Scan files */}
                              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)' }}>
                                <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <i className="fa-solid fa-folder-open" style={{ color: 'var(--blue)' }}></i> Verification Attachments
                                </h5>
                                
                                {(!child.documents || Object.keys(child.documents).length === 0) ? (
                                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--t3)', textAlign: 'center', padding: '12px 0' }}>
                                    No scanned files uploaded yet.
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {Object.entries(child.documents).map(([key, doc]) => {
                                      const stdLabels = {
                                        citizenship: 'Citizenship Doc',
                                        dobCert: 'Birth Certificate',
                                        ppSizeImage: 'PP photo image',
                                        academicCert: 'Academic cert'
                                      }
                                      const label = stdLabels[key] || doc.label || key
                                      return (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', fontSize: '11px' }}>
                                          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexGrow: 1, paddingRight: '10px' }} title={doc.name}>
                                            <strong>{label}:</strong> {doc.name}
                                          </div>
                                          <button aria-label="Download Mock attachment"
                                            type="button"
                                            className="btn-icon-sm"
                                            title="Download Mock attachment"
                                            onClick={() => {
                                              const text = `Mock document details:\nStudent: ${child.name}\nType: ${label}\nFilename: ${doc.name}`
                                              const blob = new Blob([text], { type: 'text/plain' })
                                              const url = URL.createObjectURL(blob)
                                              const a = document.createElement('a')
                                              a.href = url
                                              a.download = doc.name
                                              document.body.appendChild(a)
                                              a.click()
                                              document.body.removeChild(a)
                                              URL.revokeObjectURL(url)
                                            }}
                                          >
                                            <i className="fa-solid fa-download"></i>
                                          </button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Recent Exam Report Card block */}
                            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)' }}>
                              <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="fa-solid fa-square-poll-vertical" style={{ color: 'var(--purple)' }}></i> Academic Exam Report Card
                              </h5>

                              {!lastExam ? (
                                <div style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--t3)', textAlign: 'center', padding: '10px 0' }}>
                                  No previous exam results registered.
                                </div>
                              ) : (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>
                                    <span>Exam Name: <strong>{lastExam.examName} ({lastExam.year})</strong></span>
                                    <span>Date: <strong>{lastExam.date}</strong></span>
                                  </div>
                                  
                                  <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden' }}>
                                    <table className="roles-table" style={{ fontSize: '11px' }}>
                                      <thead>
                                        <tr style={{ background: 'var(--bg)' }}>
                                          <th style={{ padding: '6px 12px' }}>Subject Course</th>
                                          <th style={{ padding: '6px 12px' }}>Marks Scored</th>
                                          <th style={{ padding: '6px 12px' }}>Max Possible</th>
                                          <th style={{ padding: '6px 12px' }}>Letter Grade</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {lastExam.subjects.map((sub, sIdx) => (
                                          <tr key={sIdx}>
                                            <td style={{ padding: '6px 12px' }}><strong>{sub.subjectName}</strong></td>
                                            <td style={{ padding: '6px 12px' }}>{sub.marksObtained}</td>
                                            <td style={{ padding: '6px 12px' }}>{sub.maxMarks}</td>
                                            <td style={{ padding: '6px 12px' }}>
                                              <span className={`badge ${sub.marksObtained >= 80 ? 'badge-active' : 'badge-gray'}`} style={{ padding: '1px 6px', fontSize: '9px' }}>
                                                {sub.grade}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--t2)', marginTop: '8px', background: 'var(--bg)', padding: '8px', borderRadius: '4px', border: '1px dashed var(--border)' }}>
                                    <strong>Homeroom teacher remarks:</strong> {lastExam.remarks}
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <button className="btn btn-ghost" onClick={() => setViewMode('list')}>
                  <i className="fa-solid fa-arrow-left"></i> Back to List
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost" onClick={() => editParent(selectedParent)}>
                    <i className="fa-solid fa-pen"></i> Edit Profile Info
                  </button>
                  <button className="btn btn-ghost" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => deleteParent(selectedParent)}>
                    <i className="fa-solid fa-trash"></i> Delete Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`roles-toast roles-toast-${toast.type}`}>
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
          {toast.msg}
        </div>
      )}
    </Layout>
  )
}
