import NepaliDateModule from 'nepali-date-converter'
const NepaliDate=NepaliDateModule.default || NepaliDateModule
const pad=value=>String(value).padStart(2,'0')
const format=({year,month,date})=>`${year}-${pad(month+1)}-${pad(date)}`
export const validAD=value=> typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value
export function fromCalendar(value,calendar='AD') {
  if(calendar==='AD') {if(!validAD(value)) throw new Error('Enter a valid AD date.');return value}
  if(calendar!=='BS' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Enter a BS date as YYYY-MM-DD.')
  const [year,month,day]=value.split('-').map(Number)
  try {
    const date=new NepaliDate(year,month-1,day)
    if(format(date.getBS())!==value) throw new Error('Invalid date')
    return format(date.getAD())
  } catch {throw new Error('Invalid or unsupported BS date (supported years 2000–2090).')}
}
export function toCalendar(value,calendar='AD') {
  if(!value) return ''
  if(!validAD(value)) throw new Error('Invalid stored AD date.')
  if(calendar==='AD') return value
  const [year,month,day]=value.split('-').map(Number)
  return format(new NepaliDate(new Date(year,month-1,day)).getBS())
}
export function calendarMonthStart(value,offset=0,calendar='AD') {
  const [year,month]=toCalendar(value,calendar).split('-').map(Number)
  const total=year*12+month-1+offset
  return fromCalendar(`${Math.floor(total/12)}-${pad(total%12+1)}-01`,calendar)
}
export function calendarDateLabel(value,calendar='AD') {
  try {return `${toCalendar(String(value).slice(0,10),calendar)} ${calendar}`} catch {return `${String(value).slice(0,10)} AD`}
}
