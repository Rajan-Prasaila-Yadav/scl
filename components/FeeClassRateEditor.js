import React, { useState } from 'react'
import { currencySymbol } from '../lib/schoolConfig'
export default function FeeClassRateEditor({ fee, classroom, onSave }) {
  const [assigned, setAssigned] = useState((fee.classIds || []).some(id => String(id) === String(classroom.id)))
  const [rate, setRate] = useState(fee.classRates?.[classroom.id] ?? '')
  const [message, setMessage] = useState('')
  function save(event) {
    event.preventDefault()
    if (rate !== '' && (!Number.isFinite(Number(rate)) || Number(rate) < 0)) {setMessage('Enter a nonnegative rate or leave blank for base.'); return}
    if (onSave(assigned, rate)) setMessage('Class fee saved.')
    else setMessage('Could not save. Review the storage notice.')
  }
  return <form onSubmit={save} className="fee-class-editor">
    <label><input type="checkbox" checked={assigned} onChange={e => {setAssigned(e.target.checked);setMessage('')}}/> Assigned to {classroom.name} {classroom.section}</label>
    <label>Class rate ({currencySymbol()})<input className="form-input" aria-label={`Class rate for ${fee.name}`} type="number" min="0" step="0.01" disabled={!assigned} placeholder={`Base ${fee.amount}`} value={rate} onChange={e => {setRate(e.target.value);setMessage('')}}/></label>
    <small>Blank uses base rate. Changes apply only to this class and future invoices.</small>
    <button type="submit" className="btn btn-primary btn-sm">Save class fee</button>
    {message && <p role="status">{message}</p>}
  </form>
}
