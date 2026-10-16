import { invoiceRows, invoiceDue, invoiceBalance, collectionEntries } from './feeLedger.js'
import { billingPeriodText } from './billing.js'

export function studentFeeStatement(student) {
  const invoices = invoiceRows([student]).sort((a,b)=>Number(b.id)-Number(a.id))
  const round = n => Math.round((n + Number.EPSILON)*100)/100
  const totals = invoices.reduce((sum,row)=>({billed:round(sum.billed+invoiceDue(row)),collected:round(sum.collected+Number(row.amountPaid || 0)),balance:round(sum.balance+invoiceBalance(row))}),{billed:0,collected:0,balance:0})
  const payments = invoices.flatMap(invoice=>collectionEntries(invoice).map((entry,index)=>({...entry,key:`${invoice.id}-${entry.id || index}`,invoiceId:invoice.id,invoiceNo:invoice.invoiceNo,receiptNo:entry.receiptNo || 'Legacy payment',amountPaid:Number(entry.amountPaid || 0)})))
  const coverage = invoices.flatMap(invoice=>(invoice.feesBreakdown?.length ? invoice.feesBreakdown : [{name:'Legacy invoice — item detail unavailable'}]).map((line,index)=>({key:`${invoice.id}-${index}`,invoiceNo:invoice.invoiceNo,fee:line.name,frequency:line.frequency || 'Not recorded',quantity:line.quantity ?? 'Not recorded',period:line.periodStart ? `${billingPeriodText(line.periodStart)} → ${billingPeriodText(line.periodEnd)} (end exclusive)` : billingPeriodText(invoice.month) || 'Not recorded',status:invoice.status})))
  return {invoices,totals,payments,coverage}
}
