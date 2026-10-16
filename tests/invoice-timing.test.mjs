import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultDueDate, validBillingDate, invoiceTiming, matchesInvoiceStatus } from '../lib/invoiceTiming.js'

test('due dates validate real calendar dates and default across year boundaries',()=>{
 assert.equal(defaultDueDate('2026-12-28'),'2027-01-04')
 assert.equal(validBillingDate('2026-02-30'),false)
 assert.equal(validBillingDate('2024-02-29'),true)
 assert.equal(validBillingDate(''),false)
})
test('due today is not overdue; partially paid bills retain overdue balance tracking',()=>{
 const row={amount:1000,amountPaid:400,status:'partial',dueDate:'2026-10-12'}
 assert.deepEqual(invoiceTiming(row,'2026-10-12'),{overdue:false,days:0,label:'Due today'})
 assert.deepEqual(invoiceTiming(row,'2026-10-15'),{overdue:true,days:3,label:'3 days overdue'})
 assert.equal(matchesInvoiceStatus(row,'overdue','2026-10-15'),true)
 assert.equal(matchesInvoiceStatus(row,'partial','2026-10-15'),true)
 assert.equal(row.status,'partial')
 assert.equal(invoiceTiming(row,'2026-10-11').label,'Due 2026-10-12')
 assert.equal(invoiceTiming({...row,status:'paid',amountPaid:1000},'2026-10-15').overdue,false)
 assert.equal(invoiceTiming({...row,totalDue:400},'2026-10-15').overdue,false)
})
test('undated legacy invoices are not assigned invented deadlines',()=>{
 assert.equal(invoiceTiming({amount:100,status:'pending'},'2026-10-12').label,'Due date not recorded')
 assert.equal(invoiceTiming({amount:100,status:'overdue'},'2026-10-12').label,'Overdue (legacy; due date not recorded)')
})
