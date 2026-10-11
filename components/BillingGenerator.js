import React, { useMemo, useState } from 'react'
import Dialog from './Dialog'
import { BILLING_FREQUENCIES, buildBillingPreview } from '../lib/billing'
import { localDate } from '../lib/validation'
import { currencySymbol } from '../lib/schoolConfig'

export default function BillingGenerator({ students, fees, classes, onClose, onGenerate }) {
  const [form, setForm] = useState({ frequency:'Monthly', start:localDate(), quantity:1, classId:'all', feeIds:fees.filter(f=>f.status==='active' && f.frequency==='Monthly').map(f=>f.id) })
  const available = fees.filter(f=>f.status==='active' && f.frequency===form.frequency && (form.classId==='all' || (f.classIds||[]).some(id=>String(id)===form.classId)))
  const result = useMemo(()=>{try { return buildBillingPreview(students,fees,form) } catch(error) { return {error:error.message} }},[students,fees,form])
  function change(key,value) {
    const next = {...form,[key]:value}
    if (key==='frequency') { next.start=value==='Hourly' ? `${localDate()}T09:00` : localDate(); next.quantity=1 }
    if (key==='frequency' || key==='classId') next.feeIds=fees.filter(f=>f.status==='active' && f.frequency===next.frequency && (next.classId==='all' || (f.classIds||[]).some(id=>String(id)===next.classId))).map(f=>f.id)
    setForm(next)
  }
  return <Dialog className="modal-overlay"><div className="modal-panel" style={{maxWidth:720}}>
    <div className="modal-header"><div><h3>Generate fee invoices</h3><p>Review actual class rates, student overrides and duplicate skips before saving.</p></div><button className="modal-close" aria-label="Close" onClick={onClose}>×</button></div>
    <form onSubmit={event=>{event.preventDefault(); if (!result.error && result.invoices.length) onGenerate(form)}}>
      <div className="modal-body">
        <label>Frequency<select aria-label="Billing frequency" className="form-select" value={form.frequency} onChange={e=>change('frequency',e.target.value)}>{BILLING_FREQUENCIES.map(f=><option key={f}>{f}</option>)}</select></label>
        <label>Class<select aria-label="Billing class" className="form-select" value={form.classId} onChange={e=>change('classId',e.target.value)}><option value="all">All assigned classes</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}</select></label>
        <label>Period starts<input className="form-input" aria-label="Period starts" type={form.frequency==='Hourly'?'datetime-local':'date'} required value={form.start} onChange={e=>change('start',e.target.value)}/></label>
        <label>Number of {form.frequency==='Hourly'?'hours':'billing units'}<input className="form-input" aria-label="Billing quantity" type="number" min={form.frequency==='Hourly'?'0.01':'1'} max="1000" step={form.frequency==='Hourly'?'0.01':'1'} disabled={form.frequency==='One-Time'} value={form.quantity} onChange={e=>change('quantity',e.target.value)}/></label>
        <p style={{fontSize:12,color:'var(--t2)',margin:'12px 0'}}>Weekly periods start Monday; monthly periods start on day 1; yearly periods use calendar years. Daily fees use calendar days, not attendance. Hourly quantities are entered explicitly. End time is exclusive. One-time fees bill once per student per fee structure.</p>
        <fieldset style={{border:'1px solid var(--border)',padding:12,borderRadius:8}}><legend>Applicable fee structures</legend>{available.length ? available.map(f=><label key={f.id} style={{display:'flex',gap:10,padding:8}}><input type="checkbox" checked={form.feeIds.includes(f.id)} onChange={e=>change('feeIds',e.target.checked?[...form.feeIds,f.id]:form.feeIds.filter(id=>id!==f.id))}/>{f.name} · base {currencySymbol()}{Number(f.amount).toFixed(2)} / unit</label>):<p>No active fees for this frequency/class. Add one in Fee Configurator.</p>}</fieldset>
        {result.error ? <p role="status">{result.error}</p> : <div style={{marginTop:16}}><p>{result.period.label}</p><strong>{result.invoices.length} invoices · {currencySymbol()}{result.total.toFixed(2)}</strong><p>{result.skipped} fee charges skipped because an existing invoice overlaps or already contains the one-time fee. Overlapping periods are skipped in full.</p><div style={{maxHeight:180,overflow:'auto'}}>{result.invoices.map(row=><p key={row.studentId}>{row.studentName}: {row.lines.map(l=>`${l.name} (${l.quantity} × ${l.rate.toFixed(2)})`).join(', ')} = {currencySymbol()}{row.amount.toFixed(2)}</p>)}</div></div>}
      </div><div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!!result.error || !result.invoices?.length}>Generate reviewed invoices</button></div>
    </form>
  </div></Dialog>
}
