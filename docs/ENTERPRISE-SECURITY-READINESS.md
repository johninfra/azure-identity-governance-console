# Enterprise security hardening — review required

## Status
This branch contains **partial defense-in-depth changes**, not enterprise production certification. The default branch is unchanged until approved/merged.

## Implemented
- Escapes tenant-derived governance finding fields on the executive dashboard.
- Escapes badge text and limits badge styling classes to a fixed list.
- Disables persistent localStorage drift snapshots. Comparison now lasts only for the current page lifecycle.
- Adds initial response security headers to Azure Static Web Apps configuration.
- Adds static regression checks for these protections.

## Release blockers
1. **Application authorization:** Azure Static Web Apps currently uses `allowedRoles: ["authenticated"]`. Before corporate use, configure Entra assignment-required, scoped app roles/groups, enforce policy through the hosting/auth layer and API as appropriate, and test access denial. Do not equate UI checks with authorization.
2. **XSS audit:** Review all HTML interpolation / `innerHTML` sinks, including statusBadge, dialog markup, synthetic demo-data import and identity graph paths. Add runtime adversarial tests. The present changes are not an exhaustive sanitization guarantee.
3. **Data retention:** The MSAL library caches authentication in sessionStorage; tenant snapshots now remain in memory but all active tenant data remains available to page JavaScript. Establish logout, memory clearing and privacy/retention requirements.
4. **Token and dependency controls:** Add strict CSP after testing all inline scripts/styles and event handlers, move away from unpinned CDN dependencies, and evaluate backend-for-frontend for high-sensitivity deployments.
5. **Least privilege:** Audit all Graph scopes and Azure permissions, document exact feature needs, and verify consent / app-role assignment.
6. **Isolation:** The app is single-tenant by design; multi-tenant use requires architectural changes and independent tests.
7. **Deployment controls:** Approve and pin GitHub Actions, require reviews, CI security checks and production environment approvals.
8. **Runtime assurance:** Perform verified testing with authorized/unauthorized identities, browser devtools, network requests, Graph permissions, and Azure Static Web App configuration.

## Important
Do not connect an employer's tenant to this project until the organization's authorized security team has approved the app and the release blockers above have been resolved and tested.

## Phase 2: source-side controls
- Encoded additional request/risk data fields and dynamic request IDs in HTML templates to reduce demo JSON-import XSS exposure.
- Restricted Graph pagination to HTTPS requests on the expected Microsoft Graph origin before attaching delegated bearer tokens. This prevents an unexpected nextLink from redirecting a Graph access token to another host.
- Expanded static regressions to verify these source-level controls.
- **Still outstanding:** Replace inline event attributes and use DOM-safe construction; a systematic runtime XSS suite, app-role authorization and live tenant consent testing remain mandatory.

## Phase 3: browser and API boundary protections
- Validates Graph/ARM fetch target origin against explicit HTTPS allowlist before attaching a bearer token; rejects redirects rather than following them.
- Selects MSAL cached accounts only from the configured tenant and rejects cross-tenant interactive logins before acquiring tokens.
- Adds a **report-only** Content Security Policy as an initial compatibility baseline. This policy is intentionally not enforced and still contains unsafe-inline due to current inline event handlers and style attributes; it must be tightened and browser-tested before production.
- These controls do not replace Azure Static Web Apps application-level authorization. Restrict enterprise app assignment (including guest permissions), design dedicated app roles, test deny cases, and secure every future backend API separately.

## Phase 4: legacy demo rendering and authorization gate
- Escapes the remaining legacy risk-table entity cell that can render imported JSON state.
- Restricts legacy action-handler record IDs to a simple identifier alphabet so HTML escaping cannot be mistaken for JavaScript-string safety.
- Added regression assertions. These are selective mitigations; a full removal of inline event handlers is still necessary to implement a strict enforced CSP.
- **Authorization gate is still open:** The host's `authenticated` role is insufficient to prove a user is a designated governance reader. Rather than enforcing an arbitrary role and locking out the live application, production access remains blocked pending admin-approved Entra app assignment and verifiable role enforcement.

## Phase 5: CSP-compatible event delegation
- Converted 33 inline event handler occurrences into declarative data attributes with a centralized allowlisted dispatcher.
- Tightened report-only CSP script-src to remove unsafe-inline (still not enforced; browser integration tests pending).
- Style attributes remain inline, so style-src still allows unsafe-inline. A strict enforced CSP requires testing MSAL, dynamic styles, and all interface interactions.
- The handler dispatcher is deliberately constrained to existing known functions and approved decision states; verify all demo and live interactions in a browser before merging.

## Phase 6 — fail-closed hosting authorization (staged; NOT ready to merge)
- Azure Static Web Apps route `/*` now requires the custom **SWA** role `governance_reader` instead of the broad `authenticated` role. The access-denied page is deliberately static and contains no tenant data.
- **Important:** This is an Azure Static Web Apps custom-role name, not automatically an Entra app role or directory role. The organization must configure trusted role assignment (e.g., SWA custom authentication role assignment function where supported, or an approved identity-to-SWA-role mechanism). Simply creating an Entra app role does **not** automatically satisfy this check.
- Without this trusted role-assignment configuration, legitimate users including the lab owner will receive HTTP 403: this intentional fail-closed behavior prevents accidental deployment with authenticated-user access.
- Test anonymous access, authenticated user without role, valid governance reader, cross-tenant login, logout/session revocation, and protected deep routes in a staging deployment before merging.
- Client-side roles or JavaScript-only checks do not replace hosting/API enforcement. Review SWA route matching and custom auth behavior against current Microsoft documentation before release.
