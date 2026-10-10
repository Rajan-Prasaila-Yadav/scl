import { requirePermission } from '../lib/permissions'
import { exportToCSV, printToPDF } from '../lib/exportUtils'
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './Layout';
import RoleForm from './RoleFormModal';
import RoleDetail from './RoleDetailModal';
import {
  STORAGE_KEYS,
  INITIAL_ROLES,
  STAFF,
  makeId,
  readStoredList,
  writeStoredList
} from '../lib/academicData';

const MODULE_GROUPS = {
  People:['Students','Parents','Staff'],Academic:['Classes','Subjects','Timetable','Examinations','Attendance'],
  Operations:['Fees','Library','Transport','Hostel'],System:['Reports','Roles','Settings','Announcements']
};

function countModules(p){return Object.keys(p||{}).filter(k=>(p[k]||[]).length>0).length;}
function countActions(p){return Object.values(p||{}).reduce((s,a)=>s+(a||[]).length,0);}

export default function RolesPage() {
  // ── View State: 'list' | 'create' | 'edit' | 'detail' ──
  const [view, setView] = useState('list');
  const [roles, setRoles] = useState([]);
  const [loaded,setLoaded] = useState(false);
  const [staff, setStaff] = useState([]);
  const [activeRole, setActiveRole] = useState(null); // for edit/detail
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setRoles(readStoredList(STORAGE_KEYS.roles, INITIAL_ROLES));
    setStaff(readStoredList(STORAGE_KEYS.staff, STAFF));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      writeStoredList(STORAGE_KEYS.roles, roles);
    }
  }, [roles, loaded]);

  const rolesWithCounts = useMemo(() => {
    return roles.map(r => ({
      ...r,
      users: staff.filter(s => s.role === r.name).length
    }));
  }, [roles, staff]);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [viewMode, setViewMode] = useState('table');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState(null);
  const [kebabOpen, setKebabOpen] = useState(null);
  const perPage = 10;

  const showToast = (msg,type='info') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ── Navigation helpers ──
  const goList = () => { setView('list'); setActiveRole(null); };
  const goCreate = () => { setActiveRole(null); setView('create'); };
  const goEdit = (r) => { setActiveRole(r); setView('edit'); };
  const goDetail = (r) => { setActiveRole(r); setView('detail'); };

  // ── Filtered + Sorted ──
  const filtered = useMemo(() => {
    let r = [...rolesWithCounts];
    if(search){const q=search.toLowerCase();r=r.filter(x=>x.name.toLowerCase().includes(q)||x.code.toLowerCase().includes(q)||x.description.toLowerCase().includes(q));}
    if(filterType!=='all') r=r.filter(x=>x.type===filterType);
    if(filterStatus!=='all') r=r.filter(x=>x.status===filterStatus);
    r.sort((a,b)=>{
      let av,bv;
      if(sortKey==='name'){av=a.name.toLowerCase();bv=b.name.toLowerCase();}
      else if(sortKey==='type'){av=a.type;bv=b.type;}
      else if(sortKey==='users'){av=a.users;bv=b.users;}
      else if(sortKey==='modules'){av=countModules(a.permissions);bv=countModules(b.permissions);}
      else if(sortKey==='status'){av=a.status;bv=b.status;}
      else if(sortKey==='updatedAt'){av=a.updatedAt;bv=b.updatedAt;}
      else{av=a.name;bv=b.name;}
      if(av<bv)return sortDir==='asc'?-1:1;if(av>bv)return sortDir==='asc'?1:-1;return 0;
    });
    return r;
  },[roles,search,filterType,filterStatus,sortKey,sortDir]);

  const totalPages=Math.max(1,Math.ceil(filtered.length/perPage));
  useEffect(()=>setPage(p=>Math.min(p,totalPages)),[totalPages]);
  const paged=filtered.slice((page-1)*perPage,page*perPage);
  useEffect(()=>{setPage(1);},[search,filterType,filterStatus]);
  useEffect(()=>{const c=()=>setKebabOpen(null);document.addEventListener('click',c);return()=>document.removeEventListener('click',c);},[]);

  const stats = useMemo(()=>({
    total: roles.length,
    teaching: roles.filter(r=>r.type==='teaching').length,
    nonTeaching: roles.filter(r=>r.type==='non-teaching').length,
    activeUsers: staff.length
  }),[roles, staff]);

  const toggleSort=(k)=>{if(sortKey===k)setSortDir(d=>d==='asc'?'desc':'asc');else{setSortKey(k);setSortDir('asc');}};
  const SortIcon=({k})=>sortKey===k?<i className={`fa-solid fa-sort-${sortDir==='asc'?'up':'down'}`} style={{fontSize:10,marginLeft:4}}></i>:<i className="fa-solid fa-sort" style={{fontSize:9,marginLeft:4,opacity:.3}}></i>;

  // ── CRUD ──
  const handleSave=(data)=>{
    if (!requirePermission(activeRole ? 'edit' : 'create')) return

    if (!data.name?.trim() || roles.some(r => r.id !== activeRole?.id && r.name.trim().toLowerCase() === data.name.trim().toLowerCase())) { showToast("Use a unique role name", "error"); return; }
    if(activeRole && activeRole.name !== data.name) { const updated = staff.map(s => s.role === activeRole.name ? {...s, role:data.name} : s); if (!writeStoredList(STORAGE_KEYS.staff, updated)) return; setStaff(updated); }
    if(activeRole){
      setRoles(prev=>prev.map(r=>r.id===activeRole.id?{...r,...data,updatedAt:new Date().toISOString().slice(0,10)}:r));
      showToast('Role updated','success');
    }else{
      const code='ROLE-'+(data.type==='teaching'?'TEACH':'NT')+'-'+Date.now().toString(36).toUpperCase().slice(-3);
      setRoles(prev=>[...prev,{id:makeId(),code,...data,users:0,status:data.status || 'active',createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10),constraints:data.constraints || []}]);
      showToast('Role created','success');
    }
    goList();
  };
  const handleDelete=(role)=>{
    if (!requirePermission('delete')) return

    if(role.users>0){showToast(`Cannot delete "${role.name}" — ${role.users} users linked. Reassign first.`,'error');return;}
    if(!confirm(`Delete "${role.name}"?`))return;
    setRoles(prev=>prev.filter(r=>r.id!==role.id));setSelected(prev=>prev.filter(id=>id!==role.id));
    showToast('Role deleted','info');if(view!=='list')goList();
  };
  const handleToggleStatus=(role)=>{
    if (!requirePermission('edit')) return

    const next=role.status==='active'?'blocked':'active';
    setRoles(prev=>prev.map(r=>r.id===role.id?{...r,status:next,updatedAt:new Date().toISOString().slice(0,10)}:r));
    showToast(`Role ${next==='active'?'activated':'blocked'}`,next==='active'?'success':'info');
  };
  const handleClone=(role)=>{
    if (!requirePermission('create')) return

    const clone={...role,id:makeId(),name:role.name+' (Copy '+makeId().toString(36).slice(-4)+')',code:'ROLE-CLN-'+Date.now().toString(36).toUpperCase().slice(-3),users:0,status:'active',createdAt:new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString().slice(0,10),permissions:{...role.permissions}};
    setRoles(prev=>[...prev,clone]);showToast('Role cloned','success');
  };
  const toggleSelect=(id)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const toggleSelectAll=()=>{if(selected.length===paged.length)setSelected([]);else setSelected(paged.map(r=>r.id));};
  const bulkDelete=()=>{
    if (!requirePermission('delete')) return

    const linked=rolesWithCounts.filter(r=>selected.includes(r.id)&&r.users>0);
    if(linked.length){showToast(`${linked.length} role(s) have linked users.`,'error');return;}
    if(!confirm(`Delete ${selected.length} role(s)?`))return;
    setRoles(prev=>prev.filter(r=>!selected.includes(r.id)));setSelected([]);showToast('Roles deleted','info');
  };
  const exportData=(format)=>{
    const headers=['Name','Code','Type','Users','Status']; const rows=filtered.map(r=>[r.name,r.code,r.type,r.users,r.status]);
    if(format==='pdf') printToPDF('Roles and permissions',headers,rows); else exportToCSV('roles.csv',headers,rows);
  };

  return (
    <Layout>
      {/* ════════ CREATE / EDIT PAGE ════════ */}
      {(view==='create'||view==='edit') && (
        <RoleForm role={activeRole} allRoles={roles} onCancel={goList} onSave={handleSave} />
      )}

      {/* ════════ DETAIL PAGE ════════ */}
      {view==='detail' && activeRole && (
        <RoleDetail role={rolesWithCounts.find(r=>r.id===activeRole.id) || activeRole} onBack={goList} onEdit={goEdit} onClone={handleClone} onToggleStatus={handleToggleStatus} onDelete={handleDelete} />
      )}

      {/* ════════ LIST PAGE ════════ */}
      {view==='list' && (<>
        {/* Header */}
        <div className="settings-header">
          <div><h1><i className="fa-solid fa-shield-halved" style={{color:'var(--accent)',marginRight:8}}></i>Roles &amp; Permissions</h1><p>Create and manage teaching and non-teaching access across all modules</p></div>
          <div className="settings-actions">
            <button className="btn btn-ghost btn-sm" onClick={()=>exportData('pdf')}><i className="fa-solid fa-file-pdf"></i> PDF</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>exportData('excel')}><i className="fa-solid fa-file-excel"></i> CSV</button>
            <button className="btn btn-primary btn-sm" onClick={goCreate}><i className="fa-solid fa-plus"></i> Add Role</button>
          </div>
        </div>

        {/* Stats */}
        <div className="roles-stats">
          <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--accentbg)',color:'var(--accent)'}}><i className="fa-solid fa-layer-group"></i></div><div><div className="stat-card-value">{stats.total}</div><div className="stat-card-label">Total Roles</div></div></div>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--tealbg)',color:'var(--teal)'}}><i className="fa-solid fa-chalkboard-user"></i></div><div><div className="stat-card-value">{stats.teaching}</div><div className="stat-card-label">Teaching</div></div></div>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--amberbg)',color:'var(--amber)'}}><i className="fa-solid fa-gear"></i></div><div><div className="stat-card-value">{stats.nonTeaching}</div><div className="stat-card-label">Non-Teaching</div></div></div>
          <div className="stat-card"><div className="stat-card-icon" style={{background:'var(--purplebg)',color:'var(--purple)'}}><i className="fa-solid fa-users"></i></div><div><div className="stat-card-value">{stats.activeUsers}</div><div className="stat-card-label">Mapped Users</div></div></div>
        </div>

        {/* Toolbar */}
        <div className="roles-toolbar">
          <div className="roles-search"><i className="fa-solid fa-magnifying-glass"></i><input aria-label="Search role name, code..." placeholder="Search role name, code..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Close" className="roles-search-clear" onClick={()=>setSearch('')}><i className="fa-solid fa-xmark"></i></button>}</div>
          <select aria-label="Type" className="roles-filter" value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="all">All Types</option><option value="teaching">Teaching</option><option value="non-teaching">Non-Teaching</option></select>
          <select aria-label="Status" className="roles-filter" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value="all">All Status</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
          {(filterType!=='all'||filterStatus!=='all'||search)&&<button className="btn btn-ghost btn-sm" onClick={()=>{setSearch('');setFilterType('all');setFilterStatus('all');}}><i className="fa-solid fa-rotate-left"></i> Reset</button>}
          <div className="roles-view-toggle">
            <button className={viewMode==='table'?'active':''} onClick={()=>setViewMode('table')}><i className="fa-solid fa-table-list"></i></button>
            <button className={viewMode==='card'?'active':''} onClick={()=>setViewMode('card')}><i className="fa-solid fa-grip"></i></button>
          </div>
        </div>

        {/* Bulk */}
        {selected.length>0&&(<div className="roles-bulk-bar"><span><strong>{selected.length}</strong> selected</span><button className="btn btn-ghost btn-sm" onClick={()=>exportData('excel')}><i className="fa-solid fa-download"></i> Export</button><button className="btn btn-ghost btn-sm" style={{color:'var(--red)'}} onClick={bulkDelete}><i className="fa-solid fa-trash"></i> Delete</button><button className="btn btn-ghost btn-sm" onClick={()=>setSelected([])}><i className="fa-solid fa-xmark"></i> Clear</button></div>)}

        {/* TABLE */}
        {viewMode==='table'&&(
          <div className="roles-table-card">
            <div className="table-wrap"><table className="roles-table"><thead><tr>
              <th style={{width:40}}><input aria-label="Select record" type="checkbox" checked={paged.length>0&&selected.length===paged.length} onChange={toggleSelectAll}/></th>
              <th onClick={()=>toggleSort('name')} style={{cursor:'pointer'}}>Role Name <SortIcon k="name"/></th>
              <th onClick={()=>toggleSort('type')} style={{cursor:'pointer'}}>Type <SortIcon k="type"/></th>
              <th onClick={()=>toggleSort('modules')} style={{cursor:'pointer'}}>Access <SortIcon k="modules"/></th>
              <th onClick={()=>toggleSort('users')} style={{cursor:'pointer'}}>Users <SortIcon k="users"/></th>
              <th onClick={()=>toggleSort('updatedAt')} style={{cursor:'pointer'}}>Updated <SortIcon k="updatedAt"/></th>
              <th onClick={()=>toggleSort('status')} style={{cursor:'pointer'}}>Status <SortIcon k="status"/></th>
              <th style={{textAlign:'right'}}>Actions</th>
            </tr></thead><tbody>
              {paged.length===0?<tr><td colSpan={8} className="roles-empty"><i className="fa-solid fa-shield-halved"></i><br/>No roles found</td></tr>:paged.map(r=>(
                <tr key={r.id} className={selected.includes(r.id)?'selected':''}>
                  <td><input aria-label="Select record" type="checkbox" checked={selected.includes(r.id)} onChange={()=>toggleSelect(r.id)}/></td>
                  <td><div className="roles-name-cell"><div className="roles-name-icon" style={{background:r.type==='teaching'?'var(--accentbg)':'var(--amberbg)',color:r.type==='teaching'?'var(--accent)':'var(--amber)'}}><i className={`fa-solid ${r.type==='teaching'?'fa-chalkboard-user':'fa-gear'}`}></i></div><div><div className="roles-name-text">{r.name}</div><div className="roles-name-code">{r.code}</div></div></div></td>
                  <td><span className={`badge ${r.type==='teaching'?'badge-teal':'badge-purple'}`}>{r.type==='teaching'?'🎓 Teaching':'⚙️ Non-Teaching'}</span></td>
                  <td><span className="badge badge-blue">{countModules(r.permissions)} modules</span></td>
                  <td><span style={{fontWeight:700}}>{r.users}</span></td>
                  <td><span style={{fontSize:12,color:'var(--t2)'}}>{r.updatedAt}</span></td>
                  <td><span className={`badge ${r.status==='active'?'badge-active':'badge-blocked'}`}>{r.status==='active'?'● Active':'● Blocked'}</span></td>
                  <td style={{textAlign:'right'}}><div className="roles-actions">
                    <button aria-label="View" className="btn-icon-sm" onClick={()=>goDetail(r)} title="View"><i className="fa-solid fa-eye"></i></button>
                    <button aria-label="Edit" className="btn-icon-sm" onClick={()=>goEdit(r)} title="Edit"><i className="fa-solid fa-pen"></i></button>
                    <div className="kebab-wrap">
                      <button aria-label="More actions" className="btn-icon-sm" onClick={e=>{e.stopPropagation();setKebabOpen(kebabOpen===r.id?null:r.id);}}><i className="fa-solid fa-ellipsis-vertical"></i></button>
                      {kebabOpen===r.id&&<div className="kebab-menu" onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>{handleClone(r);setKebabOpen(null);}}><i className="fa-solid fa-copy"></i> Clone</button>
                        <button onClick={()=>{handleToggleStatus(r);setKebabOpen(null);}}><i className={`fa-solid ${r.status==='active'?'fa-ban':'fa-check'}`}></i> {r.status==='active'?'Block':'Activate'}</button>
                        <button className="danger" onClick={()=>{handleDelete(r);setKebabOpen(null);}}><i className="fa-solid fa-trash"></i> Delete</button>
                      </div>}
                    </div>
                  </div></td>
                </tr>
              ))}
            </tbody></table></div>
            <div className="roles-table-footer">
              <span>Showing {Math.min((page-1)*perPage+1,filtered.length)}–{Math.min(page*perPage,filtered.length)} of {filtered.length}</span>
              <div className="roles-pagination">
                <button aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><i className="fa-solid fa-chevron-left"></i></button>
                {Array.from({length:totalPages},(_,i)=><button key={i+1} className={page===i+1?'active':''} onClick={()=>setPage(i+1)}>{i+1}</button>)}
                <button aria-label="Next page" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}><i className="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
        )}

        {/* CARDS */}
        {viewMode==='card'&&(
          <div className="roles-card-grid">
            {filtered.length===0?<div className="roles-empty-card"><i className="fa-solid fa-shield-halved"></i><br/>No roles found</div>:filtered.map(r=>(
              <div role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); e.currentTarget.click() } }} key={r.id} className="role-card" onClick={()=>goDetail(r)}>
                <div className="role-card-head"><div className="role-card-icon" style={{background:r.type==='teaching'?'var(--accentbg)':'var(--amberbg)',color:r.type==='teaching'?'var(--accent)':'var(--amber)'}}><i className={`fa-solid ${r.type==='teaching'?'fa-chalkboard-user':'fa-gear'}`}></i></div><div style={{flex:1}}><div className="role-card-name">{r.name}</div><div className="role-card-code">{r.code}</div></div><span className={`badge ${r.status==='active'?'badge-active':'badge-blocked'}`}>{r.status}</span></div>
                <div className="role-card-desc">{r.description.length>80 ? r.description.slice(0,80)+'…' : r.description}</div>
                <div className="role-card-stats"><span><i className="fa-solid fa-users"></i> {r.users} users</span><span><i className="fa-solid fa-cubes"></i> {countModules(r.permissions)} modules</span><span><i className="fa-solid fa-key"></i> {countActions(r.permissions)} perms</span></div>
                <div className="role-card-tags">{Object.keys(r.permissions).slice(0,4).map(m=><span key={m} className="badge badge-blue" style={{fontSize:10}}>{m}</span>)}{Object.keys(r.permissions).length>4&&<span className="badge" style={{fontSize:10,background:'var(--bg4)',color:'var(--t3)'}}>+{Object.keys(r.permissions).length-4}</span>}</div>
                <div className="role-card-foot"><span style={{fontSize:11,color:'var(--t3)'}}>Updated {r.updatedAt}</span><div className="roles-actions" onClick={e=>e.stopPropagation()}><button aria-label="Edit" className="btn-icon-sm" onClick={()=>goEdit(r)}><i className="fa-solid fa-pen"></i></button><button className="btn-icon-sm" onClick={()=>handleClone(r)}><i className="fa-solid fa-copy"></i></button><button aria-label="Delete" className="btn-icon-sm danger" onClick={()=>handleDelete(r)}><i className="fa-solid fa-trash"></i></button></div></div>
              </div>
            ))}
          </div>
        )}
      </>)}

      {/* Toast */}
      {toast&&<div className={`roles-toast roles-toast-${toast.type}`}><i className={`fa-solid ${toast.type==='success'?'fa-check-circle':toast.type==='error'?'fa-exclamation-circle':'fa-info-circle'}`}></i> {toast.msg}</div>}
    </Layout>
  );
}