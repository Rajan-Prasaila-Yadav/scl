import React, { useState } from 'react'
import Link from 'next/link'
import { currencySymbol } from '../lib/schoolConfig'
import { invoiceRows, ledgerTotals, effectiveFeeRate, invoiceBalance } from '../lib/feeLedger'
export default function FeeCollectionLedger({ students, fees = [], student, classId }) {
  const [search,setSearch] = useState('')
  const [status,setStatus] = useState('all')
  const [sort,setSort] = useState('latest')
  const people = student ? [student] : students.filter(s => String(s.classId) === String(classId))
  const rows = invoiceRows(people)
  const totals = ledgerTotals(rows)
  const context = student ? `studentId=${student.id}&fromStudent=${student.id}` : `collectionClass=${classId}&fromClass=${classId}`
  const visible = rows.filter(r => (status === 'all' || r.status === status) && `${r.studentName} ${r.invoiceNo} ${r.month}`.toLowerCase().includes(search.toLowerCase().trim())).sort((a,b) => sort === 'amount' ? b.invoiceAmount-a.invoiceAmount : Number(b.id)-Number(a.id))
  const money = value => `${currencySymbol()}${Number(value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`
  return <section className="class-fees">
    <div className="class-fees-heading"><div><h3>Student invoices & collections</h3><p className="class-fees-count">Collected: {money(totals.collected)} · Outstanding: {money(totals.outstanding)}</p></div><Link className="btn btn-primary" href={`/fees?${context}`}>Collect fees / view ledger</Link></div>
    {student && <><h4>Current applicable fee rates</h4><p className="class-fees-note">Rates below apply to new invoices. Issued invoices retain their original amounts.</p><div className="table-wrap"><table className="roles-table"><thead><tr><th>Fee</th><th>Frequency</th><th>Class rate</th><th>Student rate</th></tr></thead><tbody>{fees.filter(f=>f.status==='active' && (f.classIds || []).some(id=>String(id)===String(student.classId))).map(f=><tr key={f.id}><td>{f.name}</td><td>{f.frequency}</td><td>{money(effectiveFeeRate(f,student.classId))}</td><td>{money(effectiveFeeRate(f,student.classId,student.feeOverrides))}</td></tr>)}</tbody></table></div></>}
    <div className="fee-config-filters"><input className="form-input" aria-label="Search collection invoices" placeholder="Search student, invoice or period" value={search} onChange={e=>setSearch(e.target.value)}/><select className="form-select" aria-label="Collection status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="overdue">Overdue</option><option value="paid">Paid</option><option value="partial">Partially paid</option></select><select className="form-select" aria-label="Collection sort" value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">Latest first</option><option value="amount">Invoice amount: high first</option></select></div>
    <div className="table-wrap" style={{marginTop:16}}><table className="roles-table"><thead><tr><th>Student / invoice</th><th>Period</th><th>Invoice subtotal</th><th>Collected</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead><tbody>{visible.map(r=><tr key={`${r.studentId}-${r.id}`}><td>{r.studentName}<br/>{r.invoiceNo}</td><td>{r.month}</td><td>{money(r.invoiceAmount)}</td><td>{money(r.amountPaid || 0)}</td><td>{money(invoiceBalance(r))}</td><td>{r.status === 'partial' ? 'Partially paid' : r.status}</td><td><Link className="btn btn-ghost btn-sm" href={`/fees?${context}&invoice=${encodeURIComponent(r.invoiceNo || '')}`}>{r.status==='paid'?'View receipt':'Collect payment'}</Link></td></tr>)}</tbody></table></div>
    {!visible.length && <p>No invoices match. Generate invoices in Fee Management before collecting payment.</p>}
    <p className="class-fees-count">Collection uses the same Fee Management form for payer details, discounts, tax and receipts.</p>
  </section>
}
