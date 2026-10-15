import AcademicYearDates from '../components/AcademicYearDates'
import Dialog from '../components/Dialog'
import { getRaw, setRaw } from '../lib/storage'
import { BrandingEditor, EmergencyContacts, ComplianceEditor } from '../components/SettingsRecords'
import { requirePermission } from '../lib/permissions'
import Layout from '../components/Layout'
import { readObject, writeValue } from '../lib/storage'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Settings(){
  const router = useRouter()
  const [showPreview,setShowPreview] = useState(false)
  const [settings, setSettings] = useState({})
  useEffect(() => setSettings(readObject('educore.settings', {})), [])
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [accentColor, setAccentColor] = useState('#6366F1');
  const [theme, setTheme] = useState('dark')
  const [activeTab, setActiveTab] = useState('general')
  const [showToast, setShowToast] = useState(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastRemoving, setToastRemoving] = useState(false)
  const [boardOtherVisible, setBoardOtherVisible] = useState(false)

  const [academicYears, setAcademicYears] = useState(['2025–2026', '2026–2027', '2027–2028'])
  const [academicYear, setAcademicYear] = useState('2026–2027')
  const [newYearInput, setNewYearInput] = useState('')
  const [showAddYearForm, setShowAddYearForm] = useState(false)

  useEffect(() => {
    const savedTheme = (typeof window !== 'undefined' && getRaw('theme')) || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)

    const savedCollapsed = (typeof window !== 'undefined' && getRaw('sidebar-collapsed')) === 'true'
    setCollapsed(savedCollapsed)

    // Load saved accent color and apply immediately to avoid flash
    const savedAccent = typeof window !== 'undefined' && getRaw('accentColor')
    if (savedAccent) {
      setAccentColor(savedAccent)
      document.documentElement.style.setProperty('--accent', savedAccent)
      document.documentElement.style.setProperty('--accent2', savedAccent + 'CC')
      document.querySelectorAll('.sb-logo, .school-logo, .sb-avatar').forEach((el) => {
        el.style.background = `linear-gradient(135deg, ${savedAccent}, #7C3AED)`
      })
    }

    const savedYears = getRaw('academicYears')
    if (savedYears) {
      try {
        setAcademicYears(JSON.parse(savedYears))
      } catch (e) {
        console.error(e)
      }
    }
    const savedActiveYear = getRaw('academicYear')
    if (savedActiveYear) {
      setAcademicYear(savedActiveYear)
    }

    const handleExternalChange = () => {
      const active = getRaw('academicYear')
      if (active) setAcademicYear(active)
      const list = getRaw('academicYears')
      if (list) {
        try { setAcademicYears(JSON.parse(list)) } catch(e){}
      }
    }
    window.addEventListener('academicYearChanged', handleExternalChange)
    return () => window.removeEventListener('academicYearChanged', handleExternalChange)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    setRaw('theme', nextTheme)
  }

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
    setRaw('sidebar-collapsed', !collapsed)
  }

  const closeSidebar = () => setMobileOpen(false)

  const showToastMsg = (msg, type = 'info') => {
    setShowToast({ msg, type })
    setToastVisible(true)
    setToastRemoving(false)
    setTimeout(() => {
      setToastRemoving(true)
      setTimeout(() => {
        setShowToast(null)
        setToastVisible(false)
        setToastRemoving(false)
      }, 300)
    }, 3200)
  }

  const handleAccentColorChange = (color) => {
    setAccentColor(color)
    setRaw('accentColor', color)
    document.documentElement.style.setProperty('--accent', color)
    document.documentElement.style.setProperty('--accent2', color + 'CC')
    document.querySelectorAll('.sb-logo, .school-logo, .sb-avatar').forEach((el) => {
      el.style.background = `linear-gradient(135deg, ${color}, #7C3AED)`
    })
  }

  const saveSettings = () => {
    if (!requirePermission('edit')) return

    if (settings.field1 !== undefined && !settings.field1.trim()) { showToastMsg('School name is required', 'error'); return }
    if (settings.field31 !== undefined && (!Number.isFinite(Number(settings.field31)) || Number(settings.field31) < 0 || Number(settings.field31) > 100)) { showToastMsg('Tax percentage must be between 0 and 100', 'error'); return }
    if (!writeValue('educore.settings', settings)) return
    setRaw('accentColor', accentColor)
    showToastMsg('Settings saved successfully!', 'success')
  }



  const handleBoardChange = (e) => {
    setBoardOtherVisible(e.target.value === 'other')
  }

  const handleAcademicYearChange = (val) => {
    setAcademicYear(val)
    setRaw('academicYear', val)
    window.dispatchEvent(new Event('academicYearChanged'))
  }

  const handleAddAcademicYear = () => {
    const cleanInput = newYearInput.trim()
    if (!cleanInput) return
    const pattern = /^\d{4}[–-]\d{4}$/
    if (!pattern.test(cleanInput)) {
      showToastMsg('Format must be YYYY–YYYY (e.g. 2027–2028)', 'error')
      return
    }
    const formatted = cleanInput.replace('-', '–')
    if (academicYears.includes(formatted)) {
      showToastMsg('Academic year already exists', 'warning')
      return
    }
    const updated = [...academicYears, formatted].sort()
    setAcademicYears(updated)
    setRaw('academicYears', JSON.stringify(updated))
    setNewYearInput('')
    setShowAddYearForm(false)
    showToastMsg(`Academic year ${formatted} added!`, 'success')
    window.dispatchEvent(new Event('academicYearChanged'))
  }

  return (
    <Layout>
          {/* SETTINGS HEADER */}
          <div className="settings-header">
            <div>
              <h1>School Settings</h1>
              <p>Manage your school information, branding, preferences &amp; compliance. New fee invoices record the selected academic year. Other academic records are not yet partitioned by session.</p>
            </div>
            <div className="settings-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview(true)}>
                <i className="fa-solid fa-eye"></i> Preview
              </button>
              <button className="btn btn-primary btn-sm" onClick={saveSettings}>
                <i className="fa-solid fa-floppy-disk"></i> Save Changes
              </button>
            </div>
          </div>

          {/* SCHOOL PROFILE CARD */}
          <div className="school-profile">
            <div className="logo-area">
              <div className="school-logo">🏫</div>
              <div className="school-info">
                <h3>
                  {settings.field1 || 'Sunrise Public School'}
                  <span className="status"><i className="fa-solid fa-circle" style={{fontSize:6}}></i> Active</span>
                </h3>
                <div className="detail-row">
                  <span><i className="fa-solid fa-tag"></i> Code: {settings.field2 || 'SPS-DEL-01'}</span>
                  <span><i className="fa-solid fa-shield"></i> Board: {(settings.board || 'cbse').toUpperCase()}</span>
                  <span><i className="fa-solid fa-calendar"></i> Academic Year: {academicYear}</span>
                  <span><i className="fa-solid fa-globe"></i> Timezone: {settings.field17 === 'NPT' ? 'Asia/Kathmandu' : 'Asia/Kolkata'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="tabs-nav">
            <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>📋 General</button>
            <button className={activeTab === 'branding' ? 'active' : ''} onClick={() => setActiveTab('branding')}>🎨 Branding</button>
            <button className={activeTab === 'contact' ? 'active' : ''} onClick={() => setActiveTab('contact')}>📞 Contact</button>
            <button className={activeTab === 'finance' ? 'active' : ''} onClick={() => setActiveTab('finance')}>💰 Finance</button>
            <button className={activeTab === 'compliance' ? 'active' : ''} onClick={() => setActiveTab('compliance')}>⚖️ Compliance</button>
          </div>

          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="tab-content active">
              <div className="section-divider">
                <span className="section-divider-label">🏛️ Basic Information</span>
                <div className="section-divider-line"></div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>School Name <span className="req">*</span></label>
                  <input aria-label="School Name" value={settings.field1 ?? "Sunrise Public School"} onChange={e => setSettings(prev => ({ ...prev, field1: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>School Code <span className="req">*</span></label>
                  <input aria-label="School Code" value={settings.field2 ?? "SPS-DEL-01"} onChange={e => setSettings(prev => ({ ...prev, field2: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>Establishment Year</label>
                  <input aria-label="Establishment Year" value={settings.field3 ?? "2010"} onChange={e => setSettings(prev => ({ ...prev, field3: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>School Type <span className="req">*</span></label>
                  <select aria-label="School Type" value={settings.field4 ?? "primary"} onChange={e => setSettings(prev => ({ ...prev, field4: e.target.value }))} className="form-select">
                    <option value="montessori">Montessori Education</option>
                    <option value="primary" >Primary Education</option>
                    <option value="secondary">Secondary Education</option>
                    <option value="higher_secondary">Higher Secondary</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Board <span className="req">*</span></label>
                  <select aria-label="Board" className="form-select" value={settings.board || 'cbse'} onChange={e => { handleBoardChange(e); setSettings(s => ({...s,board:e.target.value})) }}>
                    <optgroup label="National Boards">
                      <option value="cbse" >CBSE</option>
                      <option value="cisce">CISCE</option>
                      <option value="nios">NIOS</option>
                    </optgroup>
                    <optgroup label="State Boards">
                      <option value="state">State Board</option>
                    </optgroup>
                    <optgroup label="International Boards">
                      <option value="ib">International Boards</option>
                    </optgroup>
                    <option value="neb">NEB</option>
                    <option value="deo">District Education Office</option>
                    <option value="internal">Internal (Schools)</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {settings.board === 'other' && (
                  <div className="form-group">
                    <label>Specify Board Name <span className="req">*</span></label>
                    <input aria-label="Specify Board Name" value={settings.field5 ?? ''} onChange={e => setSettings(prev => ({ ...prev, field5: e.target.value }))} className="form-input" placeholder="Enter your board name..." />
                  </div>
                )}
                <div className="form-group">
                  <label>Active Academic Year <span className="req">*</span></label>
                  <div style={{display:'flex', gap:8}}>
                    <select className="form-select" value={academicYear} onChange={e=>handleAcademicYearChange(e.target.value)} id="academicYearSelect">
                      {academicYears.map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                    <button aria-label="Add Academic Year" className="btn btn-ghost btn-sm" type="button" onClick={()=>setShowAddYearForm(!showAddYearForm)} style={{flexShrink:0}} title="Add Academic Year">
                      <i className={`fa-solid ${showAddYearForm ? 'fa-xmark' : 'fa-plus'}`}></i>
                    </button>
                  </div>
                </div>
                <AcademicYearDates key={academicYear} year={academicYear}/>
                {showAddYearForm && (
                  <div className="form-group" style={{gridColumn:'1/-1', background:'var(--bg2)', padding:'14px 18px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', marginTop:6}}>
                    <label style={{fontSize:11, color:'var(--t2)', textTransform:'uppercase', fontWeight:600}}>Add Academic Year</label>
                    <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
                      <input aria-label="Add Academic Year" 
                        className="form-input" 
                        value={newYearInput} 
                        onChange={e=>setNewYearInput(e.target.value)} 
                        placeholder="e.g. 2027–2028"
                        style={{maxWidth:180}}
                      />
                      <button className="btn btn-primary btn-sm" type="button" onClick={handleAddAcademicYear}>Add Session</button>
                      <button className="btn btn-ghost btn-sm" type="button" onClick={()=>{setShowAddYearForm(false); setNewYearInput('');}}>Cancel</button>
                    </div>
                    <small style={{display:'block', marginTop:6, color:'var(--t3)', fontSize:11}}>Format must be YYYY–YYYY (e.g. 2027–2028 or 2027-2028).</small>
                  </div>
                )}
                <div className="form-group">
                  <label>Medium of Instruction</label>
                  <select aria-label="Medium of Instruction" value={settings.field6 ?? "English"} onChange={e => setSettings(prev => ({ ...prev, field6: e.target.value }))} className="form-select">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Nepali</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Motto</label>
                  <input aria-label="Motto" value={settings.field7 ?? "Excellence in Education, Values for Life"} onChange={e => setSettings(prev => ({ ...prev, field7: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input aria-label="Website" value={settings.field8 ?? "www.sunrisepublicschool.edu"} onChange={e => setSettings(prev => ({ ...prev, field8: e.target.value }))} className="form-input"  />
                </div>
              </div>

              <div className="section-divider" style={{marginTop:16}}>
                <span className="section-divider-label">📍 Address</span>
                <div className="section-divider-line"></div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Address Line 1 <span className="req">*</span></label>
                  <input aria-label="Address Line 1" value={settings.field9 ?? "123 Education Street"} onChange={e => setSettings(prev => ({ ...prev, field9: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>Address Line 2</label>
                  <input aria-label="Address Line 2" value={settings.field10 ?? "Knowledge City"} onChange={e => setSettings(prev => ({ ...prev, field10: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>Landmark</label>
                  <input aria-label="Landmark" value={settings.field11 ?? "Near Central Park"} onChange={e => setSettings(prev => ({ ...prev, field11: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>District <span className="req">*</span></label>
                  <input aria-label="District" value={settings.field12 ?? "South Delhi"} onChange={e => setSettings(prev => ({ ...prev, field12: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>City <span className="req">*</span></label>
                  <input aria-label="City" value={settings.field13 ?? "New Delhi"} onChange={e => setSettings(prev => ({ ...prev, field13: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>State <span className="req">*</span></label>
                  <select aria-label="State" value={settings.field14 ?? "Delhi"} onChange={e => setSettings(prev => ({ ...prev, field14: e.target.value }))} className="form-select">
                    <option>Delhi</option>
                    <option>Maharashtra</option>
                    <option>Karnataka</option>
                    <option>Uttar Pradesh</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Country <span className="req">*</span></label>
                  <select aria-label="Country" value={settings.field15 ?? "india"} onChange={e => setSettings(prev => ({ ...prev, field15: e.target.value }))} className="form-select">
                    <option value="india">India</option>
                    <option value="nepal">Nepal</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>PIN / Postal Code <span className="req">*</span></label>
                  <input aria-label="PIN / Postal Code" value={settings.field16 ?? "110045"} onChange={e => setSettings(prev => ({ ...prev, field16: e.target.value }))} className="form-input"  />
                </div>
                <div className="form-group">
                  <label>Timezone <span className="req">*</span></label>
                  <select aria-label="Timezone" value={settings.field17 ?? "IST"} onChange={e => setSettings(prev => ({ ...prev, field17: e.target.value }))} className="form-select">
                    <option value="IST">Indian Standard Time (IST) — UTC +5:30</option>
                    <option value="NPT">Nepal Standard Time (NPT) — UTC +5:45</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BRANDING */}
          {activeTab === 'branding' && (
            <div className="tab-content active">
              <div className="branding-grid">
                <div>
                  <div className="section-divider">
                    <span className="section-divider-label">🎨 Visual Identity</span>
                    <div className="section-divider-line"></div>
                  </div>
                  <BrandingEditor settings={settings} setSettings={setSettings} />
                </div>
                <div className="branding-preview">
                  <h5>Brand Preview</h5>
                  <div className="identity-card-preview">
                    <div className="preview-logo">🏫</div>
                    <h6>{settings.field1 || 'Sunrise Public School'}</h6>
                    <p className="preview-detail">Inspire · Learn · Achieve</p>
                    <div className="preview-detail">Code: SPS-DEL-01</div>
                    <div className="preview-detail">Board: CBSE</div>
                    <div className="preview-detail">Type: Co-Educational</div>
                    <div className="preview-footer">Excellence in Education</div>
                  </div>
                  <div className="theme-picker">
                    <span style={{fontSize:12, fontWeight:600, color:'var(--t2)'}}>Theme Accent:</span>
                    <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={`swatch ${accentColor === '#6366F1' ? 'active' : ''}`} style={{background:'#6366F1'}} onClick={() => handleAccentColorChange('#6366F1')} data-color="#6366F1"></div>
                    <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={`swatch ${accentColor === '#2563EB' ? 'active' : ''}`} style={{background:'#2563EB'}} onClick={() => handleAccentColorChange('#2563EB')} data-color="#2563EB"></div>
                    <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={`swatch ${accentColor === '#7C3AED' ? 'active' : ''}`} style={{background:'#7C3AED'}} onClick={() => handleAccentColorChange('#7C3AED')} data-color="#7C3AED"></div>
                    <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={`swatch ${accentColor === '#D946EF' ? 'active' : ''}`} style={{background:'#D946EF'}} onClick={() => handleAccentColorChange('#D946EF')} data-color="#D946EF"></div>
                    <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={`swatch ${accentColor === '#EA580C' ? 'active' : ''}`} style={{background:'#EA580C'}} onClick={() => handleAccentColorChange('#EA580C')} data-color="#EA580C"></div>
                    <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={`swatch ${accentColor === '#16A34A' ? 'active' : ''}`} style={{background:'#16A34A'}} onClick={() => handleAccentColorChange('#16A34A')} data-color="#16A34A"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT */}
          {activeTab === 'contact' && (
            <div className="tab-content active">
              <div className="two-col">
                <div>
                  <div className="section-divider">
                    <span className="section-divider-label">📞 Contact Details</span>
                    <div className="section-divider-line"></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Primary Phone <span className="req">*</span></label>
                      <input aria-label="Primary Phone" value={settings.field18 ?? "+91 98765 43210"} onChange={e => setSettings(prev => ({ ...prev, field18: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Secondary Phone</label>
                      <input aria-label="Secondary Phone" value={settings.field19 ?? "+91 98765 43211"} onChange={e => setSettings(prev => ({ ...prev, field19: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>WhatsApp Number</label>
                      <input aria-label="WhatsApp Number" value={settings.field20 ?? "+91 91234 56789"} onChange={e => setSettings(prev => ({ ...prev, field20: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Email <span className="req">*</span></label>
                      <input aria-label="Email" value={settings.field21 ?? "info@sunrisepublic.edu"} onChange={e => setSettings(prev => ({ ...prev, field21: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Secondary Email</label>
                      <input aria-label="Secondary Email" value={settings.field22 ?? "admissions@sunrisepublic.edu"} onChange={e => setSettings(prev => ({ ...prev, field22: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Website</label>
                      <input aria-label="Website" value={settings.field23 ?? "www.sunrisepublicschool.edu"} onChange={e => setSettings(prev => ({ ...prev, field23: e.target.value }))} className="form-input"  />
                    </div>
                  </div>

                  <div className="section-divider">
                    <span className="section-divider-label">🌐 Social Links</span>
                    <div className="section-divider-line"></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Facebook</label>
                      <input aria-label="Facebook" value={settings.field24 ?? "facebook.com/sunrisepublic"} onChange={e => setSettings(prev => ({ ...prev, field24: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Instagram</label>
                      <input aria-label="Instagram" value={settings.field25 ?? "instagram.com/sunrisepublic"} onChange={e => setSettings(prev => ({ ...prev, field25: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>YouTube</label>
                      <input aria-label="YouTube" value={settings.field26 ?? "youtube.com/sunrisepublic"} onChange={e => setSettings(prev => ({ ...prev, field26: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn</label>
                      <input aria-label="LinkedIn" value={settings.field27 ?? "linkedin.com/school/sunrisepublic"} onChange={e => setSettings(prev => ({ ...prev, field27: e.target.value }))} className="form-input"  />
                    </div>
                  </div>
                </div>

                <div>
                  <EmergencyContacts settings={settings} setSettings={setSettings} />
                  <div className="emergency-card" style={{marginTop:12}}>
                    <h5><i className="fa-solid fa-bell" style={{color:'var(--accent)', marginRight:8}}></i> Communication Preferences</h5><p>Saved preferences only. Messaging delivery is not connected.</p>
                    {[
                      ['📧 Email Notifications', true],
                      ['📱 SMS Notifications', true],
                      ['💬 WhatsApp Alerts', false],
                      ['📢 Marketing Communications', false]
                    ].map(([label, active], i) => (
                      <div key={i} className="toggle-row">
                        <span style={{fontSize:13}}>{label}</span>
                        <button type="button" role="switch" aria-label={label} aria-checked={settings["notification"+i] ?? active} onClick={() => setSettings(s=>({...s,["notification"+i]:!(s["notification"+i] ?? active)}))} className={"toggle-switch" + ((settings["notification"+i] ?? active) ? " active" : "")}><span className="knob"></span></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FINANCE */}
          {activeTab === 'finance' && (
            <div className="tab-content active">
              <div className="two-col">
                <div>
                  <div className="section-divider">
                    <span className="section-divider-label">💰 Currency &amp; Financial Year</span>
                    <div className="section-divider-line"></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Base Currency <span className="req">*</span></label>
                      <select aria-label="Base Currency" value={settings.field28 ?? "Indian Rupee (INR) — ₹"} onChange={e => setSettings(prev => ({ ...prev, field28: e.target.value }))} className="form-select">
                        <option>Indian Rupee (INR) — ₹</option>
                        <option>Nepali Rupee (NPR) — रु</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Currency Symbol</label>
                      <input aria-label="Currency Symbol" readOnly value={settings.field28?.includes("NPR") ? "रु" : "₹"} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Financial Year Start <span className="req">*</span></label>
                      <select aria-label="Financial Year Start" value={settings.field30 ?? "April"} onChange={e => setSettings(prev => ({ ...prev, field30: e.target.value }))} className="form-select">
                        <option>April</option>
                        <option>January</option>
                        <option>July</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Default Tax (%)</label>
                      <input aria-label="Default Tax (%)" value={settings.field31 ?? "18"} onChange={e => setSettings(prev => ({ ...prev, field31: e.target.value }))} className="form-input"  />
                    </div>
                  </div>

                  <div className="section-divider">
                    <span className="section-divider-label">🏦 Bank Account</span>
                    <div className="section-divider-line"></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Bank Name <span className="req">*</span></label>
                      <input aria-label="Bank Name" value={settings.field32 ?? "State Bank of India"} onChange={e => setSettings(prev => ({ ...prev, field32: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Account Holder Name <span className="req">*</span></label>
                      <input aria-label="Account Holder Name" value={settings.field33 ?? "Sunrise Public School"} onChange={e => setSettings(prev => ({ ...prev, field33: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Account Number <span className="req">*</span></label>
                      <input aria-label="Account Number" value={settings.field34 ?? "12345678901234"} onChange={e => setSettings(prev => ({ ...prev, field34: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>IFSC Code <span className="req">*</span></label>
                      <input aria-label="IFSC Code" value={settings.field35 ?? "SBIN0001234"} onChange={e => setSettings(prev => ({ ...prev, field35: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Branch Name</label>
                      <input aria-label="Branch Name" value={settings.field36 ?? "Knowledge City Branch"} onChange={e => setSettings(prev => ({ ...prev, field36: e.target.value }))} className="form-input"  />
                    </div>
                    <div className="form-group">
                      <label>Account Type</label>
                      <select aria-label="Account Type" value={settings.field37 ?? "Current Account"} onChange={e => setSettings(prev => ({ ...prev, field37: e.target.value }))} className="form-select">
                        <option>Current Account</option>
                        <option>Savings Account</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>UPI ID</label>
                      <input aria-label="UPI ID" value={settings.field38 ?? "sunrisepublic@sbi"} onChange={e => setSettings(prev => ({ ...prev, field38: e.target.value }))} className="form-input"  />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="finance-summary">
                    <h5 style={{fontSize:14, fontWeight:600, marginBottom:12}}>📊 Finance Summary</h5>
                    {[
                      ['Base Currency', 'Indian Rupee (INR)'],
                      ['Financial Year', 'Apr 2026 – Mar 2027'],
                      ['Default Tax', '18%'],
                      ['Payment Gateway', 'Razorpay'],
                      ['Online Payment', 'Enabled']
                    ].map(([label, value], i) => (
                      <div key={i} className="stat-row">
                        <span className="stat-label">{label}</span>
                        <span className="stat-value" style={label === 'Online Payment' ? {color:'var(--green)'} : {}}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="finance-summary" style={{marginTop:12}}>
                    <h5 style={{fontSize:14, fontWeight:600, marginBottom:10}}>💳 Supported Methods</h5>
                    <div className="payment-methods">
                      <span className="payment-method"><i className="fa-solid fa-mobile-screen"></i> UPI</span>
                      <span className="payment-method"><i className="fa-solid fa-credit-card"></i> Visa</span>
                      <span className="payment-method"><i className="fa-solid fa-credit-card"></i> Mastercard</span>
                      <span className="payment-method"><i className="fa-solid fa-building-columns"></i> Net Banking</span>
                      <span className="payment-method"><i className="fa-solid fa-wallet"></i> Wallets</span>
                      <span className="payment-method"><i className="fa-solid fa-receipt"></i> EMI</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{width:'100%', marginTop:10}}>
                      <i className="fa-solid fa-bolt"></i> Quick Actions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: COMPLIANCE */}
          {activeTab === 'compliance' && <ComplianceEditor settings={settings} setSettings={setSettings} />}

      {showPreview && <Dialog className="modal-overlay" onClick={()=>setShowPreview(false)}><div className="modal-panel" style={{maxWidth:540,padding:24}} onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={()=>setShowPreview(false)}>×</button>{settings.logo && <img src={settings.logo} alt="School logo" style={{width:80,height:80,objectFit:'contain'}} />}<h2>{settings.field1 || 'Sunrise Public School'}</h2><p>{settings.field7 || 'Excellence in Education, Values for Life'}</p><p>{settings.field9 || '123 Education Street'}, {settings.field13 || 'New Delhi'}</p><p>School code: {settings.field2 || 'SPS-DEL-01'}</p><p>Academic year: {academicYear}</p></div></Dialog>}
      {/* TOAST */}
      {showToast && toastVisible && (
        <div className="toast-stack">
          <div className={`toast ${showToast.type} ${toastRemoving ? 'removing' : ''}`}>
            <span>{showToast.type === 'success' ? '✅' : showToast.type === 'error' ? '❌' : showToast.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>{showToast.msg}</span>
          </div>
        </div>
      )}
    </Layout>
  )
}
