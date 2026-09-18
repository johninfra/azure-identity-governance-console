# Azure Identity Governance Console

A browser-based enterprise IAM governance simulation designed to demonstrate practical Microsoft Entra ID, Azure RBAC, privileged access, access-review, Conditional Access, and identity-risk concepts.

## What this project demonstrates

This project models workflows that appear in real identity governance and cloud-security environments:

- Full workforce and guest identity lifecycle management (create, edit, enable/disable, delete)
- MFA registration posture
- Editable security and Microsoft 365 groups with owner, membership type, and user membership management
- Editable Azure RBAC assignments with principal, role, scope, source, and privileged classification
- Access request and approval workflows
- Privileged Identity Management-style eligibility and activation controls
- Access reviews and recertification
- Identity-risk findings and remediation
- Conditional Access policy inventory
- Governance audit logging
- Local export/import of application state

The application is intentionally static and stores demo data locally in the browser using `localStorage`. No real tenant credentials, secrets, production identities, or Microsoft Graph data are included.

## Why browser-local storage?

The goal of v1 is to produce a portable portfolio application that can run from both GitHub Pages and Azure Static Web Apps without requiring a backend.

The data layer is intentionally separated conceptually from the interface so a future production-oriented version can replace browser storage with:

```text
GitHub / CI-CD
      ↓
Azure Static Web Apps
      ↓
Microsoft Entra ID authentication
      ↓
Azure Functions API
      ↓
Cosmos DB / Azure SQL
      ↓
Microsoft Graph
```

## Core modules

| Module | Enterprise concept |
| --- | --- |
| Dashboard | Governance posture and operational metrics |
| Identities | CRUD lifecycle management, MFA/risk attributes, roles, and group memberships |
| Groups | CRUD group lifecycle, owners, assigned/dynamic membership, and user memberships |
| Roles & RBAC | CRUD Azure RBAC assignments with principal, role, scope, source, and privilege classification |
| Access Requests | Entitlement approval workflow |
| Privileged Access | Just-in-time privilege / PIM concepts |
| Access Reviews | Periodic access recertification |
| Identity Risks | Identity hygiene and risk register |
| Conditional Access | Zero-trust access policy inventory |
| Audit Logs | Traceability of governance activity |
| Reports & Data | Demo-state portability and architecture notes |

## Local development

No build tool is required.

1. Clone the repository.
2. Open `index.html` locally, or serve the folder with a simple static web server.
3. Interact with the seeded demo data.
4. Changes made in the interface are persisted to the browser.

## GitHub Pages

This project is compatible with GitHub Pages because it is composed of static HTML, CSS, and JavaScript.

Enable Pages for the repository and publish from the main branch/root directory.

## Azure deployment

The same source can be imported into Azure Static Web Apps or another static-hosting workflow. This makes the project useful for demonstrating the path:

```text
GitHub repository
       ↓
CI/CD deployment
       ↓
Azure-hosted application
```

A future iteration can add Entra authentication, API endpoints, persistent cloud storage, and Microsoft Graph integrations.

## Security notes

This is a simulation and portfolio project.

- Do not place tenant secrets, client secrets, passwords, access tokens, or real privileged identity information in this repository.
- Browser storage is not appropriate for sensitive production IAM data.
- Real enterprise implementations require server-side authorization, secure API design, centralized logging, data protection, and proper identity-provider integration.
- Client-side role labels in this demo are visual representations only and are not security boundaries.

## Portfolio value

The application is intended to demonstrate understanding of:

- identity lifecycle and governance
- least privilege
- role-based access control
- privileged access management
- MFA and Conditional Access
- access reviews and entitlement governance
- auditability and security operations
- Azure application deployment and GitHub-based source control

## Author

Built by John Tyler as part of an Azure, IAM, systems administration, and cybersecurity portfolio.
