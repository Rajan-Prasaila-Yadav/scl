import { defaultDueDate } from '../lib/invoiceTiming'
import React, { useState } from 'react'
import { billingPeriodText, billingWindow, billedFeeInvoices, buildBillingPreview } from '../lib/billing'
import { invoiceBalance, effectiveFeeRate } from '../lib/feeLedger'
import { localDate } from '../lib/validation'
import { currencySymbol } from '../lib/schoolConfig'

export default function BillingGenerator({ students, fees, classes, initialStudentId, initialClassId, onClose, onGenerate }) {
  const [search, setSearch] = useState('')
  const [entries, setEntries] = useState({})
  const units = {Monthly:'months',Yearly:'years',Weekly:'weeks',Daily:'days',Hourly:'hours','One-Time':'one-time charge'}
  const entryFor = fee => entries[fee.id] || {selected:true, start:fee.frequency==='Hourly' ? `${localDate()}T09:00` : localDate(), quantity:1}
  const editEntry = (fee,key,value) => setEntries(current=>({...current,[fee.id]:{...entryFor(fee),[key]:value}}))
  const [form, setForm] = useState(() => {
    const student = students.find(s => String(s.id) === String(initialStudentId))
    const classId = String(student?.classId || initialClassId || '')
    return { scope: 'student', studentId: initialStudentId ? String(initialStudentId) : '', classId, dueDate:defaultDueDate() }
  })
  const student = form.scope==='student' ? students.find(s=>String(s.id)===form.studentId) : null
  const effectiveClass = student ? String(student.classId) : form.classId
  const available = student ? fees.filter(f=>f.status==='active' && (effectiveClass==='all' || (f.classIds||[]).some(id=>String(id)===effectiveClass))) : []
  const className = id => { const item=classes.find(c=>String(c.id)===String(id)); return item ? `${item.name} — ${item.section}` : 'Unassigned class' }
  const studentLabel = s => `${s.name} · ${s.admissionNo || `ID ${s.id}`} · ${className(s.classId)}`
  const matches = students.filter(s=>s.status==='active' && (form.classId==='all' || String(s.classId)===form.classId) && (String(s.id)===form.studentId || `${studentLabel(s)} ${s.rollNo || ''}`.toLowerCase().includes(search.trim().toLowerCase())))
  const candidates = available.map(fee => {
    const entry=entryFor(fee)
    let billed=[]
    try { if(student) billed=billedFeeInvoices(student,fee,billingWindow(fee.frequency,entry.start,entry.quantity)) } catch { /* Preview reports invalid dates/quantities. */ }
    return {fee,entry,billed}
  })
  const draft = {...form, items:candidates.filter(row=>row.entry.selected && !row.billed.length).map(({fee,entry})=>({feeId:fee.id,start:entry.start,quantity:entry.quantity}))}
  const result = (()=>{try { return buildBillingPreview(students,fees,draft) } catch(error) { return {error:error.message} }})()
  function change(key,value) {
    const next = {...form,[key]:value}
    if (key==='scope') { next.studentId=''; setSearch('') }
    if (key==='classId') { next.studentId=''; setSearch('') }
    if (key==='classId' || key==='studentId') setEntries({})
    setForm(next)
  }
  return <section className="billing-generator bill-workspace" aria-label="Create student bill">
    <div className="modal-header"><div><h1>Create student bill</h1><p>Select a class → choose a student → add billing periods → review and generate.</p></div><button type="button" className="btn btn-ghost" onClick={onClose}>Back to fee ledger</button></div>
    <form onSubmit={event=>{event.preventDefault(); if (!result.error && result.invoices.length) onGenerate(draft)}}>
      <div className="modal-body">
        <div className="billing-generator-grid">
          <label>Class<select aria-label="Billing class" required className="form-select" value={form.classId} onChange={e=>change('classId',e.target.value)}><option value="">Select a class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}</select></label>
          {form.scope==='student' && <><label>Search students<input type="search" disabled={!form.classId} className="form-input" placeholder="Name, admission number or roll number" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Student<select aria-label="Billing student" disabled={!form.classId} className="form-select" required value={form.studentId} onChange={e=>change('studentId',e.target.value)}><option value="">Select a student</option>{matches.map(s=><option key={s.id} value={s.id}>{studentLabel(s)}</option>)}</select>{form.classId && !matches.length && <small>No matching active students in this class.</small>}</label></>}
          <label>Payment due date<input className="form-input" type="date" aria-label="Payment due date" required value={form.dueDate} onChange={e=>change('dueDate',e.target.value)}/><small>Defaults to 7 days from today; adjust before generating.</small></label>
        </div>
        {!student && <div className="bill-empty"><h3>{form.classId ? 'Choose a student to load their fees' : 'Start by selecting a class'}</h3><p>Only students in the selected class and fees assigned to their class will appear.</p></div>}
        {student && <div className="bill-student-summary"><div><strong>{student.name}</strong><p>{student.admissionNo} · {className(student.classId)}</p></div><div><small>Existing outstanding balance</small><strong>{currencySymbol()}{(student.payments || []).reduce((sum,invoice)=>sum+invoiceBalance(invoice),0).toFixed(2)}</strong><small>Separate from this new bill</small></div></div>}
        {student && <div className="bill-workspace-columns"><div>
        <p className="billing-generator-help">Build one bill with different fee frequencies. Each item has its own period and quantity: rate × months, weeks, days, hours or years. Monthly periods start on day 1, weekly on Monday, yearly on January 1. End dates are exclusive.</p>
        <fieldset className="billing-generator-fees"><legend>New bill items</legend>
          {candidates.filter(row=>!row.billed.length).map(({fee,entry})=><div className="mixed-bill-item" key={fee.id}>
            <label><input type="checkbox" checked={entry.selected} onChange={e=>editEntry(fee,'selected',e.target.checked)}/><span>{fee.name}<small>{fee.frequency} · {currencySymbol()}{Number(student ? effectiveFeeRate(fee,student.classId,student.feeOverrides) : effectiveClass==='all' ? fee.amount : effectiveFeeRate(fee,effectiveClass)).toFixed(2)} / unit{!student && effectiveClass==='all' ? ' (base; actual student rates in preview)' : ''}</small></span></label>
            <div className="billing-generator-grid">
              <label>Period starts<input className="form-input" aria-label={`${fee.name} period starts`} type={fee.frequency==='Hourly'?'datetime-local':'date'} required={entry.selected} value={entry.start} onChange={e=>editEntry(fee,'start',e.target.value)}/></label>
              <label>Number of {units[fee.frequency]}<input className="form-input" aria-label={`${fee.name} quantity`} type="number" required={entry.selected} min={fee.frequency==='Hourly'?'.01':'1'} max="1000" step={fee.frequency==='Hourly'?'.01':'1'} disabled={fee.frequency==='One-Time'} value={entry.quantity} onChange={e=>editEntry(fee,'quantity',e.target.value)}/></label>
            </div>
          </div>)}
          {!candidates.some(row=>!row.billed.length) && <p>No new fees available for these periods.</p>}
        </fieldset>
        {candidates.some(row=>row.billed.length) && <details className="billing-generator-fees"><summary>Already billed — excluded from new bill ({candidates.filter(row=>row.billed.length).length})</summary><p className="billing-generator-help">Collect outstanding amounts from the existing invoice. Paid items stay in history. Choose a later period here to bill a new year/month; one-time fees cannot repeat.</p>{candidates.filter(row=>row.billed.length).map(({fee,entry,billed})=><div className="mixed-bill-item" key={fee.id}><strong>{fee.name}</strong>{billed.map(invoice=><p key={invoice.id || invoice.invoiceNo}>{invoice.invoiceNo || 'Existing invoice'} · {invoice.status==='paid'?'Paid':invoice.status==='partial'?'Partially paid — collect remaining balance':'Already billed — collect existing invoice'}</p>)}{fee.frequency!=='One-Time' && <label>Next period starts<input className="form-input" aria-label={`${fee.name} next period starts`} type={fee.frequency==='Hourly'?'datetime-local':'date'} value={entry.start} onChange={e=>editEntry(fee,'start',e.target.value)}/></label>}</div>)}</details>}
        </div><section className="billing-generator-preview" aria-label="Invoice preview">
          <h2>Bill preview</h2><p>Payment due: {form.dueDate || 'Choose a date'}</p><p>{student?.name} · {student?.admissionNo}</p>
          {result.error ? <p role="status">{result.error}</p> : <><p className="billing-generator-help">{result.period.label}</p><strong>{result.invoices.length} {result.invoices.length===1?'invoice':'invoices'} · {currencySymbol()}{result.total.toFixed(2)}</strong><p className="billing-generator-help">{result.skipped} duplicate/overlapping charges skipped. Overlapping periods are skipped in full.</p>{result.invoices.map(row=><div className="billing-generator-preview-row" key={row.studentId}><strong>{row.studentName}</strong><div className="bill-table-scroll"><table className="bill-preview-table"><thead><tr><th>Item / period</th><th>Rate</th><th>Qty</th><th>Amount</th></tr></thead><tbody>{row.lines.map(l=><tr key={l.feeId}><td><strong>{l.name}</strong><small>{l.frequency} · {billingPeriodText(l.periodStart)} → {billingPeriodText(l.periodEnd)}</small></td><td>{currencySymbol()}{l.rate.toFixed(2)}</td><td>{l.quantity}</td><td>{currencySymbol()}{l.amount.toFixed(2)}</td></tr>)}</tbody></table></div><b>Total: {currencySymbol()}{row.amount.toFixed(2)}</b></div>)}</>}
        </section></div>}
      </div><div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!!result.error || !result.invoices?.length}>Generate student bill</button></div>
    </form>
  </section>
}
