import React, { useState } from 'react'
import Link from 'next/link'
import Dialog from './Dialog'
import { currencySymbol } from '../lib/schoolConfig'
import { canPerform, requirePermission } from '../lib/permissions'
import { writeStoredList } from '../lib/academicData'
import { money } from '../lib/billing'

export const assignedToClass = (fee, classId) => (fee.classIds || []).some(id => String(id) === String(classId))
const classRate = (fee, id) => fee.classRates?.[id] !== undefined && fee.classRates[id] !== '' ? Number(fee.classRates[id]) : Number(fee.amount)

export default function ClassFees({ classroom, fees, onSaved }) {
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const assigned = fees.filter(f => assignedToClass(f, classroom.id))
  const totals = assigned.filter(f => f.status === 'active').reduce((result, fee) => ({...result, [fee.frequency]: money((result[fee.frequency] || 0) + classRate(fee, classroom.id))}), {})
  const edit = () => {
    if (!requirePermission('edit', 'Fees')) return
    setError('')
    setDraft(Object.fromEntries(fees.map(f => [f.id, {assigned: assignedToClass(f, classroom.id), rate: f.classRates?.[classroom.id] ?? ''}])))
  }
  const save = event => {
    event.preventDefault()
    if (!requirePermission('edit', 'Fees')) return
    if (Object.values(draft).some(item => item.assigned && item.rate !== '' && (!Number.isFinite(Number(item.rate)) || Number(item.rate) < 0))) {setError('Enter a valid nonnegative class rate, or leave it blank for the base rate.'); return}
    const updated = fees.map(fee => {
      const item = draft[fee.id]
      const ids = (fee.classIds || []).filter(id => String(id) !== String(classroom.id))
      const rates = {...fee.classRates}
      delete rates[classroom.id]
      if (item.assigned && item.rate !== '') rates[classroom.id] = money(item.rate)
      return {...fee, classIds: item.assigned ? [...ids, classroom.id] : ids, classRates: rates}
    })
    if (!writeStoredList('educore.fees', updated)) {setError('Fees were not saved. Resolve the storage notice and try again.'); return}
    onSaved(updated)
    setDraft(null)
  }
  return <section className="class-fees">
    <div className="class-fees-heading">
      <div><h3>Fees for {classroom.name} {classroom.section}</h3><p className="class-fees-count">{assigned.length} assigned fees <span aria-hidden="true">·</span> {assigned.filter(f => f.status === 'active').length} active</p></div>
      <div className="class-fees-actions">
        {canPerform('edit', 'Fees') && <button type="button" className="btn btn-primary" onClick={edit}><i className="fa-solid fa-sliders" aria-hidden="true"/>Manage class fees</button>}
        <Link href="/fees" className="btn btn-ghost"><i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"/>Fee Configurator</Link>
      </div>
    </div>
    <p className="class-fees-note"><i className="fa-solid fa-circle-info" aria-hidden="true"/><span>Rates are per student per billing unit. Student overrides can change the final invoice. Existing invoices keep their original amounts.</span></p>
    {assigned.length ? <div className="table-wrap"><table className="roles-table"><thead><tr><th>Fee</th><th>Frequency</th><th>Base rate</th><th>Class rate</th><th>Status</th></tr></thead><tbody>{assigned.map(fee => <tr key={fee.id}><td>{fee.name}</td><td>{fee.frequency}</td><td>{currencySymbol()}{Number(fee.amount).toFixed(2)}</td><td>{currencySymbol()}{classRate(fee,classroom.id).toFixed(2)} {fee.classRates?.[classroom.id] !== undefined && fee.classRates[classroom.id] !== '' ? '(class override)' : '(base)'}</td><td><span className={`badge ${fee.status === 'active' ? 'badge-active' : 'badge-gray'}`}>{fee.status === 'active' ? 'Active' : 'Inactive'}</span></td></tr>)}</tbody></table></div> : <p>No fees assigned to this class yet.</p>}
    <div className="class-fees-summary"><h4>Active totals by frequency</h4><div className="class-fees-total-grid">
      {Object.entries(totals).map(([frequency, total]) => <div className="class-fees-total" key={frequency}><span>{frequency}</span><strong>{currencySymbol()}{total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</strong><small>per student / unit</small></div>)}
      {!Object.keys(totals).length && <p>No active charges.</p>}
    </div></div>
    {draft && <Dialog className="modal-overlay"><div className="modal class-fees-modal"><h3>Manage fees for {classroom.name} {classroom.section}</h3><p>Select fee assignments and change rates for this class only. Blank uses the base rate; zero is a free class rate. Unchecking removes this class assignment. Inactive fees do not generate invoices.</p><form onSubmit={save}>
      {fees.map(fee => <div key={fee.id} style={{padding:12,borderBottom:'1px solid var(--border)'}}><label style={{display:'flex',gap:8}}><input type="checkbox" checked={draft[fee.id].assigned} onChange={e => setDraft({...draft,[fee.id]:{...draft[fee.id],assigned:e.target.checked}})}/>{fee.name} · {fee.frequency} · {fee.status}</label><label>Class rate ({currencySymbol()})<input className="form-input" aria-label={`Class rate for ${fee.name}`} type="number" min="0" step="0.01" disabled={!draft[fee.id].assigned} placeholder={`Base ${fee.amount}`} value={draft[fee.id].rate} onChange={e => setDraft({...draft,[fee.id]:{...draft[fee.id],rate:e.target.value}})}/></label></div>)}
      {!fees.length && <p>Create a fee in Fee Configurator first.</p>}{error && <p role="alert">{error}</p>}<div className="class-fees-modal-actions"><button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary" disabled={!fees.length} type="submit">Save class fees</button></div>
    </form></div></Dialog>}
  </section>
}
