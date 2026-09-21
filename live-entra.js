(() => {
  const TENANT_ID = "fee7e0b5-3b72-43ee-a18d-fbabfcbe8d3e";
  const CONFIG_KEY = "aigc-live-entra-config-v1";
  const GRAPH_SCOPES = [
    "User.Read",
    "Directory.Read.All",
    "RoleManagement.Read.Directory",
    "AuditLog.Read.All",
    "UserAuthenticationMethod.Read.All"
  ];
  const ARM_SCOPES = ["https://management.azure.com/user_impersonation"];
  const GRAPH = "https://graph.microsoft.com/v1.0";
  const ARM = "https://management.azure.com";

  const strongMethodTypes = new Set([
    "#microsoft.graph.microsoftAuthenticatorAuthenticationMethod",
    "#microsoft.graph.fido2AuthenticationMethod",
    "#microsoft.graph.windowsHelloForBusinessAuthenticationMethod",
    "#microsoft.graph.softwareOathAuthenticationMethod",
    "#microsoft.graph.phoneAuthenticationMethod",
    "#microsoft.graph.temporaryAccessPassAuthenticationMethod"
  ]);

  const isPublicDemoHost = () =>
    location.hostname.endsWith("github.io") ||
    location.protocol === "file:";

  const loadConfig = () => {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}"); }
    catch { return {}; }
  };

  const saveConfig = (config) =>
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config || {}));

  const guid = (v = "") =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v).trim());

  const normalizeError = (e) =>
    e?.errorMessage || e?.message || e?.errorCode || String(e || "Unknown error");

  async function api(url, token) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        detail = body?.error?.message || body?.error?.code || detail;
      } catch {}
      throw new Error(`${detail} — ${url}`);
    }
    return res.json();
  }

  async function paged(url, token, max = Infinity) {
    const rows = [];
    let next = url;
    while (next && rows.length < max) {
      const body = await api(next, token);
      rows.push(...(body.value || []));
      next = body["@odata.nextLink"] || body.nextLink || null;
    }
    return rows.slice(0, max);
  }

  async function mapLimit(items, limit, worker) {
    const out = new Array(items.length);
    let cursor = 0;
    async function run() {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        out[i] = await worker(items[i], i);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return out;
  }

  function roleName(definitions, id) {
    return definitions.find(d => d.id === id)?.displayName || "Unknown role";
  }

  function principalName(users, groups, servicePrincipals, id) {
    const user = users.find(x => x.id === id);
    if (user) return { name: user.displayName, upn: user.userPrincipalName || "", type: "User" };
    const group = groups.find(x => x.id === id);
    if (group) return { name: group.displayName, upn: "", type: "Group" };
    const sp = servicePrincipals.find(x => x.id === id);
    if (sp) return { name: sp.displayName, upn: "", type: "ServicePrincipal" };
    return { name: id || "Unknown principal", upn: "", type: "Unknown" };
  }

  function formatDate(v) {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
  }

  let msalInstance = null;
  let account = null;

  async function ensureMsal(config) {
    if (!window.msal) throw new Error("MSAL Browser failed to load.");
    if (!guid(config.clientId)) throw new Error("Enter a valid Application (client) ID.");
    if (!msalInstance) {
      msalInstance = new window.msal.PublicClientApplication({
        auth: {
          clientId: config.clientId.trim(),
          authority: `https://login.microsoftonline.com/${TENANT_ID}`,
          redirectUri: location.origin
        },
        cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false }
      });
      if (typeof msalInstance.initialize === "function") await msalInstance.initialize();
      if (typeof msalInstance.handleRedirectPromise === "function") {
        try { await msalInstance.handleRedirectPromise(); } catch {}
      }
    }
    account = msalInstance.getAllAccounts()[0] || account;
    return msalInstance;
  }

  async function acquire(scopes, config) {
    const instance = await ensureMsal(config);
    if (!account) {
      const login = await instance.loginPopup({ scopes: ["User.Read"], prompt: "select_account" });
      account = login.account;
    }
    const req = { scopes, account };
    try {
      return (await instance.acquireTokenSilent(req)).accessToken;
    } catch (e) {
      return (await instance.acquireTokenPopup(req)).accessToken;
    }
  }

  async function acquireOptionalSilent(scopes, config) {
    try {
      const instance = await ensureMsal(config);
      if (!account) return null;
      return (await instance.acquireTokenSilent({ scopes, account })).accessToken;
    } catch {
      return null;
    }
  }


  function severityFromRiskLevel(level) {
    const v = String(level || "").toLowerCase();
    if (v === "high") return "High";
    if (v === "medium") return "Medium";
    if (v === "low") return "Low";
    return "Medium";
  }

  function buildLiveRisks({ users, groups, roleAssignments, pim, riskyUsers, riskDetections }) {
    const findings = [];
    let n = 1;
    const add = (severity, title, entity, detail, source, evidence = "") => {
      findings.push({
        id: `LIVE-${String(n++).padStart(3,"0")}`,
        severity,
        title,
        entity,
        detail,
        source,
        evidence,
        status: "Open"
      });
    };

    for (const u of users) {
      if (u.status === "Active" && u.mfaReadable && !u.mfa) {
        const privileged = (u.roles || []).some(r => /global administrator|privileged|security administrator|authentication administrator|user administrator|owner|contributor|user access administrator/i.test(r));
        add(
          privileged ? "High" : "Medium",
          privileged ? "Privileged account without strong authentication" : "Strong authentication not registered",
          u.name,
          privileged
            ? "This active identity has privileged access but no strong authentication method was returned by Microsoft Graph."
            : "This active identity has no strong authentication method returned by Microsoft Graph.",
          "Live governance finding",
          u.upn || u.id
        );
      }

      if (u.status === "Disabled" && ((u.roles || []).length || (u.groups || []).length)) {
        add(
          "Medium",
          "Disabled identity retains access relationships",
          u.name,
          `The account is disabled but still has ${(u.roles||[]).length} role(s) and ${(u.groups||[]).length} direct group membership(s). Review whether residual access should be removed.`,
          "Live governance finding",
          u.upn || u.id
        );
      }

      if (String(u.type).toLowerCase() === "guest" && (u.roles || []).length) {
        add(
          "High",
          "Guest identity has assigned role access",
          u.name,
          `Guest identity currently has role access: ${(u.roles||[]).join(", ")}.`,
          "Live governance finding",
          u.upn || u.id
        );
      }
    }

    for (const p of pim || []) {
      if (p.state !== "Active") continue;
      const high = /global administrator|privileged role administrator|security administrator|authentication administrator/i.test(p.role || "");
      add(
        high ? "High" : "Medium",
        "Standing privileged directory role",
        p.user,
        `${p.role} is currently active at ${p.scope || "tenant scope"}. Review whether permanent standing privilege is required.`,
        "Live governance finding",
        p.role
      );
    }

    for (const r of roleAssignments || []) {
      if (!r.privileged) continue;
      const direct = r.source === "Direct";
      add(
        direct ? "High" : "Medium",
        direct ? "Direct privileged Azure RBAC assignment" : "Privileged Azure RBAC assignment",
        r.principal,
        `${r.role} is assigned at ${r.scope}. ${direct ? "Direct user/service-principal assignment should be reviewed against group-based least privilege." : "Review scope and continuing business need."}`,
        "Live governance finding",
        r.upn || r.principalType || ""
      );
    }

    for (const g of groups || []) {
      if (!g.owner || /no owner returned/i.test(g.owner)) {
        add(
          "Low",
          "Group has no returned owner",
          g.name,
          "Microsoft Graph did not return an owner for this group. Ownerless groups can make access recertification and accountability harder.",
          "Live governance finding",
          g.id
        );
      }
    }

    for (const ru of riskyUsers || []) {
      const user = users.find(u => u.id === ru.id || u.id === ru.userId);
      add(
        severityFromRiskLevel(ru.riskLevel),
        "Microsoft Entra risky user",
        user?.name || ru.userDisplayName || ru.userPrincipalName || ru.id || "Unknown identity",
        `Entra ID Protection reports user risk level ${ru.riskLevel || "unknown"} with state ${ru.riskState || "unknown"}.`,
        "Entra ID Protection",
        user?.upn || ru.userPrincipalName || ru.id || ""
      );
    }

    for (const rd of riskDetections || []) {
      add(
        severityFromRiskLevel(rd.riskLevel),
        rd.riskEventType ? `Risk detection: ${rd.riskEventType}` : "Microsoft Entra risk detection",
        rd.userDisplayName || rd.userPrincipalName || rd.userId || "Unknown identity",
        `${rd.activity || "Identity activity"} detected ${rd.detectedDateTime ? "at " + formatDate(rd.detectedDateTime) : ""}. Risk state: ${rd.riskState || "unknown"}.`,
        "Entra ID Protection",
        rd.userPrincipalName || rd.ipAddress || rd.id || ""
      );
    }

    const seen = new Set();
    return findings.filter(f => {
      const key = [f.source,f.title,f.entity,f.detail].join("|").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function sync(config) {
    if (isPublicDemoHost()) throw new Error("Live tenant sync is disabled on the public GitHub Pages demo.");
    if (!guid(config.clientId)) throw new Error("Enter the Entra Application (client) ID first.");
    saveConfig(config);

    const graphToken = await acquire(GRAPH_SCOPES, config);

    const [usersRaw, groupsRaw, servicePrincipals, directoryRoleDefinitions, directoryRoleAssignments] =
      await Promise.all([
        paged(`${GRAPH}/users?$select=id,displayName,userPrincipalName,userType,accountEnabled,department&$top=999`, graphToken),
        paged(`${GRAPH}/groups?$select=id,displayName,securityEnabled,mailEnabled,groupTypes,membershipRule,membershipRuleProcessingState&$top=999`, graphToken),
        paged(`${GRAPH}/servicePrincipals?$select=id,displayName,appId,servicePrincipalType&$top=999`, graphToken),
        paged(`${GRAPH}/roleManagement/directory/roleDefinitions`, graphToken),
        paged(`${GRAPH}/roleManagement/directory/roleAssignments`, graphToken)
      ]);

    const groupDetails = await mapLimit(groupsRaw, 5, async g => {
      let members = [], owners = [];
      try {
        members = await paged(`${GRAPH}/groups/${g.id}/members/microsoft.graph.user?$select=id,displayName,userPrincipalName&$top=999`, graphToken);
      } catch {}
      try {
        owners = await paged(`${GRAPH}/groups/${g.id}/owners?$select=id,displayName,userPrincipalName&$top=50`, graphToken);
      } catch {}
      return { ...g, _members: members, _owners: owners };
    });

    const authPairs = await mapLimit(usersRaw, 4, async u => {
      try {
        const methods = await paged(`${GRAPH}/users/${u.id}/authentication/methods`, graphToken);
        return [u.id, methods];
      } catch {
        return [u.id, null];
      }
    });
    const authMethods = Object.fromEntries(authPairs);

    let audits = [];
    try {
      audits = await paged(`${GRAPH}/auditLogs/directoryAudits?$top=100&$orderby=activityDateTime%20desc`, graphToken, 100);
    } catch {}

    let signIns = [];
    try {
      signIns = await paged(`${GRAPH}/auditLogs/signIns?$top=100&$orderby=createdDateTime%20desc`, graphToken, 100);
    } catch {}

    let pimAssignments = [];
    let pimEligibilities = [];
    try {
      [pimAssignments, pimEligibilities] = await Promise.all([
        paged(`${GRAPH}/roleManagement/directory/roleAssignmentScheduleInstances?$select=id,principalId,roleDefinitionId,directoryScopeId,appScopeId,startDateTime,endDateTime,assignmentType,memberType&$top=999`, graphToken),
        paged(`${GRAPH}/roleManagement/directory/roleEligibilityScheduleInstances?$select=id,principalId,roleDefinitionId,directoryScopeId,appScopeId,startDateTime,endDateTime,memberType&$top=999`, graphToken)
      ]);
    } catch {}

    let riskDetections = [];
    let riskyUsers = [];
    let riskDetectionsAvailable = false;
    let riskyUsersAvailable = false;

    const riskEventToken = await acquireOptionalSilent(["IdentityRiskEvent.Read.All"], config);
    if (riskEventToken) {
      try {
        riskDetections = await paged(`${GRAPH}/identityProtection/riskDetections?$top=100`, riskEventToken, 100);
        riskDetectionsAvailable = true;
      } catch {}
    }

    const riskyUserToken = await acquireOptionalSilent(["IdentityRiskyUser.Read.All"], config);
    if (riskyUserToken) {
      try {
        riskyUsers = await paged(`${GRAPH}/identityProtection/riskyUsers?$top=100`, riskyUserToken, 100);
        riskyUsersAvailable = true;
      } catch {}
    }

    let azureRoleAssignments = [];
    let azureRoleDefinitions = [];
    const subscriptionId = String(config.subscriptionId || "").trim();
    const usableSubscriptionId = guid(subscriptionId) && subscriptionId.toLowerCase() !== TENANT_ID.toLowerCase();
    if (usableSubscriptionId) {
      try {
        const armToken = await acquire(ARM_SCOPES, config);
        [azureRoleAssignments, azureRoleDefinitions] = await Promise.all([
          paged(`${ARM}/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01`, armToken),
          paged(`${ARM}/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleDefinitions?api-version=2022-04-01`, armToken)
        ]);
      } catch {}
    }

    const latestSignInByUser = new Map();
    for (const x of signIns) {
      const key = String(x.userId || "").toLowerCase();
      if (key && !latestSignInByUser.has(key)) latestSignInByUser.set(key, x);
    }

    const userGroups = new Map(usersRaw.map(u => [u.id, []]));
    for (const g of groupDetails) {
      for (const m of g._members || []) {
        if (!userGroups.has(m.id)) userGroups.set(m.id, []);
        userGroups.get(m.id).push(g.id);
      }
    }

    const directoryRolesByPrincipal = new Map();
    for (const a of directoryRoleAssignments) {
      const name = roleName(directoryRoleDefinitions, a.roleDefinitionId);
      if (!directoryRolesByPrincipal.has(a.principalId)) directoryRolesByPrincipal.set(a.principalId, []);
      directoryRolesByPrincipal.get(a.principalId).push(name);
    }

    const azureRolesByPrincipal = new Map();
    for (const a of azureRoleAssignments) {
      const defId = String(a?.properties?.roleDefinitionId || "").toLowerCase();
      const role = azureRoleDefinitions.find(d => String(d.id || "").toLowerCase() === defId)?.properties?.roleName || "Azure role";
      const pid = a?.properties?.principalId;
      if (!pid) continue;
      if (!azureRolesByPrincipal.has(pid)) azureRolesByPrincipal.set(pid, []);
      azureRolesByPrincipal.get(pid).push(role);
    }

    const users = usersRaw.map(u => {
      const methods = authMethods[u.id];
      const hasStrong = Array.isArray(methods)
        ? methods.some(m => strongMethodTypes.has(m["@odata.type"]))
        : false;
      const last = latestSignInByUser.get(String(u.id).toLowerCase());
      const roles = [...new Set([
        ...(directoryRolesByPrincipal.get(u.id) || []),
        ...(azureRolesByPrincipal.get(u.id) || [])
      ])];
      return {
        id: u.id,
        name: u.displayName || u.userPrincipalName || u.id,
        upn: u.userPrincipalName || "",
        dept: u.department || "Unassigned",
        type: u.userType || "Member",
        mfa: hasStrong,
        mfaReadable: Array.isArray(methods),
        risk: "Unknown",
        status: u.accountEnabled === false ? "Disabled" : "Active",
        manager: "",
        lastSignIn: last ? formatDate(last.createdDateTime) : (signIns.length ? "No recent event" : "P1/P2 required"),
        roles,
        groups: userGroups.get(u.id) || []
      };
    });

    const groups = groupDetails.map(g => ({
      id: g.id,
      name: g.displayName || g.id,
      type: g.securityEnabled ? "Security" : (g.mailEnabled ? "Microsoft 365" : "Group"),
      members: (g._members || []).length,
      owner: (g._owners || []).map(x => x.displayName || x.userPrincipalName).filter(Boolean).join(", ") || "No owner returned",
      dynamic: (g.groupTypes || []).includes("DynamicMembership") || !!g.membershipRule,
      memberIds: (g._members || []).map(x => x.id)
    }));

    const roleAssignments = azureRoleAssignments.map(a => {
      const p = principalName(usersRaw, groupsRaw, servicePrincipals, a?.properties?.principalId);
      const defId = String(a?.properties?.roleDefinitionId || "").toLowerCase();
      const role = azureRoleDefinitions.find(d => String(d.id || "").toLowerCase() === defId)?.properties?.roleName || "Azure role";
      return {
        principal: p.name,
        upn: p.upn,
        principalType: p.type,
        role,
        scope: a?.properties?.scope || "—",
        source: p.type === "Group" ? "Group" : "Direct",
        privileged: ["Owner","Contributor","User Access Administrator"].includes(role)
      };
    });

    const activeDirectoryAssignments = (pimAssignments.length ? pimAssignments : directoryRoleAssignments).map(a => {
      const p = principalName(usersRaw, groupsRaw, servicePrincipals, a.principalId);
      return {
        id: a.id,
        user: p.name,
        role: roleName(directoryRoleDefinitions, a.roleDefinitionId),
        scope: a.directoryScopeId || a.appScopeId || "Tenant directory",
        state: "Active",
        expires: a.endDateTime ? formatDate(a.endDateTime) : "Permanent / not exposed",
        max: "—",
        mfa: false,
        approval: false
      };
    });
    const eligibleDirectoryAssignments = pimEligibilities.map(a => {
      const p = principalName(usersRaw, groupsRaw, servicePrincipals, a.principalId);
      return {
        id: a.id,
        user: p.name,
        role: roleName(directoryRoleDefinitions, a.roleDefinitionId),
        scope: a.directoryScopeId || a.appScopeId || "Tenant directory",
        state: "Eligible",
        expires: a.endDateTime ? formatDate(a.endDateTime) : "No expiration exposed",
        max: "—",
        mfa: true,
        approval: true
      };
    });

    const livePim = [...activeDirectoryAssignments, ...eligibleDirectoryAssignments];
    const risks = buildLiveRisks({
      users,
      groups,
      roleAssignments,
      pim: livePim,
      riskyUsers,
      riskDetections
    });

    const audit = audits.map(x => {
      const actorUser = x?.initiatedBy?.user;
      const actorApp = x?.initiatedBy?.app;
      const targetResources = x?.targetResources || [];
      const target = targetResources.map(t => t.userPrincipalName || t.displayName || t.id).filter(Boolean).join(", ");
      return {
        time: formatDate(x.activityDateTime),
        actor: actorUser?.displayName || actorUser?.userPrincipalName || actorApp?.displayName || "System / service",
        actorUpn: actorUser?.userPrincipalName || "",
        action: x.activityDisplayName || "Directory activity",
        category: x.category || "DirectoryManagement",
        target: target || "—",
        targetTypes: [...new Set(targetResources.map(t => t.type).filter(Boolean))].join(", "),
        result: String(x.result || "Unknown").toLowerCase() === "success" ? "Success" : (x.result || "Unknown"),
        correlationId: x.correlationId || ""
      };
    });

    function classifyAccessActivity(x) {
      const action = String(x.activityDisplayName || "").toLowerCase();
      const category = String(x.category || "").toLowerCase();

      if ((action.includes("member") && action.includes("group")) ||
          action.includes("add member to group") ||
          action.includes("remove member from group")) {
        return "Group membership";
      }

      if ((action.includes("owner") && action.includes("group")) ||
          action.includes("add owner to group") ||
          action.includes("remove owner from group")) {
        return "Group ownership";
      }

      if (category.includes("rolemanagement") ||
          action.includes("role assignment") ||
          action.includes("member to role") ||
          action.includes("member from role") ||
          action.includes("eligible role") ||
          action.includes("activate eligible role")) {
        return "Directory role";
      }

      if (action.includes("app role assignment") ||
          action.includes("application assignment") ||
          action.includes("service principal assignment") ||
          action.includes("delegated permission grant") ||
          action.includes("oauth2permissiongrant") ||
          action.includes("consent to application") ||
          action.includes("consent to app")) {
        return "Application access";
      }

      if (category.includes("entitlement") ||
          action.includes("access package") ||
          action.includes("entitlement")) {
        return "Entitlement";
      }

      if (action.includes("conditional access") ||
          (category.includes("policy") && (action.includes("policy") || action.includes("named location")))) {
        return "Access policy";
      }

      return null;
    }

    const accessActivity = audits.map(x => {
      const type = classifyAccessActivity(x);
      if (!type) return null;

      const actorUser = x?.initiatedBy?.user;
      const actorApp = x?.initiatedBy?.app;
      const targetResources = x?.targetResources || [];
      const targets = targetResources.map(t => ({
        name: t.userPrincipalName || t.displayName || t.id || "Unknown target",
        type: t.type || ""
      }));

      return {
        id: x.id || x.correlationId || crypto.randomUUID(),
        time: formatDate(x.activityDateTime),
        actor: actorUser?.displayName || actorUser?.userPrincipalName || actorApp?.displayName || "System / service",
        actorUpn: actorUser?.userPrincipalName || "",
        activity: x.activityDisplayName || "Access-related directory activity",
        type,
        target: targets.map(t => t.name).join(", ") || "—",
        targetType: [...new Set(targets.map(t => t.type).filter(Boolean))].join(", ") || "—",
        result: String(x.result || "Unknown").toLowerCase() === "success" ? "Success" : (x.result || "Unknown"),
        correlationId: x.correlationId || ""
      };
    }).filter(Boolean);

    return {
      account: account ? { name: account.name || account.username, username: account.username } : null,
      syncedAt: new Date().toISOString(),
      users,
      groups,
      roleAssignments,
      pim: livePim,
      risks,
      audit,
      accessActivity,
      meta: {
        signInsAvailable: signIns.length > 0,
        authMethodsReadable: Object.values(authMethods).some(Array.isArray),
        azureRbacAvailable: azureRoleAssignments.length > 0,
        riskDetectionsAvailable,
        riskyUsersAvailable,
        liveGovernanceRiskCount: risks.filter(r => r.source === "Live governance finding").length,
        identityProtectionRiskCount: risks.filter(r => r.source === "Entra ID Protection").length,
        accessActivityCount: accessActivity.length,
        users: users.length,
        groups: groups.length
      }
    };
  }

  async function signOut() {
    if (!msalInstance || !account) return;
    await msalInstance.logoutPopup({ account, postLogoutRedirectUri: location.origin });
    account = null;
  }

  window.LiveEntra = {
    tenantId: TENANT_ID,
    isPublicDemoHost,
    loadConfig,
    saveConfig,
    sync,
    signOut,
    guid,
    normalizeError
  };
})();