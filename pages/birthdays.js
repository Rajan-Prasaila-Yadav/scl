import { writeValue } from '../lib/storage'
import { getRaw } from '../lib/storage'
import Dialog from '../components/Dialog'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  INITIAL_STUDENTS,
  INITIAL_STAFF,
  INITIAL_CLASSES,
  readStoredList,
} from '../lib/academicData'

// Helpers
const calculateAge = (dobString) => {
  if (!dobString) return '—'
  const parts = dobString.split('-')
  if (parts.length < 3) return '—'
  const birthYear = parseInt(parts[0], 10)
  const currentYear = new Date().getFullYear()
  return currentYear - birthYear
}

const getBirthdayCountdown = (dobString) => {
  if (!dobString) return null
  const parts = dobString.split('-')
  if (parts.length < 3) return null
  
  const birthMonth = parseInt(parts[1], 10) - 1 // 0-11
  const birthDay = parseInt(parts[2], 10)
  
  const today = new Date()
  const currentYear = today.getFullYear()
  
  // Set up birthday for this year
  let nextBday = new Date(currentYear, birthMonth, birthDay)
  
  // If birthday already passed this year, set it for next year
  const todayZeroHours = new Date(currentYear, today.getMonth(), today.getDate())
  if (nextBday < todayZeroHours) {
    nextBday.setFullYear(currentYear + 1)
  }
  
  const diffTime = nextBday.getTime() - todayZeroHours.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (today.getMonth() === birthMonth && today.getDate() === birthDay) {
    return 0 // Today
  }
  return diffDays
}

const formatBirthdayDate = (dobString) => {
  if (!dobString) return '—'
  const parts = dobString.split('-')
  if (parts.length < 3) return dobString
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  return `${monthNames[m]} ${d}`
}

const getClassName = (classId, classesList) => {
  const cls = classesList.find((c) => String(c.id) === String(classId))
  if (!cls) return 'Unassigned'
  return `${cls.name}${cls.section ? ` - ${cls.section}` : ''}`
}

export default function Birthdays() {
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [classes, setClasses] = useState([])
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [currentUserObj, setCurrentUserObj] = useState(null)
  
  // States
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all') // 'all' | 'today' | 'upcoming'
  const [demoMode, setDemoMode] = useState(true) // Enabled by default for rich testing
  const [toast, setToast] = useState(null)

  // Wish Modal States
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [activeTemplate, setActiveTemplate] = useState('custom')
  const [wishMessage, setWishMessage] = useState('')

  useEffect(() => {
    setStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setStaff(readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF))
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    
    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)
  }, [])

  useEffect(() => {
    if (currentUser !== 'Super Admin' && staff.length > 0) {
      const match = staff.find(s => String(s.id) === String(currentUser))
      setCurrentUserObj(match || null)
    } else {
      setCurrentUserObj(null)
    }
  }, [currentUser, staff])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Demo Birthday Mappings
  const processedStudents = useMemo(() => {
    return students.map(s => {
      if (demoMode && s.id === 1 && s.dob) { // Aarav Mehta
        const today = new Date()
        const yyyy = s.dob.split('-')[0]
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        return { ...s, dob: `${yyyy}-${mm}-${dd}` }
      }
      return s
    })
  }, [students, demoMode])

  const processedStaff = useMemo(() => {
    return staff.map(st => {
      if (demoMode && st.id === 1 && st.dob) { // Rakesh Sharma
        const today = new Date()
        const yyyy = st.dob.split('-')[0]
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        return { ...st, dob: `${yyyy}-${mm}-${dd}` }
      }
      if (demoMode && currentUserObj && String(st.id) === String(currentUserObj.id) && st.dob) {
        const today = new Date()
        const yyyy = st.dob.split('-')[0]
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        return { ...st, dob: `${yyyy}-${mm}-${dd}` }
      }
      return st
    })
  }, [staff, demoMode, currentUserObj])

  // Combined Birthdays
  const allBirthdays = useMemo(() => {
    const list = []
    
    // Students
    processedStudents.forEach(s => {
      const countdown = getBirthdayCountdown(s.dob)
      list.push({
        id: s.id,
        uid: `student-${s.id}`,
        name: s.name,
        code: s.admissionNo || `ADM-${s.id}`,
        dob: s.dob,
        role: 'Student',
        gender: s.gender,
        info: s.classId ? getClassName(s.classId, classes) : 'No Class',
        countdown,
        age: calculateAge(s.dob)
      })
    })

    // Staff
    processedStaff.forEach(st => {
      const countdown = getBirthdayCountdown(st.dob)
      const isCurrentUser = currentUserObj && String(st.id) === String(currentUserObj.id)
      list.push({
        id: st.id,
        uid: `staff-${st.id}`,
        name: st.name,
        code: st.employeeId || `EMP-${st.id}`,
        dob: st.dob,
        role: isCurrentUser ? 'Logged-in User (Staff)' : 'Staff',
        gender: 'Staff',
        info: st.department || st.role || 'Academic',
        countdown,
        age: calculateAge(st.dob)
      })
    })

    // Super Admin
    if (currentUser === 'Super Admin') {
      const superAdminDob = demoMode ? (() => {
        const today = new Date()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        return `1980-${mm}-${dd}`
      })() : '1980-01-01'
      
      const countdown = getBirthdayCountdown(superAdminDob)
      list.push({
        id: 0,
        uid: 'super-admin',
        name: 'Super Admin',
        code: 'ADMIN-01',
        dob: superAdminDob,
        role: 'Logged-in User (Admin)',
        gender: 'Admin',
        info: 'System Admin',
        countdown,
        age: calculateAge(superAdminDob)
      })
    }

    return list.sort((a, b) => a.countdown - b.countdown)
  }, [processedStudents, processedStaff, classes, currentUser, currentUserObj, demoMode])

  // Today
  const todaysBirthdays = useMemo(() => {
    return allBirthdays.filter(b => b.countdown === 0)
  }, [allBirthdays])

  // Filtered List
  const filteredBirthdays = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allBirthdays.filter(b => {
      if (query) {
        const matchName = b.name.toLowerCase().includes(query)
        const matchCode = b.code.toLowerCase().includes(query)
        const matchInfo = b.info.toLowerCase().includes(query)
        if (!matchName && !matchCode && !matchInfo) return false
      }

      if (roleFilter !== 'all') {
        if (roleFilter === 'students' && b.role !== 'Student') return false
        if (roleFilter === 'staff' && b.role !== 'Staff') return false
        if (roleFilter === 'user' && !b.role.includes('Logged-in')) return false
      }

      if (monthFilter !== 'all') {
        if (!b.dob) return false
        const m = parseInt(b.dob.split('-')[1], 10)
        if (String(m) !== String(monthFilter)) return false
      }

      if (dateFilter !== 'all') {
        if (dateFilter === 'today' && b.countdown !== 0) return false
        if (dateFilter === 'upcoming' && (b.countdown <= 0 || b.countdown > 30)) return false
      }

      return true
    })
  }, [allBirthdays, search, roleFilter, monthFilter, dateFilter])

  // Templates
  const getTemplates = (person) => {
    if (!person) return []
    if (person.role === 'Student') {
      return [
        { id: 'stud_classic', label: 'Classic Fun Birthday', text: `Wishing you a fantastic birthday, ${person.name}! May your day be filled with laughter, fun, and lots of cake! 🎉🎂` },
        { id: 'stud_academic', label: 'Inspirational & Academic Success', text: `Happy Birthday, ${person.name}! Keep aiming high, studying hard, and shining bright in ${person.info}. Have a great year ahead! 🌟📚` },
        { id: 'stud_future', label: 'Bright Future Wishes', text: `Wishing a very Happy Birthday to ${person.name}! May this year bring you closer to all your dreams and academic goals! 🚀🎓` }
      ]
    } else if (person.role.includes('Logged-in')) {
      return [
        { id: 'user_appr', label: 'Admin Appreciation', text: `Happy Birthday to you, ${person.name}! Thank you for keeping our campus running smoothly and guiding EduCore every day. Have a wonderful celebration! 🎂✨` }
      ]
    } else {
      return [
        { id: 'staff_appr', label: 'Dedication & Professional Appreciation', text: `Happy Birthday, ${person.name}! We are incredibly grateful for your professional dedication and the wonderful guidance you provide to our school in the ${person.info} division. 🍎💼` },
        { id: 'staff_mentor', label: 'Inspiring Mentor', text: `Wishing a wonderful birthday to our inspiring teacher and mentor, ${person.name}! Thank you for making learning so engaging and supportive for all of us. 🎂📖` },
        { id: 'staff_general', label: 'General Wishes', text: `Happy Birthday, ${person.name}! Wishing you good health, happiness, and a successful year ahead from the entire EduCore management team. 🎁🎉` }
      ]
    }
  }

  const handleOpenWish = (person) => {
    setSelectedPerson(person)
    const tmpl = getTemplates(person)
    if (tmpl.length > 0) {
      setActiveTemplate(tmpl[0].id)
      setWishMessage(tmpl[0].text)
    } else {
      setActiveTemplate('custom')
      setWishMessage(`Happy Birthday, ${person.name}!`)
    }
  }

  const handleTemplateChange = (tmplId) => {
    setActiveTemplate(tmplId)
    if (tmplId === 'custom') {
      setWishMessage('')
      return
    }
    const tmpl = getTemplates(selectedPerson).find(t => t.id === tmplId)
    if (tmpl) setWishMessage(tmpl.text)
  }

  const sendCustomWish = (e) => {
    e.preventDefault()
    if (!wishMessage.trim()) {
      showToast('Please type a message before sending', 'error')
      return
    }
    const drafts = readStoredList('educore.wishDrafts', [])
    if (!writeValue('educore.wishDrafts', [...drafts, {person:selectedPerson.uid, name:selectedPerson.name, message:wishMessage, createdAt:new Date().toISOString()}])) return
    showToast(`Draft saved for ${selectedPerson.name}. Messaging delivery is not connected.`, 'success')
    setSelectedPerson(null)
  }

  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>Celebration Hub</h1>
          <p>View upcoming birthdays, select customizable card message templates, and send warm wishes.</p>
        </div>
        <div className="settings-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
            <input 
              type="checkbox" 
              id="demoModeCelebrations" 
              checked={demoMode} 
              onChange={(e) => {
                setDemoMode(e.target.checked)
                showToast(e.target.checked ? "Birthday Simulation Active" : "Showing real registry dates", "info")
              }}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="demoModeCelebrations" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--t2)', margin: 0 }}>
              Demo Birthday Simulation
            </label>
          </div>
        </div>
      </div>

      {/* TODAY'S BANNER */}
      {todaysBirthdays.length > 0 && (
        <div className="birthday-greeting-card">
          <div className="birthday-greeting-info">
            <div className="birthday-greeting-icon">🎉</div>
            <div>
              <div className="birthday-greeting-title">Happy Birthday Celebrations! 🎂</div>
              <div className="birthday-greeting-desc">
                Today we celebrate the birthdays of the following members:
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {todaysBirthdays.map(b => (
                    <span role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} 
                      key={b.uid} 
                      onClick={() => handleOpenWish(b)}
                      style={{ background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      title="Click to write a customized wish card"
                    >
                      <i className="fa-solid fa-cake-candles" style={{ color: '#FFD700' }}></i>
                      {b.name} ({b.role.includes('Logged') ? 'You' : b.role}) - Save Wish Draft
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE/GRID DIRECTORY */}
      <div className="roles-table-card academic-list-card" style={{ width: '100%' }}>
        <div className="roles-toolbar academic-toolbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '16px 24px' }}>
          <div className="roles-search" style={{ gridColumn: 'span 2', minWidth: '220px', width: '100%', margin: 0 }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input aria-label="Search by name, student roll, employee ID..."
              placeholder="Search by name, student roll, employee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
            {search && (
              <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <select aria-label="Role Filter" className="roles-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ margin: 0, width: '100%' }}>
            <option value="all">All Roles</option>
            <option value="students">Students</option>
            <option value="staff">Staff / Employees</option>
            <option value="user">Logged-in User</option>
          </select>

          <select aria-label="Month Filter" className="roles-filter" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ margin: 0, width: '100%' }}>
            <option value="all">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          <select aria-label="Date Filter" className="roles-filter" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ margin: 0, width: '100%' }}>
            <option value="all">All Days</option>
            <option value="today">Today's Birthdays</option>
            <option value="upcoming">Upcoming (Next 30 Days)</option>
          </select>
        </div>

        <div style={{ padding: '0 24px 24px 24px' }}>
          {filteredBirthdays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--t3)' }}>
              <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
              No matching birthday records found.
            </div>
          ) : (
            <div className="birthday-grid">
              {filteredBirthdays.map((b) => {
                const isToday = b.countdown === 0
                const isUpcoming = b.countdown > 0 && b.countdown <= 30
                
                let avBg = 'var(--bluebg)'
                let avColor = 'var(--blue)'
                if (b.gender === 'Female') {
                  avBg = 'var(--purplebg)'
                  avColor = 'var(--purple)'
                } else if (b.role.includes('Staff')) {
                  avBg = 'var(--greenbg)'
                  avColor = 'var(--green)'
                } else if (b.role.includes('User')) {
                  avBg = 'var(--amberbg)'
                  avColor = 'var(--amber)'
                }

                return (
                  <div key={b.uid} className="birthday-card" style={isToday ? { borderColor: 'var(--purple)', boxShadow: '0 0 12px var(--purplebg)' } : {}}>
                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                      <div className="birthday-card-avatar" style={{ backgroundColor: avBg, color: avColor }}>
                        {b.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="birthday-card-content">
                        <div className="birthday-card-name">{b.name}</div>
                        <div className="birthday-card-role">
                          <span style={{ fontWeight: 700 }}>{b.code}</span> • {b.role}
                        </div>
                        <div className="birthday-card-dob">
                          DOB: {formatBirthdayDate(b.dob)} ({b.age} yrs)
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {isToday ? (
                        <span className="birthday-card-badge" style={{ backgroundColor: 'var(--greenbg)', color: 'var(--green)' }}>
                          Today! 🎂
                        </span>
                      ) : isUpcoming ? (
                        <span className="birthday-card-badge" style={{ backgroundColor: 'var(--bluebg)', color: 'var(--blue)' }}>
                          In {b.countdown}d
                        </span>
                      ) : (
                        <span className="birthday-card-badge" style={{ backgroundColor: 'var(--bg3)', color: 'var(--t3)' }}>
                          {b.countdown}d
                        </span>
                      )}

                      <button 
                        className="btn btn-ghost btn-xs"
                        style={{ padding: '4px 8px', height: '24px', fontSize: '10px', gap: '4px' }}
                        onClick={() => handleOpenWish(b)}
                      >
                        <i className="fa-solid fa-pen-fancy"></i> Custom Wish
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* CUSTOM WISH MODAL */}
      {selectedPerson && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-paper-plane" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  Draft Birthday Wish
                </h3>
                <p className="modal-sub">To: {selectedPerson.name} ({selectedPerson.role})</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setSelectedPerson(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form onSubmit={sendCustomWish}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Select Wish Template Message</label>
                  <select aria-label="Select Wish Template Message" 
                    className="form-select" 
                    value={activeTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                  >
                    {getTemplates(selectedPerson).map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                    <option value="custom">-- Custom Message (Blank) --</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Message Content</label>
                  <textarea aria-label="Message Content" 
                    className="form-input" 
                    rows={4} 
                    value={wishMessage} 
                    onChange={(e) => setWishMessage(e.target.value)}
                    placeholder="Type your personalized birthday wish here..."
                    style={{ resize: 'vertical', minHeight: '80px', textTransform: 'none' }}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setSelectedPerson(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-paper-plane"></i> Save Wish Draft
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast-stack">
          <div className={`toast success`}>
            <span>🎉</span>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}
    </Layout>
  )
}
