import React, { useState } from 'react'
import { normalizeRelationship, relationshipError } from '../lib/billing'

export default function PayerRelationships({ values, onChange }) {
  const [editing,setEditing]=useState('')
  const [name,setName]=useState('')
  const [error,setError]=useState('')
  function save() {
    const next=normalizeRelationship(name), issue=relationshipError(next,values,editing)
    if(issue) {setError(issue);return}
    if(onChange(editing?values.map(item=>item===editing?next:item):[...values,next])===false) return
    setEditing('');setName('');setError('')
  }
  return <details style={{margin:'12px 0',padding:12,border:'1px solid var(--border)',borderRadius:8}}><summary>Manage payer relationships</summary>
    <p>Rename or remove future dropdown choices. Existing receipts keep the relationship recorded at payment time.</p>
    {values.map(value=><div key={value} style={{display:'flex',gap:8,alignItems:'center',margin:'6px 0'}}><span style={{flex:1}}>{value}</span><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{setEditing(value);setName(value);setError('')}}>Edit {value}</button><button type="button" className="btn btn-ghost btn-sm" onClick={()=>{if(onChange(values.filter(v=>v!==value))!==false && editing===value){setEditing('');setName('')}}}>Remove {value}</button></div>)}
    <label>Specific relationship<input aria-label="Relationship name" className="form-input" maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="For example, Grandfather"/></label>
    {error && <p role="alert">{error}</p>}<button type="button" className="btn btn-primary btn-sm" onClick={save}>{editing?'Update relationship':'Add relationship'}</button>{editing && <button type="button" className="btn btn-ghost btn-sm" onClick={()=>{setEditing('');setName('')}}>Cancel rename</button>}
  </details>
}
