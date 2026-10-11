import React, { useMemo, useState } from 'react'
import Dialog from './Dialog'
import { BILLING_FREQUENCIES, buildBillingPreview } from '../lib/billing'
import { effectiveFeeRate } from '../lib/feeLedger'
import { localDate } from '../lib/validation'
import { currencySymbol } from '../lib/schoolConfig'

export default function BillingGenerator({ students, fees, classes, initialStudentId, initialClassId, onClose, onGenerate }) {
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(() => {
    const student = students.find(s => String(s.id) === String(initialStudentId))
    const classId = String(student?.classId || initialClassId || 'all')
    return { scope: initialStudentId || !initialClassId ? 'student' : 'class', studentId: initialStudentId ? String(initialStudentId) : '', frequency:'Monthly', start:localDate(), quantity:1, classId, feeIds:fees.filter(f=>f.status==='active' && f.frequency==='Monthly' && (classId==='all' || (f.classIds||[]).some(id=>String(id)===classId))).map(f=>f.id) }
  })
  const student = form.scope==='student' ? students.find(s=>String(s.id)===form.studentId) : null
  const effectiveClass = student ? String(student.classId) : form.classId
  const available = fees.filter(f=>f.status==='active' && f.frequency===form.frequency && (effectiveClass==='all' || (f.classIds||[]).some(id=>String(id)===effectiveClass)))
  const className = id => { const item=classes.find(c=>String(c.id)===String(id)); return item ? `${item.name} — ${item.section}` : 'Unassigned class' }
  const studentLabel = s => `${s.name} · ${s.admissionNo || `ID ${s.id}`} · ${className(s.classId)}`
  const matches = students.filter(s=>s.status==='active' && (form.classId==='all' || String(s.classId)===form.classId) && (String(s.id)===form.studentId || `${studentLabel(s)} ${s.rollNo || ''}`.toLowerCase().includes(search.trim().toLowerCase())))
  const result = useMemo(()=>{try { return buildBillingPreview(students,fees,form) } catch(error) { return {error:error.message} }},[students,fees,form])
  function change(key,value) {
    const next = {...form,[key]:value}
    if (key==='scope') { next.studentId=''; setSearch('') }
    if (key==='classId') { next.studentId=''; setSearch('') }
    if (key==='frequency') { next.start=value==='Hourly' ? `${localDate()}T09:00` : localDate(); next.quantity=1 }
    if (['frequency','classId','studentId','scope'].includes(key)) {
      const selected = next.scope==='student' ? students.find(s=>String(s.id)===next.studentId) : null
      const targetClass = selected ? String(selected.classId) : next.classId
      next.feeIds=fees.filter(f=>f.status==='active' && f.frequency===next.frequency && (targetClass==='all' || (f.classIds||[]).some(id=>String(id)===targetClass))).map(f=>f.id)
    }
    setForm(next)
  }
  const unit = {Monthly:'months',Yearly:'years',Weekly:'weeks',Daily:'days',Hourly:'hours','One-Time':'billing units'}[form.frequency]
  return <Dialog className="modal-overlay"><div className="modal-panel billing-generator">
    <div className="modal-header"><div><h3>Generate fee invoices</h3><p>Choose a student or class batch, then review the charges.</p></div><button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button></div>
    <form onSubmit={event=>{event.preventDefault(); if (!result.error && result.invoices.length) onGenerate(form)}}>
      <div className="modal-body">
        <div className="billing-generator-grid">
          <label>Generate for<select aria-label="Generate for" className="form-select" value={form.scope} onChange={e=>change('scope',e.target.value)}><option value="student">Individual student</option><option value="class">Class batch</option></select></label>
          <label>Class<select aria-label="Billing class" className="form-select" value={form.classId} onChange={e=>change('classId',e.target.value)}><option value="all">All assigned classes</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}</select></label>
          {form.scope==='student' && <><label>Search students<input type="search" className="form-input" placeholder="Name, admission number or roll number" value={search} onChange={e=>setSearch(e.target.value)}/></label><label>Student<select aria-label="Billing student" className="form-select" required value={form.studentId} onChange={e=>change('studentId',e.target.value)}><option value="">Select a student</option>{matches.map(s=><option key={s.id} value={s.id}>{studentLabel(s)}</option>)}</select>{!matches.length && <small>No matching active students.</small>}</label></>}
          <label>Frequency<select aria-label="Billing frequency" className="form-select" value={form.frequency} onChange={e=>change('frequency',e.target.value)}>{BILLING_FREQUENCIES.map(f=><option key={f}>{f}</option>)}</select></label>
          <label>Number of {unit}<input className="form-input" aria-label="Billing quantity" type="number" required min={form.frequency==='Hourly'?'0.01':'1'} max="1000" step={form.frequency==='Hourly'?'0.01':'1'} disabled={form.frequency==='One-Time'} value={form.quantity} onChange={e=>change('quantity',e.target.value)}/></label>
          <label>Period starts<input className="form-input" aria-label="Period starts" type={form.frequency==='Hourly'?'datetime-local':'date'} required value={form.start} onChange={e=>change('start',e.target.value)}/></label>
        </div>
        <p className="billing-generator-help">Monthly billing starts on day 1; weekly on Monday; yearly on January 1. Daily fees use calendar days. End dates are exclusive. One-time fees bill once per student. Set months to 1, 2, 3 or more to combine them in one invoice per student.</p>
        <fieldset className="billing-generator-fees"><legend>Applicable fees</legend>{available.length ? available.map(f=><label key={f.id}><input type="checkbox" checked={form.feeIds.includes(f.id)} onChange={e=>change('feeIds',e.target.checked?[...form.feeIds,f.id]:form.feeIds.filter(id=>id!==f.id))}/><span>{f.name}<small>{student ? 'Student rate' : effectiveClass==='all' ? 'Base rate' : 'Class rate'}: {currencySymbol()}{Number(student ? effectiveFeeRate(f,student.classId,student.feeOverrides) : effectiveClass==='all' ? f.amount : effectiveFeeRate(f,effectiveClass)).toFixed(2)} / unit</small></span></label>):<p>No active fees for this frequency/class. Add one in Fee Configurator.</p>}</fieldset>
        <section className="billing-generator-preview" aria-label="Invoice preview">
          <h4>Invoice preview</h4>
          {result.error ? <p role="status">{result.error}</p> : <><p className="billing-generator-help">{result.period.label}</p><strong>{result.invoices.length} {result.invoices.length===1?'invoice':'invoices'} · {currencySymbol()}{result.total.toFixed(2)}</strong><p className="billing-generator-help">{result.skipped} duplicate/overlapping charges skipped. Overlapping periods are skipped in full.</p>{result.invoices.map(row=><div className="billing-generator-preview-row" key={row.studentId}><strong>{row.studentName}</strong>{row.lines.map(l=><div key={l.feeId}>{l.name}: {l.quantity} × {currencySymbol()}{l.rate.toFixed(2)} = {currencySymbol()}{l.amount.toFixed(2)}</div>)}<b>Total: {currencySymbol()}{row.amount.toFixed(2)}</b></div>)}</>}
        </section>
      </div><div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!!result.error || !result.invoices?.length}>Generate {result.invoices?.length===1?'invoice':'reviewed invoices'}</button></div>
    </form>
  </div></Dialog>
}
