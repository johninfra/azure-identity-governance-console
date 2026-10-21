# Security Model

This repository is a **personal single-tenant IAM lab** with two modes: a **public GitHub Pages demo** containing fictional, browser-local simulation data, and a **separate Azure Static Web Apps deployment** intended to display read-only live data from the author's fixed Entra lab tenant. The GitHub Pages host disables live-tenant authentication. Neither mode is an enterprise production service.

## Trust boundaries

The browser is considered an untrusted client. Any user with browser developer tools can inspect or alter locally stored demo state.

Therefore:

- Local state is demonstration data only.
- Client-side approval actions are workflow simulations.
- Client-side role names do not enforce real authorization.
- No secrets, tokens, or real tenant exports belong in the public repository or GitHub Pages demo.
- The separately hosted live mode processes authorized real directory information in the browser; it must not be mistaken for a centralized secure backend.
- The MSAL connector restricts live sign-in to the configured tenant; delegated Graph/ARM API access is determined by actual token scopes and user permissions.
- SWA hosting OIDC and MSAL delegated API login are distinct. Although SWA has an `authenticated` route configuration, effective runtime hosting enforcement remains unverified by the existing `/.auth/me` evidence.

## If adapting beyond this personal lab

A production implementation should include:

1. Microsoft Entra ID authentication.
2. Server-side authorization on every protected API operation.
3. Least-privilege Graph permissions.
4. Managed identities where possible.
5. Key Vault for secrets/certificates.
6. Centralized immutable or tamper-resistant audit logging.
7. Input validation and output encoding.
8. Secure headers and CSP.
9. Dependency and secret scanning.
10. Monitoring, alerting, and incident-response integration.
11. Data classification, retention, and privacy controls.
12. Administrative separation of duties.

## Threat examples

| Threat | Production mitigation |
| --- | --- |
| User alters local request state | Server-side persistence and authorization |
| Privilege escalation through UI manipulation | Token validation and API-side RBAC |
| Stolen session/token | Conditional Access, short lifetimes, secure session handling |
| Secret exposure in source code | Managed identity + Key Vault |
| Audit log tampering | Centralized append-only logging |
| Excessive Graph permissions | Least-privilege app/delegated permissions |
