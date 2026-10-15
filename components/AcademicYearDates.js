import React, {useState} from 'react'
import {academicYearRange, academicRangeError} from '../lib/academicBilling'
import {readObject, writeValue} from '../lib/storage'
import {requirePermission} from '../lib/permissions'

export default function AcademicYearDates({year}) {
  const [range,setRange]=useState(()=>academicYearRange(year))
  const [message,setMessage]=useState('')
  function save() {
    if(!requirePermission('edit','Settings')) return
    const error=academicRangeError(range)
    if(error) {setMessage(error);return}
    const dates=readObject('academicYearDates',{})
    if(!writeValue('academicYearDates',{...dates,[year]:range})) return
    setMessage('Academic year dates saved.')
    window.dispatchEvent(new Event('academicYearChanged'))
  }
  return <div className="form-group">
    <label>Academic year dates ({year})</label>
    <small>Use Gregorian dates. Class fee activation must fall within this inclusive range.</small>
    <label>Year starts<input aria-label="Academic year start date" className="form-input" type="date" value={range.start || ''} onChange={e=>setRange({...range,start:e.target.value})}/></label>
    <label>Year ends<input aria-label="Academic year end date" className="form-input" type="date" min={range.start} value={range.end || ''} onChange={e=>setRange({...range,end:e.target.value})}/></label>
    <button type="button" className="btn btn-ghost" onClick={save}>Save academic year dates</button>
    {message && <p role="status">{message}</p>}
  </div>
}
