> Historical baseline from 9 October 2026. Findings, source line numbers and checked audit steps below describe the original download, not the repaired release. See [current project status](../PROJECT-STATUS.md) and [repair verification](FIX-VERIFICATION.md). Unchecked acceptance items are test scenarios, not a current defect list. JSON, screenshots and scripts linked below are local evidence excluded from Git/release archives.

# Field and component inventory

Generated from all page, component, and library JavaScript source using the installed Babel parser. One row per source control, including conditional and repeated controls; runtime repetitions are not expanded. Nearest JSX labels are context hints, not proof of accessible labeling. Dynamic field expressions are preserved. This inventory is source coverage, not a claim that every control was exercised in a browser.

## pages/attendance.js

1088 lines; 5 field definitions; 12 button definitions; 1 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 505 | select  | Class | {selectedClassId} | {e => { setSelectedClassId(Number(e.target.value)&#124;&#124;''); setDetailPerson(null) }} | None declared | None declared |
| 512 | select  | Month | {'${selectedMonth}-${selectedYear}'} | {e => { const [m,y] = e.target.value.split('-').map(Number) setSelectedMonth(m); setSelectedYear(y); setDetailPerson(null) }} | None declared | None declared |
| 522 | input  | {activeTab==='students' ? 'Search student or roll...' : 'Search staff or dept...'} | {searchQuery} | {e => setSQ(e.target.value)} | None declared | None declared |
| 859 | select  | (none in adjacent label) | {analyticsClassFilter} | {e => setAnalyticsClassFilter(e.target.value)} | None declared | None declared |
| 866 | input  | Search... | {searchQuery} | {e => setSQ(e.target.value)} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 80 | <span style={{ fontSize: 8, opacity: 0.65, fontWeight: 600, lineHeight: 1 }}>{d}</span> <span style={{ fontSize: 10, lineHeight: 1 }}>{st}</span> | {() => !readOnly && onToggle && onToggle(personId, d)} |
| 493 | <i className="fa-solid fa-print"></i> Print Register | {printStudentRegister} |
| 527 | <i className="fa-solid fa-xmark"></i> | {() => setSQ('')} |
| 542 | <i className="fa-solid fa-user-graduate"></i> Students | {() => { setActiveTab('students'); setDetailPerson(null); setSQ('') }} |
| 545 | <i className="fa-solid fa-chalkboard-user"></i> Teachers | {() => { setActiveTab('teachers'); setDetailPerson(null); setSQ('') }} |
| 548 | <i className="fa-solid fa-chart-bar"></i> Analytics | {() => { setActiveTab('analytics'); setDetailPerson(null) }} |
| 674 | {d} | {() => setBulkDay(d)} |
| 797 | {d} | {() => setBulkDay('t-${d}')} |
| 847 | <i className={'fa-solid ${t.ic}'}></i> {t.l} | {() => { setAnalyticsSubTab(t.k); setSQ('') }} |
| 867 | <i className="fa-solid fa-xmark"></i> | {() => setSQ('')} |
| 1047 | <i className="fa-solid fa-xmark"></i> | {() => setBulkDay(null)} |
| 1052 | <span style={{ fontSize: 22 }}>{k}</span> <span style={{ fontSize: 12 }}>{v}</span> | {() => { if (typeof bulkDay === 'number') markAllStudents(bulkDay, k) else markAllTeachers(Number(String(bulkDay).replace('t-', '')), k) }} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 929 | th | Student {sortIcon('name')} | {() => toggleSort('name')} | None declared |
| 930 | th | Roll {sortIcon('rollNo')} | {() => toggleSort('rollNo')} | None declared |
| 931 | th | Class {sortIcon('className')} | {() => toggleSort('className')} | None declared |
| 937 | th | Att % {sortIcon('pct')} | {() => toggleSort('pct')} | None declared |
| 987 | th | Teacher {sortIcon('name')} | {() => toggleSort('name')} | None declared |
| 994 | th | Att % {sortIcon('pct')} | {() => toggleSort('pct')} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 505 | {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section?' - ${c.section}':''}</option>)} |
| 512 | {monthOptions.map(o => <option key={o.label} value={'${o.month}-${o.year}'}>{o.label}</option>)} |
| 859 | <option value="all">All Classes</option> {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section?' - ${c.section}':''}</option>)} |

### Storage reads and writes

| Line | Call |
|---|---|
| 172 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 175 | readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS) |
| 176 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 177 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 179 | readStoredList('educore.studentAttendance', null) |
| 182 | readStoredList('educore.teacherAttendance', null) |
| 218 | localStorage.setItem('educore.studentAttendance', JSON.stringify(studentAttendance)) |
| 219 | localStorage.setItem('educore.teacherAttendance', JSON.stringify(teacherAttendance)) |

### Functions

- getDaysInMonth (line 20)
- firstDayOfMonth (line 23)
- generateMockAttendance (line 27)
- generateMockTeacherAttendance (line 40)
- AttendanceCalendar (line 54)
- StatPills (line 116)
- Attendance (line 141)
- showToast (line 221)
- getClassName (line 224)
- getSubjectName (line 225)
- toggleStudent (line 238)
- toggleTeacher (line 254)
- markAllStudents (line 267)
- markAllTeachers (line 276)
- getPersonStats (line 285)
- toggleSort (line 297)
- sortIcon (line 301)
- printStudentRegister (line 415)
- pctBadge (line 474)

## pages/birthdays.js

549 lines; 7 field definitions; 5 button definitions; 1 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 313 | input checkbox | Demo Birthday Simulation | {demoMode} | {(e) => { setDemoMode(e.target.checked) showToast(e.target.checked ? "Birthday Simulation Active" : "Showing real registry dates", "info") }} | None declared | id=demoModeCelebrations |
| 363 | input  | Search by name, student roll, employee ID... | {search} | {(e) => setSearch(e.target.value)} | None declared | None declared |
| 376 | select  | (none in adjacent label) | {roleFilter} | {(e) => setRoleFilter(e.target.value)} | None declared | None declared |
| 383 | select  | (none in adjacent label) | {monthFilter} | {(e) => setMonthFilter(e.target.value)} | None declared | None declared |
| 399 | select  | (none in adjacent label) | {dateFilter} | {(e) => setDateFilter(e.target.value)} | None declared | None declared |
| 500 | select  | Select Wish Template Message | {activeTemplate} | {(e) => handleTemplateChange(e.target.value)} | None declared | None declared |
| 514 | textarea  | Message Content | {wishMessage} | {(e) => setWishMessage(e.target.value)} | required=true | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 370 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 463 | <i className="fa-solid fa-pen-fancy"></i> Custom Wish | {() => handleOpenWish(b)} |
| 491 | <i className="fa-solid fa-xmark"></i> | {() => setSelectedPerson(null)} |
| 527 | Cancel | {() => setSelectedPerson(null)} |
| 528 | <i className="fa-solid fa-paper-plane"></i> Send Wish | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 341 | span | <i className="fa-solid fa-cake-candles" style={{ color: '#FFD700' }}></i> {b.name} ( {b.role.includes('Logged') ? 'You' : b.role} ) - Send Wish | {() => handleOpenWish(b)} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 376 | <option value="all">All Roles</option> <option value="students">Students</option> <option value="staff">Staff / Employees</option> <option value="user">Logged-in User</option> |
| 383 | <option value="all">All Months</option> <option value="1">January</option> <option value="2">February</option> <option value="3">March</option> <option value="4">April</option> <option value="5">May</option> <option value="6">June</option> <option value="7">July</option> <option value="8">August</option> <option value="9">September</option> <option value="10">October</option> <option value="11">November</option> <option value="12">December</option> |
| 399 | <option value="all">All Days</option> <option value="today">Today's Birthdays</option> <option value="upcoming">Upcoming (Next 30 Days)</option> |
| 500 | {getTemplates(selectedPerson).map(t => ( <option key={t.id} value={t.id}>{t.label}</option> ))} <option value="custom">-- Custom Message (Blank) --</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 90 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 91 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 92 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 94 | localStorage.getItem('educore.currentUser') |

### Functions

- calculateAge (line 12)
- getBirthdayCountdown (line 21)
- formatBirthdayDate (line 50)
- getClassName (line 63)
- Birthdays (line 69)
- showToast (line 107)
- getTemplates (line 250)
- handleOpenWish (line 271)
- handleTemplateChange (line 283)
- sendCustomWish (line 293)

## pages/classes.js

1746 lines; 23 field definitions; 26 button definitions; 1 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 721 | input  | Search class, section, code, room, teacher... | {search} | {(event) => setSearch(event.target.value)} | None declared | None declared |
| 733 | select  | (none in adjacent label) | {statusFilter} | {(event) => setStatusFilter(event.target.value)} | None declared | None declared |
| 743 | select  | (none in adjacent label) | {teacherFilter} | {(event) => setTeacherFilter(event.target.value)} | None declared | None declared |
| 756 | select  | (none in adjacent label) | {capacityFilter} | {(event) => setCapacityFilter(event.target.value)} | None declared | None declared |
| 947 | input  | Class Name <span className="req">*</span> | {form.name} | {(event) => updateForm('name', event.target.value)} | required=true | None declared |
| 957 | input  | Section (Optional) | {form.section} | {(event) => updateForm('section', event.target.value)} | None declared | None declared |
| 966 | input  | Class Code (Optional) | {form.classCode} | {(event) => updateForm('classCode', event.target.value)} | None declared | None declared |
| 975 | input  | Room Number | {form.room} | {(event) => updateForm('room', event.target.value)} | None declared | None declared |
| 984 | input number | Capacity | {form.capacity} | {(event) => updateForm('capacity', event.target.value)} | min=1 | None declared |
| 994 | select  | Class Teacher <span className="req">*</span> | {form.classTeacherId} | {(event) => updateForm('classTeacherId', event.target.value)} | required=true | None declared |
| 1010 | select  | Class Monitor | {form.monitorId} | {(event) => updateForm('monitorId', event.target.value)} | disabled={!editingId &#124;&#124; studentsInFormClass.length === 0} | None declared |
| 1028 | select  | Status | {form.status} | {(event) => updateForm('status', event.target.value)} | None declared | None declared |
| 1041 | textarea  | Class Room Short Description | {form.description} | {(event) => updateForm('description', event.target.value)} | None declared | None declared |
| 1078 | input checkbox | <input type="checkbox" checked={isChecked} onChange={() => { const newSubjectIds = isChecked ? form.subjectIds.filter((id) => id !== subject.id) : [...form.subjectIds, subject.id] const newMap = { ...form.subjectTeacherMap } if (isChecked) { delete newMap[subject.id] } setForm((prev) => ({ ...prev, subjectIds: newSubjectIds, subjectTeacherMap: newMap, })) }} /> <div> <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--t1)' }}>{subject.name}</div> <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{subject.code}</div> </div> | {isChecked} | {() => { const newSubjectIds = isChecked ? form.subjectIds.filter((id) => id !== subject.id) : [...form.subjectIds, subject.id] const newMap = { ...form.subjectTeacherMap } if (isChecked) { delete newMap[subject.id] } setForm((prev) => ({ ...prev, subjectIds: newSubjectIds, subjectTeacherMap: newMap, })) }} | None declared | None declared |
| 1105 | select  | <input type="checkbox" checked={isChecked} onChange={() => { const newSubjectIds = isChecked ? form.subjectIds.filter((id) => id !== subject.id) : [...form.subjectIds, subject.id] const newMap = { ...form.subjectTeacherMap } if (isChecked) { delete newMap[subject.id] } setForm((prev) => ({ ...prev, subjectIds: newSubjectIds, subjectTeacherMap: newMap, })) }} /> <div> <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--t1)' }}>{subject.name}</div> <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{subject.code}</div> </div> | {form.subjectTeacherMap[subject.id] &#124;&#124; ''} | {(e) => { const val = e.target.value const newMap = { ...form.subjectTeacherMap } if (val) { newMap[subject.id] = Number(val) } else { delete newMap[subject.id] } setForm((prev) => ({ ...prev, subjectTeacherMap: newMap })) }} | None declared | None declared |
| 1425 | select  | Subject Teacher | {currentTeacherId} | {(e) => handleInlineTeacherChange(subject.id, e.target.value)} | None declared | None declared |
| 1610 | select  | Select Subject <span className="req">*</span> | {subModalForm.subjectId} | {(e) => setSubModalForm({ ...subModalForm, subjectId: e.target.value })} | required=true | None declared |
| 1634 | input  | Subject Name <span className="req">*</span> | {subModalForm.name} | {(e) => setSubModalForm({ ...subModalForm, name: e.target.value })} | required=true | None declared |
| 1644 | select  | Category | {subModalForm.category} | {(e) => setSubModalForm({ ...subModalForm, category: e.target.value })} | None declared | None declared |
| 1661 | input  | Book Title (Optional) | {subModalForm.bookName} | {(e) => setSubModalForm({ ...subModalForm, bookName: e.target.value })} | None declared | None declared |
| 1670 | input  | Publisher (Optional) | {subModalForm.publication} | {(e) => setSubModalForm({ ...subModalForm, publication: e.target.value })} | None declared | None declared |
| 1679 | input  | Book Code (Optional) | {subModalForm.bookCode} | {(e) => setSubModalForm({ ...subModalForm, bookCode: e.target.value })} | None declared | None declared |
| 1693 | select  | Assign Subject Teacher | {subModalForm.teacherId} | {(e) => setSubModalForm({ ...subModalForm, teacherId: e.target.value })} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 639 | <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> Excel | {handleExportCSV} |
| 642 | <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF | {handleExportPDF} |
| 645 | <i className="fa-solid fa-plus"></i> New Class | {() => { resetForm() setViewMode('create') }} |
| 657 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => { resetForm() setViewMode('list') }} |
| 727 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 874 | <i className="fa-solid fa-eye"></i> | {() => { showToast("Action: view", "info") setSelectedClassId(item.id) setDetailTab('overview') setViewMode('detail') }} |
| 887 | <i className="fa-solid fa-pen"></i> | {() => { showToast("Action: edit", "info") editClass(item) }} |
| 898 | <i className={'fa-solid ${item.status === 'active' ? 'fa-ban' : 'fa-check'}'}></i> | {() => { showToast('Action: ${item.status === 'active' ? 'block' : 'unblock'}', "info") toggleClassStatus(item.id) }} |
| 910 | <i className="fa-solid fa-trash"></i> | {() => { showToast("Action: delete", "info") deleteClass(item) }} |
| 1135 | Cancel | {() => { resetForm() setViewMode('list') }} |
| 1145 | <i className={'fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}'}></i> {editingId ? 'Update Configuration' : 'Save Registry'} | submit |
| 1203 | <i className="fa-solid fa-circle-info"></i> Overview | {() => setDetailTab('overview')} |
| 1206 | <i className="fa-solid fa-user-graduate"></i> Students ( {studentsInSelectedClass.length} ) | {() => setDetailTab('students')} |
| 1209 | <i className="fa-solid fa-book"></i> Subjects Curriculum ( {selectedSubjects.length} ) | {() => setDetailTab('subjects')} |
| 1212 | <i className="fa-solid fa-chalkboard-user"></i> Teaching Faculty ( {teachersInSelectedClass.length} ) | {() => setDetailTab('teachers')} |
| 1370 | <i className="fa-solid fa-link"></i> Link Existing Subject | {() => handleOpenSubjectModal('assign')} |
| 1376 | <i className="fa-solid fa-plus"></i> Create &amp; Add New | {() => handleOpenSubjectModal('create')} |
| 1442 | <i className="fa-solid fa-pen"></i> Edit | {() => handleOpenSubjectModal('edit', subject.id)} |
| 1449 | <i className="fa-solid fa-unlink"></i> Unlink | {() => handleUnlinkSubject(subject.id)} |
| 1457 | <i className="fa-solid fa-trash"></i> Delete | {() => handleCompleteDeleteSubject(subject.id)} |
| 1563 | <i className="fa-solid fa-arrow-left"></i> Back to Classes List | {() => setViewMode('list')} |
| 1567 | <i className="fa-solid fa-pen"></i> Edit Class Settings | {() => editClass(selectedClass)} |
| 1570 | <i className="fa-solid fa-trash"></i> Delete Class | {() => deleteClass(selectedClass)} |
| 1599 | <i className="fa-solid fa-xmark"></i> | {() => setIsSubjectModalOpen(false)} |
| 1709 | Cancel | {() => setIsSubjectModalOpen(false)} |
| 1716 | {subjectModalMode === 'assign' && 'Link to Class'} {subjectModalMode === 'create' && 'Create & Link'} {subjectModalMode === 'edit' && 'Save Subject'} | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 772 | th | Class Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('name')} | None declared |
| 775 | th | Class Code {sortBy === 'classCode' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('classCode')} | None declared |
| 780 | th | Classroom Number {sortBy === 'room' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('room')} | None declared |
| 783 | th | Capacity (Occupied / Full Capacity) {sortBy === 'capacity' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('capacity')} | None declared |
| 786 | th | Total Students {sortBy === 'students' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('students')} | None declared |
| 805 | tr | <td> <div className="roles-name-cell"> <div className="roles-name-icon" style={{ background: 'var(--amberbg)', color: 'var(--amber)' }}> <i className="fa-solid fa-school"></i> </div> <div> <div className="roles-name-text"> {item.name} {item.section ? ' - ${item.section}' : ''} </div> </div> </div> </td> <td> <span className="badge badge-gray">{item | {() => { setSelectedClassId(item.id) setDetailTab('overview') setViewMode('detail') }} | None declared |
| 872 | td | <div className="roles-actions"> <button className="btn-icon-sm tooltip" data-tooltip="view" title="view" onClick={() => { showToast("Action: view", "info") setSelectedClassId(item.id) setDetailTab('overview') setViewMode('detail') }} > <i className="fa-solid fa-eye"></i> </button> <button className="btn-icon-sm tooltip" data-tooltip="edit" title="e | {(event) => event.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 733 | <option value="all">All Statuses</option> <option value="active">Active</option> <option value="inactive">Blocked</option> |
| 743 | <option value="all">All Teachers</option> {teachingStaff.map((t) => ( <option key={t.id} value={String(t.id)}> {t.name} </option> ))} |
| 756 | <option value="all">All Capacities</option> <option value="available">Has Vacancies</option> <option value="full">At Full Capacity</option> |
| 994 | <option value="">Select teacher</option> {teachingStaff.map((teacher) => ( <option key={teacher.id} value={teacher.id}> {teacher.name} - {teacher.department} </option> ))} |
| 1010 | <option value=""> {!editingId ? 'Save class configuration first' : studentsInFormClass.length === 0 ? 'No students assigned yet' : 'Select from classroom students'} </option> {studentsInFormClass.map((student) => ( <option key={student.id} value={student.id}> Roll {student.rollNo}: {student.name} </option> ))} |
| 1028 | <option value="active">Active</option> <option value="inactive">Blocked</option> |
| 1105 | <option value="">Select subject teacher</option> {teachingStaff.map((teacher) => ( <option key={teacher.id} value={teacher.id}> {teacher.name} </option> ))} |
| 1425 | <option value="">Select subject teacher</option> {teachingStaff.map((t) => ( <option key={t.id} value={t.id}> {t.name} </option> ))} |
| 1610 | <option value="">Choose universal subject</option> {subjects .filter((s) => !(selectedClass?.subjectIds &#124;&#124; []).includes(s.id)) .map((s) => ( <option key={s.id} value={s.id}> {s.name} ({s.code}) </option> ))} |
| 1644 | {SUBJECT_CATEGORIES.map((cat) => ( <option key={cat} value={cat}> {cat} </option> ))} |
| 1693 | <option value="">Select subject teacher</option> {teachingStaff.map((t) => ( <option key={t.id} value={t.id}> {t.name} </option> ))} |

### Storage reads and writes

| Line | Call |
|---|---|
| 72 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 75 | readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS) |
| 76 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 77 | readStoredList(STORAGE_KEYS.staff, STAFF) |
| 83 | writeStoredList(STORAGE_KEYS.classes, classes) |
| 88 | writeStoredList(STORAGE_KEYS.subjects, subjects) |

### Functions

- Classes (line 31)
- showToast (line 100)
- getTeacherName (line 105)
- toggleSort (line 109)
- toggleClassStatus (line 119)
- handleExportCSV (line 186)
- handleExportPDF (line 224)
- updateForm (line 265)
- resetForm (line 275)
- saveClass (line 280)
- editClass (line 351)
- deleteClass (line 370)
- handleOpenSubjectModal (line 384)
- handleSaveSubjectModal (line 426)
- handleUnlinkSubject (line 544)
- handleCompleteDeleteSubject (line 561)
- handleInlineTeacherChange (line 578)

## pages/dashboard.js

340 lines; 1 field definitions; 1 button definitions; 0 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 207 | input checkbox | Simulate Birthday (Demo Mode) | {demoMode} | {(e) => { setDemoMode(e.target.checked) showToast(e.target.checked ? "Demo Birthday Simulation Enabled" : "Simulation Disabled - Showing Real Dates", "info") }} | None declared | id=demoModeToggle |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 286 | <i className="fa-solid fa-cake-candles"></i> Go to Celebrations Hub | {() => window.location.href = '/birthdays'} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 298 | div | <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: b.gender === 'Female' ? 'var(--purplebg)' : 'var(--bluebg)', color: b.gender === 'Female' ? 'var(--purple)' : 'var(--blue)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 'bold' }}> {b.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()} | {() => window.location.href = '/birthdays'} | None declared |

### Storage reads and writes

| Line | Call |
|---|---|
| 62 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 63 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 64 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 66 | localStorage.getItem('educore.currentUser') |

### Functions

- calculateAge (line 12)
- getBirthdayCountdown (line 21)
- Dashboard (line 50)
- showToast (line 80)

## pages/exam-routine.js

1021 lines; 13 field definitions; 16 button definitions; 1 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 716 | select  | Academic Exam | {selectedExamId} | {e => setSelectedExamId(Number(e.target.value) &#124;&#124; '')} | None declared | None declared |
| 723 | select  | Filter by Class | {selectedClassId} | {e => setSelectedClassId(Number(e.target.value) &#124;&#124; '')} | None declared | None declared |
| 798 | input  | (none in adjacent label) | {rule} | {e => updateRule(idx, e.target.value)} | None declared | None declared |
| 854 | input checkbox | (none in adjacent label) | {isChecked} | {e => { setSelectedStudents(prev => e.target.checked ? [...prev, stu.id] : prev.filter(id => id !== stu.id) ) }} | None declared | None declared |
| 915 | select  | Exam Period <span className="req">*</span> | {routineForm.examId} | {e => setRoutineForm(f => ({ ...f, examId: e.target.value }))} | required=true | None declared |
| 924 | input radio | <input type="radio" name="classMode" checked={classSelectionMode === 'all'} onChange={() => { setClassSelectionMode('all') setSelectedModalClassIds(classes.map(c => c.id)) }} /> All Classes / <input type="radio" name="classMode" checked={classSelectionMode === 'specific'} onChange={() => { setClassSelectionMode('specific') setSelectedModalClassIds(selectedClassId ? [Number(selectedClassId)] : [classes[0]?.id]) }} /> Select Specific Classes | {classSelectionMode === 'all'} | {() => { setClassSelectionMode('all') setSelectedModalClassIds(classes.map(c => c.id)) }} | None declared | name=classMode |
| 936 | input radio | <input type="radio" name="classMode" checked={classSelectionMode === 'all'} onChange={() => { setClassSelectionMode('all') setSelectedModalClassIds(classes.map(c => c.id)) }} /> All Classes / <input type="radio" name="classMode" checked={classSelectionMode === 'specific'} onChange={() => { setClassSelectionMode('specific') setSelectedModalClassIds(selectedClassId ? [Number(selectedClassId)] : [classes[0]?.id]) }} /> Select Specific Classes | {classSelectionMode === 'specific'} | {() => { setClassSelectionMode('specific') setSelectedModalClassIds(selectedClassId ? [Number(selectedClassId)] : [classes[0]?.id]) }} | None declared | name=classMode |
| 955 | input checkbox | Target Class Configuration <span className="req">*</span> | {isChecked} | {e => { setSelectedModalClassIds(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id) ) }} | None declared | None declared |
| 975 | select  | Subject <span className="req">*</span> | {routineForm.subjectId} | {e => setRoutineForm(f => ({ ...f, subjectId: e.target.value }))} | required=true | None declared |
| 982 | input date | Exam Date <span className="req">*</span> | {routineForm.date} | {e => setRoutineForm(f => ({ ...f, date: e.target.value }))} | required=true | None declared |
| 986 | input  | Room Name <span className="req">*</span> | {routineForm.room} | {e => setRoutineForm(f => ({ ...f, room: e.target.value }))} | required=true | None declared |
| 990 | input time | Start Time <span className="req">*</span> | {routineForm.startTime} | {e => setRoutineForm(f => ({ ...f, startTime: e.target.value }))} | required=true | None declared |
| 994 | input time | End Time <span className="req">*</span> | {routineForm.endTime} | {e => setRoutineForm(f => ({ ...f, endTime: e.target.value }))} | required=true | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 694 | <i className="fa-solid fa-print"></i> Print Routine | {() => printRoutine(selectedExamId, selectedClassId &#124;&#124; 'all')} |
| 698 | <i className="fa-solid fa-plus"></i> Add Routine Slot | {openAddRoutine} |
| 704 | <i className="fa-solid fa-print"></i> Bulk Print Admit Cards ( {selectedStudents.length} ) | {() => printAdmitCardsBulk(selectedStudents, selectedExamId)} |
| 733 | <i className="fa-solid fa-calendar-days"></i> Scheduled Routine | {() => setActiveTab('routine')} |
| 736 | <i className="fa-solid fa-shield-halved"></i> Rules &amp; Regulations | {() => setActiveTab('rules')} |
| 739 | <i className="fa-solid fa-id-card"></i> Admit Card Generator | {() => setActiveTab('admit')} |
| 773 | <i className="fa-solid fa-pen"></i> | {() => openEditRoutine(r)} |
| 774 | <i className="fa-solid fa-trash"></i> | {() => deleteRoutine(r.id)} |
| 790 | <i className="fa-solid fa-plus"></i> Add Direction | {addRule} |
| 804 | <i className="fa-solid fa-trash"></i> | {() => deleteRule(idx)} |
| 830 | Select All | {() => setSelectedStudents(activeClassStudents.map(s => s.id))} |
| 831 | Deselect All | {() => setSelectedStudents([])} |
| 882 | <i className="fa-solid fa-print"></i> Generate Admit Card | {() => printAdmitCardsBulk([stu.id], selectedExamId)} |
| 908 | <i className="fa-solid fa-xmark"></i> | {() => setShowModal(false)} |
| 999 | Cancel | {() => setShowModal(false)} |
| 1000 | <i className="fa-solid fa-floppy-disk"></i> {editingId ? 'Update Slot' : 'Schedule Slot'} | submit |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 716 | <option value="">— Select Exam —</option> {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.academicYear})</option>)} |
| 723 | <option value="">All Classes</option> {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' - ${c.section}' : ''}</option>)} |
| 915 | <option value="">— Select Exam —</option> {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)} |
| 975 | <option value="">— Select Subject —</option> {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)} |

### Storage reads and writes

| Line | Call |
|---|---|
| 88 | readStoredList('educore.exams', []) |
| 89 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 90 | readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS) |
| 91 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 92 | readStoredList('educore.examRoutine', INITIAL_ROUTINES) |
| 93 | readStoredList('educore.examRules', DEFAULT_RULES) |
| 110 | writeStoredList('educore.examRoutine', routines) |
| 115 | writeStoredList('educore.examRules', rules) |

### Functions

- ExamRoutine (line 51)
- getDayOfWeek (line 80)
- showToast (line 118)
- getClassName (line 124)
- getSubjectName (line 129)
- getExamName (line 134)
- hasPendingFees (line 140)
- getPendingAmount (line 144)
- openAddRoutine (line 169)
- openEditRoutine (line 181)
- saveRoutine (line 197)
- deleteRoutine (line 235)
- updateRule (line 242)
- deleteRule (line 248)
- addRule (line 252)
- printAdmitCardsBulk (line 257)
- printRoutine (line 430)

## pages/examinations.js

1432 lines; 26 field definitions; 22 button definitions; 1 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 696 | input  | Search exam name... | {search} | {e => setSearch(e.target.value)} | None declared | None declared |
| 699 | select  | (none in adjacent label) | {statusFilter} | {e => setStatusFilter(e.target.value)} | None declared | None declared |
| 705 | select  | (none in adjacent label) | {classFilter} | {e => setClassFilter(e.target.value)} | None declared | None declared |
| 785 | select  | Select Exam | {selectedExamId &#124;&#124; ''} | {e => setSelectedExamId(Number(e.target.value) &#124;&#124; null)} | None declared | None declared |
| 792 | select  | Select Class | {selectedClassId} | {e => setSelectedClassId(e.target.value)} | None declared | None declared |
| 801 | input number | Max Marks Per Subject | {marksMaxOverride} | {e => setMarksMaxOverride(Number(e.target.value) &#124;&#124; 100)} | min={1}; max={500} | None declared |
| 857 | input number | — | {stuMarks[sub.name] ?? ''} | {e => updateMark(stu.id, sub.name, e.target.value)} | min={0}; max={marksMaxOverride} | None declared |
| 880 | input  | Teacher's remarks... | {marksRemarks[stu.id] &#124;&#124; ''} | {e => setMarksRemarks(prev => ({ ...prev, [stu.id]: e.target.value }))} | None declared | None declared |
| 924 | select  | Exam | {selectedExamId &#124;&#124; ''} | {e => setSelectedExamId(Number(e.target.value) &#124;&#124; null)} | None declared | None declared |
| 931 | select  | Filter by Class | {classFilter} | {e => setClassFilter(e.target.value)} | None declared | None declared |
| 1097 | input  | Search student or ADM... | {reportSearch} | {e => setReportSearch(e.target.value)} | None declared | None declared |
| 1239 | input  | (none in adjacent label) | {item.grade} | {(e) => { const updated = [...gradeSchema] updated[idx].grade = e.target.value.toUpperCase() setGradeSchema(updated) }} | None declared | None declared |
| 1251 | input number | (none in adjacent label) | {item.minPct} | {(e) => { const updated = [...gradeSchema] updated[idx].minPct = Number(e.target.value) &#124;&#124; 0 setGradeSchema(updated) }} | min={0}; max={100} | None declared |
| 1266 | input number | (none in adjacent label) | {item.maxPct} | {(e) => { const updated = [...gradeSchema] updated[idx].maxPct = Number(e.target.value) &#124;&#124; 0 setGradeSchema(updated) }} | min={0}; max={100} | None declared |
| 1281 | select  | (none in adjacent label) | {item.pass ? 'pass' : 'fail'} | {(e) => { const updated = [...gradeSchema] updated[idx].pass = e.target.value === 'pass' setGradeSchema(updated) }} | None declared | None declared |
| 1297 | input color | (none in adjacent label) | {item.color.startsWith('#') ? item.color : '#3b82f6'} | {(e) => { const updated = [...gradeSchema] updated[idx].color = e.target.value updated[idx].bg = e.target.value + '1F' setGradeSchema(updated) }} | None declared | None declared |
| 1349 | input  | Exam Name <span className="req">*</span> | {examForm.name} | {e => setExamForm(f => ({ ...f, name: e.target.value }))} | required=true | None declared |
| 1353 | input  | Academic Year | {examForm.academicYear} | {e => setExamForm(f => ({ ...f, academicYear: e.target.value }))} | None declared | None declared |
| 1357 | select  | Status | {examForm.status} | {e => setExamForm(f => ({ ...f, status: e.target.value }))} | None declared | None declared |
| 1365 | input date | Start Date <span className="req">*</span> | {examForm.startDate} | {e => setExamForm(f => ({ ...f, startDate: e.target.value }))} | required=true | None declared |
| 1369 | input date | End Date | {examForm.endDate} | {e => setExamForm(f => ({ ...f, endDate: e.target.value }))} | None declared | None declared |
| 1373 | input number | Max Marks Per Subject | {examForm.maxMarks} | {e => setExamForm(f => ({ ...f, maxMarks: e.target.value }))} | min={1} | None declared |
| 1377 | input number | Pass Mark | {examForm.passMark} | {e => setExamForm(f => ({ ...f, passMark: e.target.value }))} | min={1} | None declared |
| 1381 | input  | Conducted By | {examForm.conductedBy} | {e => setExamForm(f => ({ ...f, conductedBy: e.target.value }))} | None declared | None declared |
| 1390 | input checkbox | Applicable Classes <span className="req">*</span> | {isChecked} | {e => { setExamForm(f => ({ ...f, classIds: e.target.checked ? [...f.classIds, c.id] : f.classIds.filter(id => id !== c.id) })) }} | None declared | None declared |
| 1405 | textarea  | Description | {examForm.description} | {e => setExamForm(f => ({ ...f, description: e.target.value }))} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 642 | <i className="fa-solid fa-plus"></i> Schedule Exam | {openAddExam} |
| 647 | <i className="fa-solid fa-floppy-disk"></i> Save All Marks | {saveMarks} |
| 676 | <i className="fa-solid fa-list-check"></i> Exam Schedule | {() => setActiveTab('exams')} |
| 679 | <i className="fa-solid fa-pen-to-square"></i> Marks Entry | {() => setActiveTab('marks')} |
| 682 | <i className="fa-solid fa-chart-bar"></i> Analytics &amp; Reports | {() => setActiveTab('reports')} |
| 685 | <i className="fa-solid fa-sliders"></i> Grading Settings | {() => setActiveTab('grading')} |
| 697 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 755 | <i className="fa-solid fa-pen-to-square"></i> | {() => { setSelectedExamId(ex.id); setSelectedClassId(ex.classIds[0] ? String(ex.classIds[0]) : ''); setActiveTab('marks') }} |
| 758 | <i className="fa-solid fa-chart-bar"></i> | {() => { setSelectedExamId(ex.id); setClassFilter('all'); setActiveTab('reports') }} |
| 761 | <i className="fa-solid fa-pen"></i> | {() => openEditExam(ex)} |
| 764 | <i className="fa-solid fa-trash"></i> | {() => deleteExam(ex.id)} |
| 890 | <i className="fa-solid fa-print"></i> | {() => printReportCard(stu, selectedExamId)} |
| 907 | <i className="fa-solid fa-floppy-disk"></i> Save All Marks | {saveMarks} |
| 1104 | <i className="fa-solid fa-xmark"></i> | {() => setReportSearch('')} |
| 1111 | Reset Filter | {() => setReportFilterMode('all')} |
| 1172 | <i className="fa-solid fa-print"></i> Print | {() => printReportCard(a.student, selectedExamId)} |
| 1205 | <i className="fa-solid fa-arrow-rotate-left"></i> Reset Defaults | {() => { if (confirm('Are you sure you want to reset grading criteria to default values?')) { setGradeSchema(DEFAULT_GRADE_SCHEMA) showToast('Grading schema reset to default') } }} |
| 1213 | <i className="fa-solid fa-plus"></i> Add Grade Level | {() => { const newRow = { grade: 'NEW', minPct: 0, maxPct: 10, pass: true, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' } setGradeSchema(prev => [...prev, newRow].sort((a, b) => b.minPct - a.minPct)) showToast('Grade level added') }} |
| 1314 | <i className="fa-solid fa-trash"></i> | {() => { const updated = gradeSchema.filter((_, i) => i !== idx) setGradeSchema(updated) showToast('Grade level removed') }} |
| 1342 | <i className="fa-solid fa-xmark"></i> | {() => setShowExamModal(false)} |
| 1410 | Cancel | {() => setShowExamModal(false)} |
| 1411 | <i className="fa-solid fa-floppy-disk"></i> {editingExamId ? 'Update Exam' : 'Schedule Exam'} | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 959 | div | <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, color: col, display: 'grid', placeItems: 'center', fontSize: 18 }}> <i className={'fa-solid ${icon}'}></i> </div> <div> <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>{val}</div> <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', | {() => { if (id === 'avg') return setReportFilterMode(id) }} | None declared |
| 1125 | th | Student {renderSortIcon('name')} | {() => toggleSort('name')} | None declared |
| 1129 | th | Total Marks {renderSortIcon('marks')} | {() => toggleSort('marks')} | None declared |
| 1132 | th | Percentage {renderSortIcon('pct')} | {() => toggleSort('pct')} | None declared |
| 1135 | th | Grade {renderSortIcon('grade')} | {() => toggleSort('grade')} | None declared |
| 1138 | th | Result {renderSortIcon('pass')} | {() => toggleSort('pass')} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 699 | <option value="all">All Status</option> <option value="upcoming">Upcoming</option> <option value="ongoing">Ongoing</option> <option value="completed">Completed</option> |
| 705 | <option value="all">All Classes</option> {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' - ${c.section}' : ''}</option>)} |
| 785 | <option value="">— Choose Exam —</option> {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)} |
| 792 | <option value="">— Choose Class —</option> {(selectedExam ? classes.filter(c => selectedExam.classIds.includes(c.id)) : classes).map(c => ( <option key={c.id} value={c.id}>{c.name}{c.section ? ' - ${c.section}' : ''}</option> ))} |
| 924 | <option value="">— Choose Exam —</option> {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)} |
| 931 | <option value="all">All Classes</option> {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ' - ${c.section}' : ''}</option>)} |
| 1281 | <option value="pass">✓ Pass</option> <option value="fail">✗ Fail</option> |
| 1357 | <option value="upcoming">Upcoming</option> <option value="ongoing">Ongoing</option> <option value="completed">Completed</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 170 | readStoredList('educore.exams', INITIAL_EXAMS) |
| 171 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 172 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 173 | readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS) |
| 174 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 175 | readStoredList('educore.gradeSchema', DEFAULT_GRADE_SCHEMA) |
| 176 | localStorage.getItem('educore.currentUser') |
| 182 | writeStoredList('educore.exams', exams) |
| 188 | writeStoredList(STORAGE_KEYS.students, students) |
| 193 | writeStoredList('educore.gradeSchema', gradeSchema) |

### Functions

- Examinations (line 85)
- calcGrade (line 126)
- gradeColor (line 133)
- gradeBg (line 139)
- getPassFail (line 145)
- toggleSort (line 152)
- renderSortIcon (line 161)
- showToast (line 196)
- getClassName (line 202)
- getExam (line 207)
- getStudentExam (line 209)
- openAddExam (line 233)
- openEditExam (line 239)
- saveExam (line 256)
- deleteExam (line 286)
- updateMark (line 330)
- saveMarks (line 337)
- printReportCard (line 374)

## pages/fees.js

1771 lines; 22 field definitions; 25 button definitions; 4 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 794 | input  | Search invoice, student name... | {searchQuery} | {(e) => setSearchQuery(e.target.value)} | None declared | None declared |
| 807 | select  | (none in adjacent label) | {statusFilter} | {(e) => setStatusFilter(e.target.value)} | None declared | None declared |
| 815 | select  | (none in adjacent label) | {classFilter} | {(e) => setClassFilter(e.target.value)} | None declared | None declared |
| 823 | select  | (none in adjacent label) | {sortBy} | {(e) => setSortBy(e.target.value)} | None declared | None declared |
| 1120 | input  | Payer Full Name <span className="req">*</span> | {paymentForm.payerName &#124;&#124; ''} | {(e) => setPaymentForm({ ...paymentForm, payerName: e.target.value })} | required=true | None declared |
| 1132 | select  | Relation to Student | {paymentForm.relationship &#124;&#124; 'Father'} | {(e) => setPaymentForm({ ...paymentForm, relationship: e.target.value })} | None declared | None declared |
| 1148 | input  | Custom Relation <span className="req">*</span> | {paymentForm.customRelationship &#124;&#124; ''} | {(e) => setPaymentForm({ ...paymentForm, customRelationship: e.target.value })} | required=true | None declared |
| 1161 | select  | Payment Method | {paymentForm.paymentMode &#124;&#124; 'Cash'} | {(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value, onlineApp: e.target.value === 'Online' ? 'E-Sewa' : '' })} | None declared | None declared |
| 1175 | select  | Online Payment App / Platform | {paymentForm.onlineApp &#124;&#124; 'E-Sewa'} | {(e) => setPaymentForm({ ...paymentForm, onlineApp: e.target.value })} | None declared | None declared |
| 1192 | input  | Custom App Name <span className="req">*</span> | {paymentForm.customOnlineApp &#124;&#124; ''} | {(e) => setPaymentForm({ ...paymentForm, customOnlineApp: e.target.value })} | required=true | None declared |
| 1206 | select  | Discount Settings | {paymentForm.discountType &#124;&#124; 'none'} | {(e) => setPaymentForm({ ...paymentForm, discountType: e.target.value, customDiscount: '' })} | None declared | None declared |
| 1226 | input number | {paymentForm.discountType === 'customPercent' ? 'Discount (%)' : 'Discount ($)'} <span className="req">*</span> | {paymentForm.customDiscount} | {(e) => setPaymentForm({ ...paymentForm, customDiscount: e.target.value })} | required=true; min=0 | None declared |
| 1245 | select  | Tax System | {paymentForm.taxType &#124;&#124; 'none'} | {(e) => setPaymentForm({ ...paymentForm, taxType: e.target.value, customTax: '' })} | None declared | None declared |
| 1262 | input number | {paymentForm.taxType === 'customPercent' ? 'Tax Rate (%)' : 'Tax Amount ($)'} <span className="req">*</span> | {paymentForm.customTax} | {(e) => setPaymentForm({ ...paymentForm, customTax: e.target.value })} | required=true; min=0 | None declared |
| 1338 | input  | Billing Period Label <span className="req">*</span> | {batchForm.billingMonth} | {(e) => setBatchForm({ ...batchForm, billingMonth: e.target.value })} | required=true | None declared |
| 1351 | select  | Target Academic Class | {batchForm.targetClass} | {(e) => { const val = e.target.value const activeForClass = fees.filter(f => f.status === 'active' && (val === 'all' &#124;&#124; (f.classIds &#124;&#124; []).includes(Number(val)))).map(f => f.id) setBatchForm(prev => ({ ...prev, targetClass: val, selectedFeeIds: activeForClass })) }} | None declared | None declared |
| 1393 | input checkbox | Select Fees to Bill | {isChecked} | {() => { setBatchForm(prev => { const list = prev.selectedFeeIds const updated = list.includes(f.id) ? list.filter(id => id !== f.id) : [...list, f.id] return { ...prev, selectedFeeIds: updated } }) }} | None declared | None declared |
| 1630 | input  | Fee Identifier/Name <span className="req">*</span> | {feeForm.name} | {(e) => setFeeForm({ ...feeForm, name: e.target.value })} | required=true | None declared |
| 1643 | input number | Billing Amount ($) <span className="req">*</span> | {feeForm.amount} | {(e) => setFeeForm({ ...feeForm, amount: e.target.value })} | required=true | None declared |
| 1654 | select  | Period Frequency | {feeForm.frequency} | {(e) => setFeeForm({ ...feeForm, frequency: e.target.value })} | None declared | None declared |
| 1671 | textarea  | Description (Optional) | {feeForm.description} | {(e) => setFeeForm({ ...feeForm, description: e.target.value })} | None declared | None declared |
| 1733 | input checkbox | (none in adjacent label) | {isChecked} | {() => toggleClassAssignment(cls.id)} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 681 | <i className="fa-solid fa-file-invoice-dollar"></i> Generate Monthly Invoices | {openBatchGenerate} |
| 685 | <i className="fa-solid fa-plus"></i> Add Fee Structure | {() => openEditFee(null)} |
| 695 | <i className="fa-solid fa-file-invoice-dollar"></i> Invoices &amp; Collections Ledger | {() => setActiveTab('ledger')} |
| 716 | <i className="fa-solid fa-sliders"></i> Fee Configurator | {() => setActiveTab('configurator')} |
| 800 | <i className="fa-solid fa-xmark"></i> | {() => setSearchQuery('')} |
| 834 | <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> Export Excel (CSV) | {handleExportCSV} |
| 837 | <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> Download PDF Report | {handleExportPDF} |
| 924 | <i className="fa-solid fa-print"></i> Print Receipt | {() => openPrintReceipt(t)} |
| 928 | <i className="fa-solid fa-credit-card"></i> Pay Fee | {() => openRecordPayment(t)} |
| 1027 | <i className="fa-solid fa-pencil" style={{ marginRight: '4px' }}></i> Edit Config | {() => openEditFee(fee)} |
| 1034 | <i className="fa-solid fa-trash" style={{ marginRight: '4px' }}></i> Remove | {() => handleDeleteFee(fee.id)} |
| 1090 | <i className="fa-solid fa-xmark"></i> | {() => setShowPaymentModal(false)} |
| 1306 | Cancel | {() => setShowPaymentModal(false)} |
| 1307 | <i className="fa-solid fa-circle-check"></i> Collect Payment | submit |
| 1328 | <i className="fa-solid fa-xmark"></i> | {() => setShowBatchModal(false)} |
| 1428 | Cancel | {() => setShowBatchModal(false)} |
| 1429 | <i className="fa-solid fa-play"></i> Run Generator | submit |
| 1450 | <i className="fa-solid fa-xmark"></i> | {() => setActiveReceipt(null)} |
| 1599 | Close | {() => setActiveReceipt(null)} |
| 1600 | <i className="fa-solid fa-print"></i> Print Slip | {() => window.print()} |
| 1620 | <i className="fa-solid fa-xmark"></i> | {() => setShowFeeModal(false)} |
| 1686 | Select All | {() => setAllClassesAssignment(true)} |
| 1694 | Clear All | {() => setAllClassesAssignment(false)} |
| 1749 | Cancel | {() => setShowFeeModal(false)} |
| 1750 | <i className="fa-solid fa-circle-check"></i> Save Config | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 1050 | div | roles-table-card academic-list-card | {() => openEditFee(null)} | None declared |
| 1440 | div | modal-overlay print-receipt-overlay | {() => setActiveReceipt(null)} | None declared |
| 1441 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 807 | <option value="all">All Payment Statuses</option> <option value="paid">✅ Paid Invoices</option> <option value="pending">⏳ Pending Verification</option> <option value="overdue">🚨 Overdue Arrears</option> |
| 815 | <option value="all">All Grade Classes</option> {classes.map((c) => ( <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option> ))} |
| 823 | <option value="latest">Sort: Latest Invoices</option> <option value="oldest">Sort: Oldest Invoices</option> <option value="amountHigh">Sort: Amount (High to Low)</option> <option value="amountLow">Sort: Amount (Low to High)</option> <option value="studentName">Sort: Student Name (A-Z)</option> |
| 1132 | {payerRelationships.map((rel) => ( <option key={rel} value={rel}>{rel}</option> ))} <option value="custom">+ Add Custom Relation</option> |
| 1161 | <option value="Cash">Cash</option> <option value="Online">Online</option> |
| 1175 | {onlineModes.map((mode) => ( <option key={mode} value={mode}>{mode}</option> ))} <option value="custom">+ Add Custom App</option> |
| 1206 | <option value="none">No Discount</option> <option value="5%">5% Discount</option> <option value="10%">10% Discount</option> <option value="25%">25% Discount</option> <option value="50%">50% Scholarship</option> <option value="100%">100% Full Waiver</option> <option value="customPercent">Custom Percent (%)</option> <option value="customAmount">Custom Amount ($)</option> |
| 1245 | <option value="none">No Tax</option> <option value="13%">13% VAT</option> <option value="5%">5% Service Tax</option> <option value="customPercent">Custom Percent (%)</option> <option value="customAmount">Custom Amount ($)</option> |
| 1351 | <option value="all">All School Classes</option> {classes.map((c) => ( <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option> ))} |
| 1654 | <option value="Monthly">Monthly</option> <option value="Weekly">Weekly</option> <option value="Yearly">Yearly</option> <option value="One-Time">One-Time</option> <option value="Hourly">Hourly</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 123 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 136 | writeStoredList(STORAGE_KEYS.students, storedStudents) |
| 140 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 141 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 142 | readStoredList(STORAGE_KEYS.roles, []) |
| 143 | readStoredList('educore.fees', INITIAL_FEES) |
| 144 | readStoredList('educore.onlinePaymentModes', ['E-Sewa', 'Khalti', 'Bank Transfer']) |
| 145 | readStoredList('educore.payerRelationships', ['Self', 'Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Guardian']) |
| 147 | localStorage.getItem('educore.currentUser') |
| 155 | writeStoredList(STORAGE_KEYS.students, students) |
| 160 | writeStoredList('educore.fees', fees) |
| 165 | writeStoredList('educore.onlinePaymentModes', onlineModes) |
| 170 | writeStoredList('educore.payerRelationships', payerRelationships) |
| 398 | writeStoredList('educore.onlinePaymentModes', updatedModes) |
| 416 | writeStoredList('educore.payerRelationships', updatedRels) |

### Functions

- parseMonthsCount (line 23)
- getFeeItemDetails (line 32)
- Fees (line 63)
- showToast (line 173)
- getCollectorName (line 188)
- handleExportCSV (line 321)
- handleExportPDF (line 339)
- openRecordPayment (line 357)
- handleSavePayment (line 379)
- openBatchGenerate (line 462)
- handleRunBatchGenerate (line 481)
- openPrintReceipt (line 562)
- openEditFee (line 567)
- handleSaveFee (line 597)
- handleDeleteFee (line 636)
- toggleClassAssignment (line 649)
- setAllClassesAssignment (line 659)

## pages/finance.js

1091 lines; 13 field definitions; 16 button definitions; 0 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 458 | input date | (none in adjacent label) | {selectedDate} | {e => setSelectedDate(e.target.value)} | None declared | None declared |
| 498 | input number | Opening Cash ($) | {openingBalanceInput} | {e => setOpeningBalanceInput(e.target.value)} | None declared | None declared |
| 678 | select  | Class | {selectedClassId} | {e => setSelectedClassId(e.target.value)} | None declared | None declared |
| 685 | select  | Medium | {selectedPaymentMode} | {e => setSelectedPaymentMode(e.target.value)} | None declared | None declared |
| 692 | select  | Collector | {selectedCollector} | {e => setSelectedCollector(e.target.value)} | None declared | None declared |
| 699 | input  | Search student, bill number, or payer... | {searchQuery} | {e => setSearchQuery(e.target.value)} | None declared | None declared |
| 928 | input  | Search expense titles, descriptions... | {searchQuery} | {e => setSearchQuery(e.target.value)} | None declared | None declared |
| 996 | input text | Expense Title | {expenseForm.title} | {e => setExpenseForm(prev => ({ ...prev, title: e.target.value }))} | required=true | None declared |
| 1008 | select  | Category | {expenseForm.category} | {e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))} | None declared | None declared |
| 1019 | input number | Amount ($) | {expenseForm.amount} | {e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))} | required=true; min=1 | None declared |
| 1032 | input date | Transaction Date | {expenseForm.date} | {e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))} | required=true | None declared |
| 1043 | textarea  | Auditing Notes | {expenseForm.notes} | {e => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))} | None declared | None declared |
| 1055 | input file | <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 18, color: 'var(--accent)' }}></i> <span>{receiptFile ? receiptFile.name : 'Upload receipt file'}</span> {receiptFile && <span style={{ fontSize: 9, color: 'var(--t3)' }}>({expenseForm.receiptSize})</span>} | — | {handleMockReceiptUpload} | accept=.png,.jpg,.jpeg,.pdf | id=expense-receipt-upload |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 467 | <i className="fa-solid fa-print"></i> Day Ledger PDF | {handlePrintLedger} |
| 507 | <i className="fa-solid fa-door-open"></i> Open Today's Books | {handleOpenDay} |
| 512 | <i className="fa-solid fa-lock"></i> Verify & Close Today's Books | {handleCloseDay} |
| 545 | <i className="fa-solid fa-chart-line"></i> Cash Auditing Logs | {() => setActiveTab('overview')} |
| 548 | <i className="fa-solid fa-money-bill-wave"></i> Fee Collections Report | {() => setActiveTab('collections')} |
| 551 | <i className="fa-solid fa-wallet"></i> Payroll & Previous Dues | {() => setActiveTab('payroll')} |
| 554 | <i className="fa-solid fa-receipt"></i> School Expense Tracker | {() => setActiveTab('expenses')} |
| 653 | Daily Collections List | {() => setCollectionsSubTab('daily')} |
| 659 | Weekly Class-Wise Summary | {() => setCollectionsSubTab('weekly')} |
| 665 | Pending Collections ( {allFeeCollections.filter(c=>c.status==='pending').length} ) | {() => setCollectionsSubTab('pending')} |
| 705 | <i className="fa-solid fa-xmark"></i> | {() => setSearchQuery('')} |
| 707 | <i className="fa-solid fa-file-csv"></i> Export CSV | {handleExportCollections} |
| 811 | Collect Dues | {() => { setActiveTab('collections') setCollectionsSubTab('daily') showToast('Please collect outstanding payments directly from the Student Details Page.', 'info') }} |
| 872 | Settle (Bank) | {() => handleSettleDueSalary(due.staffId, due.slipId, due.netSalary, 'Bank Transfer')} |
| 879 | Settle (Cash) | {() => handleSettleDueSalary(due.staffId, due.slipId, due.netSalary, 'Cash')} |
| 1070 | <i className="fa-solid fa-plus"></i> Record Audited Expense | submit |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 678 | <option value="all">All Classes</option> {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)} |
| 685 | <option value="all">All Mediums</option> {PAYMENT_MODES.map(mode => <option key={mode} value={mode}>{mode}</option>)} |
| 692 | <option value="all">All Staff</option> {uniqueCollectors.map(col => <option key={col} value={col}>{col}</option>)} |
| 1008 | {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)} |

### Storage reads and writes

| Line | Call |
|---|---|
| 53 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 54 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 55 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 56 | readStoredList('educore.expenses', [ { id: 1, title: 'May Office Internet', category: 'Internet & Software', amount: 150, date: '2026-05-10', notes: 'High-speed fiber connection renewal receipt attached', receiptName: 'internet_bill_may.png', receiptSize: '1.2 MB' }, { id: 2, title: 'Whiteboard Markers & Dusters', category: 'Office Supplies', amount: 80, date: '2026-06-12', notes: 'Purchased for secondary classrooms', receiptName: 'stationery_receipt.jpg', receiptSize: '740 KB' }, { id: 3, title: 'School Bus Fuel', category: 'Vehicle & Transport', amount: 450, date: '2026-06-28', notes: 'Diesel refill for Bus Route 3', receiptName: 'fuel_slip_2041.pdf', receiptSize: '1.8 MB' } ]) |
| 61 | readStoredList('educore.dailyAudit', [ { date: '2026-06-27', openingBalance: 12000, collected: 11500, disbursed: 0, expenses: 150, closingBalance: 23350, status: 'closed', closedBy: 'Super Admin' }, { date: '2026-06-28', openingBalance: 23350, collected: 5150, disbursed: 0, expenses: 450, closingBalance: 28050, status: 'closed', closedBy: 'Super Admin' } ]) |
| 69 | writeStoredList('educore.expenses', expenses) |
| 70 | writeStoredList('educore.dailyAudit', auditLogs) |
| 71 | writeStoredList(STORAGE_KEYS.students, students) |
| 72 | writeStoredList(STORAGE_KEYS.staff, staff) |

### Functions

- Finance (line 16)
- showToast (line 74)
- handleOpenDay (line 182)
- handleCloseDay (line 199)
- handleSettleDueSalary (line 219)
- pad (line 220)
- handleAddExpense (line 264)
- handleMockReceiptUpload (line 313)
- handleExportCollections (line 414)
- handlePrintLedger (line 424)

## pages/index.js

340 lines; 1 field definitions; 1 button definitions; 0 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 207 | input checkbox | Simulate Birthday (Demo Mode) | {demoMode} | {(e) => { setDemoMode(e.target.checked) showToast(e.target.checked ? "Demo Birthday Simulation Enabled" : "Simulation Disabled - Showing Real Dates", "info") }} | None declared | id=demoModeToggle |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 286 | <i className="fa-solid fa-cake-candles"></i> Go to Celebrations Hub | {() => window.location.href = '/birthdays'} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 298 | div | <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: b.gender === 'Female' ? 'var(--purplebg)' : 'var(--bluebg)', color: b.gender === 'Female' ? 'var(--purple)' : 'var(--blue)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 'bold' }}> {b.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()} | {() => window.location.href = '/birthdays'} | None declared |

### Storage reads and writes

| Line | Call |
|---|---|
| 62 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 63 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 64 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 66 | localStorage.getItem('educore.currentUser') |

### Functions

- calculateAge (line 12)
- getBirthdayCountdown (line 21)
- Home (line 50)
- showToast (line 80)

## pages/library.js

964 lines; 15 field definitions; 18 button definitions; 2 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 476 | input  | Search Title, Author, or ISBN... | {catalogSearch} | {(e) => setCatalogSearch(e.target.value)} | None declared | None declared |
| 488 | select  | (none in adjacent label) | {subjectFilter} | {(e) => setSubjectFilter(e.target.value)} | None declared | None declared |
| 598 | input  | Search recipient name or book title... | {checkoutSearch} | {(e) => setCheckoutSearch(e.target.value)} | None declared | None declared |
| 610 | select  | (none in adjacent label) | {checkoutFilter} | {(e) => setCheckoutFilter(e.target.value)} | None declared | None declared |
| 787 | input  | Book Title <span className="req">*</span> | {bookForm.title} | {(e) => setBookForm({ ...bookForm, title: e.target.value })} | required=true | None declared |
| 797 | input  | Author Name <span className="req">*</span> | {bookForm.author} | {(e) => setBookForm({ ...bookForm, author: e.target.value })} | required=true | None declared |
| 808 | select  | Subject / Class Category | {bookForm.subject} | {(e) => setBookForm({ ...bookForm, subject: e.target.value })} | None declared | None declared |
| 820 | input number | Quantity Stock | {bookForm.quantity} | {(e) => setBookForm({ ...bookForm, quantity: e.target.value })} | required=true; min=1; max=100 | None declared |
| 833 | input  | ISBN Identifier | {bookForm.isbn} | {(e) => setBookForm({ ...bookForm, isbn: e.target.value })} | None declared | None declared |
| 842 | input  | Publisher | {bookForm.publisher} | {(e) => setBookForm({ ...bookForm, publisher: e.target.value })} | None declared | None declared |
| 882 | select  | Select Book to Issue <span className="req">*</span> | {checkoutForm.bookId} | {(e) => setCheckoutForm({ ...checkoutForm, bookId: e.target.value })} | required=true | None declared |
| 899 | select  | Recipient Type | {checkoutForm.recipientType} | {(e) => setCheckoutForm({ ...checkoutForm, recipientType: e.target.value, recipientId: '' })} | None declared | None declared |
| 911 | select  | Select Member <span className="req">*</span> | {checkoutForm.recipientId} | {(e) => setCheckoutForm({ ...checkoutForm, recipientId: e.target.value })} | required=true | None declared |
| 923 | select  | Select Member <span className="req">*</span> | {checkoutForm.recipientId} | {(e) => setCheckoutForm({ ...checkoutForm, recipientId: e.target.value })} | required=true | None declared |
| 939 | input date | Loan Due Date <span className="req">*</span> | {checkoutForm.dueDate} | {(e) => setCheckoutForm({ ...checkoutForm, dueDate: e.target.value })} | required=true | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 393 | <i className="fa-solid fa-plus"></i> Add New Book | {handleOpenAddBook} |
| 396 | <i className="fa-solid fa-receipt"></i> Issue Book | {() => handleOpenCheckout()} |
| 459 | 📚 Books Catalog ( {filteredBooks.length} ) | {() => setActiveTab('catalog')} |
| 462 | 📖 Checkouts &amp; Issue Log ( {filteredCheckouts.length} ) | {() => setActiveTab('checkouts')} |
| 465 | 💸 Unpaid Fines ( {unpaidFines.length} ) | {() => setActiveTab('fines')} |
| 482 | <i className="fa-solid fa-xmark"></i> | {() => setCatalogSearch('')} |
| 555 | <i className="fa-solid fa-receipt"></i> | {() => handleOpenCheckout(book.id)} |
| 565 | <i className="fa-solid fa-pen-to-square"></i> | {() => handleOpenEditBook(book)} |
| 572 | <i className="fa-solid fa-trash-can"></i> | {() => handleDeleteBook(book.id, book.title)} |
| 604 | <i className="fa-solid fa-xmark"></i> | {() => setCheckoutSearch('')} |
| 682 | Mark Returned | {() => handleReturnBook(b.id)} |
| 740 | Collect Payment | {() => handlePayFine(f.id)} |
| 778 | <i className="fa-solid fa-xmark"></i> | {() => setShowBookModal(false)} |
| 852 | Cancel | {() => setShowBookModal(false)} |
| 855 | Save Book | submit |
| 873 | <i className="fa-solid fa-xmark"></i> | {() => setShowCheckoutModal(false)} |
| 950 | Cancel | {() => setShowCheckoutModal(false)} |
| 953 | Confirm Checkout | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 771 | div | modal-overlay | {() => setShowBookModal(false)} | None declared |
| 772 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |
| 866 | div | modal-overlay | {() => setShowCheckoutModal(false)} | None declared |
| 867 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 488 | <option value="all">All Subjects</option> {DEFAULT_SUBJECTS.map(subj => ( <option key={subj} value={subj}>{subj}</option> ))} |
| 610 | <option value="all">All Checkouts</option> <option value="issued">Active Issues</option> <option value="overdue">Overdue Loans</option> <option value="returned">Returned Books</option> |
| 808 | {DEFAULT_SUBJECTS.map(subj => ( <option key={subj} value={subj}>{subj}</option> ))} |
| 882 | <option value="">-- Choose Book --</option> {books.map(b => ( <option key={b.id} value={b.id} disabled={b.available <= 0}> {b.title} ({b.available} copies available) </option> ))} |
| 899 | <option value="Student">Student</option> <option value="Staff">Staff</option> |
| 911 | <option value="">-- Choose Student --</option> {students.map(s => ( <option key={s.id} value={s.id}>{s.name} (ADM-{s.admissionNo})</option> ))} |
| 923 | <option value="">-- Choose Staff Member --</option> {staff.map(st => ( <option key={st.id} value={st.id}>{st.name} ({st.role})</option> ))} |

### Storage reads and writes

| Line | Call |
|---|---|
| 61 | readStoredList(STORAGE_KEYS.books, INITIAL_BOOKS) |
| 63 | readStoredList(STORAGE_KEYS.borrowings, INITIAL_BORROWINGS) |
| 65 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 67 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 70 | localStorage.getItem('educore.currentUser') |
| 77 | readStoredList(STORAGE_KEYS.roles, []) |
| 91 | writeStoredList(STORAGE_KEYS.books, books) |
| 96 | writeStoredList(STORAGE_KEYS.borrowings, borrowings) |

### Functions

- Library (line 31)
- showToast (line 134)
- handleOpenAddBook (line 157)
- handleOpenEditBook (line 164)
- handleSaveBook (line 179)
- handleDeleteBook (line 225)
- handleOpenCheckout (line 240)
- handleIssueBook (line 255)
- handleReturnBook (line 300)
- handlePayFine (line 329)

## pages/parents.js

1451 lines; 29 field definitions; 17 button definitions; 0 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 444 | input  | Search name, ID, phone, child... | {search} | {(e) => setSearch(e.target.value)} | None declared | None declared |
| 455 | select  | (none in adjacent label) | {statusFilter} | {(e) => setStatusFilter(e.target.value)} | None declared | None declared |
| 556 | input  | Full Name <span className="req">*</span> | {form.name} | {(e) => updateForm('name', e.target.value)} | required=true | None declared |
| 566 | input  | Parent ID Code | {form.parentId} | {(e) => updateForm('parentId', e.target.value)} | None declared | None declared |
| 575 | input  | Phone Number <span className="req">*</span> | {form.phone} | {(e) => updateForm('phone', e.target.value)} | required=true | None declared |
| 585 | input email | Email Address | {form.email} | {(e) => updateForm('email', e.target.value)} | None declared | None declared |
| 595 | input  | Occupation | {form.occupation} | {(e) => updateForm('occupation', e.target.value)} | None declared | None declared |
| 604 | select  | Relation Designation | {isOtherSelected ? '__other__' : (allRelations.includes(form.relationship) ? form.relationship : form.relationship)} | {(e) => { const val = e.target.value if (val === '__other__') { updateForm('relationship', '__other__') setOtherRelationText('') } else { updateForm('relationship', val) setOtherRelationText('') } }} | None declared | None declared |
| 627 | input  | Relation Designation | {otherRelationText} | {(e) => setOtherRelationText(e.target.value)} | None declared | None declared |
| 660 | select  | Status | {form.status} | {(e) => updateForm('status', e.target.value)} | None declared | None declared |
| 681 | select  | Choose Class Name | {selectedClassId} | {(e) => { setSelectedClassId(e.target.value) setTempSelectedStudentIds([]) }} | None declared | None declared |
| 752 | input checkbox | (none in adjacent label) | {isChecked} | {() => { setTempSelectedStudentIds((prev) => isChecked ? prev.filter(id => id !== student.id) : [...prev, student.id] ) }} | None declared | None declared |
| 823 | input  | Village / Street <span className="req">*</span> | {form.permanentAddress?.street &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'street', e.target.value)} | required=true | None declared |
| 833 | input  | Ward No. <span className="req">*</span> | {form.permanentAddress?.wardNo &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'wardNo', e.target.value)} | required=true | None declared |
| 843 | input  | City <span className="req">*</span> | {form.permanentAddress?.city &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'city', e.target.value)} | required=true | None declared |
| 853 | select  | Municipality Type | {form.permanentAddress?.municipalityType &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'municipalityType', e.target.value)} | None declared | None declared |
| 865 | input  | District <span className="req">*</span> | {form.permanentAddress?.district &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'district', e.target.value)} | required=true | None declared |
| 875 | input  | State / Province <span className="req">*</span> | {form.permanentAddress?.state &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'state', e.target.value)} | required=true | None declared |
| 885 | input  | ZIP / Postal Code <span className="req">*</span> | {form.permanentAddress?.zip &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'zip', e.target.value)} | required=true | None declared |
| 895 | input  | Country <span className="req">*</span> | {form.permanentAddress?.country &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'country', e.target.value)} | required=true | None declared |
| 906 | input checkbox | Temporary Address same as Permanent Address | {!!form.sameAsPermanent} | {(e) => handleSameAsPermanentToggle(e.target.checked)} | None declared | id=sameAsPermanentParent |
| 928 | input  | Village / Street <span className="req">*</span> | {form.temporaryAddress?.street &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'street', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 938 | input  | Ward No. <span className="req">*</span> | {form.temporaryAddress?.wardNo &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'wardNo', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 948 | input  | City <span className="req">*</span> | {form.temporaryAddress?.city &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'city', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 958 | select  | Municipality Type | {form.temporaryAddress?.municipalityType &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'municipalityType', e.target.value)} | disabled={!!form.sameAsPermanent} | None declared |
| 971 | input  | District <span className="req">*</span> | {form.temporaryAddress?.district &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'district', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 981 | input  | State / Province <span className="req">*</span> | {form.temporaryAddress?.state &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'state', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 991 | input  | ZIP / Postal Code <span className="req">*</span> | {form.temporaryAddress?.zip &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'zip', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1001 | input  | Country <span className="req">*</span> | {form.temporaryAddress?.country &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'country', e.target.value)} | required={!form.sameAsPermanent} | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 425 | <i className="fa-solid fa-plus"></i> New Parent | {() => { resetForm(); setViewMode('create'); }} |
| 430 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => { resetForm(); setViewMode('list'); }} |
| 450 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 520 | <i className="fa-solid fa-eye"></i> | {() => { setSelectedParentId(p.id); setDetailTab('overview'); setViewMode('detail'); }} |
| 523 | <i className="fa-solid fa-pen"></i> | {() => editParent(p)} |
| 526 | <i className={'fa-solid ${p.status === 'active' ? 'fa-ban' : 'fa-check'}'}></i> | {() => toggleParentStatus(p.id)} |
| 529 | <i className="fa-solid fa-trash"></i> | {() => deleteParent(p)} |
| 699 | <i className="fa-solid fa-plus"></i> Add to Linked Children | {() => { if (tempSelectedStudentIds.length === 0) { showToast('Select at least one student to link', 'error') return } setForm((prev) => ({ ...prev, studentIds: [...new Set([...prev.studentIds, ...tempSelectedStudentIds])] })) setTempSelectedStudentIds([]) showToast('${tempSelectedStudentIds.length} child(ren) added to list', 'success') }} |
| 792 | <i className="fa-solid fa-user-minus"></i> Remove | {() => { setForm((prev) => ({ ...prev, studentIds: prev.studentIds.filter(cid => cid !== id) })) showToast('${child.name} unlinked from form', 'info') }} |
| 1014 | Cancel | {() => { resetForm(); setViewMode('list'); }} |
| 1017 | <i className={'fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}'}></i> {editingId ? ' Update Profile' : ' Register Parent'} | submit |
| 1065 | <i className="fa-solid fa-circle-info"></i> Parent Overview | {() => setDetailTab('overview')} |
| 1068 | <i className="fa-solid fa-user-graduate"></i> Linked Children ( {selectedParent.studentIds?.length &#124;&#124; 0} ) | {() => setDetailTab('children')} |
| 1337 | <i className="fa-solid fa-download"></i> | {() => { const text = 'Mock document details:\nStudent: ${child.name}\nType: ${label}\nFilename: ${doc.name}' const blob = new Blob([text], { type: 'text/plain' }) const url = URL.createObjectURL(blob) const a = document.createElement('a') a.href = url a.download = doc.name document.body.appendChild(a) a.click() document.body.removeChild(a) URL.revokeObjectURL(url) }} |
| 1425 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => setViewMode('list')} |
| 1429 | <i className="fa-solid fa-pen"></i> Edit Profile Info | {() => editParent(selectedParent)} |
| 1432 | <i className="fa-solid fa-trash"></i> Delete Profile | {() => deleteParent(selectedParent)} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 466 | th | Parent Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('name')} | None declared |
| 469 | th | Parent ID {sortBy === 'parentId' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('parentId')} | None declared |
| 473 | th | Email Address {sortBy === 'email' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('email')} | None declared |
| 486 | tr | <td> <div className="roles-name-cell"> <div className="roles-name-icon" style={{ background: 'var(--bluebg)', color: 'var(--blue)' }}> <i className="fa-solid fa-user-tie"></i> </div> <div> <div className="roles-name-text">{p.name}</div> <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{p.occupation &#124;&#124; 'No occupation logged'}</div> </div> </div | {() => { setSelectedParentId(p.id) setDetailTab('overview') setViewMode('detail') }} | None declared |
| 518 | td | <div className="roles-actions"> <button className="btn-icon-sm" title="View" onClick={() => { setSelectedParentId(p.id); setDetailTab('overview'); setViewMode('detail'); }}> <i className="fa-solid fa-eye"></i> </button> <button className="btn-icon-sm" title="Edit" onClick={() => editParent(p)}> <i className="fa-solid fa-pen"></i> </button> <button | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 455 | <option value="all">All Status</option> <option value="active">Active</option> <option value="inactive">Inactive</option> |
| 604 | {allRelations.map(r => ( <option key={r} value={r}>{r}</option> ))} <option value="__other__">Other (Custom)…</option> |
| 660 | <option value="active">Active</option> <option value="inactive">Inactive</option> |
| 681 | <option value="">-- Select Class --</option> {classes.map((cls) => ( <option key={cls.id} value={cls.id}> {cls.name} {cls.section ? '- ${cls.section}' : ''} </option> ))} |
| 853 | <option value="">Select type (Optional)</option> <option value="Municipality">Municipality</option> <option value="Rural Municipality">Rural Municipality</option> |
| 958 | <option value="">Select type (Optional)</option> <option value="Municipality">Municipality</option> <option value="Rural Municipality">Rural Municipality</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 118 | readStoredList(STORAGE_KEYS.parents, INITIAL_PARENTS) |
| 121 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 122 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 124 | readStoredList('educore.customRelations', []) |
| 131 | writeStoredList(STORAGE_KEYS.parents, parents) |
| 136 | writeStoredList('educore.customRelations', customRelations) |

### Functions

- makeParentIdCode (line 45)
- getMockAttendance (line 49)
- Parents (line 83)
- showToast (line 139)
- toggleSort (line 146)
- updateForm (line 196)
- updateAddressField (line 198)
- handleSameAsPermanentToggle (line 215)
- resetForm (line 230)
- saveParent (line 238)
- editParent (line 322)
- deleteParent (line 360)
- toggleParentStatus (line 372)
- getClassName (line 385)
- getLinkedChildrenBadges (line 391)

## pages/roles.js

6 lines; 0 field definitions; 0 button definitions; 0 dialog/overlay definitions.

Imports: ../components/RolesPage.


### Actions

| Line | Button content | Handler / submit type |
|---|---|---|

### Functions

- Roles (line 3)

## pages/salary.js

1288 lines; 16 field definitions; 26 button definitions; 4 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 587 | input  | Search staff, ID, month, slip... | {searchQuery} | {(e) => setSearchQuery(e.target.value)} | None declared | None declared |
| 598 | select  | (none in adjacent label) | {departmentFilter} | {(e) => setDepartmentFilter(e.target.value)} | None declared | None declared |
| 604 | select  | (none in adjacent label) | {statusFilter} | {(e) => setStatusFilter(e.target.value)} | None declared | None declared |
| 609 | select  | (none in adjacent label) | {sortBy} | {(e) => setSortBy(e.target.value)} | None declared | None declared |
| 833 | input date | Payout/Payment Date <span className="req">*</span> | {paymentForm.paymentDate} | {(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} | required=true | None declared |
| 845 | select  | Payment Mode | {paymentForm.paymentMode} | {(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })} | None declared | None declared |
| 859 | input  | Paid / Disbursed By | {paymentForm.paidBy} | {(e) => setPaymentForm({ ...paymentForm, paidBy: e.target.value })} | None declared | None declared |
| 900 | input  | Payroll Period Label <span className="req">*</span> | {batchForm.billingMonth} | {(e) => setBatchForm({ ...batchForm, billingMonth: e.target.value })} | required=true | None declared |
| 913 | select  | Target Department | {batchForm.targetDepartment} | {(e) => setBatchForm({ ...batchForm, targetDepartment: e.target.value })} | None declared | None declared |
| 1134 | input number | Base Salary ($) <span className="req">*</span> | {configForm.baseSalary} | {(e) => setConfigForm({ ...configForm, baseSalary: e.target.value })} | required=true; min=1 | None declared |
| 1164 | input  | e.g. Travel Allowance | {item.label} | {(e) => handleUpdateConfigRule('additions', idx, 'label', e.target.value)} | required=true | None declared |
| 1172 | select  | (none in adjacent label) | {item.valType} | {(e) => handleUpdateConfigRule('additions', idx, 'valType', e.target.value)} | None declared | None declared |
| 1181 | input number | Value | {item.value} | {(e) => handleUpdateConfigRule('additions', idx, 'value', e.target.value)} | required=true; min=0 | None declared |
| 1224 | input  | e.g. Provident Fund | {item.label} | {(e) => handleUpdateConfigRule('deductions', idx, 'label', e.target.value)} | required=true | None declared |
| 1232 | select  | (none in adjacent label) | {item.valType} | {(e) => handleUpdateConfigRule('deductions', idx, 'valType', e.target.value)} | None declared | None declared |
| 1241 | input number | Value | {item.value} | {(e) => handleUpdateConfigRule('deductions', idx, 'value', e.target.value)} | required=true; min=0 | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 491 | <i className="fa-solid fa-calculator"></i> Run Monthly Payroll | {openBatchGenerate} |
| 500 | <i className="fa-solid fa-wallet"></i> Payroll Ledger &amp; Receipts | {() => setActiveTab('ledger')} |
| 521 | <i className="fa-solid fa-sliders"></i> Salary Configurator | {() => setActiveTab('configurator')} |
| 593 | <i className="fa-solid fa-xmark"></i> | {() => setSearchQuery('')} |
| 618 | <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> CSV | {handleExportCSV} |
| 621 | <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF | {handleExportPDF} |
| 679 | <i className="fa-solid fa-print"></i> | {() => setActiveReceipt(tx)} |
| 688 | <i className="fa-solid fa-money-bill-check"></i> Pay Out | {() => openRecordPayment(tx)} |
| 697 | <i className="fa-solid fa-trash-can"></i> | {() => handleDeleteTransaction(tx)} |
| 784 | <i className="fa-solid fa-sliders"></i> Edit Structure | {() => openEditConfig(member)} |
| 813 | <i className="fa-solid fa-xmark"></i> | {() => setShowPaymentModal(false)} |
| 868 | Cancel | {() => setShowPaymentModal(false)} |
| 869 | <i className="fa-solid fa-circle-check"></i> Complete Payout | submit |
| 890 | <i className="fa-solid fa-xmark"></i> | {() => setShowBatchModal(false)} |
| 927 | Cancel | {() => setShowBatchModal(false)} |
| 928 | <i className="fa-solid fa-play"></i> Run Calculations | submit |
| 949 | <i className="fa-solid fa-xmark"></i> | {() => setActiveReceipt(null)} |
| 1103 | Close | {() => setActiveReceipt(null)} |
| 1104 | <i className="fa-solid fa-print"></i> Print Slip | {() => window.print()} |
| 1124 | <i className="fa-solid fa-xmark"></i> | {() => setShowConfigModal(false)} |
| 1148 | <i className="fa-solid fa-plus"></i> Add Allowance | {() => handleAddConfigRule('additions', 'addition')} |
| 1191 | <i className="fa-solid fa-trash-can"></i> | {() => handleRemoveConfigRule('additions', idx)} |
| 1208 | <i className="fa-solid fa-plus"></i> Add Deduction | {() => handleAddConfigRule('deductions', 'deduction')} |
| 1251 | <i className="fa-solid fa-trash-can"></i> | {() => handleRemoveConfigRule('deductions', idx)} |
| 1266 | Cancel | {() => setShowConfigModal(false)} |
| 1267 | <i className="fa-solid fa-circle-check"></i> Save Config | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 939 | div | modal-overlay print-receipt-overlay | {() => setActiveReceipt(null)} | None declared |
| 940 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 598 | <option value="all">All Departments</option> {departments.map((dept) => ( <option key={dept} value={dept}>{dept}</option> ))} |
| 604 | <option value="all">All Statuses</option> <option value="paid">Paid</option> <option value="pending">Pending</option> |
| 609 | <option value="latest">Latest Generated</option> <option value="oldest">Oldest Generated</option> <option value="salaryHigh">Salary (High - Low)</option> <option value="salaryLow">Salary (Low - High)</option> <option value="staffName">Employee Name (A-Z)</option> |
| 845 | <option value="Bank Transfer">Bank Transfer (Direct Deposit)</option> <option value="Cash">Cash Handout</option> <option value="Check">Check Issue</option> |
| 913 | <option value="all">All Departments</option> {departments.map((dept) => ( <option key={dept} value={dept}>{dept}</option> ))} |
| 1172 | <option value="fixed">Fixed ($)</option> <option value="percent">Percent (%)</option> |
| 1232 | <option value="fixed">Fixed ($)</option> <option value="percent">Percent (%)</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 89 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 104 | writeStoredList(STORAGE_KEYS.staff, storedStaff) |
| 108 | readStoredList(STORAGE_KEYS.roles, []) |
| 109 | localStorage.getItem('educore.currentUser') |
| 116 | writeStoredList(STORAGE_KEYS.staff, staff) |

### Functions

- calculateSalaryDetails (line 14)
- Salary (line 45)
- showToast (line 119)
- getStaffName (line 135)
- openRecordPayment (line 218)
- handleSavePayment (line 235)
- pad (line 243)
- handleDeleteTransaction (line 272)
- openBatchGenerate (line 294)
- handleRunBatchGenerate (line 310)
- handleExportCSV (line 373)
- handleExportPDF (line 393)
- openEditConfig (line 411)
- handleAddConfigRule (line 426)
- handleUpdateConfigRule (line 433)
- handleRemoveConfigRule (line 444)
- handleSaveConfig (line 452)

## pages/settings.js

782 lines; 47 field definitions; 25 button definitions; 0 dialog/overlay definitions.

Imports: ../components/Sidebar, react, next/router.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 230 | input  | School Name <span className="req">*</span> | Sunrise Public School | — | None declared | None declared |
| 234 | input  | School Code <span className="req">*</span> | SPS-DEL-01 | — | None declared | None declared |
| 238 | input  | Establishment Year | 2010 | — | None declared | None declared |
| 242 | select  | School Type <span className="req">*</span> | — | — | None declared | None declared |
| 251 | select  | Board <span className="req">*</span> | — | {handleBoardChange} | None declared | None declared |
| 272 | input  | Specify Board Name <span className="req">*</span> | — | — | None declared | None declared |
| 278 | select  | Active Academic Year <span className="req">*</span> | {academicYear} | {e=>handleAcademicYearChange(e.target.value)} | None declared | id=academicYearSelect |
| 290 | input  | Add Academic Year | {newYearInput} | {e=>setNewYearInput(e.target.value)} | None declared | None declared |
| 305 | select  | Medium of Instruction | — | — | None declared | None declared |
| 313 | input  | Motto | Excellence in Education, Values for Life | — | None declared | None declared |
| 317 | input  | Website | www.sunrisepublicschool.edu | — | None declared | None declared |
| 328 | input  | Address Line 1 <span className="req">*</span> | 123 Education Street | — | None declared | None declared |
| 332 | input  | Address Line 2 | Knowledge City | — | None declared | None declared |
| 336 | input  | Landmark | Near Central Park | — | None declared | None declared |
| 340 | input  | District <span className="req">*</span> | South Delhi | — | None declared | None declared |
| 344 | input  | City <span className="req">*</span> | New Delhi | — | None declared | None declared |
| 348 | select  | State <span className="req">*</span> | — | — | None declared | None declared |
| 358 | select  | Country <span className="req">*</span> | — | — | None declared | None declared |
| 365 | input  | PIN / Postal Code <span className="req">*</span> | 110045 | — | None declared | None declared |
| 369 | select  | Timezone <span className="req">*</span> | — | — | None declared | None declared |
| 463 | input  | Primary Phone <span className="req">*</span> | +91 98765 43210 | — | None declared | None declared |
| 467 | input  | Secondary Phone | +91 98765 43211 | — | None declared | None declared |
| 471 | input  | WhatsApp Number | +91 91234 56789 | — | None declared | None declared |
| 475 | input  | Email <span className="req">*</span> | info@sunrisepublic.edu | — | None declared | None declared |
| 479 | input  | Secondary Email | admissions@sunrisepublic.edu | — | None declared | None declared |
| 483 | input  | Website | www.sunrisepublicschool.edu | — | None declared | None declared |
| 494 | input  | Facebook | facebook.com/sunrisepublic | — | None declared | None declared |
| 498 | input  | Instagram | instagram.com/sunrisepublic | — | None declared | None declared |
| 502 | input  | YouTube | youtube.com/sunrisepublic | — | None declared | None declared |
| 506 | input  | LinkedIn | linkedin.com/school/sunrisepublic | — | None declared | None declared |
| 564 | select  | Base Currency <span className="req">*</span> | — | — | None declared | None declared |
| 571 | input  | Currency Symbol | ₹ | — | None declared | None declared |
| 575 | select  | Financial Year Start <span className="req">*</span> | — | — | None declared | None declared |
| 583 | input  | Default Tax (%) | 18 | — | None declared | None declared |
| 594 | input  | Bank Name <span className="req">*</span> | State Bank of India | — | None declared | None declared |
| 598 | input  | Account Holder Name <span className="req">*</span> | Sunrise Public School | — | None declared | None declared |
| 602 | input  | Account Number <span className="req">*</span> | 12345678901234 | — | None declared | None declared |
| 606 | input  | IFSC Code <span className="req">*</span> | SBIN0001234 | — | None declared | None declared |
| 610 | input  | Branch Name | Knowledge City Branch | — | None declared | None declared |
| 614 | select  | Account Type | — | — | None declared | None declared |
| 621 | input  | UPI ID | sunrisepublic@sbi | — | None declared | None declared |
| 673 | input  | Registration Number <span className="req">*</span> | REG/2020/12345 | — | None declared | None declared |
| 677 | input  | Registration Date <span className="req">*</span> | 16 Jun 2020 | — | None declared | None declared |
| 681 | input  | Registration Authority <span className="req">*</span> | District Education Office | — | None declared | None declared |
| 685 | input  | Affiliation Number <span className="req">*</span> | AFF/CBSE/2020/67890 | — | None declared | None declared |
| 689 | input  | Affiliation Date <span className="req">*</span> | 20 Jul 2020 | — | None declared | None declared |
| 693 | input  | Affiliation Valid Upto <span className="req">*</span> | 31 Mar 2027 | — | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 152 | <i className={'fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}'}></i> | {toggleCollapse} |
| 160 | <i className="fa-solid fa-bars"></i> | {() => setMobileOpen(true)} |
| 183 | <i className="fa-solid fa-eye"></i> Preview | {() => showToastMsg('Preview mode opened', 'info')} |
| 186 | <i className="fa-solid fa-floppy-disk"></i> Save Changes | {saveSettings} |
| 213 | 📋 General | {() => setActiveTab('general')} |
| 214 | 🎨 Branding | {() => setActiveTab('branding')} |
| 215 | 📞 Contact | {() => setActiveTab('contact')} |
| 216 | 💰 Finance | {() => setActiveTab('finance')} |
| 217 | ⚖️ Compliance | {() => setActiveTab('compliance')} |
| 281 | <i className={'fa-solid ${showAddYearForm ? 'fa-xmark' : 'fa-plus'}'}></i> | {()=>setShowAddYearForm(!showAddYearForm)} |
| 297 | Add Session | {handleAddAcademicYear} |
| 298 | Cancel | {()=>{setShowAddYearForm(false); setNewYearInput('');}} |
| 393 | Change | (no explicit handler/type; inspect form context) |
| 394 | Remove | (no explicit handler/type; inspect form context) |
| 402 | Change | (no explicit handler/type; inspect form context) |
| 403 | Remove | (no explicit handler/type; inspect form context) |
| 411 | Change | (no explicit handler/type; inspect form context) |
| 412 | Remove | (no explicit handler/type; inspect form context) |
| 420 | Change | (no explicit handler/type; inspect form context) |
| 421 | Remove | (no explicit handler/type; inspect form context) |
| 528 | <i className="fa-solid fa-plus"></i> Add Emergency Contact | (no explicit handler/type; inspect form context) |
| 652 | <i className="fa-solid fa-bolt"></i> Quick Actions | (no explicit handler/type; inspect form context) |
| 719 | <i className="fa-solid fa-pen"></i> | (no explicit handler/type; inspect form context) |
| 738 | <i className="fa-solid fa-download"></i> | (no explicit handler/type; inspect form context) |
| 741 | <i className="fa-solid fa-upload"></i> Upload New Document | (no explicit handler/type; inspect form context) |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 146 | div | {"sb-overlay" + (mobileOpen ? ' active' : '')} | {closeSidebar} | None declared |
| 169 | div | theme-toggle | {toggleTheme} | None declared |
| 439 | div | {'swatch ${accentColor === '#6366F1' ? 'active' : ''}'} | {() => handleAccentColorChange('#6366F1')} | None declared |
| 440 | div | {'swatch ${accentColor === '#2563EB' ? 'active' : ''}'} | {() => handleAccentColorChange('#2563EB')} | None declared |
| 441 | div | {'swatch ${accentColor === '#7C3AED' ? 'active' : ''}'} | {() => handleAccentColorChange('#7C3AED')} | None declared |
| 442 | div | {'swatch ${accentColor === '#D946EF' ? 'active' : ''}'} | {() => handleAccentColorChange('#D946EF')} | None declared |
| 443 | div | {'swatch ${accentColor === '#EA580C' ? 'active' : ''}'} | {() => handleAccentColorChange('#EA580C')} | None declared |
| 444 | div | {'swatch ${accentColor === '#16A34A' ? 'active' : ''}'} | {() => handleAccentColorChange('#16A34A')} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 242 | <option value="montessori">Montessori Education</option> <option value="primary" selected>Primary Education</option> <option value="secondary">Secondary Education</option> <option value="higher_secondary">Higher Secondary</option> |
| 251 | <optgroup label="National Boards"> <option value="cbse" selected>CBSE</option> <option value="cisce">CISCE</option> <option value="nios">NIOS</option> </optgroup> <optgroup label="State Boards"> <option value="state">State Board</option> </optgroup> <optgroup label="International Boards"> <option value="ib">International Boards</option> </optgroup> <option value="neb">NEB</option> <option value="deo">District Education Office</option> <option value="internal">Internal (Schools)</option> <option value="other">Other</option> |
| 278 | {academicYears.map(y=><option key={y} value={y}>{y}</option>)} |
| 305 | <option>English</option> <option>Hindi</option> <option>Nepali</option> |
| 348 | <option>Delhi</option> <option>Maharashtra</option> <option>Karnataka</option> <option>Uttar Pradesh</option> <option>Other</option> |
| 358 | <option value="india">India</option> <option value="nepal">Nepal</option> |
| 369 | <option value="IST">Indian Standard Time (IST) — UTC +5:30</option> <option value="NPT">Nepal Standard Time (NPT) — UTC +5:45</option> |
| 564 | <option>Indian Rupee (INR) — ₹</option> <option>Nepali Rupee (NPR) — रु</option> |
| 575 | <option>April</option> <option>January</option> <option>July</option> |
| 614 | <option>Current Account</option> <option>Savings Account</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 24 | localStorage.getItem('theme') |
| 28 | localStorage.getItem('sidebar-collapsed') |
| 32 | localStorage.getItem('accentColor') |
| 42 | localStorage.getItem('academicYears') |
| 50 | localStorage.getItem('academicYear') |
| 56 | localStorage.getItem('academicYear') |
| 58 | localStorage.getItem('academicYears') |
| 71 | localStorage.setItem('theme', nextTheme) |
| 76 | localStorage.setItem('sidebar-collapsed', !collapsed) |
| 97 | localStorage.setItem('accentColor', color) |
| 106 | localStorage.setItem('accentColor', accentColor) |
| 118 | localStorage.setItem('academicYear', val) |
| 137 | localStorage.setItem('academicYears', JSON.stringify(updated)) |

### Functions

- Settings (line 5)
- handleExternalChange (line 55)
- toggleTheme (line 67)
- toggleCollapse (line 74)
- closeSidebar (line 79)
- showToastMsg (line 81)
- handleAccentColorChange (line 95)
- saveSettings (line 105)
- handleBoardChange (line 112)
- handleAcademicYearChange (line 116)
- handleAddAcademicYear (line 122)

## pages/staff.js

2432 lines; 53 field definitions; 36 button definitions; 0 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 787 | input  | Search name, ID, role, department... | {search} | {(e) => setSearch(e.target.value)} | None declared | None declared |
| 798 | select  | (none in adjacent label) | {departmentFilter} | {(e) => setDepartmentFilter(e.target.value)} | None declared | None declared |
| 804 | select  | (none in adjacent label) | {typeFilter} | {(e) => setTypeFilter(e.target.value)} | None declared | None declared |
| 809 | select  | (none in adjacent label) | {statusFilter} | {(e) => setStatusFilter(e.target.value)} | None declared | None declared |
| 966 | input  | Full Name <span className="req">*</span> | {form.name} | {(e) => updateForm('name', e.target.value)} | required=true | None declared |
| 976 | input  | Employee ID Code | {form.employeeId} | {(e) => updateForm('employeeId', e.target.value)} | None declared | None declared |
| 985 | select  | User Type Classification | {form.userType} | {(e) => updateForm('userType', e.target.value)} | None declared | None declared |
| 992 | input  | Department | {form.department} | {(e) => updateForm('department', e.target.value)} | None declared | None declared |
| 1001 | select  | Status | {form.status} | {(e) => updateForm('status', e.target.value)} | None declared | None declared |
| 1008 | input date | Date of Joining | {form.joiningDate} | {(e) => updateForm('joiningDate', e.target.value)} | None declared | None declared |
| 1025 | input email | Email Address | {form.email} | {(e) => updateForm('email', e.target.value)} | None declared | None declared |
| 1035 | input  | Phone Number | {form.phone} | {(e) => updateForm('phone', e.target.value)} | None declared | None declared |
| 1044 | input date | Date of Birth | {form.dob} | {(e) => updateForm('dob', e.target.value)} | None declared | None declared |
| 1053 | input  | National ID Identification Code | {form.nationalIdNo} | {(e) => updateForm('nationalIdNo', e.target.value)} | None declared | None declared |
| 1070 | input  | Village / Street <span className="req">*</span> | {form.permanentAddress?.street &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'street', e.target.value)} | required=true | None declared |
| 1080 | input  | Ward No. <span className="req">*</span> | {form.permanentAddress?.wardNo &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'wardNo', e.target.value)} | required=true | None declared |
| 1090 | input  | City <span className="req">*</span> | {form.permanentAddress?.city &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'city', e.target.value)} | required=true | None declared |
| 1100 | select  | Municipality Type | {form.permanentAddress?.municipalityType &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'municipalityType', e.target.value)} | None declared | None declared |
| 1112 | input  | District <span className="req">*</span> | {form.permanentAddress?.district &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'district', e.target.value)} | required=true | None declared |
| 1122 | input  | State / Province <span className="req">*</span> | {form.permanentAddress?.state &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'state', e.target.value)} | required=true | None declared |
| 1132 | input  | ZIP / Postal Code <span className="req">*</span> | {form.permanentAddress?.zip &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'zip', e.target.value)} | required=true | None declared |
| 1142 | input  | Country <span className="req">*</span> | {form.permanentAddress?.country &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'country', e.target.value)} | required=true | None declared |
| 1153 | input checkbox | Temporary Address same as Permanent Address | {!!form.sameAsPermanent} | {(e) => handleSameAsPermanentToggle(e.target.checked)} | None declared | id=sameAsPermanent |
| 1175 | input  | Village / Street <span className="req">*</span> | {form.temporaryAddress?.street &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'street', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1185 | input  | Ward No. <span className="req">*</span> | {form.temporaryAddress?.wardNo &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'wardNo', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1195 | input  | City <span className="req">*</span> | {form.temporaryAddress?.city &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'city', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1205 | select  | Municipality Type | {form.temporaryAddress?.municipalityType &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'municipalityType', e.target.value)} | disabled={!!form.sameAsPermanent} | None declared |
| 1218 | input  | District <span className="req">*</span> | {form.temporaryAddress?.district &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'district', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1228 | input  | State / Province <span className="req">*</span> | {form.temporaryAddress?.state &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'state', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1238 | input  | ZIP / Postal Code <span className="req">*</span> | {form.temporaryAddress?.zip &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'zip', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1248 | input  | Country <span className="req">*</span> | {form.temporaryAddress?.country &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'country', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1268 | input  | Highest Qualification Degree | {form.qualification} | {(e) => updateForm('qualification', e.target.value)} | None declared | None declared |
| 1277 | input number | Years of Professional Experience | {form.experience} | {(e) => updateForm('experience', e.target.value)} | min=0 | None declared |
| 1287 | input  | University / Alma Mater Institution | {form.institution} | {(e) => updateForm('institution', e.target.value)} | None declared | None declared |
| 1335 | input file | <i className="fa-solid fa-cloud-arrow-up"></i> Upload Scanned File | — | {(e) => { const file = e.target.files?.[0] if (!file) return const ext = file.name.substring(file.name.lastIndexOf('.')) &#124;&#124; '.pdf' const nameStr = form.name.trim() &#124;&#124; 'Employee' const next = { ...form.documents, [key]: { name: '${nameStr} ${label}${ext}', type: file.type, size: file.size, lastModified: file.lastModified } } updateForm('documents', next) }} | accept={acceptExt} | id={'file-staff-${key}'} |
| 1387 | input  | Custom Verification Documents | {input.label} | {(e) => { const val = e.target.value setCustomDocInputs((prev) => prev.map((item) => (item.id === input.id ? { ...item, label: val } : item)) ) if (doc) { const nextDocs = { ...form.documents } nextDocs[input.id] = { ...doc, label: val } updateForm('documents', nextDocs) } }} | disabled={!!doc} | None declared |
| 1451 | input file | <i className="fa-solid fa-cloud-arrow-up"></i> Upload Custom File | — | {(e) => { const file = e.target.files?.[0] if (!file) return const ext = file.name.substring(file.name.lastIndexOf('.')) &#124;&#124; '.pdf' const nameStr = form.name.trim() &#124;&#124; 'Employee' const formattedName = '${nameStr} ${input.label.trim()}${ext}' const nextDocs = { ...form.documents, [input.id]: { name: formattedName, type: file.type, size: file.size, label: input.label.trim(), lastModified: file.lastModified } } updateForm('documents', nextDocs) }} | accept=.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx; disabled={!input.label.trim()} | id={'file-upload-${input.id}'} |
| 1523 | input number | Monthly Base Salary ($) <span className="req">*</span> | {form.baseSalary} | {(e) => updateForm('baseSalary', Number(e.target.value))} | required=true; min=0 | None declared |
| 1546 | input  | e.g. Travel Bonus | {rule.label} | {(e) => handleUpdateSalaryRule('additions', idx, 'label', e.target.value)} | required=true | None declared |
| 1554 | select  | (none in adjacent label) | {rule.valType} | {(e) => handleUpdateSalaryRule('additions', idx, 'valType', e.target.value)} | None declared | None declared |
| 1563 | input number | Value | {rule.value} | {(e) => handleUpdateSalaryRule('additions', idx, 'value', Number(e.target.value))} | required=true; min=0 | None declared |
| 1593 | input  | e.g. Income Tax | {rule.label} | {(e) => handleUpdateSalaryRule('deductions', idx, 'label', e.target.value)} | required=true | None declared |
| 1601 | select  | (none in adjacent label) | {rule.valType} | {(e) => handleUpdateSalaryRule('deductions', idx, 'valType', e.target.value)} | None declared | None declared |
| 1610 | input number | Value | {rule.value} | {(e) => handleUpdateSalaryRule('deductions', idx, 'value', Number(e.target.value))} | required=true; min=0 | None declared |
| 1639 | select  | Assign System Role <span className="req">*</span> | {form.role} | {(e) => updateForm('role', e.target.value)} | required=true | None declared |
| 1897 | input  | Document Name/Label <span className="req">*</span> | {newDocName} | {(e) => setNewDocName(e.target.value)} | required=true | None declared |
| 1908 | input file | Upload File <span className="req">*</span> / <i className="fa-solid fa-cloud-arrow-up"></i> {newDocFile ? newDocFile.name : 'Choose file...'} | — | {(e) => { const file = e.target.files?.[0] if (file) setNewDocFile(file) }} | accept=.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx | id=staff-custom-doc-file-detail |
| 2017 | input file | (none in adjacent label) | — | {(e) => handleDirectUpload(key, label, e)} | accept={key === 'ppPhoto' ? '.png,.jpg,.jpeg,.gif' : '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx'} | id={'direct-staff-file-upload-${key}'} |
| 2129 | input  | Salary Month <span className="req">*</span> | {payForm.month} | {(e) => setPayForm({ ...payForm, month: e.target.value })} | required=true | None declared |
| 2133 | input date | Date of Release <span className="req">*</span> | {payForm.paymentDate} | {(e) => setPayForm({ ...payForm, paymentDate: e.target.value })} | required=true | None declared |
| 2137 | input  | Authorized Payer Name | {payForm.paidBy} | {(e) => setPayForm({ ...payForm, paidBy: e.target.value })} | None declared | None declared |
| 2141 | select  | Status | {payForm.status} | {(e) => setPayForm({ ...payForm, status: e.target.value })} | None declared | None declared |
| 2310 | select  | (none in adjacent label) | {'${teaAttMonth}-${teaAttYear}'} | {e => { const [m,y] = e.target.value.split('-').map(Number) setTeaAttMonth(m); setTeaAttYear(y) }} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 725 | <i className="fa-solid fa-plus"></i> New Employee | {() => { resetForm(); setViewMode('create') }} |
| 730 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => { resetForm(); setViewMode('list') }} |
| 793 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 815 | <i className="fa-solid fa-file-csv" style={{ color: 'var(--green)' }}></i> CSV | {handleExportCSV} |
| 818 | <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF | {handleExportPDF} |
| 929 | <i className="fa-solid fa-eye"></i> | {() => { setSelectedStaffId(emp.id); setDetailTab('overview'); setViewMode('detail') }} |
| 932 | <i className="fa-solid fa-pen"></i> | {() => editStaff(emp)} |
| 935 | <i className={'fa-solid ${emp.status === 'active' ? 'fa-ban' : 'fa-check'}'}></i> | {() => toggleStaffStatus(emp.id)} |
| 938 | <i className="fa-solid fa-trash"></i> | {() => deleteStaff(emp)} |
| 1325 | <i className="fa-solid fa-xmark"></i> | {() => { const next = { ...form.documents } delete next[key] updateForm('documents', next) }} |
| 1408 | <i className="fa-solid fa-trash-can"></i> | {() => { setCustomDocInputs((prev) => prev.filter((item) => item.id !== input.id)) const nextDocs = { ...form.documents } delete nextDocs[input.id] updateForm('documents', nextDocs) }} |
| 1436 | <i className="fa-solid fa-xmark"></i> | {() => { const nextDocs = { ...form.documents } delete nextDocs[input.id] updateForm('documents', nextDocs) }} |
| 1503 | <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Add Custom Document | {() => { setCustomDocInputs((prev) => [...prev, { id: 'custom_${Date.now()}', label: '' }]) }} |
| 1539 | + Add Allowance | {() => handleAddSalaryRule('addition')} |
| 1573 | <i className="fa-solid fa-xmark"></i> | {() => handleRemoveSalaryRule('additions', idx)} |
| 1586 | + Add Tax Rule | {() => handleAddSalaryRule('deduction')} |
| 1620 | <i className="fa-solid fa-xmark"></i> | {() => handleRemoveSalaryRule('deductions', idx)} |
| 1651 | Cancel | {() => { resetForm(); setViewMode('list') }} |
| 1654 | <i className={'fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}'}></i> {editingId ? ' Update Employee' : ' Register Employee'} | submit |
| 1738 | <i className="fa-solid fa-circle-info"></i> Employee Overview | {() => setDetailTab('overview')} |
| 1741 | <i className="fa-solid fa-wallet"></i> Payroll &amp; Salaries ( {selectedStaff.salaryHistory?.length &#124;&#124; 0} ) | {() => setDetailTab('payroll')} |
| 1744 | <i className="fa-solid fa-shield-halved"></i> Permissions access map | {() => setDetailTab('access')} |
| 1747 | <i className="fa-solid fa-clipboard-user"></i> Attendance | {() => setDetailTab('attendance')} |
| 1885 | <i className={'fa-solid ${showAddDocForm ? 'fa-xmark' : 'fa-plus'}'}></i> {showAddDocForm ? ' Cancel' : ' Add Document'} | {() => setShowAddDocForm(!showAddDocForm)} |
| 1925 | Cancel | {() => { setShowAddDocForm(false); setNewDocName(''); setNewDocFile(null); }} |
| 1928 | Save Document | submit |
| 1992 | <i className="fa-solid fa-download"></i> | {() => { const content = 'Mock verification document content for employee:\nName: ${selectedStaff.name}\nDocument type: ${label}\nFilename: ${doc.name}\nDepartment: ${selectedStaff.department}' const blob = new Blob([content], { type: 'text/plain' }) const url = URL.createObjectURL(blob) const a = document.createElement('a') a.href = url a.download = doc.name document.body.appendChild(a) a.click() document.body.removeChild(a) URL.revokeObjectURL(url) }} |
| 2011 | <i className="fa-solid fa-trash-can"></i> | {() => handleDirectDelete(key, label)} |
| 2118 | <i className="fa-solid fa-plus"></i> Record Salary Payment | {() => setShowPayForm(!showPayForm)} |
| 2148 | Cancel | {() => setShowPayForm(false)} |
| 2149 | Release Payment | submit |
| 2192 | <i className="fa-solid fa-download"></i> | {() => { const text = '=======================================\n EDUCORE PAYROLL SLIP \n=======================================\nSlip No: ${history.slipNo}\nEmployee: ${selectedStaff.name}\nID: ${selectedStaff.employeeId}\nRole: ${selectedStaff.role}\nDepartment: ${selectedStaff.department}\n---------------------------------------\nRelease Month: ${history.month}\nBase Salary: $${history.baseSalary}\nNet Salary Released: $${history.netSalary}\nPayment Timestamp: ${history.paymentDate}\nReleased By: ${history.paidBy}\n---------------------------------------\nStatus: COMPLETED / BANK SETTLED\n=======================================' const blob = new Blob([text], { type: 'text/plain' }) const url = URL.createObjectURL(blob) const a = document.createElement('a') a.href = url a.download = 'Payslip_${selectedStaff.name.replace(/\s+/g, '_')}_${history.month.replace(/\s+/g, '_')}.txt' document.body.appendChild(a) a.click() document.body.removeChild(a) URL.revokeObjectURL(url) }} |
| 2211 | <i className="fa-solid fa-trash"></i> | {() => deleteSalaryRecord(history.id)} |
| 2406 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => setViewMode('list')} |
| 2410 | <i className="fa-solid fa-pen"></i> Edit Employee Info | {() => editStaff(selectedStaff)} |
| 2413 | <i className="fa-solid fa-trash"></i> Delete Employee | {() => deleteStaff(selectedStaff)} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 828 | th | Employee Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('name')} | None declared |
| 831 | th | Employee Type {sortBy === 'userType' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('userType')} | None declared |
| 834 | th | Employee ID {sortBy === 'employeeId' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('employeeId')} | None declared |
| 838 | th | Role &amp; Department {sortBy === 'role' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('role')} | None declared |
| 841 | th | Email {sortBy === 'email' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('email')} | None declared |
| 844 | th | Status {sortBy === 'status' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('status')} | None declared |
| 855 | tr | <td> <div className="roles-name-cell"> <div className="roles-name-icon" style={{ background: emp.userType === 'non-teaching' ? 'var(--amberbg)' : 'var(--bluebg)', color: emp.userType === 'non-teaching' ? 'var(--amber)' : 'var(--blue)', }} > <i className={'fa-solid ${emp.userType === 'non-teaching' ? 'fa-gears' : 'fa-chalkboard-user'}'}></i> </div> | {() => { setSelectedStaffId(emp.id) setDetailTab('overview') setViewMode('detail') }} | None declared |
| 927 | td | <div className="roles-actions"> <button className="btn-icon-sm tooltip" data-tooltip="view" title="view" onClick={() => { setSelectedStaffId(emp.id); setDetailTab('overview'); setViewMode('detail') }}> <i className="fa-solid fa-eye"></i> </button> <button className="btn-icon-sm tooltip" data-tooltip="edit" title="edit" onClick={() => editStaff(emp) | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 798 | <option value="all">All Departments</option> {getDepartmentsList().filter(d => d !== 'all').map(d => ( <option key={d} value={d}>{d}</option> ))} |
| 804 | <option value="all">All User Types</option> <option value="teaching">Teaching</option> <option value="non-teaching">Non-Teaching</option> |
| 809 | <option value="all">All Statuses</option> <option value="active">Active</option> <option value="blocked">Blocked</option> |
| 985 | <option value="teaching">Teaching Faculty (Can teach classes &amp; subjects)</option> <option value="non-teaching">Non-Teaching Staff (Accountant, Librarian, Warden, etc.)</option> |
| 1001 | <option value="active">Active</option> <option value="blocked">Blocked</option> |
| 1100 | <option value="">Select type (Optional)</option> <option value="Municipality">Municipality</option> <option value="Rural Municipality">Rural Municipality</option> |
| 1205 | <option value="">Select type (Optional)</option> <option value="Municipality">Municipality</option> <option value="Rural Municipality">Rural Municipality</option> |
| 1554 | <option value="fixed">Fixed ($)</option> <option value="percent">Percent (%)</option> |
| 1601 | <option value="fixed">Fixed ($)</option> <option value="percent">Percent (%)</option> |
| 1639 | <option value="">Choose role category...</option> {roles.map((r) => ( <option key={r.id} value={r.name}> {r.name} ({r.type === 'teaching' ? '🎓 Teaching' : '⚙️ Non-Teaching'}) </option> ))} |
| 2141 | <option value="paid">Paid / Settled</option> <option value="pending">Pending</option> |
| 2310 | {monthOpts.map(o => ( <option key={o.label} value={'${o.m}-${o.y}'}>{o.label}</option> ))} |

### Storage reads and writes

| Line | Call |
|---|---|
| 140 | localStorage.getItem('educore.teacherAttendance') |
| 146 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 161 | writeStoredList(STORAGE_KEYS.staff, storedStaff) |
| 166 | readStoredList(STORAGE_KEYS.roles, INITIAL_ROLES) |
| 172 | writeStoredList(STORAGE_KEYS.staff, staff) |

### Functions

- makeEmployeeId (line 56)
- calculateSalaryDetails (line 60)
- Staff (line 91)
- toggleSort (line 115)
- showToast (line 175)
- updateForm (line 252)
- updateAddressField (line 254)
- handleSameAsPermanentToggle (line 276)
- resetForm (line 291)
- handleAddSalaryRule (line 298)
- handleUpdateSalaryRule (line 309)
- handleRemoveSalaryRule (line 320)
- saveStaff (line 328)
- editStaff (line 431)
- deleteStaff (line 491)
- toggleStaffStatus (line 503)
- handleDirectUpload (line 517)
- handleDirectDelete (line 540)
- handleSaveCustomDoc (line 552)
- recordSalaryPayment (line 585)
- pad (line 593)
- deleteSalaryRecord (line 629)
- handleExportCSV (line 643)
- handleExportPDF (line 670)
- getDepartmentsList (line 703)

## pages/students.js

3699 lines; 60 field definitions; 45 button definitions; 1 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 1052 | input  | Search name, admission no, guardian... | {search} | {(e) => setSearch(e.target.value)} | None declared | None declared |
| 1063 | select  | (none in adjacent label) | {classFilter} | {(e) => setClassFilter(e.target.value)} | None declared | None declared |
| 1071 | select  | (none in adjacent label) | {statusFilter} | {(e) => setStatusFilter(e.target.value)} | None declared | None declared |
| 1205 | input  | Student Name <span className="req">*</span> | {form.name} | {(e) => updateForm('name', e.target.value)} | required=true | None declared |
| 1215 | input  | Admission Number | {form.admissionNo} | {(e) => updateForm('admissionNo', e.target.value)} | None declared | None declared |
| 1224 | select  | Class <span className="req">*</span> | {form.classId} | {(e) => updateForm('classId', e.target.value)} | required=true | None declared |
| 1240 | input number | Roll Number | {form.rollNo} | {(e) => updateForm('rollNo', e.target.value)} | min=0 | None declared |
| 1251 | select  | Gender | {form.gender} | {(e) => updateForm('gender', e.target.value)} | None declared | None declared |
| 1260 | input date | Date of Birth | {form.dob &#124;&#124; ''} | {(e) => updateForm('dob', e.target.value)} | None declared | None declared |
| 1269 | select  | Status | {form.status} | {(e) => updateForm('status', e.target.value)} | None declared | None declared |
| 1284 | input  | Guardian Name | {form.guardianName} | {(e) => updateForm('guardianName', e.target.value)} | None declared | None declared |
| 1293 | input  | Guardian Contact Number | {form.contact} | {(e) => updateForm('contact', e.target.value)} | None declared | None declared |
| 1302 | input email | Student Email ID | {form.email &#124;&#124; ''} | {(e) => updateForm('email', e.target.value)} | None declared | None declared |
| 1312 | input  | Student Phone Number | {form.phone &#124;&#124; ''} | {(e) => updateForm('phone', e.target.value)} | None declared | None declared |
| 1329 | input  | Village / Street <span className="req">*</span> | {form.permanentAddress?.street &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'street', e.target.value)} | required=true | None declared |
| 1339 | input  | Ward No. <span className="req">*</span> | {form.permanentAddress?.wardNo &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'wardNo', e.target.value)} | required=true | None declared |
| 1349 | input  | City <span className="req">*</span> | {form.permanentAddress?.city &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'city', e.target.value)} | required=true | None declared |
| 1359 | select  | Municipality Type | {form.permanentAddress?.municipalityType &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'municipalityType', e.target.value)} | None declared | None declared |
| 1371 | input  | District <span className="req">*</span> | {form.permanentAddress?.district &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'district', e.target.value)} | required=true | None declared |
| 1381 | input  | State / Province <span className="req">*</span> | {form.permanentAddress?.state &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'state', e.target.value)} | required=true | None declared |
| 1391 | input  | ZIP / Postal Code <span className="req">*</span> | {form.permanentAddress?.zip &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'zip', e.target.value)} | required=true | None declared |
| 1401 | input  | Country <span className="req">*</span> | {form.permanentAddress?.country &#124;&#124; ''} | {(e) => updateAddressField('permanentAddress', 'country', e.target.value)} | required=true | None declared |
| 1412 | input checkbox | Temporary Address same as Permanent Address | {!!form.sameAsPermanent} | {(e) => handleSameAsPermanentToggle(e.target.checked)} | None declared | id=sameAsPermanent |
| 1434 | input  | Village / Street <span className="req">*</span> | {form.temporaryAddress?.street &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'street', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1444 | input  | Ward No. <span className="req">*</span> | {form.temporaryAddress?.wardNo &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'wardNo', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1454 | input  | City <span className="req">*</span> | {form.temporaryAddress?.city &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'city', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1464 | select  | Municipality Type | {form.temporaryAddress?.municipalityType &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'municipalityType', e.target.value)} | disabled={!!form.sameAsPermanent} | None declared |
| 1477 | input  | District <span className="req">*</span> | {form.temporaryAddress?.district &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'district', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1487 | input  | State / Province <span className="req">*</span> | {form.temporaryAddress?.state &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'state', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1497 | input  | ZIP / Postal Code <span className="req">*</span> | {form.temporaryAddress?.zip &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'zip', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1507 | input  | Country <span className="req">*</span> | {form.temporaryAddress?.country &#124;&#124; ''} | {(e) => updateAddressField('temporaryAddress', 'country', e.target.value)} | required={!form.sameAsPermanent} | None declared |
| 1600 | input file | <i className="fa-solid fa-cloud-arrow-up"></i> Upload File | — | {(e) => { const file = e.target.files?.[0] if (!file) return const ext = file.name.substring(file.name.lastIndexOf('.')) &#124;&#124; '.pdf' const nameStr = form.name.trim() &#124;&#124; 'Student' const formattedName = '${nameStr} ${label}${ext}' const nextDocs = { ...form.documents, [key]: { name: formattedName, type: file.type, size: file.size, lastModified: file.lastModified } } updateForm('documents', nextDocs) }} | accept={acceptExts} | id={'file-upload-${key}'} |
| 1668 | input  | Custom Verification Documents | {input.label} | {(e) => { const val = e.target.value setCustomDocInputs((prev) => prev.map((item) => (item.id === input.id ? { ...item, label: val } : item)) ) if (doc) { const nextDocs = { ...form.documents } nextDocs[input.id] = { ...doc, label: val } updateForm('documents', nextDocs) } }} | disabled={!!doc} | None declared |
| 1744 | input file | <i className="fa-solid fa-cloud-arrow-up"></i> Upload File | — | {(e) => { const file = e.target.files?.[0] if (!file) return const ext = file.name.substring(file.name.lastIndexOf('.')) &#124;&#124; '.pdf' const nameStr = form.name.trim() &#124;&#124; 'Student' const formattedName = '${nameStr} ${input.label.trim()}${ext}' const nextDocs = { ...form.documents, [input.id]: { name: formattedName, type: file.type, size: file.size, label: input.label.trim(), lastModified: file.lastModified } } updateForm('documents', nextDocs) }} | accept=.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx; disabled={!input.label.trim()} | id={'file-upload-${input.id}'} |
| 2093 | input  | Document Name <span className="req">*</span> | {newDocName} | {(e) => setNewDocName(e.target.value)} | required=true | None declared |
| 2104 | input file | Upload File <span className="req">*</span> / <i className="fa-solid fa-cloud-arrow-up"></i> {newDocFile ? newDocFile.name : 'Choose file...'} | — | {(e) => { const file = e.target.files?.[0] if (file) setNewDocFile(file) }} | accept=.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx | id=detail-custom-doc-file |
| 2267 | input file | (none in adjacent label) | — | {(e) => handleDirectUpload(key, label, e)} | accept={key === 'ppSizeImage' ? '.png,.jpg,.jpeg,.gif' : '.png,.jpg,.jpeg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'} | id={'direct-upload-${key}'} |
| 2415 | input  | Search month, invoice... | {feeSearch} | {(e) => setFeeSearch(e.target.value)} | None declared | None declared |
| 2427 | select  | (none in adjacent label) | {feeStatusFilter} | {(e) => setFeeStatusFilter(e.target.value)} | None declared | None declared |
| 2433 | select  | (none in adjacent label) | {feeSortBy} | {(e) => setFeeSortBy(e.target.value)} | None declared | None declared |
| 2457 | input  | Billing Start Month <span className="req">*</span> | {payForm.startMonth} | {(e) => setPayForm({ ...payForm, startMonth: e.target.value })} | required=true | None declared |
| 2469 | select  | Billing Duration (Months) | {payForm.monthsCount} | {(e) => setPayForm({ ...payForm, monthsCount: Number(e.target.value) })} | None declared | None declared |
| 2485 | input  | Payer Full Name {payForm.status === 'paid' && <span className="req">*</span>} | {payForm.paidBy &#124;&#124; ''} | {(e) => setPayForm({ ...payForm, paidBy: e.target.value })} | required={payForm.status === 'paid'} | None declared |
| 2497 | select  | Payer Relationship | {payForm.payerRelation &#124;&#124; 'Father'} | {(e) => setPayForm({ ...payForm, payerRelation: e.target.value })} | None declared | None declared |
| 2513 | input  | Custom Relation <span className="req">*</span> | {payForm.customRelationship &#124;&#124; ''} | {(e) => setPayForm({ ...payForm, customRelationship: e.target.value })} | required=true | None declared |
| 2526 | select  | Status | {payForm.status &#124;&#124; 'paid'} | {(e) => setPayForm({ ...payForm, status: e.target.value })} | None declared | None declared |
| 2542 | select  | Payment Method | {payForm.paymentMode &#124;&#124; 'Cash'} | {(e) => setPayForm({ ...payForm, paymentMode: e.target.value, onlineApp: e.target.value === 'Online' ? 'E-Sewa' : '' })} | None declared | None declared |
| 2554 | select  | Online Platform | {payForm.onlineApp &#124;&#124; 'E-Sewa'} | {(e) => setPayForm({ ...payForm, onlineApp: e.target.value })} | None declared | None declared |
| 2569 | input  | Custom App Name <span className="req">*</span> | {payForm.customOnlineApp &#124;&#124; ''} | {(e) => setPayForm({ ...payForm, customOnlineApp: e.target.value })} | required=true | None declared |
| 2584 | select  | Discount Settings | {payForm.discountType &#124;&#124; 'none'} | {(e) => setPayForm({ ...payForm, discountType: e.target.value, customDiscount: '' })} | None declared | None declared |
| 2604 | input number | {payForm.discountType === 'customPercent' ? 'Discount (%)' : 'Discount ($)'} <span className="req">*</span> | {payForm.customDiscount} | {(e) => setPayForm({ ...payForm, customDiscount: e.target.value })} | required=true; min=0 | None declared |
| 2619 | select  | Tax System | {payForm.taxType &#124;&#124; 'none'} | {(e) => setPayForm({ ...payForm, taxType: e.target.value, customTax: '' })} | None declared | None declared |
| 2636 | input number | {payForm.taxType === 'customPercent' ? 'Tax Rate (%)' : 'Tax Amount ($)'} <span className="req">*</span> | {payForm.customTax} | {(e) => setPayForm({ ...payForm, customTax: e.target.value })} | required=true; min=0 | None declared |
| 2905 | input number | {'Default: $${feeItem.amount}'} | {val} | {(e) => { const newVal = e.target.value setLocalOverrides(prev => ({ ...prev, [feeItem.id]: newVal === '' ? '' : Number(newVal) })) }} | min=0 | None declared |
| 2965 | input  | Exam Name <span className="req">*</span> | {examForm.examName} | {(e) => setExamForm({ ...examForm, examName: e.target.value })} | required=true | None declared |
| 2976 | input number | Year <span className="req">*</span> | {examForm.year} | {(e) => setExamForm({ ...examForm, year: e.target.value })} | required=true | None declared |
| 2986 | input date | Date <span className="req">*</span> | {examForm.date} | {(e) => setExamForm({ ...examForm, date: e.target.value })} | required=true | None declared |
| 3018 | input number | Subject-wise Marks Obtained (Out of 100 max) | {examForm.subjectsMarks[sub.name] &#124;&#124; ''} | {(e) => setExamForm({ ...examForm, subjectsMarks: { ...examForm.subjectsMarks, [sub.name]: e.target.value } })} | min=0; max=100 | None declared |
| 3042 | textarea  | Remarks &amp; Feedback | {examForm.remarks} | {(e) => setExamForm({ ...examForm, remarks: e.target.value })} | None declared | None declared |
| 3401 | select  | (none in adjacent label) | {'${stuAttMonth}-${stuAttYear}'} | {e => { const [m,y] = e.target.value.split('-').map(Number) setStuAttMonth(m); setStuAttYear(y) }} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 1003 | <i className="fa-solid fa-plus"></i> New Student | {openCreate} |
| 1008 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => { resetForm(); setViewMode('list'); }} |
| 1058 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 1171 | <i className="fa-solid fa-eye"></i> | {() => { setSelectedStudentId(student.id); setDetailTab('overview'); setViewMode('detail'); }} |
| 1174 | <i className="fa-solid fa-pen"></i> | {() => editStudent(student)} |
| 1177 | <i className="fa-solid fa-trash"></i> | {() => deleteStudent(student)} |
| 1585 | <i className="fa-solid fa-xmark"></i> | {() => { const nextDocs = { ...form.documents } delete nextDocs[key] updateForm('documents', nextDocs) }} |
| 1689 | <i className="fa-solid fa-trash-can"></i> | {() => { setCustomDocInputs((prev) => prev.filter((item) => item.id !== input.id)) const nextDocs = { ...form.documents } delete nextDocs[input.id] updateForm('documents', nextDocs) }} |
| 1729 | <i className="fa-solid fa-xmark"></i> | {() => { const nextDocs = { ...form.documents } delete nextDocs[input.id] updateForm('documents', nextDocs) }} |
| 1799 | <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Add Custom Document | {() => { setCustomDocInputs((prev) => [...prev, { id: 'custom_${Date.now()}', label: '' }]) }} |
| 1811 | Cancel | {() => { resetForm(); setViewMode('list'); }} |
| 1814 | <i className={'fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}'}></i> {editingId ? ' Update Student' : ' Add Student'} | submit |
| 1904 | <i className="fa-solid fa-circle-info"></i> Overview | {() => setDetailTab('overview')} |
| 1907 | <i className="fa-solid fa-book"></i> Subjects ( {selectedStudentSubjects.length} ) | {() => setDetailTab('subjects')} |
| 1910 | <i className="fa-solid fa-file-invoice-dollar"></i> Fees &amp; Payments ( {selectedStudent?.payments?.length &#124;&#124; 0} ) | {() => setDetailTab('payments')} |
| 1913 | <i className="fa-solid fa-sliders"></i> Fee Customizations | {() => setDetailTab('feeOverrides')} |
| 1916 | <i className="fa-solid fa-square-poll-vertical"></i> Exam Reports ( {selectedStudent?.exams?.length &#124;&#124; 0} ) | {() => setDetailTab('exams')} |
| 1919 | <i className="fa-solid fa-school"></i> Class Info | {() => setDetailTab('classinfo')} |
| 1922 | <i className="fa-solid fa-clipboard-user"></i> Attendance | {() => setDetailTab('attendance')} |
| 2069 | <i className={'fa-solid ${showAddDocForm ? 'fa-xmark' : 'fa-plus'}'}></i> {showAddDocForm ? 'Cancel' : 'Add Document'} | {() => setShowAddDocForm(!showAddDocForm)} |
| 2134 | Cancel | {() => { setShowAddDocForm(false) setNewDocName('') setNewDocFile(null) }} |
| 2141 | Save Document | submit |
| 2237 | <i className="fa-solid fa-download"></i> | {() => { const content = 'Mock verification document content for:\nStudent: ${selectedStudent.name}\nDocument Type: ${label}\nFilename: ${doc.name}' const blob = new Blob([content], { type: 'text/plain' }) const url = URL.createObjectURL(blob) const a = document.createElement('a') a.href = url a.download = doc.name document.body.appendChild(a) a.click() document.body.removeChild(a) URL.revokeObjectURL(url) }} |
| 2256 | <i className="fa-solid fa-trash-can"></i> | {() => handleDirectDelete(key, label)} |
| 2398 | <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> Excel | {handleExportStudentFeesCSV} |
| 2401 | <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF | {handleExportStudentFeesPDF} |
| 2404 | <i className="fa-solid fa-plus"></i> Record Payment | {() => setShowPayForm(!showPayForm)} |
| 2422 | <i className="fa-solid fa-xmark"></i> | {() => setFeeSearch('')} |
| 2692 | Cancel | {() => setShowPayForm(false)} |
| 2695 | Save Payment | submit |
| 2783 | <i className="fa-solid fa-print"></i> | {() => { setActiveReceipt({ ...p, studentName: selectedStudent.name, admissionNo: selectedStudent.admissionNo &#124;&#124; '', className: getClassName(selectedStudent.classId) }) }} |
| 2798 | <i className="fa-solid fa-download"></i> | {() => { const subtotal = p.amount !== undefined ? p.amount : (p.amountPaid &#124;&#124; 0) const discount = p.discountAmount &#124;&#124; 0 const tax = p.taxAmount &#124;&#124; 0 const grandTotal = p.amountPaid &#124;&#124; 0 const words = p.inWords &#124;&#124; numberToWords(grandTotal) let itemsStr = '' if (p.feesBreakdown && p.feesBreakdown.length > 0) { itemsStr = p.feesBreakdown.map(item => ' - ${item.name}: $${item.amount}.00').join('\n') } else { itemsStr = ' - Tuition & Educational Services Fee: $${subtotal}.00' } const content = '=====================================\n EDUCORE PAYMENT SLIP \n=====================================\nSlip No: ${p.invoiceNo}\nStudent Name: ${selectedStudent.name}\nAdmission No: ${selectedStudent.admissionNo}\nClass: ${getClassName(selectedStudent.classId)}\n-------------------------------------\nBilling Period: ${p.month}\n\nItemized Breakdown:\n${itemsStr}\n-------------------------------------\nSubtotal: $${subtotal}.00\nDiscount: -$${discount}.00\nTax Surcharge: +$${tax}.00\nGrand Total Paid: $${grandTotal}.00\nAmount in Words: ${words}\n-------------------------------------\nPayment Date: ${p.paymentDate}\nPaid By: ${p.paidBy} (${p.payerRelation})\nPayment Method: ${p.paymentMode &#124;&#124; 'Cash'}${p.paymentMode === 'Online' && p.onlineApp ? ' (${p.onlineApp})' : ''}\nReceived By: ${getCollectorName(p.receivedBy)}\n-------------------------------------\nStatus: COMPLETED\n=====================================' const blob = new Blob([content], { type: 'text/plain' }) const url = URL.createObjectURL(blob) const a = document.createElement('a') a.href = url a.download = 'Receipt_${selectedStudent.name.replace(/\s+/g, '_')}_${p.month.replace(/\s+/g, '_')}.txt' document.body.appendChild(a) a.click() document.body.removeChild(a) URL.revokeObjectURL(url) }} |
| 2831 | <i className="fa-solid fa-trash"></i> | {() => deletePayment(p.id)} |
| 2929 | <i className="fa-solid fa-circle-check"></i> Save Customizations | submit |
| 2946 | <i className="fa-solid fa-plus"></i> Record Exam Report | {() => setShowExamForm(!showExamForm)} |
| 3052 | Cancel | {() => setShowExamForm(false)} |
| 3055 | Save Report Card | submit |
| 3109 | <i className="fa-solid fa-file-pdf"></i> Export | {() => { const headers = ['Subject', 'Marks Obtained', 'Maximum Marks', 'Grade'] const rows = report.subjects.map(s => [s.subjectName, '${s.marksObtained}', '${s.maxMarks}', s.grade]) const metadata = 'Report Card for ${selectedStudent.name}\nExam: ${report.examName} (${report.year})\nDate: ${report.date}\nOverall: ${percentage}% (${overallPass ? 'PASS' : 'FAIL'})\nRemarks: ${report.remarks}' printToPDF( 'Report Card - ${selectedStudent.name}', headers, rows, metadata ) }} |
| 3127 | <i className="fa-solid fa-trash"></i> | {() => deleteExamReport(report.id)} |
| 3499 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => setViewMode('list')} |
| 3503 | <i className="fa-solid fa-pen"></i> Edit Student | {() => editStudent(selectedStudent)} |
| 3506 | <i className="fa-solid fa-trash"></i> Delete Student | {() => deleteStudent(selectedStudent)} |
| 3532 | <i className="fa-solid fa-xmark"></i> | {() => setActiveReceipt(null)} |
| 3681 | Close | {() => setActiveReceipt(null)} |
| 3682 | <i className="fa-solid fa-print"></i> Print Slip | {() => window.print()} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 1097 | tr | <td> <div className="roles-name-cell"> <div className="roles-name-icon" style={{ background: student.gender === 'Female' ? 'var(--purplebg)' : 'var(--bluebg)', color: student.gender === 'Female' ? 'var(--purple)' : 'var(--blue)', }} > <i className={'fa-solid ${student.gender === 'Female' ? 'fa-user' : 'fa-user-graduate'}'}></i> </div> <div> <div cl | {() => { setSelectedStudentId(student.id) setDetailTab('overview') setViewMode('detail') }} | None declared |
| 1169 | td | <div className="roles-actions"> <button className="btn-icon-sm" title="View Details" onClick={() => { setSelectedStudentId(student.id); setDetailTab('overview'); setViewMode('detail'); }}> <i className="fa-solid fa-eye"></i> </button> <button className="btn-icon-sm" title="Edit" onClick={() => editStudent(student)}> <i className="fa-solid fa-pen">< | {(e) => e.stopPropagation()} | None declared |
| 3316 | tr | {isMonitor ? 'selected' : ''} | {() => { setSelectedStudentId(mate.id) setDetailTab('overview') }} | None declared |
| 3522 | div | modal-overlay print-receipt-overlay | {() => setActiveReceipt(null)} | None declared |
| 3523 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 1063 | <option value="all">All Classes</option> {classes.map((c) => ( <option key={c.id} value={String(c.id)}> {c.name}{c.section ? ' - ${c.section}' : ''} </option> ))} |
| 1071 | <option value="all">All Status</option> <option value="active">Active</option> <option value="inactive">Inactive</option> |
| 1224 | <option value="">Select class</option> {classes.filter((c) => c.status === 'active').map((c) => ( <option key={c.id} value={c.id}> {c.name}{c.section ? ' - ${c.section}' : ''} ({c.room &#124;&#124; 'No room'}) </option> ))} |
| 1251 | <option value="">Not specified</option> <option value="Male">Male</option> <option value="Female">Female</option> <option value="Other">Other</option> |
| 1269 | <option value="active">Active</option> <option value="inactive">Inactive</option> |
| 1359 | <option value="">Select type (Optional)</option> <option value="Municipality">Municipality</option> <option value="Rural Municipality">Rural Municipality</option> |
| 1464 | <option value="">Select type (Optional)</option> <option value="Municipality">Municipality</option> <option value="Rural Municipality">Rural Municipality</option> |
| 2427 | <option value="all">All Statuses</option> <option value="paid">Paid</option> <option value="pending">Pending</option> <option value="overdue">Overdue</option> |
| 2433 | <option value="latest">Sort: Latest First</option> <option value="oldest">Sort: Oldest First</option> <option value="amountHigh">Sort: Amount (High-Low)</option> <option value="amountLow">Sort: Amount (Low-High)</option> |
| 2469 | <option value={1}>1 Month (Standard)</option> <option value={2}>2 Months (Bi-Monthly)</option> <option value={3}>3 Months (Quarterly)</option> <option value={6}>6 Months (Half-Yearly)</option> <option value={12}>12 Months (Yearly)</option> |
| 2497 | {payerRelationships.map((rel) => ( <option key={rel} value={rel}>{rel}</option> ))} <option value="custom">+ Add Custom Relation</option> |
| 2526 | <option value="paid">Paid</option> <option value="pending">Pending</option> <option value="overdue">Overdue</option> |
| 2542 | <option value="Cash">Cash</option> <option value="Online">Online</option> |
| 2554 | {onlineModes.map((mode) => ( <option key={mode} value={mode}>{mode}</option> ))} <option value="custom">+ Add Custom App</option> |
| 2584 | <option value="none">No Discount</option> <option value="5%">5% Discount</option> <option value="10%">10% Discount</option> <option value="25%">25% Discount</option> <option value="50%">50% Scholarship</option> <option value="100%">100% Full Waiver</option> <option value="customPercent">Custom Percent (%)</option> <option value="customAmount">Custom Amount ($)</option> |
| 2619 | <option value="none">No Tax</option> <option value="13%">13% VAT</option> <option value="5%">5% Service Tax</option> <option value="customPercent">Custom Percent (%)</option> <option value="customAmount">Custom Amount ($)</option> |
| 3401 | {monthOpts.map(o => ( <option key={o.label} value={'${o.m}-${o.y}'}>{o.label}</option> ))} |

### Storage reads and writes

| Line | Call |
|---|---|
| 176 | localStorage.getItem('educore.studentAttendance') |
| 182 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 195 | writeStoredList(STORAGE_KEYS.students, storedStudents) |
| 200 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 201 | readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS) |
| 202 | readStoredList(STORAGE_KEYS.staff, STAFF) |
| 203 | readStoredList('educore.fees', [ { id: 1, name: 'Tuition Fee', amount: 4500, frequency: 'Monthly', description: 'Standard tuition fee for regular academic modules', classIds: [1, 2, 3], status: 'active' }, { id: 2, name: 'Computer Lab Fee', amount: 500, frequency: 'Monthly', description: 'Charges for computing laboratory and resource materials', classIds: [1, 3], status: 'active' }, { id: 3, name: 'Term Exam Fee', amount: 1200, frequency: 'One-Time', description: 'Examination sheet printing and administrative costs', classIds: [1, 2, 3], status: 'active' }, { id: 4, name: 'Graduation Certificate Fee', amount: 1500, frequency: 'One-Time', description: 'Certificate embossing and graduation ceremony fee', classIds: [3], status: 'active' }, { id: 5, name: 'Library Resource Fee', amount: 150, frequency: 'Weekly', description: 'Weekly access fee for online journals and library catalog', classIds: [1, 2], status: 'active' } ]) |
| 210 | readStoredList('educore.onlinePaymentModes', ['E-Sewa', 'Khalti', 'Bank Transfer']) |
| 211 | readStoredList('educore.payerRelationships', ['Self', 'Father', 'Mother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Guardian']) |
| 213 | localStorage.getItem('educore.currentUser') |
| 221 | writeStoredList(STORAGE_KEYS.students, students) |
| 226 | writeStoredList('educore.onlinePaymentModes', onlineModes) |
| 231 | writeStoredList('educore.payerRelationships', payerRelationships) |
| 709 | writeStoredList('educore.onlinePaymentModes', updatedModes) |
| 727 | writeStoredList('educore.payerRelationships', updatedRels) |

### Functions

- parseMonthsCount (line 17)
- getFeeItemDetails (line 26)
- getTeacherName (line 93)
- Students (line 97)
- getCollectorName (line 120)
- handleSaveFeeOverrides (line 240)
- showToast (line 257)
- handleExportStudentFeesCSV (line 424)
- handleExportStudentFeesPDF (line 441)
- updateForm (line 457)
- updateAddressField (line 459)
- handleSameAsPermanentToggle (line 481)
- resetForm (line 496)
- saveStudent (line 502)
- editStudent (line 598)
- deleteStudent (line 654)
- getBillingMonthRange (line 666)
- savePayment (line 686)
- pad (line 734)
- deletePayment (line 801)
- saveExamReport (line 817)
- pad (line 842)
- deleteExamReport (line 880)
- handleDirectUpload (line 896)
- handleDirectDelete (line 923)
- handleSaveCustomDoc (line 939)
- getClassName (line 974)
- openCreate (line 980)

## pages/subjects.js

941 lines; 11 field definitions; 15 button definitions; 0 dialog/overlay definitions.

Imports: react, next/router, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 476 | input  | Search subject name, code, textbook publisher... | {search} | {(event) => setSearch(event.target.value)} | None declared | None declared |
| 488 | select  | (none in adjacent label) | {categoryFilter} | {(event) => setCategoryFilter(event.target.value)} | None declared | None declared |
| 501 | select  | (none in adjacent label) | {statusFilter} | {(event) => setStatusFilter(event.target.value)} | None declared | None declared |
| 511 | select  | (none in adjacent label) | {classFilter} | {(event) => setClassFilter(event.target.value)} | None declared | None declared |
| 658 | input  | Subject Name <span className="req">*</span> | {form.name} | {(event) => updateForm('name', event.target.value)} | required=true | None declared |
| 668 | select  | Category | {form.category} | {(event) => updateForm('category', event.target.value)} | None declared | None declared |
| 682 | input  | Textbook Title (Optional) | {form.bookName} | {(event) => updateForm('bookName', event.target.value)} | None declared | None declared |
| 691 | input  | Publisher (Optional) | {form.publication} | {(event) => updateForm('publication', event.target.value)} | None declared | None declared |
| 700 | input  | Book Catalog Code (Optional) | {form.bookCode} | {(event) => updateForm('bookCode', event.target.value)} | None declared | None declared |
| 709 | select  | Status | {form.status} | {(event) => updateForm('status', event.target.value)} | None declared | None declared |
| 734 | input checkbox | (none in adjacent label) | {isChecked} | {() => handleToggleClassInForm(c.id)} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 394 | <i className="fa-solid fa-file-excel" style={{ color: 'var(--green)' }}></i> Excel | {handleExportCSV} |
| 397 | <i className="fa-solid fa-file-pdf" style={{ color: 'var(--red)' }}></i> PDF | {handleExportPDF} |
| 400 | <i className="fa-solid fa-plus"></i> New Subject | {() => { resetForm() setViewMode('create') }} |
| 412 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => { resetForm() setViewMode('list') }} |
| 482 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 600 | <i className="fa-solid fa-eye"></i> | {() => { setSelectedSubjectId(subject.id) setViewMode('detail') }} |
| 610 | <i className="fa-solid fa-pen"></i> | {() => editSubject(subject)} |
| 617 | <i className={'fa-solid ${subject.status === 'active' ? 'fa-ban' : 'fa-check'}'}></i> | {() => toggleSubjectStatus(subject.id)} |
| 625 | <i className="fa-solid fa-trash"></i> | {() => deleteSubject(subject)} |
| 748 | Cancel | {() => { resetForm() setViewMode('list') }} |
| 758 | <i className={'fa-solid ${editingId ? 'fa-floppy-disk' : 'fa-plus'}'}></i> {editingId ? 'Save Configuration' : 'Save Subject'} | submit |
| 883 | <i className="fa-solid fa-external-link"></i> View Class | {() => router.push('/classes?id=${c.id}')} |
| 901 | <i className="fa-solid fa-arrow-left"></i> Back to List | {() => setViewMode('list')} |
| 905 | <i className="fa-solid fa-pen"></i> Edit Subject Registry | {() => editSubject(selectedSubject)} |
| 908 | <i className="fa-solid fa-trash"></i> Delete Subject | {() => deleteSubject(selectedSubject)} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 530 | th | Subject Name {sortBy === 'name' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('name')} | None declared |
| 533 | th | Subject Code {sortBy === 'code' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('code')} | None declared |
| 536 | th | Category {sortBy === 'category' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('category')} | None declared |
| 540 | th | Classes Assigned {sortBy === 'classCount' && (sortDir === 'asc' ? '▲' : '▼')} | {() => toggleSort('classCount')} | None declared |
| 558 | tr | <td> <div className="roles-name-cell"> <div className="roles-name-icon" style={{ background: 'var(--greenbg)', color: 'var(--green)' }} > <i className="fa-solid fa-book"></i> </div> <div className="roles-name-text">{subject.name}</div> </div> </td> <td> <span style={{ fontFamily: 'monospace' }}>{subject.code}</span> </td> <td> <span className="badg | {() => { setSelectedSubjectId(subject.id) setViewMode('detail') }} | None declared |
| 598 | td | <div className="roles-actions"> <button className="btn-icon-sm tooltip" data-tooltip="View Details" onClick={() => { setSelectedSubjectId(subject.id) setViewMode('detail') }} > <i className="fa-solid fa-eye"></i> </button> <button className="btn-icon-sm tooltip" data-tooltip="Edit Details" onClick={() => editSubject(subject)} > <i className="fa-sol | {(event) => event.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 488 | <option value="all">All Categories</option> {SUBJECT_CATEGORIES.map((item) => ( <option key={item} value={item}> {item} </option> ))} |
| 501 | <option value="all">All Statuses</option> <option value="active">Active</option> <option value="inactive">Inactive</option> |
| 511 | <option value="all">Filter by Class</option> {classes.map((c) => ( <option key={c.id} value={String(c.id)}> {c.name} {c.section} </option> ))} |
| 668 | {SUBJECT_CATEGORIES.map((item) => ( <option key={item} value={item}> {item} </option> ))} |
| 709 | <option value="active">Active</option> <option value="inactive">Inactive</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 50 | readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS) |
| 53 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 56 | readStoredList(STORAGE_KEYS.students, []) |
| 57 | readStoredList(STORAGE_KEYS.staff, STAFF) |
| 76 | writeStoredList(STORAGE_KEYS.subjects, subjects) |
| 317 | writeStoredList(STORAGE_KEYS.classes, updatedClasses) |
| 359 | writeStoredList(STORAGE_KEYS.classes, updatedClasses) |

### Functions

- Subjects (line 27)
- showToast (line 79)
- toggleSort (line 86)
- toggleSubjectStatus (line 96)
- handleExportCSV (line 164)
- handleExportPDF (line 198)
- updateForm (line 230)
- handleToggleClassInForm (line 232)
- resetForm (line 241)
- saveSubject (line 246)
- editSubject (line 323)
- deleteSubject (line 344)

## pages/timeline.js

748 lines; 11 field definitions; 14 button definitions; 2 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 338 | input  | Search updates, titles, keywords... | {search} | {(e) => setSearch(e.target.value)} | None declared | None declared |
| 349 | select  | (none in adjacent label) | {categoryFilter} | {(e) => setCategoryFilter(e.target.value)} | None declared | None declared |
| 355 | select  | (none in adjacent label) | {audienceFilter} | {(e) => setAudienceFilter(e.target.value)} | None declared | None declared |
| 445 | input  | Write a comment... | {commentInputs[ev.id] &#124;&#124; ''} | {(e) => handleCommentChange(ev.id, e.target.value)} | required=true | None declared |
| 617 | input  | Announcement Title <span className="req">*</span> | {form.title} | {(e) => setForm({ ...form, title: e.target.value })} | required=true | None declared |
| 629 | textarea  | Body Description <span className="req">*</span> | {form.description} | {(e) => setForm({ ...form, description: e.target.value })} | required=true | None declared |
| 644 | input  | Category Group <span className="req">*</span> | {form.category} | {(e) => setForm({ ...form, category: e.target.value })} | required=true | None declared |
| 661 | select  | Target Audience | {form.targetAudience} | {(e) => setForm({ ...form, targetAudience: e.target.value })} | None declared | None declared |
| 672 | input date | Date Scheduled <span className="req">*</span> | {form.date} | {(e) => setForm({ ...form, date: e.target.value })} | required=true | None declared |
| 684 | input time | Start Time | {form.startTime} | {(e) => setForm({ ...form, startTime: e.target.value })} | None declared | None declared |
| 693 | input time | End Time | {form.endTime} | {(e) => setForm({ ...form, endTime: e.target.value })} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 324 | <i className="fa-solid fa-bullhorn"></i> New Announcement | {openAdd} |
| 344 | <i className="fa-solid fa-xmark"></i> | {() => setSearch('')} |
| 405 | <i className={evLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i> {ev.likes &#124;&#124; 0} Likes | {() => handleLike(ev.id)} |
| 419 | <i className="fa-solid fa-trash-can"></i> Delete | {() => deleteAnnouncement(ev.id)} |
| 453 | Post | submit |
| 470 | <i className="fa-solid fa-chevron-left"></i> | {handlePrevMonth} |
| 474 | <i className="fa-solid fa-chevron-right"></i> | {handleNextMonth} |
| 556 | <i className="fa-solid fa-xmark"></i> | {() => setSelectedDayEvents(null)} |
| 576 | <i className="fa-solid fa-trash-can"></i> Delete Announcement | {() => deleteAnnouncement(ev.id)} |
| 589 | Close | {() => setSelectedDayEvents(null)} |
| 607 | <i className="fa-solid fa-xmark"></i> | {() => setShowModal(false)} |
| 707 |  | {() => setForm({ ...form, color: col })} |
| 726 | Cancel | {() => setShowModal(false)} |
| 727 | <i className="fa-solid fa-paper-plane"></i> Broadcast Bulletin | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 496 | div | {'calendar-day${isToday ? ' today' : ''}'} | {() => handleOpenDay(day)} | None declared |
| 546 | div | modal-overlay | {() => setSelectedDayEvents(null)} | None declared |
| 547 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 349 | <option value="all">All Categories</option> {categories.map(cat => ( <option key={cat} value={cat}>{cat}</option> ))} |
| 355 | <option value="all">All Audiences</option> {AUDIENCES.map(aud => ( <option key={aud} value={aud}>{aud} Users</option> ))} |
| 661 | {AUDIENCES.map(aud => ( <option key={aud} value={aud}>{aud}</option> ))} |

### Storage reads and writes

| Line | Call |
|---|---|
| 66 | readStoredList(STORAGE_KEYS.events, INITIAL_EVENTS) |
| 68 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 71 | localStorage.getItem('educore.currentUser') |
| 86 | localStorage.getItem('educore.eventCategories') |
| 98 | writeStoredList(STORAGE_KEYS.events, events) |
| 103 | localStorage.setItem('educore.eventCategories', JSON.stringify(categories)) |
| 190 | localStorage.getItem(likedKey) |
| 193 | localStorage.setItem(likedKey, 'false') |
| 196 | localStorage.setItem(likedKey, 'true') |
| 207 | localStorage.getItem('liked_${eventId}_${currentUser}') |

### Functions

- Timeline (line 28)
- getCategoryClass (line 43)
- showToast (line 106)
- handlePrevMonth (line 175)
- handleNextMonth (line 179)
- handleLike (line 184)
- isLiked (line 205)
- handleCommentChange (line 210)
- submitComment (line 214)
- handleOpenDay (line 244)
- openAdd (line 253)
- submitForm (line 266)
- deleteAnnouncement (line 301)
- formatEventDate (line 308)

## pages/timetable.js

1300 lines; 17 field definitions; 25 button definitions; 2 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData, ../lib/exportUtils.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 643 | select  | Choose Class | {selectedClassId} | {(e) => setSelectedClassId(e.target.value)} | None declared | None declared |
| 652 | select  | Choose Faculty Member | {selectedTeacherId} | {(e) => setSelectedTeacherId(e.target.value)} | None declared | None declared |
| 664 | input text | Search Schedule | {searchQuery} | {(e) => setSearchQuery(e.target.value)} | None declared | None declared |
| 895 | select  | Week Starting Day | {weekStartDay} | {(e) => setWeekStartDay(e.target.value)} | disabled={!hasEditPermission} | None declared |
| 929 | input checkbox | Active School Days | {isActive} | {() => toggleActiveDay(day)} | disabled={!hasEditPermission &#124;&#124; (isActive && activeDays.length === 1)} | None declared |
| 1042 | input checkbox | (none in adjacent label) | {isChecked} | {() => { setScheduleForm(prev => { const updated = prev.selectedClassIds.includes(cid) ? prev.selectedClassIds.filter(id => id !== cid) : [...prev.selectedClassIds, cid] return { ...prev, selectedClassIds: updated } }) }} | None declared | None declared |
| 1064 | select  | Select Target Class <span className="req">*</span> | {scheduleForm.classId} | {(e) => handleClassChangeInForm(e.target.value)} | required={scheduleForm.formType === 'subject'} | None declared |
| 1082 | select  | Day of Week | {scheduleForm.day} | {(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })} | None declared | None declared |
| 1090 | select  | Time Slot Period | {scheduleForm.periodId} | {(e) => setScheduleForm({ ...scheduleForm, periodId: e.target.value })} | None declared | None declared |
| 1102 | input  | Break Name / Label <span className="req">*</span> | {scheduleForm.breakName} | {(e) => setScheduleForm({ ...scheduleForm, breakName: e.target.value })} | required={scheduleForm.formType === 'break'} | None declared |
| 1115 | select  | Select Subject Module <span className="req">*</span> | {scheduleForm.subjectId} | {(e) => handleSubjectChange(e.target.value)} | required={scheduleForm.formType === 'subject'} | None declared |
| 1131 | select  | Assign Teaching Faculty <span className="req">*</span> | {scheduleForm.teacherId} | {(e) => setScheduleForm({ ...scheduleForm, teacherId: e.target.value })} | required={scheduleForm.formType === 'subject'} | None declared |
| 1147 | input  | Classroom Room Override | {scheduleForm.room} | {(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })} | None declared | None declared |
| 1222 | input  | Slot Interval Label <span className="req">*</span> | {periodForm.name} | {(e) => setPeriodForm({ ...periodForm, name: e.target.value })} | required=true | None declared |
| 1234 | select  | Slot Interval Type | {periodForm.type} | {(e) => setPeriodForm({ ...periodForm, type: e.target.value })} | None declared | None declared |
| 1248 | input time | Start Time <span className="req">*</span> | {periodForm.startTime} | {(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })} | required=true | None declared |
| 1258 | input time | End Time <span className="req">*</span> | {periodForm.endTime} | {(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })} | required=true | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 591 | <i className="fa-solid fa-file-excel" style={{ color: '#107c41', marginRight: '6px' }}></i> Export Excel | {handleExportExcel} |
| 594 | <i className="fa-solid fa-file-pdf" style={{ color: '#e01e22', marginRight: '6px' }}></i> Download PDF | {handleExportPDF} |
| 600 | <i className="fa-solid fa-calendar-plus"></i> Schedule Period | {() => openAddSchedule(timetableDays[0] &#124;&#124; 'Monday', '')} |
| 605 | <i className="fa-solid fa-clock"></i> Configure Time Slot | {openAddPeriod} |
| 614 | <i className="fa-solid fa-calendar-days"></i> Weekly Timetable Grid | {() => setActiveTab('grid')} |
| 617 | <i className="fa-solid fa-clock-rotate-left"></i> Day Structure &amp; Periods ( {periods.length} ) | {() => setActiveTab('periods')} |
| 631 | <i className="fa-solid fa-school" style={{ marginRight: '6px' }}></i> By Class | {() => setViewMode('class')} |
| 634 | <i className="fa-solid fa-chalkboard-user" style={{ marginRight: '6px' }}></i> By Teacher | {() => setViewMode('teacher')} |
| 753 | <i className="fa-solid fa-pencil"></i> | {(e) => openEditSchedule(slot, e)} |
| 756 | <i className="fa-solid fa-trash-can"></i> | {(e) => handleDeleteSchedule(slot.id, e)} |
| 776 | <i className="fa-solid fa-pencil"></i> | {(e) => openEditSchedule(slot, e)} |
| 779 | <i className="fa-solid fa-trash-can"></i> | {(e) => handleDeleteSchedule(slot.id, e)} |
| 788 | <i className="fa-solid fa-plus" style={{ fontSize: '12px' }}></i> Add Subject | {() => openAddSchedule(day, p.id)} |
| 820 | <i className="fa-solid fa-plus"></i> New Time Slot | {openAddPeriod} |
| 867 | <i className="fa-solid fa-pencil"></i> | {() => openEditPeriod(p)} |
| 870 | <i className="fa-solid fa-trash-can"></i> | {() => handleDeletePeriod(p.id)} |
| 975 | <i className="fa-solid fa-xmark"></i> | {() => setShowScheduleModal(false)} |
| 986 | 📚 Subject Module | {() => setScheduleForm({ ...scheduleForm, formType: 'subject' })} |
| 994 | ☕ Custom Break | {() => setScheduleForm({ ...scheduleForm, formType: 'break' })} |
| 1010 | {scheduleForm.selectedClassIds.length === classes.length ? 'Deselect All' : 'Select All'} | {() => { const allIds = classes.map(c => String(c.id)) const areAllSelected = scheduleForm.selectedClassIds.length === classes.length setScheduleForm({ ...scheduleForm, selectedClassIds: areAllSelected ? [] : allIds }) }} |
| 1183 | Cancel | {() => setShowScheduleModal(false)} |
| 1184 | <i className="fa-solid fa-floppy-disk"></i> Schedule Slot | submit |
| 1212 | <i className="fa-solid fa-xmark"></i> | {() => setShowPeriodModal(false)} |
| 1278 | Cancel | {() => setShowPeriodModal(false)} |
| 1279 | <i className="fa-solid fa-circle-check"></i> Save Slot Config | submit |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 643 | {classes.map(c => ( <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option> ))} |
| 652 | {staff.filter(s => s.userType === 'teaching').map(t => ( <option key={t.id} value={t.id}>{t.name} ({t.department})</option> ))} |
| 895 | {ALL_WEEKDAYS.map(day => ( <option key={day} value={day}>{day}</option> ))} |
| 1064 | <option value="">Select Class...</option> {classes.map(c => ( <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option> ))} |
| 1082 | {timetableDays.map(day => ( <option key={day} value={day}>{day}</option> ))} |
| 1090 | <option value="">Select Time Slot...</option> {periods.filter(p => p.type === 'Academic').map(p => ( <option key={p.id} value={p.id}>{p.name} ({p.startTime} - {p.endTime})</option> ))} |
| 1115 | <option value="">Choose Subject...</option> {subjects.map(s => ( <option key={s.id} value={s.id}>{s.name} ({s.code})</option> ))} |
| 1131 | <option value="">Choose Teacher...</option> {staff.filter(s => s.userType === 'teaching').map(t => ( <option key={t.id} value={t.id}>{t.name} ({t.department})</option> ))} |
| 1234 | <option value="Academic">📚 Academic (Assign subjects and teachers)</option> <option value="Break">☕ Recess / Lunch Break (Locked across all days)</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 81 | readStoredList(STORAGE_KEYS.timetable, INITIAL_TIMETABLE) |
| 82 | readStoredList(STORAGE_KEYS.periods, INITIAL_PERIODS) |
| 84 | readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES) |
| 90 | readStoredList(STORAGE_KEYS.subjects, INITIAL_SUBJECTS) |
| 93 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 99 | readStoredList(STORAGE_KEYS.roles, []) |
| 101 | localStorage.getItem('educore.currentUser') |
| 104 | localStorage.getItem('educore.weekStartDay') |
| 106 | localStorage.getItem('educore.activeDays') |
| 118 | writeStoredList(STORAGE_KEYS.timetable, timetable) |
| 123 | writeStoredList(STORAGE_KEYS.periods, periods) |
| 128 | localStorage.setItem('educore.weekStartDay', weekStartDay) |
| 129 | localStorage.setItem('educore.activeDays', JSON.stringify(activeDays)) |

### Functions

- calculateDurationInMinutes (line 38)
- Timetable (line 46)
- showToast (line 132)
- toggleActiveDay (line 157)
- getSlot (line 190)
- getSubjectName (line 194)
- getTeacherName (line 198)
- getClassName (line 202)
- isSlotMatched (line 214)
- generateExportData (line 233)
- handleExportExcel (line 263)
- handleExportPDF (line 278)
- openAddSchedule (line 299)
- openEditSchedule (line 324)
- handleDeleteSchedule (line 345)
- handleSubjectChange (line 356)
- handleClassChangeInForm (line 371)
- submitScheduleForm (line 436)
- openAddPeriod (line 512)
- openEditPeriod (line 522)
- handleDeletePeriod (line 537)
- submitPeriodForm (line 549)

## pages/transport.js

1013 lines; 18 field definitions; 23 button definitions; 3 dialog/overlay definitions.

Imports: react, ../components/Layout, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 485 | input  | Search route name, destination... | {routeSearch} | {(e) => setRouteSearch(e.target.value)} | None declared | None declared |
| 580 | input  | Search bus number, driver name, plate... | {fleetSearch} | {(e) => setFleetSearch(e.target.value)} | None declared | None declared |
| 667 | input  | Search student name or route... | {assignSearch} | {(e) => setAssignSearch(e.target.value)} | None declared | None declared |
| 679 | select  | (none in adjacent label) | {routeFilter} | {(e) => setRouteFilter(e.target.value)} | None declared | None declared |
| 764 | input  | Route Label / Title <span className="req">*</span> | {routeForm.routeName} | {(e) => setRouteForm({ ...routeForm, routeName: e.target.value })} | required=true | None declared |
| 775 | input  | Origin Campus <span className="req">*</span> | {routeForm.origin} | {(e) => setRouteForm({ ...routeForm, origin: e.target.value })} | required=true | None declared |
| 785 | input  | Terminus / Destination <span className="req">*</span> | {routeForm.destination} | {(e) => setRouteForm({ ...routeForm, destination: e.target.value })} | required=true | None declared |
| 796 | input  | Stops (Comma separated in order) <span className="req">*</span> | {routeForm.stopsInput} | {(e) => setRouteForm({ ...routeForm, stopsInput: e.target.value })} | required=true | None declared |
| 809 | input number | Monthly Ticket Fee (Rs.) <span className="req">*</span> | {routeForm.monthlyFee} | {(e) => setRouteForm({ ...routeForm, monthlyFee: e.target.value })} | required=true; min=0 | None declared |
| 852 | input  | Vehicle Code / Identifier <span className="req">*</span> | {vehicleForm.vehicleNo} | {(e) => setVehicleForm({ ...vehicleForm, vehicleNo: e.target.value })} | required=true | None declared |
| 862 | select  | Status | {vehicleForm.status} | {(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })} | None declared | None declared |
| 875 | input  | License Plate Number <span className="req">*</span> | {vehicleForm.plateNo} | {(e) => setVehicleForm({ ...vehicleForm, plateNo: e.target.value })} | required=true | None declared |
| 885 | input number | Seating Cap <span className="req">*</span> | {vehicleForm.capacity} | {(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} | required=true; min=5; max=120 | None declared |
| 898 | input  | Driver Full Name <span className="req">*</span> | {vehicleForm.driverName} | {(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })} | required=true | None declared |
| 908 | input  | Driver Phone Contact | {vehicleForm.driverPhone} | {(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })} | None declared | None declared |
| 948 | select  | Select Student <span className="req">*</span> | {assignForm.studentId} | {(e) => setAssignForm({ ...assignForm, studentId: e.target.value })} | required=true | None declared |
| 967 | select  | Select Bus Route <span className="req">*</span> | {assignForm.routeId} | {(e) => setAssignForm({ ...assignForm, routeId: e.target.value, stopName: '' })} | required=true | None declared |
| 983 | select  | Pickup / Drop-off Stop <span className="req">*</span> | {assignForm.stopName} | {(e) => setAssignForm({ ...assignForm, stopName: e.target.value })} | required=true; disabled={!assignForm.routeId} | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 399 | <i className="fa-solid fa-plus"></i> Create Route | {handleOpenAddRoute} |
| 402 | <i className="fa-solid fa-truck-monster"></i> Add Vehicle | {handleOpenAddVehicle} |
| 405 | <i className="fa-solid fa-user-plus"></i> Assign Student | {handleOpenAssign} |
| 468 | 📍 Transport Routes ( {filteredRoutes.length} ) | {() => setActiveTab('routes')} |
| 471 | 🚍 Vehicle Fleet &amp; Drivers ( {filteredFleet.length} ) | {() => setActiveTab('fleet')} |
| 474 | 🎒 Student Allocations ( {filteredAssignments.length} ) | {() => setActiveTab('allocations')} |
| 491 | <i className="fa-solid fa-xmark"></i> | {() => setRouteSearch('')} |
| 548 | <i className="fa-solid fa-pen-to-square"></i> | {() => handleOpenEditRoute(r)} |
| 555 | <i className="fa-solid fa-trash-can"></i> | {() => handleDeleteRoute(r.id, r.routeName)} |
| 586 | <i className="fa-solid fa-xmark"></i> | {() => setFleetSearch('')} |
| 635 | <i className="fa-solid fa-pen-to-square"></i> | {() => handleOpenEditVehicle(v)} |
| 642 | <i className="fa-solid fa-trash-can"></i> | {() => handleDeleteVehicle(v.id, v.vehicleNo)} |
| 673 | <i className="fa-solid fa-xmark"></i> | {() => setAssignSearch('')} |
| 718 | Cancel Allocation | {() => handleRemoveAssignment(a.id, a.studentName)} |
| 755 | <i className="fa-solid fa-xmark"></i> | {() => setShowRouteModal(false)} |
| 821 | Cancel | {() => setShowRouteModal(false)} |
| 824 | Save Route | submit |
| 842 | <i className="fa-solid fa-xmark"></i> | {() => setShowVehicleModal(false)} |
| 918 | Cancel | {() => setShowVehicleModal(false)} |
| 921 | Save Vehicle | submit |
| 939 | <i className="fa-solid fa-xmark"></i> | {() => setShowAssignModal(false)} |
| 999 | Cancel | {() => setShowAssignModal(false)} |
| 1002 | Confirm Assignment | submit |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 748 | div | modal-overlay | {() => setShowRouteModal(false)} | None declared |
| 749 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |
| 835 | div | modal-overlay | {() => setShowVehicleModal(false)} | None declared |
| 836 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |
| 932 | div | modal-overlay | {() => setShowAssignModal(false)} | None declared |
| 933 | div | modal-panel role-form-modal | {(e) => e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 679 | <option value="all">All Routes</option> {routes.map(r => ( <option key={r.id} value={r.id}>{r.routeName}</option> ))} |
| 862 | <option value="active">Active / Running</option> <option value="maintenance">Maintenance</option> |
| 948 | <option value="">-- Choose Student --</option> {students.map(s => { const assigned = assignments.some(a => String(a.studentId) === String(s.id)) return ( <option key={s.id} value={s.id} disabled={assigned}> {s.name} (Class {s.classStr &#124;&#124; s.classId &#124;&#124; '—'}) {assigned ? '[Already Assigned]' : ''} </option> ) })} |
| 967 | <option value="">-- Choose Route --</option> {routes.map(r => ( <option key={r.id} value={r.id}> {r.routeName} (Rs. {r.monthlyFee}/month) </option> ))} |
| 983 | <option value="">-- Choose Pickup Stop --</option> {activeRouteStops.map(stop => ( <option key={stop} value={stop}>{stop}</option> ))} |

### Storage reads and writes

| Line | Call |
|---|---|
| 74 | readStoredList(STORAGE_KEYS.vehicles, INITIAL_VEHICLES) |
| 76 | readStoredList(STORAGE_KEYS.routes, INITIAL_ROUTES) |
| 78 | readStoredList(STORAGE_KEYS.transportAssignments, INITIAL_TRANSPORT_ASSIGNMENTS) |
| 80 | readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS) |
| 82 | readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF) |
| 85 | localStorage.getItem('educore.currentUser') |
| 92 | readStoredList(STORAGE_KEYS.roles, []) |
| 106 | writeStoredList(STORAGE_KEYS.vehicles, vehicles) |
| 111 | writeStoredList(STORAGE_KEYS.routes, routes) |
| 116 | writeStoredList(STORAGE_KEYS.transportAssignments, assignments) |

### Functions

- Transport (line 37)
- showToast (line 119)
- handleOpenAddRoute (line 147)
- handleOpenEditRoute (line 154)
- handleSaveRoute (line 168)
- handleDeleteRoute (line 211)
- handleOpenAddVehicle (line 226)
- handleOpenEditVehicle (line 233)
- handleSaveVehicle (line 248)
- handleDeleteVehicle (line 289)
- handleOpenAssign (line 298)
- handleAssignStudent (line 304)
- handleRemoveAssignment (line 334)

## pages/_app.js

28 lines; 0 field definitions; 0 button definitions; 0 dialog/overlay definitions.

Imports: ../styles/globals.css, next/head, react.


### Actions

| Line | Button content | Handler / submit type |
|---|---|---|

### Storage reads and writes

| Line | Call |
|---|---|
| 8 | localStorage.getItem('accentColor') |
| 13 | localStorage.getItem('theme') |

### Functions

- App (line 5)

## pages/_document.js

28 lines; 0 field definitions; 0 button definitions; 0 dialog/overlay definitions.

Imports: next/document.


### Actions

| Line | Button content | Handler / submit type |
|---|---|---|

### Functions

- Document (line 3)

## pages/_error.js

55 lines; 0 field definitions; 1 button definitions; 0 dialog/overlay definitions.

Imports: ../components/Layout.


### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 37 | <i className="fa-solid fa-house"></i> Back to Home | {() => window.location.href = '/'} |

### Functions

- ErrorPage (line 3)

## components/Layout.js

210 lines; 1 field definitions; 3 button definitions; 0 dialog/overlay definitions.

Imports: react, ./Sidebar, next/router, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 139 | select  | (none in adjacent label) | {currentUser} | {(e) => handleUserChange(e.target.value)} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 120 | <i className={'fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}'}></i> | {toggleCollapse} |
| 128 | <i className="fa-solid fa-bars"></i> | {openSidebar} |
| 194 | Switch to Super Admin | {() => { localStorage.setItem('educore.currentUser', 'Super Admin') window.location.reload() }} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 115 | div | {"sb-overlay" + (mobileOpen ? ' active' : '')} | {closeSidebar} | None declared |
| 153 | div | theme-toggle | {toggleTheme} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 139 | <option value="Super Admin">Super Admin (Full Access)</option> {staff.map((s) => ( <option key={s.id} value={String(s.id)}> {s.name} ({s.role}) </option> ))} |

### Storage reads and writes

| Line | Call |
|---|---|
| 37 | localStorage.getItem('theme') |
| 41 | localStorage.getItem('sidebar-collapsed') |
| 45 | localStorage.getItem('accentColor') |
| 51 | readStoredList(STORAGE_KEYS.staff, STAFF) |
| 52 | readStoredList(STORAGE_KEYS.roles, INITIAL_ROLES) |
| 53 | localStorage.getItem('educore.currentUser') |
| 58 | localStorage.setItem('theme', theme) |
| 62 | localStorage.setItem('sidebar-collapsed', !!collapsed) |
| 72 | localStorage.setItem('educore.currentUser', val) |
| 197 | localStorage.setItem('educore.currentUser', 'Super Admin') |

### Functions

- Layout (line 24)
- toggleCollapse (line 65)
- openSidebar (line 66)
- closeSidebar (line 67)
- toggleTheme (line 68)
- handleUserChange (line 70)

## components/RoleDetailModal.js

142 lines; 3 field definitions; 10 button definitions; 0 dialog/overlay definitions.

Imports: react.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 105 | input  | Search modules... | {permSearch} | {e=>setPermSearch(e.target.value)} | None declared | None declared |
| 106 | select  | (none in adjacent label) | {permFilter} | {e=>setPermFilter(e.target.value)} | None declared | None declared |
| 120 | input  | Search staff... | {userSearch} | {e=>setUserSearch(e.target.value)} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 37 | <i className="fa-solid fa-arrow-left"></i> | {onBack} |
| 41 | <i className="fa-solid fa-pen"></i> Edit | {()=>onEdit(role)} |
| 42 | <i className="fa-solid fa-copy"></i> Clone | {()=>onClone(role)} |
| 43 | <i className={'fa-solid ${role.status==='active'?'fa-ban':'fa-check'}'}></i> {role.status==='active'?'Block':'Activate'} | {()=>onToggleStatus(role)} |
| 44 | <i className="fa-solid fa-trash"></i> | {()=>onDelete(role)} |
| 75 | <i className={'fa-solid ${t.icon}'}></i> {t.label} | {()=>setTab(t.key)} |
| 107 | <i className="fa-solid fa-download"></i> Excel | {()=>exportRole('xlsx')} |
| 121 | <i className="fa-solid fa-download"></i> Export | {()=>exportRole('xlsx')} |
| 125 | View | (no explicit handler/type; inspect form context) |
| 125 | Change Role | (no explicit handler/type; inspect form context) |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 106 | <option value="all">All</option> <option value="enabled">Enabled Only</option> |

### Functions

- countModules (line 17)
- countActions (line 18)
- RoleDetail (line 20)
- exportRole (line 28)

## components/RoleFormModal.js

235 lines; 8 field definitions; 14 button definitions; 0 dialog/overlay definitions.

Imports: react.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 71 | input  | Role Name <span className="req">*</span> | {name} | {e=>setName(e.target.value)} | None declared | None declared |
| 72 | select  | User Type <span className="req">*</span> | {type} | {e=>setType(e.target.value)} | None declared | None declared |
| 80 | textarea  | What does this role do? (Max 80 characters) | {description} | {e=>setDescription(e.target.value.slice(0, 80))} | maxLength={80} | None declared |
| 89 | select  | Status | {status} | {e=>setStatus(e.target.value)} | None declared | None declared |
| 114 | input  | Search modules... | {matrixSearch} | {e=>setMatrixSearch(e.target.value)} | None declared | None declared |
| 129 | input checkbox | (none in adjacent label) | {mAllOn} | {()=>toggleModuleAll(mod.key,mod.actions)} | None declared | None declared |
| 130 | input checkbox | (none in adjacent label) | {hasPerm(mod.key,act)} | {()=>togglePerm(mod.key,act)} | None declared | None declared |
| 142 | input checkbox | (none in adjacent label) | {constraints.includes(c.key)} | {()=>toggleConstraint(c.key)} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 45 | <i className="fa-solid fa-arrow-left"></i> | {onCancel} |
| 49 | Cancel | {onCancel} |
| 50 | Next <i className="fa-solid fa-arrow-right"></i> | {()=>setStep(s=>s+1)} |
| 51 | <i className="fa-solid fa-floppy-disk"></i> {isEdit?'Update':'Create'} | {handleSubmit} |
| 58 | <span className="role-step-num">{step>s.n?'✓':s.n}</span> {s.l} | {()=>setStep(s.n)} |
| 98 | <i className="fa-solid fa-file-circle-plus"></i> <span>Start Blank</span> <small>Empty permission set</small> | {()=>{setPermissions({});setStep(3);}} |
| 102 | <div className="role-template-name">{t.name}</div> <div className="role-template-type"><span className={'badge ${t.type==='teaching'?'badge-teal':'badge-purple'}'}>{t.type}</span></div> <div className="role-template-info">{Object.keys(t.permissions).length} modules</div> | {()=>applyTemplate(t)} |
| 106 | <div className="role-template-name">{r.name}</div> <div className="role-template-info">{Object.keys(r.permissions&#124;&#124;{}).length} modules</div> | {()=>{setPermissions({...r.permissions});setConstraints([...(r.constraints&#124;&#124;[])]);setStep(3);}} |
| 125 | {allOn?'Deselect All':'Select All'} | {e=>{e.stopPropagation();toggleGroupAll(group);}} |
| 215 | <i className={'fa-solid ${isEdit ? 'fa-check-circle' : 'fa-plus-circle'}'}></i> {isEdit ? 'Update Role & Permissions' : 'Create Role & Permissions'} | {handleSubmit} |
| 226 | <i className="fa-solid fa-arrow-left"></i> Back | {()=>setStep(s=>s-1)} |
| 228 | Cancel | {onCancel} |
| 229 | Next <i className="fa-solid fa-arrow-right"></i> | {()=>setStep(s=>s+1)} |
| 230 | <i className="fa-solid fa-floppy-disk"></i> {isEdit?'Update Role':'Create Role'} | {handleSubmit} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 121 | div | perm-group-header | {()=>toggleGroup(group)} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 72 | <option value="teaching">Teaching</option> <option value="non-teaching">Non-Teaching</option> |
| 89 | <option value="active">Active</option> <option value="blocked">Blocked</option> |

### Functions

- RoleForm (line 17)
- hasPerm (line 29)
- togglePerm (line 30)
- toggleModuleAll (line 31)
- toggleGroupAll (line 32)
- toggleGroup (line 33)
- toggleConstraint (line 34)
- applyTemplate (line 35)
- countMods (line 36)
- countActs (line 37)
- handleSubmit (line 38)

## components/RolesPage.js

255 lines; 5 field definitions; 22 button definitions; 0 dialog/overlay definitions.

Imports: react, ./Layout, ./RoleFormModal, ./RoleDetailModal, ../lib/academicData.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 174 | input  | Search role name, code... | {search} | {e=>setSearch(e.target.value)} | None declared | None declared |
| 175 | select  | (none in adjacent label) | {filterType} | {e=>setFilterType(e.target.value)} | None declared | None declared |
| 176 | select  | (none in adjacent label) | {filterStatus} | {e=>setFilterStatus(e.target.value)} | None declared | None declared |
| 191 | input checkbox | (none in adjacent label) | {paged.length>0&&selected.length===paged.length} | {toggleSelectAll} | None declared | None declared |
| 202 | input checkbox | (none in adjacent label) | {selected.includes(r.id)} | {()=>toggleSelect(r.id)} | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 158 | <i className="fa-solid fa-file-pdf"></i> PDF | {()=>exportData('pdf')} |
| 159 | <i className="fa-solid fa-file-excel"></i> Excel | {()=>exportData('excel')} |
| 160 | <i className="fa-solid fa-plus"></i> Add Role | {goCreate} |
| 174 | <i className="fa-solid fa-xmark"></i> | {()=>setSearch('')} |
| 177 | <i className="fa-solid fa-rotate-left"></i> Reset | {()=>{setSearch('');setFilterType('all');setFilterStatus('all');}} |
| 179 | <i className="fa-solid fa-table-list"></i> | {()=>setViewMode('table')} |
| 180 | <i className="fa-solid fa-grip"></i> | {()=>setViewMode('card')} |
| 185 | <i className="fa-solid fa-download"></i> Export | {()=>exportData('excel')} |
| 185 | <i className="fa-solid fa-trash"></i> Delete | {bulkDelete} |
| 185 | <i className="fa-solid fa-xmark"></i> Clear | {()=>setSelected([])} |
| 210 | <i className="fa-solid fa-eye"></i> | {()=>goDetail(r)} |
| 211 | <i className="fa-solid fa-pen"></i> | {()=>goEdit(r)} |
| 213 | <i className="fa-solid fa-ellipsis-vertical"></i> | {e=>{e.stopPropagation();setKebabOpen(kebabOpen===r.id?null:r.id);}} |
| 215 | <i className="fa-solid fa-copy"></i> Clone | {()=>{handleClone(r);setKebabOpen(null);}} |
| 216 | <i className={'fa-solid ${r.status==='active'?'fa-ban':'fa-check'}'}></i> {r.status==='active'?'Block':'Activate'} | {()=>{handleToggleStatus(r);setKebabOpen(null);}} |
| 217 | <i className="fa-solid fa-trash"></i> Delete | {()=>{handleDelete(r);setKebabOpen(null);}} |
| 227 | <i className="fa-solid fa-chevron-left"></i> | {()=>setPage(p=>p-1)} |
| 228 | {i+1} | {()=>setPage(i+1)} |
| 229 | <i className="fa-solid fa-chevron-right"></i> | {()=>setPage(p=>p+1)} |
| 244 | <i className="fa-solid fa-pen"></i> | {()=>goEdit(r)} |
| 244 | <i className="fa-solid fa-copy"></i> | {()=>handleClone(r)} |
| 244 | <i className="fa-solid fa-trash"></i> | {()=>handleDelete(r)} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 192 | th | Role Name <SortIcon k="name"/> | {()=>toggleSort('name')} | None declared |
| 193 | th | Type <SortIcon k="type"/> | {()=>toggleSort('type')} | None declared |
| 194 | th | Access <SortIcon k="modules"/> | {()=>toggleSort('modules')} | None declared |
| 195 | th | Users <SortIcon k="users"/> | {()=>toggleSort('users')} | None declared |
| 196 | th | Updated <SortIcon k="updatedAt"/> | {()=>toggleSort('updatedAt')} | None declared |
| 197 | th | Status <SortIcon k="status"/> | {()=>toggleSort('status')} | None declared |
| 214 | div | kebab-menu | {e=>e.stopPropagation()} | None declared |
| 239 | div | role-card | {()=>goDetail(r)} | None declared |
| 244 | div | roles-actions | {e=>e.stopPropagation()} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 175 | <option value="all">All Types</option> <option value="teaching">Teaching</option> <option value="non-teaching">Non-Teaching</option> |
| 176 | <option value="all">All Status</option> <option value="active">Active</option> <option value="blocked">Blocked</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 31 | readStoredList(STORAGE_KEYS.roles, INITIAL_ROLES) |
| 32 | readStoredList(STORAGE_KEYS.staff, []) |
| 37 | writeStoredList(STORAGE_KEYS.roles, roles) |

### Functions

- countModules (line 17)
- countActions (line 18)
- RolesPage (line 20)
- showToast (line 56)
- goList (line 59)
- goCreate (line 60)
- goEdit (line 61)
- goDetail (line 62)
- c (line 87)
- toggleSort (line 96)
- SortIcon (line 97)
- handleSave (line 100)
- handleDelete (line 111)
- handleToggleStatus (line 117)
- handleClone (line 122)
- toggleSelect (line 126)
- toggleSelectAll (line 127)
- bulkDelete (line 128)
- exportData (line 134)

## components/SettingsTabs.js

302 lines; 13 field definitions; 6 button definitions; 0 dialog/overlay definitions.

Imports: react.

| Line | Control | Label/context | Value / default | Change handler | Constraints | Accessible name wiring |
|---|---|---|---|---|---|---|
| 135 | input  | School Name <span className="req">*</span> | Sunrise Public School | — | None declared | None declared |
| 139 | input  | School Code <span className="req">*</span> | SPS-DEL-01 | — | None declared | None declared |
| 143 | select  | Board <span className="req">*</span> | {board} | {e=>setBoard(e.target.value)} | None declared | id=boardSelect |
| 164 | input  | Specify Board Name <span className="req">*</span> | {otherBoard} | {e=>setOtherBoard(e.target.value)} | None declared | id=otherBoardInput |
| 170 | select  | Active Academic Year <span className="req">*</span> | {academicYear} | {e=>handleAcademicYearChange(e.target.value)} | None declared | id=academicYearSelect |
| 182 | input  | Add Academic Year | {newYearInput} | {e=>setNewYearInput(e.target.value)} | None declared | None declared |
| 238 | input  | Primary Phone <span className="req">*</span> | +91 98765 43210 | — | None declared | None declared |
| 239 | input  | Email <span className="req">*</span> | info@sunrisepublic.edu | — | None declared | None declared |
| 243 | input  | Facebook | facebook.com/sunrisepublic | — | None declared | None declared |
| 244 | input  | Instagram | instagram.com/sunrisepublic | — | None declared | None declared |
| 270 | select  | Base Currency <span className="req">*</span> | — | — | None declared | None declared |
| 271 | input  | Currency Symbol | ₹ | — | None declared | None declared |
| 284 | input  | Registration Number <span className="req">*</span> | REG/2020/12345 | — | None declared | None declared |

### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 123 | {t==='general'?'📋 General':t==='branding'?'🎨 Branding':t==='contact'?'📞 Contact':t==='finance'?'💰 Finance':'⚖️ Compliance'} | {()=>setActive(t)} |
| 173 | <i className={'fa-solid ${showAddYearForm ? 'fa-xmark' : 'fa-plus'}'}></i> | {()=>setShowAddYearForm(!showAddYearForm)} |
| 189 | Add Session | {handleAddAcademicYear} |
| 190 | Cancel | {()=>{setShowAddYearForm(false); setNewYearInput('');}} |
| 285 | <i className="fa-solid fa-pen"></i> | (no explicit handler/type; inspect form context) |
| 291 | <i className="fa-solid fa-download"></i> | (no explicit handler/type; inspect form context) |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 226 | div | {"swatch" + (s===activeSwatch? ' active':'')} | {() => { setActiveSwatch(s); localStorage.setItem('accentColor', s) }} | None declared |
| 257 | div | {"toggle-switch" + (v? ' active':'')} | {()=>setToggles(t=>({...t,[k]:!t[k]}))} | None declared |

### Select options

| Line | Declared options / dynamic source |
|---|---|
| 143 | <optgroup label="National Boards"> <option value="cbse">CBSE</option> <option value="cisce">CISCE</option> <option value="nios">NIOS</option> </optgroup> <optgroup label="State Boards"> <option value="state">State Board</option> </optgroup> <optgroup label="International Boards"> <option value="ib">International Boards</option> </optgroup> <option value="neb">NEB</option> <option value="deo">District Education Office</option> <option value="internal">Internal (Schools)</option> <option value="other">Other</option> |
| 170 | {academicYears.map(y=><option key={y} value={y}>{y}</option>)} |
| 270 | <option>Indian Rupee (INR) — ₹</option> |

### Storage reads and writes

| Line | Call |
|---|---|
| 41 | localStorage.getItem('academicYears') |
| 49 | localStorage.getItem('academicYear') |
| 55 | localStorage.getItem('academicYear') |
| 57 | localStorage.getItem('academicYears') |
| 68 | localStorage.getItem('accentColor') |
| 93 | localStorage.setItem('academicYear', val) |
| 112 | localStorage.setItem('academicYears', JSON.stringify(updated)) |
| 226 | localStorage.setItem('accentColor', s) |

### Functions

- Toasts (line 3)
- SettingsTabs (line 22)
- handleExternalChange (line 54)
- showToast (line 84)
- removeToast (line 89)
- handleAcademicYearChange (line 91)
- handleAddAcademicYear (line 97)

## components/Sidebar.js

271 lines; 0 field definitions; 1 button definitions; 0 dialog/overlay definitions.

Imports: react, next/link, next/router.


### Actions

| Line | Button content | Handler / submit type |
|---|---|---|
| 234 | <i className="fa-solid fa-right-from-bracket"></i> | {() => { localStorage.setItem('educore.currentUser', 'Super Admin'); window.location.reload(); }} |

### Other click targets

Includes cards, overlays, tab-like divs, labels and links. Long nested content is abbreviated here; handlers are preserved.

| Line | Element | Content / class | Handler | Keyboard wiring |
|---|---|---|---|---|
| 180 | div | {"sb-item" + (isActivePage(k) ? ' active' : '')} | {() => clickItem(k)} | None declared |

### Storage reads and writes

| Line | Call |
|---|---|
| 18 | localStorage.getItem('educore.currentUser') |
| 21 | localStorage.getItem('educore.staff') |
| 23 | localStorage.getItem('educore.roles') |
| 235 | localStorage.setItem('educore.currentUser', 'Super Admin') |

### Functions

- Sidebar (line 5)
- isItemPermitted (line 52)
- onDown (line 113)
- onMove (line 119)
- onUp (line 127)
- clickItem (line 150)
- isActivePage (line 158)
- handleMouseEnter (line 163)
- handleMouseLeave (line 173)
- renderItem (line 178)

## lib/academicData.js

1092 lines; 0 field definitions; 0 button definitions; 0 dialog/overlay definitions.

Imports: None.


### Actions

| Line | Button content | Handler / submit type |
|---|---|---|

### Storage reads and writes

| Line | Call |
|---|---|
| 766 | window.localStorage.getItem(key) |
| 779 | window.localStorage.setItem(key, JSON.stringify(value)) |

### Functions

- readStoredList (line 763)
- writeStoredList (line 777)
- makeId (line 782)
- makeSubjectCode (line 786)
- makeAdmissionNo (line 799)
- numberToWords (line 804)
- convertLessThanThousand (line 814)

## lib/exportUtils.js

134 lines; 0 field definitions; 0 button definitions; 0 dialog/overlay definitions.

Imports: None.


### Actions

| Line | Button content | Handler / submit type |
|---|---|---|

### Functions

- exportToCSV (line 1)
- printToPDF (line 26)
