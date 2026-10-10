import { getRaw } from '../lib/storage'
import { currencySymbol } from '../lib/schoolConfig'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  readStoredList,
  writeStoredList,
  makeId,
  INITIAL_STAFF,
  numberToWords
} from '../lib/academicData'
import { exportToCSV, printToPDF } from '../lib/exportUtils'

// Helper for dynamic salary detail calculations
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

export default function Salary() {
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState(null)

  // Navigation tab state: 'ledger' or 'configurator'
  const [activeTab, setActiveTab] = useState('ledger')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('latest')

  // Modals visibility control
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: '',
    paymentMode: 'Bank Transfer',
    paidBy: 'Accountant',
    status: 'paid'
  })

  const [showBatchModal, setShowBatchModal] = useState(false)
  const [batchForm, setBatchForm] = useState({
    billingMonth: '',
    targetDepartment: 'all'
  })

  const [activeReceipt, setActiveReceipt] = useState(null)

  // Configuration Modal states
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedStaffMember, setSelectedStaffMember] = useState(null)
  const [configForm, setConfigForm] = useState({
    baseSalary: '',
    additions: [],
    deductions: []
  })

  useEffect(() => {
    let storedStaff = readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF)
    // Existing records, including empty histories, are never replaced with fixtures.
    setStaff(storedStaff)
    setRoles(readStoredList(STORAGE_KEYS.roles, []))
    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.staff, staff)
  }, [staff, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Permission Checks
  const hasEditPermission = useMemo(() => {
    if (currentUser === 'Super Admin') return true
    const activeStaff = staff.find((s) => String(s.id) === String(currentUser))
    if (!activeStaff) return false
    const activeRole = roles.find((r) => r.name === activeStaff.role)
    if (!activeRole) return false
    return (activeRole.permissions?.Fees || []).includes('edit')
  }, [currentUser, staff, roles])

  // Get staff member clean name
  const getStaffName = (id) => {
    if (id === 'Super Admin') return 'Super Admin'
    const member = staff.find((s) => String(s.id) === String(id))
    return member ? member.name : `Staff (ID: ${id})`
  }

  // Departments List
  const departments = useMemo(() => {
    const list = new Set(staff.map((s) => s.department).filter(Boolean))
    return Array.from(list)
  }, [staff])

  // Flat list of all salary transactions across all staff members
  const allTransactions = useMemo(() => {
    const list = []
    staff.forEach((member) => {
      const history = member.salaryHistory || []
      history.forEach((h) => {
        list.push({
          ...h,
          staffId: member.id,
          staffName: member.name,
          employeeId: member.employeeId,
          department: member.department,
          role: member.role
        })
      })
    })
    return list
  }, [staff])

  // Overview metrics calculation
  const stats = useMemo(() => {
    const paidList = allTransactions.filter((t) => t.status === 'paid')
    const unpaidList = allTransactions.filter((t) => t.status === 'pending' || t.status === 'overdue')

    const totalPaid = paidList.reduce((sum, t) => sum + (t.netSalary || 0), 0)
    const totalOutstanding = unpaidList.reduce((sum, t) => sum + (t.netSalary || 0), 0)

    // Calculate monthly payroll budget for all active staff members
    const monthlyBudget = staff
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const details = calculateSalaryDetails(s.baseSalary, s.additions, s.deductions)
        return sum + details.netSalary
      }, 0)

    return {
      totalPaid,
      totalOutstanding,
      monthlyBudget,
      pendingCount: unpaidList.length
    }
  }, [allTransactions, staff])

  // Filtered transactions for the ledger table
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return allTransactions
      .filter((t) => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false
        if (departmentFilter !== 'all' && t.department !== departmentFilter) return false
        if (query) {
          return (
            t.staffName.toLowerCase().includes(query) ||
            (t.employeeId || '').toLowerCase().includes(query) ||
            (t.slipNo || '').toLowerCase().includes(query) ||
            (t.month || '').toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'latest') return (b.id || 0) - (a.id || 0)
        if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0)
        if (sortBy === 'salaryHigh') return b.netSalary - a.netSalary
        if (sortBy === 'salaryLow') return a.netSalary - b.netSalary
        if (sortBy === 'staffName') return a.staffName.localeCompare(b.staffName)
        return (b.id || 0) - (a.id || 0)
      })
  }, [allTransactions, searchQuery, statusFilter, departmentFilter, sortBy])

  // Open Record Payment form
  const openRecordPayment = (tx) => {
    if (!hasEditPermission) {
      showToast('You do not have permission to manage payroll transactions', 'error')
      return
    }
    const today = new Date().toISOString().substring(0, 10)
    setSelectedTransaction(tx)
    setPaymentForm({
      paymentDate: today,
      paymentMode: 'Bank Transfer',
      paidBy: getStaffName(currentUser),
      status: 'paid'
    })
    setShowPaymentModal(true)
  }

  // Save salary payment details
  const handleSavePayment = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    if (!paymentForm.paymentDate) {
      showToast('Payment date is required', 'error')
      return
    }

    const dObj = new Date(paymentForm.paymentDate)
    const pad = (n) => String(n).padStart(2, '0')
    const formattedPaymentDate = `${pad(dObj.getDate())}/${pad(dObj.getMonth() + 1)}/${dObj.getFullYear()}`

    setStaff((prevStaff) =>
      prevStaff.map((member) => {
        if (member.id === selectedTransaction.staffId) {
          const updatedHistory = (member.salaryHistory || []).map((historyItem) => {
            if (historyItem.id === selectedTransaction.id) {
              return {
                ...historyItem,
                status: 'paid',
                paymentDate: formattedPaymentDate,
                paidBy: paymentForm.paidBy,
                paymentMode: paymentForm.paymentMode
              }
            }
            return historyItem
          })
          return { ...member, salaryHistory: updatedHistory }
        }
        return member
      })
    )

    setShowPaymentModal(false)
    showToast('Payroll payment recorded successfully', 'success')
  }

  // Delete salary history record
  const handleDeleteTransaction = (tx) => {
    if (!requirePermission('delete')) return

    if (!hasEditPermission) {
      showToast('You do not have permission to delete payroll records', 'error')
      return
    }
    if (!confirm(`Are you sure you want to remove the salary slip ${tx.slipNo} for ${tx.staffName}?`)) {
      return
    }

    setStaff((prevStaff) =>
      prevStaff.map((member) => {
        if (member.id === tx.staffId) {
          const updatedHistory = (member.salaryHistory || []).filter((h) => h.id !== tx.id)
          return { ...member, salaryHistory: updatedHistory }
        }
        return member
      })
    )
    showToast('Salary record deleted successfully', 'info')
  }

  // Open Batch Generate payroll
  const openBatchGenerate = () => {
    if (!hasEditPermission) {
      showToast('You do not have permission to run payroll generation', 'error')
      return
    }
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const today = new Date()
    const defaultBillingMonth = `${months[today.getMonth()]} ${today.getFullYear()}`
    setBatchForm({
      billingMonth: defaultBillingMonth,
      targetDepartment: 'all'
    })
    setShowBatchModal(true)
  }

  // Run Batch Payroll generator
  const handleRunBatchGenerate = (e) => {
    e?.preventDefault?.(); if (!requirePermission('create')) return

    e.preventDefault()
    const billingMonth = batchForm.billingMonth.trim()
    if (!billingMonth) {
      showToast('Billing month label is required', 'error')
      return
    }

    let targets = staff.filter((s) => s.status === 'active')
    if (batchForm.targetDepartment !== 'all') {
      targets = targets.filter((s) => s.department === batchForm.targetDepartment)
    }

    if (targets.length === 0) {
      showToast('No active staff found in the selected target department', 'error')
      return
    }

    let slipsCreated = 0

    const updatedStaff = staff.map((member) => {
        const isActive = member.status === 'active'
        const matchesDept = batchForm.targetDepartment === 'all' || member.department === batchForm.targetDepartment
        if (!isActive || !matchesDept) return member

        const currentHistory = member.salaryHistory || []
        const alreadyGenerated = currentHistory.some((h) => h.month.toLowerCase() === billingMonth.toLowerCase())
        if (alreadyGenerated) return member

        slipsCreated++

        const calc = calculateSalaryDetails(member.baseSalary, member.additions, member.deductions)
        const newSlip = {
          id: makeId() + Math.floor(Math.random() * 1000),
          slipNo: `SLIP-SAL-${new Date().getFullYear()}-${makeId().toString(36).toUpperCase()}`,
          month: billingMonth,
          baseSalary: calc.baseSalary,
          netSalary: calc.netSalary,
          additions: [...(member.additions || [])],
          deductions: [...(member.deductions || [])],
          status: 'pending',
          paymentDate: '—',
          paidBy: '—',
          paymentMode: '—'
        }

        return {
          ...member,
          salaryHistory: [...currentHistory, newSlip]
        }
      })
    setStaff(updatedStaff)

    setShowBatchModal(false)
    if (slipsCreated > 0) {
      showToast(`Batch payroll generated successfully! Created ${slipsCreated} slips.`, 'success')
    } else {
      showToast('Payroll slips for this billing month already exist for the selected staff members', 'info')
    }
  }

  // Export Ledger to CSV
  const handleExportCSV = () => {
    const headers = ['Slip No', 'Employee Name', 'Employee ID', 'Designation', 'Department', 'Month', 'Net Payout', 'Paid On', 'Payment Mode', 'Issued By', 'Status']
    const rows = filteredTransactions.map((t) => [
      t.slipNo,
      t.staffName,
      t.employeeId,
      t.role,
      t.department,
      t.month,
      `${currencySymbol()}${t.netSalary}`,
      t.paymentDate || '—',
      t.paymentMode || '—',
      t.paidBy || '—',
      t.status.toUpperCase()
    ])
    exportToCSV('Educore_Staff_Payroll_Ledger.csv', headers, rows)
    showToast('CSV export successful', 'success')
  }

  // Export Ledger to PDF
  const handleExportPDF = () => {
    const headers = ['Slip No', 'Employee Name', 'ID', 'Role', 'Department', 'Month', 'Net Payout', 'Paid On', 'Status']
    const rows = filteredTransactions.map((t) => [
      t.slipNo,
      t.staffName,
      t.employeeId,
      t.role,
      t.department,
      t.month,
      `${currencySymbol()}${t.netSalary}`,
      t.paymentDate || '—',
      t.status.toUpperCase()
    ])
    printToPDF('Educore Staff Salary Payroll Registry', headers, rows, 'Filtered institutional payroll history logs')
    showToast('PDF print dialog opened', 'success')
  }

  // Open Config Structure Modal
  const openEditConfig = (member) => {
    if (!hasEditPermission) {
      showToast('You do not have permission to manage salary structures', 'error')
      return
    }
    setSelectedStaffMember(member)
    setConfigForm({
      baseSalary: member.baseSalary || 3000,
      additions: member.additions ? JSON.parse(JSON.stringify(member.additions)) : [],
      deductions: member.deductions ? JSON.parse(JSON.stringify(member.deductions)) : []
    })
    setShowConfigModal(true)
  }

  // Manage allowance additions/deductions within configurator form
  const handleAddConfigRule = (listKey, type) => {
    setConfigForm((prev) => ({
      ...prev,
      [listKey]: [...prev[listKey], { label: '', type, valType: 'fixed', value: '' }]
    }))
  }

  const handleUpdateConfigRule = (listKey, idx, field, val) => {
    setConfigForm((prev) => {
      const nextList = [...prev[listKey]]
      nextList[idx] = {
        ...nextList[idx],
        [field]: val
      }
      return { ...prev, [listKey]: nextList }
    })
  }

  const handleRemoveConfigRule = (listKey, idx) => {
    setConfigForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== idx)
    }))
  }

  // Save Salary Structure Configurations
  const handleSaveConfig = (e) => {
    e?.preventDefault?.(); if (!requirePermission('edit')) return

    e.preventDefault()
    if (!configForm.baseSalary || Number(configForm.baseSalary) <= 0) {
      showToast('Base salary must be a positive number', 'error')
      return
    }

    setStaff((prevStaff) =>
      prevStaff.map((s) => {
        if (s.id === selectedStaffMember.id) {
          return {
            ...s,
            baseSalary: Number(configForm.baseSalary),
            additions: configForm.additions.map(item => ({ ...item, value: Number(item.value) || 0 })),
            deductions: configForm.deductions.map(item => ({ ...item, value: Number(item.value) || 0 }))
          }
        }
        return s
      })
    )

    setShowConfigModal(false)
    showToast(`Salary structure for ${selectedStaffMember.name} updated successfully`, 'success')
  }

  return (
    <Layout>
      {/* HEADER SECTION */}
      <div className="settings-header" style={{ marginBottom: '18px' }}>
        <div>
          <h1>Payroll &amp; Staff Compensation</h1>
          <p>
            {activeTab === 'ledger'
              ? 'Run bulk monthly staff payroll calculations, record payments, and generate official printable salary pay slips.'
              : 'Configure employee base salaries, custom dynamic allowances, and benefit deductions.'}
          </p>
        </div>
        <div className="settings-actions">
          {hasEditPermission && activeTab === 'ledger' && (
            <button className="btn btn-primary" onClick={openBatchGenerate}>
              <i className="fa-solid fa-calculator"></i> Run Monthly Payroll
            </button>
          )}
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="settings-tabs-nav no-print" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '25px', paddingBottom: '2px' }}>
        <button
          className={`settings-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
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
          <i className="fa-solid fa-wallet"></i>
          Payroll Ledger &amp; Receipts
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'configurator' ? 'active' : ''}`}
          onClick={() => setActiveTab('configurator')}
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
          Salary Configurator
        </button>
      </div>

      {activeTab === 'ledger' ? (
        <>
          {/* METRICS DASHBOARD PANELS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            {/* Total Paid */}
            <div className="roles-table-card academic-list-card" style={{ padding: '18px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'var(--greenbg)', color: 'var(--green)', width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-money-bill-transfer"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Total Salaries Paid</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginTop: '2px' }}>{currencySymbol()}{stats.totalPaid.toLocaleString()}</h2>
              </div>
            </div>

            {/* Total Outstanding */}
            <div className="roles-table-card academic-list-card" style={{ padding: '18px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'var(--amberbg)', color: 'var(--amber)', width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Outstanding Payroll</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginTop: '2px' }}>{currencySymbol()}{stats.totalOutstanding.toLocaleString()}</h2>
              </div>
            </div>

            {/* Monthly Budget */}
            <div className="roles-table-card academic-list-card" style={{ padding: '18px 24px', margin: 0, display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ background: 'var(--bluebg)', color: 'var(--blue)', width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                <i className="fa-solid fa-piggy-bank"></i>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)' }}>Net Monthly Budget</div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginTop: '2px' }}>{currencySymbol()}{stats.monthlyBudget.toLocaleString()}</h2>
              </div>
            </div>
          </div>

          {/* LEDGER FILTER BAR */}
          <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
            <div className="roles-toolbar academic-toolbar">
              <div className="roles-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search staff, ID, month, slip..."
                  placeholder="Search staff, ID, month, slip..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearchQuery('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              <select aria-label="Department Filter" className="roles-filter" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select aria-label="Status Filter" className="roles-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <select aria-label="Sort By" className="roles-filter" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="latest">Latest Generated</option>
                <option value="oldest">Oldest Generated</option>
                <option value="salaryHigh">Salary (High - Low)</option>
                <option value="salaryLow">Salary (Low - High)</option>
                <option value="staffName">Employee Name (A-Z)</option>
              </select>

              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button className="btn btn-ghost btn-xs" onClick={handleExportCSV}>
                  <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> CSV
                </button>
                <button className="btn btn-ghost btn-xs" onClick={handleExportPDF}>
                  <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF
                </button>
              </div>
            </div>

            {/* LEDGER DATA TABLE */}
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--t3)', borderTop: '1px solid var(--border)' }}>
                <i className="fa-solid fa-receipt" style={{ fontSize: '36px', marginBottom: '12px', display: 'block' }}></i>
                No salary payroll logs match your search and filter criteria.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>Slip No</th>
                      <th>Employee Name</th>
                      <th>Designation / Dept</th>
                      <th>Billing Month</th>
                      <th>Net Salary</th>
                      <th>Payment Date</th>
                      <th>Payment Mode</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.slipNo}</span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--t1)' }}>{tx.staffName}</strong>
                          <div style={{ fontSize: '10px', color: 'var(--t3)' }}>ID: {tx.employeeId}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{tx.role}</div>
                          <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{tx.department}</div>
                        </td>
                        <td><strong>{tx.month}</strong></td>
                        <td>
                          <strong style={{ color: tx.status === 'paid' ? 'var(--green)' : 'var(--t1)' }}>
                            {currencySymbol()}{tx.netSalary.toLocaleString()}
                          </strong>
                        </td>
                        <td>{tx.paymentDate || '—'}</td>
                        <td>{tx.paymentMode || '—'}</td>
                        <td>
                          <span className={`badge ${tx.status === 'paid' ? 'badge-active' : 'badge-gray'}`}>
                            {tx.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="roles-actions" style={{ justifyContent: 'flex-end' }}>
                            {tx.status === 'paid' ? (
                              <button
                                className="btn-icon-sm tooltip"
                                data-tooltip="Print Pay Slip"
                                onClick={() => setActiveReceipt(tx)}
                              >
                                <i className="fa-solid fa-print"></i>
                              </button>
                            ) : (
                              hasEditPermission && (
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => openRecordPayment(tx)}
                                >
                                  <i className="fa-solid fa-money-bill-check"></i> Pay Out
                                </button>
                              )
                            )}
                            {hasEditPermission && (
                              <button aria-label="Delete"
                                className="btn-icon-sm danger tooltip"
                                data-tooltip="Remove Slip"
                                onClick={() => handleDeleteTransaction(tx)}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* TAB 2: CONFIGURATOR LANDING */
        <div className="roles-table-card academic-list-card" style={{ width: '100%', padding: '16px' }}>
          <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>ID / Code</th>
                  <th>Designation / Dept</th>
                  <th>Base Salary</th>
                  <th>Allowances (Additions)</th>
                  <th>Deductions</th>
                  <th>Net Monthly Payout</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const calc = calculateSalaryDetails(member.baseSalary, member.additions, member.deductions)
                  return (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--accentbg)',
                            color: 'var(--accent)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            {member.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: 'var(--t1)' }}>{member.name}</strong>
                            <div style={{ fontSize: '11px', color: member.status === 'active' ? 'var(--green)' : 'var(--t3)' }}>
                              {member.status.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{member.employeeId}</span></td>
                      <td>
                        <div>{member.role}</div>
                        <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{member.department}</div>
                      </td>
                      <td><strong>{currencySymbol()}{(member.baseSalary || 0).toLocaleString()}</strong></td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <strong>{currencySymbol()}{calc.totalAdditions.toLocaleString()}</strong>
                          <span style={{ color: 'var(--t3)', marginLeft: '4px' }}>({member.additions?.length || 0} items)</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <strong>{currencySymbol()}{calc.totalDeductions.toLocaleString()}</strong>
                          <span style={{ color: 'var(--t3)', marginLeft: '4px' }}>({member.deductions?.length || 0} items)</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--accent)', fontSize: '14px' }}>
                          {currencySymbol()}{calc.netSalary.toLocaleString()}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => openEditConfig(member)}
                          disabled={!hasEditPermission}
                        >
                          <i className="fa-solid fa-sliders"></i> Edit Structure
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

      {/* MODAL 1: RECORD SALARY PAYMENT */}
      {showPaymentModal && selectedTransaction && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-money-bill-transfer" style={{ color: 'var(--green)', marginRight: '8px' }}></i>
                  Record Salary Payment
                </h3>
                <p className="modal-sub">Log institutional salary payout to employee.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowPaymentModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '4px' }}>Employee</div>
                  <strong style={{ fontSize: '14.5px', color: 'var(--t1)' }}>{selectedTransaction.staffName} ({selectedTransaction.employeeId})</strong>
                  <div style={{ fontSize: '12px', color: 'var(--t2)', marginTop: '2px' }}>Role: {selectedTransaction.role} | Period: {selectedTransaction.month}</div>
                  <div style={{ borderTop: '1px dashed var(--border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Total Net Payout:</span>
                    <strong style={{ fontSize: '15px', color: 'var(--green)' }}>{currencySymbol()}{selectedTransaction.netSalary.toLocaleString()}.00</strong>
                  </div>
                </div>

                {/* Payment Date */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Payout/Payment Date <span className="req">*</span></label>
                  <input aria-label="Payout/Payment Date"
                    type="date"
                    className="form-input"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Payment Mode</label>
                  <select aria-label="Payment Mode"
                    className="form-select"
                    value={paymentForm.paymentMode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer (Direct Deposit)</option>
                    <option value="Cash">Cash Handout</option>
                    <option value="Check">Check Issue</option>
                  </select>
                </div>

                {/* Authorized Issuer */}
                <div className="form-group">
                  <label>Paid / Disbursed By</label>
                  <input aria-label="Paid / Disbursed By"
                    className="form-input"
                    value={paymentForm.paidBy}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidBy: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-circle-check"></i> Complete Payout
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* MODAL 2: BATCH MONTHLY RUN */}
      {showBatchModal && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-calculator" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  Bulk Payroll Generator
                </h3>
                <p className="modal-sub">Generate monthly compensation slips for active staff.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowBatchModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleRunBatchGenerate}>
              <div className="modal-body">
                {/* Billing Month */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Payroll Period Label <span className="req">*</span></label>
                  <input aria-label="Payroll Period Label"
                    className="form-input"
                    placeholder="e.g. July 2026"
                    value={batchForm.billingMonth}
                    onChange={(e) => setBatchForm({ ...batchForm, billingMonth: e.target.value })}
                    required
                  />
                  <small style={{ color: 'var(--t3)', fontSize: '11px', marginTop: '4px', display: 'block' }}>Type period label, e.g. July 2026, August 2026.</small>
                </div>

                {/* Target Department Selection */}
                <div className="form-group">
                  <label>Target Department</label>
                  <select aria-label="Target Department"
                    className="form-select"
                    value={batchForm.targetDepartment}
                    onChange={(e) => setBatchForm({ ...batchForm, targetDepartment: e.target.value })}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowBatchModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-play"></i> Run Calculations
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* MODAL 3: INVOICE RECEIPT MODAL */}
      {activeReceipt && (
        <Dialog className="modal-overlay print-receipt-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header no-print">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-file-invoice-dollar" style={{ color: 'var(--green)', marginRight: '8px' }}></i>
                  Salary Pay Slip
                </h3>
                <p className="modal-sub">Official compensation record card.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setActiveReceipt(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Slip Print Area */}
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
                    <span className="bill-receipt-tag">Official Salary Pay Slip</span>
                  </div>

                  {/* Metadata Grid */}
                  <table className="bill-meta-table">
                    <tbody>
                      <tr>
                        <td><strong>Pay Slip No:</strong> <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{activeReceipt.slipNo}</span></td>
                        <td><strong>Month Period:</strong> {activeReceipt.month}</td>
                      </tr>
                      <tr>
                        <td><strong>Employee Name:</strong> {activeReceipt.staffName}</td>
                        <td><strong>Employee ID:</strong> {activeReceipt.employeeId}</td>
                      </tr>
                      <tr>
                        <td><strong>Designation / Role:</strong> {activeReceipt.role}</td>
                        <td><strong>Department:</strong> {activeReceipt.department}</td>
                      </tr>
                      <tr>
                        <td><strong>Payment Date:</strong> {activeReceipt.paymentDate}</td>
                        <td><strong>Payment Method:</strong> {activeReceipt.paymentMode}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Itemized Particulars Table */}
                  <table className="bill-particulars-table">
                    <thead>
                      <tr>
                        <th style={{ width: '8%', textAlign: 'center' }}>S.N.</th>
                        <th style={{ width: '15%' }}>Category</th>
                        <th style={{ width: '45%' }}>Particulars / Description</th>
                        <th style={{ width: '12%', textAlign: 'center' }}>Type</th>
                        <th style={{ width: '20%', textAlign: 'right' }}>Amount ({currencySymbol()})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Base Salary Row */}
                      <tr>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td><strong style={{ color: 'var(--green)' }}>Earning</strong></td>
                        <td><strong>Basic Salary</strong></td>
                        <td style={{ textAlign: 'center' }}>Base</td>
                        <td style={{ textAlign: 'right' }}>{activeReceipt.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>

                      {/* Additions list */}
                      {(activeReceipt.additions || []).map((add, idx) => (
                        <tr key={`add-${idx}`}>
                          <td style={{ textAlign: 'center' }}>{idx + 2}</td>
                          <td><strong style={{ color: 'var(--green)' }}>Earning</strong></td>
                          <td>{add.label}</td>
                          <td style={{ textAlign: 'center' }}>{add.valType === 'percent' ? `${add.value}%` : 'Fixed'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {Math.round(add.valType === 'percent' ? activeReceipt.baseSalary * (add.value / 100) : add.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}

                      {/* Deductions list */}
                      {(activeReceipt.deductions || []).map((ded, idx) => {
                        const SN = (activeReceipt.additions?.length || 0) + idx + 2
                        return (
                          <tr key={`ded-${idx}`}>
                            <td style={{ textAlign: 'center' }}>{SN}</td>
                            <td><strong style={{ color: 'var(--red)' }}>Deduction</strong></td>
                            <td>{ded.label}</td>
                            <td style={{ textAlign: 'center' }}>{ded.valType === 'percent' ? `${ded.value}%` : 'Fixed'}</td>
                            <td style={{ textAlign: 'right', color: 'var(--red)' }}>
                              -{Math.round(ded.valType === 'percent' ? activeReceipt.baseSalary * (ded.value / 100) : ded.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )
                      })}

                      {/* Calculations Summary */}
                      {(() => {
                        const calc = calculateSalaryDetails(activeReceipt.baseSalary, activeReceipt.additions, activeReceipt.deductions)
                        const totalEarnings = calc.baseSalary + calc.totalAdditions
                        const totalDeductions = calc.totalDeductions
                        const grandTotal = calc.netSalary
                        const words = numberToWords(grandTotal)

                        return (
                          <>
                            <tr className="total-row" style={{ borderTop: '2px solid #111111' }}>
                              <td colSpan={3} style={{ border: 'none' }}></td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Gross Earnings:</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{currencySymbol()}{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="total-row">
                              <td colSpan={3} style={{ border: 'none' }}></td>
                              <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>Deductions:</td>
                              <td style={{ textAlign: 'right', color: 'var(--red)', fontWeight: 'bold' }}>-{currencySymbol()}{totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="total-row" style={{ borderTop: '2px solid #111111' }}>
                              <td colSpan={3} style={{ border: 'none' }}></td>
                              <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '12px' }}>Net Pay:</td>
                              <td style={{ textAlign: 'right', fontWeight: '800', fontSize: '12px', color: 'var(--green)' }}>{currencySymbol()}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td colSpan={5} style={{ padding: 0, border: 'none' }}>
                                <div className="bill-words-box">
                                  <strong>Net Pay in Words:</strong> {words}
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
                      <div className="bill-signature-label">Employee Signature</div>
                      <div className="bill-signature-sub">Date: _________________</div>
                    </div>
                    <div className="bill-signature-block">
                      <div className="bill-signature-line"></div>
                      <div className="bill-signature-label">Disbursed By (Accountant)</div>
                      <div className="bill-signature-sub">Issued By: {activeReceipt.paidBy}</div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bill-notes">
                    Note: This pay slip is a confidential document and is generated electronically by the HR Department. No stamp seal required.
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

      {/* MODAL 4: EDIT SALARY STRUCTURE CONFIGURATION */}
      {showConfigModal && selectedStaffMember && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-sliders" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  Edit Salary Structure
                </h3>
                <p className="modal-sub">Manage salary allowances &amp; reductions for {selectedStaffMember.name}.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowConfigModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveConfig}>
              <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {/* Base Salary */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Base Salary ({currencySymbol()}) <span className="req">*</span></label>
                  <input aria-label="Base Salary ($)"
                    type="number"
                    className="form-input"
                    value={configForm.baseSalary}
                    onChange={(e) => setConfigForm({ ...configForm, baseSalary: e.target.value })}
                    required
                    min="1"
                  />
                </div>

                {/* Additions / Allowances Section */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Allowances &amp; Benefits (Additions)</h4>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleAddConfigRule('additions', 'addition')}
                      style={{ padding: '2px 8px' }}
                    >
                      <i className="fa-solid fa-plus"></i> Add Allowance
                    </button>
                  </div>

                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                    {configForm.additions.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--t3)', fontStyle: 'italic' }}>No custom allowances defined.</span>
                    ) : (
                      configForm.additions.map((item, idx) => (
                        <div key={`addition-${idx}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <input aria-label="e.g. Travel Allowance"
                            className="form-input"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            placeholder="e.g. Travel Allowance"
                            value={item.label}
                            onChange={(e) => handleUpdateConfigRule('additions', idx, 'label', e.target.value)}
                            required
                          />
                          <select aria-label="Val Type"
                            className="form-select"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            value={item.valType}
                            onChange={(e) => handleUpdateConfigRule('additions', idx, 'valType', e.target.value)}
                          >
                            <option value="fixed">Fixed ({currencySymbol()})</option>
                            <option value="percent">Percent (%)</option>
                          </select>
                          <input aria-label="Value"
                            type="number"
                            className="form-input"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => handleUpdateConfigRule('additions', idx, 'value', e.target.value)}
                            required
                            min="0"
                          />
                          <button aria-label="Delete"
                            type="button"
                            className="btn-icon-sm danger"
                            onClick={() => handleRemoveConfigRule('additions', idx)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Deductions Section */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Tax &amp; Benefit Deductions</h4>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => handleAddConfigRule('deductions', 'deduction')}
                      style={{ padding: '2px 8px' }}
                    >
                      <i className="fa-solid fa-plus"></i> Add Deduction
                    </button>
                  </div>

                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                    {configForm.deductions.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--t3)', fontStyle: 'italic' }}>No custom deductions defined.</span>
                    ) : (
                      configForm.deductions.map((item, idx) => (
                        <div key={`deduction-${idx}`} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                          <input aria-label="e.g. Provident Fund"
                            className="form-input"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            placeholder="e.g. Provident Fund"
                            value={item.label}
                            onChange={(e) => handleUpdateConfigRule('deductions', idx, 'label', e.target.value)}
                            required
                          />
                          <select aria-label="Val Type"
                            className="form-select"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            value={item.valType}
                            onChange={(e) => handleUpdateConfigRule('deductions', idx, 'valType', e.target.value)}
                          >
                            <option value="fixed">Fixed ({currencySymbol()})</option>
                            <option value="percent">Percent (%)</option>
                          </select>
                          <input aria-label="Value"
                            type="number"
                            className="form-input"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => handleUpdateConfigRule('deductions', idx, 'value', e.target.value)}
                            required
                            min="0"
                          />
                          <button aria-label="Delete"
                            type="button"
                            className="btn-icon-sm danger"
                            onClick={() => handleRemoveConfigRule('deductions', idx)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowConfigModal(false)}>Cancel</button>
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
