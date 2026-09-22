
/* Governance Intelligence layer: calculated posture, drift, Identity 360,
   privilege exposure, and effective access-path analysis. Read-only. */
(function(){
  const SNAPSHOT_KEY='aigc-governance-snapshot-v2:'+(window.LiveEntra?.tenantId||'tenant');

  function norm(v){return String(v||'').trim().toLowerCase()}
  function uniq(items,keyFn){
    const seen=new Set();
    return items.filter(item=>{const key=keyFn(item);if(seen.has(key))return false;seen.add(key);return true});
  }
  function isPrivilegedRole(role){
    return /global administrator|privileged role administrator|security administrator|authentication administrator|user administrator|owner|contributor|user access administrator|virtual machine contributor|key vault administrator|role based access control administrator/i.test(String(role||''));
  }
  function groupMap(){return new Map((state.groups||[]).map(g=>[g.id,g]))}

  function accessPathsForUser(u){
    const paths=[];
    const groupsById=groupMap();
    const memberships=(u.groups||[]).map(id=>groupsById.get(id)).filter(Boolean);
    const identities=new Set([norm(u.name),norm(u.upn)].filter(Boolean));

    for(const r of state.roleAssignments||[]){
      const accessState=r.accessState||'Active RBAC';
      if(identities.has(norm(r.principal))){
        paths.push({
          userId:u.id,user:u.name,kind:'Azure RBAC',source:'Direct',via:'Direct',
          accessState,
          role:r.role,scope:r.scope,privileged:!!r.privileged||isPrivilegedRole(r.role),
          nodes:[u.name,accessState,r.role,r.scope]
        });
      }
      for(const g of memberships){
        if(norm(r.principal)===norm(g.name)){
          paths.push({
            userId:u.id,user:u.name,kind:'Azure RBAC',source:'Group',via:g.name,
            accessState,
            role:r.role,scope:r.scope,privileged:!!r.privileged||isPrivilegedRole(r.role),
            nodes:[u.name,g.name,accessState,r.role,r.scope]
          });
        }
      }
    }

    const azureRoles=new Set(paths.filter(p=>p.kind==='Azure RBAC').map(p=>norm(p.role)));
    for(const role of u.roles||[]){
      if(!azureRoles.has(norm(role))){
        paths.push({
          userId:u.id,user:u.name,kind:'Directory role',source:'Directory',via:'Entra directory',
          role,scope:'Tenant directory',privileged:isPrivilegedRole(role),
          nodes:[u.name,'Entra directory',role,'Tenant']
        });
      }
    }

    for(const p of state.pim||[]){
      const matchesDirect=norm(p.user)===norm(u.name)||norm(p.user)===norm(u.upn)||String(p.principalId||'')===String(u.id||'');
      const group=memberships.find(g=>String(g.id||'')===String(p.principalId||'')||norm(g.name)===norm(p.user));
      if(!matchesDirect&&!group)continue;

      const stateLabel=p.state||'PIM';
      const kind=p.kind==='Azure resource PIM'?'Azure resource PIM':'Directory PIM';
      const source=group?'Group':(matchesDirect?'Direct':'PIM');
      const via=group?group.name:'Privileged Identity Management';
      const nodes=group
        ? [u.name,group.name,stateLabel,p.role,p.scope||'Tenant directory']
        : [u.name,stateLabel,p.role,p.scope||'Tenant directory'];

      paths.push({
        userId:u.id,user:u.name,kind,source,via,
        accessState:stateLabel,
        role:p.role,scope:p.scope||'Tenant directory',privileged:true,
        nodes
      });
    }

    return uniq(paths,p=>[p.kind,p.source,p.via,p.role,p.scope].map(norm).join('|'));
  }

  function allAccessPaths(){
    return (state.users||[]).flatMap(accessPathsForUser);
  }

  function governanceScore(){
    const users=state.users||[],groups=state.groups||[],risks=state.risks||[];
    const active=users.filter(u=>u.status==='Active');
    const observed=active.filter(u=>!liveTenantMode||u.mfaReadable===true);
    const mfaRate=observed.length?observed.filter(u=>u.mfa).length/observed.length:null;
    const auth=Math.round(mfaRate===null?13:mfaRate*25);

    const privilegedPaths=allAccessPaths().filter(p=>p.privileged);
    const directPriv=privilegedPaths.filter(p=>p.kind==='Azure RBAC'&&p.source==='Direct').length;
    const standingPim=privilegedPaths.filter(p=>p.kind==='PIM'&&p.source==='Active').length;
    const exposedUsers=new Set(privilegedPaths.map(p=>p.userId));
    const privilegedWithoutMfa=users.filter(u=>exposedUsers.has(u.id)&&u.mfaReadable!==false&&!u.mfa).length;
    const privilege=Math.max(0,25-Math.min(25,directPriv*2+standingPim*2+privilegedWithoutMfa*6));

    const disabledResidual=users.filter(u=>u.status==='Disabled'&&((u.groups||[]).length||(accessPathsForUser(u)||[]).length)).length;
    const guestPrivileged=users.filter(u=>String(u.type||'').toLowerCase()==='guest'&&accessPathsForUser(u).some(p=>p.privileged)).length;
    const lifecycle=Math.max(0,20-Math.min(20,disabledResidual*6+guestPrivileged*5));

    const ownerless=groups.filter(g=>!g.owner||/no owner returned/i.test(g.owner)).length;
    const groupGovernance=Math.max(0,15-Math.min(15,ownerless*3));

    const open=risks.filter(r=>(r.status||'Open')==='Open');
    const high=open.filter(r=>r.severity==='High').length;
    const medium=open.filter(r=>r.severity==='Medium').length;
    const low=open.filter(r=>r.severity==='Low').length;
    const riskHygiene=Math.max(0,15-Math.min(15,high*4+medium*2+low));

    const categories=[
      {name:'Authentication',score:auth,max:25,detail:mfaRate===null?'MFA telemetry limited':`${Math.round(mfaRate*100)}% observed MFA coverage`},
      {name:'Privileged access',score:privilege,max:25,detail:`${directPriv} direct privileged path(s) · ${privilegedWithoutMfa} privileged identity MFA gap(s)`},
      {name:'Lifecycle',score:lifecycle,max:20,detail:`${disabledResidual} disabled identity residual-access case(s) · ${guestPrivileged} privileged guest(s)`},
      {name:'Group governance',score:groupGovernance,max:15,detail:`${ownerless} ownerless group(s)`},
      {name:'Risk hygiene',score:riskHygiene,max:15,detail:`${high} high · ${medium} medium · ${low} low open finding(s)`}
    ];
    const score=categories.reduce((n,c)=>n+c.score,0);
    return {score,categories,observedMfaUsers:observed.length,totalActive:active.length};
  }

  function scoreClass(score){return score>=90?'good':score>=75?'blue':score>=60?'warn':'bad'}
  function scoreLabel(score){return score>=90?'Strong':score>=75?'Good':score>=60?'Needs attention':'Priority remediation'}

  function snapshotFromLive(live){
    return {
      syncedAt:live.syncedAt||new Date().toISOString(),
      users:(live.users||[]).map(u=>({
        id:u.id,name:u.name,upn:u.upn,status:u.status,mfa:u.mfa,mfaReadable:u.mfaReadable,
        groups:[...(u.groups||[])].sort(),roles:[...(u.roles||[])].sort()
      })).sort((a,b)=>String(a.id).localeCompare(String(b.id))),
      groups:(live.groups||[]).map(g=>({id:g.id,name:g.name})).sort((a,b)=>String(a.id).localeCompare(String(b.id))),
      rbac:(live.roleAssignments||[]).map(r=>({
        principal:r.principal,role:r.role,scope:r.scope,source:r.source,privileged:!!r.privileged
      })).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))
    };
  }
  function loadSnapshot(){try{return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||'null')}catch{return null}}
  function saveSnapshot(s){try{localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(s))}catch{}}
  function arrayDiff(a,b){const A=new Set(a||[]),B=new Set(b||[]);return {added:[...B].filter(x=>!A.has(x)),removed:[...A].filter(x=>!B.has(x))}}
  function rbacKey(r){return [r.principal,r.role,r.scope,r.source].map(norm).join('|')}

  function diffSnapshots(previous,current){
    if(!previous)return {baseline:true,previousSyncedAt:null,currentSyncedAt:current.syncedAt,changes:[]};
    const changes=[];
    const oldUsers=new Map((previous.users||[]).map(u=>[u.id,u]));
    const newUsers=new Map((current.users||[]).map(u=>[u.id,u]));
    const oldGroups=new Map((previous.groups||[]).map(g=>[g.id,g.name]));
    const newGroups=new Map((current.groups||[]).map(g=>[g.id,g.name]));

    for(const [id,u] of newUsers){
      const old=oldUsers.get(id);
      if(!old){changes.push({type:'Identity added',tone:'good',entity:u.name,detail:u.upn||id});continue}
      if(old.status!==u.status)changes.push({type:'Account state changed',tone:u.status==='Disabled'?'warn':'good',entity:u.name,detail:`${old.status} → ${u.status}`});
      if(old.mfaReadable&&u.mfaReadable&&old.mfa!==u.mfa)changes.push({type:'MFA posture changed',tone:u.mfa?'good':'warn',entity:u.name,detail:`${old.mfa?'Registered':'Missing'} → ${u.mfa?'Registered':'Missing'}`});

      const gd=arrayDiff(old.groups,u.groups);
      for(const gid of gd.added)changes.push({type:'Group membership added',tone:'blue',entity:u.name,detail:newGroups.get(gid)||gid});
      for(const gid of gd.removed)changes.push({type:'Group membership removed',tone:'neutral',entity:u.name,detail:oldGroups.get(gid)||gid});

      const rd=arrayDiff(old.roles,u.roles);
      for(const role of rd.added)changes.push({type:'Role granted',tone:isPrivilegedRole(role)?'warn':'blue',entity:u.name,detail:role});
      for(const role of rd.removed)changes.push({type:'Role revoked',tone:'good',entity:u.name,detail:role});
    }
    for(const [id,u] of oldUsers)if(!newUsers.has(id))changes.push({type:'Identity removed',tone:'warn',entity:u.name,detail:u.upn||id});

    const oldR=new Map((previous.rbac||[]).map(r=>[rbacKey(r),r]));
    const newR=new Map((current.rbac||[]).map(r=>[rbacKey(r),r]));
    for(const [key,r] of newR)if(!oldR.has(key))changes.push({type:'Azure RBAC granted',tone:r.privileged?'warn':'blue',entity:r.principal,detail:`${r.role} · ${r.scope} · ${r.source}`});
    for(const [key,r] of oldR)if(!newR.has(key))changes.push({type:'Azure RBAC revoked',tone:'good',entity:r.principal,detail:`${r.role} · ${r.scope} · ${r.source}`});

    return {baseline:false,previousSyncedAt:previous.syncedAt,currentSyncedAt:current.syncedAt,changes};
  }

  if(window.LiveEntra?.sync){
    const originalSync=window.LiveEntra.sync.bind(window.LiveEntra);
    window.LiveEntra.sync=async function(config){
      const live=await originalSync(config);
      const current=snapshotFromLive(live);
      const drift=diffSnapshots(loadSnapshot(),current);
      saveSnapshot(current);
      live.meta={...(live.meta||{}),tenantDrift:drift};
      return live;
    };
  }

  function scoreBreakdownHtml(result){
    return `<div class="intel-score-breakdown">
      ${result.categories.map(c=>`<div class="intel-score-row">
        <div><strong>${esc(c.name)}</strong><span>${esc(c.detail)}</span></div>
        <div class="intel-score-value">${c.score}/${c.max}</div>
        <div class="intel-meter"><span style="width:${Math.round(c.score/c.max*100)}%"></span></div>
      </div>`).join('')}
    </div>`;
  }

  function driftHtml(){
    const drift=liveTenantMeta?.tenantDrift;
    if(!liveTenantMode||!drift)return '';
    if(drift.baseline){
      return `<div class="card card-pad section-gap">
        <div class="card-header"><div><p class="eyebrow">Tenant drift detection</p><h2>Baseline captured</h2></div>${badge('Ready','good')}</div>
        <div class="callout">This sync is now the local governance baseline. On the next live sync, the console will compare identities, MFA posture, group memberships, roles, and Azure RBAC assignments and show exactly what changed.</div>
      </div>`;
    }
    const changes=drift.changes||[];
    const rows=changes.slice(0,20).map(c=>`<div class="drift-item">
      <div><strong>${esc(c.type)}</strong><span>${esc(c.entity)} · ${esc(c.detail)}</span></div>
      ${badge(c.type,c.tone||'neutral')}
    </div>`).join('');
    return `<div class="card card-pad section-gap">
      <div class="card-header"><div><p class="eyebrow">Tenant drift detection</p><h2>Changes since previous sync</h2><span class="muted">Compared with ${drift.previousSyncedAt?new Date(drift.previousSyncedAt).toLocaleString():'previous baseline'}</span></div>
      ${badge(`${changes.length} change${changes.length===1?'':'s'}`,changes.length?'warn':'good')}</div>
      <div class="drift-list">${rows||'<div class="empty">No identity, membership, MFA, role, or Azure RBAC drift detected.</div>'}</div>
      ${changes.length>20?`<div class="muted intel-footnote">Showing the first 20 of ${changes.length} detected changes.</div>`:''}
    </div>`;
  }

  const baseDashboard=dashboard;
  dashboard=function(){
    const result=governanceScore();
    let html=baseDashboard();
    html=html.replace('<div class="risk-score good">84</div>',`<div class="risk-score ${scoreClass(result.score)}" title="Calculated from current observable governance data">${result.score}</div>`);
    const marker='<div class="section-gap callout">This dashboard models the same governance concerns enterprise IAM teams monitor: authentication coverage, privileged access, entitlement approvals, lifecycle recertification, and policy enforcement.</div>';
    const replacement=`${scoreBreakdownHtml(result)}
      <div class="section-gap callout"><strong>${scoreLabel(result.score)} governance posture.</strong> This 0–100 score is calculated from current authentication coverage, privileged access, lifecycle hygiene, group ownership, and open governance findings. It is a portfolio heuristic, not a Microsoft Secure Score.</div>`;
    html=html.replace(marker,replacement);
    return html+driftHtml();
  };

  function pathChain(nodes){
    return `<div class="path-chain">${nodes.map(n=>`<span class="path-node">${esc(n)}</span>`).join('<span class="path-arrow">→</span>')}</div>`;
  }

  function identityRelatedAudit(u){
    const terms=[norm(u.name),norm(u.upn)].filter(Boolean);
    return (state.audit||[]).filter(a=>{
      const hay=norm([a.actor,a.actorUpn,a.target,a.action].join(' '));
      return terms.some(t=>t&&hay.includes(t));
    }).slice(0,8);
  }
  function identityFindings(u){
    const terms=[norm(u.name),norm(u.upn),norm(u.id)].filter(Boolean);
    return (state.risks||[]).filter(r=>{
      const hay=norm([r.entity,r.evidence,r.detail].join(' '));
      return terms.some(t=>t&&hay.includes(t));
    });
  }

  function openIdentity360(id){
    const u=(state.users||[]).find(x=>x.id===id);if(!u)return;
    const groupsById=groupMap();
    const groupNames=(u.groups||[]).map(gid=>groupsById.get(gid)?.name||gid);
    const paths=accessPathsForUser(u);
    const findings=identityFindings(u);
    const audits=identityRelatedAudit(u);
    const privileged=paths.filter(p=>p.privileged);
    const mfaText=u.mfaReadable===false?'Unavailable':(u.mfa?'Registered':'Missing');

    let modal=document.getElementById('identity360Modal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='identity360Modal';
      modal.className='modal-backdrop hidden';
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      modal.addEventListener('click',e=>{if(e.target===modal)closeIdentity360()});
      document.body.appendChild(modal);
    }

    modal.innerHTML=`<div class="modal intel-modal">
      <div class="modal-header">
        <div><p class="eyebrow">Identity 360</p><h2>${esc(u.name)}</h2><div class="muted">${esc(u.upn||u.id)}</div></div>
        <button class="icon-button" onclick="closeIdentity360()" aria-label="Close">×</button>
      </div>
      <div class="identity360-metrics">
        <div class="mini-stat"><strong>${esc(u.status)}</strong><span>Account</span></div>
        <div class="mini-stat"><strong>${esc(mfaText)}</strong><span>Strong auth</span></div>
        <div class="mini-stat"><strong>${groupNames.length}</strong><span>Groups</span></div>
        <div class="mini-stat"><strong>${paths.length}</strong><span>Access paths</span></div>
        <div class="mini-stat"><strong>${privileged.length}</strong><span>Privileged paths</span></div>
      </div>

      <div class="intel-modal-grid section-gap">
        <div class="intel-panel"><p class="eyebrow">Profile</p>
          <dl class="intel-dl"><dt>Department</dt><dd>${esc(u.dept||'Unassigned')}</dd><dt>Type</dt><dd>${esc(u.type||'Member')}</dd><dt>Recent sign-in</dt><dd>${esc(u.lastSignIn||'Unavailable')}</dd><dt>Risk</dt><dd>${esc(u.risk||'Unknown')}</dd></dl>
        </div>
        <div class="intel-panel"><p class="eyebrow">Group memberships</p>
          <div class="chip-list">${groupNames.length?groupNames.map(g=>badge(g,'blue')).join(''):'<span class="muted">No direct group memberships returned.</span>'}</div>
        </div>
      </div>

      <div class="intel-panel section-gap"><div class="card-header"><div><p class="eyebrow">Effective authorization</p><h3>Access paths</h3></div>${badge(`${paths.length} path${paths.length===1?'':'s'}`,paths.length?'blue':'neutral')}</div>
        <div class="path-list">${paths.length?paths.map(p=>`<div class="path-row"><div>${pathChain(p.nodes)}</div><div>${badge(p.source,p.source==='Group'?'good':p.source==='Direct'?'warn':'purple')} ${p.privileged?badge('Privileged','purple'):''}</div></div>`).join(''):'<div class="empty">No effective role paths returned for this identity.</div>'}</div>
      </div>

      <div class="intel-modal-grid section-gap">
        <div class="intel-panel"><p class="eyebrow">Governance findings</p>
          <div class="list">${findings.length?findings.map(r=>`<div class="list-item"><div><strong>${esc(r.title)}</strong><span>${esc(r.detail||r.evidence||'')}</span></div>${riskBadge(r.severity)}</div>`).join(''):'<div class="empty">No current findings linked to this identity.</div>'}</div>
        </div>
        <div class="intel-panel"><p class="eyebrow">Related audit activity</p>
          <div class="list">${audits.length?audits.map(a=>`<div class="list-item"><div><strong>${esc(a.action)}</strong><span>${esc(a.time)} · ${esc(a.actor)} · ${esc(a.target)}</span></div>${statusBadge(a.result)}</div>`).join(''):'<div class="empty">No related events in the current audit window.</div>'}</div>
        </div>
      </div>
    </div>`;
    modal.classList.remove('hidden');
  }
  function closeIdentity360(){document.getElementById('identity360Modal')?.classList.add('hidden')}
  window.openIdentity360=openIdentity360;
  window.closeIdentity360=closeIdentity360;

  const baseIdentities=identities;
  identities=function(){
    if(!liveTenantMode)return baseIdentities();
    const rows=filtered(state.users).map(u=>{
      const roleText=(u.roles||[]).length?u.roles.join(', '):'None';
      const groupNames=(u.groups||[]).map(id=>groupMap().get(id)?.name||id);
      const groupText=groupNames.length?groupNames.join(', '):'None';
      const mfaCell=u.mfaReadable?(u.mfa?badge('Registered','good'):badge('No strong method','warn')):badge('Unavailable','neutral');
      const paths=accessPathsForUser(u);
      return `<tr>
        <td class="name-cell"><button class="identity-link" onclick="openIdentity360('${esc(u.id)}')"><strong>${esc(u.name)}</strong><span>${esc(u.upn)}</span></button></td>
        <td>${esc(u.dept)}</td><td>${esc(u.type)}</td><td>${mfaCell}</td>
        <td class="wrap-cell">${esc(roleText)}</td><td class="wrap-cell">${esc(groupText)}</td>
        <td>${esc(u.lastSignIn)}</td><td>${statusBadge(u.status)}</td>
        <td><button class="button secondary" onclick="openIdentity360('${esc(u.id)}')">View 360</button><div class="muted intel-inline-note">${paths.length} effective path${paths.length===1?'':'s'}</div></td>
      </tr>`;
    }).join('');
    return tablePage('Live identity directory','Read-only workforce and guest identities synchronized from Microsoft Entra ID. Open Identity 360 for correlated authentication, membership, role, risk, and audit context.',['Identity','Department','Type','MFA / strong auth','Roles','Groups','Recent sign-in','Status','Identity 360'],rows);
  };

  function privilegeExposure(){
    return (state.users||[]).map(u=>{
      const paths=accessPathsForUser(u).filter(p=>p.privileged);
      const direct=paths.filter(p=>p.kind==='Azure RBAC'&&p.source==='Direct').length;
      const group=paths.filter(p=>p.kind==='Azure RBAC'&&p.source==='Group').length;
      const directory=paths.filter(p=>p.kind==='Directory role').length;
      const pim=paths.filter(p=>p.kind==='PIM').length;
      return {u,paths,direct,group,directory,pim};
    }).filter(x=>x.paths.length).sort((a,b)=>b.paths.length-a.paths.length||b.direct-a.direct||a.u.name.localeCompare(b.u.name));
  }

  function exposureHtml(){
    let entries=privilegeExposure();
    if(searchTerm){
      const q=searchTerm.toLowerCase();
      entries=entries.filter(e=>JSON.stringify(e).toLowerCase().includes(q));
    }
    const rows=entries.map(e=>`<tr>
      <td class="name-cell"><button class="identity-link" onclick="openIdentity360('${esc(e.u.id)}')"><strong>${esc(e.u.name)}</strong><span>${esc(e.u.upn||'')}</span></button></td>
      <td><strong>${e.paths.length}</strong></td>
      <td>${e.direct}</td><td>${e.group}</td><td>${e.directory}</td><td>${e.pim}</td>
      <td>${e.u.mfaReadable===false?badge('Unknown','neutral'):(e.u.mfa?badge('Registered','good'):badge('Missing','bad'))}</td>
      <td class="wrap-cell">${esc([...new Set(e.paths.map(p=>p.role))].join(', '))}</td>
    </tr>`).join('');
    return `<div class="card card-pad">
      <div class="card-header"><div><p class="eyebrow">Privilege exposure analyzer</p><h2>Effective privileged access</h2><div class="muted">Correlates direct Azure RBAC, group-derived RBAC, Entra directory roles, and PIM paths by identity.</div></div>${badge(`${entries.length} exposed identit${entries.length===1?'y':'ies'}`,entries.length?'purple':'good')}</div>
      <div class="callout">“Privileged paths” is an effective-access count for analysis, not a Microsoft risk score. Direct and group-derived Azure authorization are intentionally shown separately.</div>
      <div class="table-wrap section-gap"><table><thead><tr><th>Identity</th><th>Privileged paths</th><th>Direct RBAC</th><th>Group RBAC</th><th>Directory</th><th>PIM</th><th>MFA</th><th>Roles observed</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="8" class="empty">No privileged effective-access paths match the current filter.</td></tr>'}</tbody></table></div>
    </div>`;
  }

  function accessExplorerHtml(){
    let paths=allAccessPaths();
    if(searchTerm){
      const q=searchTerm.toLowerCase();
      paths=paths.filter(p=>JSON.stringify(p).toLowerCase().includes(q));
    }
    paths.sort((a,b)=>Number(b.privileged)-Number(a.privileged)||a.user.localeCompare(b.user)||a.role.localeCompare(b.role));
    const rows=paths.map(p=>`<tr>
      <td><button class="identity-link compact" onclick="openIdentity360('${esc(p.userId)}')"><strong>${esc(p.user)}</strong></button></td>
      <td>${pathChain(p.nodes)}</td>
      <td>${badge(p.source,p.source==='Group'?'good':p.source==='Direct'?'warn':'purple')}</td>
      <td>${p.privileged?badge('Privileged','purple'):badge('Standard','neutral')}</td>
    </tr>`).join('');
    return `<div class="card card-pad section-gap">
      <div class="card-header"><div><p class="eyebrow">Access path explorer</p><h2>Identity → authorization relationships</h2><div class="muted">Shows how each user reaches an effective role through direct assignment, group membership, Entra directory roles, or PIM.</div></div>${badge(`${paths.length} path${paths.length===1?'':'s'}`,'blue')}</div>
      <div class="table-wrap section-gap"><table><thead><tr><th>Identity</th><th>Effective access path</th><th>Source</th><th>Classification</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="4" class="empty">No effective-access paths match the current filter.</td></tr>'}</tbody></table></div>
    </div>`;
  }

  const baseRoles=roles;
  roles=function(){
    if(!liveTenantMode)return baseRoles();
    return exposureHtml()+accessExplorerHtml()+`<div class="section-gap">${baseRoles()}</div>`;
  };

  window.GovernanceIntelligence={
    governanceScore,
    accessPathsForUser,
    allAccessPaths,
    privilegeExposure
  };
})();
