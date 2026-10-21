# Deployment Guide

## Public GitHub Pages: demo only

**Public URL:** https://johninfra.github.io/azure-identity-governance-console/

GitHub Pages serves the portfolio's fictional demo data and simulated IAM workflows. It **does not offer an authenticated live-tenant experience**. The application deliberately disables the live Microsoft Entra connector when hosted on `github.io` (or opened as a `file:` URL). No visitor can authenticate from that link to access the author's tenant or another organization's tenant.

The static project requires no build step. GitHub Pages settings: **Settings → Pages → Deploy from a branch → main → /(root)**.

## Azure Static Web Apps: author's fixed tenant

The separately hosted Azure Static Web Apps deployment is the intended path for the author's **single Entra lab tenant** and optional **Connect Live Tenant** workflow. It uses a tenant-fixed MSAL authority, delegated Microsoft Graph scopes, and Azure Resource Manager access where available; returned data is **read-only** and limited to what the signed-in lab account is authorized to see.

| Setting | Value |
| --- | --- |
| Source | GitHub |
| Repository | johninfra/azure-identity-governance-console |
| Branch | main |
| Build preset | Custom |
| App location | / |
| API location | blank |
| Output location | blank |

The SWA `staticwebapp.config.json` defines tenant-specific OIDC hosting configuration, an `authenticated` route requirement, and a login redirect. Its app settings/secrets must be configured in Azure (never committed to source). The browser MSAL SPA also requires the appropriate redirect URI and approved delegated Graph permissions; the two authentication sessions are distinct.

**Important:** The SWA hosting authentication gate is configured in source, but previous `/.auth/me` testing did not establish reliable end-to-end route enforcement. Do not represent that control as verified solely because MSAL sign-in or CI succeeded. This deployment is a personal lab, not an enterprise-certified application.

## Validation checklist

### Public demo
- GitHub Pages loads the seeded fictional data.
- Sample dashboard/navigation and local workflows operate as simulations.
- **Connect Live Tenant** is blocked/disabled on GitHub Pages.
- No real directory exports, access tokens, or secret credentials are published.

### Single-tenant live deployment
- The configured tenant's permitted identity can sign in through MSAL.
- Wrong-tenant accounts are rejected by the live connector.
- Live Microsoft Graph / ARM results match the signed-in account's actual permissions.
- Restricted users cannot retrieve privileged data simply by changing the UI.
- Test SWA `/.auth/me`, protected-route access in a private browser, unauthorized requests, login/logout, and account switching before claiming the hosting gate is enforced.
- Demo edits never write back to Microsoft Entra ID or Azure.
- Verify console/network errors and API coverage/permission failures.

## Portfolio demonstration

Share the **GitHub Pages URL for the interactive demo**. For screenshots or a walkthrough of the actual lab, show authenticated live read-only views from the author's separately hosted Azure deployment, avoiding disclosure of sensitive directory data. Explain clearly which screens show sample data and which show live tenant observations.

See [Architecture](ARCHITECTURE.md) and [Security Model](SECURITY.md).
