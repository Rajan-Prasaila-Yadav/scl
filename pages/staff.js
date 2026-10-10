import { validateBirthDate } from '../lib/registryValidation'
import { finiteNumber } from '../lib/validation'
import { getRaw } from '../lib/storage'
import { currencySymbol } from '../lib/schoolConfig'
import { allowDeletion } from '../lib/recordIntegrity'
import { saveAttachment, downloadAttachment } from '../lib/attachments'
import { requirePermission } from '../lib/permissions'
import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import {
  INITIAL_STAFF,
  INITIAL_ROLES,
  STORAGE_KEYS,
  readStoredList,
  writeStoredList,
  makeId,
} from '../lib/academicData'
import { exportToCSV, printToPDF } from '../lib/exportUtils'

const emptyForm = {
  name: '',
  employeeId: '',
  department: '',
  role: '',
  userType: 'teaching',
  status: 'active',
  email: '',
  phone: '',
  dob: '',
  joiningDate: '',
  qualification: '',
  experience: '',
  institution: '',
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
  nationalIdNo: '',
  baseSalary: 3000,
  additions: [],
  deductions: [],
  documents: {},
  salaryHistory: [],
}

function makeEmployeeId() {
  return `EMP-${makeId().toString(36).toUpperCase()}`
}

function calculateSalaryDetails(baseSalaryVal, additions = [], deductions = []) {
  const base = Number(baseSalaryVal) || 0
  let totalAdditions = 0
  additions.forEach(add => {
    const val = Number(add.value) || 0
    if (add.valType === 'percent') {
      totalAdditions += base * (val / 100)
    } else {
      totalAdditions += val
    }
  })

  let totalDeductions = 0
  deductions.forEach(ded => {
    const val = Number(ded.value) || 0
    if (ded.valType === 'percent') {
      totalDeductions += base * (val / 100)
    } else {
      totalDeductions += val
    }
  })

  const netSalary = Math.round(base + totalAdditions - totalDeductions)
  return {
    baseSalary: base,
    totalAdditions: Math.round(totalAdditions),
    totalDeductions: Math.round(totalDeductions),
    netSalary
  }
}

export default function Staff() {
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [roles, setRoles] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail'
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [detailTab, setDetailTab] = useState('overview')
  const [customDocInputs, setCustomDocInputs] = useState([])

  // Attendance states for staff detail view
  const [teaAttData, setTeaAttData]   = useState({})
  const [teaAttMonth, setTeaAttMonth] = useState(new Date().getMonth())
  const [teaAttYear,  setTeaAttYear]  = useState(new Date().getFullYear())

  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
  }

  // Pay Salary Record form states
  const [payForm, setPayForm] = useState({
    month: '',
    paymentDate: '',
    paidBy: '',
    status: 'paid'
  })
  const [showPayForm, setShowPayForm] = useState(false)

  // Direct custom upload form states inside detail
  const [showAddDocForm, setShowAddDocForm] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [newDocFile, setNewDocFile] = useState(null)

  useEffect(() => {
    try {
      const raw = getRaw('educore.teacherAttendance')
      if (raw) setTeaAttData(JSON.parse(raw))
    } catch(e) {}
  }, [])

  useEffect(() => {
    let storedStaff = readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF)
    // Existing records, including empty histories, are never replaced with fixtures.
    setStaff(storedStaff)
    setSelectedStaffId(storedStaff[0]?.id || null)
    setRoles(readStoredList(STORAGE_KEYS.roles, INITIAL_ROLES))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.staff, staff)
  }, [staff, hydrated])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  const selectedStaff = staff.find((s) => s.id === selectedStaffId) || staff[0]
  const activeRole = selectedStaff ? roles.find(r => r.name === selectedStaff.role) : null

  // Compute calculated salary details for selected employee
  const selectedSalary = useMemo(() => {
    if (!selectedStaff) return { baseSalary: 0, totalAdditions: 0, totalDeductions: 0, netSalary: 0 }
    return calculateSalaryDetails(selectedStaff.baseSalary, selectedStaff.additions, selectedStaff.deductions)
  }, [selectedStaff])

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase()
    return staff
      .filter((emp) => {
        if (departmentFilter !== 'all' && emp.department !== departmentFilter) return false
        if (typeFilter !== 'all' && emp.userType !== typeFilter) return false
        if (statusFilter !== 'all' && emp.status !== statusFilter) return false
        if (!query) return true
        return [
          emp.name,
          emp.employeeId,
          emp.role,
          emp.department,
          emp.email,
          emp.phone
        ]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(query))
      })
      .sort((a, b) => {
        let valA, valB
        if (sortBy === 'name') {
          valA = a.name || ''
          valB = b.name || ''
        } else if (sortBy === 'employeeId') {
          valA = a.employeeId || ''
          valB = b.employeeId || ''
        } else if (sortBy === 'userType') {
          valA = a.userType || ''
          valB = b.userType || ''
        } else if (sortBy === 'role') {
          valA = a.role || ''
          valB = b.role || ''
        } else if (sortBy === 'email') {
          valA = a.email || ''
          valB = b.email || ''
        } else if (sortBy === 'status') {
          valA = a.status || ''
          valB = b.status || ''
        }

        if (typeof valA === 'string') {
          return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        } else {
          return sortDir === 'asc' ? valA - valB : valB - valA
        }
      })
  }, [staff, search, departmentFilter, typeFilter, statusFilter, sortBy, sortDir])

  const stats = useMemo(() => {
    const totalPayroll = staff.reduce((sum, emp) => {
      const calc = calculateSalaryDetails(emp.baseSalary, emp.additions, emp.deductions)
      return sum + calc.netSalary
    }, 0)
    return {
      total: staff.length,
      teaching: staff.filter((s) => s.userType === 'teaching').length,
      nonTeaching: staff.filter((s) => s.userType === 'non-teaching').length,
      active: staff.filter((s) => s.status === 'active').length,
      payrollBudget: totalPayroll
    }
  }, [staff])

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
        nextState.temporaryAddress = {
          ...nextAddress
        }
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
    setCustomDocInputs([])
  }

  // Salary Configuration rules builders
  const handleAddSalaryRule = (type) => {
    const listKey = type === 'addition' ? 'additions' : 'deductions'
    setForm((prev) => ({
      ...prev,
      [listKey]: [
        ...prev[listKey],
        { label: '', type, valType: 'fixed', value: '' }
      ]
    }))
  }

  const handleUpdateSalaryRule = (listKey, idx, field, val) => {
    setForm((prev) => {
      const nextList = [...prev[listKey]]
      nextList[idx] = {
        ...nextList[idx],
        [field]: val
      }
      return { ...prev, [listKey]: nextList }
    })
  }

  const handleRemoveSalaryRule = (listKey, idx) => {
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== idx)
    }))
  }

  // Save/Create Staff record
  const saveStaff = (event) => {
    event?.preventDefault?.(); if (!requirePermission(editingId ? 'edit' : 'create')) return

    event.preventDefault()
    const name = form.name.trim()

    if (!name) {
      showToast('Name is required', 'error')
      return
    }

    if (!form.role) {
      showToast('Assigning a role is required', 'error')
      return
    }

    const birthError = validateBirthDate(form.dob)
    if (birthError) { showToast(birthError, 'error'); return }
    if (form.dob && form.joiningDate && form.joiningDate < form.dob) { showToast('Joining date must not precede date of birth', 'error'); return }
    if (!finiteNumber(form.baseSalary, 0)) { showToast('Enter a valid nonnegative base salary', 'error'); return }
    const employeeId = form.employeeId.trim() || makeEmployeeId()
    const duplicateId = staff.some((s) => s.id !== editingId && s.employeeId === employeeId)
    if (duplicateId) {
      showToast('Employee ID already exists', 'error')
      return
    }

    // Auto-name documents uploaded
    const finalDocs = {}
    if (form.documents) {
      const DOC_LABELS = {
        citizenship: 'Citizenship',
        nationalIdCard: 'National Identity Card',
        ppPhoto: 'PP size photo'
      }
      Object.entries(form.documents).forEach(([key, doc]) => {
        if (doc) {
          const ext = doc.name.substring(doc.name.lastIndexOf('.')) || '.pdf'
          const label = DOC_LABELS[key] || doc.label || key
          finalDocs[key] = {
            ...doc,
            name: `${name} ${label}${ext}`
          }
        }
      })
    }

    // Lookup department based on assigned role if empty
    const matchedRole = roles.find(r => r.name === form.role)
    const computedUserType = matchedRole ? matchedRole.type : form.userType

    const payload = {
      name,
      employeeId,
      department: form.department || 'General',
      role: form.role,
      userType: computedUserType,
      status: form.status,
      email: form.email ? form.email.trim() : '',
      phone: form.phone ? form.phone.trim() : '',
      dob: form.dob || '',
      joiningDate: form.joiningDate || '',
      qualification: form.qualification.trim(),
      experience: form.experience || '0',
      institution: form.institution.trim(),
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
      nationalIdNo: form.nationalIdNo.trim(),
      baseSalary: Number(form.baseSalary) || 0,
      additions: form.additions,
      deductions: form.deductions,
      documents: finalDocs,
    }

    if (editingId) {
      setStaff((current) =>
        current.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
      )
      showToast('Employee updated', 'success')
    } else {
      const id = makeId()
      setStaff((current) => [...current, { id, ...payload, salaryHistory: [] }])
      setSelectedStaffId(id)
      showToast('Employee created', 'success')
    }

    resetForm()
    setViewMode('list')
  }

  const editStaff = (emp) => {
    setEditingId(emp.id)
    setSelectedStaffId(emp.id)
    setForm({
      name: emp.name,
      employeeId: emp.employeeId || '',
      department: emp.department || '',
      role: emp.role || '',
      userType: emp.userType || 'teaching',
      status: emp.status || 'active',
      email: emp.email || '',
      phone: emp.phone || '',
      dob: emp.dob || '',
      joiningDate: emp.joiningDate || '',
      qualification: emp.qualification || '',
      experience: emp.experience || '0',
      institution: emp.institution || '',
      permanentAddress: {
        district: emp.permanentAddress?.district || '',
        country: emp.permanentAddress?.country || '',
        city: emp.permanentAddress?.city || emp.address?.city || (typeof emp.address === 'string' ? emp.address : ''),
        zip: emp.permanentAddress?.zip || emp.address?.zip || '',
        state: emp.permanentAddress?.state || emp.address?.state || '',
        street: emp.permanentAddress?.street || emp.address?.street || '',
        wardNo: emp.permanentAddress?.wardNo || '',
        municipalityType: emp.permanentAddress?.municipalityType || '',
      },
      temporaryAddress: {
        district: emp.temporaryAddress?.district || '',
        country: emp.temporaryAddress?.country || '',
        city: emp.temporaryAddress?.city || '',
        zip: emp.temporaryAddress?.zip || '',
        state: emp.temporaryAddress?.state || '',
        street: emp.temporaryAddress?.street || '',
        wardNo: emp.temporaryAddress?.wardNo || '',
        municipalityType: emp.temporaryAddress?.municipalityType || '',
      },
      sameAsPermanent: emp.sameAsPermanent !== undefined ? !!emp.sameAsPermanent : true,
      nationalIdNo: emp.nationalIdNo || '',
      baseSalary: emp.baseSalary || 3000,
      additions: emp.additions || [],
      deductions: emp.deductions || [],
      documents: emp.documents || {},
    })

    const customs = []
    if (emp.documents) {
      Object.entries(emp.documents).forEach(([k, v]) => {
        if (k.startsWith('custom_') && v) {
          customs.push({
            id: k,
            label: v.label || ''
          })
        }
      })
    }
    setCustomDocInputs(customs)
    setViewMode('edit')
  }

  const deleteStaff = (emp) => {
    if (!allowDeletion('staff', emp)) return
    if (!requirePermission('delete')) return

    if (!confirm(`Are you sure you want to delete employee "${emp.name}"?`)) return
    setStaff((current) => current.filter((s) => s.id !== emp.id))
    if (selectedStaffId === emp.id) {
      const remaining = staff.filter((s) => s.id !== emp.id)
      setSelectedStaffId(remaining[0]?.id || null)
    }
    if (editingId === emp.id) resetForm()
    showToast('Employee deleted', 'info')
    setViewMode('list')
  }

  const toggleStaffStatus = (empId) => {
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === empId) {
          const nextStatus = s.status === 'active' ? 'blocked' : 'active'
          showToast(`Employee "${s.name}" status updated to ${nextStatus}`, 'info')
          return { ...s, status: nextStatus }
        }
        return s
      })
    )
  }

  // Direct upload handlers in details view
  const handleDirectUpload = async (key, label, e) => {
    if (!requirePermission('edit')) return
    const file = e.target.files?.[0]
    if (!file) return

    let attachmentId
    try { attachmentId = await saveAttachment(file) } catch (error) { showToast(error.message, 'error'); return }
    const ext = file.name.substring(file.name.lastIndexOf('.')) || '.pdf'
    const formattedName = `${selectedStaff.name} ${label}${ext}`

    const updatedDocs = {
      ...(selectedStaff.documents || {}),
      [key]: {
        attachmentId,
        name: formattedName,
        type: file.type,
        size: file.size,
        lastModified: Date.now()
      }
    }

    setStaff((prev) =>
      prev.map((s) => (s.id === selectedStaffId ? { ...s, documents: updatedDocs } : s))
    )
    showToast(`${label} uploaded successfully`, 'success')
  }

  const handleDirectDelete = (key, label) => {
    if (!requirePermission('delete')) return
    if (!confirm(`Remove the document "${label}"?`)) return

    const updatedDocs = { ...(selectedStaff.documents || {}) }
    delete updatedDocs[key]

    setStaff((prev) =>
      prev.map((s) => (s.id === selectedStaffId ? { ...s, documents: updatedDocs } : s))
    )
    showToast(`Document "${label}" removed`, 'info')
  }

  const handleSaveCustomDoc = async (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    if (!newDocName.trim() || !newDocFile) {
      showToast('Document label and file are required', 'error')
      return
    }

    let attachmentId
    try { attachmentId = await saveAttachment(newDocFile) } catch (error) { showToast(error.message, 'error'); return }
    const ext = newDocFile.name.substring(newDocFile.name.lastIndexOf('.')) || '.pdf'
    const docKey = `custom_${Date.now()}`
    const formattedName = `${selectedStaff.name} ${newDocName.trim()}${ext}`

    const updatedDocs = {
      ...(selectedStaff.documents || {}),
      [docKey]: {
        attachmentId,
        name: formattedName,
        type: newDocFile.type,
        size: newDocFile.size,
        label: newDocName.trim(),
        lastModified: Date.now()
      }
    }

    setStaff((prev) =>
      prev.map((s) => (s.id === selectedStaffId ? { ...s, documents: updatedDocs } : s))
    )

    showToast('Document added successfully', 'success')
    setShowAddDocForm(false)
    setNewDocName('')
    setNewDocFile(null)
  }

  // Record Salary Payment Log
  const recordSalaryPayment = (e) => {
    e.preventDefault()
    if (!payForm.month || !payForm.paymentDate) {
      showToast('Month and payment date are required', 'error')
      return
    }

    const dObj = new Date(payForm.paymentDate)
    const pad = (n) => String(n).padStart(2, '0')
    const formattedPaymentDate = isNaN(dObj.getTime())
      ? '—'
      : `${pad(dObj.getDate())}/${pad(dObj.getMonth() + 1)}/${dObj.getFullYear()} ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}:${pad(new Date().getSeconds())}`

    const newPayLog = {
      id: makeId(),
      slipNo: `SLIP-SAL-${new Date().getFullYear()}-${makeId().toString(36).toUpperCase()}`,
      month: payForm.month,
      baseSalary: selectedSalary.baseSalary,
      netSalary: selectedSalary.netSalary,
      paymentDate: payForm.status === 'paid' ? formattedPaymentDate : '—',
      paidBy: payForm.status === 'paid' ? (payForm.paidBy || 'Accountant') : '—',
      status: payForm.status
    }

    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === selectedStaffId) {
          const currentLogs = s.salaryHistory || []
          return { ...s, salaryHistory: [...currentLogs, newPayLog] }
        }
        return s
      })
    )

    showToast('Salary payment recorded successfully', 'success')
    setPayForm({
      month: '',
      paymentDate: '',
      paidBy: '',
      status: 'paid'
    })
    setShowPayForm(false)
  }

  const deleteSalaryRecord = (payId) => {
    if (!requirePermission('delete')) return

    if (!confirm('Are you sure you want to remove this payroll record?')) return
    setStaff((prev) =>
      prev.map((s) => {
        if (s.id === selectedStaffId) {
          return { ...s, salaryHistory: (s.salaryHistory || []).filter(p => p.id !== payId) }
        }
        return s
      })
    )
    showToast('Payroll record removed', 'info')
  }

  // Export listings
  const handleExportCSV = () => {
    const headers = [
      'Name',
      'Employee ID',
      'User Type',
      'Role',
      'Department',
      'Base Salary ($)',
      'Qualifications',
      'Status'
    ]

    const rows = filteredStaff.map(emp => [
      emp.name,
      emp.employeeId,
      emp.userType === 'teaching' ? 'Teaching' : 'Non-Teaching',
      emp.role,
      emp.department,
      emp.baseSalary,
      emp.qualification,
      emp.status
    ])

    exportToCSV('staff_list.csv', headers, rows)
    showToast('Staff list exported to CSV', 'success')
  }

  const handleExportPDF = () => {
    const headers = [
      'Name',
      'ID',
      'Type',
      'Role',
      'Department',
      'Monthly Salary',
      'Status'
    ]

    const rows = filteredStaff.map(emp => {
      const calc = calculateSalaryDetails(emp.baseSalary, emp.additions, emp.deductions)
      return [
        emp.name,
        emp.employeeId,
        emp.userType === 'teaching' ? 'Teaching' : 'Non-Teaching',
        emp.role,
        emp.department,
        `${currencySymbol()}${calc.netSalary}`,
        emp.status.toUpperCase()
      ]
    })

    printToPDF(
      'Staff Employee Registry',
      headers,
      rows,
      `Filtered Staff List (${filteredStaff.length} Employees)`
    )
    showToast('Generating printable PDF...', 'info')
  }

  const getDepartmentsList = () => {
    const depts = new Set(staff.map((s) => s.department).filter(Boolean))
    return ['all', ...Array.from(depts)]
  }

  return (
    <Layout>
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-chalkboard-user" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
            Staff &amp; Users
          </h1>
          <p>
            {viewMode === 'list' && 'Manage employee personal details, custom salary rules, role privileges, and credentials.'}
            {viewMode === 'create' && 'Register a new employee/staff member into the school payroll and access control system.'}
            {viewMode === 'edit' && `Modify configuration settings and files for ${selectedStaff?.name}.`}
            {viewMode === 'detail' && `Detailed record card, salary histories, and permissions access map for ${selectedStaff?.name}.`}
          </p>
        </div>
        <div className="settings-actions">
          {viewMode === 'list' && (
            <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setViewMode('create') }}>
              <i className="fa-solid fa-plus"></i> New Employee
            </button>
          )}
          {viewMode !== 'list' && (
            <button className="btn btn-ghost btn-sm" onClick={() => { resetForm(); setViewMode('list') }}>
              <i className="fa-solid fa-arrow-left"></i> Back to List
            </button>
          )}
        </div>
      </div>

      {/* STATISTICS ROW */}
      {viewMode === 'list' && (
        <div className="roles-stats">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}>
              <i className="fa-solid fa-users"></i>
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value">{stats.total}</div>
              <div className="stat-card-label">Total Staff</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--tealbg)', color: 'var(--teal)' }}>
              <i className="fa-solid fa-chalkboard-user"></i>
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value">{stats.teaching}</div>
              <div className="stat-card-label">Teaching Faculty</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--amberbg)', color: 'var(--amber)' }}>
              <i className="fa-solid fa-gears"></i>
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value">{stats.nonTeaching}</div>
              <div className="stat-card-label">Non-Teaching</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--purplebg)', color: 'var(--purple)' }}>
              <i className="fa-solid fa-wallet"></i>
            </div>
            <div className="stat-card-content">
              <div className="stat-card-value">{currencySymbol()}{stats.payrollBudget}/mo</div>
              <div className="stat-card-label">Payroll Budget</div>
            </div>
          </div>
        </div>
      )}

      {/* CORE DISPLAY */}
      <div>
        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
            <div className="roles-toolbar academic-toolbar">
              <div className="roles-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search name, ID, role, department..."
                  placeholder="Search name, ID, role, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              <select aria-label="Department Filter" className="roles-filter" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="all">All Departments</option>
                {getDepartmentsList().filter(d => d !== 'all').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select aria-label="Type Filter" className="roles-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All User Types</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
              </select>
              <select aria-label="Status Filter" className="roles-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button className="btn btn-ghost btn-xs" onClick={handleExportCSV}>
                  <i className="fa-solid fa-file-csv" style={{ color: 'var(--green)' }}></i> CSV
                </button>
                <button className="btn btn-ghost btn-xs" onClick={handleExportPDF}>
                  <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF
                </button>
              </div>
            </div>

            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Employee Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('userType')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Employee Type {sortBy === 'userType' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('employeeId')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Employee ID {sortBy === 'employeeId' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th>Phone Number</th>
                    <th onClick={() => toggleSort('role')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Role &amp; Department {sortBy === 'role' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('email')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Email {sortBy === 'email' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => toggleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Status {sortBy === 'status' && (sortDir === 'asc' ? '▲' : '▼')}
                    </th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.length === 0 ? (
                    <tr><td colSpan={8} className="roles-empty">No employees found matching the filters</td></tr>
                  ) : filteredStaff.map((emp) => {
                    return (
                      <tr
                        key={emp.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedStaffId(emp.id)
                          setDetailTab('overview')
                          setViewMode('detail')
                        }}
                      >
                        <td>
                          <div className="roles-name-cell">
                            <div
                              className="roles-name-icon"
                              style={{
                                background: emp.userType === 'non-teaching' ? 'var(--amberbg)' : 'var(--bluebg)',
                                color: emp.userType === 'non-teaching' ? 'var(--amber)' : 'var(--blue)',
                              }}
                            >
                              <i className={`fa-solid ${emp.userType === 'non-teaching' ? 'fa-gears' : 'fa-chalkboard-user'}`}></i>
                            </div>
                            <div>
                              <div className="roles-name-text">
                                {emp.name}
                                {(() => {
                                  if (!emp.dob) return null
                                  const parts = emp.dob.split('-')
                                  if (parts.length < 3) return null
                                  const birthMonth = parseInt(parts[1], 10)
                                  const birthDay = parseInt(parts[2], 10)
                                  const today = new Date()
                                  const isBirthdayToday = (today.getMonth() + 1 === birthMonth && today.getDate() === birthDay) || (emp.id === 1)
                                  if (isBirthdayToday) {
                                    return (
                                      <span style={{ color: 'var(--purple)', marginLeft: 6, fontSize: 12, display: 'inline-flex', alignItems: 'center' }} title="Happy Birthday! 🎂🎉">
                                        🎂
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--t3)', textTransform: 'capitalize' }}>
                                {emp.qualification || 'No credentials'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${emp.userType === 'non-teaching' ? 'badge-gray' : 'badge-blue'}`}>
                            {emp.userType === 'non-teaching' ? 'Non-Teaching' : 'Teaching'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{emp.employeeId}</span>
                        </td>
                        <td>
                          <div>{emp.phone || '—'}</div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--t1)' }}>{emp.role}</div>
                            <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>{emp.department}</div>
                          </div>
                        </td>
                        <td>
                          <div style={{ textTransform: 'none' }}>{emp.email || '—'}</div>
                        </td>
                        <td>
                          <span className={`badge ${emp.status === 'active' ? 'badge-active' : 'badge-blocked'}`}>
                            {emp.status === 'active' ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'right', paddingRight: '16px' }}>
                          <div className="roles-actions">
                            <button aria-label="view" className="btn-icon-sm tooltip" data-tooltip="view" title="view" onClick={() => { setSelectedStaffId(emp.id); setDetailTab('overview'); setViewMode('detail') }}>
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button aria-label="edit" className="btn-icon-sm tooltip" data-tooltip="edit" title="edit" onClick={() => editStaff(emp)}>
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button className="btn-icon-sm tooltip" data-tooltip={emp.status === 'active' ? 'block' : 'unblock'} title={emp.status === 'active' ? 'block' : 'unblock'} onClick={() => toggleStaffStatus(emp.id)} style={{ color: emp.status === 'active' ? 'var(--amber)' : 'var(--green)' }}>
                              <i className={`fa-solid ${emp.status === 'active' ? 'fa-ban' : 'fa-check'}`}></i>
                            </button>
                            <button aria-label="delete" className="btn-icon-sm danger tooltip" data-tooltip="delete" title="delete" onClick={() => deleteStaff(emp)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
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

        {/* CREATE / EDIT VIEW */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <form className="roles-table-card academic-form-card" onSubmit={saveStaff}>
              <div className="section-divider" style={{ marginTop: 0 }}>
                <span className="section-divider-label">
                  {editingId ? 'Edit Employee Details' : 'Add New Employee'}
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
                    placeholder="e.g. Ramesh Patel"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Employee ID Code</label>
                  <input aria-label="Employee ID Code"
                    className="form-input"
                    value={form.employeeId}
                    onChange={(e) => updateForm('employeeId', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="form-group">
                  <label>User Type Classification</label>
                  <select aria-label="User Type Classification" className="form-select" value={form.userType} onChange={(e) => updateForm('userType', e.target.value)}>
                    <option value="teaching">Teaching Faculty (Can teach classes &amp; subjects)</option>
                    <option value="non-teaching">Non-Teaching Staff (Accountant, Librarian, Warden, etc.)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input aria-label="Department"
                    className="form-input"
                    value={form.department}
                    onChange={(e) => updateForm('department', e.target.value)}
                    placeholder="e.g. Administration, Mathematics, Hostel"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select aria-label="Status" className="form-select" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Joining</label>
                  <input aria-label="Date of Joining"
                    className="form-input"
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => updateForm('joiningDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="section-divider">
                <span className="section-divider-label">Personal &amp; Contact Credentials</span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Email Address</label>
                  <input aria-label="Email Address"
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="e.g. name@educore.edu"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input aria-label="Phone Number"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="10 digit contact number"
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input aria-label="Date of Birth"
                    className="form-input"
                    type="date"
                    value={form.dob}
                    onChange={(e) => updateForm('dob', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>National ID Identification Code</label>
                  <input aria-label="National ID Identification Code"
                    className="form-input"
                    value={form.nationalIdNo}
                    onChange={(e) => updateForm('nationalIdNo', e.target.value)}
                    placeholder="e.g. Passport/National ID No."
                  />
                </div>
              </div>

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
                  id="sameAsPermanent"
                  checked={!!form.sameAsPermanent}
                  onChange={(e) => handleSameAsPermanentToggle(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="sameAsPermanent" style={{ cursor: 'pointer', margin: 0, fontWeight: 700, fontSize: '13px', color: 'var(--t1)' }}>
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

              <div className="section-divider">
                <span className="section-divider-label">Academic &amp; Professional Qualifications</span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Highest Qualification Degree</label>
                  <input aria-label="Highest Qualification Degree"
                    className="form-input"
                    value={form.qualification}
                    onChange={(e) => updateForm('qualification', e.target.value)}
                    placeholder="e.g. M.Sc. Mathematics, B.Ed"
                  />
                </div>
                <div className="form-group">
                  <label>Years of Professional Experience</label>
                  <input aria-label="Years of Professional Experience"
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.experience}
                    onChange={(e) => updateForm('experience', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>University / Alma Mater Institution</label>
                  <input aria-label="University / Alma Mater Institution"
                    className="form-input"
                    value={form.institution}
                    onChange={(e) => updateForm('institution', e.target.value)}
                    placeholder="e.g. Delhi University, India"
                  />
                </div>
              </div>

              {/* Document Upload Widget */}
              <div className="section-divider">
                <span className="section-divider-label">Verification Document Records</span>
                <div className="section-divider-line"></div>
              </div>

              <div style={{ padding: '0 8px 12px 8px', fontSize: '12px', color: 'var(--t3)' }}>
                Upload scans or photographs of official identity/academic documents. Documents will automatically format under the name layout: <strong>&lt;Employee Name&gt; &lt;Document Type&gt;.&lt;ext&gt;</strong>.
              </div>

              <div className="form-grid" style={{ marginBottom: '20px' }}>
                {Object.entries({
                  citizenship: 'Citizenship Scanned ID',
                  nationalIdCard: 'National Identity Card',
                  ppPhoto: 'PP size photo'
                }).map(([key, label]) => {
                  const doc = form.documents?.[key]
                  const acceptExt = key === 'ppPhoto' ? '.png,.jpg,.jpeg,.gif' : '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx'
                  return (
                    <div key={key} style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', background: 'var(--bg2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>
                        <i className={`fa-solid ${key === 'ppPhoto' ? 'fa-image' : 'fa-file-shield'}`} style={{ marginRight: '6px', color: 'var(--blue)' }}></i>
                        {label}
                      </label>
                      {doc ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', padding: '6px 10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.name}>
                            {doc.name}
                          </span>
                          <button aria-label="Close" type="button" className="btn-icon-sm danger" onClick={() => {
                            const next = { ...form.documents }
                            delete next[key]
                            updateForm('documents', next)
                          }}>
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept={acceptExt}
                            id={`file-staff-${key}`}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const ext = file.name.substring(file.name.lastIndexOf('.')) || '.pdf'
                              const nameStr = form.name.trim() || 'Employee'
                              const next = {
                                ...form.documents,
                                [key]: {
                                  name: `${nameStr} ${label}${ext}`,
                                  type: file.type,
                                  size: file.size,
                                  lastModified: file.lastModified
                                }
                              }
                              updateForm('documents', next)
                            }}
                          />
                          <label htmlFor={`file-staff-${key}`} className="btn btn-ghost btn-xs" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', margin: 0, padding: '6px' }}>
                            <i className="fa-solid fa-cloud-arrow-up"></i> Upload Scanned File
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Custom Documents List */}
              {customDocInputs.length > 0 && (
                <div style={{ padding: '0 8px', marginBottom: '14px' }}>
                  <label style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '10px' }}>
                    Custom Verification Documents
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {customDocInputs.map((input) => {
                      const doc = form.documents?.[input.id]
                      return (
                        <div key={input.id} style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '14px',
                          background: 'var(--bg2)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                            <input aria-label="Custom Verification Documents"
                              className="form-input"
                              style={{ padding: '4px 8px', fontSize: '12px', flexGrow: 1 }}
                              placeholder="e.g. Work Permit"
                              value={input.label}
                              onChange={(e) => {
                                const val = e.target.value
                                setCustomDocInputs((prev) =>
                                  prev.map((item) => (item.id === input.id ? { ...item, label: val } : item))
                                )
                                if (doc) {
                                  const nextDocs = { ...form.documents }
                                  nextDocs[input.id] = {
                                    ...doc,
                                    label: val
                                  }
                                  updateForm('documents', nextDocs)
                                }
                              }}
                              disabled={!!doc}
                            />
                            <button aria-label="Delete Custom Slot"
                              type="button"
                              className="btn-icon-sm danger"
                              onClick={() => {
                                setCustomDocInputs((prev) => prev.filter((item) => item.id !== input.id))
                                const nextDocs = { ...form.documents }
                                delete nextDocs[input.id]
                                updateForm('documents', nextDocs)
                              }}
                              title="Delete Custom Slot"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>

                          {doc ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--bg)',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border)'
                            }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.name}>
                                {doc.name}
                              </span>
                              <button aria-label="Remove file"
                                type="button"
                                className="btn-icon-sm danger"
                                onClick={() => {
                                  const nextDocs = { ...form.documents }
                                  delete nextDocs[input.id]
                                  updateForm('documents', nextDocs)
                                }}
                                title="Remove file"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                style={{ display: 'none' }}
                                id={`file-upload-${input.id}`}
                                disabled={!input.label.trim()}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
 let attachmentId; try { attachmentId = await saveAttachment(file) } catch(error) { showToast(error.message, 'error'); return }
                                  
                                  const ext = file.name.substring(file.name.lastIndexOf('.')) || '.pdf'
                                  const nameStr = form.name.trim() || 'Employee'
                                  const formattedName = `${nameStr} ${input.label.trim()}${ext}`
                                  
                                  const nextDocs = {
                                    ...form.documents,
                                    [input.id]: {
                                      attachmentId,
        name: formattedName,
                                      type: file.type,
                                      size: file.size,
                                      label: input.label.trim(),
                                      lastModified: file.lastModified
                                    }
                                  }
                                  updateForm('documents', nextDocs)
                                }}
                              />
                              <label htmlFor={`file-upload-${input.id}`} className="btn btn-ghost btn-xs" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: input.label.trim() ? 'pointer' : 'not-allowed',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-xs)',
                                padding: '8px',
                                margin: 0,
                                opacity: input.label.trim() ? 1 : 0.5
                              }}>
                                <i className="fa-solid fa-cloud-arrow-up"></i> Upload Custom File
                              </label>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom Document Action */}
              <div style={{ padding: '0 8px', marginBottom: '24px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setCustomDocInputs((prev) => [...prev, { id: `custom_${Date.now()}`, label: '' }])
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Add Custom Document
                </button>
              </div>

              {/* SALARY & PAYROLL CUSTOMIZATION */}
              <div className="section-divider">
                <span className="section-divider-label">Salary &amp; Payroll Configuration</span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Monthly Base Salary ({currencySymbol()}) <span className="req">*</span></label>
                  <input aria-label="Monthly Base Salary ($)"
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.baseSalary}
                    onChange={(e) => updateForm('baseSalary', Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Additions list */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><i className="fa-solid fa-plus-circle"></i> Additions / Bonuses</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleAddSalaryRule('addition')}>
                      + Add Allowance
                    </button>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {form.additions.map((rule, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr auto', gap: '6px', alignItems: 'center' }}>
                        <input aria-label="e.g. Travel Bonus"
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          placeholder="e.g. Travel Bonus"
                          value={rule.label}
                          onChange={(e) => handleUpdateSalaryRule('additions', idx, 'label', e.target.value)}
                          required
                        />
                        <select aria-label="Val Type"
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          value={rule.valType}
                          onChange={(e) => handleUpdateSalaryRule('additions', idx, 'valType', e.target.value)}
                        >
                          <option value="fixed">Fixed ({currencySymbol()})</option>
                          <option value="percent">Percent (%)</option>
                        </select>
                        <input aria-label="Value"
                          className="form-input"
                          type="number"
                          min="0"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          placeholder="Value"
                          value={rule.value}
                          onChange={(e) => handleUpdateSalaryRule('additions', idx, 'value', Number(e.target.value))}
                          required
                        />
                        <button aria-label="Close" type="button" className="btn-icon-sm danger" onClick={() => handleRemoveSalaryRule('additions', idx)}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                    {form.additions.length === 0 && <div style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic' }}>No additions customized yet.</div>}
                  </div>
                </div>

                {/* Deductions list */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--red)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><i className="fa-solid fa-minus-circle"></i> Deductions / Tax</span>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleAddSalaryRule('deduction')}>
                      + Add Tax Rule
                    </button>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {form.deductions.map((rule, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.8fr auto', gap: '6px', alignItems: 'center' }}>
                        <input aria-label="e.g. Income Tax"
                          className="form-input"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          placeholder="e.g. Income Tax"
                          value={rule.label}
                          onChange={(e) => handleUpdateSalaryRule('deductions', idx, 'label', e.target.value)}
                          required
                        />
                        <select aria-label="Val Type"
                          className="form-select"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          value={rule.valType}
                          onChange={(e) => handleUpdateSalaryRule('deductions', idx, 'valType', e.target.value)}
                        >
                          <option value="fixed">Fixed ({currencySymbol()})</option>
                          <option value="percent">Percent (%)</option>
                        </select>
                        <input aria-label="Value"
                          className="form-input"
                          type="number"
                          min="0"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          placeholder="Value"
                          value={rule.value}
                          onChange={(e) => handleUpdateSalaryRule('deductions', idx, 'value', Number(e.target.value))}
                          required
                        />
                        <button aria-label="Close" type="button" className="btn-icon-sm danger" onClick={() => handleRemoveSalaryRule('deductions', idx)}>
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                    {form.deductions.length === 0 && <div style={{ fontSize: '11px', color: 'var(--t3)', fontStyle: 'italic' }}>No deductions customized yet.</div>}
                  </div>
                </div>
              </div>

              {/* ROLE ACCESS PRIVILEGES */}
              <div className="section-divider">
                <span className="section-divider-label">System Access &amp; Security Roles</span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid" style={{ marginBottom: '24px' }}>
                <div className="form-group">
                  <label>Assign System Role <span className="req">*</span></label>
                  <select aria-label="Assign System Role" className="form-select" value={form.role} onChange={(e) => updateForm('role', e.target.value)} required>
                    <option value="">Choose role category...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({r.type === 'teaching' ? '🎓 Teaching' : '⚙️ Non-Teaching'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="academic-form-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button className="btn btn-ghost" type="button" onClick={() => { resetForm(); setViewMode('list') }}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  <i className={`fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}`}></i>
                  {editingId ? ' Update Employee' : ' Register Employee'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DETAIL VIEW */}
        {viewMode === 'detail' && selectedStaff && (
          <div className="roles-table-card academic-detail-card" style={{ maxWidth: '950px', margin: '0 auto' }}>
            <div className="role-detail-profile" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="role-detail-info">
                <div
                  className="role-detail-icon"
                  style={{
                    background: selectedStaff.userType === 'non-teaching' ? 'var(--amberbg)' : 'var(--bluebg)',
                    color: selectedStaff.userType === 'non-teaching' ? 'var(--amber)' : 'var(--blue)',
                  }}
                >
                  <i className={`fa-solid ${selectedStaff.userType === 'non-teaching' ? 'fa-gears' : 'fa-chalkboard-user'}`}></i>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedStaff.name}
                    {(() => {
                      if (!selectedStaff?.dob) return null
                      const parts = selectedStaff.dob.split('-')
                      if (parts.length < 3) return null
                      const birthMonth = parseInt(parts[1], 10)
                      const birthDay = parseInt(parts[2], 10)
                      const today = new Date()
                      const isBirthdayToday = (today.getMonth() + 1 === birthMonth && today.getDate() === birthDay) || (selectedStaff.id === 1)
                      if (isBirthdayToday) {
                        return (
                          <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--purplebg)', color: 'var(--purple)', border: '1px solid var(--purple)' }}>
                            🎂 Happy Birthday! 🎉
                          </span>
                        )
                      }
                      return null
                    })()}
                    <span className="badge badge-teal" style={{ fontSize: 10, padding: '2px 8px' }}>
                      {selectedStaff.role}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    <span className={`badge ${selectedStaff.status === 'active' ? 'badge-active' : 'badge-blocked'}`}>
                      {selectedStaff.status === 'active' ? 'Active' : 'Blocked'}
                    </span>
                    <span>
                      <i className="fa-solid fa-address-card" style={{ marginRight: 4 }}></i>
                      {selectedStaff.employeeId}
                    </span>
                    <span>
                      <i className="fa-solid fa-briefcase" style={{ marginRight: 4 }}></i>
                      {selectedStaff.department}
                    </span>
                    <span>
                      <i className="fa-solid fa-graduation-cap" style={{ marginRight: 4 }}></i>
                      {selectedStaff.qualification}
                    </span>
                  </div>
                </div>
              </div>
              <div className="role-detail-health">
                <div className="role-health-item">
                  <span className="role-health-val">{currencySymbol()}{selectedSalary.netSalary}</span>
                  <span className="role-health-lbl">Net Salary</span>
                </div>
                <div className="role-health-item">
                  <span className="role-health-val">{selectedStaff.experience} yrs</span>
                  <span className="role-health-lbl">Experience</span>
                </div>
                <div className="role-health-item">
                  <span className="role-health-val">{selectedStaff.salaryHistory?.length || 0}</span>
                  <span className="role-health-lbl">Pay Slips</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTORS */}
            <div className="role-detail-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '12px 20px', overflowX: 'visible', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', borderRadius: '0' }}>
              <button className={detailTab === 'overview' ? 'active' : ''} onClick={() => setDetailTab('overview')}>
                <i className="fa-solid fa-circle-info"></i> Employee Overview
              </button>
              <button className={detailTab === 'payroll' ? 'active' : ''} onClick={() => setDetailTab('payroll')}>
                <i className="fa-solid fa-wallet"></i> Payroll &amp; Salaries ({selectedStaff.salaryHistory?.length || 0})
              </button>
              <button className={detailTab === 'access' ? 'active' : ''} onClick={() => setDetailTab('access')}>
                <i className="fa-solid fa-shield-halved"></i> Permissions access map
              </button>
              <button className={detailTab === 'attendance' ? 'active' : ''} onClick={() => setDetailTab('attendance')}>
                <i className="fa-solid fa-clipboard-user"></i> Attendance
              </button>
            </div>

            {/* OVERVIEW TAB */}
            {detailTab === 'overview' && (
              <div style={{ padding: '24px' }}>
                <div className="role-overview-grid" style={{ marginBottom: '24px' }}>
                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-user"></i> Personal Information</h4>
                    <div className="role-overview-row">
                      <span>Full Name</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStaff.name}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Employee ID</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)', fontFamily: 'monospace' }}>{selectedStaff.employeeId}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Email address</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)', textTransform: 'none' }}>{selectedStaff.email || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Phone number</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStaff.phone || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Date of Birth</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStaff.dob || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Date of Joining</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStaff.joiningDate || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-building-user"></i> Professional Resume</h4>
                    <div className="role-overview-row">
                      <span>Assigned Role</span>
                      <span className="badge badge-blue">{selectedStaff.role}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Department</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStaff.department}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>User Classification</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>
                        {selectedStaff.userType === 'teaching' ? '🎓 Teaching Faculty' : '⚙️ Non-Teaching Staff'}
                      </span>
                    </div>
                    <div className="role-overview-row">
                      <span>Degree Qualification</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStaff.qualification || '—'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Alma Mater Institution</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStaff.institution || '—'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>National ID Number</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)', fontFamily: 'monospace' }}>{selectedStaff.nationalIdNo || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Address block */}
                <div className="role-overview-card" style={{ width: '100%', marginBottom: '24px' }}>
                  <h4><i className="fa-solid fa-map-location-dot"></i> Residential Address Details</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '10px' }}>
                    
                    {/* Permanent Address */}
                    <div style={{ padding: '14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-house-chimney" style={{ color: 'var(--blue)' }}></i> Permanent Address
                      </h5>
                      {selectedStaff.permanentAddress?.street || (typeof selectedStaff.address === 'string' ? selectedStaff.address : selectedStaff.address?.street) ? (
                        <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                          <div><strong>Street/Village:</strong> {selectedStaff.permanentAddress?.street || selectedStaff.address?.street || selectedStaff.address || '—'}</div>
                          {selectedStaff.permanentAddress && (
                            <>
                              <div><strong>Ward No:</strong> {selectedStaff.permanentAddress.wardNo || '—'}</div>
                              {selectedStaff.permanentAddress.municipalityType && (
                                <div><strong>Municipality Type:</strong> {selectedStaff.permanentAddress.municipalityType}</div>
                              )}
                              <div><strong>City &amp; District:</strong> {selectedStaff.permanentAddress.city || '—'}, {selectedStaff.permanentAddress.district || '—'}</div>
                              <div><strong>State &amp; Country:</strong> {selectedStaff.permanentAddress.state || '—'}, {selectedStaff.permanentAddress.country || '—'}</div>
                              <div><strong>ZIP / Postal Code:</strong> {selectedStaff.permanentAddress.zip || '—'}</div>
                            </>
                          )}
                          {!selectedStaff.permanentAddress && typeof selectedStaff.address === 'object' && (
                            <>
                              <div><strong>City:</strong> {selectedStaff.address.city || '—'}</div>
                              <div><strong>State:</strong> {selectedStaff.address.state || '—'}</div>
                              <div><strong>ZIP Code:</strong> {selectedStaff.address.zip || '—'}</div>
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
                      {selectedStaff.sameAsPermanent ? (
                        <div style={{ fontSize: '12px', color: 'var(--teal)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-circle-check"></i> Same as Permanent Address
                        </div>
                      ) : selectedStaff.temporaryAddress?.street ? (
                        <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                          <div><strong>Street/Village:</strong> {selectedStaff.temporaryAddress.street || '—'}</div>
                          <div><strong>Ward No:</strong> {selectedStaff.temporaryAddress.wardNo || '—'}</div>
                          {selectedStaff.temporaryAddress.municipalityType && (
                            <div><strong>Municipality Type:</strong> {selectedStaff.temporaryAddress.municipalityType}</div>
                          )}
                          <div><strong>City &amp; District:</strong> {selectedStaff.temporaryAddress.city || '—'}, {selectedStaff.temporaryAddress.district || '—'}</div>
                          <div><strong>State &amp; Country:</strong> {selectedStaff.temporaryAddress.state || '—'}, {selectedStaff.temporaryAddress.country || '—'}</div>
                          <div><strong>ZIP / Postal Code:</strong> {selectedStaff.temporaryAddress.zip || '—'}</div>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--t3)', fontSize: '12px' }}>No temporary address logged.</span>
                      )}
                    </div>

                  </div>
                </div>

                {/* Verification scan documents block */}
                <div className="role-overview-card" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0 }}><i className="fa-solid fa-folder-open"></i> Verification Scan Records</h4>
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowAddDocForm(!showAddDocForm)}>
                      <i className={`fa-solid ${showAddDocForm ? 'fa-xmark' : 'fa-plus'}`}></i>
                      {showAddDocForm ? ' Cancel' : ' Add Document'}
                    </button>
                  </div>

                  {showAddDocForm && (
                    <form onSubmit={handleSaveCustomDoc} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', marginTop: 0 }}>Add Custom Document Scanning</h4>
                      <div className="form-grid" style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Document Name/Label <span className="req">*</span></label>
                          <input aria-label="Document Name/Label"
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                            placeholder="e.g. Work Permit, Degree Scan"
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Upload File <span className="req">*</span></label>
                          <input
                            type="file"
                            id="staff-custom-doc-file-detail"
                            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setNewDocFile(file)
                            }}
                          />
                          <label htmlFor="staff-custom-doc-file-detail" className="btn btn-ghost btn-xs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '8px', margin: 0, background: 'var(--bg)', height: '34px', fontWeight: 500 }}>
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            {newDocFile ? newDocFile.name : 'Choose file...'}
                          </label>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-xs" type="button" onClick={() => { setShowAddDocForm(false); setNewDocName(''); setNewDocFile(null); }}>
                          Cancel
                        </button>
                        <button className="btn btn-primary btn-xs" type="submit" disabled={!newDocName.trim() || !newDocFile}>
                          Save Document
                        </button>
                      </div>
                    </form>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {(() => {
                      const standardDocs = [
                        { key: 'citizenship', label: 'Citizenship Scanned ID', icon: 'fa-file-shield' },
                        { key: 'nationalIdCard', label: 'National ID Card Scan', icon: 'fa-id-card' },
                        { key: 'ppPhoto', label: 'PP size photo', icon: 'fa-image' }
                      ]

                      const docsList = []
                      standardDocs.forEach((std) => {
                        docsList.push({
                          key: std.key,
                          label: std.label,
                          icon: std.icon,
                          doc: selectedStaff.documents?.[std.key]
                        })
                      })

                      if (selectedStaff.documents) {
                        Object.entries(selectedStaff.documents).forEach(([key, doc]) => {
                          if (key.startsWith('custom_') && doc) {
                            docsList.push({
                              key,
                              label: doc.label || 'Custom Document',
                              icon: 'fa-file-medical',
                              doc
                            })
                          }
                        })
                      }

                      return docsList.map(({ key, label, icon, doc }) => {
                        return (
                          <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', background: doc ? 'var(--bg)' : 'var(--bg2)', display: 'flex', alignItems: 'center', gap: '12px', opacity: doc ? 1 : 0.6 }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: doc ? 'var(--bluebg)' : 'var(--border)', color: doc ? 'var(--blue)' : 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                              <i className={`fa-solid ${icon}`}></i>
                            </div>
                            <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                              <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>{label}</div>
                              {doc ? (
                                <>
                                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginTop: '2px' }} title={doc.name}>
                                    {doc.name}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '1px' }}>
                                    {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'N/A'} • {doc.type ? doc.type.split('/')[1]?.toUpperCase() || 'File' : 'File'}
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: '12px', color: 'var(--t3)', fontStyle: 'italic', marginTop: '2px' }}>
                                  Not uploaded
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              {doc ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn-icon-sm tooltip"
                                    data-tooltip="Download File"
                                    aria-label="Download original file" onClick={() => downloadAttachment(doc)}
                                  >
                                    <i className="fa-solid fa-download"></i>
                                  </button>
                                  <button aria-label="Delete" type="button" className="btn-icon-sm danger tooltip" data-tooltip="Delete File" onClick={() => handleDirectDelete(key, label)}>
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    id={`direct-staff-file-upload-${key}`}
                                    accept={key === 'ppPhoto' ? '.png,.jpg,.jpeg,.gif' : '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx'}
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleDirectUpload(key, label, e)}
                                  />
                                  <label htmlFor={`direct-staff-file-upload-${key}`} className="btn-icon-sm tooltip" data-tooltip="Upload scanned doc" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ color: 'var(--blue)' }}></i>
                                  </label>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* PAYROLL & SALARY TAB */}
            {detailTab === 'payroll' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="stat-card" style={{ padding: '14px', border: '1px solid var(--border)' }}>
                    <div className="stat-card-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)', width: '36px', height: '36px', fontSize: '14px' }}>
                      <i className="fa-solid fa-wallet"></i>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{currencySymbol()}{selectedSalary.baseSalary}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>Monthly Base Salary</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '14px', border: '1px solid var(--border)' }}>
                    <div className="stat-card-icon" style={{ background: 'var(--greenbg)', color: 'var(--green)', width: '36px', height: '36px', fontSize: '14px' }}>
                      <i className="fa-solid fa-plus-circle"></i>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>+{currencySymbol()}{selectedSalary.totalAdditions}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>Total Additions</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '14px', border: '1px solid var(--border)' }}>
                    <div className="stat-card-icon" style={{ background: 'var(--redbg)', color: 'var(--red)', width: '36px', height: '36px', fontSize: '14px' }}>
                      <i className="fa-solid fa-minus-circle"></i>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>-{currencySymbol()}{selectedSalary.totalDeductions}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>Total Deductions</div>
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: '14px', border: '1px solid var(--border)', background: 'var(--bg3)' }}>
                    <div className="stat-card-icon" style={{ background: 'var(--accentglow)', color: 'var(--accent)', width: '36px', height: '36px', fontSize: '14px' }}>
                      <i className="fa-solid fa-coins"></i>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800 }}>{currencySymbol()}{selectedSalary.netSalary}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>Net Monthly Salary</div>
                    </div>
                  </div>
                </div>

                {/* Salary Customization details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', background: 'var(--bg2)' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--green)' }}>Additions / Allowances Detail</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedStaff.additions?.map((add, idx) => {
                        const val = add.valType === 'percent' ? `${add.value}% of base (${currencySymbol()}${Math.round(selectedSalary.baseSalary * (add.value / 100))})` : `${currencySymbol()}${add.value}`
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>{add.label}</span>
                            <span style={{ fontWeight: 600 }}>+{val}</span>
                          </div>
                        )
                      })}
                      {(!selectedStaff.additions || selectedStaff.additions.length === 0) && <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--t3)' }}>No allowance settings mapped.</div>}
                    </div>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', background: 'var(--bg2)' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--red)' }}>Deductions / Taxes Detail</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedStaff.deductions?.map((ded, idx) => {
                        const val = ded.valType === 'percent' ? `${ded.value}% of base (${currencySymbol()}${Math.round(selectedSalary.baseSalary * (ded.value / 100))})` : `${currencySymbol()}${ded.value}`
                        return (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>{ded.label}</span>
                            <span style={{ fontWeight: 600 }}>-{val}</span>
                          </div>
                        )
                      })}
                      {(!selectedStaff.deductions || selectedStaff.deductions.length === 0) && <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--t3)' }}>No deduction tax rules mapped.</div>}
                    </div>
                  </div>
                </div>

                {/* Salary payslips actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)' }}>Salary Payment Slip logs</h3>
                  <button className="btn btn-primary btn-xs" onClick={() => setShowPayForm(!showPayForm)}>
                    <i className="fa-solid fa-plus"></i> Record Salary Payment
                  </button>
                </div>

                {showPayForm && (
                  <form onSubmit={recordSalaryPayment} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--bg2)', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', marginTop: 0 }}>Record Employee Salary Release</h4>
                    <div className="form-grid" style={{ marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Salary Month <span className="req">*</span></label>
                        <input aria-label="Salary Month" className="form-input" placeholder="e.g. June 2026" value={payForm.month} onChange={(e) => setPayForm({ ...payForm, month: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Date of Release <span className="req">*</span></label>
                        <input aria-label="Date of Release" className="form-input" type="date" value={payForm.paymentDate} onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Authorized Payer Name</label>
                        <input aria-label="Authorized Payer Name" className="form-input" placeholder="Admin Payer name" value={payForm.paidBy} onChange={(e) => setPayForm({ ...payForm, paidBy: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select aria-label="Status" className="form-select" value={payForm.status} onChange={(e) => setPayForm({ ...payForm, status: e.target.value })}>
                          <option value="paid">Paid / Settled</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-xs" type="button" onClick={() => setShowPayForm(false)}>Cancel</button>
                      <button className="btn btn-primary btn-xs" type="submit">Release Payment</button>
                    </div>
                  </form>
                )}

                {/* Salary history logs table */}
                {(!selectedStaff.salaryHistory || selectedStaff.salaryHistory.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--t3)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <i className="fa-solid fa-wallet" style={{ fontSize: '28px', marginBottom: '10px', display: 'block' }}></i>
                    No previous payslip releases found.
                  </div>
                ) : (
                  <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <table className="roles-table">
                      <thead>
                        <tr>
                          <th>Slip Number</th>
                          <th>Pay Month</th>
                          <th>Calculated Base</th>
                          <th>Net Released</th>
                          <th>Release Date &amp; Time</th>
                          <th>Authorized Payer</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaff.salaryHistory.map((history) => (
                          <tr key={history.id}>
                            <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{history.slipNo}</span></td>
                            <td><strong>{history.month}</strong></td>
                            <td>{currencySymbol()}{history.baseSalary}</td>
                            <td><strong style={{ color: 'var(--green)' }}>{currencySymbol()}{history.netSalary}</strong></td>
                            <td>{history.paymentDate}</td>
                            <td>{history.paidBy}</td>
                            <td>
                              <span className={`badge ${history.status === 'paid' ? 'badge-active' : 'badge-gray'}`}>
                                {history.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="roles-actions" style={{ justifyContent: 'flex-end' }}>
                                {history.status === 'paid' && (
                                  <button
                                    className="btn-icon-sm tooltip"
                                    data-tooltip="Download Pay Slip"
                                    onClick={() => {
                                      const text = `=======================================\n           EDUCORE PAYROLL SLIP        \n=======================================\nSlip No: ${history.slipNo}\nEmployee: ${selectedStaff.name}\nID: ${selectedStaff.employeeId}\nRole: ${selectedStaff.role}\nDepartment: ${selectedStaff.department}\n---------------------------------------\nRelease Month: ${history.month}\nBase Salary: ${currencySymbol()}${history.baseSalary}\nNet Salary Released: ${currencySymbol()}${history.netSalary}\nPayment Timestamp: ${history.paymentDate}\nReleased By: ${history.paidBy}\n---------------------------------------\nStatus: COMPLETED / BANK SETTLED\n=======================================`
                                      const blob = new Blob([text], { type: 'text/plain' })
                                      const url = URL.createObjectURL(blob)
                                      const a = document.createElement('a')
                                      a.href = url
                                      a.download = `Payslip_${selectedStaff.name.replace(/\s+/g, '_')}_${history.month.replace(/\s+/g, '_')}.txt`
                                      document.body.appendChild(a)
                                      a.click()
                                      document.body.removeChild(a)
                                      URL.revokeObjectURL(url)
                                    }}
                                  >
                                    <i className="fa-solid fa-download"></i>
                                  </button>
                                )}
                                <button aria-label="Delete" className="btn-icon-sm danger tooltip" data-tooltip="Delete Slip Record" onClick={() => deleteSalaryRecord(history.id)}>
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PRIVILEGES MAP TAB */}
            {detailTab === 'access' && (
              <div style={{ padding: '24px' }}>
                {!activeRole ? (
                  <div style={{ fontStyle: 'italic', color: 'var(--t3)', textAlign: 'center', padding: '30px' }}>
                    No system permissions found for this role designation.
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--t1)', marginBottom: '4px' }}>
                      Security Role: {activeRole.name} ({activeRole.code})
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--t3)', marginBottom: '20px' }}>
                      {activeRole.description || 'No role description guide mapped.'}
                    </p>

                    <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <table className="roles-table">
                        <thead>
                          <tr style={{ background: 'var(--bg2)' }}>
                            <th>Module Component</th>
                            <th>Actions Granted</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(activeRole.permissions || {}).map(([moduleName, actions]) => (
                            <tr key={moduleName}>
                              <td><strong>{moduleName}</strong></td>
                              <td>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  {(actions || []).map((action, idx) => (
                                    <span key={idx} className="badge badge-blue" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                                      {action}
                                    </span>
                                  ))}
                                  {(actions || []).length === 0 && <span style={{ color: 'var(--t3)', fontSize: '11px' }}>No Access</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Attendance Tab */}
            {detailTab === 'attendance' && selectedStaff && (() => {
              const MONTHS_ATT = ['January','February','March','April','May','June','July','August','September','October','November','December']
              const WDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
              const S_COLORS = { P: 'var(--green)', A: 'var(--red)', L: 'var(--amber)', H: '#94a3b8' }
              const S_BG     = { P: 'var(--greenbg)', A: 'var(--redbg)', L: 'var(--amberbg)', H: 'rgba(148,163,184,0.12)' }
              const S_MAP    = { P: 'Present', A: 'Absent', L: 'Late', H: 'Holiday' }

              const mKey    = `${teaAttYear}-${teaAttMonth}`
              const attRec  = teaAttData[mKey]?.[selectedStaff.id] || {}

              const days    = new Date(teaAttYear, teaAttMonth + 1, 0).getDate()
              const firstDOW = new Date(teaAttYear, teaAttMonth, 1).getDay()

              let p=0,a=0,l=0,h=0
              for (let d=1; d<=days; d++) {
                const isSunday = new Date(teaAttYear, teaAttMonth, d).getDay() === 0
                const s = attRec[d] || (isSunday ? 'H' : 'P')
                if (s==='P') p++; else if (s==='A') a++; else if (s==='L') l++; else h++
              }
              const wd  = days - h
              const pct = wd > 0 ? Math.round(((p+l)/wd)*100) : 0

              const now2 = new Date()
              const monthOpts = []
              for (let i=0; i<12; i++) {
                const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1)
                monthOpts.push({ m: d.getMonth(), y: d.getFullYear(), label: `${MONTHS_ATT[d.getMonth()]} ${d.getFullYear()}` })
              }

              const cells = []
              for (let i=0; i<firstDOW; i++) cells.push(null)
              for (let d=1; d<=days; d++) cells.push(d)

              return (
                <div style={{ padding: '24px' }}>
                  {/* Month selector + stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    <select aria-label="Value"
                      className="form-select"
                      style={{ minWidth: 170 }}
                      value={`${teaAttMonth}-${teaAttYear}`}
                      onChange={e => {
                        const [m,y] = e.target.value.split('-').map(Number)
                        setTeaAttMonth(m); setTeaAttYear(y)
                      }}
                    >
                      {monthOpts.map(o => (
                        <option key={o.label} value={`${o.m}-${o.y}`}>{o.label}</option>
                      ))}
                    </select>

                    {/* KPI pills */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { k:'P', v:p }, { k:'A', v:a }, { k:'L', v:l }, { k:'H', v:h }
                      ].map(({ k, v }) => (
                        <span key={k} style={{ fontSize: 12, fontWeight: 700, color: S_COLORS[k], background: S_BG[k], padding: '3px 10px', borderRadius: 20 }}>
                          {S_MAP[k]}: {v}
                        </span>
                      ))}
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: '3px 12px', borderRadius: 20,
                        color: pct>=75?'var(--green)':pct>=50?'var(--amber)':'var(--red)',
                        background: pct>=75?'var(--greenbg)':pct>=50?'var(--amberbg)':'var(--redbg)'
                      }}>
                        {pct}% Attendance
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: 'var(--bg3)', borderRadius: 20, height: 10, overflow: 'hidden', marginBottom: 18 }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 20, transition: 'width 0.4s',
                      background: pct>=75?'var(--green)':pct>=50?'var(--amber)':'var(--red)'
                    }} />
                  </div>

                  {/* Calendar grid */}
                  <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-lg)', padding: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: 'var(--t2)' }}>
                      <i className="fa-solid fa-calendar-days" style={{ marginRight: 8, color: 'var(--accent)' }}></i>
                      {MONTHS_ATT[teaAttMonth]} {teaAttYear} — Attendance Calendar
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                      {WDAYS.map(wd => (
                        <div key={wd} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--t3)', padding: '2px 0', textTransform: 'uppercase' }}>
                          {wd}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                      {cells.map((d, idx) => {
                        if (!d) return <div key={`b${idx}`} />
                        const isSun = new Date(teaAttYear, teaAttMonth, d).getDay() === 0
                        const st = attRec[d] || (isSun ? 'H' : 'P')
                        return (
                          <div
                            key={d}
                            title={`Day ${d}: ${S_MAP[st]}`}
                            style={{
                              borderRadius: 6, padding: '6px 2px',
                              background: S_BG[st], color: S_COLORS[st],
                              textAlign: 'center', fontWeight: 800,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                            }}
                          >
                            <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 600, lineHeight: 1 }}>{d}</span>
                            <span style={{ fontSize: 11, lineHeight: 1 }}>{st}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                    {Object.entries(S_MAP).map(([k,v]) => (
                      <span key={k} style={{ fontSize: 11, fontWeight: 700, color: S_COLORS[k], background: S_BG[k], padding: '2px 10px', borderRadius: 20 }}>
                        {k} = {v}
                      </span>
                    ))}
                    <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>
                      View & edit full records on the <strong>Attendance</strong> page.
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* DETAIL VIEW FOOTER */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <button className="btn btn-ghost" onClick={() => setViewMode('list')}>
                  <i className="fa-solid fa-arrow-left"></i> Back to List
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost" onClick={() => editStaff(selectedStaff)}>
                    <i className="fa-solid fa-pen"></i> Edit Employee Info
                  </button>
                  <button className="btn btn-ghost" style={{ borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => deleteStaff(selectedStaff)}>
                    <i className="fa-solid fa-trash"></i> Delete Employee
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
