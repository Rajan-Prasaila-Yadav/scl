import CalendarDateInput from './CalendarDateInput'
import {calendarDateLabel} from '../lib/calendar'
import { academicBillingYears, academicYearRange, activationDateError } from '../lib/academicBilling'
import React, { useState } from 'react'
import { currencySymbol } from '../lib/schoolConfig'
export default function FeeClassRateEditor({ fee, classroom, onSave }) {
  const [assigned, setAssigned] = useState((fee.classIds || []).some(id => String(id) === String(classroom.id)))
  const [rate, setRate] = useState(fee.classRates?.[classroom.id] ?? '')
  const years=academicBillingYears()
  const [year]=useState(years.active)
  const range=academicYearRange(year)
  const [starts,setStarts]=useState(fee.classStarts?.[classroom.id] || {})
  const [end,setEnd]=useState(fee.classEnds?.[classroom.id]?.[year] || range.end || '')
  const [status,setStatus]=useState(fee.classStatuses?.[classroom.id]?.[year] || 'active')
  const [message, setMessage] = useState('')
  function save(event) {
    event.preventDefault()
    if (rate !== '' && (!Number.isFinite(Number(rate)) || Number(rate) < 0)) {setMessage('Enter a nonnegative rate or leave blank for base.'); return}
    const error=assigned && (fee.frequency==='Monthly' || starts[year]) ? activationDateError(starts[year],year,academicBillingYears().active,academicYearRange(year)) : ''; if(error) {setMessage(error);return}
    if (onSave(assigned, rate, starts, year, end, status)) setMessage('Class fee saved.')
    else setMessage('Could not save. Review the storage notice.')
  }
  return <form onSubmit={save} className="fee-class-editor">
    <label><input type="checkbox" checked={assigned} onChange={e => {setAssigned(e.target.checked);setMessage('')}}/> Assigned to {classroom.name} {classroom.section}</label>
    <label>Class rate ({currencySymbol()})<input className="form-input" aria-label={`Class rate for ${fee.name}`} type="number" min="0" step="0.01" disabled={!assigned} placeholder={`Base ${fee.amount}`} value={rate} onChange={e => {setRate(e.target.value);setMessage('')}}/></label>
    <label>Active academic year<input className="form-input" aria-label="Activation academic year" readOnly value={year}/></label>
    <label>Fee starts on<CalendarDateInput calendar={range.calendar} className="form-input" aria-label={`Activation date for ${fee.name}`} type="date" min={range.start} max={range.end} required={assigned} disabled={!assigned} value={starts[year] || ''} onChange={value=>setStarts({...starts,[year]:value})}/></label>
    <label>Fee ends on<CalendarDateInput calendar={range.calendar} className="form-input" aria-label={`End date for ${fee.name}`} min={range.start} max={range.end} required={assigned} disabled={!assigned} value={end} onChange={value=>{setEnd(value);setMessage('')}}/></label>
    <label>Class fee status<select className="form-input" aria-label={`Class status for ${fee.name}`} disabled={!assigned} value={status} onChange={e=>{setStatus(e.target.value);setMessage('')}}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    <small>{range.start && range.end ? `Allowed activation: ${calendarDateLabel(range.start,range.calendar)} to ${calendarDateLabel(range.end,range.calendar)}.` : "Set academic year dates in Settings before activating fees."}</small>
    <small>Monthly fees cover up to 12 calendar months, bounded by the configured end date. Days are not prorated. Configure each academic year separately.</small>
    <small>Blank saves the current base rate. Unchecking stops this fee for the active academic year and preserves its history. Changes apply only to this class and future invoices.</small>
    <button type="submit" className="btn btn-primary btn-sm">Save class fee</button>
    {message && <p role="status">{message}</p>}
  </form>
}
