import { useRouter } from 'next/router'
import FeeCollectionLedger from '../components/FeeCollectionLedger'
import { effectiveFeeRate } from '../lib/feeLedger'
import { INITIAL_FEES } from '../lib/feeData'
import { validateStudentPlacement } from '../lib/registryValidation'
import { getRaw } from '../lib/storage'
import { currencySymbol } from '../lib/schoolConfig'
import { allowDeletion } from '../lib/recordIntegrity'
import { saveAttachment, downloadAttachment } from '../lib/attachments'
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
  makeAdmissionNo,
  makeId,
  readStoredList,
  writeStoredList,
  numberToWords,
} from '../lib/academicData'
import { exportToCSV, printToPDF } from '../lib/exportUtils'

const parseMonthsCount = (monthStr) => {
  if (!monthStr) return 1
  const match = monthStr.match(/\((\d+)\s+Months?\)/i)
  if (match) {
    return parseInt(match[1], 10)
  }
  return 1
}

const getFeeItemDetails = (feeItem, monthStr) => {
  const monthsCount = parseMonthsCount(monthStr)
  const freq = feeItem.frequency || 'Monthly'
  let rate = feeItem.rate !== undefined ? feeItem.rate : feeItem.amount
  let qty = 1
  let total = feeItem.amount

  if (freq === 'Monthly') {
    qty = monthsCount
    if (feeItem.rate === undefined && monthsCount > 0) {
      rate = feeItem.amount / monthsCount
    }
  } else if (freq === 'Weekly') {
    qty = monthsCount * 4
    if (feeItem.rate === undefined && monthsCount > 0) {
      rate = feeItem.amount / (monthsCount * 4)
    }
  } else {
    qty = 1
    rate = feeItem.rate !== undefined ? feeItem.rate : feeItem.amount
  }

  return {
    name: feeItem.name,
    frequency: freq,
    rate: rate,
    qty: qty,
    total: total
  }
}

const emptyForm = {
  name: '',
  admissionNo: '',
  classId: '',
  rollNo: '',
  gender: '',
  guardianName: '',
  contact: '',
  status: 'active',
  email: '',
  phone: '',
  dob: '',
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
  documents: {},
}

function getTeacherName(id, staff) {
  return staff.find((t) => t.id === Number(id))?.name || 'Not assigned'
}

export default function Students() {
  const [students, setStudents] = useState(INITIAL_STUDENTS)
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [staff, setStaff] = useState([])
  const [fees, setFees] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [detailTab, setDetailTab] = useState('overview')
  const router = useRouter()
  useEffect(() => {
    if (hydrated && router.isReady && router.query.studentId) {
      setSelectedStudentId(Number(router.query.studentId))
      setViewMode('detail')
      setDetailTab('payments')
    }
  }, [hydrated, router.isReady, router.query.studentId])

  const [customDocInputs, setCustomDocInputs] = useState([])

  // Attendance states for student detail view
  const [stuAttData, setStuAttData] = useState({})
  const [stuAttMonth, setStuAttMonth] = useState(new Date().getMonth())
  const [stuAttYear, setStuAttYear]   = useState(new Date().getFullYear())

  const getCollectorName = (userId) => {
    if (!userId) return '—'
    if (userId === 'Super Admin') return 'Super Admin'
    const member = staff.find((s) => String(s.id) === String(userId))
    return member ? member.name : `Staff (ID: ${userId})`
  }

  // Fees/Payments states
  const [payForm, setPayForm] = useState({
    amountPaid: '',
    month: '',
    startMonth: (() => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const today = new Date()
      return `${months[today.getMonth()]} ${today.getFullYear()}`
    })(),
    monthsCount: 1,
    paidBy: '',
    payerRelation: 'Father',
    status: 'paid',
    paymentMode: 'Cash',
    onlineApp: 'E-Sewa',
    customOnlineApp: '',
    customRelationship: '',
    discountType: 'none',
    customDiscount: '',
    taxType: 'none',
    customTax: ''
  })
  const [showPayForm, setShowPayForm] = useState(false)
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [onlineModes, setOnlineModes] = useState([])
  const [payerRelationships, setPayerRelationships] = useState([])
  const [feeSearch, setFeeSearch] = useState('')
  const [feeStatusFilter, setFeeStatusFilter] = useState('all')
  const [feeSortBy, setFeeSortBy] = useState('latest')
  const [localOverrides, setLocalOverrides] = useState({})

  // Exam states
  const [examForm, setExamForm] = useState({
    examName: '',
    year: String(new Date().getFullYear()),
    date: '',
    remarks: '',
    subjectsMarks: {}
  })
  const [showExamForm, setShowExamForm] = useState(false)

  // Direct Document upload states for Detail view
  const [showAddDocForm, setShowAddDocForm] = useState(false)
  const [newDocName, setNewDocName] = useState('')
  const [newDocFile, setNewDocFile] = useState(null)

  useEffect(() => {
    try {
      const raw = getRaw('educore.studentAttendance')
      if (raw) setStuAttData(JSON.parse(raw))
    } catch(e) {}
  }, [])

  useEffect(() => {
    let storedStudents = readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS)
    // Existing records, including empty histories, are never replaced with fixtures.
    setStudents(storedStudents)
    setSelectedStudentId(storedStudents[0]?.id || null)
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    setSubjects(readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS))
    setStaff(readStoredList(STORAGE_KEYS.staff, STAFF))
    setFees(readStoredList('educore.fees', INITIAL_FEES))
    setOnlineModes(readStoredList('educore.onlinePaymentModes', ['E-Sewa', 'Khalti', 'Bank Transfer']))
    setPayerRelationships(readStoredList('educore.payerRelationships', ['Self', 'Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Guardian']))
    
    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.students, students)
  }, [students, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.onlinePaymentModes', onlineModes)
  }, [onlineModes, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.payerRelationships', payerRelationships)
  }, [payerRelationships, hydrated])

  useEffect(() => {
    if (selectedStudent) {
      setLocalOverrides(selectedStudent.feeOverrides || {})
    }
  }, [selectedStudentId, detailTab])

  const handleSaveFeeOverrides = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit','Fees')) return

    e.preventDefault()
    if (!selectedStudent) return
    if (fees.some(fee => !Number.isFinite(effectiveFeeRate(fee,selectedStudent.classId,localOverrides)) || effectiveFeeRate(fee,selectedStudent.classId,localOverrides)<0)) {showToast('Enter valid rates or concessions. Discounts cannot exceed the class rate or 100%.', 'error'); return}
    const updated = students.map(s => s.id === selectedStudent.id ? {...s, feeOverrides:localOverrides} : s)
    if (!writeStoredList(STORAGE_KEYS.students,updated)) return
    setStudents(updated)
    showToast('Student-specific fee overrides saved successfully', 'success')
  }

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2600)
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0]
  const selectedStudentClass = selectedStudent ? classes.find((c) => c.id === selectedStudent.classId) : null
  const selectedStudentSubjects = selectedStudentClass
    ? subjects.filter((s) => (selectedStudentClass.subjectIds || []).includes(s.id))
    : []
  const classmatesOfSelected = selectedStudent
    ? students.filter((s) => s.classId === selectedStudent.classId && s.id !== selectedStudent.id)
    : []

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students
      .filter((student) => {
        if (classFilter !== 'all' && String(student.classId) !== classFilter) return false
        if (statusFilter !== 'all' && student.status !== statusFilter) return false
        if (!query) return true
        const cls = classes.find((c) => c.id === student.classId)
        const className = cls ? `${cls.name}${cls.section ? ` ${cls.section}` : ''}` : ''
        return [
          student.name,
          student.admissionNo,
          student.guardianName,
          className,
          student.gender,
          student.rollNo ? String(student.rollNo) : '',
          student.email,
          student.phone
        ]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(query))
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [students, classes, search, classFilter, statusFilter])

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter((s) => s.status === 'active').length,
    male: students.filter((s) => s.gender === 'Male').length,
    female: students.filter((s) => s.gender === 'Female').length,
  }), [students])

  const paymentStats = useMemo(() => {
    if (!selectedStudent || !selectedStudent.payments) {
      return { totalPaid: 0, pendingCount: 0, overdueAmount: 0, lastPaidAmount: 0, currentMonthInvoice: 4500 }
    }
    const paidList = selectedStudent.payments.filter((p) => p.status === 'paid')
    const pendingList = selectedStudent.payments.filter((p) => p.status === 'pending')
    const overdueList = selectedStudent.payments.filter((p) => p.status === 'overdue')

    const totalPaid = paidList.reduce((sum, p) => sum + p.amountPaid, 0)
    const pendingCount = pendingList.length
    const overdueAmount = overdueList.reduce((sum, p) => sum + (p.amount || 4500), 0)
    const lastPaidAmount = paidList.length > 0 ? paidList[paidList.length - 1].amountPaid : 0

    return {
      totalPaid,
      pendingCount,
      overdueAmount,
      lastPaidAmount,
      currentMonthInvoice: 4500
    }
  }, [selectedStudent])

  const calculatedStudentTotals = useMemo(() => {
    if (!selectedStudent || !fees.length) {
      return { subtotal: 0, discount: 0, tax: 0, grandTotal: 0, words: '', breakdown: [] }
    }

    const classFees = fees.filter(
      (f) => f.status === 'active' && (f.classIds || []).some(id=>String(id)===String(selectedStudent.classId))
    )

    const N = Number(payForm.monthsCount) || 1

    const breakdown = classFees.map((f) => {
      const overrideVal = effectiveFeeRate(f,selectedStudent.classId,selectedStudent.feeOverrides)
      const finalRate = overrideVal !== null && overrideVal !== '' ? Number(overrideVal) : f.amount

      let computedAmount = finalRate
      const freq = f.frequency || 'Monthly'

      if (freq === 'Monthly') {
        computedAmount = finalRate * N
      } else if (freq === 'Weekly') {
        computedAmount = finalRate * (N * 4)
      } else {
        computedAmount = finalRate
      }

      return {
        name: f.name,
        amount: computedAmount,
        rate: finalRate,
        frequency: f.frequency
      }
    })

    const subtotal = breakdown.reduce((sum, item) => sum + item.amount, 0)

    let discount = 0
    const dType = payForm.discountType || 'none'
    const dVal = Number(payForm.customDiscount) || 0

    if (dType === '5%') discount = subtotal * 0.05
    else if (dType === '10%') discount = subtotal * 0.10
    else if (dType === '25%') discount = subtotal * 0.25
    else if (dType === '50%') discount = subtotal * 0.50
    else if (dType === '100%') discount = subtotal
    else if (dType === 'customPercent') discount = subtotal * (dVal / 100)
    else if (dType === 'customAmount') discount = dVal

    discount = Math.min(subtotal, Math.max(0, discount))

    let tax = 0
    const tType = payForm.taxType || 'none'
    const tVal = Number(payForm.customTax) || 0
    const taxableAmount = Math.max(0, subtotal - discount)

    if (tType === '13%') tax = taxableAmount * 0.13
    else if (tType === '5%') tax = taxableAmount * 0.05
    else if (tType === 'customPercent') tax = taxableAmount * (tVal / 100)
    else if (tType === 'customAmount') tax = tVal

    tax = Math.max(0, tax)

    const grandTotal = Math.max(0, subtotal - discount + tax)
    const words = numberToWords(grandTotal)

    return {
      subtotal,
      discount,
      tax,
      grandTotal,
      words,
      breakdown
    }
  }, [selectedStudent, fees, payForm.monthsCount, payForm.discountType, payForm.customDiscount, payForm.taxType, payForm.customTax])

  const filteredStudentPayments = useMemo(() => {
    if (!selectedStudent || !selectedStudent.payments) return []
    const query = feeSearch.toLowerCase().trim()
    return selectedStudent.payments
      .filter((p) => {
        if (feeStatusFilter !== 'all' && p.status !== feeStatusFilter) return false
        if (query) {
          return (p.invoiceNo || '').toLowerCase().includes(query) || (p.month || '').toLowerCase().includes(query)
        }
        return true
      })
      .sort((a, b) => {
        if (feeSortBy === 'latest') return (b.id || 0) - (a.id || 0)
        if (feeSortBy === 'oldest') return (a.id || 0) - (b.id || 0)
        const amtA = a.status === 'paid' ? a.amountPaid : (a.amount || 4500)
        const amtB = b.status === 'paid' ? b.amountPaid : (b.amount || 4500)
        if (feeSortBy === 'amountHigh') return amtB - amtA
        if (feeSortBy === 'amountLow') return amtA - amtB
        return (b.id || 0) - (a.id || 0)
      })
  }, [selectedStudent, feeSearch, feeStatusFilter, feeSortBy])

  const handleExportStudentFeesCSV = () => {
    if (!selectedStudent) return
    const headers = ['Slip Number', 'Month', 'Amount', 'Payment Date', 'Payer Details', 'Payment Method', 'Collector', 'Status']
    const rows = filteredStudentPayments.map((p) => [
      p.invoiceNo,
      p.month,
      `${currencySymbol()}${p.status === 'paid' ? p.amountPaid : (p.amount || 4500)}`,
      p.paymentDate || '—',
      p.status === 'paid' ? `${p.paidBy} (${p.payerRelation})` : '—',
      p.status === 'paid' ? `${p.paymentMode || 'Cash'}${p.paymentMode === 'Online' && p.onlineApp ? ` (${p.onlineApp})` : ''}` : '—',
      p.status === 'paid' ? getCollectorName(p.receivedBy) : '—',
      p.status.toUpperCase()
    ])
    exportToCSV(`Fees_${selectedStudent.name.replace(/\s+/g, '_')}.csv`, headers, rows)
    showToast('Student payments exported to CSV', 'success')
  }

  const handleExportStudentFeesPDF = () => {
    if (!selectedStudent) return
    const headers = ['Slip Number', 'Month', 'Amount', 'Payment Date', 'Payer Details', 'Collector', 'Status']
    const rows = filteredStudentPayments.map((p) => [
      p.invoiceNo,
      p.month,
      `${currencySymbol()}${p.status === 'paid' ? p.amountPaid : (p.amount || 4500)}`,
      p.paymentDate || '—',
      p.status === 'paid' ? `${p.paidBy} (${p.payerRelation})` : '—',
      p.status === 'paid' ? getCollectorName(p.receivedBy) : '—',
      p.status.toUpperCase()
    ])
    printToPDF(`Fee Statement - ${selectedStudent.name}`, headers, rows, `Academic billing and receipts statement for class ${getClassName(selectedStudent.classId)}`)
    showToast('Student payments PDF print dialog opened', 'success')
  }

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

  const saveStudent = (event) => {
    event?.preventDefault?.(); if (!requirePermission(editingId ? 'edit' : 'create')) return

    event.preventDefault()
    const name = form.name.trim()

    if (!name) {
      showToast('Student name is required', 'error')
      return
    }

    if (!form.classId) {
      showToast('Please assign a class', 'error')
      return
    }

    const placementError = validateStudentPlacement(form, students, classes, editingId)
    if (placementError) { showToast(placementError, 'error'); return }
    const admissionNo = form.admissionNo.trim() || makeAdmissionNo()

    const duplicateAdmission = students.some(
      (s) => s.id !== editingId && s.admissionNo === admissionNo
    )
    if (duplicateAdmission) {
      showToast('Admission number already exists', 'error')
      return
    }

    const finalDocs = {}
    if (form.documents) {
      const DOC_TYPES = {
        citizenship: 'Citizenship',
        dobCert: 'Date of Birth Certificate',
        ppSizeImage: 'PP size image',
        academicCert: 'Academic certificate'
      }
      Object.entries(form.documents).forEach(([key, doc]) => {
        if (doc) {
          const ext = doc.name.substring(doc.name.lastIndexOf('.')) || '.pdf'
          const typeLabel = DOC_TYPES[key] || key
          finalDocs[key] = {
            ...doc,
            name: `${name} ${typeLabel}${ext}`
          }
        }
      })
    }

    const payload = {
      name,
      admissionNo,
      classId: Number(form.classId),
      rollNo: Number(form.rollNo) || 0,
      gender: form.gender,
      guardianName: form.guardianName.trim(),
      contact: form.contact.trim(),
      status: form.status,
      email: form.email ? form.email.trim() : '',
      phone: form.phone ? form.phone.trim() : '',
      dob: form.dob || '',
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
      documents: finalDocs,
    }

    if (editingId) {
      setStudents((current) =>
        current.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
      )
      showToast('Student updated', 'success')
    } else {
      const id = makeId()
      setStudents((current) => [...current, { id, ...payload }])
      setSelectedStudentId(id)
      showToast('Student added', 'success')
    }

    resetForm()
    setViewMode('list')
  }

  const editStudent = (student) => {
    setEditingId(student.id)
    setSelectedStudentId(student.id)
    setForm({
      name: student.name,
      admissionNo: student.admissionNo || '',
      classId: String(student.classId || ''),
      rollNo: String(student.rollNo || ''),
      gender: student.gender || '',
      guardianName: student.guardianName || '',
      contact: student.contact || '',
      status: student.status || 'active',
      email: student.email || '',
      phone: student.phone || '',
      dob: student.dob || '',
      permanentAddress: {
        district: student.permanentAddress?.district || '',
        country: student.permanentAddress?.country || '',
        city: student.permanentAddress?.city || student.address?.city || (typeof student.address === 'string' ? student.address : ''),
        zip: student.permanentAddress?.zip || student.address?.zip || '',
        state: student.permanentAddress?.state || student.address?.state || '',
        street: student.permanentAddress?.street || student.address?.street || '',
        wardNo: student.permanentAddress?.wardNo || '',
        municipalityType: student.permanentAddress?.municipalityType || '',
      },
      temporaryAddress: {
        district: student.temporaryAddress?.district || '',
        country: student.temporaryAddress?.country || '',
        city: student.temporaryAddress?.city || '',
        zip: student.temporaryAddress?.zip || '',
        state: student.temporaryAddress?.state || '',
        street: student.temporaryAddress?.street || '',
        wardNo: student.temporaryAddress?.wardNo || '',
        municipalityType: student.temporaryAddress?.municipalityType || '',
      },
      sameAsPermanent: student.sameAsPermanent !== undefined ? !!student.sameAsPermanent : true,
      documents: student.documents || {},
    })
    
    // Parse custom document inputs from student data
    const customs = []
    if (student.documents) {
      Object.entries(student.documents).forEach(([k, v]) => {
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

  const deleteStudent = (student) => {
    if (!allowDeletion('student', student)) return
    if (!requirePermission('delete')) return

    if (!confirm(`Delete student "${student.name}"?`)) return
    setStudents((current) => current.filter((s) => s.id !== student.id))
    if (selectedStudentId === student.id) {
      const remaining = students.filter((s) => s.id !== student.id)
      setSelectedStudentId(remaining[0]?.id || null)
    }
    if (editingId === student.id) resetForm()
    showToast('Student deleted', 'info')
    setViewMode('list')
  }

  const getBillingMonthRange = (startMonthStr, monthsCount) => {
    const parts = startMonthStr.split(' ')
    if (parts.length < 2) return startMonthStr
    const monthName = parts[0]
    const yearNum = Number(parts[1])
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const startIdx = months.indexOf(monthName)
    if (startIdx === -1) return startMonthStr

    const endIdxTotal = startIdx + monthsCount - 1
    const endMonthName = months[endIdxTotal % 12]
    const endYear = yearNum + Math.floor(endIdxTotal / 12)

    if (monthsCount === 1) {
      return startMonthStr
    } else {
      return `${startMonthStr} - ${endMonthName} ${endYear} (${monthsCount} Months)`
    }
  }

  const savePayment = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    if (!payForm.startMonth) {
      showToast('Start Month is required', 'error')
      return
    }
    if (payForm.status === 'paid' && !payForm.paidBy.trim()) {
      showToast('Payer name is required for paid slips', 'error')
      return
    }

    let finalApp = ''
    if (payForm.paymentMode === 'Online' && payForm.status === 'paid') {
      if (payForm.onlineApp === 'custom') {
        const customApp = payForm.customOnlineApp.trim()
        if (!customApp) {
          showToast('Custom online payment app name is required', 'error')
          return
        }
        finalApp = customApp
        if (!onlineModes.includes(customApp)) {
          const updatedModes = [...onlineModes, customApp]
          setOnlineModes(updatedModes)
          writeStoredList('educore.onlinePaymentModes', updatedModes)
        }
      } else {
        finalApp = payForm.onlineApp
      }
    }

    let finalRelation = ''
    if (payForm.payerRelation === 'custom') {
      const customRel = payForm.customRelationship.trim()
      if (!customRel) {
        showToast('Custom relationship name is required', 'error')
        return
      }
      finalRelation = customRel
      if (!payerRelationships.includes(customRel)) {
        const updatedRels = [...payerRelationships, customRel]
        setPayerRelationships(updatedRels)
        writeStoredList('educore.payerRelationships', updatedRels)
      }
    } else {
      finalRelation = payForm.payerRelation
    }

    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    const finalMonth = getBillingMonthRange(payForm.startMonth, payForm.monthsCount)
    const isPaid = payForm.status === 'paid'

    const newPayment = {
      id: makeId(),
      invoiceNo: `SLIP-${new Date().getFullYear()}-${makeId().toString(36).toUpperCase()}`,
      amount: calculatedStudentTotals.subtotal, // Base subtotal amount
      amountPaid: isPaid ? calculatedStudentTotals.grandTotal : 0,
      discountAmount: calculatedStudentTotals.discount,
      taxAmount: calculatedStudentTotals.tax,
      inWords: calculatedStudentTotals.words,
      discountType: payForm.discountType,
      customDiscount: payForm.customDiscount,
      taxType: payForm.taxType,
      customTax: payForm.customTax,
      feesBreakdown: calculatedStudentTotals.breakdown,
      month: finalMonth,
      status: payForm.status,
      paymentDate: isPaid ? formattedDate : '—',
      paidBy: isPaid ? (payForm.paidBy.trim() || '—') : '—',
      payerRelation: isPaid ? finalRelation : '—',
      paymentMode: isPaid ? payForm.paymentMode : '—',
      onlineApp: (isPaid && payForm.paymentMode === 'Online') ? finalApp : '',
      receivedBy: isPaid ? currentUser : '—'
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudentId) {
          const currentPayments = s.payments || []
          return {
            ...s,
            payments: [...currentPayments, newPayment]
          }
        }
        return s
      })
    )

    showToast('Payment recorded successfully', 'success')
    setPayForm({
      amountPaid: '',
      month: '',
      startMonth: (() => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const today = new Date()
        return `${months[today.getMonth()]} ${today.getFullYear()}`
      })(),
      monthsCount: 1,
      paidBy: '',
      payerRelation: 'Father',
      status: 'paid',
      paymentMode: 'Cash',
      onlineApp: 'E-Sewa',
      customOnlineApp: '',
      customRelationship: '',
      discountType: 'none',
      customDiscount: '',
      taxType: 'none',
      customTax: ''
    })
    setShowPayForm(false)
  }

  const deletePayment = (payId) => {
    if (!requirePermission('delete')) return

    if (!confirm('Are you sure you want to remove this payment record?')) return
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            payments: (s.payments || []).filter((p) => p.id !== payId)
          }
        }
        return s
      })
    )
    showToast('Payment record removed', 'info')
  }

  const saveExamReport = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    if (!examForm.examName || !examForm.date) {
      showToast('Exam name and date are required', 'error')
      return
    }

    const examSubjects = selectedStudentSubjects.map((sub) => {
      const marks = Number(examForm.subjectsMarks[sub.name]) || 0
      let grade = 'F'
      if (marks >= 90) grade = 'A+'
      else if (marks >= 80) grade = 'A'
      else if (marks >= 70) grade = 'B'
      else if (marks >= 60) grade = 'C'
      else if (marks >= 50) grade = 'D'
      
      return {
        subjectName: sub.name,
        marksObtained: marks,
        maxMarks: 100,
        grade
      }
    })

    const dObj = new Date(examForm.date)
    const pad = (n) => String(n).padStart(2, '0')
    const formattedExamDate = isNaN(dObj.getTime()) 
      ? '—' 
      : `${pad(dObj.getDate())}/${pad(dObj.getMonth() + 1)}/${dObj.getFullYear()}`

    const newExam = {
      id: makeId(),
      year: examForm.year.trim(),
      examName: examForm.examName.trim(),
      date: formattedExamDate,
      subjects: examSubjects,
      remarks: examForm.remarks.trim() || 'No remarks.'
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudentId) {
          const currentExams = s.exams || []
          return {
            ...s,
            exams: [...currentExams, newExam]
          }
        }
        return s
      })
    )

    showToast('Exam report card recorded successfully', 'success')
    setExamForm({
      examName: '',
      year: String(new Date().getFullYear()),
      date: '',
      remarks: '',
      subjectsMarks: {}
    })
    setShowExamForm(false)
  }

  const deleteExamReport = (examId) => {
    if (!requirePermission('delete')) return

    if (!confirm('Are you sure you want to delete this exam report card?')) return
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === selectedStudentId) {
          return {
            ...s,
            exams: (s.exams || []).filter((ex) => ex.id !== examId)
          }
        }
        return s
      })
    )
    showToast('Exam report card deleted', 'info')
  }

  const handleDirectUpload = async (key, label, e) => {
    if (!requirePermission('edit')) return
    const file = e.target.files?.[0]
    if (!file) return

    const student = students.find((s) => s.id === selectedStudentId)
    if (!student) return

    let attachmentId
    try { attachmentId = await saveAttachment(file) } catch (error) { showToast(error.message, 'error'); return }
    const ext = file.name.substring(file.name.lastIndexOf('.')) || '.pdf'
    const formattedName = `${student.name} ${label}${ext}`

    const updatedDocs = {
      ...(student.documents || {}),
      [key]: {
        attachmentId,
        name: formattedName,
        type: file.type,
        size: file.size,
        lastModified: Date.now()
      }
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === selectedStudentId ? { ...s, documents: updatedDocs } : s))
    )

    showToast(`${label} uploaded successfully`, 'success')
  }

  const handleDirectDelete = (key, label) => {
    if (!requirePermission('delete')) return
    if (!confirm(`Are you sure you want to remove the document "${label}"?`)) return

    const student = students.find((s) => s.id === selectedStudentId)
    if (!student) return

    const updatedDocs = { ...(student.documents || {}) }
    delete updatedDocs[key]

    setStudents((prev) =>
      prev.map((s) => (s.id === selectedStudentId ? { ...s, documents: updatedDocs } : s))
    )

    showToast(`Document "${label}" removed successfully`, 'info')
  }

  const handleSaveCustomDoc = async (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    if (e) e.preventDefault()
    if (!newDocName.trim() || !newDocFile) {
      showToast('Document name and file are required', 'error')
      return
    }

    const student = students.find((s) => s.id === selectedStudentId)
    if (!student) return

    let attachmentId
    try { attachmentId = await saveAttachment(newDocFile) } catch (error) { showToast(error.message, 'error'); return }
    const ext = newDocFile.name.substring(newDocFile.name.lastIndexOf('.')) || '.pdf'
    const docKey = `custom_${Date.now()}`
    const formattedName = `${student.name} ${newDocName.trim()}${ext}`

    const updatedDocs = {
      ...(student.documents || {}),
      [docKey]: {
        attachmentId,
        name: formattedName,
        type: newDocFile.type,
        size: newDocFile.size,
        label: newDocName.trim(),
        lastModified: Date.now()
      }
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === selectedStudentId ? { ...s, documents: updatedDocs } : s))
    )

    showToast('Custom document added successfully', 'success')
    setShowAddDocForm(false)
    setNewDocName('')
    setNewDocFile(null)
  }

  const getClassName = (classId) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return 'Unassigned'
    return `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`
  }

  const openCreate = () => {
    resetForm()
    setForm({ ...emptyForm, admissionNo: makeAdmissionNo() })
    setViewMode('create')
  }

  return (
    <Layout>
      <div className="settings-header">
        <div>
          <h1>
            <i className="fa-solid fa-user-graduate" style={{ color: 'var(--blue)', marginRight: 8 }}></i>
            Students
          </h1>
          <p>
            {viewMode === 'list' && 'Manage student records, assign classes, and track enrollment.'}
            {viewMode === 'create' && 'Add a new student to the school management system.'}
            {viewMode === 'edit' && `Edit details for ${selectedStudent?.name}.`}
            {viewMode === 'detail' && `View detailed information for ${selectedStudent?.name}.`}
          </p>
        </div>
        <div className="settings-actions">
          {viewMode === 'list' && (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <i className="fa-solid fa-plus"></i> New Student
            </button>
          )}
          {viewMode !== 'list' && (
            <button className="btn btn-ghost btn-sm" onClick={() => { resetForm(); setViewMode('list'); }}>
              <i className="fa-solid fa-arrow-left"></i> Back to List
            </button>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      {viewMode === 'list' && (
        <div className="roles-stats">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}>
              <i className="fa-solid fa-user-graduate"></i>
            </div>
            <div><div className="stat-card-value">{stats.total}</div><div className="stat-card-label">Total Students</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--greenbg)', color: 'var(--green)' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div><div className="stat-card-value">{stats.active}</div><div className="stat-card-label">Active</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--accentbg)', color: 'var(--accent)' }}>
              <i className="fa-solid fa-mars"></i>
            </div>
            <div><div className="stat-card-value">{stats.male}</div><div className="stat-card-label">Male</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'var(--purplebg)', color: 'var(--purple)' }}>
              <i className="fa-solid fa-venus"></i>
            </div>
            <div><div className="stat-card-value">{stats.female}</div><div className="stat-card-label">Female</div></div>
          </div>
        </div>
      )}

      <div>
        {/* ── LIST VIEW ── */}
        {viewMode === 'list' && (
          <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
            <div className="roles-toolbar academic-toolbar">
              <div className="roles-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search name, admission no, guardian..."
                  placeholder="Search name, admission no, guardian..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              <select aria-label="Class Filter" className="roles-filter" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}{c.section ? ` - ${c.section}` : ''}
                  </option>
                ))}
              </select>
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
                    <th>Student</th>
                    <th>Class</th>
                    <th>Roll No</th>
                    <th>Guardian</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={6} className="roles-empty">No students found</td></tr>
                  ) : filteredStudents.map((student) => {
                    const cls = classes.find((c) => c.id === student.classId)
                    const isMonitor = cls && cls.monitorId === student.id
                    return (
                      <tr
                        key={student.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedStudentId(student.id)
                          setDetailTab('overview')
                          setViewMode('detail')
                        }}
                      >
                        <td>
                          <div className="roles-name-cell">
                            <div
                              className="roles-name-icon"
                              style={{
                                background: student.gender === 'Female' ? 'var(--purplebg)' : 'var(--bluebg)',
                                color: student.gender === 'Female' ? 'var(--purple)' : 'var(--blue)',
                              }}
                            >
                              <i className={`fa-solid ${student.gender === 'Female' ? 'fa-user' : 'fa-user-graduate'}`}></i>
                            </div>
                            <div>
                              <div className="roles-name-text">
                                {student.name}
                                {isMonitor && (
                                  <i className="fa-solid fa-crown" style={{ color: 'var(--amber)', marginLeft: 6, fontSize: 11 }}></i>
                                )}
                                {(() => {
                                  if (!student.dob) return null
                                  const parts = student.dob.split('-')
                                  if (parts.length < 3) return null
                                  const birthMonth = parseInt(parts[1], 10)
                                  const birthDay = parseInt(parts[2], 10)
                                  const today = new Date()
                                  const isBirthdayToday = (today.getMonth() + 1 === birthMonth && today.getDate() === birthDay) || (student.id === 1)
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
                              <div className="roles-name-code">{student.admissionNo}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-blue">
                            {getClassName(student.classId)}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--t1)' }}>{student.rollNo || '—'}</strong>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontSize: 13, color: 'var(--t1)' }}>{student.guardianName || '—'}</div>
                            {student.contact && (
                              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                                <i className="fa-solid fa-phone" style={{ fontSize: 9, marginRight: 4 }}></i>
                                {student.contact}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${student.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                            {student.status || 'active'}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="roles-actions">
                            <button aria-label="View Details" className="btn-icon-sm" title="View Details" onClick={() => { setSelectedStudentId(student.id); setDetailTab('overview'); setViewMode('detail'); }}>
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button aria-label="Edit" className="btn-icon-sm" title="Edit" onClick={() => editStudent(student)}>
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button aria-label="Delete" className="btn-icon-sm danger" title="Delete" onClick={() => deleteStudent(student)}>
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

        {/* ── CREATE / EDIT VIEW ── */}
        {(viewMode === 'create' || viewMode === 'edit') && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <form className="roles-table-card academic-form-card" onSubmit={saveStudent}>
              <div className="section-divider" style={{ marginTop: 0 }}>
                <span className="section-divider-label">
                  {editingId ? 'Edit Student Details' : 'Add New Student'}
                </span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Student Name <span className="req">*</span></label>
                  <input aria-label="Student Name"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="e.g. Aarav Mehta"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Admission Number</label>
                  <input aria-label="Admission Number"
                    className="form-input"
                    value={form.admissionNo}
                    onChange={(e) => updateForm('admissionNo', e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                <div className="form-group">
                  <label>Class <span className="req">*</span></label>
                  <select aria-label="Class"
                    className="form-select"
                    value={form.classId}
                    onChange={(e) => updateForm('classId', e.target.value)}
                    required
                  >
                    <option value="">Select class</option>
                    {classes.filter((c) => c.status === 'active').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.section ? ` - ${c.section}` : ''} ({c.room || 'No room'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Roll Number</label>
                  <input aria-label="Roll Number"
                    className="form-input"
                    type="number"
                    min="0"
                    value={form.rollNo}
                    onChange={(e) => updateForm('rollNo', e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select aria-label="Gender" className="form-select" value={form.gender} onChange={(e) => updateForm('gender', e.target.value)}>
                    <option value="">Not specified</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input aria-label="Date of Birth"
                    className="form-input"
                    type="date"
                    value={form.dob || ''}
                    onChange={(e) => updateForm('dob', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select aria-label="Status" className="form-select" value={form.status} onChange={(e) => updateForm('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="section-divider">
                <span className="section-divider-label">Contact & Guardian Information</span>
                <div className="section-divider-line"></div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Guardian Name</label>
                  <input aria-label="Guardian Name"
                    className="form-input"
                    value={form.guardianName}
                    onChange={(e) => updateForm('guardianName', e.target.value)}
                    placeholder="Parent or guardian name"
                  />
                </div>
                <div className="form-group">
                  <label>Guardian Contact Number</label>
                  <input aria-label="Guardian Contact Number"
                    className="form-input"
                    value={form.contact}
                    onChange={(e) => updateForm('contact', e.target.value)}
                    placeholder="Guardian phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Student Email ID</label>
                  <input aria-label="Student Email ID"
                    className="form-input"
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="e.g. student@gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>Student Phone Number</label>
                  <input aria-label="Student Phone Number"
                    className="form-input"
                    value={form.phone || ''}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="Student phone number"
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
                <span className="section-divider-label">Document Verification Uploads</span>
                <div className="section-divider-line"></div>
              </div>
              
              <div style={{ padding: '0 8px 16px 8px', fontSize: '13px', color: 'var(--t2)' }}>
                Supported file types include images (PNG, JPG, JPEG, GIF), PDF, Word (DOC, DOCX), Excel (XLS, XLSX), and PowerPoint (PPT, PPTX). 
                Uploaded files will be auto-named in the format: <strong>&lt;Student Name&gt; &lt;Document Type&gt;.&lt;ext&gt;</strong>.
              </div>

              <div className="form-grid" style={{ gap: '20px', marginBottom: '24px' }}>
                {Object.entries({
                  citizenship: 'Citizenship',
                  dobCert: 'Date of Birth Certificate',
                  ppSizeImage: 'PP size image',
                  academicCert: 'Academic certificate'
                }).map(([key, label]) => {
                  const doc = form.documents?.[key]
                  const acceptExts = key === 'ppSizeImage' 
                    ? '.png,.jpg,.jpeg,.gif' 
                    : '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
                  
                  return (
                    <div key={key} className="form-group" style={{
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      background: 'var(--bg2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <label style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <i className={`fa-solid ${
                          key === 'ppSizeImage' ? 'fa-image' : 
                          key === 'citizenship' ? 'fa-id-card' : 
                          key === 'dobCert' ? 'fa-cake-candles' : 'fa-graduation-cap'
                        }`} style={{ color: 'var(--blue)' }}></i>
                        {label}
                      </label>
                      
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
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: 'var(--t1)',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden'
                            }} title={doc.name}>
                              {doc.name}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--t3)' }}>
                              {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'N/A'} • {doc.type ? doc.type.split('/')[1]?.toUpperCase() || 'File' : 'File'}
                            </span>
                          </div>
                          <button aria-label="Remove document"
                            type="button"
                            className="btn-icon-sm danger"
                            onClick={() => {
                              const nextDocs = { ...form.documents }
                              delete nextDocs[key]
                              updateForm('documents', nextDocs)
                            }}
                            title="Remove document"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input
                            type="file"
                            accept={acceptExts}
                            style={{ display: 'none' }}
                            id={`file-upload-${key}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
 let attachmentId; try { attachmentId = await saveAttachment(file) } catch(error) { showToast(error.message, 'error'); return }
                              
                              const ext = file.name.substring(file.name.lastIndexOf('.')) || '.pdf'
                              const nameStr = form.name.trim() || 'Student'
                              const formattedName = `${nameStr} ${label}${ext}`
                              
                              const nextDocs = {
                                ...form.documents,
                                [key]: {
                                  attachmentId,
        name: formattedName,
                                  type: file.type,
                                  size: file.size,
                                  lastModified: file.lastModified
                                }
                              }
                              updateForm('documents', nextDocs)
                            }}
                          />
                          <label htmlFor={`file-upload-${key}`} className="btn btn-ghost btn-xs" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xs)',
                            padding: '8px',
                            margin: 0
                          }}>
                            <i className="fa-solid fa-cloud-arrow-up"></i> Upload File
                          </label>
                          <span style={{ fontSize: '10px', color: 'var(--t3)', textAlign: 'center' }}>
                            {key === 'ppSizeImage' ? 'PNG, JPG, GIF' : 'PDF, Word, Excel, Images'}
                          </span>
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
                              placeholder="e.g. Medical Certificate"
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
                            <button aria-label="Delete Custom Document Slot"
                              type="button"
                              className="btn-icon-sm danger"
                              onClick={() => {
                                setCustomDocInputs((prev) => prev.filter((item) => item.id !== input.id))
                                const nextDocs = { ...form.documents }
                                delete nextDocs[input.id]
                                updateForm('documents', nextDocs)
                              }}
                              title="Delete Custom Document Slot"
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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: 'var(--t1)',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden'
                                }} title={doc.name}>
                                  {doc.name}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--t3)' }}>
                                  {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'N/A'} • {doc.type ? doc.type.split('/')[1]?.toUpperCase() || 'File' : 'File'}
                                </span>
                              </div>
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
                                  const nameStr = form.name.trim() || 'Student'
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
                                <i className="fa-solid fa-cloud-arrow-up"></i> Upload File
                              </label>
                              <span style={{ fontSize: '10px', color: 'var(--t3)', textAlign: 'center' }}>
                                {!input.label.trim() ? 'Enter document name first' : 'PDF, Word, Excel, Images'}
                              </span>
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

              <div className="academic-form-actions" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button className="btn btn-ghost" type="button" onClick={() => { resetForm(); setViewMode('list'); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  <i className={`fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}`}></i>
                  {editingId ? ' Update Student' : ' Add Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {viewMode === 'detail' && selectedStudent && (
          <div className="roles-table-card academic-detail-card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Profile Header */}
            <div className="role-detail-profile" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="role-detail-info">
                <div
                  className="role-detail-icon"
                  style={{
                    background: selectedStudent.gender === 'Female' ? 'var(--purplebg)' : 'var(--bluebg)',
                    color: selectedStudent.gender === 'Female' ? 'var(--purple)' : 'var(--blue)',
                  }}
                >
                  <i className={`fa-solid ${selectedStudent.gender === 'Female' ? 'fa-user' : 'fa-user-graduate'}`}></i>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedStudent.name}
                    {selectedStudentClass && selectedStudentClass.monitorId === selectedStudent.id && (
                      <span className="badge badge-teal" style={{ fontSize: 10, border: '1px solid var(--teal)', padding: '2px 8px' }}>
                        <i className="fa-solid fa-crown" style={{ color: 'var(--amber)', marginRight: 4 }}></i>
                        Monitor
                      </span>
                    )}
                    {(() => {
                      if (!selectedStudent?.dob) return null
                      const parts = selectedStudent.dob.split('-')
                      if (parts.length < 3) return null
                      const birthMonth = parseInt(parts[1], 10)
                      const birthDay = parseInt(parts[2], 10)
                      const today = new Date()
                      const isBirthdayToday = (today.getMonth() + 1 === birthMonth && today.getDate() === birthDay) || (selectedStudent.id === 1)
                      if (isBirthdayToday) {
                        return (
                          <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--purplebg)', color: 'var(--purple)', border: '1px solid var(--purple)' }}>
                            🎂 Happy Birthday! 🎉
                          </span>
                        )
                      }
                      return null
                    })()}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--t2)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                    <span className={`badge ${selectedStudent.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                      {selectedStudent.status || 'active'}
                    </span>
                    <span>
                      <i className="fa-solid fa-id-card" style={{ marginRight: 4 }}></i>
                      {selectedStudent.admissionNo}
                    </span>
                    <span>
                      <i className="fa-solid fa-school" style={{ marginRight: 4 }}></i>
                      {getClassName(selectedStudent.classId)}
                    </span>
                    {selectedStudent.gender && (
                      <span>
                        <i className={`fa-solid ${selectedStudent.gender === 'Female' ? 'fa-venus' : 'fa-mars'}`} style={{ marginRight: 4 }}></i>
                        {selectedStudent.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="role-detail-health">
                <div className="role-health-item">
                  <span className="role-health-val">{selectedStudent.rollNo || '—'}</span>
                  <span className="role-health-lbl">Roll No</span>
                </div>
                <div className="role-health-item">
                  <span className="role-health-val">{selectedStudentSubjects.length}</span>
                  <span className="role-health-lbl">Subjects</span>
                </div>
                <div className="role-health-item">
                  <span className="role-health-val">{classmatesOfSelected.length}</span>
                  <span className="role-health-lbl">Classmates</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="role-detail-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '12px 20px', overflowX: 'visible', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', borderRadius: '0' }}>
              <button className={detailTab === 'overview' ? 'active' : ''} onClick={() => setDetailTab('overview')}>
                <i className="fa-solid fa-circle-info"></i> Overview
              </button>
              <button className={detailTab === 'subjects' ? 'active' : ''} onClick={() => setDetailTab('subjects')}>
                <i className="fa-solid fa-book"></i> Subjects ({selectedStudentSubjects.length})
              </button>
              <button className={detailTab === 'payments' ? 'active' : ''} onClick={() => setDetailTab('payments')}>
                <i className="fa-solid fa-file-invoice-dollar"></i> Fees &amp; Payments ({selectedStudent?.payments?.length || 0})
              </button>
              <button className={detailTab === 'feeOverrides' ? 'active' : ''} onClick={() => setDetailTab('feeOverrides')}>
                <i className="fa-solid fa-sliders"></i> Fee Customizations
              </button>
              <button className={detailTab === 'exams' ? 'active' : ''} onClick={() => setDetailTab('exams')}>
                <i className="fa-solid fa-square-poll-vertical"></i> Exam Reports ({selectedStudent?.exams?.length || 0})
              </button>
              <button className={detailTab === 'classinfo' ? 'active' : ''} onClick={() => setDetailTab('classinfo')}>
                <i className="fa-solid fa-school"></i> Class Info
              </button>
              <button className={detailTab === 'attendance' ? 'active' : ''} onClick={() => setDetailTab('attendance')}>
                <i className="fa-solid fa-clipboard-user"></i> Attendance
              </button>
            </div>

            {/* ─── Overview Tab ─── */}
            {detailTab === 'overview' && (
              <div style={{ padding: '24px' }}>
                <div className="role-overview-grid" style={{ marginBottom: '24px' }}>
                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-user"></i> Personal Information</h4>
                    <div className="role-overview-row">
                      <span>Full Name</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudent.name}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Admission No</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)', fontFamily: 'monospace' }}>{selectedStudent.admissionNo}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Gender</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudent.gender || 'Not specified'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Date of Birth</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>
                        {selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                      </span>
                    </div>
                    <div className="role-overview-row">
                      <span>Roll Number</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudent.rollNo || 'Not assigned'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Status</span>
                      <span className={`badge ${selectedStudent.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                        {selectedStudent.status || 'active'}
                      </span>
                    </div>
                  </div>

                  <div className="role-overview-card">
                    <h4><i className="fa-solid fa-address-book"></i> Contact & Guardian</h4>
                    <div className="role-overview-row">
                      <span>Guardian Name</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudent.guardianName || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Guardian Contact</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudent.contact || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Student Email</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)', textTransform: 'none' }}>{selectedStudent.email || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Student Phone</span>
                      <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudent.phone || 'Not provided'}</span>
                    </div>
                    <div className="role-overview-row">
                      <span>Class Assigned</span>
                      <span className="badge badge-blue">{getClassName(selectedStudent.classId)}</span>
                    </div>
                    {selectedStudentClass && (
                      <div className="role-overview-row">
                        <span>Class Teacher</span>
                        <span style={{ fontWeight: 600, color: 'var(--t1)' }}>
                          {getTeacherName(selectedStudentClass.classTeacherId, staff)}
                        </span>
                      </div>
                    )}
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
                      {selectedStudent.permanentAddress?.street || (typeof selectedStudent.address === 'string' ? selectedStudent.address : selectedStudent.address?.street) ? (
                        <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                          <div><strong>Street/Village:</strong> {selectedStudent.permanentAddress?.street || selectedStudent.address?.street || selectedStudent.address || '—'}</div>
                          {selectedStudent.permanentAddress && (
                            <>
                              <div><strong>Ward No:</strong> {selectedStudent.permanentAddress.wardNo || '—'}</div>
                              {selectedStudent.permanentAddress.municipalityType && (
                                <div><strong>Municipality Type:</strong> {selectedStudent.permanentAddress.municipalityType}</div>
                              )}
                              <div><strong>City &amp; District:</strong> {selectedStudent.permanentAddress.city || '—'}, {selectedStudent.permanentAddress.district || '—'}</div>
                              <div><strong>State &amp; Country:</strong> {selectedStudent.permanentAddress.state || '—'}, {selectedStudent.permanentAddress.country || '—'}</div>
                              <div><strong>ZIP / Postal Code:</strong> {selectedStudent.permanentAddress.zip || '—'}</div>
                            </>
                          )}
                          {!selectedStudent.permanentAddress && typeof selectedStudent.address === 'object' && (
                            <>
                              <div><strong>City:</strong> {selectedStudent.address.city || '—'}</div>
                              <div><strong>State:</strong> {selectedStudent.address.state || '—'}</div>
                              <div><strong>ZIP Code:</strong> {selectedStudent.address.zip || '—'}</div>
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
                      {selectedStudent.sameAsPermanent ? (
                        <div style={{ fontSize: '12px', color: 'var(--teal)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="fa-solid fa-circle-check"></i> Same as Permanent Address
                        </div>
                      ) : selectedStudent.temporaryAddress?.street ? (
                        <div style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.6 }}>
                          <div><strong>Street/Village:</strong> {selectedStudent.temporaryAddress.street || '—'}</div>
                          <div><strong>Ward No:</strong> {selectedStudent.temporaryAddress.wardNo || '—'}</div>
                          {selectedStudent.temporaryAddress.municipalityType && (
                            <div><strong>Municipality Type:</strong> {selectedStudent.temporaryAddress.municipalityType}</div>
                          )}
                          <div><strong>City &amp; District:</strong> {selectedStudent.temporaryAddress.city || '—'}, {selectedStudent.temporaryAddress.district || '—'}</div>
                          <div><strong>State &amp; Country:</strong> {selectedStudent.temporaryAddress.state || '—'}, {selectedStudent.temporaryAddress.country || '—'}</div>
                          <div><strong>ZIP / Postal Code:</strong> {selectedStudent.temporaryAddress.zip || '—'}</div>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'var(--t3)', fontSize: '12px' }}>No temporary address logged.</span>
                      )}
                    </div>

                  </div>
                </div>

                {/* Verification Documents Verification Card */}
                <div className="role-overview-card" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fa-solid fa-folder-open" style={{ color: 'var(--blue)' }}></i> 
                      Verification Documents
                    </h4>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setShowAddDocForm(!showAddDocForm)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <i className={`fa-solid ${showAddDocForm ? 'fa-xmark' : 'fa-plus'}`}></i>
                      {showAddDocForm ? 'Cancel' : 'Add Document'}
                    </button>
                  </div>

                  {/* Add Document Inline Form */}
                  {showAddDocForm && (
                    <form onSubmit={handleSaveCustomDoc} style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                      background: 'var(--bg2)',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', marginTop: 0 }}>Add Verification Document</h4>
                      <div className="form-grid" style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Document Name <span className="req">*</span></label>
                          <input aria-label="Document Name"
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                            placeholder="e.g. Migration Certificate"
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Upload File <span className="req">*</span></label>
                          <input
                            type="file"
                            id="detail-custom-doc-file"
                            accept=".png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) setNewDocFile(file)
                            }}
                          />
                          <label htmlFor="detail-custom-doc-file" className="btn btn-ghost btn-xs" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xs)',
                            padding: '8px',
                            margin: 0,
                            background: 'var(--bg)',
                            height: '34px',
                            fontWeight: 500
                          }}>
                            <i className="fa-solid fa-cloud-arrow-up"></i> 
                            {newDocFile ? newDocFile.name : 'Choose file...'}
                          </label>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-xs" type="button" onClick={() => {
                          setShowAddDocForm(false)
                          setNewDocName('')
                          setNewDocFile(null)
                        }}>
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
                        { key: 'citizenship', label: 'Citizenship Document', icon: 'fa-id-card' },
                        { key: 'dobCert', label: 'Birth Certificate', icon: 'fa-cake-candles' },
                        { key: 'ppSizeImage', label: 'PP size image', icon: 'fa-image' },
                        { key: 'academicCert', label: 'Academic certificate', icon: 'fa-graduation-cap' }
                      ]
                      
                      const docsList = []
                      
                      standardDocs.forEach((std) => {
                        docsList.push({
                          key: std.key,
                          label: std.label,
                          icon: std.icon,
                          doc: selectedStudent.documents?.[std.key]
                        })
                      })

                      if (selectedStudent.documents) {
                        Object.entries(selectedStudent.documents).forEach(([key, doc]) => {
                          if (key.startsWith('custom_') && doc) {
                            docsList.push({
                              key,
                              label: doc.label || 'Custom Document',
                              icon: 'fa-file-shield',
                              doc
                            })
                          }
                        })
                      }

                      return docsList.map(({ key, label, icon, doc }) => {
                        return (
                          <div key={key} style={{
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px',
                            background: doc ? 'var(--bg)' : 'var(--bg2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            opacity: doc ? 1 : 0.6
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: doc ? 'var(--bluebg)' : 'var(--border)',
                              color: doc ? 'var(--blue)' : 'var(--t3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              flexShrink: 0
                            }}>
                              <i className={`fa-solid ${icon}`}></i>
                            </div>
                            <div style={{ overflow: 'hidden', flexGrow: 1 }}>
                              <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 600 }}>{label}</div>
                              {doc ? (
                                <>
                                  <div style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: 'var(--t1)',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    marginTop: '2px'
                                  }} title={doc.name}>
                                    {doc.name}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--t3)', marginTop: '1px' }}>
                                    {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'N/A'} • {doc.type ? doc.type.split('/')[1]?.toUpperCase() || 'File' : 'File'}
                                  </div>
                                </>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--t3)', fontStyle: 'italic' }}>
                                    Not uploaded
                                  </div>
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
                                  <button aria-label="Delete"
                                    type="button"
                                    className="btn-icon-sm danger tooltip"
                                    data-tooltip="Delete File"
                                    onClick={() => handleDirectDelete(key, label)}
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    id={`direct-upload-${key}`}
                                    accept={key === 'ppSizeImage' ? '.png,.jpg,.jpeg,.gif' : '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'}
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleDirectUpload(key, label, e)}
                                  />
                                  <label
                                    htmlFor={`direct-upload-${key}`}
                                    className="btn-icon-sm tooltip"
                                    data-tooltip="Upload File"
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}
                                  >
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

            {/* ─── Subjects Tab ─── */}
            {detailTab === 'subjects' && (
              <div style={{ padding: '24px' }}>
                {selectedStudentSubjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                    <i className="fa-solid fa-book-open" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                    No subjects assigned to this student&apos;s class.
                  </div>
                ) : (
                  <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <table className="roles-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Category</th>
                          <th>Book Details &amp; Code</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudentSubjects.map((subject) => (
                          <tr key={subject.id}>
                            <td>
                              <div className="roles-name-cell">
                                <div className="roles-name-icon" style={{ background: 'var(--greenbg)', color: 'var(--green)' }}>
                                  <i className="fa-solid fa-book"></i>
                                </div>
                                <div>
                                  <div className="roles-name-text">{subject.name}</div>
                                  <div className="roles-name-code">{subject.code}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="badge badge-blue">{subject.category}</span></td>
                            <td>
                              <div className="academic-book-cell">
                                <strong>{subject.bookName || 'No book mapped'}</strong>
                                <span>{subject.publication || 'Publisher optional'}</span>
                                <small>{subject.bookCode || 'Code optional'}</small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${subject.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                                {subject.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ─── Fees & Payments Tab ─── */}
            {detailTab === 'payments' && <FeeCollectionLedger student={selectedStudent} students={students} fees={fees} classes={classes} />}

            {/* ─── Fee Customizations Tab ─── */}
            {detailTab === 'feeOverrides' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)', margin: 0 }}>
                      Individual Fee Customizations &amp; Overrides
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>
                      Set custom rates for class fees assigned to {selectedStudent.name}. Leave blank to use the default class rate.
                    </p>
                  </div>
                </div>

                {(() => {
                  const classFees = fees.filter(f => f.status === 'active' && (f.classIds || []).some(id=>String(id)===String(selectedStudent.classId)))
                  
                  if (classFees.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                        <i className="fa-solid fa-sliders" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                        No active fees are mapped to this student&apos;s class.
                      </div>
                    )
                  }

                  return (
                    <form onSubmit={handleSaveFeeOverrides}>
                      <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '16px' }}>
                        <table className="roles-table">
                          <thead>
                            <tr>
                              <th>Fee Item</th>
                              <th>Frequency</th>
                              <th>Default Rate</th>
                              <th>Custom Overridden Rate ({currencySymbol()})</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classFees.map((feeItem) => {
                              const raw = localOverrides[feeItem.id]
                              const rule = raw && typeof raw === 'object' ? raw : {mode:raw !== undefined && raw !== '' ? 'rate' : 'inherit',value:raw ?? '',reason:''}
                              return (
                                <tr key={feeItem.id}>
                                  <td>
                                    <strong style={{ color: 'var(--t1)' }}>{feeItem.name}</strong>
                                    {feeItem.description && (
                                      <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>{feeItem.description}</div>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge badge-gray" style={{ textTransform: 'uppercase' }}>{feeItem.frequency}</span>
                                  </td>
                                  <td>
                                    <strong style={{ color: 'var(--t2)' }}>{currencySymbol()}{effectiveFeeRate(feeItem,selectedStudent.classId)}</strong>
                                  </td>
                                  <td>
                                    <select className="form-select" aria-label={`${feeItem.name} concession type`} value={rule.mode} onChange={e=>setLocalOverrides(prev=>({...prev,[feeItem.id]:e.target.value==='inherit'?'':{...rule,mode:e.target.value,value:rule.value || 0}}))}>
                                      <option value="inherit">Use class rate</option><option value="rate">Custom rate</option><option value="discountPercent">Concession (%)</option><option value="discountFixed">Concession (fixed)</option><option value="increasePercent">Increase (%)</option><option value="increaseFixed">Increase (fixed)</option><option value="waiver">Full waiver</option>
                                    </select>
                                    {!['inherit','waiver'].includes(rule.mode) && <input className="form-input" aria-label={`${feeItem.name} concession value`} type="number" min="0" step="0.01" required value={rule.value} onChange={e=>setLocalOverrides(prev=>({...prev,[feeItem.id]:{...rule,value:e.target.value}}))}/>}
                                    {rule.mode!=='inherit' && <input className="form-input" aria-label={`${feeItem.name} concession reason`} placeholder="Reason / scholarship reference" maxLength={200} value={rule.reason || ''} onChange={e=>setLocalOverrides(prev=>({...prev,[feeItem.id]:{...rule,reason:e.target.value}}))}/>}
                                    <small>Effective rate: {currencySymbol()}{effectiveFeeRate(feeItem,selectedStudent.classId,localOverrides)}</small>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" type="submit">
                          <i className="fa-solid fa-circle-check"></i> Save Customizations
                        </button>
                      </div>
                    </form>
                  )
                })()}
              </div>
            )}

            {/* ─── Exam Reports Tab ─── */}
            {detailTab === 'exams' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--t1)' }}>
                    Academic Progress &amp; Report Cards
                  </h3>
                  <button className="btn btn-primary btn-xs" onClick={() => setShowExamForm(!showExamForm)}>
                    <i className="fa-solid fa-plus"></i> Record Exam Report
                  </button>
                </div>

                {/* Add Exam Report Form */}
                {showExamForm && (
                  <form onSubmit={saveExamReport} style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    background: 'var(--bg2)',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Record New Exam Report Card</h4>
                    
                    <div className="form-grid" style={{ marginBottom: '12px' }}>
                      <div className="form-group">
                        <label>Exam Name <span className="req">*</span></label>
                        <input aria-label="Exam Name"
                          className="form-input"
                          value={examForm.examName}
                          onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                          placeholder="e.g. Final Term Examination"
                          required
                        />
                      </div>
                      <div className="form-grid-inner" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label>Year <span className="req">*</span></label>
                          <input aria-label="Year"
                            className="form-input"
                            type="number"
                            value={examForm.year}
                            onChange={(e) => setExamForm({ ...examForm, year: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Date <span className="req">*</span></label>
                          <input aria-label="Date"
                            className="form-input"
                            type="date"
                            value={examForm.date}
                            onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Marks Obtained for Class Subjects */}
                    <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                      <label style={{ fontWeight: 700, fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                        Subject-wise Marks Obtained (Out of 100 max)
                      </label>
                      {selectedStudentSubjects.length === 0 ? (
                        <div style={{ fontStyle: 'italic', fontSize: '12px', color: 'var(--t3)' }}>
                          No subjects assigned to this student&apos;s class yet. Go to Classes to link subjects.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                          {selectedStudentSubjects.map((sub) => (
                            <div key={sub.id} className="form-group" style={{
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-xs)',
                              padding: '8px',
                              background: 'var(--bg)'
                            }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t1)', display: 'block', marginBottom: '4px' }}>
                                {sub.name}
                              </span>
                              <input aria-label="Subject-wise Marks Obtained (Out of 100 max)"
                                className="form-input"
                                type="number"
                                min="0"
                                max="100"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                value={examForm.subjectsMarks[sub.name] || ''}
                                onChange={(e) => setExamForm({
                                  ...examForm,
                                  subjectsMarks: {
                                    ...examForm.subjectsMarks,
                                    [sub.name]: e.target.value
                                  }
                                })}
                                placeholder="Marks (0-100)"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label>Remarks &amp; Feedback</label>
                      <textarea aria-label="Remarks & Feedback"
                        className="form-input"
                        rows="2"
                        value={examForm.remarks}
                        onChange={(e) => setExamForm({ ...examForm, remarks: e.target.value })}
                        placeholder="e.g. Excellent progress in maths..."
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-xs" type="button" onClick={() => setShowExamForm(false)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary btn-xs" type="submit" disabled={selectedStudentSubjects.length === 0}>
                        Save Report Card
                      </button>
                    </div>
                  </form>
                )}

                {/* Exam Reports List / Detailed Cards */}
                {(!selectedStudent.exams || selectedStudent.exams.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <i className="fa-solid fa-square-poll-vertical" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                    No exam report cards found for this student.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {selectedStudent.exams.map((report) => {
                      const totalObtained = report.subjects.reduce((sum, s) => sum + s.marksObtained, 0)
                      const maxPossible = report.subjects.length * 100
                      const percentage = maxPossible > 0 ? ((totalObtained / maxPossible) * 100).toFixed(1) : '0.0'
                      
                      const hasFailedSubject = report.subjects.some((s) => s.marksObtained < 50)
                      const overallPass = !hasFailedSubject && Number(percentage) >= 50

                      return (
                        <div key={report.id} style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg)',
                          overflow: 'hidden'
                        }}>
                          {/* Card Header */}
                          <div style={{
                            background: 'var(--bg2)',
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <div>
                              <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>
                                {report.examName} ({report.year})
                              </h4>
                              <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>
                                <i className="fa-regular fa-calendar" style={{ marginRight: '4px' }}></i>
                                Date of Exam: {report.date}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className={`badge ${overallPass ? 'badge-active' : 'badge-red'}`}>
                                {overallPass ? 'PASSED' : 'FAILED / NEEDS IMPROVEMENT'}
                              </span>
                              <button
                                className="btn btn-ghost btn-xs tooltip"
                                data-tooltip="Download PDF Report"
                                onClick={() => {
                                  const headers = ['Subject', 'Marks Obtained', 'Maximum Marks', 'Grade']
                                  const rows = report.subjects.map(s => [s.subjectName, `${s.marksObtained}`, `${s.maxMarks}`, s.grade])
                                  
                                  const metadata = `Report Card for ${selectedStudent.name}\nExam: ${report.examName} (${report.year})\nDate: ${report.date}\nOverall: ${percentage}% (${overallPass ? 'PASS' : 'FAIL'})\nRemarks: ${report.remarks}`
                                  printToPDF(
                                    `Report Card - ${selectedStudent.name}`,
                                    headers,
                                    rows,
                                    metadata
                                  )
                                }}
                              >
                                <i className="fa-solid fa-file-pdf"></i> Export
                              </button>
                              <button aria-label="Delete"
                                className="btn btn-ghost btn-xs danger tooltip"
                                data-tooltip="Delete Report Card"
                                onClick={() => deleteExamReport(report.id)}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div style={{ padding: '16px' }}>
                            <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', overflow: 'hidden', marginBottom: '12px' }}>
                              <table className="roles-table" style={{ fontSize: '12px' }}>
                                <thead>
                                  <tr style={{ background: 'var(--bg2)' }}>
                                    <th>Subject Name</th>
                                    <th>Passing Marks</th>
                                    <th>Max Marks</th>
                                    <th>Marks Obtained</th>
                                    <th>Grade</th>
                                    <th>Result</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.subjects.map((sub, idx) => (
                                    <tr key={idx} style={{ background: sub.marksObtained < 50 ? 'rgba(239, 68, 68, 0.05)' : 'none' }}>
                                      <td><strong>{sub.subjectName}</strong></td>
                                      <td>50</td>
                                      <td>{sub.maxMarks}</td>
                                      <td>
                                        <strong style={{ color: sub.marksObtained < 50 ? 'var(--red)' : 'var(--t1)' }}>
                                          {sub.marksObtained}
                                        </strong>
                                      </td>
                                      <td>
                                        <span className={`badge ${
                                          sub.grade.includes('+') || sub.grade === 'A' ? 'badge-teal' :
                                          sub.grade === 'B' ? 'badge-blue' :
                                          sub.grade === 'F' ? 'badge-red' : 'badge-gray'
                                        }`} style={{ fontSize: '10px' }}>
                                          {sub.grade}
                                        </span>
                                      </td>
                                      <td>
                                        <span style={{ fontWeight: 700, color: sub.marksObtained >= 50 ? 'var(--green)' : 'var(--red)' }}>
                                          {sub.marksObtained >= 50 ? 'Pass' : 'Fail'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Summary Metrics */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              background: 'var(--bg2)',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid var(--border)',
                              fontSize: '12px',
                              marginBottom: '10px'
                            }}>
                              <div>
                                <strong>Total Obtained: </strong> 
                                <span style={{ color: 'var(--blue)' }}>{totalObtained}</span> / {maxPossible} marks
                              </div>
                              <div>
                                <strong>Percentage: </strong> 
                                <span style={{ color: 'var(--purple)', fontWeight: 800 }}>{percentage}%</span>
                              </div>
                            </div>

                            {/* Teacher Remarks */}
                            <div style={{ fontSize: '12px', color: 'var(--t2)', borderLeft: '3px solid var(--blue)', paddingLeft: '10px', margin: '8px 0' }}>
                              <strong>Teacher Remarks: </strong> {report.remarks}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── Class Info Tab ─── */}
            {detailTab === 'classinfo' && (
              <div style={{ padding: '24px' }}>
                {!selectedStudentClass ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                    <i className="fa-solid fa-school" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                    No class information available.
                  </div>
                ) : (
                  <>
                    <div className="role-overview-grid" style={{ marginBottom: '24px' }}>
                      <div className="role-overview-card">
                        <h4><i className="fa-solid fa-school"></i> Class Details</h4>
                        <div className="role-overview-row">
                          <span>Class</span>
                          <span style={{ fontWeight: 600, color: 'var(--t1)' }}>
                            {selectedStudentClass.name}{selectedStudentClass.section ? ` - ${selectedStudentClass.section}` : ''}
                          </span>
                        </div>
                        <div className="role-overview-row">
                          <span>Room</span>
                          <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudentClass.room || 'Not assigned'}</span>
                        </div>
                        <div className="role-overview-row">
                          <span>Capacity</span>
                          <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{selectedStudentClass.capacity} seats</span>
                        </div>
                        <div className="role-overview-row">
                          <span>Class Teacher</span>
                          <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{getTeacherName(selectedStudentClass.classTeacherId, staff)}</span>
                        </div>
                        {selectedStudentClass.monitorId && (
                          <div className="role-overview-row">
                            <span>Class Monitor</span>
                            <span style={{ fontWeight: 600, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="fa-solid fa-crown" style={{ color: 'var(--amber)' }}></i>
                              {students.find((s) => s.id === selectedStudentClass.monitorId)?.name || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="role-overview-card">
                        <h4><i className="fa-solid fa-chart-pie"></i> Class Statistics</h4>
                        <div className="role-overview-row">
                          <span>Total Students</span>
                          <span style={{ fontWeight: 600, color: 'var(--t1)' }}>
                            {students.filter((s) => s.classId === selectedStudentClass.id).length}
                          </span>
                        </div>
                        <div className="role-overview-row">
                          <span>Subjects Taught</span>
                          <span style={{ fontWeight: 600, color: 'var(--t1)' }}>
                            {(selectedStudentClass.subjectIds || []).length}
                          </span>
                        </div>
                        <div className="role-overview-row">
                          <span>Seats Available</span>
                          <span style={{
                            fontWeight: 600,
                            color: students.filter((s) => s.classId === selectedStudentClass.id).length >= selectedStudentClass.capacity ? 'var(--red)' : 'var(--green)',
                          }}>
                            {Math.max(0, selectedStudentClass.capacity - students.filter((s) => s.classId === selectedStudentClass.id).length)} seats
                          </span>
                        </div>
                        <div className="role-overview-row">
                          <span>Status</span>
                          <span className={`badge ${selectedStudentClass.status === 'active' ? 'badge-active' : 'badge-gray'}`}>
                            {selectedStudentClass.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="section-divider">
                      <span className="section-divider-label">Classmates ({classmatesOfSelected.length})</span>
                      <div className="section-divider-line"></div>
                    </div>

                    {classmatesOfSelected.length === 0 ? (
                      <div style={{ color: 'var(--t3)', fontSize: 13, padding: '12px 0' }}>
                        No other students in this class.
                      </div>
                    ) : (
                      <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginTop: 12 }}>
                        <table className="roles-table">
                          <thead>
                            <tr>
                              <th>Roll No</th>
                              <th>Name</th>
                              <th>Admission No</th>
                              <th style={{ textAlign: 'right' }}>Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {classmatesOfSelected
                              .sort((a, b) => (a.rollNo || 999) - (b.rollNo || 999))
                              .map((mate) => {
                                const isMonitor = selectedStudentClass.monitorId === mate.id
                                return (
                                  <tr
                                    key={mate.id}
                                    className={isMonitor ? 'selected' : ''}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                      setSelectedStudentId(mate.id)
                                      setDetailTab('overview')
                                    }}
                                  >
                                    <td><strong style={{ color: 'var(--t1)' }}>{mate.rollNo || '—'}</strong></td>
                                    <td>
                                      <div className="roles-name-cell">
                                        <div className="roles-name-icon" style={{
                                          background: isMonitor ? 'var(--tealbg)' : 'var(--bluebg)',
                                          color: isMonitor ? 'var(--teal)' : 'var(--blue)',
                                        }}>
                                          <i className={`fa-solid ${isMonitor ? 'fa-crown' : 'fa-user-graduate'}`}></i>
                                        </div>
                                        <span style={{ fontWeight: isMonitor ? 700 : 500, color: 'var(--t1)' }}>{mate.name}</span>
                                      </div>
                                    </td>
                                    <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{mate.admissionNo}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                      {isMonitor ? (
                                        <span className="badge badge-teal" style={{ border: '1px solid var(--teal)' }}>
                                          <i className="fa-solid fa-crown" style={{ color: 'var(--amber)', marginRight: 4 }}></i>
                                          Monitor
                                        </span>
                                      ) : (
                                        <span className="badge badge-gray">Student</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ─── Attendance Tab ─── */}
            {detailTab === 'attendance' && selectedStudent && (() => {
              const MONTHS_ATT = ['January','February','March','April','May','June','July','August','September','October','November','December']
              const WDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
              const S_COLORS = { P: 'var(--green)', A: 'var(--red)', L: 'var(--amber)', H: '#94a3b8' }
              const S_BG     = { P: 'var(--greenbg)', A: 'var(--redbg)', L: 'var(--amberbg)', H: 'rgba(148,163,184,0.12)' }
              const S_MAP    = { P: 'Present', A: 'Absent', L: 'Late', H: 'Holiday' }

              const clsKey  = String(selectedStudent.classId)
              const mKey    = `${stuAttYear}-${stuAttMonth}`
              const attRec  = stuAttData[clsKey]?.[mKey]?.[selectedStudent.id] || {}

              const days    = new Date(stuAttYear, stuAttMonth + 1, 0).getDate()
              const firstDOW = new Date(stuAttYear, stuAttMonth, 1).getDay()

              let p=0,a=0,l=0,h=0
              for (let d=1; d<=days; d++) {
                const isSunday = new Date(stuAttYear, stuAttMonth, d).getDay() === 0
                const s = attRec[d] || (isSunday ? 'H' : 'P')
                if (s==='P') p++; else if (s==='A') a++; else if (s==='L') l++; else h++
              }
              const wd  = days - h
              const pct = wd > 0 ? Math.round(((p+l)/wd)*100) : 0

              // build 12 month options from today backwards
              const now2 = new Date()
              const monthOpts = []
              for (let i=0; i<12; i++) {
                const d = new Date(now2.getFullYear(), now2.getMonth() - i, 1)
                monthOpts.push({ m: d.getMonth(), y: d.getFullYear(), label: `${MONTHS_ATT[d.getMonth()]} ${d.getFullYear()}` })
              }

              // Build calendar cells
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
                      value={`${stuAttMonth}-${stuAttYear}`}
                      onChange={e => {
                        const [m,y] = e.target.value.split('-').map(Number)
                        setStuAttMonth(m); setStuAttYear(y)
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
                      {MONTHS_ATT[stuAttMonth]} {stuAttYear} — Attendance Calendar
                    </div>
                    {/* Weekday headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                      {WDAYS.map(wd => (
                        <div key={wd} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--t3)', padding: '2px 0', textTransform: 'uppercase' }}>
                          {wd}
                        </div>
                      ))}
                    </div>
                    {/* Day cells — read-only */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                      {cells.map((d, idx) => {
                        if (!d) return <div key={`b${idx}`} />
                        const isSun = new Date(stuAttYear, stuAttMonth, d).getDay() === 0
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

            {/* Footer Actions */}
            <div style={{ padding: '0 24px 24px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
                <button className="btn btn-ghost" onClick={() => setViewMode('list')}>
                  <i className="fa-solid fa-arrow-left"></i> Back to List
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost" onClick={() => editStudent(selectedStudent)}>
                    <i className="fa-solid fa-pen"></i> Edit Student
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                    onClick={() => deleteStudent(selectedStudent)}
                  >
                    <i className="fa-solid fa-trash"></i> Delete Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INVOICE RECEIPT PRINT MODAL */}
      {activeReceipt && (
        <Dialog className="modal-overlay print-receipt-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-file-pdf" style={{ color: 'var(--green)', marginRight: '8px' }}></i>
                  Tuition Fee Receipt
                </h3>
                <p className="modal-sub">Official billing transaction slip overview.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setActiveReceipt(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Receipt Print Area */}
            <div className="modal-body" id="receipt-print-area" style={{ padding: '24px' }}>
              <div className="physical-bill-container">
                <div className="physical-bill-inner">
                  {/* School Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #111111', paddingBottom: '12px', marginBottom: '14px' }}>
                    <h2 className="bill-header-title">EDUCORE ACADEMY</h2>
                    <p className="bill-subtitle">Kathmandu, Nepal | Phone: +977-1-4444444 | Email: info@educore.edu</p>
                    <p style={{ fontSize: '9px', color: '#666', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PAN No: 601234567 | Reg No: 4567/080</p>
                  </div>

                  {/* Receipt Tag */}
                  <div className="bill-receipt-tag-container">
                    <span className="bill-receipt-tag">Official Fees Receipt</span>
                  </div>

                  {/* Metadata Grid */}
                  <table className="bill-meta-table">
                    <tbody>
                      <tr>
                        <td><strong>Receipt No:</strong> <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{activeReceipt.invoiceNo}</span></td>
                        <td><strong>Date:</strong> {activeReceipt.paymentDate !== '—' ? activeReceipt.paymentDate.split(' ')[0] : '—'}</td>
                      </tr>
                      <tr>
                        <td><strong>Student Name:</strong> {activeReceipt.studentName}</td>
                        <td><strong>Admission No:</strong> {activeReceipt.admissionNo || '—'}</td>
                      </tr>
                      <tr>
                        <td><strong>Class / Section:</strong> {activeReceipt.className}</td>
                        <td><strong>Billing Period:</strong> {activeReceipt.month}</td>
                      </tr>
                      <tr>
                        <td><strong>Payer Name:</strong> {activeReceipt.paidBy} ({activeReceipt.payerRelation})</td>
                        <td><strong>Payment Mode:</strong> {activeReceipt.paymentMode || 'Cash'}{activeReceipt.paymentMode === 'Online' && activeReceipt.onlineApp ? ` (${activeReceipt.onlineApp})` : ''}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Itemized Particulars Table */}
                  <table className="bill-particulars-table">
                    <thead>
                      <tr>
                        <th style={{ width: '8%', textAlign: 'center' }}>S.N.</th>
                        <th style={{ width: '45%' }}>Particulars / Description</th>
                        <th style={{ width: '15%' }}>Frequency</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>Rate ({currencySymbol()})</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>Total ({currencySymbol()})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(activeReceipt.feesBreakdown && activeReceipt.feesBreakdown.length > 0
                        ? activeReceipt.feesBreakdown
                        : [
                            {
                              name: 'Tuition & Educational Services Fee',
                              amount: activeReceipt.amount !== undefined ? activeReceipt.amount : activeReceipt.amountPaid,
                              frequency: 'Monthly'
                            }
                          ]
                      ).map((feeItem, idx) => {
                        const details = getFeeItemDetails(feeItem, activeReceipt.month)
                        return (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                            <td><strong>{details.name}</strong></td>
                            <td>{details.frequency}</td>
                            <td style={{ textAlign: 'right' }}>{details.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style={{ textAlign: 'center' }}>{details.qty}</td>
                            <td style={{ textAlign: 'right' }}>{details.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        )
                      })}

                      {/* Summary calculations */}
                      {(() => {
                        const subtotal = activeReceipt.amount !== undefined ? activeReceipt.amount : (activeReceipt.amountPaid || 0)
                        const discount = activeReceipt.discountAmount || 0
                        const tax = activeReceipt.taxAmount || 0
                        const grandTotal = activeReceipt.amountPaid || 0
                        const words = activeReceipt.inWords || numberToWords(grandTotal)

                        return (
                          <>
                            <tr className="total-row">
                              <td colSpan={4} style={{ border: 'none' }}></td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Subtotal:</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{currencySymbol()}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            {discount > 0 && (
                              <tr className="total-row">
                                <td colSpan={4} style={{ border: 'none' }}></td>
                                <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>Discount:</td>
                                <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>-{currencySymbol()}{discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                            {tax > 0 && (
                              <tr className="total-row">
                                <td colSpan={4} style={{ border: 'none' }}></td>
                                <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 'bold' }}>Tax:</td>
                                <td style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 'bold' }}>+{currencySymbol()}{tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                            <tr className="total-row" style={{ borderTop: '2px solid #111111' }}>
                              <td colSpan={4} style={{ border: 'none' }}></td>
                              <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '12px' }}>Net Total:</td>
                              <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '12px', color: 'var(--green)' }}>{currencySymbol()}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td colSpan={6} style={{ padding: 0, border: 'none' }}>
                                <div className="bill-words-box">
                                  <strong>Amount in Words:</strong> {words}
                                </div>
                              </td>
                            </tr>
                          </>
                        )
                      })()}
                    </tbody>
                  </table>

                  {/* Signatures */}
                  <div className="bill-signatures-container">
                    <div className="bill-signature-block">
                      <div className="bill-signature-line"></div>
                      <div className="bill-signature-label">Payer's Signature</div>
                      <div className="bill-signature-sub">Date: _________________</div>
                    </div>
                    <div className="bill-signature-block">
                      <div className="bill-signature-line"></div>
                      <div className="bill-signature-label">Authorized Representative</div>
                      <div className="bill-signature-sub">Received By: {getCollectorName(activeReceipt.receivedBy)}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bill-notes">
                    Note: This is a computer-generated fee collection slip and requires no physical seal. Please keep it safe for future reference.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button type="button" className="btn btn-ghost" onClick={() => setActiveReceipt(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                <i className="fa-solid fa-print"></i> Print Slip
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {toast && (
        <div className={`roles-toast roles-toast-${toast.type}`}>
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
          {toast.msg}
        </div>
      )}
    </Layout>
  )
}
