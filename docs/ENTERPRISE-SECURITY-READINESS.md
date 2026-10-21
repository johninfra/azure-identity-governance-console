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
