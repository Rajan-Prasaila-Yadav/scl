import React, {useState} from 'react'
import CalendarDateInput from './CalendarDateInput'
import {academicBillingYears,academicYearRange} from '../lib/academicBilling'
import {calendarDateLabel} from '../lib/calendar'
import {currencySymbol} from '../lib/schoolConfig'
import {applyClassFeeSetup} from '../lib/classFeeSetup'
import {requirePermission} from '../lib/permissions'

export default function ClassFeeBulkSetup({fees,classes,initialClassId,onSave}) {
  const [year]=useState(()=>academicBillingYears().active)
  const range=academicYearRange(year)
  const [classId,setClassId]=useState(initialClassId || '')
  const makeRow=(fee,id)=>({feeId:String(fee.id),amount:fee.classRates?.[id] ?? fee.amount ?? '',start:fee.classStarts?.[id]?.[year] || range.start || '',end:fee.classEnds?.[id]?.[year] || range.end || '',status:fee.classStatuses?.[id]?.[year] || 'active'})
  const load=id=>fees.filter(fee=>fee.status==='active' && (fee.classIds || []).some(item=>String(item)===String(id))).map(fee=>makeRow(fee,id))
  const [rows,setRows]=useState(()=>load(initialClassId))
  const [defaultStart,setDefaultStart]=useState(range.start || '')
  const [defaultEnd,setDefaultEnd]=useState(range.end || '')
  const [dirty,setDirty]=useState(false)
  const [message,setMessage]=useState('')
  const update=(index,key,value)=>{setRows(current=>current.map((row,i)=>i===index?{...row,[key]:value}:row));setDirty(true);setMessage('')}
  const selected=new Set(rows.map(row=>row.feeId))
  const available=fees.filter(fee=>fee.status==='active' && !selected.has(String(fee.id)))
  function append(all=false) {
    const additions=(all?available:available.slice(0,1)).map(fee=>({...makeRow(fee,classId),start:defaultStart,end:defaultEnd}))
    setRows([...rows,...additions]);setDirty(true)
  }
  function save(event) {
    event.preventDefault()
    if(!requirePermission('edit','Fees')) return
    try {
      if(!classes.some(item=>String(item.id)===String(classId))) throw new Error('Choose an existing class.')
      const next=applyClassFeeSetup(fees,classId,rows,year,academicBillingYears().active,academicYearRange(year))
      if(onSave(next)) {setDirty(false);setMessage('All class fees saved together. Existing invoices are unchanged.')}
    } catch(error) {setMessage(error.message)}
  }
  return <section className="class-fee-bulk">
    <h2>Bulk class fee setup</h2><p>Configure the complete fee plan for one class, then save once. Only active fee headings can be added.</p>
    <form onSubmit={save}>
      <div className="billing-generator-grid">
        <label>Active academic year<input className="form-input" readOnly value={`${year} (${range.calendar || 'AD'})`}/></label>
        <label>Class<select aria-label="Bulk fee class" required className="form-select" value={classId} onChange={e=>{if(dirty && !window.confirm('Discard unsaved class fee changes?')) return;setClassId(e.target.value);setRows(load(e.target.value));setDirty(false);setMessage('')}}><option value="">Choose class</option>{classes.map(item=><option key={item.id} value={item.id}>{item.name} {item.section}</option>)}</select></label>
        <label>Default active from<CalendarDateInput aria-label="Default fee start" className="form-input" calendar={range.calendar} min={range.start} max={range.end} value={defaultStart} onChange={setDefaultStart}/></label>
        <label>Default active to<CalendarDateInput aria-label="Default fee end" className="form-input" calendar={range.calendar} min={range.start} max={range.end} value={defaultEnd} onChange={setDefaultEnd}/></label>
      </div>
      <p>{range.start && range.end ? `Allowed dates: ${calendarDateLabel(range.start,range.calendar)} to ${calendarDateLabel(range.end,range.calendar)}.` : 'Configure the active academic year dates in Settings first.'}</p>
      <div className="class-fee-bulk-actions"><button type="button" className="btn btn-ghost" disabled={!classId || !available.length} onClick={()=>append(true)}>Load all active headings</button><button type="button" className="btn btn-ghost" disabled={!classId || !available.length} onClick={()=>append()}>Add fee row</button><button type="button" className="btn btn-ghost" disabled={!rows.length} onClick={()=>{setRows(rows.map(row=>({...row,start:defaultStart,end:defaultEnd})));setDirty(true)}}>Apply default dates to rows</button><button type="button" className="btn btn-ghost" onClick={()=>{setRows([]);setDirty(true)}}>Clear draft</button></div>
      <div className="table-wrap"><table className="roles-table class-fee-bulk-table"><thead><tr><th>Fee heading</th><th>Frequency</th><th>Amount ({currencySymbol()})</th><th>Active from</th><th>Active to</th><th>Class status</th><th>Action</th></tr></thead><tbody>{rows.map((row,index)=>{
        const fee=fees.find(item=>String(item.id)===row.feeId)
        return <tr key={row.feeId}><td><select aria-label={`Fee heading row ${index+1}`} className="form-select" value={row.feeId} onChange={e=>{const next=fees.find(item=>String(item.id)===e.target.value);setRows(rows.map((r,i)=>i===index?{...r,feeId:String(next.id),amount:next.classRates?.[classId] ?? next.amount}:r));setDirty(true)}}>{fees.filter(item=>item.status==='active' && (String(item.id)===row.feeId || !selected.has(String(item.id)))).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></td><td>{fee?.frequency}</td><td><input className="form-input" aria-label={`Amount for ${fee?.name}`} required type="number" min="0" step="0.01" value={row.amount} onChange={e=>update(index,'amount',e.target.value)}/></td><td><CalendarDateInput className="form-input" aria-label={`Start for ${fee?.name}`} required calendar={range.calendar} min={range.start} max={range.end} value={row.start} onChange={value=>update(index,'start',value)}/></td><td><CalendarDateInput className="form-input" aria-label={`End for ${fee?.name}`} required calendar={range.calendar} min={range.start} max={range.end} value={row.end} onChange={value=>update(index,'end',value)}/></td><td><select className="form-select" aria-label={`Class status for ${fee?.name}`} value={row.status} onChange={e=>update(index,'status',e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></td><td><button type="button" className="btn btn-ghost" aria-label={`Remove ${fee?.name} from draft`} onClick={()=>{setRows(rows.filter((_,i)=>i!==index));setDirty(true)}}>Remove</button></td></tr>
      })}{!rows.length && <tr><td colSpan="7">Choose a class and load active headings or add a row.</td></tr>}</tbody></table></div>
      <p>{rows.length} fee headings · {rows.filter(row=>row.status==='active').length} active. Removed rows stop future billing for this class/year when saved. Existing invoices remain collectible.</p>
      {message && <p role="status">{message}</p>}
      <div className="class-fee-bulk-actions"><button className="btn btn-primary" disabled={!classId || !range.start || !range.end}>Save all fees for class</button><button type="button" className="btn btn-ghost" onClick={()=>{setRows(load(classId));setDirty(false);setMessage('Draft reset to saved fees.')}}>Reset draft</button></div>
    </form>
  </section>
}
