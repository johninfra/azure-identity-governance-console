# Deployment Guide

## GitHub Pages

The application is fully static and requires no build step.

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select **main** and **/(root)**.
4. Save.

The expected Pages URL is:

```text
https://johninfra.github.io/azure-identity-governance-console/
```

## Azure Static Web Apps

This repository is designed to be imported directly into Azure Static Web Apps.

Recommended values when creating the Azure resource:

| Setting | Value |
| --- | --- |
| Source | GitHub |
| Repository | johninfra/azure-identity-governance-console |
| Branch | main |
| Build preset | Custom |
| App location | / |
| API location | leave blank |
| Output location | leave blank |

Because this version uses plain HTML/CSS/JavaScript, there is no application build command or generated output directory.

Azure will create the deployment workflow after authorization. Keep the deployment token/credentials in GitHub Actions secrets; never place them in source files.

## Validation checklist

After deployment verify:

- Dashboard loads without console errors.
- Navigation works on desktop and mobile.
- New access requests can be submitted.
- Pending requests can be approved/denied.
- Risk findings can be remediated.
- State survives a browser refresh.
- JSON export/import works.
- Reset restores the seeded dataset.

## Portfolio demonstration

For a screen recording, show this sequence:

1. Open the executive dashboard.
2. Review an identity with missing MFA.
3. Inspect Azure RBAC assignments.
4. Submit an access request.
5. Approve it from the request queue.
6. Open Privileged Access and explain eligible vs. active access.
7. Open Access Reviews.
8. Remediate an identity-risk finding.
9. Show the resulting audit-log event.
10. Briefly explain the production architecture path in Reports & Data.

This sequence demonstrates both the UI and the IAM concepts behind it.
