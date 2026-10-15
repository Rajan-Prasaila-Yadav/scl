import React, {useState,useEffect} from 'react'
import {fromCalendar,toCalendar,calendarDateLabel} from '../lib/calendar'
export default function CalendarDateInput({value,onChange,calendar='AD',min,max,...props}) {
  const display=()=>{try{return toCalendar(value,calendar)}catch{return ''}}
  const [text,setText]=useState(display)
  const [error,setError]=useState('')
  useEffect(()=>{setText(display());setError('')},[value,calendar])
  if(calendar==='AD') return <input {...props} type="date" min={min} max={max} value={value || ''} onChange={e=>onChange(e.target.value)}/>
  return <span><input {...props} type="text" placeholder="YYYY-MM-DD (BS)" pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}" value={text} onChange={e=>{setText(e.target.value);try{const ad=fromCalendar(e.target.value,'BS');if((min && ad<min)||(max && ad>max)) throw new Error('Date is outside the academic year.');setError('');e.target.setCustomValidity('');onChange(ad)}catch(err){setError(err.message);e.target.setCustomValidity(err.message)}}}/><small>{error || (value ? `${value} AD` : 'Enter Nepali BS year-month-day.')}{min && max ? ` Allowed: ${calendarDateLabel(min,'BS')} to ${calendarDateLabel(max,'BS')}.` : ''}</small></span>
}
