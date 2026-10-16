import {activationDateError} from './academicBilling.js'
export function applyClassFeeSetup(fees, classId, rows, year, activeYear, range) {
  if(!classId) throw new Error('Choose a class.')
  if(year!==activeYear) throw new Error('Active academic year changed. Reload the class setup.')
  const seen=new Set()
  for(const row of rows) {
    if(seen.has(String(row.feeId))) throw new Error('A fee heading can appear only once.')
    seen.add(String(row.feeId))
    const fee=fees.find(item=>String(item.id)===String(row.feeId))
    if(!fee || fee.status!=='active') throw new Error('Only active fee headings can be applied. Remove inactive headings from this draft.')
    if(row.amount==='' || !Number.isFinite(Number(row.amount)) || Number(row.amount)<0 || Math.round(Number(row.amount)*100)/100!==Number(row.amount)) throw new Error(`${fee.name}: enter a nonnegative amount with at most two decimals.`)
    for(const date of [row.start,row.end]) {const error=activationDateError(date,year,activeYear,range);if(error) throw new Error(`${fee.name}: ${error}`)}
    if(row.start>row.end) throw new Error(`${fee.name}: end date must not precede start date.`)
    if(!['active','inactive'].includes(row.status)) throw new Error('Choose an assignment status.')
  }
  return fees.map(fee=>{
    const row=rows.find(item=>String(item.feeId)===String(fee.id))
    // Removed rows stop future billing; retain historic dates and invoices.
    if(!row) return (fee.classIds || []).some(id=>String(id)===String(classId)) ? {...fee,classStatuses:{...fee.classStatuses,[classId]:{...fee.classStatuses?.[classId],[year]:'inactive'}}} : fee
    return {...fee,classIds:[...(fee.classIds || []).filter(id=>String(id)!==String(classId)),classId],classRates:{...fee.classRates,[classId]:Number(row.amount)},classStarts:{...fee.classStarts,[classId]:{...fee.classStarts?.[classId],[year]:row.start}},classEnds:{...fee.classEnds,[classId]:{...fee.classEnds?.[classId],[year]:row.end}},classStatuses:{...fee.classStatuses,[classId]:{...fee.classStatuses?.[classId],[year]:row.status}}}
  })
}
