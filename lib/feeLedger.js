export const invoiceAmount = invoice => Number(invoice.amount ?? invoice.amountPaid ?? 0)
export const effectiveFeeRate = (fee, classId, overrides = {}) => {
  const studentRate = overrides[fee.id]
  const classRate = fee.classRates?.[classId]
  return Number(studentRate !== undefined && studentRate !== '' ? studentRate : classRate !== undefined && classRate !== '' ? classRate : fee.amount)
}
export const invoiceRows = students => students.flatMap(student => (student.payments || []).map(invoice => ({...invoice, studentId:student.id, studentName:student.name, classId:student.classId, invoiceAmount:invoiceAmount(invoice)})))
export const ledgerTotals = rows => rows.reduce((totals, row) => ({collected:totals.collected + (row.status === 'paid' ? Number(row.amountPaid || 0) : 0), outstanding:totals.outstanding + (row.status === 'paid' ? 0 : invoiceAmount(row))}), {collected:0,outstanding:0})
