import { collectionEntries, invoiceBalance, invoiceDue } from '../lib/feeLedger'
import { currencySymbol } from '../lib/schoolConfig'
import { requirePermission } from '../lib/permissions'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  readStoredList,
  writeStoredList,
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  INITIAL_STAFF
} from '../lib/academicData'
import { exportToCSV, printToPDF } from '../lib/exportUtils'

const EXPENSE_CATEGORIES = ['Rent & Building', 'Electricity & Water', 'Office Supplies', 'Internet & Software', 'Marketing & Events', 'Vehicle & Transport', 'Salary Dues Settle', 'Others']
const PAYMENT_MODES = ['Cash', 'Online (E-Sewa)', 'Online (Khalti)', 'Bank Transfer', 'Cheque']

export default function Finance() {
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [classes, setClasses] = useState([])
  const [expenses, setExpenses] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState(null)
  
  // Tab states
  const [activeTab, setActiveTab] = useState('overview')
  const [collectionsSubTab, setCollectionsSubTab] = useState('daily')
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClassId, setSelectedClassId] = useState('all')
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('all')
  const [selectedCollector, setSelectedCollector] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Expense form states
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Office Supplies',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    receiptName: '',
    receiptSize: ''
  })
  const [receiptFile, setReceiptFile] = useState(null)

  // Day Audit form states
  const [openingBalanceInput, setOpeningBalanceInput] = useState('10000')

  // Load initial data
  useEffect(() => {
    setStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setStaff(readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF))
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    setExpenses(readStoredList('educore.expenses', [
      { id: 1, title: 'May Office Internet', category: 'Internet & Software', amount: 150, date: '2026-05-10', notes: 'High-speed fiber connection renewal receipt attached', receiptName: 'internet_bill_may.png', receiptSize: '1.2 MB' },
      { id: 2, title: 'Whiteboard Markers & Dusters', category: 'Office Supplies', amount: 80, date: '2026-06-12', notes: 'Purchased for secondary classrooms', receiptName: 'stationery_receipt.jpg', receiptSize: '740 KB' },
      { id: 3, title: 'School Bus Fuel', category: 'Vehicle & Transport', amount: 450, date: '2026-06-28', notes: 'Diesel refill for Bus Route 3', receiptName: 'fuel_slip_2041.pdf', receiptSize: '1.8 MB' }
    ]))
    setAuditLogs(readStoredList('educore.dailyAudit', [
      { date: '2026-06-27', openingBalance: 12000, collected: 11500, disbursed: 0, expenses: 150, closingBalance: 23350, status: 'closed', closedBy: 'Super Admin' },
      { date: '2026-06-28', openingBalance: 23350, collected: 5150, disbursed: 0, expenses: 450, closingBalance: 28050, status: 'closed', closedBy: 'Super Admin' }
    ]))
    setHydrated(true)
  }, [])

  // Sync back to local storage
  useEffect(() => { if (hydrated) writeStoredList('educore.expenses', expenses) }, [expenses, hydrated])
  useEffect(() => { if (hydrated) writeStoredList('educore.dailyAudit', auditLogs) }, [auditLogs, hydrated])
  useEffect(() => { if (hydrated) writeStoredList(STORAGE_KEYS.students, students) }, [students, hydrated])
  useEffect(() => { if (hydrated) writeStoredList(STORAGE_KEYS.staff, staff) }, [staff, hydrated])

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  // Get current active audit for selectedDate
  const activeAudit = useMemo(() => {
    return auditLogs.find(log => log.date === selectedDate)
  }, [auditLogs, selectedDate])

  // Get student collections on selectedDate
  const dailyCollections = useMemo(() => {
    if (activeAudit?.status === 'closed' && activeAudit.collectionsSnapshot) return activeAudit.collectionsSnapshot
    const list = []
    students.forEach(student => {
      const cls = classes.find(c => c.id === student.classId)
      const className = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'Unknown'
      
      (student.payments || []).flatMap(collectionEntries).forEach(payment => {
        if (payment.status === 'paid' && payment.paymentDate && payment.paymentDate !== '—') {
          const datePart = payment.paymentDate.split(' ')[0] // e.g. "08/04/2026"
          // Convert datePart DD/MM/YYYY to YYYY-MM-DD
          const parts = datePart.split('/')
          if (parts.length === 3) {
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
            if (formattedDate === selectedDate) {
              list.push({
                studentId: student.id,
                studentName: student.name,
                classId: student.classId,
                className,
                invoiceNo: payment.invoiceNo,
                amountPaid: payment.amountPaid,
                paymentMode: payment.paymentMode || 'Cash',
                onlineApp: payment.onlineApp,
                receivedBy: payment.receivedBy || 'Super Admin',
                paidBy: payment.paidBy || student.guardianName || 'Guardian',
                paymentDate: payment.paymentDate
              })
            }
          }
        }
      })
    })
    return list
  }, [students, selectedDate, classes, activeAudit])

  // Get staff payroll disbursals on selectedDate
  const dailyDisbursals = useMemo(() => {
    if (activeAudit?.status === 'closed' && activeAudit.disbursalsSnapshot) return activeAudit.disbursalsSnapshot
    const list = []
    staff.forEach(emp => {
      emp.salaryHistory?.forEach(slip => {
        if (slip.status === 'paid' && slip.paymentDate && slip.paymentDate !== '—') {
          const datePart = slip.paymentDate.split(' ')[0] // DD/MM/YYYY
          const parts = datePart.split('/')
          if (parts.length === 3) {
            const formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
            if (formattedDate === selectedDate) {
              list.push({
                staffId: emp.id,
                staffName: emp.name,
                role: emp.role,
                slipNo: slip.slipNo,
                amountPaid: slip.netSalary,
                paymentMode: slip.paymentMode || 'Bank Transfer',
                receivedBy: slip.paidBy || 'Super Admin',
                paymentDate: slip.paymentDate
              })
            }
          }
        }
      })
    })
    return list
  }, [staff, selectedDate, activeAudit])

  // Get school expenses on selectedDate
  const dailyExpenses = useMemo(() => {
    if (activeAudit?.status === 'closed' && activeAudit.expensesSnapshot) return activeAudit.expensesSnapshot
    return expenses.filter(exp => exp.date === selectedDate)
  }, [expenses, selectedDate, activeAudit])

  // Calculate current dynamic balance for selectedDate
  const calculatedMetrics = useMemo(() => {
    if (activeAudit?.status === 'closed') return {opening:activeAudit.openingBalance,collected:activeAudit.collected,disbursed:activeAudit.disbursed,expenses:activeAudit.expenses,closing:activeAudit.closingBalance}
    const totalCollected = dailyCollections.reduce((sum, item) => sum + (item.amountPaid || 0), 0)
    const totalDisbursed = dailyDisbursals.reduce((sum, item) => sum + (item.amountPaid || 0), 0)
    const totalExpenses = dailyExpenses.reduce((sum, item) => sum + (item.amountPaid || item.amount || 0), 0)
    
    // Find previous day's closing balance if any
    const previous = [...auditLogs].filter(log => log.date < selectedDate).sort((a,b)=>b.date.localeCompare(a.date))[0]
    const yesterdayClosing = previous?.closingBalance ?? 10000

    const currentOpening = activeAudit ? activeAudit.openingBalance : yesterdayClosing
    const currentClosing = currentOpening + totalCollected - totalDisbursed - totalExpenses

    return {
      opening: currentOpening,
      collected: totalCollected,
      disbursed: totalDisbursed,
      expenses: totalExpenses,
      closing: currentClosing
    }
  }, [dailyCollections, dailyDisbursals, dailyExpenses, activeAudit, auditLogs, selectedDate])

  // Open books for the day
  const handleOpenDay = () => {
    if (!requirePermission('create')) return
    if (auditLogs.some(log=>log.date===selectedDate)) { showToast('Books already exist for this date', 'error'); return }
    const opening = Number(openingBalanceInput) || 0
    const newLog = {
      date: selectedDate,
      openingBalance: opening,
      collected: 0,
      disbursed: 0,
      expenses: 0,
      closingBalance: opening,
      status: 'open',
      closedBy: '—'
    }
    setAuditLogs(prev => [...prev, newLog])
    showToast(`Books opened for ${selectedDate} with ${currencySymbol()}${opening}`)
  }

  // Close books for the day (lock verification)
  const handleCloseDay = () => {
    if (!requirePermission('approve')) return
    if (!activeAudit || activeAudit.status !== 'open') return
    setAuditLogs(prev => prev.map(log => {
      if (log.date === selectedDate) {
        return {
          ...log,
          openingBalance: calculatedMetrics.opening,
          collected: calculatedMetrics.collected,
          disbursed: calculatedMetrics.disbursed,
          expenses: calculatedMetrics.expenses,
          closingBalance: calculatedMetrics.closing,
          collectionsSnapshot: dailyCollections,
          disbursalsSnapshot: dailyDisbursals,
          expensesSnapshot: dailyExpenses,
          status: 'closed',
          closedBy: 'Super Admin'
        }
      }
      return log
    }))
    showToast(`Books closed & locked for ${selectedDate}. Closing balance: ${currencySymbol()}${calculatedMetrics.closing}`)
  }

  // Settle previous unpaid salary dues
  const handleSettleDueSalary = (staffId, slipId, amount, paymentMode) => {
    if (!requirePermission('edit')) return
    const pad = (n) => String(n).padStart(2, '0')
    const today = new Date()
    const formattedPaymentDate = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()} ${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`
    
    // Update staff payroll slip state
    setStaff(prev => prev.map(emp => {
      if (emp.id === staffId) {
        return {
          ...emp,
          salaryHistory: (emp.salaryHistory || []).map(slip => {
            if (slip.id === slipId) {
              return {
                ...slip,
                status: 'paid',
                paymentDate: formattedPaymentDate,
                paymentMode,
                paidBy: 'Super Admin'
              }
            }
            return slip
          })
        }
      }
      return emp
    }))

    // Automatically trigger daily audit update if open
    if (activeAudit && activeAudit.status === 'open') {
      setAuditLogs(prev => prev.map(log => {
        if (log.date === selectedDate) {
          return {
            ...log,
            disbursed: log.disbursed + amount,
            closingBalance: log.closingBalance - amount
          }
        }
        return log
      }))
    }

    showToast(`Salary payment of ${currencySymbol()}${amount} successfully audited and paid.`)
  }

  // Handle Recording of Expenses
  const handleAddExpense = (e) => {
    e?.preventDefault?.(); if (!requirePermission('create')) return

    e.preventDefault()
    if (auditLogs.some(log => log.date === expenseForm.date && log.status === 'closed')) { showToast('Books are closed for this date', 'error'); return }
    const amt = Number(expenseForm.amount) || 0
    if (!expenseForm.title || amt <= 0) {
      showToast('Please enter a valid title and amount', 'error')
      return
    }

    const newExp = {
      id: Date.now(),
      title: expenseForm.title,
      category: expenseForm.category,
      amount: amt,
      date: expenseForm.date,
      notes: expenseForm.notes,
      receiptName: expenseForm.receiptName || 'no_attachment.png',
      receiptSize: expenseForm.receiptSize || '—'
    }

    setExpenses(prev => [newExp, ...prev])

    // Update today's audit if open
    if (expenseForm.date === selectedDate && activeAudit && activeAudit.status === 'open') {
      setAuditLogs(prev => prev.map(log => {
        if (log.date === selectedDate) {
          return {
            ...log,
            expenses: log.expenses + amt,
            closingBalance: log.closingBalance - amt
          }
        }
        return log
      }))
    }

    setExpenseForm({
      title: '',
      category: 'Office Supplies',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      receiptName: '',
      receiptSize: ''
    })
    setReceiptFile(null)
    showToast('Expense logged and audited successfully')
  }

  // Mock Receipt Upload
  const handleMockReceiptUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReceiptFile(file)
    setExpenseForm(prev => ({
      ...prev,
      receiptName: file.name,
      receiptSize: `${(file.size / 1024).toFixed(0)} KB`
    }))
  }

  // Filtered Student Payments (All time or pending)
  const allFeeCollections = useMemo(() => {
    const list = []
    students.forEach(student => {
      const cls = classes.find(c => c.id === student.classId)
      const className = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : 'Unknown'
      
      student.payments?.forEach(payment => {
        list.push({
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          className,
          invoiceNo: payment.invoiceNo,
          amountPaid: payment.amountPaid,
          amountTotal: invoiceDue(payment),
          balance: invoiceBalance(payment),
          month: payment.month,
          status: payment.status,
          paymentMode: payment.paymentMode || 'Cash',
          receivedBy: payment.receivedBy || 'Super Admin',
          paidBy: payment.paidBy || '—',
          paymentDate: payment.paymentDate
        })
      })
    })
    return list
  }, [students, classes])

  const filteredFeeCollections = useMemo(() => {
    return allFeeCollections.filter(c => {
      if (selectedClassId !== 'all' && String(c.classId) !== String(selectedClassId)) return false
      if (selectedPaymentMode !== 'all' && c.paymentMode !== selectedPaymentMode) return false
      if (selectedCollector !== 'all' && c.receivedBy !== selectedCollector) return false
      
      const q = searchQuery.toLowerCase().trim()
      if (q) {
        return c.studentName.toLowerCase().includes(q) || c.invoiceNo.toLowerCase().includes(q) || c.paidBy.toLowerCase().includes(q)
      }
      return true
    })
  }, [allFeeCollections, selectedClassId, selectedPaymentMode, selectedCollector, searchQuery])

  // Weekly Collections summary by Class
  const weeklyCollectionsByClass = useMemo(() => {
    const summary = {}
    classes.forEach(c => {
      summary[c.id] = { className: `${c.name}${c.section ? ` - ${c.section}` : ''}`, collected: 0, pending: 0 }
    })
    allFeeCollections.forEach(c => {
      if (summary[c.classId]) {
        summary[c.classId].collected += Number(c.amountPaid || 0)
        summary[c.classId].pending += c.balance
      }
    })
    return Object.values(summary)
  }, [allFeeCollections, classes])

  // All pending due salaries for employees
  const staffDueSalaries = useMemo(() => {
    const list = []
    staff.forEach(emp => {
      emp.salaryHistory?.forEach(slip => {
        if (slip.status === 'pending') {
          list.push({
            staffId: emp.id,
            staffName: emp.name,
            role: emp.role,
            department: emp.department,
            slipId: slip.id,
            slipNo: slip.slipNo,
            month: slip.month,
            netSalary: slip.netSalary
          })
        }
      })
    })
    return list
  }, [staff])

  // Collectors unique list for filter dropdown
  const uniqueCollectors = useMemo(() => {
    const list = new Set()
    allFeeCollections.forEach(c => { if (c.receivedBy) list.add(c.receivedBy) })
    return Array.from(list)
  }, [allFeeCollections])

  // EXPORT CSV
  const handleExportCollections = () => {
    const headers = ['Student Name', 'Class', 'Bill/Invoice No', 'Payer Name', 'Collected By', 'Method', 'Amount Paid', 'Date']
    const rows = filteredFeeCollections.map(c => [
      c.studentName, c.className, c.invoiceNo, c.paidBy, c.receivedBy, c.paymentMode, `${currencySymbol()}${c.amountPaid}`, c.paymentDate
    ])
    exportToCSV('Fee_Collections_Report.csv', headers, rows)
    showToast('Collections log exported successfully')
  }

  // PRINT LEDGER PDF
  const handlePrintLedger = () => {
    const headers = ['Type', 'Particulars / Title', 'Amount', 'Payment Mode', 'Collector/Officer']
    const rows = []
    
    // Add collections
    dailyCollections.forEach(c => {
      rows.push(['Income', `Fee: ${c.studentName} (${c.invoiceNo})`, `${currencySymbol()}${c.amountPaid}`, c.paymentMode, c.receivedBy])
    })
    // Add disbursals
    dailyDisbursals.forEach(d => {
      rows.push(['Expense', `Salary Release: ${d.staffName} (${d.slipNo})`, `${currencySymbol()}${d.amountPaid}`, d.paymentMode, d.receivedBy])
    })
    // Add expenses
    dailyExpenses.forEach(e => {
      rows.push(['Expense', `${e.title} (${e.category})`, `${currencySymbol()}${e.amount}`, 'Cash/Direct', 'Finance Dept'])
    })

    const meta = `Financial Day Audit Ledger — Date: ${selectedDate}\nOpening Cash: ${currencySymbol()}${calculatedMetrics.opening} | Closing Cash: ${currencySymbol()}${calculatedMetrics.closing}\nTotal Income: ${currencySymbol()}${calculatedMetrics.collected} | Total Expenses: ${currencySymbol()}${calculatedMetrics.disbursed + calculatedMetrics.expenses}`
    printToPDF(`Financial_Ledger_${selectedDate}`, headers, rows, meta)
    showToast('Generating printable Day Ledger PDF...', 'info')
  }

  // RENDER HTML
  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1><i className="fa-solid fa-scale-balanced" style={{ color: 'var(--accent)', marginRight: 8 }}></i>School Finance & Auditing</h1>
          <p>Supervise daily cash flows, lock audit logs, settle payroll dues, and track institutional expenses.</p>
        </div>
        <div className="settings-actions">
          <div className="form-group" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Audit Date:</span>
            <input aria-label="Selected Date"
              type="date"
              className="form-input"
              style={{ padding: '6px 12px', fontSize: 12, maxWidth: 160 }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
          {activeAudit && (
            <button className="btn btn-ghost" onClick={handlePrintLedger}>
              <i className="fa-solid fa-print"></i> Day Ledger PDF
            </button>
          )}
        </div>
      </div>

      {/* AUDIT STATUS OVERVIEW BAR */}
      <div className="roles-table-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, background: activeAudit?.status === 'closed' ? 'var(--greenbg)' : 'var(--bg2)', border: activeAudit?.status === 'closed' ? '1px solid var(--green)' : '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: activeAudit?.status === 'closed' ? 'var(--green)' : 'var(--amber)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18 }}>
            <i className={`fa-solid ${activeAudit?.status === 'closed' ? 'fa-lock' : 'fa-lock-open'}`}></i>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              Audit Books: {selectedDate}
              <span className={`badge ${activeAudit?.status === 'closed' ? 'badge-active' : 'badge-amber'}`} style={{ textTransform: 'uppercase', padding: '2px 8px', fontSize: 10 }}>
                {activeAudit ? activeAudit.status : 'unopened'}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--t3)', margin: '2px 0 0 0' }}>
              {activeAudit?.status === 'closed'
                ? `Locked by Super Admin. No further transactions can be updated for this date.`
                : `Auditing is active. Please record all cash changes, verify balances, and lock the books.`}
            </p>
          </div>
        </div>

        {!activeAudit ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <input aria-label="Opening Cash ($)"
                type="number"
                placeholder="Opening Cash ($)"
                className="form-input"
                style={{ maxWidth: 140, padding: '6px 10px', fontSize: 12 }}
                value={openingBalanceInput}
                onChange={e => setOpeningBalanceInput(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleOpenDay}>
              <i className="fa-solid fa-door-open"></i> Open Today's Books
            </button>
          </div>
        ) : activeAudit.status === 'open' ? (
          <button className="btn btn-primary btn-sm" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} onClick={handleCloseDay}>
            <i className="fa-solid fa-lock"></i> Verify & Close Today's Books
          </button>
        ) : (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>
            <i className="fa-solid fa-circle-check"></i> Closed By: {activeAudit.closedBy}
          </div>
        )}
      </div>

      {/* KPI METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Opening Balance', val: `${currencySymbol()}${calculatedMetrics.opening}`, icon: 'fa-door-open', col: 'var(--blue)', bg: 'var(--bluebg)' },
          { label: 'Student Fees Collected', val: `+${currencySymbol()}${calculatedMetrics.collected}`, icon: 'fa-money-bill-wave', col: 'var(--green)', bg: 'var(--greenbg)' },
          { label: 'Salary Released', val: `-${currencySymbol()}${calculatedMetrics.disbursed}`, icon: 'fa-wallet', col: 'var(--red)', bg: 'var(--redbg)' },
          { label: 'Logged Expenses', val: `-${currencySymbol()}${calculatedMetrics.expenses}`, icon: 'fa-receipt', col: 'var(--amber)', bg: 'var(--amberbg)' },
          { label: 'Closing Net Balance', val: `${currencySymbol()}${calculatedMetrics.closing}`, icon: 'fa-scale-balanced', col: 'var(--purple)', bg: 'var(--purplebg)' }
        ].map(({ label, val, icon, col, bg }) => (
          <div key={label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, color: col, display: 'grid', placeItems: 'center', fontSize: 18 }}>
              <i className={`fa-solid ${icon}`}></i>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>{val}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TAB SELECTORS */}
      <div className="tabs-nav" style={{ marginBottom: 20 }}>
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
          <i className="fa-solid fa-chart-line"></i> Cash Auditing Logs
        </button>
        <button className={activeTab === 'collections' ? 'active' : ''} onClick={() => setActiveTab('collections')}>
          <i className="fa-solid fa-money-bill-wave"></i> Fee Collections Report
        </button>
        <button className={activeTab === 'payroll' ? 'active' : ''} onClick={() => setActiveTab('payroll')}>
          <i className="fa-solid fa-wallet"></i> Payroll & Previous Dues
        </button>
        <button className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}>
          <i className="fa-solid fa-receipt"></i> School Expense Tracker
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW & CASH AUDITING LOGS ─── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'flex-start' }}>
          {/* Auditing ledger history */}
          <div className="roles-table-card academic-list-card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                <i className="fa-solid fa-history" style={{ color: 'var(--accent)', marginRight: 8 }}></i>
                Historic Audits & Closing Logs
              </div>
            </div>
            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Opening Cash</th>
                    <th style={{ textAlign: 'right' }}>Fees Collected</th>
                    <th style={{ textAlign: 'right' }}>Salary Disbursals</th>
                    <th style={{ textAlign: 'right' }}>Other Expenses</th>
                    <th style={{ textAlign: 'right' }}>Closing Cash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr><td colSpan={7} className="roles-empty">No auditing history recorded yet.</td></tr>
                  ) : [...auditLogs].sort((a,b) => b.date.localeCompare(a.date)).map(log => (
                    <tr key={log.date}>
                      <td style={{ fontWeight: 700 }}>{log.date}</td>
                      <td style={{ textAlign: 'right' }}>{currencySymbol()}{log.openingBalance}</td>
                      <td style={{ textAlign: 'right', color: 'var(--green)', fontWeight: 600 }}>+{currencySymbol()}{log.collected}</td>
                      <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 600 }}>-{currencySymbol()}{log.disbursed}</td>
                      <td style={{ textAlign: 'right', color: 'var(--amber)', fontWeight: 600 }}>-{currencySymbol()}{log.expenses}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{currencySymbol()}{log.closingBalance}</td>
                      <td>
                        <span className={`badge ${log.status === 'closed' ? 'badge-active' : 'badge-amber'}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Transactions Summary Side Panel */}
          <div className="roles-table-card" style={{ padding: '18px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <i className="fa-solid fa-list-check" style={{ marginRight: 8, color: 'var(--accent)' }}></i>
              Audit Breakdown ({selectedDate})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--t3)' }}>Student Collections:</span>
                <span style={{ fontWeight: 700, color: 'var(--green)' }}>+{dailyCollections.length} bills ({currencySymbol()}{calculatedMetrics.collected})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--t3)' }}>Salary Releases:</span>
                <span style={{ fontWeight: 700, color: 'var(--red)' }}>-{dailyDisbursals.length} staff ({currencySymbol()}{calculatedMetrics.disbursed})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--t3)' }}>Logged Expenses:</span>
                <span style={{ fontWeight: 700, color: 'var(--amber)' }}>-{dailyExpenses.length} entries ({currencySymbol()}{calculatedMetrics.expenses})</span>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800 }}>
                  <span>Audited Closing Balance:</span>
                  <span style={{ color: 'var(--purple)' }}>{currencySymbol()}{calculatedMetrics.closing}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: '10px', marginTop: 8, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', margin: '0 0 6px 0' }}>Ledger Audit Process</h4>
                <ol style={{ margin: 0, paddingLeft: 14, fontSize: 11, color: 'var(--t2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>Confirm all receipts/salaries matches bank details.</li>
                  <li>Log any manual hardware/administrative expenses.</li>
                  <li>Compare visual Net Balance with physical cash box.</li>
                  <li>Click 'Verify & Close' to finalize daily audits.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: STUDENT FEE COLLECTION REPORTS ─── */}
      {activeTab === 'collections' && (
        <div>
          {/* Sub Tab Switchers */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            <button
              className={`btn btn-sm ${collectionsSubTab === 'daily' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCollectionsSubTab('daily')}
            >
              Daily Collections List
            </button>
            <button
              className={`btn btn-sm ${collectionsSubTab === 'weekly' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCollectionsSubTab('weekly')}
            >
              Weekly Class-Wise Summary
            </button>
            <button
              className={`btn btn-sm ${collectionsSubTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCollectionsSubTab('pending')}
            >
              Pending Collections ({allFeeCollections.filter(c=>c.status==='pending').length})
            </button>
          </div>

          {/* Filtering row */}
          {collectionsSubTab === 'daily' && (
            <div className="roles-table-card" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Class</label>
                <select aria-label="Class" className="form-select" style={{ fontSize: 12 }} value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                  <option value="all">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Medium</label>
                <select aria-label="Medium" className="form-select" style={{ fontSize: 12 }} value={selectedPaymentMode} onChange={e => setSelectedPaymentMode(e.target.value)}>
                  <option value="all">All Mediums</option>
                  {PAYMENT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: 140 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Collector</label>
                <select aria-label="Collector" className="form-select" style={{ fontSize: 12 }} value={selectedCollector} onChange={e => setSelectedCollector(e.target.value)}>
                  <option value="all">All Staff</option>
                  {uniqueCollectors.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              <div className="roles-search" style={{ margin: 0, flex: 1, minWidth: 160 }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search student, bill number, or payer..."
                  placeholder="Search student, bill number, or payer..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ fontSize: 12 }}
                />
                {searchQuery && <button aria-label="Close" className="roles-search-clear" onClick={() => setSearchQuery('')}><i className="fa-solid fa-xmark"></i></button>}
              </div>
              <button className="btn btn-ghost" onClick={handleExportCollections}>
                <i className="fa-solid fa-file-csv"></i> Export CSV
              </button>
            </div>
          )}

          {/* Tab 2.1: Daily Collections List */}
          {collectionsSubTab === 'daily' && (
            <div className="roles-table-card academic-list-card">
              <div className="table-wrap">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>Bill / Invoice No</th>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Payer Name</th>
                      <th>Collector</th>
                      <th>Payment Medium</th>
                      <th style={{ textAlign: 'right' }}>Amount Paid</th>
                      <th>Transaction Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeeCollections.length === 0 ? (
                      <tr><td colSpan={8} className="roles-empty">No fee collections found matching the filters.</td></tr>
                    ) : filteredFeeCollections.map(c => (
                      <tr key={c.invoiceNo}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{c.invoiceNo}</td>
                        <td style={{ fontWeight: 700 }}>{c.studentName}</td>
                        <td style={{ fontSize: 12 }}>{c.className}</td>
                        <td style={{ fontSize: 12 }}>{c.paidBy}</td>
                        <td style={{ fontSize: 12 }}>{c.receivedBy}</td>
                        <td>
                          <span className="badge badge-blue">
                            {c.paymentMode} {c.onlineApp ? `(${c.onlineApp})` : ''}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--green)' }}>
                          {currencySymbol()}{c.amountPaid}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--t3)' }}>{c.paymentDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2.2: Weekly Summary */}
          {collectionsSubTab === 'weekly' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {weeklyCollectionsByClass.map(cs => (
                <div key={cs.className} className="roles-table-card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{cs.className}</div>
                    <i className="fa-solid fa-school" style={{ color: 'var(--accent)' }}></i>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--t3)' }}>Total Collected:</span>
                      <strong style={{ color: 'var(--green)' }}>{currencySymbol()}{cs.collected}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--t3)' }}>Total Outstanding:</span>
                      <strong style={{ color: 'var(--red)' }}>{currencySymbol()}{cs.pending}</strong>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)' }}>
                      <span>Collection Rate:</span>
                      <strong>{cs.collected + cs.pending > 0 ? Math.round((cs.collected / (cs.collected + cs.pending)) * 100) : 0}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2.3: Pending Collections */}
          {collectionsSubTab === 'pending' && (
            <div className="roles-table-card academic-list-card">
              <div className="table-wrap">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Billing Month</th>
                      <th style={{ textAlign: 'right' }}>Total Fee Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFeeCollections.filter(c => c.status === 'pending').map(c => (
                      <tr key={`${c.studentId}-${c.month}`}>
                        <td style={{ fontWeight: 700 }}>{c.studentName}</td>
                        <td>{c.className}</td>
                        <td>{c.month}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--red)' }}>{currencySymbol()}{c.amountTotal}</td>
                        <td>
                          <span className="badge badge-amber">PENDING</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              setActiveTab('collections')
                              setCollectionsSubTab('daily')
                              showToast('Please collect outstanding payments directly from the Student Details Page.', 'info')
                            }}
                          >
                            Collect Dues
                          </button>
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

      {/* ─── TAB 3: PAYROLL & PREVIOUS DUES SETTLEMENT ─── */}
      {activeTab === 'payroll' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'flex-start' }}>
          {/* Salary dues settlement table */}
          <div className="roles-table-card academic-list-card">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--red)', marginRight: 8 }}></i>
                Outstanding Salary Dues & Left Payments
              </div>
              <span className="badge badge-red">{staffDueSalaries.length} unpaid slips</span>
            </div>
            <div className="table-wrap">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Teacher / Employee</th>
                    <th>ID & Role</th>
                    <th>Due Month</th>
                    <th style={{ textAlign: 'right' }}>Salary Due</th>
                    <th style={{ textAlign: 'center' }}>Direct Auditing Settlement</th>
                  </tr>
                </thead>
                <tbody>
                  {staffDueSalaries.length === 0 ? (
                    <tr><td colSpan={5} className="roles-empty">All staff salaries are fully paid & audited!</td></tr>
                  ) : staffDueSalaries.map(due => (
                    <tr key={due.slipNo}>
                      <td><strong style={{ color: 'var(--t1)' }}>{due.staffName}</strong></td>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{due.role}</div>
                        <div style={{ fontSize: 10, fontFamily: 'monospace' }}>{due.slipNo}</div>
                      </td>
                      <td><strong>{due.month}</strong></td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--red)' }}>{currencySymbol()}{due.netSalary}</td>
                      <td style={{ textAlign: 'center' }}>
                        {activeAudit?.status === 'closed' ? (
                          <span style={{ fontSize: 11, color: 'var(--t3)' }}>Books Closed</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button
                              className="btn btn-primary btn-xs"
                              style={{ background: 'var(--green)', borderColor: 'var(--green)', padding: '4px 10px', fontSize: 10 }}
                              onClick={() => handleSettleDueSalary(due.staffId, due.slipId, due.netSalary, 'Bank Transfer')}
                            >
                              Settle (Bank)
                            </button>
                            <button
                              className="btn btn-ghost btn-xs"
                              style={{ padding: '4px 10px', fontSize: 10 }}
                              onClick={() => handleSettleDueSalary(due.staffId, due.slipId, due.netSalary, 'Cash')}
                            >
                              Settle (Cash)
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Pay Info panel */}
          <div className="roles-table-card" style={{ padding: '18px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: 8, color: 'var(--accent)' }}></i>
              Payroll Auditing Guide
            </h3>
            <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 }}>
              Unpaid teacher slips from previous cycles represent school liability. Releasing these dues updates the teacher's profile and immediately audits the current Cash flow.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>Total School Dues:</span>
                <strong style={{ color: 'var(--red)' }}>{currencySymbol()}{staffDueSalaries.reduce((sum, s)=>sum+s.netSalary, 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span>Paid This Month:</span>
                <strong style={{ color: 'var(--green)' }}>{currencySymbol()}{dailyDisbursals.reduce((sum, s)=>sum+s.amountPaid, 0)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SCHOOL EXPENSE TRACKER ─── */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'flex-start' }}>
          {/* Expenses log list */}
          <div>
            {/* Filter controls */}
            <div className="roles-table-card" style={{ padding: '12px 18px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="roles-search" style={{ margin: 0, flex: 1 }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search expense titles, descriptions..."
                  placeholder="Search expense titles, descriptions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="roles-table-card academic-list-card">
              <div className="table-wrap">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>Title / Particular</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Receipt File</th>
                      <th>Auditing Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(e => {
                      const q = searchQuery.toLowerCase()
                      return !q || e.title.toLowerCase().includes(q) || (e.notes||'').toLowerCase().includes(q)
                    }).map(exp => (
                      <tr key={exp.id}>
                        <td><strong style={{ color: 'var(--t1)' }}>{exp.title}</strong></td>
                        <td>
                          <span className="badge badge-gray">{exp.category}</span>
                        </td>
                        <td>{exp.date}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--red)' }}>
                          -{currencySymbol()}{exp.amount}
                        </td>
                        <td>
                          {exp.receiptName && exp.receiptName !== 'no_attachment.png' ? (
                            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="fa-solid fa-paperclip"></i> {exp.receiptName}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--t3)' }}>No attachment</span>
                          )}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--t2)' }}>{exp.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Record Expense Form Panel */}
          <div className="roles-table-card" style={{ padding: '18px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <i className="fa-solid fa-receipt" style={{ marginRight: 8, color: 'var(--accent)' }}></i>
              Audit School Expense
            </h3>

            {activeAudit?.status === 'closed' ? (
              <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--t3)', fontStyle: 'italic', fontSize: 12 }}>
                Audit books are closed and locked for this date. You cannot log expenses.
              </div>
            ) : (
              <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Expense Title</label>
                  <input aria-label="Expense Title"
                    type="text"
                    required
                    placeholder="e.g. Electricity Bill June"
                    className="form-input"
                    value={expenseForm.title}
                    onChange={e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Category</label>
                  <select aria-label="Category"
                    className="form-select"
                    value={expenseForm.category}
                    onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Amount ({currencySymbol()})</label>
                  <input aria-label="Amount ($)"
                    type="number"
                    required
                    min="1"
                    placeholder="Amount in USD"
                    className="form-input"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Transaction Date</label>
                  <input aria-label="Transaction Date"
                    type="date"
                    required
                    className="form-input"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Auditing Notes</label>
                  <textarea aria-label="Auditing Notes"
                    rows={2}
                    placeholder="Enter additional receipt reference info..."
                    className="form-input"
                    value={expenseForm.notes}
                    onChange={e => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>Attach Receipt / Bill Image</label>
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 6, padding: 10, background: 'var(--bg3)', textAlign: 'center' }}>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      id="expense-receipt-upload"
                      style={{ display: 'none' }}
                      onChange={handleMockReceiptUpload}
                    />
                    <label htmlFor="expense-receipt-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', fontSize: 11 }}>
                      <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 18, color: 'var(--accent)' }}></i>
                      <span>{receiptFile ? receiptFile.name : 'Upload receipt file'}</span>
                      {receiptFile && <span style={{ fontSize: 9, color: 'var(--t3)' }}>({expenseForm.receiptSize})</span>}
                    </label>
                  </div>
                </div>

                <button className="btn btn-primary" type="submit" style={{ marginTop: 6 }}>
                  <i className="fa-solid fa-plus"></i> Record Audited Expense
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
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
