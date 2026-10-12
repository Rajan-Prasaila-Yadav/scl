import { invoiceTiming } from './invoiceTiming'
import { escapeHTML } from './exportUtils'
import { writePrintDocument } from './printDocument'
import { currencySymbol, schoolName } from './schoolConfig'
import { billingPeriodText } from './billing'
import { invoiceDue, invoiceBalance } from './feeLedger'

const statusText = value => value === 'partial' ? 'Partially paid' : value
const table = (headers,rows) => `<table><thead><tr>${headers.map(v=>`<th>${escapeHTML(v)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(row=>`<tr>${row.map(v=>`<td>${escapeHTML(v)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}">No records</td></tr>`}</tbody></table>`
export function printStudentStatement(student, classroom, statement, receipt) {
  const target = window.open('', '_blank')
  if (!target) { window.alert('Allow popups to open the printable statement.'); return }
  const money = n => `${currencySymbol()}${Number(n).toFixed(2)}`
  const title = receipt ? 'Payment receipt' : 'Student fee statement'
  const payments = receipt ? [receipt] : statement.payments
  const paymentTable = table(['Receipt','Invoice','Payment timestamp','Payer / relationship','Method','Collected'],payments.map(p=>[p.receiptNo,p.invoiceNo,p.paymentDate || 'Not recorded',`${p.paidBy || 'Not recorded'} / ${p.payerRelation || 'Not recorded'}`,`${p.paymentMode || ''} ${p.onlineApp || ''}`,money(p.amountPaid)]))
  const html = `<!doctype html><html><head><title>${escapeHTML(title)}</title><style>body{font:13px Arial,sans-serif;color:#111;margin:28px}h1{font-size:22px}h2{font-size:17px;margin-top:28px}table{width:100%;border-collapse:collapse;margin:14px 0;font-size:11px}td,th{padding:8px;border:1px solid #ccc;text-align:left;overflow-wrap:anywhere}th{background:#eee}tr{break-inside:avoid}thead{display:table-header-group}.summary{padding:14px;background:#f4f4f4}button{padding:10px 18px}@media print{button{display:none}body{margin:0}}</style></head><body><button>Print / Save PDF</button><h1>${escapeHTML(schoolName())}</h1><h2>${title}</h2><p>${escapeHTML(student.name)} · Admission: ${escapeHTML(student.admissionNo || 'Not recorded')} · ${escapeHTML(classroom)}</p><p>Generated: ${escapeHTML(new Date().toLocaleString('en-GB',{timeZone:'Asia/Kathmandu'}))} (Nepal time)</p>${receipt ? '' : `<div class="summary">Total billed: ${escapeHTML(money(statement.totals.billed))} · Collected: ${escapeHTML(money(statement.totals.collected))} · Outstanding: ${escapeHTML(money(statement.totals.balance))}</div><p>Complete statement of saved invoices, independent of on-screen filters. Billed periods do not imply payment. Invoice totals include recorded discounts and taxes.</p><h2>Invoices</h2>${table(['Invoice','Period','Due date / timing','Total due','Collected','Balance','Status'],statement.invoices.map(r=>[r.invoiceNo,billingPeriodText(r.month),`${r.dueDate || 'Not recorded'} / ${invoiceTiming(r).label}`,money(invoiceDue(r)),money(r.amountPaid || 0),money(invoiceBalance(r)),statusText(r.status)]))}<h2>Billed periods and fee items</h2>${table(['Fee','Frequency','Quantity','Period','Invoice','Invoice status'],statement.coverage.map(r=>[r.fee,r.frequency,r.quantity,r.period,r.invoiceNo,statusText(r.status)]))}<h2>Payment history</h2>`}${paymentTable}<p>Browser-local prototype records. ${receipt ? 'This receipt records this payment only.' : 'This statement is not a new invoice or a receipt.'}</p></body></html>`
  writePrintDocument(target,html)
  target.document.close()
}
