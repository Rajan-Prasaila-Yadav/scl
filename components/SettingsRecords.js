import { useState } from 'react'
import { saveAttachment, downloadAttachment } from '../lib/attachments'
import { canPerform } from '../lib/permissions'

export function BrandingEditor({ settings, setSettings }) {
  const [error, setError] = useState('')
  function upload(key, file) {
    if (!file) return
    if (!['image/png','image/jpeg','image/x-icon','image/vnd.microsoft.icon'].includes(file.type) || file.size > 250 * 1024) { setError('Use a PNG, JPEG or ICO image smaller than 250 KB.'); return }
    const reader = new FileReader()
    reader.onload = () => { setSettings(s => ({...s,[key]:reader.result})); setError('') }
    reader.onerror = () => setError('Could not read this image.')
    reader.readAsDataURL(file)
  }
  return <div><div className="branding-items">{['logo','stamp','signature','favicon'].map(key => <div className="branding-item" key={key}>
    <div className="preview-box">{settings[key] ? <img src={settings[key]} alt={key} style={{maxWidth:'100%',maxHeight:80}} /> : '🏫'}</div>
    <label htmlFor={'brand-'+key}>{key[0].toUpperCase()+key.slice(1)}</label>
    <input id={'brand-'+key} type="file" accept="image/png,image/jpeg,image/x-icon" disabled={!canPerform('edit','Settings')} onChange={e => upload(key,e.target.files?.[0])} />
    <button className="btn btn-ghost" disabled={!settings[key] || !canPerform('edit','Settings')} onClick={() => setSettings(s=>({...s,[key]:''}))}>Remove {key}</button>
  </div>)}</div>{error && <p role="alert">{error}</p>}<p>Images are stored in this browser when you save changes.</p></div>
}

export function EmergencyContacts({ settings, setSettings }) {
  const contacts = settings.emergencyContacts || [{name:'Principal Office',phone:'+91 1111 22222'},{name:'Emergency Coordinator',phone:'+91 3333 44444'}]
  const update = (index,key,value) => setSettings(s=>({...s,emergencyContacts:contacts.map((item,i)=>i===index?{...item,[key]:value}:item)}))
  return <div className="emergency-card"><h3>Emergency contacts</h3>{contacts.map((item,index)=><div className="form-grid" key={index}>
    <label>Name<input className="form-input" value={item.name} onChange={e=>update(index,'name',e.target.value)} /></label>
    <label>Phone<input className="form-input" type="tel" value={item.phone} onChange={e=>update(index,'phone',e.target.value)} /></label>
    <button className="btn btn-ghost" onClick={()=>setSettings(s=>({...s,emergencyContacts:contacts.filter((_,i)=>i!==index)}))}>Remove contact</button>
  </div>)}<button className="btn btn-ghost" onClick={()=>setSettings(s=>({...s,emergencyContacts:[...contacts,{name:'',phone:''}]}))}>Add emergency contact</button></div>
}

export function ComplianceEditor({ settings, setSettings }) {
  const [error,setError] = useState('')
  const records = settings.complianceRecords || []
  const documents = settings.policyDocuments || []
  const today = new Date().toISOString().slice(0,10)
  const update = (index,key,value) => setSettings(s=>({...s,complianceRecords:records.map((r,i)=>i===index?{...r,[key]:value}:r)}))
  async function upload(file) {
    if (!file || !canPerform('edit','Settings')) return
    try { const attachmentId=await saveAttachment(file); setSettings(s=>({...s,policyDocuments:[...(s.policyDocuments || []),{name:file.name,attachmentId}]})); setError('') }
    catch(e){setError(e.message)}
  }
  return <div><p>Keep local records of certificates and policies. Status reflects the expiry dates you enter.</p>
    {records.map((record,index)=><div className="form-grid" key={index}>
      <label>Certificate<input className="form-input" value={record.name} onChange={e=>update(index,'name',e.target.value)} /></label>
      <label>Registration number<input className="form-input" value={record.number} onChange={e=>update(index,'number',e.target.value)} /></label>
      <label>Expiry date<input className="form-input" type="date" value={record.expiry} onChange={e=>update(index,'expiry',e.target.value)} /></label>
      <p>{!record.expiry?'Expiry not recorded':record.expiry<today?'Expired':'Within recorded validity period'}</p>
      <button className="btn btn-ghost" onClick={()=>setSettings(s=>({...s,complianceRecords:records.filter((_,i)=>i!==index)}))}>Remove certificate</button>
    </div>)}
    <button className="btn btn-primary" onClick={()=>setSettings(s=>({...s,complianceRecords:[...records,{name:'',number:'',expiry:''}]}))}>Add certificate</button>
    <h3>Policy documents</h3><label>Upload policy (maximum 10 MB)<input type="file" onChange={e=>upload(e.target.files?.[0])} /></label>
    {documents.map((doc,index)=><div key={doc.attachmentId}><span>{doc.name}</span> <button className="btn btn-ghost" onClick={()=>downloadAttachment(doc)}>Download</button> <button className="btn btn-ghost" onClick={()=>setSettings(s=>({...s,policyDocuments:documents.filter((_,i)=>i!==index)}))}>Remove</button></div>)}
    {error && <p role="alert">{error}</p>}
  </div>
}
