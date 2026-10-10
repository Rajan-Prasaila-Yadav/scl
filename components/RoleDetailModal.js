import { STORAGE_KEYS, STAFF, readStoredList } from '../lib/academicData'
import { exportToCSV } from '../lib/exportUtils'
import React, { useState } from 'react';

function countModules(p){return Object.keys(p||{}).filter(k=>(p[k]||[]).length>0).length;}
function countActions(p){return Object.values(p||{}).reduce((s,a)=>s+(a||[]).length,0);}

export default function RoleDetail({ role, onBack, onEdit, onClone, onToggleStatus, onDelete }) {
  const [tab,setTab] = useState('overview');
  const [permSearch,setPermSearch] = useState('');
  const [permFilter,setPermFilter] = useState('all');
  const [userSearch,setUserSearch] = useState('');
  const linkedUsers = readStoredList(STORAGE_KEYS.staff, STAFF).filter(s=>s.role===role.name).map(s=>({...s,empId:s.employeeId || s.empId || String(s.id),dept:s.department || '—',joined:s.joiningDate || '—'}));
  const AUDIT_LOG = [{date:role.createdAt,user:'Local record',action:'Created'},{date:role.updatedAt,user:'Local record',action:'Last updated — detailed history is not recorded'}];
  const filteredUsers = linkedUsers.filter(u=>!userSearch||u.name.toLowerCase().includes(userSearch.toLowerCase())||u.empId.toLowerCase().includes(userSearch.toLowerCase()));

  const exportRole=()=>exportToCSV('role-permissions.csv',['Module','Actions'],Object.entries(role.permissions || {}).map(([module,actions])=>[module,actions.join(', ')]));

  const tabs=[{key:'overview',icon:'fa-circle-info',label:'Overview'},{key:'permissions',icon:'fa-key',label:'Permissions'},{key:'users',icon:'fa-users',label:`Users (${role.users})`},{key:'audit',icon:'fa-clock-rotate-left',label:'Audit'}];

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="settings-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button aria-label="Back" className="btn btn-ghost btn-sm" onClick={onBack}><i className="fa-solid fa-arrow-left"></i></button>
          <div><h1>{role.name}</h1><p>System &gt; Roles &amp; Permissions &gt; {role.name}</p></div>
        </div>
        <div className="settings-actions">
          <button className="btn btn-ghost btn-sm" onClick={()=>onEdit(role)}><i className="fa-solid fa-pen"></i> Edit</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>onClone(role)}><i className="fa-solid fa-copy"></i> Clone</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>onToggleStatus(role)}><i className={`fa-solid ${role.status==='active'?'fa-ban':'fa-check'}`}></i> {role.status==='active'?'Block':'Activate'}</button>
          <button aria-label="Delete" className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={()=>onDelete(role)}><i className="fa-solid fa-trash"></i></button>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="roles-table-card" style={{marginBottom:18}}>
        <div className="role-detail-profile">
          <div className="role-detail-info">
            <div className="role-detail-icon" style={{background:role.type==='teaching'?'var(--accentbg)':'var(--amberbg)',color:role.type==='teaching'?'var(--accent)':'var(--amber)'}}>
              <i className={`fa-solid ${role.type==='teaching'?'fa-chalkboard-user':'fa-gear'}`}></i>
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:16}}>{role.name}</div>
              <div style={{fontSize:13,color:'var(--t2)',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:4}}>
                <span className={`badge ${role.type==='teaching'?'badge-teal':'badge-purple'}`}>{role.type}</span>
                <span className={`badge ${role.status==='active'?'badge-active':'badge-blocked'}`}>{role.status}</span>
                <span>Code: {role.code}</span>
              </div>
              <div style={{fontSize:12,color:'var(--t3)',marginTop:4}}>{role.description}</div>
            </div>
          </div>
          <div className="role-detail-health">
            <div className="role-health-item"><span className="role-health-val">{role.users}</span><span className="role-health-lbl">Users</span></div>
            <div className="role-health-item"><span className="role-health-val">{countModules(role.permissions)}</span><span className="role-health-lbl">Modules</span></div>
            <div className="role-health-item"><span className="role-health-val">{countActions(role.permissions)}</span><span className="role-health-lbl">Perms</span></div>
            <div className="role-health-item"><span className="role-health-val">{(role.constraints||[]).length}</span><span className="role-health-lbl">Rules</span></div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="role-detail-tabs">
          {tabs.map(t=><button key={t.key} className={tab===t.key?'active':''} onClick={()=>setTab(t.key)}><i className={`fa-solid ${t.icon}`}></i> {t.label}</button>)}
        </div>

        {/* ── Tab Content ── */}
        <div style={{padding:22}}>

          {/* OVERVIEW */}
          {tab==='overview'&&(
            <div className="role-overview-grid">
              <div className="role-overview-card">
                <h4><i className="fa-solid fa-id-card"></i> Identity</h4>
                <div className="role-overview-row"><span>Name</span><span>{role.name}</span></div>
                <div className="role-overview-row"><span>Code</span><span>{role.code}</span></div>
                <div className="role-overview-row"><span>User Type</span><span className={`badge ${role.type==='teaching'?'badge-teal':'badge-purple'}`}>{role.type}</span></div>
                <div className="role-overview-row"><span>Status</span><span className={`badge ${role.status==='active'?'badge-active':'badge-blocked'}`}>{role.status}</span></div>
                <div className="role-overview-row"><span>Created</span><span>{role.createdAt}</span></div>
                <div className="role-overview-row"><span>Updated</span><span>{role.updatedAt}</span></div>
              </div>
              <div className="role-overview-card">
                <h4><i className="fa-solid fa-shield-halved"></i> Scope &amp; Rules</h4>
                {(role.constraints||[]).length>0?(role.constraints||[]).map(c=><div key={c} className="role-overview-row"><span>{c.replace(/_/g,' ')}</span><span className="badge badge-active">Enabled</span></div>)
                :<div style={{fontSize:12,color:'var(--t3)',padding:'8px 0'}}>No constraints set</div>}
              </div>
            </div>
          )}

          {/* PERMISSIONS */}
          {tab==='permissions'&&(
            <div>
              <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                <div className="roles-search" style={{flex:1,minWidth:180}}><i className="fa-solid fa-magnifying-glass"></i><input aria-label="Search modules..." placeholder="Search modules..." value={permSearch} onChange={e=>setPermSearch(e.target.value)}/></div>
                <select aria-label="Perm Filter" className="roles-filter" value={permFilter} onChange={e=>setPermFilter(e.target.value)}><option value="all">All</option><option value="enabled">Enabled Only</option></select>
                <button className="btn btn-ghost btn-sm" onClick={()=>exportRole('xlsx')}><i className="fa-solid fa-download"></i> CSV</button>
              </div>
              {Object.entries(role.permissions||{}).filter(([mod,acts])=>{if(permFilter==='enabled'&&acts.length===0)return false;if(permSearch&&!mod.toLowerCase().includes(permSearch.toLowerCase()))return false;return true;}).map(([mod,acts])=>(
                <div key={mod} className="perm-detail-row"><div className="perm-detail-module">{mod}</div><div className="perm-detail-actions">{acts.map(a=><span key={a} className="badge badge-blue" style={{fontSize:10}}>{a}</span>)}</div></div>
              ))}
              {Object.keys(role.permissions||{}).length===0&&<div style={{textAlign:'center',color:'var(--t3)',padding:30}}>No permissions configured</div>}
            </div>
          )}

          {/* USERS */}
          {tab==='users'&&(
            <div>
              <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                <div className="roles-search" style={{flex:1,minWidth:180}}><i className="fa-solid fa-magnifying-glass"></i><input aria-label="Search staff..." placeholder="Search staff..." value={userSearch} onChange={e=>setUserSearch(e.target.value)}/></div>
                <button className="btn btn-ghost btn-sm" onClick={()=>exportRole('xlsx')}><i className="fa-solid fa-download"></i> Export</button>
              </div>
              {filteredUsers.length===0?<div style={{textAlign:'center',color:'var(--t3)',padding:30}}>No users linked</div>:(
                <div className="table-wrap"><table className="roles-table"><thead><tr><th>Staff Name</th><th>Employee ID</th><th>Department</th><th>Joined</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th></tr></thead><tbody>
                  {filteredUsers.map((u,i)=><tr key={i}><td><strong>{u.name}</strong></td><td style={{fontSize:12,color:'var(--t2)'}}>{u.empId}</td><td>{u.dept}</td><td style={{fontSize:12,color:'var(--t2)'}}>{u.joined}</td><td><span className="badge badge-active">Active</span></td><td style={{textAlign:'right'}}><a className="btn btn-ghost btn-xs" href="/staff">Manage in Staff</a></td></tr>)}
                </tbody></table></div>
              )}
              {role.users>linkedUsers.length&&<div style={{fontSize:12,color:'var(--t3)',marginTop:10,textAlign:'center'}}>Showing {linkedUsers.length} of {role.users} users</div>}
            </div>
          )}

          {/* AUDIT */}
          {tab==='audit'&&(
            <div className="role-audit-timeline">
              {AUDIT_LOG.map((log,i)=><div key={i} className="role-audit-item"><div className="role-audit-dot"></div><div className="role-audit-content"><div className="role-audit-date">{log.date}</div><div className="role-audit-action"><strong>{log.user}</strong> — {log.action}</div></div></div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}