import { invoiceAmount, invoiceBalance, invoiceDue, recordInstallment } from '../lib/feeLedger'
import { useRouter } from 'next/router'
import Link from 'next/link'
import FeeClassRateEditor from '../components/FeeClassRateEditor'
import { INITIAL_FEES } from '../lib/feeData'
import { getRaw } from '../lib/storage'
import { currencySymbol } from '../lib/schoolConfig'
import { requirePermission } from '../lib/permissions'
import { BILLING_FREQUENCIES, buildBillingPreview, paymentTotals, relationshipError, normalizeRelationship } from '../lib/billing'
import BillingGenerator from '../components/BillingGenerator'
import PayerRelationships from '../components/PayerRelationships'
import Dialog from '../components/Dialog'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  readStoredList,
  writeStoredList,
  makeId,
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_STAFF,
  numberToWords
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
  if (feeItem.quantity !== undefined) return { ...feeItem, qty: feeItem.quantity, total: feeItem.amount }
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

export default function Fees() {
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [fees, setFees] = useState([])
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState(null)

  // Layout Tab State: 'ledger' or 'configurator'
  const router = useRouter()
  const [configSearch, setConfigSearch] = useState('')
  const [configStatus, setConfigStatus] = useState('all')
  const [configFrequency, setConfigFrequency] = useState('all')
  const [configAssignment, setConfigAssignment] = useState('assigned')
  const [configSort, setConfigSort] = useState('name')
  const configClassId = typeof router.query.classId === 'string' ? router.query.classId : 'all'
  const configClass = classes.find(c => String(c.id) === configClassId)
  const originClass = classes.find(c => String(c.id) === router.query.fromClass)
  useEffect(() => {
    if (router.isReady) setActiveTab(router.query.tab === 'configurator' ? 'configurator' : 'ledger')
  }, [router.isReady, router.query.tab])
  const changeTab = tab => router.push({pathname:'/fees',query:{...router.query,tab}}, undefined, {shallow:true})
  const effectiveRate = fee => Number(configClass && fee.classRates?.[configClass.id] !== undefined && fee.classRates[configClass.id] !== '' ? fee.classRates[configClass.id] : fee.amount)
  const configFees = fees.filter(fee => {
    const assigned = (fee.classIds || []).some(id => String(id) === configClassId)
    const classNames = classes.filter(c => (fee.classIds || []).includes(c.id)).map(c => `${c.name} ${c.section}`).join(' ')
    return (!configClass || configAssignment === 'all' || (configAssignment === 'assigned' ? assigned : !assigned)) &&
      (configStatus === 'all' || fee.status === configStatus) && (configFrequency === 'all' || fee.frequency === configFrequency) &&
      `${fee.name} ${fee.description || ''} ${classNames}`.toLowerCase().includes(configSearch.trim().toLowerCase())
  }).sort((a,b) => configSort === 'low' ? effectiveRate(a)-effectiveRate(b) : configSort === 'high' ? effectiveRate(b)-effectiveRate(a) : a.name.localeCompare(b.name))
  const saveClassRate = (fee, assigned, rate) => {
    if (!configClass || !requirePermission('edit','Fees')) return false
    const classIds = (fee.classIds || []).filter(id => String(id) !== String(configClass.id))
    const classRates = {...fee.classRates}
    delete classRates[configClass.id]
    if (assigned && rate !== '') classRates[configClass.id] = Number(rate)
    const updated = fees.map(f => f.id === fee.id ? {...f, classIds:assigned ? [...classIds,configClass.id] : classIds, classRates} : f)
    if (!writeStoredList('educore.fees',updated)) return false
    setFees(updated)
    return true
  }
  const [activeTab, setActiveTab] = useState('ledger')

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  // Modal control states
  const [collectionAmount, setCollectionAmount] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    payerName: '',
    relationship: 'Father',
    paymentMode: 'Cash',
    onlineApp: 'E-Sewa',
    customOnlineApp: '',
    customRelationship: '',
    discountType: 'none',
    customDiscount: '',
    taxType: 'none',
    customTax: ''
  })

  const [onlineModes, setOnlineModes] = useState([])
  const [payerRelationships, setPayerRelationships] = useState([])

  // Fee Configurator Modal states
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)
  const [feeForm, setFeeForm] = useState({
    name: '',
    amount: '',
    frequency: 'Monthly',
    description: '',
    classIds: [],
    status: 'active'
  })

  const [showBatchModal, setShowBatchModal] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState(null)

  useEffect(() => {
    let storedStudents = readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS)
    // Existing records, including empty histories, are never replaced with fixtures.
    setStudents(storedStudents)
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    setStaff(readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF))
    setRoles(readStoredList(STORAGE_KEYS.roles, []))
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
    writeStoredList('educore.fees', fees)
  }, [fees, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.onlinePaymentModes', onlineModes)
  }, [onlineModes, hydrated])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList('educore.payerRelationships', payerRelationships)
  }, [payerRelationships, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Permission checks
  const hasEditPermission = useMemo(() => {
    if (currentUser === 'Super Admin') return true
    const activeStaff = staff.find((s) => String(s.id) === String(currentUser))
    if (!activeStaff) return false
    const activeRole = roles.find((r) => r.name === activeStaff.role)
    if (!activeRole) return false
    return (activeRole.permissions?.Fees || []).includes('edit')
  }, [currentUser, staff, roles])

  const getCollectorName = (userId) => {
    if (!userId) return '—'
    if (userId === 'Super Admin') return 'Super Admin'
    const member = staff.find((s) => String(s.id) === String(userId))
    return member ? member.name : `Staff (ID: ${userId})`
  }

  // Flat list of all transactions across all students
  const allTransactions = useMemo(() => {
    const list = []
    students.forEach((student) => {
      const cls = classes.find((c) => c.id === student.classId)
      const className = cls ? `${cls.name} - Section ${cls.section}` : 'Unknown Class'
      const guardian = student.guardianName || ''

      const paymentsList = student.payments || []
      paymentsList.forEach((p) => {
        list.push({
          ...p,
          studentId: student.id,
          studentName: student.name,
          admissionNo: student.admissionNo || '',
          classId: student.classId,
          className,
          defaultGuardian: guardian,
          // Calculate dynamic invoice amount or fallback
          invoiceAmount: invoiceAmount(p)
        })
      })
    })
    return list
  }, [students, classes])

  const scopedTransactions = allTransactions.filter(t =>
    (!router.query.studentId || String(t.studentId) === router.query.studentId) &&
    (!router.query.collectionClass || String(t.classId) === router.query.collectionClass))
  const originStudent = students.find(s => String(s.id) === router.query.fromStudent)
  // Overview metrics
  const stats = useMemo(() => {
    const paidList = scopedTransactions.filter((t) => t.status === 'paid')
    const unpaidList = scopedTransactions.filter((t) => t.status !== 'paid')

    const totalCollected = scopedTransactions.reduce((sum, t) => sum + (t.amountPaid || 0), 0)
    // Calculate dynamic total outstanding based on actual invoice values
    const totalOutstanding = unpaidList.reduce((sum, t) => sum + invoiceBalance(t), 0)

    const totalInvoices = scopedTransactions.length
    const collectionRate = totalInvoices > 0 
      ? Math.round((paidList.length / totalInvoices) * 100) 
      : 0

    return {
      totalCollected,
      totalOutstanding,
      collectionRate,
      pendingCount: unpaidList.length
    }
  }, [scopedTransactions])

  // Filtering ledger entries
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return scopedTransactions.filter((t) => {
      if (router.query.invoice && t.invoiceNo !== router.query.invoice) return false
      // 1. Status Filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      // 2. Class Filter
      if (classFilter !== 'all' && String(t.classId) !== String(classFilter)) return false
      // 3. Search query matches
      if (query) {
        return (
          t.studentName.toLowerCase().includes(query) ||
          (t.invoiceNo || '').toLowerCase().includes(query) ||
          (t.month || '').toLowerCase().includes(query)
        )
      }
      return true
    }).sort((a, b) => {
      if (sortBy === 'latest') return (b.id || 0) - (a.id || 0)
      if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0)
      if (sortBy === 'amountHigh') return b.invoiceAmount - a.invoiceAmount
      if (sortBy === 'amountLow') return a.invoiceAmount - b.invoiceAmount
      if (sortBy === 'studentName') return a.studentName.localeCompare(b.studentName)
      return (b.id || 0) - (a.id || 0)
    })
  }, [router.query.invoice, scopedTransactions, searchQuery, statusFilter, classFilter, sortBy])

  // Real-time calculations for recording payment
  const calculatedTotals = useMemo(() => {
    if (!selectedTransaction) return { subtotal: 0, discount: 0, tax: 0, grandTotal: 0, words: '' }
    const subtotal = selectedTransaction.invoiceAmount || 0
    const totals = selectedTransaction.totalDue !== undefined ? {subtotal, discount:selectedTransaction.discountAmount || 0, tax:selectedTransaction.taxAmount || 0, grandTotal:selectedTransaction.totalDue, error:''} : paymentTotals(subtotal, paymentForm)
    return { ...totals, words: numberToWords(totals.grandTotal) }
  }, [selectedTransaction, paymentForm.discountType, paymentForm.customDiscount, paymentForm.taxType, paymentForm.customTax])


  const handleExportCSV = () => {
    const headers = ['Invoice Ref', 'Student Name', 'Academic Class', 'Billing Period', 'Fee Amount', 'Payment Date', 'Collected From', 'Payment Mode', 'Collector', 'Status']
    const rows = filteredTransactions.map((t) => [
      t.invoiceNo,
      t.studentName,
      t.className,
      t.month,
      `${currencySymbol()}${t.invoiceAmount}`,
      t.paymentDate || '—',
      t.status === 'paid' ? `${t.paidBy} (${t.payerRelation})` : '—',
      t.status === 'paid' ? `${t.paymentMode || 'Cash'}${t.paymentMode === 'Online' && t.onlineApp ? ` (${t.onlineApp})` : ''}` : '—',
      t.status === 'paid' ? getCollectorName(t.receivedBy) : '—',
      t.status.toUpperCase()
    ])
    exportToCSV('Educore_Ledger_Report.csv', headers, rows)
    showToast('Ledger data exported to CSV', 'success')
  }

  const handleExportPDF = () => {
    const headers = ['Invoice Ref', 'Student Name', 'Academic Class', 'Billing Period', 'Fee Amount', 'Payment Date', 'Collected From', 'Collector', 'Status']
    const rows = filteredTransactions.map((t) => [
      t.invoiceNo,
      t.studentName,
      t.className,
      t.month,
      `${currencySymbol()}${t.invoiceAmount}`,
      t.paymentDate || '—',
      t.status === 'paid' ? `${t.paidBy} (${t.payerRelation})` : '—',
      t.status === 'paid' ? getCollectorName(t.receivedBy) : '—',
      t.status.toUpperCase()
    ])
    printToPDF('Educore Tuition Fee Ledger Report', headers, rows, `Filtered collections directory report`)
    showToast('Ledger PDF print dialog opened', 'success')
  }

  // Action: Open Record Payment Modal
  const openRecordPayment = (tx) => {
    if (!hasEditPermission) {
      showToast('You do not have permission to record fee payments', 'error')
      return
    }
    setSelectedTransaction(tx)
    setCollectionAmount('')
    setPaymentForm({
      payerName: tx.defaultGuardian || '',
      relationship: payerRelationships.includes('Father') ? 'Father' : (payerRelationships[0] || 'custom'),
      paymentMode: 'Cash',
      onlineApp: 'E-Sewa',
      customOnlineApp: '',
      customRelationship: '',
      discountType: 'none',
      customDiscount: '',
      taxType: 'none',
      customTax: ''
    })
    setShowPaymentModal(true)
  }

  // Action: Save Payment
  const handleSavePayment = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    if (calculatedTotals.error) { showToast(calculatedTotals.error, 'error'); return }
    if (!selectedTransaction || selectedTransaction.status === 'paid') return
    if (!paymentForm.payerName.trim()) {
      showToast('Payer Name is required', 'error')
      return
    }

    let finalApp = ''
    if (paymentForm.paymentMode === 'Online') {
      if (paymentForm.onlineApp === 'custom') {
        const customApp = paymentForm.customOnlineApp.trim()
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
        finalApp = paymentForm.onlineApp
      }
    }

    let finalRelation = ''
    if (paymentForm.relationship === 'custom') {
      const customRel = normalizeRelationship(paymentForm.customRelationship)
      const relationIssue = relationshipError(customRel, [])
      if (relationIssue) {
        showToast(relationIssue, 'error')
        return
      }
      finalRelation = payerRelationships.find(rel => rel.toLowerCase() === customRel.toLowerCase()) || customRel
      if (!payerRelationships.some(rel => rel.toLowerCase() === customRel.toLowerCase())) {
        const updatedRels = [...payerRelationships, customRel]
        setPayerRelationships(updatedRels)
        writeStoredList('educore.payerRelationships', updatedRels)
      }
    } else {
      finalRelation = paymentForm.relationship
      if (!payerRelationships.includes(finalRelation)) { showToast('Choose an existing relationship or add a specific one.', 'error'); return }
    }

    const now = new Date()
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    let updatedInvoice
    try {
      const current = students.find(st => st.id === selectedTransaction.studentId)?.payments?.find(p => p.id === selectedTransaction.id)
      if (!current) throw new Error('Invoice no longer exists. Reload the ledger.')
      const amount = collectionAmount === '' ? Math.max(0, calculatedTotals.grandTotal - Number(current.amountPaid || 0)) : Number(collectionAmount)
      updatedInvoice = recordInstallment(current, amount, calculatedTotals, {
        id:makeId(), receiptNo:`RCT-${makeId().toString(36).toUpperCase()}`, paymentDate:formattedDate,
        paidBy:paymentForm.payerName.trim(), payerRelation:finalRelation, paymentMode:paymentForm.paymentMode,
        onlineApp:paymentForm.paymentMode === 'Online' ? finalApp : '', receivedBy:currentUser
      })
      updatedInvoice.inWords = numberToWords(updatedInvoice.amountPaid)
    } catch (error) {showToast(error.message,'error');return}
    const updatedStudents = students.map(st => st.id === selectedTransaction.studentId ? {...st,payments:st.payments.map(pay => pay.id === selectedTransaction.id ? updatedInvoice : pay)} : st)
    if (!writeStoredList(STORAGE_KEYS.students, updatedStudents)) return
    setStudents(updatedStudents)

    setShowPaymentModal(false)
    setActiveReceipt({...selectedTransaction, ...updatedInvoice})
    showToast('Payment recorded successfully', 'success')
  }

  const openBatchGenerate = () => {
    if (!requirePermission('create')) return
    setShowBatchModal(true)
  }
  const handleRunBatchGenerate = (form) => {
    if (!requirePermission('create')) return
    try {
      const preview = buildBillingPreview(students, fees, form)
      if (!preview.invoices.length) { showToast('No new eligible charges to generate.', 'info'); return }
      const updated = students.map(student => {
        const row = preview.invoices.find(item => item.studentId === student.id)
        if (!row) return student
        const invoice = { id:makeId(), invoiceNo:`SLIP-${new Date().getFullYear()}-${makeId().toString(36).toUpperCase()}`, amount:row.amount, amountPaid:0, month:preview.period.label, status:'pending', paymentDate:'—', paidBy:'—', payerRelation:'—', feesBreakdown:row.lines }
        return { ...student, payments:[...(student.payments || []),invoice] }
      })
      if (!writeStoredList(STORAGE_KEYS.students, updated)) return
      setStudents(updated); setShowBatchModal(false)
      showToast(`Generated ${preview.invoices.length} invoices. ${preview.skipped} duplicate/overlapping charges skipped.`, 'success')
    } catch (error) { showToast(error.message, 'error') }
  }

  // Action: Open Print Modal
  const openPrintReceipt = (tx) => {
    setActiveReceipt(tx)
  }

  // Action: Open Fee Structure Form Modal
  const openEditFee = (fee) => {
    if (!hasEditPermission) {
      showToast('You do not have permission to manage fee configurations', 'error')
      return
    }
    if (fee) {
      setSelectedFee(fee)
      setFeeForm({
        name: fee.name,
        amount: fee.amount,
        frequency: fee.frequency,
        description: fee.description || '',
        classIds: fee.classIds || [],
        classRates: fee.classRates || {},
        status: fee.status || 'active'
      })
    } else {
      setSelectedFee(null)
      setFeeForm({
        name: '',
        amount: '',
        frequency: 'Monthly',
        description: '',
        classIds: configClass ? [configClass.id] : [],
        classRates: {},
        status: 'active'
      })
    }
    setShowFeeModal(true)
  }

  // Action: Save Fee Structure
  const handleSaveFee = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    if (!feeForm.name.trim()) {
      showToast('Fee Name is required', 'error')
      return
    }
    if (feeForm.amount === '' || !Number.isFinite(Number(feeForm.amount)) || Number(feeForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }

    if (!feeForm.classIds.length) { showToast('Assign at least one class.', 'error'); return }
    if (!BILLING_FREQUENCIES.includes(feeForm.frequency)) { showToast('Choose a supported frequency.', 'error'); return }
    if (fees.some(f => f.id !== selectedFee?.id && f.name.trim().toLowerCase() === feeForm.name.trim().toLowerCase())) { showToast('A fee with this name already exists.', 'error'); return }
    if (Object.values(feeForm.classRates || {}).some(value => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))) { showToast('Class rates must be nonnegative numbers.', 'error'); return }

    const savedFee = {
      ...feeForm,
      id: selectedFee?.id ?? makeId(),
      name: feeForm.name.trim(),
      description: feeForm.description.trim(),
      amount: Number(feeForm.amount),
      classRates: feeForm.classRates || {}
    }
    const updatedFees = selectedFee ? fees.map(f => f.id === selectedFee.id ? savedFee : f) : [...fees, savedFee]
    if (!writeStoredList('educore.fees', updatedFees)) return
    setFees(updatedFees)
    showToast(selectedFee ? 'Fee structure updated successfully' : 'New fee structure added', 'success')
    setShowFeeModal(false)
  }

  // Action: Delete Fee Structure
  const handleDeleteFee = (feeId) => {
    if (!requirePermission('delete')) return

    if (!hasEditPermission) {
      showToast('You do not have permission to delete fee structures', 'error')
      return
    }
    if (!confirm('Are you sure you want to remove this fee structure? This will not affect already generated student invoices.')) {
      return
    }
    const updatedFees = fees.filter(f => f.id !== feeId)
    if (!writeStoredList('educore.fees', updatedFees)) return
    setFees(updatedFees)
    showToast('Fee structure deleted', 'info')
  }

  // Toggle single class assignment in feeForm
  const toggleClassAssignment = (cId) => {
    setFeeForm((prev) => {
      const current = prev.classIds || []
      const exists = current.includes(cId)
      const updated = exists ? current.filter((id) => id !== cId) : [...current, cId]
      return { ...prev, classIds: updated }
    })
  }

  // Select/Deselect All classes in feeForm
  const setAllClassesAssignment = (select) => {
    setFeeForm((prev) => ({
      ...prev,
      classIds: select ? classes.map((c) => c.id) : []
    }))
  }

  return (
    <Layout>
      {/* HEADER SECTION */}
      <div className="settings-header" style={{ marginBottom: '18px' }}>
        <div>
          <h1>Billing &amp; Tuition Fee Ledger</h1>
          <p>
            {activeTab === 'ledger' 
              ? 'Generate class-wise billing runs, record payments, and print invoices/receipt receipts for financial reporting.'
              : 'Define custom fee items (e.g. computer lab, term exam, certificates) and map them to academic classes.'}
          </p>
        </div>
        <div className="settings-actions">
          {hasEditPermission && (
            activeTab === 'ledger' ? (
              <button className="btn btn-primary" onClick={openBatchGenerate}>
                <i className="fa-solid fa-file-invoice-dollar"></i> Generate Invoices
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => openEditFee(null)}>
                <i className="fa-solid fa-plus"></i> Add Fee Structure
              </button>
            )
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="settings-tabs-nav no-print" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '25px', paddingBottom: '2px' }}>
        <button 
          className={`settings-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => changeTab('ledger')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'ledger' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'ledger' ? 'var(--accent)' : 'var(--t2)',
            fontWeight: activeTab === 'ledger' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-file-invoice-dollar"></i>
          Invoices &amp; Collections Ledger
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'configurator' ? 'active' : ''}`}
          onClick={() => changeTab('configurator')}
          style={{
            padding: '10px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'configurator' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'configurator' ? 'var(--accent)' : 'var(--t2)',
            fontWeight: activeTab === 'configurator' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '13.5px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-solid fa-sliders"></i>
          Fee Configurator
        </button>
      </div>

      {activeTab === 'ledger' && (originStudent || originClass || router.query.studentId || router.query.collectionClass) && <div className="fee-config-toolbar">
        <h3>{originStudent ? `Collections for ${originStudent.name}` : originClass ? `Collections for ${originClass.name} ${originClass.section}` : 'Filtered student collections'}</h3>
        {originStudent && <Link className="btn btn-ghost" href={`/students?studentId=${originStudent.id}`}>Back to {originStudent.name}</Link>}
        {!originStudent && originClass && <Link className="btn btn-ghost" href={`/classes?classId=${originClass.id}&tab=fees`}>Back to {originClass.name} {originClass.section}</Link>}
        {router.query.invoice && <button className="btn btn-ghost" onClick={()=>{const query={...router.query};delete query.invoice;router.push({pathname:'/fees',query},undefined,{shallow:true})}}>Show all invoices in this context</button>}
        <Link className="btn btn-ghost" href="/fees">All student collections</Link>
      </div>}
      {activeTab === 'ledger' ? (
        <>
          {/* METRICS DASHBOARD PANELS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            {/* Total Collected */}
            <div className="roles-table-card academic-list-card" style={{ padding: '18px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'var(--greenbg)', color: 'var(--green)', width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-money-bill-trend-up"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Total Collected</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginTop: '2px' }}>{currencySymbol()}{stats.totalCollected.toLocaleString()}</h2>
              </div>
            </div>

            {/* Total Outstanding */}
            <div className="roles-table-card academic-list-card" style={{ padding: '18px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'var(--amberbg)', color: 'var(--amber)', width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Outstanding Arrears</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginTop: '2px' }}>{currencySymbol()}{stats.totalOutstanding.toLocaleString()}</h2>
              </div>
            </div>

            {/* Collection rate */}
            <div className="roles-table-card academic-list-card" style={{ padding: '18px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'var(--bluebg)', color: 'var(--blue)', width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-percent"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Collection Rate</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginTop: '2px' }}>{stats.collectionRate}%</h2>
              </div>
            </div>

            {/* Pending slips count */}
            <div className="roles-table-card academic-list-card" style={{ padding: '18px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'var(--purplebg)', color: 'var(--purple)', width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-receipt"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Pending Slips</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginTop: '2px' }}>{stats.pendingCount} unpaid</h2>
              </div>
            </div>
          </div>

          {/* FILTER CONTROL CARD */}
          <div className="roles-table-card academic-list-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'center' }}>
              {/* Search */}
              <div className="roles-search" style={{ margin: 0 }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search invoice, student name..."
                  placeholder="Search invoice, student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearchQuery('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              {/* Status filter */}
              <select aria-label="Status Filter" className="roles-filter" style={{ margin: 0, width: '100%' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Payment Statuses</option>
                <option value="paid">✅ Paid Invoices</option>
                <option value="pending">⏳ Unpaid</option><option value="partial">Partially paid</option>
                <option value="overdue">🚨 Overdue Arrears</option>
              </select>

              {/* Class filter */}
              <select aria-label="Class Filter" className="roles-filter" style={{ margin: 0, width: '100%' }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="all">All Grade Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
                ))}
              </select>

              {/* Sort By filter */}
              <select aria-label="Sort By" className="roles-filter" style={{ margin: 0, width: '100%' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="latest">Sort: Latest Invoices</option>
                <option value="oldest">Sort: Oldest Invoices</option>
                <option value="amountHigh">Sort: Amount (High to Low)</option>
                <option value="amountLow">Sort: Amount (Low to High)</option>
                <option value="studentName">Sort: Student Name (A-Z)</option>
              </select>
            </div>

            {/* Export options */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <button className="btn btn-ghost btn-xs" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> Export Excel (CSV)
              </button>
              <button className="btn btn-ghost btn-xs" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> Download PDF Report
              </button>
            </div>
          </div>

          {/* TRANSACTION LEDGER TABLE */}
          <div className="roles-table-card academic-list-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)' }}>Ledger Invoices Directory</h3>
                <p style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '2px' }}>List of tuition bills, receipts, and outstanding items based on class parameters.</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t2)', background: 'var(--bg3)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                Showing {filteredTransactions.length} records
              </span>
            </div>

            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Invoice Ref</th>
                    <th>Student Name</th>
                    <th>Academic Class</th>
                    <th>Billing Period</th>
                    <th>Invoice subtotal / collected</th>
                    <th>Payment Date</th>
                    <th>Collected From</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: 'right' }}>Ledger Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="roles-empty">
                        No transaction entries matched your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t, idx) => {
                      return (
                        <tr key={`${t.invoiceNo}-${idx}`}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{t.invoiceNo}</strong>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--t1)' }}>{t.studentName}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', color: 'var(--t2)' }}>{t.className}</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{t.month}</span>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--t1)' }}>{currencySymbol()}{t.invoiceAmount.toLocaleString()}</strong><div>Balance: {currencySymbol()}{invoiceBalance(t).toFixed(2)}</div>{Number(t.amountPaid) > 0 && <div style={{fontSize:11,color:'var(--green)'}}>Collected: {currencySymbol()}{Number(t.amountPaid || 0).toFixed(2)}</div>}
                          </td>
                          <td>
                            <span style={{ fontSize: '11.5px', fontFamily: 'monospace' }}>{t.paymentDate}</span>
                          </td>
                          <td>
                            {Number(t.amountPaid) > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--t1)' }}>
                                  {t.paidBy} ({t.payerRelation})
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--t3)' }}>
                                  via {t.paymentMode || 'Cash'}{t.paymentMode === 'Online' && t.onlineApp ? ` (${t.onlineApp})` : ''}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--accent)' }} title={`Collected by: ${getCollectorName(t.receivedBy)}`}>
                                  By: {getCollectorName(t.receivedBy)}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--t3)' }}>—</span>
                            )}
                          </td>
                          <td>
                            {t.status === 'paid' && <span className="badge badge-valid">Paid</span>}
                            {t.status === 'partial' && <span className="badge badge-pending">Partially paid</span>}
                            {t.status === 'pending' && <span className="badge badge-pending">Pending</span>}
                            {t.status === 'overdue' && <span className="badge badge-blocked">Overdue</span>}
                          </td>
                          <td>
                            {t.collections?.length > 0 && <details><summary>Payment history ({t.collections.length})</summary>{t.collections.map(entry=><div key={entry.id} style={{padding:8}}><p>{entry.receiptNo} · {entry.paymentDate}</p><p>{entry.paidBy} ({entry.payerRelation}) · {entry.paymentMode} {entry.onlineApp}</p><p>Paid: {currencySymbol()}{entry.amountPaid.toFixed(2)} · Remaining: {currencySymbol()}{entry.balanceAfter.toFixed(2)}</p><button className="btn btn-ghost btn-xs" onClick={()=>printToPDF(`Payment receipt ${entry.receiptNo}`,['Invoice','Student','Date','Payer','Relationship','Method','Paid','Balance after'],[[t.invoiceNo,t.studentName,entry.paymentDate,entry.paidBy,entry.payerRelation,`${entry.paymentMode} ${entry.onlineApp || ''}`,entry.amountPaid.toFixed(2),entry.balanceAfter.toFixed(2)]])}>Print payment receipt</button></div>)}</details>}
                            <div className="roles-actions" style={{ justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-xs" title="View or print invoice" onClick={() => openPrintReceipt(t)}>
                                <i className="fa-solid fa-print"></i> View invoice
                              </button>
                              {t.status !== 'paid' && (
                                <button 
                                  className="btn btn-primary btn-xs" 
                                  title="Record Collection" 
                                  onClick={() => openRecordPayment(t)}
                                  disabled={!hasEditPermission}
                                  style={!hasEditPermission ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                >
                                  <i className="fa-solid fa-credit-card"></i> Pay Fee
                                </button>
                              )}
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
        </>
      ) : (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div className="fee-config-toolbar">
            <h2>{configClass ? `Fee configuration: ${configClass.name} ${configClass.section}` : 'Fee configuration: all classes'}</h2>
            {originClass && <Link className="btn btn-ghost" href={`/classes?classId=${originClass.id}&tab=fees`}>Back to {originClass.name} {originClass.section}</Link>}
            {configClassId !== 'all' && !configClass && <p role="status">This class no longer exists. Showing all fees.</p>}
            <div className="fee-config-filters">
              <input className="form-input" aria-label="Search fee configurations" placeholder="Search fees or assigned classes…" value={configSearch} onChange={e=>setConfigSearch(e.target.value)}/>
              <select className="form-select" aria-label="Configure class" value={configClass?.id || 'all'} onChange={e=>router.push({pathname:'/fees',query:{...router.query,tab:'configurator',classId:e.target.value}},undefined,{shallow:true})}><option value="all">All classes</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select>
              <select className="form-select" aria-label="Fee assignment filter" disabled={!configClass} value={configAssignment} onChange={e=>setConfigAssignment(e.target.value)}><option value="assigned">Assigned fees</option><option value="unassigned">Unassigned fees</option><option value="all">All fee structures</option></select>
              <select className="form-select" aria-label="Fee status filter" value={configStatus} onChange={e=>setConfigStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
              <select className="form-select" aria-label="Fee frequency filter" value={configFrequency} onChange={e=>setConfigFrequency(e.target.value)}><option value="all">All frequencies</option>{BILLING_FREQUENCIES.map(f=><option key={f}>{f}</option>)}</select>
              <select className="form-select" aria-label="Sort fee configurations" value={configSort} onChange={e=>setConfigSort(e.target.value)}><option value="name">Name A–Z</option><option value="low">Rate: low to high</option><option value="high">Rate: high to low</option></select>
            </div><p>{configFees.length} matching fee structures. {configClass ? 'Displayed rates use this class’s overrides.' : 'Displayed headline rates are base rates; class rates appear below.'}</p>
          </div>
          {/* FEE CONFIGURATOR STRUCTURES GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px', marginBottom: '25px' }}>
            {configFees.map((fee) => {
              // Find matching class names
              const mappedClasses = classes.filter((c) => (fee.classIds || []).includes(c.id))

              return (
                <div 
                  key={fee.id} 
                  className="roles-table-card academic-list-card" 
                  style={{ 
                    padding: '20px', 
                    margin: 0, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    border: '1px solid var(--border)',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span className="badge badge-active" style={{ fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', display: 'inline-block' }}>
                          {fee.frequency}
                        </span>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)', margin: 0 }}>{fee.name}</h3>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>
                        {currencySymbol()}{effectiveRate(fee).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: '12px', color: 'var(--t3)', lineHeight: '1.45', marginBottom: '16px', minHeight: '36px' }}>
                      {fee.description || 'No description provided.'}
                    </p>

                    {/* Target Classes */}
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', display: 'block', marginBottom: '6px' }}>
                        Assigned To Classes
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {mappedClasses.length === 0 ? (
                          <span style={{ fontSize: '11px', color: 'var(--red)', fontStyle: 'italic' }}>
                            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i>
                            No classes assigned (Unbilled)
                          </span>
                        ) : (
                          mappedClasses.map((c) => (
                            <span 
                              key={c.id} 
                              style={{ 
                                fontSize: '10px', 
                                background: 'var(--bg3)', 
                                border: '1px solid var(--border)', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                color: 'var(--t2)',
                                fontWeight: 600
                              }}
                            >
                              {c.name} - {c.section}: {currencySymbol()}{Number(c.id && fee.classRates?.[c.id] !== undefined && fee.classRates[c.id] !== '' ? fee.classRates[c.id] : fee.amount).toFixed(2)}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="class-fees-count">Status: {fee.status}</p>
                  {configClass && hasEditPermission && <FeeClassRateEditor key={`${fee.id}-${configClass.id}-${JSON.stringify(fee.classIds)}-${JSON.stringify(fee.classRates)}`} fee={fee} classroom={configClass} onSave={(assigned,rate)=>saveClassRate(fee,assigned,rate)}/>}
                  {/* Actions footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '10px' }}>
                    {hasEditPermission && (
                      <>
                        <button 
                          className="btn btn-ghost btn-xs" 
                          onClick={() => openEditFee(fee)}
                          style={{ padding: '4px 8px' }}
                        >
                          <i className="fa-solid fa-pencil" style={{ marginRight: '4px' }}></i> Edit Config
                        </button>
                        <button 
                          className="btn btn-ghost btn-xs" 
                          onClick={() => handleDeleteFee(fee.id)}
                          style={{ padding: '4px 8px', color: 'var(--red)' }}
                        >
                          <i className="fa-solid fa-trash" style={{ marginRight: '4px' }}></i> Remove
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {!configFees.length && <p role="status">No fees match these filters. Change filters or create a fee structure.</p>}
            {/* QUICK CREATE CARD */}
            {hasEditPermission && (
              <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} 
                className="roles-table-card academic-list-card" 
                style={{ 
                  padding: '24px', 
                  margin: 0, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  textAlign: 'center', 
                  border: '2px dashed var(--border)', 
                  background: 'none',
                  minHeight: '200px',
                  cursor: 'pointer'
                }}
                onClick={() => openEditFee(null)}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg3)', display: 'grid', placeItems: 'center', fontSize: '18px', color: 'var(--t2)', marginBottom: '12px' }}>
                  <i className="fa-solid fa-plus"></i>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--t1)', margin: '0 0 4px 0' }}>Add New Fee</h4>
                <p style={{ fontSize: '11px', color: 'var(--t3)', margin: 0, maxWidth: '200px' }}>Configure custom rates and periods for classes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD PAYMENT FORM */}
      {showPaymentModal && selectedTransaction && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-credit-card" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  Record Tuition Collection
                </h3>
                <p className="modal-sub">Log student tuition fee payments to local ledger profiles.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowPaymentModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="modal-body">
                {/* Student info */}
                <div style={{ background: 'var(--bg3)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '16px', fontSize: '12.5px', color: 'var(--t2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Student:</span>
                    <strong style={{ color: 'var(--t1)', marginLeft: 'auto' }}>{selectedTransaction.studentName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Academic Class:</span>
                    <strong style={{ color: 'var(--t1)', marginLeft: 'auto' }}>{selectedTransaction.className}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Billing Invoice:</span>
                    <strong style={{ color: 'var(--accent)', fontFamily: 'monospace', marginLeft: 'auto' }}>{selectedTransaction.invoiceNo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Billing Period:</span>
                    <strong style={{ color: 'var(--t1)', marginLeft: 'auto' }}>{selectedTransaction.month}</strong>
                  </div>
                </div>

                {/* Payer Name */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Payer Full Name <span className="req">*</span></label>
                  <input aria-label="Payer Full Name"
                    className="form-input"
                    placeholder="e.g. Suresh Mehta"
                    value={paymentForm.payerName || ''}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })}
                    required
                  />
                </div>

                {/* Relationship dropdown */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Relation to Student</label>
                  <select aria-label="Relation to Student" 
                    className="form-select" 
                    value={paymentForm.relationship || 'Father'} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, relationship: e.target.value })}
                  >
                    {payerRelationships.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                    <option value="custom">+ Add Custom Relation</option>
                  </select>
                </div>

                <PayerRelationships values={payerRelationships} onChange={values => {
                  if (!requirePermission('edit') || !writeStoredList('educore.payerRelationships', values)) return false
                  setPayerRelationships(values)
                  if (!values.includes(paymentForm.relationship)) setPaymentForm({...paymentForm,relationship:values[0] || 'custom'})
                  return true
                }} />

                {/* Custom Relationship input */}
                {paymentForm.relationship === 'custom' && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Custom Relation <span className="req">*</span></label>
                    <input aria-label="Custom Relation"
                      className="form-input"
                      placeholder="e.g. Grandfather, Aunt"
                      value={paymentForm.customRelationship || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, customRelationship: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* Payment Method */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Payment Method</label>
                  <select aria-label="Payment Method" 
                    className="form-select" 
                    value={paymentForm.paymentMode || 'Cash'} 
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value, onlineApp: e.target.value === 'Online' ? 'E-Sewa' : '' })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                {/* Online App Selection */}
                {paymentForm.paymentMode === 'Online' && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Online Payment App / Platform</label>
                    <select aria-label="Online Payment App / Platform" 
                      className="form-select" 
                      value={paymentForm.onlineApp || 'E-Sewa'} 
                      onChange={(e) => setPaymentForm({ ...paymentForm, onlineApp: e.target.value })}
                    >
                      {onlineModes.map((mode) => (
                        <option key={mode} value={mode}>{mode}</option>
                      ))}
                      <option value="custom">+ Add Custom App</option>
                    </select>
                  </div>
                )}

                {/* Custom Online App Name */}
                {paymentForm.paymentMode === 'Online' && paymentForm.onlineApp === 'custom' && (
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Custom App Name <span className="req">*</span></label>
                    <input aria-label="Custom App Name"
                      className="form-input"
                      placeholder="e.g. ConnectIPS, Fonepay"
                      value={paymentForm.customOnlineApp || ''}
                      onChange={(e) => setPaymentForm({ ...paymentForm, customOnlineApp: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* Discount settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Discount Settings</label>
                    <select disabled={selectedTransaction?.totalDue !== undefined} aria-label="Discount Settings"
                      className="form-select"
                      value={paymentForm.discountType || 'none'}
                      onChange={(e) => setPaymentForm({ ...paymentForm, discountType: e.target.value, customDiscount: '' })}
                    >
                      <option value="none">No Discount</option>
                      <option value="5%">5% Discount</option>
                      <option value="10%">10% Discount</option>
                      <option value="25%">25% Discount</option>
                      <option value="50%">50% Scholarship</option>
                      <option value="100%">100% Full Waiver</option>
                      <option value="customPercent">Custom Percent (%)</option>
                      <option value="customAmount">Custom Amount ({currencySymbol()})</option>
                    </select>
                  </div>

                  {/* Custom Discount Input */}
                  {(paymentForm.discountType === 'customPercent' || paymentForm.discountType === 'customAmount') ? (
                    <div className="form-group">
                      <label>{paymentForm.discountType === 'customPercent' ? 'Discount (%)' : `Discount (${currencySymbol()})`} <span className="req">*</span></label>
                      <input disabled={selectedTransaction?.totalDue !== undefined} aria-label="Custom discount" step="0.01"
                        className="form-input"
                        type="number"
                        min="0"
                        placeholder="e.g. 15"
                        value={paymentForm.customDiscount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, customDiscount: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'none' }} />
                  )}
                </div>

                {/* Tax system */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Tax System</label>
                    <select disabled={selectedTransaction?.totalDue !== undefined} aria-label="Tax System"
                      className="form-select"
                      value={paymentForm.taxType || 'none'}
                      onChange={(e) => setPaymentForm({ ...paymentForm, taxType: e.target.value, customTax: '' })}
                    >
                      <option value="none">No Tax</option>
                      <option value="13%">13% VAT</option>
                      <option value="5%">5% Service Tax</option>
                      <option value="customPercent">Custom Percent (%)</option>
                      <option value="customAmount">Custom Amount ({currencySymbol()})</option>
                    </select>
                  </div>

                  {/* Custom Tax Input */}
                  {(paymentForm.taxType === 'customPercent' || paymentForm.taxType === 'customAmount') ? (
                    <div className="form-group">
                      <label>{paymentForm.taxType === 'customPercent' ? 'Tax Rate (%)' : `Tax Amount (${currencySymbol()})`} <span className="req">*</span></label>
                      <input disabled={selectedTransaction?.totalDue !== undefined} aria-label="Custom tax" step="0.01"
                        className="form-input"
                        type="number"
                        min="0"
                        placeholder="e.g. 13"
                        value={paymentForm.customTax}
                        onChange={(e) => setPaymentForm({ ...paymentForm, customTax: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div style={{ display: 'none' }} />
                  )}
                </div>

                <p>Discount is applied before tax. Percentage tax uses the discounted subtotal.</p>
                {calculatedTotals.error && <p role="alert">{calculatedTotals.error}</p>}
                {/* Summary panel */}
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--t2)', marginBottom: '6px' }}>
                    <span>Subtotal:</span>
                    <span>{currencySymbol()}{calculatedTotals.subtotal.toFixed(2)}</span>
                  </div>
                  {calculatedTotals.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--red)', marginBottom: '6px' }}>
                      <span>Discount Applied:</span>
                      <span>-{currencySymbol()}{calculatedTotals.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {calculatedTotals.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--accent)', marginBottom: '6px' }}>
                      <span>Tax Applied:</span>
                      <span>+{currencySymbol()}{calculatedTotals.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: 'var(--t1)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Grand Total:</span>
                    <span style={{ color: 'var(--green)' }}>{currencySymbol()}{calculatedTotals.grandTotal.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '8px', fontStyle: 'italic', borderTop: '1px dashed var(--border)', paddingTop: '6px' }}>
                    <strong>In Words:</strong> {calculatedTotals.words}
                  </div>
                </div>
              </div>

                <div style={{marginBottom:16}}>
                  <p>Already collected: {currencySymbol()}{Number(selectedTransaction.amountPaid || 0).toFixed(2)} · Remaining: {currencySymbol()}{Math.max(0,calculatedTotals.grandTotal-Number(selectedTransaction.amountPaid || 0)).toFixed(2)}</p>
                  <label>Collect now ({currencySymbol()})<input className="form-input" aria-label="Collect now" type="number" min="0" step="0.01" max={Math.max(0,calculatedTotals.grandTotal-Number(selectedTransaction.amountPaid || 0))} placeholder="Leave blank to settle remaining balance" value={collectionAmount} onChange={e=>setCollectionAmount(e.target.value)}/></label>
                  <small>Discount and tax are fixed after the first payment.</small>
                </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-circle-check"></i> Collect Payment
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {showBatchModal && <BillingGenerator initialStudentId={router.query.studentId} initialClassId={router.query.collectionClass || router.query.classId || router.query.fromClass} students={students} classes={classes} fees={fees} onClose={() => setShowBatchModal(false)} onGenerate={handleRunBatchGenerate} />}

      {/* MODAL 3: INVOICE RECEIPT MODAL */}
      {activeReceipt && (
        <Dialog className="modal-overlay print-receipt-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-file-pdf" style={{ color: 'var(--green)', marginRight: '8px' }}></i>
                  Fee Invoice & Payment Summary
                </h3>
                <p className="modal-sub">Invoice balance and payment history.</p>
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
                    <span className="bill-receipt-tag">Fee Invoice / Payment Summary</span>
                  </div>

                  {/* Metadata Grid */}
                  <table className="bill-meta-table">
                    <tbody>
                      <tr>
                        <td><strong>Invoice No:</strong> <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{activeReceipt.invoiceNo}</span></td>
                        <td><strong>Date:</strong> {activeReceipt.paymentDate && activeReceipt.paymentDate !== '—' ? activeReceipt.paymentDate.split(' ')[0] : '—'}</td>
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
                              amount: activeReceipt.invoiceAmount,
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
                        const grandTotal = invoiceDue(activeReceipt)
                        const collected = Number(activeReceipt.amountPaid || 0)
                        const balance = invoiceBalance(activeReceipt)
                        const words = numberToWords(grandTotal)

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
                              <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '12px' }}>Invoice Total:</td>
                              <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '12px', color: 'var(--green)' }}>{currencySymbol()}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr><td colSpan={5} style={{textAlign:'right'}}>Total Collected:</td><td style={{textAlign:'right'}}>{currencySymbol()}{collected.toFixed(2)}</td></tr>
                            <tr><td colSpan={5} style={{textAlign:'right',fontWeight:800}}>Remaining Balance:</td><td style={{textAlign:'right',fontWeight:800}}>{currencySymbol()}{balance.toFixed(2)}</td></tr>
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

                  <div style={{margin:'16px 0',fontWeight:800}}>Payment status: {activeReceipt.status === 'paid' ? 'PAID IN FULL' : activeReceipt.status === 'partial' ? 'PARTIALLY PAID' : 'UNPAID'}</div>
                  {activeReceipt.collections?.length > 0 && <div><h4>Payment history</h4><table className="bill-table"><thead><tr><th>Receipt</th><th>Date</th><th>Payer / relation</th><th>Method</th><th>Paid</th><th>Balance after</th></tr></thead><tbody>{activeReceipt.collections.map(entry=><tr key={entry.id}><td>{entry.receiptNo}</td><td>{entry.paymentDate}</td><td>{entry.paidBy} ({entry.payerRelation})</td><td>{entry.paymentMode} {entry.onlineApp}</td><td>{currencySymbol()}{entry.amountPaid.toFixed(2)}</td><td>{currencySymbol()}{entry.balanceAfter.toFixed(2)}</td></tr>)}</tbody></table></div>}
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

      {/* MODAL 4: CREATE/EDIT FEE STRUCTURE FORM */}
      {showFeeModal && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-sliders" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  {selectedFee ? 'Edit Fee Config' : 'Define New Fee Structure'}
                </h3>
                <p className="modal-sub">Setup custom fee rates, frequencies, and class mappings.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowFeeModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveFee}>
              <div className="modal-body">
                {/* Fee Name */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Fee Identifier/Name <span className="req">*</span></label>
                  <input aria-label="Fee Identifier/Name"
                    className="form-input"
                    placeholder="e.g. Computer Science Lab, Sports Equipment"
                    value={feeForm.name}
                    onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* Amount & Frequency */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Billing Amount ({currencySymbol()}) <span className="req">*</span></label>
                    <input aria-label="Billing Amount" min="0.01" step="0.01"
                      className="form-input"
                      type="number"
                      placeholder="e.g. 500"
                      value={feeForm.amount}
                      onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Period Frequency</label>
                    <select aria-label="Period Frequency" 
                      className="form-select" 
                      value={feeForm.frequency} 
                      onChange={(e) => setFeeForm({ ...feeForm, frequency: e.target.value })}
                    >
                      <option value="Daily">Daily</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="One-Time">One-Time</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Description (Optional)</label>
                  <textarea aria-label="Description (Optional)"
                    className="form-input"
                    placeholder="Provide details about what this fee covers..."
                    value={feeForm.description}
                    onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Class Assignment Selector */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>Class Assignments & optional unit rates <span className="req">*</span></label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-xs" 
                        onClick={() => setAllClassesAssignment(true)}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-xs" 
                        onClick={() => setAllClassesAssignment(false)}
                        style={{ padding: '2px 6px', fontSize: '10px' }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div 
                    style={{ 
                      maxHeight: '130px', 
                      overflowY: 'auto', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: '10px',
                      background: 'var(--bg3)'
                    }}
                  >
                    {classes.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--t3)', fontStyle: 'italic' }}>No school classes registered in system.</span>
                    ) : (
                      classes.map((cls) => {
                        const isChecked = (feeForm.classIds || []).includes(cls.id)
                        return (
                          <label 
                            key={cls.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              fontSize: '12.5px', 
                              padding: '5px 0', 
                              cursor: 'pointer',
                              color: 'var(--t1)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleClassAssignment(cls.id)}
                              style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }}
                            />
                            <span>{cls.name} - Section {cls.section} ({cls.classCode})</span>
                            {isChecked && <input type="number" min="0" step="0.01" className="form-input" style={{maxWidth:130}} aria-label={`Rate for ${cls.name} ${cls.section}`} placeholder={`Base ${feeForm.amount || 0}`} value={feeForm.classRates?.[cls.id] ?? ''} onChange={event => setFeeForm({...feeForm,classRates:{...feeForm.classRates,[cls.id]:event.target.value}})} />}

                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowFeeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-circle-check"></i> Save Config
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="toast-stack">
          <div className="toast success">
            <span>🎉</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </Layout>
  )
}
