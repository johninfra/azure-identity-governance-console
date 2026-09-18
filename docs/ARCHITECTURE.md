# Architecture

## Current version

```text
User browser
   |
   +-- index.html
   +-- styles.css
   +-- app.js
          |
          +-- seeded enterprise demo data
          +-- governance workflow logic
          +-- localStorage persistence
          +-- JSON export/import
```

The current implementation is deliberately backend-free so the same codebase can be hosted by GitHub Pages and Azure static hosting.

## Target enterprise architecture

```text
GitHub
  |
  +-- source control
  +-- CI/CD workflow
        |
        v
Azure Static Web Apps
        |
        v
Microsoft Entra ID
(authentication)
        |
        v
Azure Functions / API Management
        |
        +--> Microsoft Graph
        +--> Cosmos DB / Azure SQL
        +--> Log Analytics / Application Insights
        +--> Key Vault
```

### Authentication
Use Microsoft Entra ID with organizational accounts and Conditional Access.

### Authorization
Enforce authorization server-side. UI visibility is not an authorization control. Map application roles to Entra app roles or groups and validate tokens on every protected API request.

### Persistence
Replace localStorage with Azure SQL or Cosmos DB for requests, approvals, reviews, findings, audit metadata, and configuration.

### Microsoft Graph
Use Graph only through a server-side or appropriately delegated architecture. Apply least-privilege permissions and avoid storing tokens in browser-local storage.

### Secrets
Store application secrets, certificates, and connection material in Azure Key Vault. Prefer managed identities where supported.

### Observability
Send application and security telemetry to Application Insights / Log Analytics and establish retention and alerting appropriate to organizational requirements.
