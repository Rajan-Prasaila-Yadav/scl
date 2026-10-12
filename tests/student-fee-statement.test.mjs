import test from 'node:test'
import assert from 'node:assert/strict'
import { studentFeeStatement } from '../lib/studentFeeStatement.js'

test('student statement totals respect adjustments and count installments only once',()=>{
 const student={id:1,name:'Demo',payments:[
  {id:1,invoiceNo:'A',amount:1000,totalDue:900,amountPaid:400,status:'partial',month:'2026-10',feesBreakdown:[{name:'Tuition',frequency:'Monthly',quantity:1,periodStart:'2026-10-01T00:00',periodEnd:'2026-11-01T00:00'}],collections:[{id:11,receiptNo:'R1',amountPaid:150},{id:12,receiptNo:'R2',amountPaid:250}]},
  {id:2,invoiceNo:'B',amount:500,amountPaid:450,status:'paid',paymentDate:'12/10/2026 09:00'},
  {id:3,invoiceNo:'C',amount:200,amountPaid:0,status:'pending'},
  {id:4,invoiceNo:'D',amount:0,amountPaid:0,status:'paid'}]}
 const statement=studentFeeStatement(student)
 assert.deepEqual(statement.totals,{billed:1550,collected:850,balance:700})
 assert.equal(statement.payments.filter(p=>p.invoiceNo==='A').length,2)
 assert.equal(statement.payments.reduce((sum,p)=>sum+p.amountPaid,0),850)
 assert.equal(statement.coverage.find(r=>r.invoiceNo==='A').period,'2026-10-01 → 2026-11-01 (end exclusive)')
 assert.equal(statement.coverage.find(r=>r.invoiceNo==='A').status,'partial')
 assert.equal(statement.payments.find(p=>p.invoiceNo==='B').paymentDate,'12/10/2026 09:00')
 assert.equal(student.payments[0].feesBreakdown[0].periodStart,'2026-10-01T00:00')
})

test('empty student statements have zero totals and no invented history',()=>{
 const statement=studentFeeStatement({id:1,name:'New student'})
 assert.deepEqual(statement.totals,{billed:0,collected:0,balance:0})
 assert.deepEqual(statement.invoices,[])
 assert.deepEqual(statement.coverage,[])
 assert.deepEqual(statement.payments,[])
})
