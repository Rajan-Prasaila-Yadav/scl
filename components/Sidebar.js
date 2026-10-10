import { getRaw, setRaw } from '../lib/storage'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Sidebar({ collapsed, onToggle, mobileOpen, onClose, onWidthChange }) {
  const router = useRouter()
  const sidebarRef = useRef(null)
  const resizerRef = useRef(null)
  const [width, setWidth] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState(null)
  
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [staff, setStaff] = useState([])
  const [roles, setRoles] = useState([])

  useEffect(() => {
    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)
    try {
      const storedStaff = getRaw('educore.staff')
      if (storedStaff) setStaff(JSON.parse(storedStaff))
      const storedRoles = getRaw('educore.roles')
      if (storedRoles) setRoles(JSON.parse(storedRoles))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const activeStaff = staff.find(s => String(s.id) === currentUser)
  const activeRole = activeStaff ? roles.find(r => r.name === activeStaff.role) : null

  const pathPermissionMap = {
    'birthdays': 'Students',
    'timeline': 'Announcements',
    'students': 'Students',
    'parents': 'Parents',
    'staff': 'Staff',
    'classes': 'Classes',
    'subjects': 'Subjects',
    'timetable': 'Timetable',
    'examinations': 'Examinations',
    'exam-routine': 'Examinations',
    'attendance': 'Attendance',
    'library': 'Library',
    'transport': 'Transport',
    'fees': 'Fees',
    'salary': 'Fees',
    'finance': 'Fees',
    'roles': 'Roles',
    'settings': 'Settings',
  }

  const isItemPermitted = (k) => {
    if (k === 'dashboard') return true

    if (currentUser === 'Super Admin') return true
    const requiredModule = pathPermissionMap[k]
    if (!requiredModule) return true
    if (!activeRole || activeRole.status !== 'active') return false
    return (activeRole.permissions?.[requiredModule] || []).includes('view')
  }

  const items = [
    ['dashboard', 'Dashboard', 'fa-house'],
    ['birthdays', 'Celebrations', 'fa-cake-candles'],
    ['timeline', 'Events Feed', 'fa-timeline'],
    ['students', 'Students', 'fa-user-graduate'],
    ['staff', 'Staff', 'fa-chalkboard-user'],
    ['parents', 'Parents', 'fa-people-roof'],
    ['classes', 'Classes', 'fa-school'],
    ['subjects', 'Subjects', 'fa-book'],
    ['timetable', 'Timetable', 'fa-calendar-days'],
    ['examinations', 'Examinations', 'fa-square-poll-horizontal'],
    ['exam-routine', 'Exam Routines', 'fa-calendar-check'],
    ['attendance', 'Attendance', 'fa-clipboard-user'],
    ['library', 'Library Catalog', 'fa-book-open'],
    ['transport', 'Transport Routes', 'fa-bus'],
    ['fees', 'Fee Management', 'fa-money-bill-wave'],
    ['salary', 'Payroll', 'fa-wallet'],
    ['finance', 'Finance & Audit', 'fa-scale-balanced'],
    ['roles', 'Roles & Permissions', 'fa-shield-halved'],
    ['settings', 'Settings', 'fa-gear']
  ]

  useEffect(() => {
    if (!sidebarRef.current) return

    if (collapsed) {
      sidebarRef.current.style.width = 'var(--sidebar-collapsed)'
      sidebarRef.current.style.minWidth = 'var(--sidebar-collapsed)'
      return
    }

    if (width) {
      sidebarRef.current.style.width = width + 'px'
      sidebarRef.current.style.minWidth = width + 'px'
    } else {
      sidebarRef.current.style.width = ''
      sidebarRef.current.style.minWidth = ''
    }
  }, [width, collapsed])

  useEffect(() => {
    if (typeof onWidthChange === 'function') {
      onWidthChange(width || 256)
    }
  }, [width, onWidthChange])

  // Resizer logic
  useEffect(() => {
    const resizer = resizerRef.current
    if (!resizer) return
    const onDown = (e) => {
      if (collapsed) return
      setIsDragging(true)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    const onMove = (e) => {
      if (!isDragging) return
      const x = e.clientX || (e.touches && e.touches[0].clientX)
      if (x) {
        const w = Math.min(420, Math.max(180, x))
        setWidth(w)
      }
    }
    const onUp = () => {
      if (!isDragging) return
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    resizer.addEventListener('mousedown', onDown)
    resizer.addEventListener('touchstart', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      resizer.removeEventListener('mousedown', onDown)
      resizer.removeEventListener('touchstart', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging])

  // Single tap = navigate
  function clickItem(page) {
    setActiveTooltip(null)
    const path = page === 'dashboard' ? '/' : '/' + page
    router.push(path).then(() => {
      if (typeof onClose === 'function') onClose()
    })
  }

  const isActivePage = (k) => {
    if (k === 'dashboard') return router.pathname === '/' || router.pathname === '/dashboard'
    return router.pathname === '/' + k
  }

  function handleMouseEnter(e, label) {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      label,
      top: rect.top + (rect.height / 2),
      left: rect.right + 10
    });
  }

  function handleMouseLeave() {
    setActiveTooltip(null);
  }

  // Render a sidebar nav item
  function renderItem(k, label, icon, badge) {
    return (
      <Link href={k === 'dashboard' ? '/' : '/' + k} aria-current={isActivePage(k) ? 'page' : undefined} key={k}
        className={"sb-item" + (isActivePage(k) ? ' active' : '')}
        data-page={k}
        onPointerEnter={(e) => handleMouseEnter(e, label)}
        onPointerLeave={handleMouseLeave}
        onClick={() => { onClose?.(); setActiveTooltip(null) }}>
        <i className={`fa-solid ${icon}`}></i>
        <span className="sb-label">{label}</span>
        {badge && <span className="sb-badge">{badge}</span>}
      </Link>
    )
  }

  return (
    <>
      <aside ref={sidebarRef} className={"sidebar" + (collapsed ? ' collapsed' : '') + (mobileOpen ? ' mobile-open' : '') + (isDragging ? ' dragging' : '')} id="sidebar">
        <div ref={resizerRef} className={"sb-resizer" + (isDragging ? ' active' : '')} title="Drag to resize sidebar width" />

        <div className="sb-header">
          <div className="sb-logo">EC</div>
          <div>
            <div className="sb-brand">Edu<span>Core</span></div>
            <div className="sb-sublabel">School Management</div>
          </div>
        </div>

        <nav className="sb-nav" onScroll={handleMouseLeave}>
          <div className="sb-section">Overview</div>
          {items.slice(0, 3).filter(([k]) => isItemPermitted(k)).map(([k,label,icon,badge]) => renderItem(k, label, icon, badge))}

          {items.slice(3, 6).some(([k]) => isItemPermitted(k)) && <div className="sb-section">People</div>}
          {items.slice(3, 6).filter(([k]) => isItemPermitted(k)).map(([k,label,icon,badge]) => renderItem(k, label, icon, badge))}

          {items.slice(6, 14).some(([k]) => isItemPermitted(k)) && <div className="sb-section">Academic</div>}
          {items.slice(6, 14).filter(([k]) => isItemPermitted(k)).map(([k,label,icon]) => renderItem(k, label, icon))}

          {items.slice(14, 16).some(([k]) => isItemPermitted(k)) && <div className="sb-section">Finance</div>}
          {items.slice(14, 16).filter(([k]) => isItemPermitted(k)).map(([k,label,icon]) => renderItem(k, label, icon))}

          {items.slice(16).some(([k]) => isItemPermitted(k)) && <div className="sb-section">System</div>}
          {items.slice(16).filter(([k]) => isItemPermitted(k)).map(([k,label,icon]) => renderItem(k, label, icon))}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-avatar">
              {activeStaff 
                ? activeStaff.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()
                : 'SA'}
            </div>
            <div className="sb-user-info">
              <div className="sb-user-name">{activeStaff ? activeStaff.name : 'Super Admin'}</div>
              <div className="sb-user-role">{activeStaff ? activeStaff.role : 'Full Access'}</div>
            </div>
            <button aria-label="Reset to Super Admin" className="sb-logout" onClick={() => {
              setRaw('educore.currentUser', 'Super Admin');
              window.location.reload();
            }} title="Reset to Super Admin">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Floating Tooltip outside of overflow container */}
      {collapsed && activeTooltip && (
        <div style={{
          position: 'fixed',
          top: activeTooltip.top + 'px',
          left: activeTooltip.left + 'px',
          transform: 'translateY(-50%)',
          background: 'var(--bg4)',
          border: '1px solid var(--border)',
          padding: '5px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 99999,
          boxShadow: 'var(--shadow)',
          color: 'var(--t1)',
          pointerEvents: 'none',
          fontWeight: 600,
          lineHeight: 1.4,
        }}>
          {activeTooltip.label}
        </div>
      )}
    </>
  )
}

