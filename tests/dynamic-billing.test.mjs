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


test('partial collections preserve terms, receipts and remaining balances', async () => {
  const {recordInstallment, invoiceBalance, collectionEntries, ledgerTotals} = await import('../lib/feeLedger.js')
  const invoice={id:20,invoiceNo:'INV-20',amount:5000,amountPaid:0,status:'pending'}
  const terms={grandTotal:5000,discount:0,tax:0}
  const first=recordInstallment(invoice,2000,terms,{id:1,receiptNo:'R1',paidBy:'First payer',paymentDate:'12/10/2026 10:00'})
  assert.equal(first.status,'partial'); assert.equal(invoiceBalance(first),3000)
  assert.deepEqual(ledgerTotals([first]),{collected:2000,outstanding:3000})
  assert.throws(()=>recordInstallment(first,3001,terms,{}))
  assert.throws(()=>recordInstallment(first,0,terms,{}))
  assert.throws(()=>recordInstallment(first,1.001,terms,{}))
  const final=recordInstallment(first,3000,{grandTotal:9999,discount:100,tax:50},{id:2,receiptNo:'R2',paidBy:'Second payer',paymentDate:'13/10/2026 10:00'})
  assert.equal(final.status,'paid'); assert.equal(final.totalDue,5000); assert.equal(invoiceBalance(final),0)
  assert.equal(final.collections[0].paidBy,'First payer'); assert.equal(final.collections[1].amountPaid,3000)
  assert.equal(collectionEntries(final).length,2)
  assert.throws(()=>recordInstallment(final,1,terms,{}))
  const waived=recordInstallment(invoice,0,{grandTotal:0,discount:5000,tax:0},{id:3})
  assert.equal(waived.status,'paid')
})

test('individual multi-month billing selects only that student and preserves overrides',()=>{
  const other={...student,id:2,feeOverrides:{10:80}}
  const individual={...form,scope:'student',studentId:'2',quantity:3}
  const preview=buildBillingPreview([student,other],[fee],individual)
  assert.equal(preview.invoices.length,1)
  assert.equal(preview.invoices[0].studentId,2)
  assert.equal(preview.total,240)
  assert.equal(preview.period.end,'2027-01-01T00:00')
  const saved={...other,payments:[{feesBreakdown:preview.invoices[0].lines}]}
  assert.equal(buildBillingPreview([student,saved],[fee],individual).invoices.length,0)
  assert.equal(buildBillingPreview([student,other],[fee],{...form,scope:'class',studentId:''}).invoices.length,2)
})

test('individual billing rejects absent, unknown, inactive and wrong-class students',()=>{
  for(const overrides of [{studentId:''},{studentId:'99'},{studentId:'1',classId:'99'}]) {
    assert.throws(()=>buildBillingPreview([student],[fee],{...form,scope:'student',...overrides}),/Select an active student/)
  }
  assert.throws(()=>buildBillingPreview([{...student,status:'inactive'}],[fee],{...form,scope:'student',studentId:'1'}),/Select an active student/)
})

test('mixed bills combine independent frequencies and never recharge reserved one-time or annual items',()=>{
  const annual={...fee,id:11,name:'Annual',frequency:'Yearly',amount:200,classRates:{}}
  const once={...fee,id:12,name:'Admission',frequency:'One-Time',amount:50,classRates:{}}
  const mixed={...form,scope:'student',studentId:'1',items:[{feeId:10,start:'2026-10-12',quantity:3},{feeId:11,start:'2026-10-12',quantity:1},{feeId:12,start:'2026-10-12',quantity:1}]}
  const first=buildBillingPreview([student],[fee,annual,once],mixed)
  assert.equal(first.invoices.length,1)
  assert.equal(first.total,700)
  assert.deepEqual(first.invoices[0].lines.map(l=>l.quantity),[3,1,1])
  for (const status of ['pending','partial','paid']) {
    const saved={...student,payments:[{status,feesBreakdown:first.invoices[0].lines}]}
    assert.equal(buildBillingPreview([saved],[fee,annual,once],mixed).invoices.length,0)
    const next=buildBillingPreview([saved],[fee,annual,once],{...mixed,items:[{feeId:11,start:'2027-01-01',quantity:1},{feeId:12,start:'2027-01-01',quantity:1}]})
    assert.equal(next.total,200)
    assert.equal(next.invoices[0].lines.length,1)
  }
  assert.throws(()=>buildBillingPreview([student],[fee],{...mixed,items:[mixed.items[0],mixed.items[0]]}),/only once/)
})

test('mixed daily weekly and hourly items multiply their own quantities',()=>{
  const fees=['Daily','Weekly','Hourly'].map((frequency,i)=>({...fee,id:20+i,frequency,amount:10,classRates:{}}))
  const preview=buildBillingPreview([student],fees,{...form,items:[{feeId:20,start:'2026-10-12',quantity:5},{feeId:21,start:'2026-10-12',quantity:2},{feeId:22,start:'2026-10-12T09:00',quantity:1.5}]})
  assert.equal(preview.total,85)
  assert.equal(preview.invoices[0].lines[2].periodEnd,'2026-10-12T10:30')
})

test('student concessions support fixed percent waiver and increases without changing issued rates',async()=>{
 const {effectiveFeeRate}=await import('../lib/feeLedger.js')
 const base={id:1,amount:100,classRates:{2:200}}
 const rate=(mode,value)=>effectiveFeeRate(base,2,{1:{mode,value}})
 assert.equal(rate('discountPercent',25),150)
 assert.equal(rate('discountFixed',30),170)
 assert.equal(rate('increasePercent',10),220)
 assert.equal(rate('increaseFixed',50),250)
 assert.equal(rate('waiver',0),0)
 assert.equal(rate('rate',99),99)
 assert.ok(Number.isNaN(rate('discountPercent',101)))
 assert.ok(Number.isNaN(rate('discountFixed',201)))
 assert.equal(effectiveFeeRate(base,2,{1:0}),0)
})

test('penalties calculate on discounted subtotal and freeze across installments',async()=>{
 const {recordInstallment}=await import('../lib/feeLedger.js')
 const terms=paymentTotals(1000,{discountType:'customPercent',customDiscount:10,taxType:'customPercent',customTax:13,penaltyType:'customAmount',customPenalty:50})
 assert.equal(terms.grandTotal,1067)
 assert.equal(terms.penalty,50)
 assert.equal(paymentTotals(1000,{penaltyType:'customPercent',customPenalty:5}).grandTotal,1050)
 assert.ok(paymentTotals(1000,{penaltyType:'customPercent',customPenalty:101}).error)
 const partial=recordInstallment({amount:1000,amountPaid:0,status:'pending'},500,terms,{id:1})
 const paid=recordInstallment(partial,567,{...terms,penalty:900,grandTotal:2000},{id:2})
 assert.equal(paid.penaltyAmount,50)
 assert.equal(paid.totalDue,1067)
 assert.equal(paid.status,'paid')
})

test('issued class snapshots survive student class changes and zero waivers do not invent payment receipts',async()=>{
 const {invoiceRows,collectionEntries}=await import('../lib/feeLedger.js')
 assert.equal(invoiceRows([{id:1,classId:9,payments:[{classId:2,amount:10}]}])[0].classId,2)
 assert.deepEqual(collectionEntries({status:'paid',amount:0,amountPaid:0}),[])
 const issued=buildBillingPreview([{...student,feeOverrides:{10:{mode:'discountPercent',value:20,reason:'Scholarship'}}}],[fee],form)
 assert.equal(issued.invoices[0].lines[0].rate,120)
 assert.equal(issued.invoices[0].lines[0].concession.reason,'Scholarship')
})

test('class activation reserves twelve calendar months and rejects spill into next class year', async()=>{
  const {monthlyCoverage}=await import('../lib/billing.js')
  const configured={...fee,amount:500,classRates:{2:500},classStarts:{2:{'2026–2027':'2026-02-02'}}}
  const request={...form,academicYear:'2026–2027',start:'2026-02-25',quantity:6}
  const bill=buildBillingPreview([student],[configured],request).invoices[0]
  assert.equal(bill.amount,3000)
  assert.equal(bill.lines[0].periodStart,'2026-02-01T00:00')
  assert.equal(bill.lines[0].periodEnd,'2026-08-01T00:00')
  const paid={...student,payments:[{id:1,amount:3000,amountPaid:3000,status:'paid',feesBreakdown:bill.lines}]}
  const coverage=monthlyCoverage(paid,configured,'2026–2027')
  assert.equal(coverage.paid,6)
  assert.equal(coverage.remaining,6)
  assert.equal(coverage.nextStart,'2026-08-01')
  assert.throws(()=>buildBillingPreview([paid],[configured],{...request,start:coverage.nextStart,quantity:10}),/only 6 unbilled months/)
  assert.equal(buildBillingPreview([paid],[configured],{...request,start:coverage.nextStart,quantity:6}).total,3000)
  const partial={...paid,payments:[{...paid.payments[0],status:'partial',amountPaid:1000}]}
  assert.equal(monthlyCoverage(partial,configured,'2026–2027').paid,0)
  assert.equal(monthlyCoverage(partial,configured,'2026–2027').billed,6)
  assert.equal(monthlyCoverage(partial,configured,'2026–2027').remaining,6)
  assert.equal(monthlyCoverage(paid,configured,'2027–2028'),null)
})

test('monthly activation handles leap February and yearly fees cannot multiply', async()=>{
  const {monthlyCoverage}=await import('../lib/billing.js')
  const configured={...fee,classStarts:{2:{leap:'2024-02-29'}}}
  const coverage=monthlyCoverage(student,configured,'leap')
  assert.equal(coverage.start,'2024-02-01T00:00')
  assert.equal(coverage.end,'2025-02-01T00:00')
  assert.equal(coverage.remaining,12)
  assert.throws(()=>billingWindow('Yearly','2026-05-05',2),/exactly one unit/)
})
