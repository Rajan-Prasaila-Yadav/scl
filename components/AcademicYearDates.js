import CalendarDateInput from './CalendarDateInput'
import React, {useState} from 'react'
import {academicBillingYears, academicYearRange, academicRangeError} from '../lib/academicBilling'
import {readList, readObject, writeValue} from '../lib/storage'
import {requirePermission} from '../lib/permissions'

export default function AcademicYearDates({year}) {
  const [selected,setSelected]=useState(year)
  const [revision,setRevision]=useState(0)
  const years=academicBillingYears()
  return <div><label>Manage academic year<select className="form-select" aria-label="Manage academic year" value={selected} onChange={e=>setSelected(e.target.value)}>{years.years.map(item=><option key={item}>{item}</option>)}</select></label><YearDates key={`${selected}-${revision}`} year={selected} onDeleted={()=>{setSelected(year);setRevision(revision+1)}}/></div>
}
function YearDates({year,onDeleted}) {
  const [range,setRange]=useState(()=>academicYearRange(year))
  const [message,setMessage]=useState('')
  function save() {
    if(!requirePermission('edit','Settings')) return
    const error=academicRangeError(range)
    if(error) {setMessage(error);return}
    const fees=readObject('academicYearDates',{})
    const previous=fees[year] || {}
    const configured=readList('educore.fees',[])
    const used=configured.some(fee=>Object.values(fee.classStarts || {}).some(starts=>starts[year])) || readList('educore.students',[]).some(student=>(student.payments || []).some(invoice=>invoice.academicYear===year))
    if(used && (previous.calendar || 'AD')!==(range.calendar || 'AD')) {setMessage('This year has activated fees or invoices. Create a new academic year to change its billing calendar.');return}
    if(configured.some(fee=>Object.values(fee.classStarts || {}).some(starts=>starts[year] && (starts[year]<range.start || starts[year]>range.end)))) {setMessage('The new range excludes an existing class fee activation. Update that assignment first.');return}
    const dates=readObject('academicYearDates',{})
    if(!writeValue('academicYearDates',{...dates,[year]:range})) return
    setMessage('Academic year dates saved.')
    window.dispatchEvent(new Event('academicYearChanged'))
  }
  function remove() {
    if(!requirePermission('delete','Settings')) return
    if(year===academicBillingYears().active) {setMessage('Choose a different active year before deleting this year.');return}
    const used=readList('educore.fees',[]).some(fee=>Object.values(fee.classStarts || {}).some(starts=>starts[year])) || readList('educore.students',[]).some(student=>(student.payments || []).some(invoice=>invoice.academicYear===year))
    if(used) {setMessage('This year is referenced by fees or invoices and cannot be deleted.');return}
    if(!writeValue('academicYears',academicBillingYears().years.filter(item=>item!==year))) return
    window.dispatchEvent(new Event('academicYearChanged'));onDeleted()
  }
  return <form className="form-group" onSubmit={event=>{event.preventDefault();save()}}>
    <label>Academic year dates ({year})</label>
    <label>Academic calendar<select aria-label="Academic calendar" className="form-select" value={range.calendar || 'AD'} onChange={e=>setRange({...range,calendar:e.target.value})}><option value="AD">AD — Gregorian</option><option value="BS">BS — Nepali (Bikram Sambat)</option></select></label>
    <small>Enter dates in the selected calendar. Class fee activation must fall within this inclusive range. Changing calendar converts the display, not the saved dates.</small>
    <label>Year starts<CalendarDateInput key={`start-${range.calendar}`} calendar={range.calendar} aria-label="Academic year start date" className="form-input" value={range.start || ''} onChange={value=>setRange({...range,start:value})}/></label>
    <label>Year ends<CalendarDateInput key={`end-${range.calendar}`} calendar={range.calendar} aria-label="Academic year end date" className="form-input" min={range.start} value={range.end || ''} onChange={value=>setRange({...range,end:value})}/></label>
    <button type="submit" className="btn btn-ghost">Save academic year dates</button>
    <button type="button" className="btn btn-ghost" onClick={remove}>Delete unused academic year</button>
    {message && <p role="status">{message}</p>}
  </form>
}
