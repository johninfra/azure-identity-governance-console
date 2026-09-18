const STORAGE_KEY="aigc-state-v1";
const seed={
 users:[
  {id:"U001",name:"Olivia Brown",upn:"olivia.brown@contoso.com",dept:"Finance",type:"Member",mfa:true,risk:"Low",status:"Active",manager:"Marcus Lee",lastSignIn:"2h ago",roles:["Reader"]},
  {id:"U002",name:"Ethan Carter",upn:"ethan.carter@contoso.com",dept:"Engineering",type:"Member",mfa:true,risk:"Low",status:"Active",manager:"Priya Shah",lastSignIn:"18m ago",roles:["Contributor"]},
  {id:"U003",name:"Maya Patel",upn:"maya.patel@contoso.com",dept:"Security",type:"Member",mfa:true,risk:"Low",status:"Active",manager:"Daniel Kim",lastSignIn:"42m ago",roles:["Security Reader"]},
  {id:"U004",name:"Noah Williams",upn:"noah.williams@contoso.com",dept:"Operations",type:"Member",mfa:false,risk:"High",status:"Active",manager:"Ava Morgan",lastSignIn:"9d ago",roles:["Reader"]},
  {id:"U005",name:"Sophia Chen",upn:"sophia.chen@contoso.com",dept:"HR",type:"Member",mfa:true,risk:"Medium",status:"Active",manager:"Grace Hall",lastSignIn:"1d ago",roles:["User Administrator"]},
  {id:"U006",name:"Liam Johnson",upn:"liam.johnson@contoso.com",dept:"Engineering",type:"Member",mfa:true,risk:"Low",status:"Active",manager:"Priya Shah",lastSignIn:"3h ago",roles:["Virtual Machine Contributor"]},
  {id:"U007",name:"Emma Davis",upn:"emma.davis@contoso.com",dept:"Legal",type:"Guest",mfa:false,risk:"Medium",status:"Active",manager:"Marcus Lee",lastSignIn:"31d ago",roles:["Reader"]},
  {id:"U008",name:"Jack Wilson",upn:"jack.wilson@contoso.com",dept:"Finance",type:"Member",mfa:true,risk:"Low",status:"Disabled",manager:"Marcus Lee",lastSignIn:"65d ago",roles:[]}
 ],
 groups:[
  {id:"G001",name:"SG-Finance-Readers",type:"Security",members:18,owner:"Marcus Lee",dynamic:false},
  {id:"G002",name:"SG-Helpdesk-Tier2",type:"Security",members:12,owner:"Ava Morgan",dynamic:false},
  {id:"G003",name:"SG-Security-Operations",type:"Security",members:9,owner:"Daniel Kim",dynamic:true},
  {id:"G004",name:"SG-Azure-VM-Contributors",type:"Security",members:7,owner:"Priya Shah",dynamic:false},
  {id:"G005",name:"M365-All-Employees",type:"Microsoft 365",members:142,owner:"Grace Hall",dynamic:true}
 ],
 roleAssignments:[
  {principal:"SG-Finance-Readers",role:"Reader",scope:"rg-finance-prod",source:"Group",privileged:false},
  {principal:"Ethan Carter",role:"Contributor",scope:"rg-app-production",source:"Direct",privileged:true},
  {principal:"SG-Security-Operations",role:"Security Reader",scope:"Subscription: Corporate Azure",source:"Group",privileged:false},
  {principal:"Sophia Chen",role:"User Administrator",scope:"Tenant directory",source:"Direct",privileged:true},
  {principal:"SG-Azure-VM-Contributors",role:"Virtual Machine Contributor",scope:"rg-compute-production",source:"Group",privileged:true}
 ],
 requests:[
  {id:"REQ-1042",userId:"U001",role:"Virtual Machine Contributor",scope:"rg-app-production",duration:"8 hours",justification:"Quarter-end application validation.",status:"Pending",submitted:"Today 08:14",approver:"Marcus Lee"},
  {id:"REQ-1041",userId:"U006",role:"Key Vault Secrets User",scope:"rg-app-production",duration:"24 hours",justification:"Deployment troubleshooting for production release.",status:"Approved",submitted:"Yesterday",approver:"Priya Shah"},
  {id:"REQ-1038",userId:"U005",role:"Contributor",scope:"rg-data-platform",duration:"30 days",justification:"Temporary project administration.",status:"Denied",submitted:"Sep 15",approver:"Grace Hall"}
 ],
 pim:[
  {id:"PIM-01",user:"Ethan Carter",role:"Contributor",scope:"rg-app-production",state:"Eligible",expires:"Oct 01",max:"8h",mfa:true,approval:true},
  {id:"PIM-02",user:"Sophia Chen",role:"User Administrator",scope:"Tenant directory",state:"Active",expires:"Today 17:30",max:"4h",mfa:true,approval:true},
  {id:"PIM-03",user:"Maya Patel",role:"Security Administrator",scope:"Tenant directory",state:"Eligible",expires:"Nov 15",max:"2h",mfa:true,approval:true}
 ],
 reviews:[
  {id:"AR-2026-09-01",name:"Quarterly privileged-role review",scope:"Privileged directory roles",reviewers:"Security Governance",progress:72,due:"Sep 25",status:"In progress"},
  {id:"AR-2026-09-02",name:"Finance production access",scope:"SG-Finance-Readers",reviewers:"Finance Managers",progress:44,due:"Sep 22",status:"In progress"},
  {id:"AR-2026-08-07",name:"Guest account recertification",scope:"External identities",reviewers:"Application Owners",progress:100,due:"Completed",status:"Completed"}
 ],
 risks:[
  {id:"R-01",severity:"High",title:"MFA not registered",entity:"Noah Williams",detail:"Active member account has no registered MFA method.",status:"Open"},
  {id:"R-02",severity:"Medium",title:"Dormant guest account",entity:"Emma Davis",detail:"Guest has not signed in for more than 30 days.",status:"Open"},
  {id:"R-03",severity:"Medium",title:"Privileged direct assignment",entity:"Sophia Chen",detail:"User Administrator is directly assigned rather than eligible through PIM.",status:"Open"},
  {id:"R-04",severity:"High",title:"Stale disabled-account role history",entity:"Jack Wilson",detail:"Disabled account requires final access recertification.",status:"Open"}
 ],
 policies:[
  {name:"CA001 - Require MFA for administrators",state:"On",users:"Directory roles",apps:"All cloud apps",grant:"Require MFA",risk:"High"},
  {name:"CA002 - Block legacy authentication",state:"On",users:"All users",apps:"All cloud apps",grant:"Block access",risk:"Low"},
  {name:"CA003 - Require compliant device for finance",state:"On",users:"Finance",apps:"Finance apps",grant:"Compliant device",risk:"Medium"},
  {name:"CA004 - Guest access baseline",state:"Report-only",users:"Guests",apps:"Selected apps",grant:"MFA",risk:"Medium"}
 ],
 audit:[
  {time:"09:34",actor:"John Tyler",action:"Access review viewed",target:"AR-2026-09-01",result:"Success"},
  {time:"09:16",actor:"Security Automation",action:"Risk detected",target:"Noah Williams",result:"Alert"},
  {time:"08:58",actor:"Priya Shah",action:"PIM activation approved",target:"Sophia Chen",result:"Success"},
  {time:"08:14",actor:"Olivia Brown",action:"Access request submitted",target:"REQ-1042",result:"Success"},
  {time:"Yesterday",actor:"Identity Governance",action:"Guest inactivity scan",target:"Emma Davis",result:"Alert"}
 ]
};
let state=loadState();let currentView="dashboard";let searchTerm="";
const el=id=>document.getElementById(id);
function loadState(){try{const v=localStorage.getItem(STORAGE_KEY);return v?JSON.parse(v):structuredClone(seed)}catch{return structuredClone(seed)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));updatePending()}
function user(id){return state.users.find(x=>x.id===id)||{name:"Unknown",upn:""}}
function badge(text,type="neutral"){return `<span class="badge ${type}">${text}</span>`}
function riskBadge(r){return badge(r,r==="High"?"bad":r==="Medium"?"warn":"good")}
function statusBadge(s){const m={Active:"good",Approved:"good",Completed:"good",Success:"good",On:"good",Pending:"warn","In progress":"blue",Eligible:"blue","Report-only":"warn",Denied:"bad",Disabled:"neutral",Alert:"bad",Open:"bad"};return badge(s,m[s]||"neutral")}
function pct(n){return `<div class="progress"><span style="width:${n}%"></span></div>`}
function toast(msg,type="good"){const d=document.createElement("div");d.className=`toast ${type}`;d.textContent=msg;el("toastStack").appendChild(d);setTimeout(()=>d.remove(),2800)}
function updatePending(){const n=state.requests.filter(x=>x.status==="Pending").length;el("pendingNavCount").textContent=n}
function titles(v){return {dashboard:"Executive Dashboard",identities:"Identity Directory",groups:"Groups & Membership",roles:"Roles & Azure RBAC",requests:"Access Requests",privileged:"Privileged Identity Management",reviews:"Access Reviews",risks:"Identity Risk",policies:"Conditional Access",audit:"Audit Logs",reports:"Reports & Data"}[v]}
function setView(v){currentView=v;document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===v));el("pageTitle").textContent=titles(v);el("globalSearch").value="";searchTerm="";render();el("sidebar").classList.remove("open")}
function filtered(arr){if(!searchTerm)return arr;const q=searchTerm.toLowerCase();return arr.filter(x=>JSON.stringify(x).toLowerCase().includes(q))}
function dashboard(){
 const active=state.users.filter(x=>x.status==="Active").length,mfa=Math.round(state.users.filter(x=>x.mfa).length/state.users.length*100),pending=state.requests.filter(x=>x.status==="Pending").length,high=state.risks.filter(x=>x.severity==="High"&&x.status==="Open").length;
 return `<div class="grid metrics">
  <div class="card metric blue"><div class="label">Active identities</div><div class="value">${active}</div><div class="delta">Across ${new Set(state.users.map(x=>x.dept)).size} departments</div></div>
  <div class="card metric good"><div class="label">MFA coverage</div><div class="value">${mfa}%</div><div class="delta">${state.users.filter(x=>!x.mfa).length} identities require attention</div></div>
  <div class="card metric warn"><div class="label">Pending requests</div><div class="value">${pending}</div><div class="delta">Manager and security approval queue</div></div>
  <div class="card metric bad"><div class="label">High-risk findings</div><div class="value">${high}</div><div class="delta">Open governance findings</div></div>
 </div>
 <div class="grid two-col section-gap">
  <div class="card card-pad"><div class="card-header"><div><p class="eyebrow">Governance posture</p><h2>Identity security score</h2></div><div class="risk-score good">84</div></div>
   <div class="stat-strip"><div class="mini-stat"><strong>${mfa}%</strong><span>MFA adoption</span></div><div class="mini-stat"><strong>${state.pim.filter(x=>x.state==="Eligible").length}</strong><span>PIM eligible</span></div><div class="mini-stat"><strong>${state.reviews.filter(x=>x.status==="In progress").length}</strong><span>Active reviews</span></div><div class="mini-stat"><strong>${state.policies.filter(x=>x.state==="On").length}</strong><span>CA policies enforced</span></div></div>
   <div class="section-gap callout">This dashboard models the same governance concerns enterprise IAM teams monitor: authentication coverage, privileged access, entitlement approvals, lifecycle recertification, and policy enforcement.</div>
  </div>
  <div class="card card-pad"><div class="card-header"><div><p class="eyebrow">Priority queue</p><h2>Open risk findings</h2></div><button class="button ghost" onclick="setView('risks')">View all</button></div>
   <div class="list">${state.risks.filter(x=>x.status==="Open").slice(0,4).map(r=>`<div class="list-item"><div><div style="display:flex;gap:8px;align-items:center"><i class="severity ${r.severity.toLowerCase()}"></i><strong>${r.title}</strong></div><span>${r.entity} · ${r.detail}</span></div>${riskBadge(r.severity)}</div>`).join("")}</div>
  </div>
 </div>
 <div class="grid two-col section-gap"><div class="card card-pad"><div class="card-header"><h2>Recent access requests</h2><button class="button ghost" onclick="setView('requests')">Open queue</button></div>${requestTable(state.requests.slice(0,4),false)}</div>
 <div class="card card-pad"><div class="card-header"><h2>Access review progress</h2></div><div class="list">${state.reviews.map(r=>`<div class="list-item"><div style="flex:1"><strong>${r.name}</strong><span>${r.progress}% complete · Due ${r.due}</span><div style="margin-top:8px">${pct(r.progress)}</div></div>${statusBadge(r.status)}</div>`).join("")}</div></div></div>`
}
function identities(){
 const rows=filtered(state.users).map(u=>`<tr><td class="name-cell"><strong>${u.name}</strong><span>${u.upn}</span></td><td>${u.dept}</td><td>${u.type}</td><td>${u.mfa?badge("Registered","good"):badge("Missing","bad")}</td><td>${riskBadge(u.risk)}</td><td>${u.lastSignIn}</td><td>${statusBadge(u.status)}</td></tr>`).join("");
 return tablePage("Identity directory","Enterprise workforce and guest identities with authentication and risk posture.",["Identity","Department","Type","MFA","Risk","Last sign-in","Status"],rows)
}
function groups(){
 const rows=filtered(state.groups).map(g=>`<tr><td class="name-cell"><strong>${g.name}</strong><span>${g.id}</span></td><td>${g.type}</td><td>${g.members}</td><td>${g.owner}</td><td>${g.dynamic?badge("Dynamic","blue"):badge("Assigned","neutral")}</td></tr>`).join("");
 return tablePage("Security groups","Model group-based access as the preferred enterprise authorization pattern.",["Group","Type","Members","Owner","Membership"],rows)
}
function roles(){
 const rows=filtered(state.roleAssignments).map(r=>`<tr><td><strong>${r.principal}</strong></td><td>${r.role}</td><td>${r.scope}</td><td>${badge(r.source,r.source==="Group"?"good":"warn")}</td><td>${r.privileged?badge("Privileged","purple"):badge("Standard","neutral")}</td></tr>`).join("");
 return tablePage("Azure RBAC assignments","Review principal, role, scope, assignment source, and privilege level.",["Principal","Role","Scope","Source","Classification"],rows)
}
function requestTable(items,actions=true){
 return `<div class="table-wrap"><table><thead><tr><th>Request</th><th>Identity</th><th>Access</th><th>Scope</th><th>Duration</th><th>Status</th>${actions?"<th>Decision</th>":""}</tr></thead><tbody>${items.map(r=>`<tr><td class="name-cell"><strong>${r.id}</strong><span>${r.submitted}</span></td><td>${user(r.userId).name}</td><td>${r.role}</td><td>${r.scope}</td><td>${r.duration}</td><td>${statusBadge(r.status)}</td>${actions?`<td>${r.status==="Pending"?`<button class="button primary" onclick="decide('${r.id}','Approved')">Approve</button> <button class="button danger" onclick="decide('${r.id}','Denied')">Deny</button>`:"—"}</td>`:""}</tr>`).join("")}</tbody></table></div>`
}
function requests(){
 return `<div class="card card-pad"><div class="toolbar"><div><p class="eyebrow">Entitlement workflow</p><h2 style="margin:4px 0">Access request queue</h2><div class="muted" style="font-size:12px">Simulated manager/security approval workflow with audit logging.</div></div><button class="button primary" onclick="openRequest()">+ New request</button></div>${requestTable(filtered(state.requests))}</div>`
}
function privileged(){
 const rows=filtered(state.pim).map(p=>`<tr><td>${p.user}</td><td>${p.role}</td><td>${p.scope}</td><td>${statusBadge(p.state)}</td><td>${p.max}</td><td>${p.mfa?badge("Required","good"):"No"}</td><td>${p.approval?badge("Required","blue"):"No"}</td><td>${p.expires}</td></tr>`).join("");
 return tablePage("Privileged Identity Management","Just-in-time privileged access model with eligibility, MFA, approval, and expiration.",["Identity","Role","Scope","State","Max activation","MFA","Approval","Expiration"],rows)
}
function reviews(){
 const cards=filtered(state.reviews).map(r=>`<div class="card card-pad"><div class="card-header"><div><h3>${r.name}</h3><div class="muted" style="font-size:11px;margin-top:4px">${r.scope}</div></div>${statusBadge(r.status)}</div><div class="muted" style="font-size:11px">Reviewers: ${r.reviewers}</div><div style="margin:12px 0 6px">${pct(r.progress)}</div><div style="display:flex;justify-content:space-between;font-size:11px"><span>${r.progress}% complete</span><span class="muted">Due: ${r.due}</span></div></div>`).join("");
 return `<div class="grid three-col">${cards}</div>`
}
function risks(){
 const rows=filtered(state.risks).map(r=>`<tr><td>${riskBadge(r.severity)}</td><td class="name-cell"><strong>${r.title}</strong><span>${r.detail}</span></td><td>${r.entity}</td><td>${statusBadge(r.status)}</td><td>${r.status==="Open"?`<button class="button secondary" onclick="remediate('${r.id}')">Mark remediated</button>`:"—"}</td></tr>`).join("");
 return tablePage("Identity risk register","Prioritized IAM findings that model common governance and hygiene issues.",["Severity","Finding","Entity","Status","Action"],rows)
}
function policies(){
 const rows=filtered(state.policies).map(p=>`<tr><td><strong>${p.name}</strong></td><td>${statusBadge(p.state)}</td><td>${p.users}</td><td>${p.apps}</td><td>${p.grant}</td><td>${riskBadge(p.risk)}</td></tr>`).join("");
 return tablePage("Conditional Access policies","Policy inventory for identity-centric zero-trust access controls.",["Policy","State","Assignments","Target apps","Grant control","Risk"],rows)
}
function audit(){
 const rows=filtered(state.audit).map(a=>`<tr><td>${a.time}</td><td>${a.actor}</td><td><strong>${a.action}</strong></td><td>${a.target}</td><td>${statusBadge(a.result)}</td></tr>`).join("");
 return tablePage("Audit log","Immutable-style local event history for governance actions in this demo.",["Time","Actor","Activity","Target","Result"],rows)
}
function reports(){
 return `<div class="grid two-col"><div class="card card-pad"><p class="eyebrow">Portable demo data</p><h2>Export / import governance state</h2><p class="muted" style="font-size:12px;line-height:1.6">This static deployment intentionally stores data in your browser. Exporting JSON lets you preserve or move demo state without a backend.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="button primary" onclick="exportData()">Export JSON</button><label class="button secondary" style="cursor:pointer">Import JSON<input id="importFile" type="file" accept="application/json" hidden onchange="importData(event)"></label><button class="button danger" onclick="resetData()">Reset demo</button></div></div>
 <div class="card card-pad"><p class="eyebrow">Architecture path</p><h2>Production evolution</h2><div class="code-block">GitHub Pages / Azure Static Web Apps\n        ↓\nMicrosoft Entra authentication\n        ↓\nAzure Functions API\n        ↓\nCosmos DB / Azure SQL\n        ↓\nMicrosoft Graph + audit integrations</div></div></div>
 <div class="card card-pad section-gap"><h2>Current local data footprint</h2><div class="stat-strip section-gap"><div class="mini-stat"><strong>${state.users.length}</strong><span>Identities</span></div><div class="mini-stat"><strong>${state.groups.length}</strong><span>Groups</span></div><div class="mini-stat"><strong>${state.requests.length}</strong><span>Requests</span></div><div class="mini-stat"><strong>${state.audit.length}</strong><span>Audit events</span></div></div></div>`
}
function tablePage(title,desc,heads,rows){return `<div class="card card-pad"><div class="card-header"><div><p class="eyebrow">Enterprise IAM</p><h2>${title}</h2><div class="muted" style="font-size:12px;margin-top:5px">${desc}</div></div></div><div class="table-wrap"><table><thead><tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${heads.length}" class="empty">No matching records</td></tr>`}</tbody></table></div></div>`}
function render(){const fn={dashboard,identities,groups,roles,requests,privileged,reviews,risks,policies,audit,reports}[currentView];el("content").innerHTML=fn();updatePending()}
function decide(id,status){const r=state.requests.find(x=>x.id===id);if(!r)return;r.status=status;state.audit.unshift({time:"Now",actor:"John Tyler",action:`Access request ${status.toLowerCase()}`,target:id,result:status==="Approved"?"Success":"Alert"});save();render();toast(`${id} ${status.toLowerCase()}`,status==="Approved"?"good":"bad")}
function remediate(id){const r=state.risks.find(x=>x.id===id);r.status="Remediated";state.audit.unshift({time:"Now",actor:"John Tyler",action:"Risk finding remediated",target:r.entity,result:"Success"});save();render();toast("Risk marked remediated")}
function openRequest(){el("requestUser").innerHTML=state.users.filter(x=>x.status==="Active").map(x=>`<option value="${x.id}">${x.name} — ${x.dept}</option>`).join("");el("requestModal").classList.remove("hidden")}
function closeRequest(){el("requestModal").classList.add("hidden")}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="identity-governance-demo.json";a.click();URL.revokeObjectURL(a.href);toast("Governance data exported")}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data.users||!data.requests)throw new Error();state=data;save();render();toast("Governance data imported")}catch{toast("Invalid governance JSON","bad")}};r.readAsText(f)}
function resetData(){state=structuredClone(seed);save();render();toast("Demo state reset")}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
el("globalSearch").addEventListener("input",e=>{searchTerm=e.target.value.trim();render()});
el("newRequestButton").addEventListener("click",openRequest);
document.querySelectorAll("[data-close-modal]").forEach(b=>b.addEventListener("click",closeRequest));
el("requestModal").addEventListener("click",e=>{if(e.target===el("requestModal"))closeRequest()});
el("requestForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.target);const id="REQ-"+(1043+state.requests.length);state.requests.unshift({id,userId:f.get("userId"),role:f.get("role"),scope:f.get("scope"),duration:f.get("duration"),justification:f.get("justification"),status:"Pending",submitted:"Now",approver:"Manager"});state.audit.unshift({time:"Now",actor:user(f.get("userId")).name,action:"Access request submitted",target:id,result:"Success"});save();closeRequest();e.target.reset();setView("requests");toast("Access request submitted")});
el("menuButton").addEventListener("click",()=>el("sidebar").classList.toggle("open"));
updatePending();render();
window.setView=setView;window.decide=decide;window.remediate=remediate;window.openRequest=openRequest;window.exportData=exportData;window.importData=importData;window.resetData=resetData;


/* ---------- Identity lifecycle management ---------- */
const IDENTITY_ROLE_CATALOG=[
  "Reader","Contributor","Security Reader","Security Administrator",
  "User Administrator","Virtual Machine Contributor","Key Vault Secrets User"
];

function ensureIdentitySchema(){
  const defaults={
    U001:["G001","G005"],
    U002:["G004","G005"],
    U003:["G003","G005"],
    U004:["G002","G005"],
    U005:["G005"],
    U006:["G004","G005"],
    U007:[],
    U008:["G001"]
  };
  state.users.forEach(u=>{
    if(!Array.isArray(u.roles))u.roles=[];
    if(!Array.isArray(u.groups))u.groups=defaults[u.id]?[...defaults[u.id]]:[];
    if(!u.manager)u.manager="";
    if(!u.dept)u.dept="Unassigned";
    if(!u.type)u.type="Member";
    if(typeof u.mfa!=="boolean")u.mfa=false;
    if(!u.risk)u.risk="Low";
    if(!u.status)u.status="Active";
  });
  save();
}
ensureIdentitySchema();

function esc(v){
  return String(v??"")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function identityGroupNames(u){
  return (u.groups||[]).map(id=>state.groups.find(g=>g.id===id)?.name).filter(Boolean);
}

function identities(){
  const rows=filtered(state.users).map(u=>{
    const roleText=(u.roles||[]).length?u.roles.join(", "):"None";
    const groupText=identityGroupNames(u).length?identityGroupNames(u).join(", "):"None";
    return `<tr>
      <td class="name-cell"><strong>${esc(u.name)}</strong><span>${esc(u.upn)}</span></td>
      <td>${esc(u.dept)}</td>
      <td>${esc(u.manager||"—")}</td>
      <td>${esc(u.type)}</td>
      <td>${u.mfa?badge("Registered","good"):badge("Missing","bad")}</td>
      <td>${riskBadge(u.risk)}</td>
      <td class="wrap-cell">${esc(roleText)}</td>
      <td class="wrap-cell">${esc(groupText)}</td>
      <td>${statusBadge(u.status)}</td>
      <td class="actions-cell">
        <button class="button secondary" onclick="openIdentityEditor('${u.id}')">Edit</button>
        <button class="button ghost" onclick="toggleIdentity('${u.id}')">${u.status==="Active"?"Disable":"Enable"}</button>
        <button class="button danger" onclick="deleteIdentity('${u.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");

  return `<div class="card card-pad">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Identity lifecycle</p>
        <h2 style="margin:4px 0">Identity directory</h2>
        <div class="muted" style="font-size:12px">Create, edit, enable/disable, delete, and manage identity attributes, roles, and group memberships.</div>
      </div>
      <button class="button primary" onclick="openIdentityEditor()">+ Create identity</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Identity</th><th>Department</th><th>Manager</th><th>Type</th><th>MFA</th><th>Risk</th><th>Roles</th><th>Groups</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="10" class="empty">No matching identities</td></tr>'}</tbody>
    </table></div>
  </div>`;
}

function populateIdentityChoices(editingId=null){
  const departments=[...new Set(state.users.map(u=>u.dept).filter(Boolean))].sort();
  el("departmentOptions").innerHTML=departments.map(d=>`<option value="${esc(d)}"></option>`).join("");
  el("managerOptions").innerHTML=state.users
    .filter(u=>u.id!==editingId&&u.status==="Active")
    .sort((a,b)=>a.name.localeCompare(b.name))
    .map(u=>`<option value="${esc(u.name)}"></option>`).join("");

  el("identityRoles").innerHTML=IDENTITY_ROLE_CATALOG.map(role=>`
    <label class="check-option"><input type="checkbox" name="roles" value="${esc(role)}"><span>${esc(role)}</span></label>
  `).join("");

  el("identityGroups").innerHTML=state.groups.map(g=>`
    <label class="check-option ${g.dynamic?"disabled-option":""}">
      <input type="checkbox" name="groups" value="${g.id}" ${g.dynamic?"disabled":""}>
      <span>${esc(g.name)} ${g.dynamic?'<small>Dynamic</small>':""}</span>
    </label>
  `).join("");
}

function openIdentityEditor(id=null){
  const form=el("identityForm");
  form.reset();
  populateIdentityChoices(id);
  const u=id?state.users.find(x=>x.id===id):null;

  el("identityModalTitle").textContent=u?"Edit identity":"Create identity";
  el("identitySaveButton").textContent=u?"Save changes":"Create identity";
  el("identityId").value=u?.id||"";

  if(u){
    el("identityName").value=u.name;
    el("identityUpn").value=u.upn;
    el("identityDept").value=u.dept;
    el("identityManager").value=u.manager||"";
    el("identityType").value=u.type;
    el("identityMfa").value=String(u.mfa);
    el("identityRisk").value=u.risk;
    el("identityStatus").value=u.status;

    form.querySelectorAll('input[name="roles"]').forEach(cb=>cb.checked=(u.roles||[]).includes(cb.value));
    form.querySelectorAll('input[name="groups"]').forEach(cb=>{
      cb.checked=(u.groups||[]).includes(cb.value);
    });
  }else{
    el("identityType").value="Member";
    el("identityMfa").value="true";
    el("identityRisk").value="Low";
    el("identityStatus").value="Active";
  }

  el("identityModal").classList.remove("hidden");
}

function closeIdentityEditor(){
  el("identityModal").classList.add("hidden");
}

function nextIdentityId(){
  const max=state.users.reduce((m,u)=>Math.max(m,Number(String(u.id).replace(/\D/g,""))||0),0);
  return "U"+String(max+1).padStart(3,"0");
}

function adjustStaticGroupCounts(oldGroups,newGroups){
  const oldSet=new Set(oldGroups||[]),newSet=new Set(newGroups||[]);
  state.groups.filter(g=>!g.dynamic).forEach(g=>{
    if(oldSet.has(g.id)&&!newSet.has(g.id))g.members=Math.max(0,(g.members||0)-1);
    if(!oldSet.has(g.id)&&newSet.has(g.id))g.members=(g.members||0)+1;
  });
}

function saveIdentityFromForm(e){
  e.preventDefault();
  const form=e.currentTarget,fd=new FormData(form);
  const id=fd.get("id")||nextIdentityId();
  const existing=state.users.find(u=>u.id===id);
  const upn=String(fd.get("upn")||"").trim().toLowerCase();
  const duplicate=state.users.find(u=>u.id!==id&&u.upn.toLowerCase()===upn);
  if(duplicate){toast("UPN already exists","bad");return;}

  const selectedRoles=fd.getAll("roles");
  const selectedStaticGroups=fd.getAll("groups");
  const dynamicGroups=existing?(existing.groups||[]).filter(gid=>state.groups.find(g=>g.id===gid)?.dynamic):[];
  const groups=[...new Set([...selectedStaticGroups,...dynamicGroups])];

  const record={
    id,
    name:String(fd.get("name")||"").trim(),
    upn,
    dept:String(fd.get("dept")||"Unassigned").trim()||"Unassigned",
    manager:String(fd.get("manager")||"").trim(),
    type:fd.get("type"),
    mfa:fd.get("mfa")==="true",
    risk:fd.get("risk"),
    status:fd.get("status"),
    lastSignIn:existing?.lastSignIn||"Never",
    roles:selectedRoles,
    groups
  };

  if(existing){
    adjustStaticGroupCounts(existing.groups,groups);
    Object.assign(existing,record);
    state.audit.unshift({time:"Now",actor:"John Tyler",action:"Identity updated",target:record.name,result:"Success"});
    toast("Identity updated");
  }else{
    adjustStaticGroupCounts([],groups);
    state.users.push(record);
    state.audit.unshift({time:"Now",actor:"John Tyler",action:"Identity created",target:record.name,result:"Success"});
    toast("Identity created");
  }

  save();
  closeIdentityEditor();
  render();
}

function toggleIdentity(id){
  const u=state.users.find(x=>x.id===id);if(!u)return;
  u.status=u.status==="Active"?"Disabled":"Active";
  state.audit.unshift({time:"Now",actor:"John Tyler",action:`Identity ${u.status==="Active"?"enabled":"disabled"}`,target:u.name,result:"Success"});
  save();render();toast(`${u.name} ${u.status.toLowerCase()}`);
}

function deleteIdentity(id){
  const u=state.users.find(x=>x.id===id);if(!u)return;
  if(!confirm(`Delete ${u.name}? This removes the identity from the local directory. Historical request and audit records will remain.`))return;
  adjustStaticGroupCounts(u.groups,[]);
  state.users=state.users.filter(x=>x.id!==id);
  state.audit.unshift({time:"Now",actor:"John Tyler",action:"Identity deleted",target:u.name,result:"Success"});
  save();render();toast("Identity deleted","bad");
}

el("identityForm").addEventListener("submit",saveIdentityFromForm);
document.querySelectorAll("[data-close-identity]").forEach(b=>b.addEventListener("click",closeIdentityEditor));
el("identityModal").addEventListener("click",e=>{if(e.target===el("identityModal"))closeIdentityEditor()});

window.openIdentityEditor=openIdentityEditor;
window.toggleIdentity=toggleIdentity;
window.deleteIdentity=deleteIdentity;


/* ---------- Group and Azure RBAC administration ---------- */
function nextGroupId(){
  const max=state.groups.reduce((m,g)=>Math.max(m,Number(String(g.id).replace(/\D/g,""))||0),0);
  return "G"+String(max+1).padStart(3,"0");
}

function groupMemberUsers(groupId){
  return state.users.filter(u=>(u.groups||[]).includes(groupId));
}

function groups(){
  const rows=filtered(state.groups).map(g=>{
    const members=groupMemberUsers(g.id);
    return `<tr>
      <td class="name-cell"><strong>${esc(g.name)}</strong><span>${esc(g.id)}</span></td>
      <td>${esc(g.type)}</td>
      <td>${g.members}</td>
      <td>${esc(g.owner)}</td>
      <td>${g.dynamic?badge("Dynamic","blue"):badge("Assigned","neutral")}</td>
      <td class="wrap-cell">${members.length?members.map(u=>esc(u.name)).join(", "):"No demo users assigned"}</td>
      <td class="actions-cell">
        <button class="button secondary" onclick="openGroupEditor('${g.id}')">Edit</button>
        <button class="button danger" onclick="deleteGroup('${g.id}')">Delete</button>
      </td>
    </tr>`;
  }).join("");
  return `<div class="card card-pad">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Group lifecycle</p>
        <h2 style="margin:4px 0">Groups & membership</h2>
        <div class="muted" style="font-size:12px">Manage security groups, Microsoft 365 groups, owners, membership type, and local demo-user membership.</div>
      </div>
      <button class="button primary" onclick="openGroupEditor()">+ Create group</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Group</th><th>Type</th><th>Members</th><th>Owner</th><th>Membership</th><th>Demo members</th><th>Actions</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="7" class="empty">No matching groups</td></tr>'}</tbody>
    </table></div>
  </div>`;
}

function openGroupEditor(id=null){
  const form=el("groupForm");form.reset();
  const g=id?state.groups.find(x=>x.id===id):null;
  el("groupModalTitle").textContent=g?"Edit group":"Create group";
  el("groupSaveButton").textContent=g?"Save changes":"Create group";
  el("groupId").value=g?.id||"";
  el("groupOriginalName").value=g?.name||"";
  el("groupOwnerOptions").innerHTML=state.users
    .filter(u=>u.status==="Active")
    .sort((a,b)=>a.name.localeCompare(b.name))
    .map(u=>`<option value="${esc(u.name)}"></option>`).join("");
  el("groupMembers").innerHTML=state.users
    .sort((a,b)=>a.name.localeCompare(b.name))
    .map(u=>`<label class="check-option"><input type="checkbox" name="members" value="${u.id}"><span>${esc(u.name)} <small>${esc(u.dept)}</small></span></label>`).join("");
  if(g){
    el("groupName").value=g.name;el("groupType").value=g.type;el("groupOwner").value=g.owner;
    el("groupDynamic").value=String(g.dynamic);
    form.querySelectorAll('input[name="members"]').forEach(cb=>cb.checked=(state.users.find(u=>u.id===cb.value)?.groups||[]).includes(g.id));
  }else{
    el("groupType").value="Security";el("groupDynamic").value="false";
  }
  syncGroupMembershipControls();
  el("groupModal").classList.remove("hidden");
}

function syncGroupMembershipControls(){
  const dynamic=el("groupDynamic").value==="true";
  el("groupMembers").querySelectorAll('input[name="members"]').forEach(cb=>cb.disabled=dynamic);
  el("groupMemberHelp").textContent=dynamic
    ?"Dynamic group memberships are rule-driven and cannot be manually edited in this simulation."
    :"Assigned groups can be managed manually.";
}

function closeGroupEditor(){el("groupModal").classList.add("hidden")}

function saveGroupFromForm(e){
  e.preventDefault();
  const fd=new FormData(e.currentTarget),id=fd.get("id")||nextGroupId();
  const existing=state.groups.find(g=>g.id===id),oldName=existing?.name||"";
  const name=String(fd.get("name")||"").trim();
  if(state.groups.some(g=>g.id!==id&&g.name.toLowerCase()===name.toLowerCase())){toast("Group name already exists","bad");return}
  const dynamic=fd.get("dynamic")==="true";
  const selectedUsers=dynamic?null:new Set(fd.getAll("members"));
  const record={id,name,type:fd.get("type"),owner:String(fd.get("owner")||"").trim(),dynamic,members:existing?.members||0};

  if(existing){
    Object.assign(existing,record);
    if(oldName!==name){
      state.roleAssignments.forEach(r=>{if(r.principal===oldName)r.principal=name});
      state.reviews.forEach(r=>{if(r.scope===oldName)r.scope=name});
    }
  }else{
    state.groups.push(record);
  }

  if(!dynamic){
    state.users.forEach(u=>{
      const has=(u.groups||[]).includes(id),want=selectedUsers.has(u.id);
      if(want&&!has)u.groups.push(id);
      if(!want&&has)u.groups=u.groups.filter(gid=>gid!==id);
    });
    record.members=groupMemberUsers(id).length;
  }else if(!existing){
    record.members=0;
  }

  state.audit.unshift({time:"Now",actor:"John Tyler",action:existing?"Group updated":"Group created",target:name,result:"Success"});
  save();closeGroupEditor();render();toast(existing?"Group updated":"Group created");
}

function deleteGroup(id){
  const g=state.groups.find(x=>x.id===id);if(!g)return;
  const assignmentCount=state.roleAssignments.filter(r=>r.principal===g.name).length;
  const msg=assignmentCount
    ?`Delete ${g.name}? This also removes ${assignmentCount} RBAC assignment(s) tied to this group.`
    :`Delete ${g.name}? This removes the group from all local identity memberships.`;
  if(!confirm(msg))return;
  state.users.forEach(u=>u.groups=(u.groups||[]).filter(gid=>gid!==id));
  state.roleAssignments=state.roleAssignments.filter(r=>r.principal!==g.name);
  state.groups=state.groups.filter(x=>x.id!==id);
  state.audit.unshift({time:"Now",actor:"John Tyler",action:"Group deleted",target:g.name,result:"Success"});
  save();render();toast("Group deleted","bad");
}

function roles(){
  const rows=filtered(state.roleAssignments).map((r,i)=>`<tr>
    <td><strong>${esc(r.principal)}</strong></td>
    <td>${esc(r.role)}</td>
    <td class="wrap-cell">${esc(r.scope)}</td>
    <td>${badge(r.source,r.source==="Group"?"good":r.source==="PIM"?"purple":"warn")}</td>
    <td>${r.privileged?badge("Privileged","purple"):badge("Standard","neutral")}</td>
    <td class="actions-cell">
      <button class="button secondary" onclick="openRoleEditor(${i})">Edit</button>
      <button class="button danger" onclick="deleteRoleAssignment(${i})">Delete</button>
    </td>
  </tr>`).join("");
  return `<div class="card card-pad">
    <div class="toolbar">
      <div>
        <p class="eyebrow">Azure authorization</p>
        <h2 style="margin:4px 0">Azure Roles & RBAC</h2>
        <div class="muted" style="font-size:12px">Create, edit, and remove role assignments across identities and groups with role, scope, source, and privilege classification.</div>
      </div>
      <button class="button primary" onclick="openRoleEditor()">+ Create assignment</button>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Principal</th><th>Role</th><th>Scope</th><th>Source</th><th>Classification</th><th>Actions</th></tr></thead>
      <tbody>${rows||'<tr><td colspan="6" class="empty">No matching RBAC assignments</td></tr>'}</tbody>
    </table></div>
  </div>`;
}

function populateRolePrincipals(){
  const users=state.users.filter(u=>u.status==="Active").map(u=>({value:u.name,label:`User · ${u.name}`}));
  const groups=state.groups.map(g=>({value:g.name,label:`Group · ${g.name}`}));
  el("rolePrincipal").innerHTML=[...users,...groups].sort((a,b)=>a.label.localeCompare(b.label))
    .map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join("");
}

function openRoleEditor(index=null){
  const form=el("roleForm");form.reset();populateRolePrincipals();
  const r=index===null?null:state.roleAssignments[index];
  el("roleModalTitle").textContent=r?"Edit RBAC assignment":"Create RBAC assignment";
  el("roleSaveButton").textContent=r?"Save changes":"Create assignment";
  el("roleIndex").value=index===null?"":String(index);
  if(r){
    el("rolePrincipal").value=r.principal;el("roleName").value=r.role;el("roleScope").value=r.scope;
    el("roleSource").value=r.source;el("rolePrivileged").value=String(r.privileged);
  }else{
    el("roleSource").value="Direct";el("rolePrivileged").value="false";
  }
  el("roleModal").classList.remove("hidden");
}
function closeRoleEditor(){el("roleModal").classList.add("hidden")}

function saveRoleFromForm(e){
  e.preventDefault();const fd=new FormData(e.currentTarget);
  const rawIndex=fd.get("index"),index=rawIndex===""?null:Number(rawIndex);
  const record={principal:fd.get("principal"),role:fd.get("role"),scope:String(fd.get("scope")||"").trim(),source:fd.get("source"),privileged:fd.get("privileged")==="true"};
  const action=index===null?"RBAC assignment created":"RBAC assignment updated";
  if(index===null)state.roleAssignments.push(record);else state.roleAssignments[index]=record;
  state.audit.unshift({time:"Now",actor:"John Tyler",action,target:`${record.principal} · ${record.role}`,result:"Success"});
  save();closeRoleEditor();render();toast(index===null?"RBAC assignment created":"RBAC assignment updated");
}

function deleteRoleAssignment(index){
  const r=state.roleAssignments[index];if(!r)return;
  if(!confirm(`Delete ${r.role} assignment for ${r.principal} at ${r.scope}?`))return;
  state.roleAssignments.splice(index,1);
  state.audit.unshift({time:"Now",actor:"John Tyler",action:"RBAC assignment deleted",target:`${r.principal} · ${r.role}`,result:"Success"});
  save();render();toast("RBAC assignment deleted","bad");
}

el("groupForm").addEventListener("submit",saveGroupFromForm);
el("groupDynamic").addEventListener("change",syncGroupMembershipControls);
document.querySelectorAll("[data-close-group]").forEach(b=>b.addEventListener("click",closeGroupEditor));
el("groupModal").addEventListener("click",e=>{if(e.target===el("groupModal"))closeGroupEditor()});

el("roleForm").addEventListener("submit",saveRoleFromForm);
document.querySelectorAll("[data-close-role]").forEach(b=>b.addEventListener("click",closeRoleEditor));
el("roleModal").addEventListener("click",e=>{if(e.target===el("roleModal"))closeRoleEditor()});

window.openGroupEditor=openGroupEditor;
window.deleteGroup=deleteGroup;
window.openRoleEditor=openRoleEditor;
window.deleteRoleAssignment=deleteRoleAssignment;
