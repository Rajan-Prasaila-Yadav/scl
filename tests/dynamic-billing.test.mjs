import test from 'node:test'
import assert from 'node:assert/strict'
import { billingWindow, buildBillingPreview, paymentTotals, relationshipError } from '../lib/billing.js'
import { subjectAssignmentError, scheduleAssignmentError } from '../lib/academicAssignments.js'

const student={id:1,name:'Demo',classId:2,status:'active',payments:[]}
const fee={id:10,name:'Tuition',amount:100,frequency:'Monthly',status:'active',classIds:[2],classRates:{2:150}}
const form={frequency:'Monthly',start:'2026-10-11',quantity:2,classId:'all',feeIds:[10]}
test('all six billing frequencies have explicit deterministic periods',()=>{
  assert.equal(billingWindow('Hourly','2026-10-11T09:00',1.5).end,'2026-10-11T10:30')
  assert.equal(billingWindow('Daily','2026-12-31',2).end,'2027-01-02T00:00')
  assert.equal(billingWindow('Weekly','2026-10-11',1).start,'2026-10-05T00:00')
  assert.equal(billingWindow('Monthly','2026-12-31',2).end,'2027-02-01T00:00')
  assert.equal(billingWindow('Yearly','2024-02-29',1).start,'2024-01-01T00:00')
  assert.equal(billingWindow('One-Time','2026-10-11',1).quantity,1)
  assert.throws(()=>billingWindow('Daily','2026-02-30',1))
  assert.throws(()=>billingWindow('Weekly','2026-10-11',1.5))
  assert.throws(()=>billingWindow('One-Time','2026-10-11',2))
})
test('class rates and student overrides determine exact preview totals',()=>{
  const result=buildBillingPreview([student,{...student,id:2,feeOverrides:{10:80}},{...student,id:3,status:'inactive'},{...student,id:4,classId:99}],[fee],form)
  assert.equal(result.invoices.length,2);assert.equal(result.total,460)
  assert.equal(result.invoices[0].lines[0].rate,150)
  assert.equal(buildBillingPreview([{...student,feeOverrides:{10:0}}],[fee],form).total,0)
})
test('duplicate and partial overlapping fee periods are not charged twice',()=>{
  const first=buildBillingPreview([student],[fee],form)
  const saved={...student,payments:[{feesBreakdown:first.invoices[0].lines}]}
  assert.equal(buildBillingPreview([saved],[fee],form).invoices.length,0)
  assert.equal(buildBillingPreview([saved],[fee],{...form,start:'2026-11-01'}).skipped,1)
  assert.equal(buildBillingPreview([saved],[fee],{...form,start:'2026-12-01'}).invoices.length,1)
  const another={...fee,id:11,name:'Lab'}
  assert.equal(buildBillingPreview([saved],[fee,another],{...form,feeIds:[10,11]}).invoices[0].lines.length,1)
})
test('one-time and legacy monthly invoices are respected',()=>{
  const once={...fee,frequency:'One-Time'}
  assert.equal(buildBillingPreview([{...student,payments:[{feesBreakdown:[{feeId:10}]}]}],[once],{...form,frequency:'One-Time',quantity:1}).invoices.length,0)
  assert.equal(buildBillingPreview([{...student,payments:[{month:'October 2026',feesBreakdown:[{feeId:10}]}]}],[fee],form).invoices.length,0)
})
test('discounts and taxes use rounded discounted subtotal and reject invalid adjustments',()=>{
  assert.deepEqual(paymentTotals(100,{discountType:'customPercent',customDiscount:12.5,taxType:'customPercent',customTax:13}),{subtotal:100,discount:12.5,tax:11.38,grandTotal:98.88,error:''})
  assert.equal(paymentTotals(100,{discountType:'customAmount',customDiscount:20,taxType:'customAmount',customTax:5.55}).grandTotal,85.55)
  for(const value of [-1,101,Infinity,'']) assert.ok(paymentTotals(100,{discountType:'customPercent',customDiscount:value}).error)
  assert.ok(paymentTotals(100,{discountType:'customAmount',customDiscount:101}).error)
})
test('payer relationships are specific and case-insensitively unique',()=>{
  assert.ok(relationshipError('Other',[]));assert.ok(relationshipError(' grandfather ',['Grandfather']))
  assert.equal(relationshipError('Grandparent',['Grandfather'],'Grandfather'),'')
})
test('teacher assignments protect scheduled subjects and timetable validity',()=>{
  const classes=[{id:2,name:'Class 2',status:'active',subjectIds:[3],subjectTeacherMap:{3:4}}]
  const staff=[{id:4,status:'active',userType:'teaching'},{id:5,status:'active',userType:'non-teaching'}]
  const subjects=[{id:3,status:'active'}], slots=[{classId:2,subjectId:3,teacherId:4}]
  assert.ok(subjectAssignmentError({classIds:[],status:'active'},3,classes,staff,slots))
  assert.ok(subjectAssignmentError({classIds:[2],teacherByClass:{2:5},status:'active'},3,classes,staff,[]))
  assert.equal(scheduleAssignmentError({classId:2,subjectId:3,teacherId:4},classes,subjects,staff),'')
  assert.ok(scheduleAssignmentError({classId:2,subjectId:99,teacherId:4},classes,subjects,staff))
  assert.ok(scheduleAssignmentError({classId:2,subjectId:3,teacherId:5},classes,subjects,staff))
})


test('receipt words preserve decimal amounts', async () => {
  const { numberToWords } = await import('../lib/academicData.js')
  assert.equal(numberToWords(268.05), 'Two hundred sixty eight rupees and five paisa only')
  assert.equal(numberToWords(0.99), 'Zero rupees and ninety nine paisa only')
  assert.equal(numberToWords(300), 'Three hundred rupees only')
})


test('shared ledger preserves zero invoices and uses class then student overrides', async () => {
  const { invoiceRows, ledgerTotals, effectiveFeeRate } = await import('../lib/feeLedger.js')
  const rows = invoiceRows([{id:1,name:'Demo',classId:2,payments:[{id:1,amount:0,status:'pending'},{id:2,amount:300,amountPaid:268.05,status:'paid'},{id:3,amount:150,status:'overdue'}]}])
  assert.equal(rows[0].invoiceAmount,0)
  assert.deepEqual(ledgerTotals(rows),{collected:268.05,outstanding:150})
  assert.equal(effectiveFeeRate(fee,2),150)
  assert.equal(effectiveFeeRate(fee,2,{10:0}),0)
  assert.equal(effectiveFeeRate(fee,2,{10:''}),150)
})
