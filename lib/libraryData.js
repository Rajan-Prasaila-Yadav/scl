import { localDate } from './validation.js'

export function availableStock(book, loans) {
  const issued = loans.filter(l => String(l.bookId) === String(book.id) && l.status !== 'returned').length
  return Math.max(0, Number(book.quantity) - issued)
}
export function fineBalance(loan) {
  const paid = Number(loan.finePaidAmount ?? (loan.finePaid ? loan.fineAmt : 0)) || 0
  return Math.max(0, (Number(loan.fineAmt) || 0) - paid)
}
export function refreshLoan(loan, today = localDate()) {
  if (loan.status === 'returned') return loan
  const days = Math.max(0, Math.round((Date.parse(today) - Date.parse(loan.dueDate)) / 86400000))
  if (!Number.isFinite(days)) return loan
  const amount = days * 10
  const paid = Number(loan.finePaidAmount ?? (loan.finePaid ? loan.fineAmt : 0)) || 0
  return {...loan, status:days ? 'overdue' : 'issued', fineAmt:amount, finePaidAmount:paid, finePaid:amount > 0 && paid >= amount}
}
