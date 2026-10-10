import { getRaw, setRaw } from '../lib/storage'
import React, { useEffect, useState } from 'react'

function Toasts({ toasts, remove }) {
  useEffect(() => {
    toasts.forEach(t => {
      if (!t._timer) {
        t._timer = setTimeout(() => remove(t.id), 3200)
      }
    })
  }, [toasts, remove])
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type || 'info'}`}>
          <span>{t.icon || ''}</span> {t.msg}
        </div>
      ))}
    </div>
  )
}

export default function SettingsTabs() {
  const tabs = ['general', 'branding', 'contact', 'finance', 'compliance']
  const [active, setActive] = useState('general')
  const [board, setBoard] = useState('cbse')
  const [otherBoard, setOtherBoard] = useState('')
  const [country, setCountry] = useState('india')
  const [timezone, setTimezone] = useState('IST')
  const [swatches, setSwatches] = useState(['#6366F1','#2563EB','#7C3AED','#D946EF','#EA580C','#16A34A'])
  const [activeSwatch, setActiveSwatch] = useState(swatches[0])
  const [toggles, setToggles] = useState({ email:true, sms:true, whatsapp:false, marketing:false })
  const [toasts, setToasts] = useState([])

  const [academicYears, setAcademicYears] = useState(['2025–2026', '2026–2027', '2027–2028'])
  const [academicYear, setAcademicYear] = useState('2026–2027')
  const [newYearInput, setNewYearInput] = useState('')
  const [showAddYearForm, setShowAddYearForm] = useState(false)

  // Load saved configurations from localStorage
  useEffect(() => {
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

  // Load saved accent color from localStorage
  useEffect(() => {
    const saved = getRaw('accentColor')
    if (saved) setActiveSwatch(saved)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', activeSwatch)
    document.documentElement.style.setProperty('--accent2', activeSwatch + 'CC')
    document.querySelectorAll('.sb-logo, .school-logo, .sb-avatar').forEach(el => {
      el && (el.style.background = `linear-gradient(135deg, ${activeSwatch}, #7C3AED)`)
    })
  }, [activeSwatch])

  useEffect(() => {
    setTimezone(country === 'india' ? 'IST' : 'NPT')
  }, [country])

  function showToast(msg, type='info'){
    const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' }
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, msg, type, icon: icons[type] }])
  }
  function removeToast(id){ setToasts(t => t.filter(x=>x.id!==id)) }

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
      showToast('Format must be YYYY–YYYY (e.g. 2027–2028)', 'error')
      return
    }
    const formatted = cleanInput.replace('-', '–')
    if (academicYears.includes(formatted)) {
      showToast('Academic year already exists', 'warning')
      return
    }
    const updated = [...academicYears, formatted].sort()
    setAcademicYears(updated)
    setRaw('academicYears', JSON.stringify(updated))
    setNewYearInput('')
    setShowAddYearForm(false)
    showToast(`Academic year ${formatted} added!`, 'success')
    window.dispatchEvent(new Event('academicYearChanged'))
  }

  return (
    <>
      <div className="tabs-nav" id="tabsNav">
        {tabs.map(t => (
          <button key={t} className={t===active ? 'active' : ''} onClick={()=>setActive(t)} data-tab={t}>{t==='general'?'📋 General':t==='branding'?'🎨 Branding':t==='contact'?'📞 Contact':t==='finance'?'💰 Finance':'⚖️ Compliance'}</button>
        ))}
      </div>

      <div className={`tab-content ${active==='general' ? 'active' : ''}`} id="tab-general">
        <div className="section-divider">
          <span className="section-divider-label">🏛️ Basic Information</span>
          <div className="section-divider-line"></div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>School Name <span className="req">*</span></label>
            <input aria-label="School Name" className="form-input" defaultValue="Sunrise Public School" />
          </div>
          <div className="form-group">
            <label>School Code <span className="req">*</span></label>
            <input aria-label="School Code" className="form-input" defaultValue="SPS-DEL-01" />
          </div>
          <div className="form-group">
            <label>Board <span className="req">*</span></label>
            <select className="form-select" value={board} onChange={e=>setBoard(e.target.value)} id="boardSelect">
              <optgroup label="National Boards">
                <option value="cbse">CBSE</option>
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
          {board === 'other' && (
            <div className="form-group">
              <label>Specify Board Name <span className="req">*</span></label>
              <input className="form-input" value={otherBoard} onChange={e=>setOtherBoard(e.target.value)} id="otherBoardInput" />
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
        </div>
      </div>

      <div className={`tab-content ${active==='branding' ? 'active' : ''}`} id="tab-branding">
        <div className="branding-grid">
          <div>
            <div className="section-divider">
              <span className="section-divider-label">🎨 Visual Identity</span>
              <div className="section-divider-line"></div>
            </div>
            <div className="branding-items">
              <div className="branding-item"><div className="preview-box">🏫</div><div className="branding-label">School Logo</div></div>
              <div className="branding-item"><div className="preview-box">📜</div><div className="branding-label">Stamp</div></div>
              <div className="branding-item"><div className="preview-box">✍️</div><div className="branding-label">Signature</div></div>
              <div className="branding-item"><div className="preview-box">🔗</div><div className="branding-label">Favicon</div></div>
            </div>
          </div>
          <div className="branding-preview">
            <h5>Brand Preview</h5>
            <div className="identity-card-preview">
              <div className="preview-logo">🏫</div>
              <h6>Sunrise Public School</h6>
              <p className="preview-detail">Inspire · Learn · Achieve</p>
              <div className="preview-detail">Code: SPS-DEL-01</div>
              <div className="preview-detail">Board: CBSE</div>
              <div className="preview-detail">Type: Co-Educational</div>
              <div className="preview-footer">Excellence in Education</div>
            </div>
            <div className="theme-picker">
              <span style={{fontSize:12,fontWeight:600,color:'var(--t2)'}}>Theme Accent:</span>
              {swatches.map(s => (
                <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} key={s} className={"swatch" + (s===activeSwatch? ' active':'')} style={{background:s}} data-color={s} onClick={() => { setActiveSwatch(s); setRaw('accentColor', s) }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`tab-content ${active==='contact' ? 'active' : ''}`} id="tab-contact">
        <div className="two-col">
          <div>
            <div className="section-divider"><span className="section-divider-label">📞 Contact Details</span><div className="section-divider-line"></div></div>
            <div className="form-grid">
              <div className="form-group"><label>Primary Phone <span className="req">*</span></label><input aria-label="Primary Phone" className="form-input" defaultValue="+91 98765 43210" /></div>
              <div className="form-group"><label>Email <span className="req">*</span></label><input aria-label="Email" className="form-input" defaultValue="info@sunrisepublic.edu" /></div>
            </div>
            <div className="section-divider"><span className="section-divider-label">🌐 Social Links</span><div className="section-divider-line"></div></div>
            <div className="form-grid">
              <div className="form-group"><label>Facebook</label><input aria-label="Facebook" className="form-input" defaultValue="facebook.com/sunrisepublic" /></div>
              <div className="form-group"><label>Instagram</label><input aria-label="Instagram" className="form-input" defaultValue="instagram.com/sunrisepublic" /></div>
            </div>
          </div>
          <div>
            <div className="emergency-card">
              <h5><i className="fa-solid fa-phone" style={{color:'var(--red)'}}></i> Emergency Contacts</h5>
              <div className="emergency-item"><div><div className="ec-name">Principal Office</div><div style={{fontSize:11,color:'var(--t3)'}}>Primary Office</div></div><div className="ec-phone">📞 +91 1111 22222</div></div>
            </div>
            <div className="emergency-card" style={{marginTop:12}}>
              <h5><i className="fa-solid fa-bell" style={{color:'var(--accent)'}}></i> Communication Preferences</h5>
              {Object.entries(toggles).map(([k,v])=> (
                <div className="toggle-row" key={k}>
                  <span style={{fontSize:13}}>{k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g,' $1')}</span>
                  <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className={"toggle-switch" + (v? ' active':'')} onClick={()=>setToggles(t=>({...t,[k]:!t[k]}))}><div className="knob"></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`tab-content ${active==='finance' ? 'active' : ''}`} id="tab-finance">
        <div className="two-col">
          <div>
            <div className="section-divider"><span className="section-divider-label">💰 Currency & Financial Year</span><div className="section-divider-line"></div></div>
            <div className="form-grid">
              <div className="form-group"><label>Base Currency <span className="req">*</span></label><select aria-label="Base Currency" className="form-select"><option>Indian Rupee (INR) — ₹</option></select></div>
              <div className="form-group"><label>Currency Symbol</label><input aria-label="Currency Symbol" className="form-input" defaultValue="₹" /></div>
            </div>
          </div>
          <div>
            <div className="finance-summary"><h5 style={{fontSize:14,fontWeight:600,marginBottom:12}}>📊 Finance Summary</h5><div className="stat-row"><span className="stat-label">Base Currency</span><span className="stat-value">Indian Rupee (INR)</span></div></div>
          </div>
        </div>
      </div>

      <div className={`tab-content ${active==='compliance' ? 'active' : ''}`} id="tab-compliance">
        <div className="two-col">
          <div>
            <div className="section-divider"><span className="section-divider-label">📋 Registration & Legal</span><div className="section-divider-line"></div></div>
            <div className="form-grid"><div className="form-group"><label>Registration Number <span className="req">*</span></label><input aria-label="Registration Number" className="form-input" defaultValue="REG/2020/12345" /></div></div>
            <table className="compliance-table"><thead><tr><th>Compliance</th><th>Certificate No.</th><th>Issued On</th><th>Valid Upto</th><th>Status</th><th>Actions</th></tr></thead><tbody><tr><td>Fire Safety</td><td>FSC/2024/11223</td><td>10 Jan 2024</td><td>09 Jan 2025</td><td><span className="badge badge-active">✅ Valid</span></td><td><button aria-label="Edit" className="btn btn-icon btn-xs"><i className="fa-solid fa-pen"></i></button></td></tr></tbody></table>
          </div>
          <div>
            <div className="emergency-card"><h5><i className="fa-solid fa-file-lines" style={{color:'var(--accent)'}}></i> Policies & Documents</h5>
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border2)',fontSize:13}}>
                <span>📄 School Policy Manual</span>
                <button className="btn btn-ghost btn-xs"><i className="fa-solid fa-download"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toasts toasts={toasts} remove={removeToast} />
    </>
  )
}
