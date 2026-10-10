import test from 'node:test'
import assert from 'node:assert/strict'
import { validateExam, validateMarks, validateGradeSchema, attendanceStats, eligibleFees } from '../lib/validation.js'
import { makeId } from '../lib/academicData.js'
import { escapeHTML } from '../lib/exportUtils.js'
import { readObject, writeValue, readList } from '../lib/storage.js'
import { validateBirthDate, validateStudentPlacement, validateClassCapacity } from '../lib/registryValidation.js'
import { availableStock, refreshLoan, fineBalance } from '../lib/libraryData.js'
import { studentAttendanceSummary } from '../lib/attendanceSummary.js'

test('student placement checks roll numbers, class capacity, and real dates',()=>{
  const classes=[{id:1,capacity:1}]
  const students=[{id:1,classId:1,rollNo:1,status:'active'}]
  const form={classId:1,rollNo:1,status:'active',dob:'2010-01-01'}
  assert.equal(validateStudentPlacement(form,students,classes,1),'')
  assert.match(validateStudentPlacement(form,students,classes,null),/roll number/)
  assert.match(validateStudentPlacement({...form,rollNo:2},students,classes,null),/full/)
  assert.notEqual(validateStudentPlacement({...form,rollNo:1.5},[],classes,null),'')
  assert.notEqual(validateBirthDate('2026-02-30','2026-10-10'),'')
  assert.notEqual(validateBirthDate('2026-10-11','2026-10-10'),'')
  assert.equal(validateBirthDate('2024-02-29','2026-10-10'),'')
  assert.notEqual(validateClassCapacity(2,3),'')
})
test('library stock follows outstanding loans, including overdue copies',()=>{
  const loans=[{bookId:1,status:'issued'},{bookId:'1',status:'overdue'},{bookId:1,status:'returned'}]
  assert.equal(availableStock({id:1,quantity:5},loans),3)
})
test('paid library fines do not erase later unpaid accrual',()=>{
  const loan={status:'issued',dueDate:'2026-10-01',fineAmt:20,finePaid:true}
  const refreshed=refreshLoan(loan,'2026-10-05')
  assert.equal(refreshed.fineAmt,40)
  assert.equal(refreshed.finePaidAmount,20)
  assert.equal(refreshed.finePaid,false)
  assert.equal(fineBalance(refreshed),20)
  assert.equal(refreshLoan({...refreshed,status:'returned'},'2026-10-10').fineAmt,40)
})
test('parent attendance uses the saved current-month record',()=>{
  const student={id:7,classId:2},date=new Date(2020,2,20)
  const summary=studentAttendanceSummary(student,{'2':{'2020-2':{'7':{1:'P',2:'A',3:'L',4:'H'}}}},date)
  assert.equal(summary.rate,67)
  assert.equal(summary.totalDays,3)
  assert.equal(summary.presentDays,2)
  assert.equal(studentAttendanceSummary(student,{},date).status,'No attendance recorded')
})

test('exam marks reject invalid numbers while retaining unmarked entries', () => {
  assert.equal(validateMarks({1:{Math:'',English:null,Science:0}},100),'')
  for (const number of [-1,101,'bad',Infinity]) assert.notEqual(validateMarks({1:{Math:number}},100),'')
})
test('exam date and pass mark boundaries', () => {
  const exam={name:'Term exam',classIds:[1],startDate:'2026-10-09',endDate:'2026-10-10',maxMarks:100,passMark:40}
  assert.equal(validateExam(exam),'')
  assert.notEqual(validateExam({...exam,endDate:'2026-10-08'}),'')
  assert.notEqual(validateExam({...exam,passMark:101}),'')
})
test('grading rejects gaps and overlaps',()=>{
  const schema=[{grade:'F',minPct:0,maxPct:39},{grade:'P',minPct:40,maxPct:100}]
  assert.equal(validateGradeSchema(schema),'')
  assert.notEqual(validateGradeSchema([{...schema[0],maxPct:38},schema[1]]),'')
  assert.notEqual(validateGradeSchema([{...schema[0],maxPct:40},schema[1]]),'')
})
test('unmarked attendance does not count as absent or present',()=>{
  assert.deepEqual(attendanceStats({1:'P',2:'A',3:'L',4:'H'},5),{p:1,a:1,l:1,h:1,unmarked:1,wd:3,pct:67})
  assert.equal(attendanceStats({},31).pct,0)
})
test('fees respect class eligibility and active status',()=>{
  const templates=[{id:1,classIds:[1],status:'active'},{id:2,classIds:[2],status:'active'},{id:3,classIds:[1],status:'inactive'}]
  assert.deepEqual(eligibleFees(templates,{classId:'1'}).map(f=>f.id),[1])
})
test('batch record identifiers remain unique and safe integers',()=>{
  const ids=Array.from({length:10000},()=>makeId())
  assert.equal(new Set(ids).size,ids.length)
  assert.ok(ids.every(Number.isSafeInteger))
})
test('print escaping treats markup as text',()=>{
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
})
test('object persistence survives reload, stale writes and corrupted records are protected',()=>{
  const data=new Map(),events=[]
  globalThis.window={localStorage:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)},dispatchEvent:e=>events.push(e)}
  const key='test.attendance'; data.set(key,JSON.stringify({class1:{day1:'A'}}))
  assert.deepEqual(readObject(key),{class1:{day1:'A'}})
  assert.equal(writeValue(key,{class1:{day1:'L'}}),true)
  assert.deepEqual(readObject(key),{class1:{day1:'L'}})
  data.set(key,JSON.stringify({class1:{day1:'P'}}))
  assert.equal(writeValue(key,{class1:{day1:'A'}}),false)
  assert.equal(JSON.parse(data.get(key)).class1.day1,'P')
  data.set('broken','{damaged')
  assert.deepEqual(readList('broken',[]),[])
  assert.equal(writeValue('broken',[]),false)
  assert.equal(data.get('broken'),'{damaged')
  data.set('educore.dailyAudit', JSON.stringify([{date:'2026-10-09',status:'closed'}]))
  const students = [{id:1,payments:[{id:1,paymentDate:'09/10/2026',amountPaid:100}]}]
  data.set('educore.students', JSON.stringify(students))
  readList('educore.students')
  assert.equal(writeValue('educore.students',[{id:1,payments:[]}]),false)
  assert.equal(writeValue('educore.students',[{...students[0],name:'Updated name'}]),true)
  delete globalThis.window
})
