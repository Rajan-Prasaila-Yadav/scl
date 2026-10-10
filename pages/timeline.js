import { getRaw, setRaw } from '../lib/storage'
import { requirePermission } from '../lib/permissions'
import Dialog from '../components/Dialog'
import React, { useState, useEffect, useMemo } from 'react'
import Layout from '../components/Layout'
import {
  STORAGE_KEYS,
  INITIAL_EVENTS,
  INITIAL_STAFF,
  readStoredList,
  writeStoredList,
  makeId,
} from '../lib/academicData'

const DEFAULT_CATEGORIES = ['Event', 'Holiday', 'Notice', 'New']
const AUDIENCES = ['All', 'Students', 'Staff', 'Parents']
const ACCENTS = ['purple', 'green', 'red', 'blue', 'amber']

const emptyForm = {
  title: '',
  description: '',
  category: 'New', // default to 'New' as requested by the user
  customCategory: '',
  date: '',
  startTime: '09:00',
  endTime: '12:00',
  targetAudience: 'All',
  color: 'blue'
}

export default function Timeline() {
  const [events, setEvents] = useState([])
  const [staff, setStaff] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [currentUser, setCurrentUser] = useState('Super Admin')
  const [currentUserRole, setCurrentUserRole] = useState('Admin')
  const [currentUserRealName, setCurrentUserRealName] = useState('Super Admin')
  const [hydrated, setHydrated] = useState(false)
  const [toast, setToast] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [audienceFilter, setAudienceFilter] = useState('all')

  const getCategoryClass = (cat) => {
    if (!cat) return ''
    const c = cat.toLowerCase()
    if (c === 'event') return 'event'
    if (c === 'holiday') return 'holiday'
    if (c === 'news' || c === 'new') return 'news'
    if (c === 'notice' || c === 'exam notice' || c === 'exam') return 'exam'
    return ''
  }

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayEvents, setSelectedDayEvents] = useState(null) // Modal for clicked day
  const [selectedDayString, setSelectedDayString] = useState('')

  // Create modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // Quick Comment state
  const [commentInputs, setCommentInputs] = useState({}) // { [eventId]: '' }

  useEffect(() => {
    const storedEvents = readStoredList(STORAGE_KEYS.events, INITIAL_EVENTS)
    setEvents(storedEvents)
    const storedStaff = readStoredList(STORAGE_KEYS.staff, INITIAL_STAFF)
    setStaff(storedStaff)
    
    const savedUser = getRaw('educore.currentUser') || 'Super Admin'
    setCurrentUser(savedUser)
    
    // Resolve user details
    if (savedUser === 'Super Admin') {
      setCurrentUserRole('Admin')
      setCurrentUserRealName('Super Admin')
    } else {
      const match = storedStaff.find(s => String(s.id) === String(savedUser))
      if (match) {
        setCurrentUserRole(match.role)
        setCurrentUserRealName(match.name)
      }
    }

    const storedCats = getRaw('educore.eventCategories')
    if (storedCats) {
      try {
        setCategories(JSON.parse(storedCats))
      } catch (e) {}
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    writeStoredList(STORAGE_KEYS.events, events)
  }, [events, hydrated])

  useEffect(() => {
    if (!hydrated) return
    setRaw('educore.eventCategories', JSON.stringify(categories))
  }, [categories, hydrated])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Permissions: Admin and all Staff (Teaching & Non-Teaching) can create events. Parents cannot.
  const hasPostPermission = useMemo(() => {
    if (currentUser === 'Super Admin') return true
    const activeStaff = staff.find((s) => String(s.id) === String(currentUser))
    return !!activeStaff // Any logged-in staff member can post announcements
  }, [currentUser, staff])

  // Filtered Events (for Timeline list)
  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return events
      .filter((ev) => {
        if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false
        if (audienceFilter !== 'all' && ev.targetAudience !== audienceFilter) return false
        if (!query) return true
        
        return [
          ev.title,
          ev.description,
          ev.postedBy,
          ev.category,
          ev.targetAudience
        ]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(query))
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Latest events first
  }, [events, search, categoryFilter, audienceFilter])

  // Calendar calculations
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay() // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    const daysArr = []
    
    // Add empty spacer cells for previous month alignment
    for (let i = 0; i < firstDayIndex; i++) {
      daysArr.push({ isSpacer: true })
    }

    // Add days
    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      // Filter events on this specific day
      const dayEvents = events.filter((ev) => ev.date === dateString)
      daysArr.push({
        isSpacer: false,
        dayNum: d,
        dateString,
        eventsList: dayEvents
      })
    }

    return daysArr
  }, [currentDate, events])

  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }, [currentDate])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Interactive micro-actions
  const handleLike = (eventId) => {
    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === eventId) {
          const likesCount = ev.likes || 0
          const likedKey = `liked_${eventId}_${currentUser}`
          const hasLiked = getRaw(likedKey) === 'true'

          if (hasLiked) {
            setRaw(likedKey, 'false')
            return { ...ev, likes: Math.max(0, likesCount - 1) }
          } else {
            setRaw(likedKey, 'true')
            return { ...ev, likes: likesCount + 1 }
          }
        }
        return ev
      })
    )
  }

  const isLiked = (eventId) => {
    if (typeof window === 'undefined') return false
    return getRaw(`liked_${eventId}_${currentUser}`) === 'true'
  }

  const handleCommentChange = (eventId, text) => {
    setCommentInputs(prev => ({ ...prev, [eventId]: text }))
  }

  const submitComment = (e, eventId) => {
    e.preventDefault()
    const text = commentInputs[eventId]?.trim()
    if (!text) return

    const now = new Date()
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newComment = {
      id: makeId(),
      user: currentUserRealName,
      role: currentUserRole,
      text,
      date: formattedDate
    }

    setEvents(prev =>
      prev.map(ev => {
        if (ev.id === eventId) {
          const currentComments = ev.comments || []
          return { ...ev, comments: [...currentComments, newComment] }
        }
        return ev
      })
    )

    setCommentInputs(prev => ({ ...prev, [eventId]: '' }))
    showToast('Comment posted successfully', 'success')
  }

  const handleOpenDay = (dayData) => {
    if (dayData.isSpacer || dayData.eventsList.length === 0) return
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const fullDateStr = new Date(dayData.dateString).toLocaleDateString(undefined, options)
    setSelectedDayString(fullDateStr)
    setSelectedDayEvents(dayData.eventsList)
  }

  // Create submission
  const openAdd = () => {
    if (!hasPostPermission) {
      showToast('You do not have permission to post announcements', 'error')
      return
    }
    const todayStr = new Date().toISOString().split('T')[0]
    setForm({
      ...emptyForm,
      date: todayStr
    })
    setShowModal(true)
  }

  const submitForm = (e) => {
    e.preventDefault(); if (!requirePermission('create')) return
    if (form.startTime && form.endTime && form.endTime <= form.startTime) { showToast('End time must be after start time', 'error'); return }
    e.preventDefault()
    if (!form.title || !form.description || !form.date || !form.category.trim()) {
      showToast('Title, Description, Date and Category are required', 'error')
      return
    }

    const typedCategory = form.category.trim()
    const formattedName = typedCategory.charAt(0).toUpperCase() + typedCategory.slice(1)

    // Add to dynamic categories list if not present
    if (formattedName && !categories.map(c => c.toLowerCase()).includes(formattedName.toLowerCase())) {
      setCategories(prev => [...prev, formattedName])
    }

    const newEvent = {
      id: makeId(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: formattedName,
      date: form.date,
      startTime: form.startTime || '09:00',
      endTime: form.endTime || '12:00',
      targetAudience: form.targetAudience,
      postedBy: currentUserRealName,
      likes: 0,
      comments: [],
      color: form.color
    }

    setEvents(prev => [newEvent, ...prev])
    setShowModal(false)
    showToast('New announcement broadcasted successfully!', 'success')
  }

  const deleteAnnouncement = (eventId) => {
    if (!requirePermission('delete')) return

    if (!confirm('Are you sure you want to remove this announcement?')) return
    setEvents(prev => prev.filter(ev => ev.id !== eventId))
    showToast('Announcement removed', 'info')
    setSelectedDayEvents(null)
  }

  const formatEventDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Layout>
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <h1>Announcements &amp; School Timeline</h1>
          <p>Read official announcements, school updates, academic logs, and view scheduled holidays on the event calendar.</p>
        </div>
        <div className="settings-actions">
          {hasPostPermission && (
            <button className="btn btn-primary" onClick={openAdd}>
              <i className="fa-solid fa-bullhorn"></i> New Announcement
            </button>
          )}
        </div>
      </div>

      <div className="timeline-workspace">
        {/* LEFT COLUMN: EVENTS TIMELINE FEED */}
        <div>
          <div className="roles-table-card academic-list-card" style={{ padding: '16px 20px', marginBottom: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr', gap: '10px' }}>
              <div className="roles-search" style={{ margin: 0 }}>
                <i className="fa-solid fa-magnifying-glass"></i>
                <input aria-label="Search updates, titles, keywords..."
                  placeholder="Search updates, titles, keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button aria-label="Close" className="roles-search-clear" onClick={() => setSearch('')}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
              <select aria-label="Category Filter" className="roles-filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select aria-label="Audience Filter" className="roles-filter" value={audienceFilter} onChange={(e) => setAudienceFilter(e.target.value)} style={{ margin: 0 }}>
                <option value="all">All Audiences</option>
                {AUDIENCES.map(aud => (
                  <option key={aud} value={aud}>{aud} Users</option>
                ))}
              </select>
            </div>
          </div>

          <div className="timeline-feed-pane">
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--t1)', marginBottom: '4px' }}>Latest Updates</h3>
            <p style={{ fontSize: '11px', color: 'var(--t3)', marginBottom: '14px' }}>Chronological feed of school bulletins</p>

            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--t3)' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}></i>
                No matching announcements or events found.
              </div>
            ) : (
              <div className="timeline-track">
                {filteredEvents.map((ev) => {
                  const evLiked = isLiked(ev.id)
                  const catClass = getCategoryClass(ev.category)
                  const badgeClass = `timeline-badge ${catClass ? `category-${catClass}` : ''}`
                  
                  return (
                    <div key={ev.id} className="timeline-item">
                      <div className={badgeClass} style={!catClass ? { background: `var(--${ev.color || 'accent'})`, boxShadow: `0 0 0 2px var(--${ev.color || 'accent'}bg)` } : {}} />
                      <div className="timeline-post-card" style={{ borderLeft: `3px solid var(--${ev.color || 'accent'})` }}>
                        <div className="timeline-post-header">
                          <div>
                            <div className="timeline-post-title">{ev.title}</div>
                            <div className="timeline-post-meta">
                              <span>Posted by <strong>{ev.postedBy}</strong></span> • <span>{formatEventDate(ev.date)} ({ev.startTime || '—'})</span>
                            </div>
                          </div>
                          <span className={`timeline-post-category ${catClass}`} style={!catClass ? { background: `var(--${ev.color || 'accent'}bg)`, color: `var(--${ev.color || 'accent'})` } : {}}>
                            {ev.category}
                          </span>
                        </div>

                        <div className="timeline-post-desc">{ev.description}</div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--t3)', margin: '4px 0' }}>
                          <span>Target: <strong style={{ color: 'var(--t2)' }}>{ev.targetAudience}</strong></span>
                          {ev.endTime && <span>Duration: <strong style={{ color: 'var(--t2)' }}>{ev.startTime} - {ev.endTime}</strong></span>}
                        </div>

                        {/* Likes / Actions row */}
                        <div className="timeline-post-actions">
                          <button
                            className={`timeline-action-btn${evLiked ? ' liked' : ''}`}
                            onClick={() => handleLike(ev.id)}
                          >
                            <i className={evLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
                            {ev.likes || 0} Likes
                          </button>
                          
                          <div className="timeline-action-btn">
                            <i className="fa-regular fa-comment"></i>
                            {(ev.comments || []).length} Comments
                          </div>

                          {currentUserRealName === ev.postedBy && (
                            <button
                              className="timeline-action-btn"
                              style={{ marginLeft: 'auto', color: 'var(--red)' }}
                              onClick={() => deleteAnnouncement(ev.id)}
                              title="Delete Post"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                              Delete
                            </button>
                          )}
                        </div>

                        {/* Comments Block */}
                        <div className="timeline-comments-section">
                          {ev.comments && ev.comments.map((comm) => (
                            <div key={comm.id} className="timeline-comment">
                              <div>
                                <span className="timeline-comment-user">{comm.user}</span>
                                <span className="timeline-comment-role">({comm.role})</span>
                                <div className="timeline-comment-text">{comm.text}</div>
                              </div>
                              <span className="timeline-comment-date">{comm.date}</span>
                            </div>
                          ))}

                          <form onSubmit={(e) => submitComment(e, ev.id)} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input aria-label="Write a comment..."
                              className="form-input"
                              style={{ padding: '6px 10px', fontSize: '12px', flex: 1, textTransform: 'none' }}
                              placeholder="Write a comment..."
                              value={commentInputs[ev.id] || ''}
                              onChange={(e) => handleCommentChange(ev.id, e.target.value)}
                              required
                            />
                            <button type="submit" className="btn btn-ghost btn-sm" style={{ padding: '6px 12px' }}>
                              Post
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MONTHLY ACADEMIC CALENDAR */}
        <div className="calendar-card">
          <div className="calendar-header">
            <button aria-label="Previous page" className="btn-icon-sm" onClick={handlePrevMonth}>
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div className="calendar-month-title">{monthName}</div>
            <button aria-label="Next page" className="btn-icon-sm" onClick={handleNextMonth}>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            
            {calendarDays.map((day, idx) => {
              if (day.isSpacer) {
                return <div key={`spacer-${idx}`} className="calendar-day empty" />
              }

              // Check if it's today
              const today = new Date()
              const isToday = today.getFullYear() === currentDate.getFullYear() &&
                              today.getMonth() === currentDate.getMonth() &&
                              today.getDate() === day.dayNum

              return (
                <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} 
                  key={day.dateString} 
                  className={`calendar-day${isToday ? ' today' : ''}`}
                  onClick={() => handleOpenDay(day)}
                  title={day.eventsList.length > 0 ? `${day.eventsList.length} events scheduled` : 'Click to view'}
                  style={day.eventsList.length > 0 ? { border: '1px solid var(--accent)' } : {}}
                >
                  <span style={{ fontSize: '11px' }}>{day.dayNum}</span>
                  {day.eventsList.length > 0 && (
                    <div className="calendar-event-dots">
                      {day.eventsList.slice(0, 4).map((ev) => {
                        const catClass = getCategoryClass(ev.category)
                        return (
                          <div 
                            key={ev.id} 
                            className={`calendar-dot ${catClass}`} 
                            style={!catClass ? { backgroundColor: `var(--${ev.color || 'accent'})` } : {}}
                            title={`${ev.category}: ${ev.title}`}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border2)', paddingTop: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--t3)', marginBottom: '8px' }}>Category Legend</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="calendar-dot event" style={{ display: 'inline-block' }} /> Event
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="calendar-dot holiday" style={{ display: 'inline-block' }} /> Holiday
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="calendar-dot exam" style={{ display: 'inline-block' }} /> Exams
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="calendar-dot news" style={{ display: 'inline-block' }} /> News / Bulletin
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP: DAY EVENTS MODAL */}
      {selectedDayEvents && (
        <Dialog className="modal-overlay" onClick={() => setSelectedDayEvents(null)}>
          <div className="modal-panel role-form-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-calendar-day" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  Schedules for {selectedDayString}
                </h3>
                <p className="modal-sub">We found {selectedDayEvents.length} notification(s) on this date</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setSelectedDayEvents(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDayEvents.map((ev) => (
                <div key={ev.id} style={{ borderLeft: `3px solid var(--${ev.color || 'accent'})`, background: 'var(--bg3)', borderRadius: 'var(--radius-xs)', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--t1)' }}>{ev.title}</strong>
                    <span className={`timeline-post-category ${getCategoryClass(ev.category)}`} style={{ fontSize: '9px', padding: '2px 6px', ...(!getCategoryClass(ev.category) ? { background: `var(--${ev.color || 'accent'}bg)`, color: `var(--${ev.color || 'accent'})` } : {}) }}>
                      {ev.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--t2)', lineHeight: 1.5 }}>{ev.description}</p>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--t3)', marginTop: '8px' }}>
                    <span>By: {ev.postedBy}</span>
                    <span>Time: {ev.startTime} - {ev.endTime}</span>
                  </div>
                  {currentUserRealName === ev.postedBy && (
                    <button
                      className="btn btn-ghost btn-xs"
                      style={{ marginTop: '8px', color: 'var(--red)' }}
                      onClick={() => deleteAnnouncement(ev.id)}
                    >
                      <i className="fa-solid fa-trash-can"></i> Delete Announcement
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelectedDayEvents(null)}>Close</button>
            </div>
          </div>
        </Dialog>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <Dialog className="modal-overlay">
          <div className="modal-panel role-form-modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">
                  <i className="fa-solid fa-bullhorn" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>
                  Broadcast School Announcement
                </h3>
                <p className="modal-sub">Create a new events notice, academic news bulletin, or holiday banner.</p>
              </div>
              <button aria-label="Close" className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={submitForm}>
              <div className="modal-body">
                {/* Title */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Announcement Title <span className="req">*</span></label>
                  <input aria-label="Announcement Title"
                    className="form-input"
                    placeholder="e.g. Science Fair Registration"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Body Description <span className="req">*</span></label>
                  <textarea aria-label="Body Description"
                    className="form-input"
                    rows={4}
                    placeholder="Type details, guidelines, venue details, or criteria..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ resize: 'vertical', minHeight: '80px', textTransform: 'none' }}
                    required
                  />
                </div>

                {/* Category & Audience */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Category Group <span className="req">*</span></label>
                    <input aria-label="Category Group"
                      className="form-input"
                      placeholder="Select or type..."
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      list="category-suggestions"
                      style={{ textTransform: 'none' }}
                      required
                    />
                    <datalist id="category-suggestions">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Target Audience</label>
                    <select aria-label="Target Audience" className="form-select" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                      {AUDIENCES.map(aud => (
                        <option key={aud} value={aud}>{aud}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label>Date Scheduled <span className="req">*</span></label>
                  <input aria-label="Date Scheduled"
                    className="form-input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input aria-label="Start Time"
                      className="form-input"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Time</label>
                    <input aria-label="End Time"
                      className="form-input"
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Color Accent theme picker */}
                <div className="form-group">
                  <label>Highlight Theme Color</label>
                  <div className="theme-picker" style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                    {ACCENTS.map(col => (
                      <button
                        key={col}
                        type="button"
                        className={`swatch active`}
                        onClick={() => setForm({ ...form, color: col })}
                        style={{
                          backgroundColor: `var(--${col})`,
                          border: form.color === col ? '2px solid var(--t1)' : '2px solid transparent',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-paper-plane"></i> Broadcast Bulletin
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
