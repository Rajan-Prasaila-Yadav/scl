import { invoiceBalance } from './feeLedger.js'

export const billingToday = () => new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kathmandu',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
export function validBillingDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const date=new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10)===value
}
export function defaultDueDate(today=billingToday()) {
  const date=new Date(`${today}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate()+7)
  return date.toISOString().slice(0,10)
}
export function invoiceTiming(invoice,today=billingToday()) {
  if (invoice.status==='paid' || invoiceBalance(invoice)<=0) return {overdue:false,days:0,label:'Settled'}
  if (!validBillingDate(invoice.dueDate)) return {overdue:invoice.status==='overdue',days:0,label:invoice.status==='overdue'?'Overdue (legacy; due date not recorded)':'Due date not recorded'}
  const days=Math.round((Date.parse(`${today}T00:00:00Z`)-Date.parse(`${invoice.dueDate}T00:00:00Z`))/86400000)
  return {overdue:days>0,days:Math.max(0,days),label:days>0?`${days} day${days===1?'':'s'} overdue`:days===0?'Due today':`Due ${invoice.dueDate}`}
}
export const matchesInvoiceStatus = (invoice,status,today=billingToday()) => status==='all' || (status==='overdue' ? invoiceTiming(invoice,today).overdue : invoice.status===status)
