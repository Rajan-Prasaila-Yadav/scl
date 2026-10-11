export const invoiceAmount = invoice => Number(invoice.amount ?? invoice.amountPaid ?? 0)
export const effectiveFeeRate = (fee, classId, overrides = {}) => {
  const studentRate = overrides[fee.id]
  const classRate = fee.classRates?.[classId]
  return Number(studentRate !== undefined && studentRate !== '' ? studentRate : classRate !== undefined && classRate !== '' ? classRate : fee.amount)
}
export const invoiceRows = students => students.flatMap(student => (student.payments || []).map(invoice => ({...invoice, studentId:student.id, studentName:student.name, classId:student.classId, invoiceAmount:invoiceAmount(invoice)})))
export const ledgerTotals = rows => rows.reduce((totals, row) => ({collected:totals.collected + Number(row.amountPaid || 0), outstanding:totals.outstanding + invoiceBalance(row)}), {collected:0,outstanding:0})

export const invoiceDue = invoice => Number(invoice.totalDue ?? (invoice.status === 'paid' ? invoice.amountPaid : invoiceAmount(invoice)) ?? 0)
export const invoiceBalance = invoice => Math.max(0, Math.round((invoiceDue(invoice) - Number(invoice.amountPaid || 0)) * 100) / 100)
export const collectionEntries = invoice => invoice.collections?.length ? invoice.collections.map(entry => ({...entry, status:'paid', invoiceNo:invoice.invoiceNo})) : invoice.status === 'paid' ? [invoice] : []
export function recordInstallment(invoice, amount, terms, entry) {
  const round = n => Math.round((Number(n) + Number.EPSILON)*100)/100
  if (invoice.status === 'paid') throw new Error('This invoice is already paid.')
  const totalDue = invoice.totalDue ?? round(terms.grandTotal)
  const previous = Number(invoice.amountPaid || 0)
  const remaining = round(totalDue-previous)
  const value = Number(amount)
  if (!Number.isFinite(value) || value < 0 || (value === 0 && remaining !== 0) || round(value)!==value || value > remaining) throw new Error('Enter a payment greater than zero, with at most two decimals, no higher than the remaining balance.')
  const paid = round(previous + value)
  const receipt = {...entry, amountPaid:value, balanceAfter:round(totalDue-paid)}
  return {...invoice, totalDue, amountPaid:paid, status:paid === totalDue ? 'paid' : 'partial', discountAmount:invoice.totalDue !== undefined ? invoice.discountAmount : terms.discount, taxAmount:invoice.totalDue !== undefined ? invoice.taxAmount : terms.tax, paymentDate:entry.paymentDate, paidBy:entry.paidBy, payerRelation:entry.payerRelation, paymentMode:entry.paymentMode, onlineApp:entry.onlineApp, receivedBy:entry.receivedBy, collections:[...(invoice.collections || []),receipt]}
}
