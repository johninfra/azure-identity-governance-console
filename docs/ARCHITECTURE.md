# Architecture

## Purpose and deployment boundaries

This is a **personal, single-tenant Microsoft Entra ID / Azure IAM lab**, not a multi-tenant SaaS or enterprise production service. The repository supports two distinct experiences:

| Experience | Hosting | Authentication and data |
| --- | --- | --- |
| **Public portfolio demo** | [GitHub Pages](https://johninfra.github.io/azure-identity-governance-console/) | **Demo-only.** Uses fictional seed data and browser-local simulated workflows. Entra sign-in and live-tenant access are disabled on `github.io`. |
| **Author's live lab** | Separate Azure Static Web Apps deployment | Designed for the author's **fixed Entra tenant**. Entra authentication and delegated Microsoft Graph / Azure Resource Manager requests can show **real, read-only** tenant data, subject to the signed-in account's privileges, consent, and licensing. |

The public Pages URL is **not** the authenticated live application. A visitor cannot enter a different tenant ID or sign in to load another organization's data from that URL.

## Public demo architecture

```text
Visitor -> GitHub Pages (static HTML / CSS / JavaScript)
                    |
                    +-> sample identities / groups / policies / IAM workflows
                    +-> browser-local demo state
                    +-> no Entra authentication or Graph / ARM live connection
```

`live-entra.js` detects `github.io` and `file:` hosting as demo-only contexts. Demo actions are simulations, not real Entra or Azure writes. Browser-local state is user-modifiable and is not an access-control boundary.

## Author's live tenant architecture

```text
Author / permitted lab identity -> Azure Static Web Apps
                                      |
                                      +-> SWA hosting authentication configuration
                                      +-> Browser MSAL (fixed tenant authority)
                                            |
                                            +-> Microsoft Entra ID delegated tokens
                                            +-> Microsoft Graph (read-only inventory)
                                            +-> Azure Resource Manager (read-only RBAC inventory)
                                            +-> in-browser governance analysis / visualizations
```

The connector specifies one tenant in `live-entra.js` and rejects an MSAL account whose tenant ID does not match. The SWA OpenID Connect configuration in `staticwebapp.config.json` also references that tenant. A client-side tenant check is not by itself a server-side authorization guarantee: Microsoft APIs independently enforce token audience, scopes, tenant policy, and effective caller privileges.

There are **two separate authentication layers**: the SWA hosted session, configured with an `authenticated` route requirement, and the MSAL delegated-token sign-in used for Graph/ARM. Do not infer that one proves the other. The repository has previously recorded an unverified SWA `/.auth/me` result, so end-to-end hosting-route enforcement should not be described as independently validated.

## Live data and limitations

Available read-only data can include directory users, groups, memberships, roles, PIM schedules, authentication methods, Conditional Access, audit/sign-in activity, and Azure RBAC assignments. Visibility varies with delegated scopes, user role, API permissions, licenses, and subscription access. Missing results do not necessarily mean no data exists.

Governance scores, access paths, and risk findings are application-derived views, not native Microsoft security attestations. Demo create/edit/approve/review operations **do not** modify the live tenant. Live tenant data is processed in the browser, with MSAL session cache in `sessionStorage`; demonstration state may use `localStorage`. This is not a production data-retention or secure backend design.

## Project scope

The purpose of the authenticated deployment is to demonstrate **real live read-only data from the author's own lab tenant**, while keeping the GitHub Pages portfolio link safely demo-only. There is no planned claim of support for employer tenants or arbitrary organizational sign-ins. Multi-tenant support would require separate product architecture, permission/consent planning, tenant isolation, and tested authorization controls.

See [Deployment](DEPLOYMENT.md), [Security Model](SECURITY.md), and the [README](../README.md).
