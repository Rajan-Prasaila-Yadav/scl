import { getRaw } from '../lib/storage'
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

export default function Home() {
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [classes, setClasses] = useState([])
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [currentUserObj, setCurrentUserObj] = useState(null)
  
  // States
  const [demoMode, setDemoMode] = useState(true) // Enabled by default for rich testing!
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setStudents(readStoredList(STORAGE_KEYS.students, INITIAL_STUDENTS))
    setStaff(readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF))
    setClasses(readStoredList(STORAGE_KEYS.classes, INITIAL_CLASSES))
    
    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)
  }, [])

  // Identify matching user object for staff logins
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
    setTimeout(() => setToast(null), 3000)
  }

  // Demo mode adjustments: Aarav Mehta (id:1) and Rakesh Sharma (id:1) birthday is TODAY.
  const processedStudents = useMemo(() => {
    return students.map(s => {
      if (demoMode && s.id === 1 && s.dob) {
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
      if (demoMode && st.id === 1 && st.dob) {
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

  // Combine into single birthdays list
  const allBirthdays = useMemo(() => {
    const list = []
    
    // Add students
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
        countdown,
        age: calculateAge(s.dob)
      })
    })

    // Add staff
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
        countdown,
        age: calculateAge(superAdminDob)
      })
    }

    return list.sort((a, b) => a.countdown - b.countdown)
  }, [processedStudents, processedStaff, currentUser, currentUserObj, demoMode])

  // Today's birthdays
  const todaysBirthdays = useMemo(() => {
    return allBirthdays.filter(b => b.countdown === 0)
  }, [allBirthdays])

  // Count upcoming this month
  const thisMonthCount = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1
    return allBirthdays.filter(b => {
      if (!b.dob) return false
      const parts = b.dob.split('-')
      return parts.length >= 2 && parseInt(parts[1], 10) === currentMonth
    }).length
  }, [allBirthdays])

  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>Dashboard</h1>
          <p>Real-time analytics, registry summaries, and birthday celebration announcements.</p>
        </div>
        <div className="settings-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
            <input 
              type="checkbox" 
              id="demoModeToggle" 
              checked={demoMode} 
              onChange={(e) => {
                setDemoMode(e.target.checked)
                showToast(e.target.checked ? "Demo Birthday Simulation Enabled" : "Simulation Disabled - Showing Real Dates", "info")
              }}
              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
            />
            <label htmlFor="demoModeToggle" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', color: 'var(--t2)', margin: 0 }}>
              Simulate Birthday (Demo Mode)
            </label>
          </div>
        </div>
      </div>

      {/* QUICK METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--bluebg)', color: 'var(--blue)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-user-graduate"></i>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)' }}>{students.length}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Total Students</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--greenbg)', color: 'var(--green)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-chalkboard-user"></i>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)' }}>{staff.length}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Total Staff</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--amberbg)', color: 'var(--amber)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-school"></i>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)' }}>{classes.length}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Active Classes</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'var(--purplebg)', color: 'var(--purple)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
            <i className="fa-solid fa-cake-candles"></i>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)' }}>{thisMonthCount}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase' }}>Birthdays This Month</div>
          </div>
        </div>
      </div>

      {/* TODAY'S BIRTHDAY CELEBRATIONS */}
      <div className="roles-table-card academic-list-card" style={{ width: '100%', marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--purplebg)', color: 'var(--purple)', display: 'grid', placeItems: 'center', fontSize: '24px' }}>
              <i className="fa-solid fa-cake-candles"></i>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--t1)' }}>
                Today's Birthday Celebrants
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--t3)', marginTop: '4px' }}>
                {todaysBirthdays.length === 0 
                  ? "There are no student or staff birthdays registered for today."
                  : `We have ${todaysBirthdays.length} student(s) and staff celebrating today!`
                }
              </p>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/birthdays'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fa-solid fa-cake-candles"></i> Go to Celebrations Hub
          </button>
        </div>

        {todaysBirthdays.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            {todaysBirthdays.map(b => (
              <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} 
                key={b.uid} 
                onClick={() => window.location.href = '/birthdays'}
                style={{ 
                  background: 'var(--bg3)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '10px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--purple)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: b.gender === 'Female' ? 'var(--purplebg)' : 'var(--bluebg)', color: b.gender === 'Female' ? 'var(--purple)' : 'var(--blue)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                  {b.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--t1)' }}>{b.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--t3)' }}>{b.code} • {b.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOAST SYSTEM */}
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
