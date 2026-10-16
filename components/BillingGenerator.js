import CalendarDateInput from './CalendarDateInput'
import {calendarDateLabel} from '../lib/calendar'
import { academicBillingYears, academicYearRange, invoiceYear } from '../lib/academicBilling'
import { invoiceTiming, defaultDueDate } from '../lib/invoiceTiming'
import React, { useState } from 'react'
import { assignedBillingWindow, monthlyCoverage, paymentTotals, billingPeriodText, billingWindow, billedFeeInvoices, buildBillingPreview } from '../lib/billing'
import { invoiceBalance, effectiveFeeRate } from '../lib/feeLedger'
import { localDate } from '../lib/validation'
import { currencySymbol } from '../lib/schoolConfig'

export default function BillingGenerator({ students, fees, classes, initialStudentId, initialClassId, initialAcademicYear, onClose, onGenerate }) {
  const years=academicBillingYears()
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState({})
  const [adjustments,setAdjustments]=useState({discountType:'none',customDiscount:'',taxType:'none',customTax:'',penaltyType:'none',customPenalty:''})
  const units = {Monthly:'months',Yearly:'years',Weekly:'weeks',Daily:'days',Hourly:'hours','One-Time':'one-time charge'}
  const entryFor = fee => entries[fee.id] || {selected:!(student && fee.frequency==='Monthly' && monthlyCoverage(student,fee,form.academicYear)?.remaining===0), start:(student && fee.frequency==='Monthly' ? monthlyCoverage(student,fee,form.academicYear)?.nextStart : null) || (student && fee.classStarts?.[student.classId]?.[form.academicYear] ? (fee.frequency==='Hourly' ? `${fee.classStarts[student.classId][form.academicYear]}T09:00` : fee.classStarts[student.classId][form.academicYear]) : null) || (fee.frequency==='Hourly' ? `${localDate()}T09:00` : localDate()), quantity:1}
  const editEntry = (fee,key,value) => setEntries(current=>({...current,[fee.id]:{...entryFor(fee),[key]:value}}))
  const [form, setForm] = useState(() => {
    const student = students.find(s => String(s.id) === String(initialStudentId))
    const classId = String(student?.classId || initialClassId || '')
    return { scope: 'student', studentId: initialStudentId ? String(initialStudentId) : '', classId, academicYear:years.years.includes(initialAcademicYear)?initialAcademicYear:years.active, dueDate:defaultDueDate() }
  })
  const calendar=academicYearRange(form.academicYear).calendar || 'AD'
  const student = form.scope==='student' ? students.find(s=>String(s.id)===form.studentId) : null
  const effectiveClass = student ? String(student.classId) : form.classId
  const available = student ? fees.filter(f=>f.status==='active' && f.classStatuses?.[student.classId]?.[form.academicYear]!=='inactive' && (effectiveClass==='all' || (f.classIds||[]).some(id=>String(id)===effectiveClass))) : []
  const className = id => { const item=classes.find(c=>String(c.id)===String(id)); return item ? `${item.name} — ${item.section}` : 'Unassigned class' }
  const studentLabel = s => `${s.name} · ${s.admissionNo || `ID ${s.id}`} · ${className(s.classId)}`
  const matches = students.filter(s=>s.status==='active' && (form.classId==='all' || String(s.classId)===form.classId) && (String(s.id)===form.studentId || `${studentLabel(s)} ${s.rollNo || ''}`.toLowerCase().includes(search.trim().toLowerCase())))
  const candidates = available.map(fee => {
    const entry=entryFor(fee)
    let billed=[]
    try { if(student) billed=billedFeeInvoices(student,fee,assignedBillingWindow(student,fee,form.academicYear,entry.start,entry.quantity)) } catch { /* Preview reports invalid dates/quantities. */ }
    return {fee,entry,billed,coverage:fee.frequency==='Monthly' ? monthlyCoverage(student,fee,form.academicYear) : null}
  })
  const draft = {...form, adjustments, items:candidates.filter(row=>row.entry.selected && !row.billed.length).map(({fee,entry})=>({feeId:fee.id,start:entry.start,quantity:entry.quantity}))}
  const result = (()=>{try { const missing=candidates.find(row=>row.entry.selected && row.fee.frequency==='Monthly' && !row.coverage); if(missing) throw new Error(`Set the class activation date for ${missing.fee.name} in Fee Configurator.`); const invalid=candidates.find(row=>row.entry.selected && row.coverage && Number(row.entry.quantity)>row.coverage.contiguous); if(invalid) throw new Error(`${invalid.fee.name}: only ${invalid.coverage.remaining} months left in this class fee year; ${invalid.coverage.contiguous} consecutive months can be billed now. Collect unpaid months from existing invoices.`); return buildBillingPreview(students,fees,draft) } catch(error) { return {error:error.message} }})()
  const billTotals=paymentTotals(result.total || 0,adjustments)
  function change(key,value) {
    const next = {...form,[key]:value}
    if (key==='scope') { next.studentId=''; setSearch('') }
    if (key==='classId') { next.studentId=''; setSearch('') }
    if (key==='classId' || key==='studentId' || key==='academicYear') setEntries({})
    setForm(next)
  }
  return <section className="billing-generator bill-workspace" aria-label="Create student bill">
    <div className="modal-header"><div><h1>Create student bill</h1><p>Select a class → choose a student → add billing periods → review and generate.</p></div><button type="button" className="btn btn-ghost" onClick={onClose}>Back to fee ledger</button></div>
    <form onSubmit={event=>{event.preventDefault(); if (!result.error && !billTotals.error && result.invoices.length) onGenerate(draft)}}>
      <div className="modal-body">
        <div className="billing-generator-grid">
          <label>Academic year<select className="form-select" aria-label="Billing academic year" value={form.academicYear} onChange={e=>change('academicYear',e.target.value)}>{years.years.map(year=><option key={year}>{year}</option>)}</select><small>Add academic years in Settings.</small></label>
          <label>Class<select aria-label="Billing class" required className="form-select" value={form.classId} onChange={e=>change('classId',e.target.value)}><option value="">Select a class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}</select></label>
          {form.scope==='student' && <><label>Search students<input type="search" disabled={!form.classId} className="form-input" placeholder="Name, admission number or roll number" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Student<select aria-label="Billing student" disabled={!form.classId} className="form-select" required value={form.studentId} onChange={e=>change('studentId',e.target.value)}><option value="">Select a student</option>{matches.map(s=><option key={s.id} value={s.id}>{studentLabel(s)}</option>)}</select>{form.classId && !matches.length && <small>No matching active students in this class.</small>}</label></>}
          <label>Payment due date<CalendarDateInput calendar={calendar} className="form-input" aria-label="Payment due date" required value={form.dueDate} onChange={value=>change('dueDate',value)}/><small>Defaults to 7 days from today; adjust before generating.</small></label>
        </div>
        {!student && <div className="bill-empty"><h3>{form.classId ? 'Choose a student to load their fees' : 'Start by selecting a class'}</h3><p>Only students in the selected class and fees assigned to their class will appear.</p></div>}
        {student && <div className="bill-student-summary"><div><strong>{student.name}</strong><p>{student.admissionNo} · {className(student.classId)}</p></div><div><small>Existing outstanding balance</small><strong>{currencySymbol()}{(student.payments || []).reduce((sum,invoice)=>sum+invoiceBalance(invoice),0).toFixed(2)}</strong><small>Separate from this new bill</small></div></div>}
        {student && <details className="billing-generator-fees"><summary>Existing bills: paid, pending and balances</summary><div className="table-wrap"><table className="roles-table"><thead><tr><th>Year / invoice</th><th>Period</th><th>Status</th><th>Remaining</th></tr></thead><tbody>{(student.payments || []).map(invoice=><tr key={invoice.id}><td>{invoiceYear(invoice)} · {invoice.invoiceNo}</td><td>{billingPeriodText(invoice.month)}</td><td>{invoice.status}<br/>{invoiceTiming(invoice).label}</td><td>{currencySymbol()}{invoiceBalance(invoice).toFixed(2)}</td></tr>)}</tbody></table></div></details>}
        {student && <div className="bill-workspace-columns"><div>
        <p className="billing-generator-help">Build one bill with different fee frequencies. Monthly fees start at the first unbilled month of the class activation year and cannot exceed its 12-month window. One-time and yearly quantities are always 1. Other recurring fees use their own units. Monthly periods start on day 1 of the selected academic calendar; yearly fees use the class activation range when configured, otherwise its first calendar month. Weekly periods start Monday. Hourly input uses AD dates. End dates are exclusive.</p>
        <fieldset className="billing-generator-fees"><legend>New bill items</legend>
          {candidates.filter(row=>!row.billed.length).map(({fee,entry,coverage})=><div className="mixed-bill-item" key={fee.id}>
            <label><input type="checkbox" disabled={coverage?.remaining===0} checked={entry.selected} onChange={e=>editEntry(fee,'selected',e.target.checked)}/><span>{fee.name}<small>{fee.frequency} · {currencySymbol()}{Number(student ? effectiveFeeRate(fee,student.classId,student.feeOverrides) : effectiveClass==='all' ? fee.amount : effectiveFeeRate(fee,effectiveClass)).toFixed(2)} / unit{!student && effectiveClass==='all' ? ' (base; actual student rates in preview)' : ''}</small></span></label>
            {coverage && <p>{calendarDateLabel(coverage.start,calendar)} to {calendarDateLabel(coverage.months[coverage.months.length-1]?.start,calendar)}: {coverage.paid} months paid; {coverage.billed-coverage.paid} billed but not fully paid; {coverage.remaining} months left to bill. {coverage.contiguous} consecutive months available from the next start.</p>}
            {fee.frequency==='Monthly' && !coverage && <p role="alert">Set this class fee activation date for {form.academicYear} in Fee Configurator before billing.</p>}
            <div className="billing-generator-grid">
              <label>Period starts{fee.frequency==='Hourly' ? <input className="form-input" aria-label={`${fee.name} period starts`} type="datetime-local" value={entry.start} onChange={e=>editEntry(fee,'start',e.target.value)}/> : <CalendarDateInput calendar={calendar} className="form-input" aria-label={`${fee.name} period starts`} disabled={!!coverage} required={entry.selected} value={entry.start} onChange={value=>editEntry(fee,'start',value)}/>}</label>
              <label>Number of {units[fee.frequency]}<input className="form-input" aria-label={`${fee.name} quantity`} type="number" required={entry.selected} min={fee.frequency==='Hourly'?'.01':'1'} max={coverage?Math.max(1,coverage.contiguous):"1000"} step={fee.frequency==='Hourly'?'.01':'1'} disabled={['One-Time','Yearly'].includes(fee.frequency)} value={entry.quantity} onChange={e=>editEntry(fee,'quantity',e.target.value)}/></label>
            </div>
          </div>)}
          {!candidates.some(row=>!row.billed.length) && <p>No new fees available for these periods.</p>}
        </fieldset>
        {candidates.some(row=>row.billed.length) && <details className="billing-generator-fees"><summary>Already billed — excluded from new bill ({candidates.filter(row=>row.billed.length).length})</summary><p className="billing-generator-help">Collect outstanding amounts from the existing invoice. Paid items stay in history. Choose a later period here to bill a new year/month; one-time fees cannot repeat.</p>{candidates.filter(row=>row.billed.length).map(({fee,entry,billed})=><div className="mixed-bill-item" key={fee.id}><strong>{fee.name}</strong>{billed.map(invoice=><p key={invoice.id || invoice.invoiceNo}>{invoice.invoiceNo || 'Existing invoice'} · {invoice.status==='paid'?'Paid':invoice.status==='partial'?'Partially paid — collect remaining balance':'Already billed — collect existing invoice'}</p>)}{fee.frequency!=='One-Time' && <label>Next period starts{fee.frequency==='Hourly' ? <input className="form-input" aria-label={`${fee.name} next period starts`} type="datetime-local" value={entry.start} onChange={e=>editEntry(fee,'start',e.target.value)}/> : <CalendarDateInput calendar={calendar} className="form-input" aria-label={`${fee.name} next period starts`} value={entry.start} onChange={value=>editEntry(fee,'start',value)}/>}</label>}</div>)}</details>}
        </div><section className="billing-generator-preview" aria-label="Invoice preview">
          <h2>Bill preview</h2><div className="billing-generator-grid">{['discount','tax','penalty'].map(kind=><label key={kind}>{kind.charAt(0).toUpperCase()+kind.slice(1)}<select className="form-select" aria-label={`Bill ${kind} type`} value={adjustments[`${kind}Type`]} onChange={e=>setAdjustments({...adjustments,[`${kind}Type`]:e.target.value})}><option value="none">None</option><option value="customPercent">Percentage</option><option value="customAmount">Fixed amount</option></select>{adjustments[`${kind}Type`]!=='none' && <input className="form-input" aria-label={`Bill ${kind} value`} type="number" min="0" step="0.01" required value={adjustments[`custom${kind.charAt(0).toUpperCase()+kind.slice(1)}`]} onChange={e=>setAdjustments({...adjustments,[`custom${kind.charAt(0).toUpperCase()+kind.slice(1)}`]:e.target.value})}/>}</label>)}</div><p className="billing-generator-help">Student concessions are included in item rates. Additional bill discount applies to the subtotal. Percentage tax and penalty apply to the discounted subtotal. Penalty is added after tax.</p>{billTotals.error && <p role="alert">{billTotals.error}</p>}<p>Academic year: {form.academicYear}</p><p>Payment due: {form.dueDate ? calendarDateLabel(form.dueDate,calendar) : 'Choose a date'}</p><p>{student?.name} · {student?.admissionNo}</p>
          {result.error ? <p role="status">{result.error}</p> : <><p className="billing-generator-help">{result.period.label}</p><strong>{result.invoices.length} {result.invoices.length===1?'invoice':'invoices'} · {currencySymbol()}{result.total.toFixed(2)}</strong><p className="billing-generator-help">{result.skipped} duplicate/overlapping charges skipped. Overlapping periods are skipped in full.</p>{result.invoices.map(row=><div className="billing-generator-preview-row" key={row.studentId}><strong>{row.studentName}</strong><div className="bill-table-scroll"><table className="bill-preview-table"><thead><tr><th>Item / period</th><th>Rate</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{row.lines.map(l=><tr key={l.feeId}><td><strong>{l.name}</strong><small>{l.frequency} · {calendarDateLabel(l.periodStart,l.calendar)} → {calendarDateLabel(l.periodEnd,l.calendar)}</small></td><td>{currencySymbol()}{l.rate.toFixed(2)}</td><td>{l.quantity}</td><td>{currencySymbol()}{l.amount.toFixed(2)}</td></tr>)}</tbody></table></div><b>Subtotal: {currencySymbol()}{row.amount.toFixed(2)}</b></div>)}</>}
          <p>Discount: {currencySymbol()}{billTotals.discount.toFixed(2)} · Tax: {currencySymbol()}{billTotals.tax.toFixed(2)} · Penalty: {currencySymbol()}{Number(billTotals.penalty || 0).toFixed(2)}</p><h3>Invoice total: {currencySymbol()}{billTotals.grandTotal.toFixed(2)}</h3>
        </section></div>}
      </div><div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!!result.error || !!billTotals.error || !result.invoices?.length}>Generate student bill</button></div>
    </form>
  </section>
}
