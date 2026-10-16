import { academicBillingYears, invoiceYear } from '../lib/academicBilling'
import { invoiceTiming, matchesInvoiceStatus } from '../lib/invoiceTiming'
import useBillingToday from './useBillingToday'
import React, { useState } from 'react'
import Link from 'next/link'
import { studentFeeStatement } from '../lib/studentFeeStatement'
import { printStudentStatement } from '../lib/printStudentStatement'
import { currencySymbol } from '../lib/schoolConfig'
import { billingPeriodText } from '../lib/billing'
import { invoiceDue, invoiceBalance, effectiveFeeRate } from '../lib/feeLedger'

export default function StudentFeeStatement({student, classroom, fees = []}) {
  const billingDay=useBillingToday()
  const [search,setSearch]=useState('')
  const [year,setYear]=useState('all')
  const [status,setStatus]=useState('all')
  const statement=studentFeeStatement(student)
  const money=n=>`${currencySymbol()}${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`
  const statusText=value=>value==='partial'?'Partially paid':value
  const context=`studentId=${student.id}&fromStudent=${student.id}`
  const visible=statement.invoices.filter(row=>matchesInvoiceStatus(row,status,billingDay)&&(year==='all'||invoiceYear(row)===year)&&`${row.invoiceNo} ${billingPeriodText(row.month)}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <section className="student-fee-statement">
    <div className="class-fees-heading"><div><h3>Student fee statement</h3><p>{student.name} · {student.admissionNo || 'No admission number'} · {classroom}</p></div><div className="statement-actions"><button className="btn btn-ghost" onClick={()=>printStudentStatement(student,classroom,statement)}>Print full statement</button><Link className="btn btn-primary" href={`/fees?view=bill&${context}`}>Create bill</Link></div></div>
    <div className="statement-totals">{[['Total billed',statement.totals.billed],['Total collected',statement.totals.collected],['Remaining balance',statement.totals.balance]].map(([label,amount])=><div key={label}><small>{label}</small><strong>{money(amount)}</strong></div>)}</div>
    <p className="class-fees-note">Totals cover all invoices, including recorded discounts and taxes. Filters below only change the invoice list.</p>
    <details><summary>Current applicable fee rates</summary><p className="class-fees-note">These rates apply to new bills; existing invoices retain their issued amounts.</p><div className="table-wrap"><table className="roles-table"><thead><tr><th>Fee</th><th>Frequency</th><th>Class rate</th><th>Student rate</th></tr></thead><tbody>{fees.filter(f=>f.status==='active' && (f.classIds || []).some(id=>String(id)===String(student.classId))).map(f=><tr key={f.id}><td>{f.name}</td><td>{f.frequency}</td><td>{money(effectiveFeeRate(f,student.classId))}</td><td>{money(effectiveFeeRate(f,student.classId,student.feeOverrides))}</td></tr>)}</tbody></table></div></details>
    <h4>Balances by academic year</h4><div className="table-wrap"><table className="roles-table"><thead><tr><th>Academic year</th><th>Outstanding</th></tr></thead><tbody>{[...new Set(statement.invoices.map(invoiceYear))].map(y=><tr key={y}><td>{y}{y===academicBillingYears().active?' (current)':''}</td><td>{money(statement.invoices.filter(r=>invoiceYear(r)===y).reduce((sum,r)=>sum+invoiceBalance(r),0))}</td></tr>)}</tbody></table></div>
    <h4>Invoices</h4><div className="fee-config-filters"><select className="form-select" aria-label="Statement academic year" value={year} onChange={e=>setYear(e.target.value)}><option value="all">All academic years</option>{[...new Set(statement.invoices.map(invoiceYear))].map(y=><option key={y}>{y}</option>)}</select><input className="form-input" aria-label="Search statement invoices" placeholder="Search invoice or period" value={search} onChange={e=>setSearch(e.target.value)}/><select className="form-select" aria-label="Statement invoice status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select></div>
    <div className="table-wrap"><table className="roles-table"><thead><tr><th>Invoice / period</th><th>Total due</th><th>Collected</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(row=><tr key={row.id}><td><strong>{row.invoiceNo}</strong><br/>{invoiceYear(row)}<br/>{billingPeriodText(row.month)}<div className={invoiceTiming(row,billingDay).overdue?'invoice-overdue':'invoice-due'}>{invoiceTiming(row,billingDay).label}</div></td><td>{money(invoiceDue(row))}</td><td>{money(row.amountPaid || 0)}</td><td>{money(invoiceBalance(row))}</td><td>{statusText(row.status)}</td><td><Link className="btn btn-ghost btn-sm" href={`/fees?${context}&invoice=${encodeURIComponent(row.invoiceNo || '')}`}>{row.status==='paid'?'View invoice / receipts':'Collect payment'}</Link></td></tr>)}</tbody></table></div>
    {!visible.length&&<p>No invoices match this selection.</p>}
    <h4>Billed periods and fee items</h4><p className="class-fees-note">These periods are already invoiced. Pending or partial invoices still need payment; their items must not be billed again.</p>
    <div className="table-wrap"><table className="roles-table"><thead><tr><th>Fee</th><th>Frequency / quantity</th><th>Covered period</th><th>Invoice</th><th>Invoice status</th></tr></thead><tbody>{statement.coverage.map(row=><tr key={row.key}><td>{row.fee}</td><td>{row.frequency} · {row.quantity}</td><td>{row.period}</td><td>{row.invoiceNo}</td><td>{statusText(row.status)}</td></tr>)}</tbody></table></div>
    {!statement.coverage.length&&<p>No billed periods yet.</p>}
    <h4>Payment history</h4><div className="table-wrap"><table className="roles-table"><thead><tr><th>Receipt / invoice</th><th>Payment timestamp</th><th>Payer / relationship</th><th>Method / collector</th><th>Paid</th><th>Action</th></tr></thead><tbody>{statement.payments.map(row=><tr key={row.key}><td>{row.receiptNo}<br/>{row.invoiceNo}</td><td>{row.paymentDate || 'Not recorded'}</td><td>{row.paidBy || 'Not recorded'} / {row.payerRelation || 'Not recorded'}</td><td>{row.paymentMode} {row.onlineApp}<br/>{row.collectorName || row.receivedBy || 'Not recorded'}</td><td>{money(row.amountPaid)}</td><td><button className="btn btn-ghost btn-sm" onClick={()=>printStudentStatement(student,classroom,statement,row)}>Print receipt</button></td></tr>)}</tbody></table></div>
    {!statement.payments.length&&<p>No payments recorded yet.</p>}
  </section>
}
