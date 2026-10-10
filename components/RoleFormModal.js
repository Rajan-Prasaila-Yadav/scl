import React, { useState } from 'react';

const MODULE_GROUPS = {
  People:[{key:'Students',actions:['view','create','edit','delete','block','unblock','export']},{key:'Parents',actions:['view','create','edit','delete','export']},{key:'Staff',actions:['view','create','edit','delete','block','unblock','export']}],
  Academic:[{key:'Classes',actions:['view','create','edit','delete','export','assign']},{key:'Subjects',actions:['view','create','edit','delete','export','assign']},{key:'Timetable',actions:['view','create','edit','delete','export']},{key:'Examinations',actions:['view','create','edit','delete','export','approve']},{key:'Attendance',actions:['view','create','edit','delete','export']}],
  Operations:[{key:'Fees',actions:['view','create','edit','delete','export','approve']},{key:'Library',actions:['view','create','edit','delete','export']},{key:'Transport',actions:['view','create','edit','delete','export']},{key:'Hostel',actions:['view','create','edit','delete','export']}],
  System:[{key:'Reports',actions:['view','export']},{key:'Roles',actions:['view','create','edit','delete']},{key:'Settings',actions:['view','edit']},{key:'Announcements',actions:['view','create','edit','delete']}],
};

const TEMPLATES = [
  {name:'Senior Teacher',type:'teaching',permissions:{Students:['view','export'],Classes:['view','edit','export','assign'],Subjects:['view','edit','export','assign'],Timetable:['view','edit','export'],Examinations:['view','create','edit','export','approve'],Attendance:['view','create','edit','export'],Library:['view','export'],Reports:['view','export']}},
  {name:'Librarian',type:'non-teaching',permissions:{Library:['view','create','edit','delete','export'],Students:['view'],Staff:['view'],Reports:['view']}},
  {name:'Accountant',type:'non-teaching',permissions:{Fees:['view','create','edit','export','approve'],Students:['view'],Staff:['view'],Reports:['view','export']}},
];
const CONSTRAINTS = [{key:'own_campus',label:'Restrict to own campus'},{key:'assigned_classes',label:'Restrict to assigned classes only'},{key:'cross_campus',label:'Allow cross-campus reporting'},{key:'export_pii',label:'Allow data export with personal identifiers'}];

export default function RoleForm({ role, allRoles, onCancel, onSave }) {
  const isEdit = !!role;
  const [step,setStep] = useState(1);
  const [name,setName] = useState(role?.name||'');
  const [type,setType] = useState(role?.type||'teaching');
  const [description,setDescription] = useState((role?.description||'').slice(0, 80));
  const [status,setStatus] = useState(role?.status||'active');
  const [permissions,setPermissions] = useState(role?.permissions||{});
  const [constraints,setConstraints] = useState(role?.constraints||['own_campus','assigned_classes']);
  const [matrixSearch,setMatrixSearch] = useState('');
  const [expandedGroups,setExpandedGroups] = useState(Object.keys(MODULE_GROUPS));

  const hasPerm=(mod,act)=>(permissions[mod]||[]).includes(act);
  const togglePerm=(mod,act)=>setPermissions(p=>{const c=p[mod]||[];return{...p,[mod]:c.includes(act)?c.filter(a=>a!==act):[...c,act]};});
  const toggleModuleAll=(mod,actions)=>{const c=permissions[mod]||[];const on=actions.every(a=>c.includes(a));setPermissions(p=>({...p,[mod]:on?[]:[...actions]}));};
  const toggleGroupAll=(group)=>{const mods=MODULE_GROUPS[group];const on=mods.every(m=>(permissions[m.key]||[]).length===m.actions.length);const p={...permissions};mods.forEach(m=>{p[m.key]=on?[]:[...m.actions];});setPermissions(p);};
  const toggleGroup=(g)=>setExpandedGroups(p=>p.includes(g)?p.filter(x=>x!==g):[...p,g]);
  const toggleConstraint=(k)=>setConstraints(p=>p.includes(k)?p.filter(x=>x!==k):[...p,k]);
  const applyTemplate=(t)=>{setName(t.name);setType(t.type);setPermissions({...t.permissions});setStep(3);};
  const countMods=()=>Object.keys(permissions).filter(k=>(permissions[k]||[]).length>0).length;
  const countActs=()=>Object.values(permissions).reduce((s,a)=>s+(a||[]).length,0);
  const handleSubmit=()=>{if(!name.trim()){alert('Role name required');setStep(1);return;}onSave({name:name.trim(),type,description:description.trim(),status,permissions,constraints});};

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="settings-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button aria-label="Back" className="btn btn-ghost btn-sm" onClick={onCancel}><i className="fa-solid fa-arrow-left"></i></button>
          <div><h1><i className={`fa-solid ${isEdit?'fa-pen':'fa-plus'}`} style={{color:'var(--accent)',marginRight:8}}></i>{isEdit?'Edit Role':'Add New Role'}</h1><p>Define role identity and fine-grained permissions</p></div>
        </div>
        <div className="settings-actions">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          {step<5?<button className="btn btn-primary btn-sm" onClick={()=>setStep(s=>s+1)}>Next <i className="fa-solid fa-arrow-right"></i></button>
          :<button className="btn btn-primary btn-sm" onClick={handleSubmit}><i className="fa-solid fa-floppy-disk"></i> {isEdit?'Update':'Create'}</button>}
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="role-stepper" style={{borderRadius:'var(--radius-md)',marginBottom:18,border:'1px solid var(--border)'}}>
        {[{n:1,l:'Identity'},{n:2,l:'Preset'},{n:3,l:'Permissions'},{n:4,l:'Constraints'},{n:5,l:'Summary'}].map(s=>(
          <button key={s.n} className={`role-step ${step===s.n?'active':''} ${step>s.n?'done':''}`} onClick={()=>setStep(s.n)}>
            <span className="role-step-num">{step>s.n?'✓':s.n}</span> {s.l}
          </button>
        ))}
      </div>

      {isEdit&&role.users>0&&step===1&&<div className="role-warning" style={{marginBottom:16}}><i className="fa-solid fa-triangle-exclamation"></i> This role is assigned to <strong>{role.users}</strong> users. Changes apply immediately.</div>}

      {/* ── Step 1: Identity ── */}
      {step===1&&(
        <div className="roles-table-card" style={{padding:22}}>
          <div className="section-divider" style={{marginTop:0}}><span className="section-divider-label">Role Identity</span><div className="section-divider-line"></div></div>
          <div className="role-form-grid">
            <div className="form-group"><label className="form-label">Role Name <span className="req">*</span></label><input aria-label="Role Name" className="form-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Senior Teacher"/></div>
            <div className="form-group"><label className="form-label">User Type <span className="req">*</span></label><select aria-label="User Type" className="form-select" value={type} onChange={e=>setType(e.target.value)}><option value="teaching">Teaching</option><option value="non-teaching">Non-Teaching</option></select></div>
            <div className="form-group" style={{gridColumn:'1/-1'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <label className="form-label">Description</label>
                <span style={{fontSize:11,color:description.length >= 80 ? 'var(--red)' : 'var(--t3)',fontWeight:500}}>
                  {description.length}/80 characters
                </span>
              </div>
              <textarea aria-label="What does this role do? (Max 80 characters)" 
                className="form-input" 
                rows={3} 
                value={description} 
                onChange={e=>setDescription(e.target.value.slice(0, 80))} 
                placeholder="What does this role do? (Max 80 characters)"
                maxLength={80}
              />
            </div>
            <div className="form-group"><label className="form-label">Status</label><select aria-label="Status" className="form-select" value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Active</option><option value="blocked">Blocked</option></select></div>
          </div>
        </div>
      )}

      {/* ── Step 2: Preset ── */}
      {step===2&&(
        <div className="roles-table-card" style={{padding:22}}>
          <div className="role-preset-row" style={{marginBottom:18}}>
            <button className="role-preset-btn" onClick={()=>{setPermissions({});setStep(3);}}><i className="fa-solid fa-file-circle-plus"></i><span>Start Blank</span><small>Empty permission set</small></button>
          </div>
          <div className="section-divider"><span className="section-divider-label">Use a Template</span><div className="section-divider-line"></div></div>
          <div className="role-template-grid">
            {TEMPLATES.map(t=><button key={t.name} className="role-template-card" onClick={()=>applyTemplate(t)}><div className="role-template-name">{t.name}</div><div className="role-template-type"><span className={`badge ${t.type==='teaching'?'badge-teal':'badge-purple'}`}>{t.type}</span></div><div className="role-template-info">{Object.keys(t.permissions).length} modules</div></button>)}
          </div>
          {allRoles&&allRoles.length>0&&(<>
            <div className="section-divider" style={{marginTop:18}}><span className="section-divider-label">Clone Existing Role</span><div className="section-divider-line"></div></div>
            <div className="role-template-grid">{allRoles.slice(0,6).map(r=><button key={r.id} className="role-template-card" onClick={()=>{setPermissions({...r.permissions});setConstraints([...(r.constraints||[])]);setStep(3);}}><div className="role-template-name">{r.name}</div><div className="role-template-info">{Object.keys(r.permissions||{}).length} modules</div></button>)}</div>
          </>)}
        </div>
      )}

      {/* ── Step 3: Permission Matrix ── */}
      {step===3&&(
        <div className="roles-table-card" style={{padding:22}}>
          <div className="role-matrix-toolbar"><div className="roles-search" style={{flex:1}}><i className="fa-solid fa-magnifying-glass"></i><input aria-label="Search modules..." placeholder="Search modules..." value={matrixSearch} onChange={e=>setMatrixSearch(e.target.value)}/></div></div>
          {Object.entries(MODULE_GROUPS).map(([group,modules])=>{
            const fm=modules.filter(m=>!matrixSearch||m.key.toLowerCase().includes(matrixSearch.toLowerCase()));
            if(!fm.length)return null;
            const isExp=expandedGroups.includes(group);
            const allOn=fm.every(m=>(permissions[m.key]||[]).length===m.actions.length);
            return(<div key={group} className="perm-group">
              <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} className="perm-group-header" onClick={()=>toggleGroup(group)}>
                <i className={`fa-solid fa-chevron-${isExp?'down':'right'}`} style={{fontSize:11,width:16}}></i>
                <span className="perm-group-title">{group}</span>
                <span className="perm-group-count">{fm.filter(m=>(permissions[m.key]||[]).length>0).length}/{fm.length} enabled</span>
                <button className="perm-toggle-all" onClick={e=>{e.stopPropagation();toggleGroupAll(group);}}>{allOn?'Deselect All':'Select All'}</button>
              </div>
              {isExp&&fm.map(mod=>{const cur=permissions[mod.key]||[];const mAllOn=cur.length===mod.actions.length;return(
                <div key={mod.key} className="perm-module-row">
                  <div className="perm-module-name"><input aria-label="Select record" type="checkbox" checked={mAllOn} onChange={()=>toggleModuleAll(mod.key,mod.actions)}/><span>{mod.key}</span><span className="perm-module-count">{cur.length}/{mod.actions.length}</span></div>
                  <div className="perm-actions">{mod.actions.map(act=><label key={act} className={`perm-action ${hasPerm(mod.key,act)?'checked':''}`}><input type="checkbox" checked={hasPerm(mod.key,act)} onChange={()=>togglePerm(mod.key,act)}/><span>{act}</span></label>)}</div>
                </div>
              );})}
            </div>);
          })}
        </div>
      )}

      {/* ── Step 4: Constraints ── */}
      {step===4&&(
        <div className="roles-table-card" style={{padding:22}}>
          <p style={{fontSize:13,color:'var(--t2)',marginBottom:16}}>Set scope restrictions to control data visibility boundaries.</p>
          <p>Scope constraints are planning metadata in this UI prototype; they do not filter records.</p>{CONSTRAINTS.map(c=><label key={c.key} className="role-constraint-row"><input type="checkbox" checked={constraints.includes(c.key)} onChange={()=>toggleConstraint(c.key)}/><span>{c.label}</span></label>)}
        </div>
      )}

      {/* ── Step 5: Summary ── */}
      {step===5&&(
        <div className="roles-table-card" style={{overflow:'hidden'}}>
          {/* Profile Header — same style as Detail page */}
          <div className="role-detail-profile">
            <div className="role-detail-info">
              <div className="role-detail-icon" style={{background:type==='teaching'?'var(--accentbg)':'var(--amberbg)',color:type==='teaching'?'var(--accent)':'var(--amber)'}}>
                <i className={`fa-solid ${type==='teaching'?'fa-chalkboard-user':'fa-gear'}`}></i>
              </div>
              <div>
                <div style={{fontWeight:700,fontSize:16}}>{name || 'Untitled Role'}</div>
                <div style={{fontSize:13,color:'var(--t2)',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:4}}>
                  <span className={`badge ${type==='teaching'?'badge-teal':'badge-purple'}`}>{type==='teaching'?'🎓 Teaching':'⚙️ Non-Teaching'}</span>
                  <span className={`badge ${status==='active'?'badge-active':'badge-blocked'}`}>{status==='active'?'● Active':'● Blocked'}</span>
                </div>
                {description&&<div style={{fontSize:12,color:'var(--t3)',marginTop:4}}>{description}</div>}
              </div>
            </div>
            <div className="role-detail-health">
              <div className="role-health-item"><span className="role-health-val">{countMods()}</span><span className="role-health-lbl">Modules</span></div>
              <div className="role-health-item"><span className="role-health-val">{countActs()}</span><span className="role-health-lbl">Actions</span></div>
              <div className="role-health-item"><span className="role-health-val">{constraints.length}</span><span className="role-health-lbl">Rules</span></div>
            </div>
          </div>

          {/* Overview Grid — same as Detail overview tab */}
          <div style={{padding:22}}>
            <div className="role-overview-grid">
              <div className="role-overview-card">
                <h4><i className="fa-solid fa-id-card"></i> Identity</h4>
                <div className="role-overview-row"><span>Role Name</span><span>{name||'—'}</span></div>
                <div className="role-overview-row"><span>User Type</span><span className={`badge ${type==='teaching'?'badge-teal':'badge-purple'}`}>{type}</span></div>
                <div className="role-overview-row"><span>Status</span><span className={`badge ${status==='active'?'badge-active':'badge-blocked'}`}>{status}</span></div>
                <div className="role-overview-row"><span>Modules Enabled</span><span>{countMods()}</span></div>
                <div className="role-overview-row"><span>Total Actions</span><span>{countActs()}</span></div>
              </div>
              <div className="role-overview-card">
                <h4><i className="fa-solid fa-shield-halved"></i> Scope &amp; Rules</h4>
                {constraints.length>0?constraints.map(c=><div key={c} className="role-overview-row"><span>{c.replace(/_/g,' ')}</span><span className="badge badge-active">Planned</span></div>)
                :<div style={{fontSize:12,color:'var(--t3)',padding:'8px 0'}}>No constraints set</div>}
              </div>
            </div>

            {/* Permission Detail — same as Detail permissions tab */}
            <div style={{marginTop:18}}>
              <div className="section-divider"><span className="section-divider-label">Enabled Permissions</span><div className="section-divider-line"></div></div>
              {Object.entries(permissions).filter(([,a])=>a.length>0).length>0 ? (
                Object.entries(permissions).filter(([,a])=>a.length>0).map(([mod,acts])=>(
                  <div key={mod} className="perm-detail-row">
                    <div className="perm-detail-module">{mod}</div>
                    <div className="perm-detail-actions">{acts.map(a=><span key={a} className="badge badge-blue" style={{fontSize:10}}>{a}</span>)}</div>
                  </div>
                ))
              ) : (
                <div style={{textAlign:'center',color:'var(--t3)',padding:24,fontSize:13}}>No permissions configured — go back to Step 3 to add access.</div>
              )}
            </div>

            {/* ── Final Action Area ── */}
            <div style={{marginTop:28,padding:24,background:'var(--bg3)',borderRadius:'var(--radius-md)',border:'1px solid var(--border)',textAlign:'center'}}>
              <div style={{fontSize:36,marginBottom:8}}>{isEdit ? '✏️' : '🚀'}</div>
              <div style={{fontSize:16,fontWeight:700,color:'var(--t1)',marginBottom:6}}>
                {isEdit ? 'Ready to Update Role' : 'Ready to Create Role'}
              </div>
              <div style={{fontSize:13,color:'var(--t2)',marginBottom:20,maxWidth:440,margin:'0 auto 20px'}}>
                {isEdit
                  ? `Review the changes above. Click the button below to update "${name || 'this role'}" with the new configuration.`
                  : `Everything looks good! Click the button below to create "${name || 'this role'}" with ${countMods()} modules and ${countActs()} permission actions.`}
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} style={{padding:'12px 32px',fontSize:'0.95rem',gap:10,boxShadow:'0 4px 20px var(--accentglow)'}}>
                <i className={`fa-solid ${isEdit ? 'fa-check-circle' : 'fa-plus-circle'}`}></i>
                {isEdit ? 'Update Role & Permissions' : 'Create Role & Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:18}}>
        <div>{step>1&&<button className="btn btn-ghost" onClick={()=>setStep(s=>s-1)}><i className="fa-solid fa-arrow-left"></i> Back</button>}</div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          {step<5?<button className="btn btn-primary" onClick={()=>setStep(s=>s+1)}>Next <i className="fa-solid fa-arrow-right"></i></button>
          :<button className="btn btn-primary" onClick={handleSubmit}><i className="fa-solid fa-floppy-disk"></i> {isEdit?'Update Role':'Create Role'}</button>}
        </div>
      </div>
    </div>
  );
}