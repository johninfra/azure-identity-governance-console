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
