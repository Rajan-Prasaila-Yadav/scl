import { getRaw, setRaw } from '../lib/storage'
import React, { useEffect, useState, useMemo } from 'react'
import Sidebar from './Sidebar'
import { useRouter } from 'next/router'
import { STORAGE_KEYS, readStoredList, INITIAL_ROLES, STAFF } from '../lib/academicData'

const pathPermissionMap = {
  '/students': 'Students',
  '/parents': 'Parents',
  '/staff': 'Staff',
  '/classes': 'Classes',
  '/subjects': 'Subjects',
  '/timetable': 'Timetable',
  '/examinations': 'Examinations',
  '/exam-routine': 'Examinations',
  '/attendance': 'Attendance',
  '/library': 'Library',
  '/transport': 'Transport',
  '/fees': 'Fees',
  '/salary': 'Fees',
  '/finance': 'Fees',
  '/timeline': 'Announcements',
  '/birthdays': 'Students',
  '/roles': 'Roles',
  '/settings': 'Settings',
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [sidebarWidth, setSidebarWidth] = useState(256)
  
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])
  const [currentUser, setCurrentUser] = useState('Super Admin')
  
  const router = useRouter()

  useEffect(() => {
    const savedTheme = (typeof window !== 'undefined' && getRaw('theme')) || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    const savedCollapsed = (typeof window !== 'undefined' && getRaw('sidebar-collapsed')) === 'true'
    setCollapsed(savedCollapsed)

    // Apply saved accent color globally
    const savedAccent = typeof window !== 'undefined' && getRaw('accentColor')
    if (savedAccent) {
      document.documentElement.style.setProperty('--accent', savedAccent)
      document.documentElement.style.setProperty('--accent2', savedAccent + 'CC')
    }

    setStaff(readStoredList(STORAGE_KEYS.staff, STAFF))
    setRoles(readStoredList(STORAGE_KEYS.roles, INITIAL_ROLES))
    setCurrentUser(getRaw('educore.currentUser') || 'Super Admin')
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setRaw('theme', theme)
  }, [theme])

  useEffect(() => {
    setRaw('sidebar-collapsed', !!collapsed)
  }, [collapsed])

  function toggleCollapse() { setCollapsed(c => !c) }
  function openSidebar() { setMobileOpen(true) }
  function closeSidebar() { setMobileOpen(false) }
  function toggleTheme() { setTheme(t => t === 'dark' ? 'light' : 'dark') }

  const handleUserChange = (val) => {
    setCurrentUser(val)
    setRaw('educore.currentUser', val)
    window.location.reload()
  }

  const activeStaff = staff.find(s => String(s.id) === currentUser)
  const activeRole = activeStaff ? roles.find(r => r.name === activeStaff.role) : null

  const requiredModule = pathPermissionMap[router.pathname]
  const isAllowed = useMemo(() => {
    if (!requiredModule) return true
    if (currentUser === 'Super Admin') return true
    if (!activeRole || activeRole.status !== 'active') return false
    return (activeRole.permissions?.[requiredModule] || []).includes('view')
  }, [currentUser, activeRole, requiredModule])

  // update page title from route
  useEffect(() => {
    const map = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/students': 'Students',
      '/staff': 'Staff',
      '/parents': 'Parents',
      '/classes': 'Classes',
      '/subjects': 'Subjects',
      '/timetable': 'Timetable',
      '/examinations': 'Examinations & Report Cards',
      '/exam-routine': 'Exam Routines & Admit Cards',
      '/attendance': 'Attendance Management',
      '/library': 'Library & Books Catalog',
      '/transport': 'Transport & Bus Routes',
      '/fees': 'Fee Management',
      '/salary': 'Payroll',
      '/finance': 'Finance',
      '/timeline': 'Timeline',
      '/birthdays': 'Birthdays',
      '/roles': 'Roles & Permissions',
      '/settings': 'Settings'
    }
    const title = map[router.pathname] || 'Settings'
    const el = document.getElementById('pageTitle')
    if (el) el.textContent = title
  }, [router.pathname])

  return (
    <div className="app">
      <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={"sb-overlay" + (mobileOpen ? ' active' : '')} id="sbOverlay" onClick={closeSidebar}></div>
      <Sidebar collapsed={collapsed} onToggle={toggleCollapse} mobileOpen={mobileOpen} onClose={closeSidebar} onWidthChange={setSidebarWidth} />
      <div className="main" style={{ marginLeft: collapsed ? '68px' : sidebarWidth + 'px' }}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-sidebar-toggle"
              onClick={toggleCollapse}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
            </button>
            <button aria-label="Open navigation" className="mob-menu-btn" onClick={openSidebar}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div>
              <div className="topbar-title" id="pageTitle">Settings</div>
              <div className="topbar-breadcrumb">Workspace / <span>{router.pathname === '/' ? 'Dashboard' : router.pathname.slice(1).replaceAll('-', ' ')}</span></div>
            </div>
          </div>
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Role preview:</span>
              <select
                aria-label="Preview as role" className="form-select"
                style={{ width: '200px', padding: '4px 8px', fontSize: '11px', background: 'var(--bg)', borderColor: 'var(--border)' }}
                value={currentUser}
                onChange={(e) => handleUserChange(e.target.value)}
              >
                <option value="Super Admin">Super Admin (Full Access)</option>
                {staff.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="theme-toggle" id="themeToggle" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle color theme">
              <div className="theme-knob" id="themeKnob">{theme === 'dark' ? '🌙' : '☀️'}</div>
            </button>
          </div>
        </header>

        <div className="content" id="mainContent">
          {isAllowed ? children : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '380px',
              textAlign: 'center',
              padding: '40px',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              maxWidth: '500px',
              margin: '60px auto',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'var(--redbg)',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                marginBottom: '20px'
              }}>
                <i className="fa-solid fa-lock"></i>
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--t1)', marginBottom: '10px', marginTop: 0 }}>Access Denied</h2>
              <p style={{ fontSize: '13px', color: 'var(--t2)', lineHeight: 1.5, marginBottom: '24px' }}>
                Your current role (<strong>{activeRole?.name || 'Guest'}</strong>) does not have the required permissions to view the <strong>{requiredModule}</strong> module.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setRaw('educore.currentUser', 'Super Admin')
                  window.location.reload()
                }}
              >
                Switch to Super Admin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
