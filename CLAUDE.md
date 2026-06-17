# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (uses proxy.conf.json automatically)
ng serve

# Production build
ng build

# Watch mode (development)
npm run watch

# Run tests (Karma + Jasmine)
ng test

# Run a single spec file
ng test --include="**/service/usermanagement.service.spec.ts"

# SSR server (after build)
node dist/qcmt-aviation-app/server/server.mjs
```

## Architecture Overview

This is an **Angular 19 SSR** app for CISF airport audit tracking. All components are standalone (no NgModules).

### Backend Services
Backend source lives at `F:\PjGit\backup050626\Esamiksha Backend` (not in this repo).
All API calls are proxied through the API Gateway at `http://localhost:8060`:

| Path prefix | Gateway route | Service port |
|---|---|---|
| `/v1/qcmt/auth/**` | JWT-Auth | 8082 |
| `/v1/qcmt/master/**` | Master | 8083 |
| `/v1/qcmt/rbac/**` | RBAC | 8086 |

Eureka service registry runs on port 8761. The `proxy.conf.json` handles dev-time routing — in production, the gateway is accessed directly.

File server base URL is hardcoded in [src/app/constants/app.constants.ts](src/app/constants/app.constants.ts): `http://192.168.10.5:8060/`.

### Auth Flow
- `UsermanagementService` stores the JWT in `localStorage` under key `jwtToken`
- `tokenInterceptor` (functional interceptor) attaches `Authorization: Bearer <token>` to every request except `/auth/login` and `/auth/register`
- `AuthGuard` checks token presence via `UsermanagementService.getToken()`
- On 401, the interceptor redirects to `/login`
- All `localStorage` access is guarded by `isPlatformBrowser(platformId)` for SSR compatibility
- `provideHttpClient(withFetch())` is required in `app.config.ts` to suppress Angular SSR warning NG02801

### User Roles
Three roles used throughout the audit workflow:
- **APS HQrs** — admin/HQ, creates audits, manages observations
- **CASO** — Civil Aviation Security Officer at each airport, responds to audits
- **Auditor** — conducts audits, fills questionnaires, submits reports

### Audit Types
Four independent audit workflows plus one aggregated APS HQrs view:

| Audit | Route | Service | Key endpoints |
|---|---|---|---|
| IQCU | `/iqcu`, `/iqcuauditlist` | `AuditscheduleserviceService` | `/v1/qcmt/master/saveaudittemplates`, etc. |
| BCAS | `/bcas` | `BcasAuditService` | `/v1/qcmt/master/savebcasaudit`, etc. |
| ICAO | `/icao` | `IcaoService` | `/v1/qcmt/master/saveicaoaudit`, etc. |
| Internal | `/internalaudit` | `InternalAuditService` | `/v1/qcmt/master/saveinternalaudit`, etc. |
| Other Audits (APS desk) | `/otherauditapshqrsdesk` | BCAS + ICAO + Internal services | Aggregates all three in tabbed view |

IQCU is the most complex: it has a multi-stage workflow (schedule → questionnaire → CASO response → observations → audit board → report).

BCAS has a draft save/update pattern (`/savebcasauditdraft`, `/updatebcasauditdraft`, `/getbcasauditdraft`); the get returns HTTP 204 (no body) when no draft exists — handled with `catchError(() => of(null))` in `BcasAuditService`.

### Service Patterns
Services use two patterns for cross-component communication:
- **`BehaviorSubject`** — for shared state (e.g., `currentAuditData$`, global `username$`/`userId$`)
- **`Subject` with `triggerRefresh()`** — to signal list components to re-fetch after mutations; each domain service embeds its own `refreshList$` Subject; `RefreshService` (`service/refresh.service.ts`) is a standalone version for cross-service use

File uploads that need progress tracking use `{ reportProgress: true, observe: 'events', responseType: 'text' }` on `http.post()` (used in `submitAuditorResponse`, `submitAuditObservationMessageCASO`, etc.).

### Shared Utilities
- **`DownloadService`** (`service/download.service.ts`) — `downloadCsv()`, `downloadExcel()`, `downloadPdf()` using `file-saver`, `xlsx`, and `jspdf-autotable`; pass an array of objects and optional column config
- **`ToastService`** (`service/toast.service.ts`) — call `toastService.show(message, type, duration)` where `type` is `'success' | 'error' | 'warning' | 'info'`; the `ToastComponent` renders `ToastService.toasts` directly (no Observable needed)

### Models / Interfaces
All TypeScript interfaces live in [src/app/interface/](src/app/interface/) **except** Internal Audit models, which are co-located in [src/app/internal-audit/internal-audit.model.ts](src/app/internal-audit/internal-audit.model.ts) and export typed unions for status and observation types.

### Key Files
- [src/app/app.routes.ts](src/app/app.routes.ts) — all routes; every protected route uses `canActivate: [AuthGuard]`
- [src/app/app.config.ts](src/app/app.config.ts) — providers: `tokenInterceptor` is wired here
- [src/app/service/usermanagement.service.ts](src/app/service/usermanagement.service.ts) — auth, user CRUD, notifications, global `username$`/`userId$`
- [src/app/service/auditscheduleservice.service.ts](src/app/service/auditscheduleservice.service.ts) — IQCU audit lifecycle (note: filename has "service" twice — this is the correct name)
- [src/app/constants/app.constants.ts](src/app/constants/app.constants.ts) — notification templates, file base URL, status constants
- [src/app/interface/](src/app/interface/) — all TypeScript interfaces/models (except Internal Audit)

### Directory Map
```
src/app/
├── service/                  # All Angular services
├── interface/                # TypeScript interfaces (models)
├── constants/                # APP_CONSTANTS (notification messages, file URL)
├── interceptor/              # tokenInterceptor (JWT injection + 401 handling)
├── master/                   # Master data: unitmaster/, category/, questionmaster/
├── RBAC/                     # Role & permission management: role/, permission/, permission-assignment/
├── auditschedule/            # Audit scheduling UI
├── auditboard/               # APS HQrs audit board view
├── audit-board-caso/         # CASO view of audit board
├── iqcu-audit/               # IQCU audit form (audit-schedule/, auditors/)
├── iqcuaudit/                # IQCU audit list (iqcuauditlist/)
├── bcas/                     # BCAS audit (bcas-bcas/, bcas-icao/, bcas-internal/)
├── icao/                     # ICAO audit
├── internal-audit/           # CISF Internal audit; models in internal-audit.model.ts
├── otherauditapshqrsdesk/    # APS HQrs tabbed view of BCAS + ICAO + Internal audits
├── dashboard/                # Dashboard with Chart.js doughnut chart
├── header/                   # Navigation header
├── left-sidebar/             # Sidebar navigation
├── pipe/                     # filter-pipe for search/filter
└── toast/                    # Toast notification service + component
```

### Styling
- Bootstrap 5 + ng-bootstrap for modals, tables, forms
- Bootstrap Icons + Font Awesome for icons
- jQuery and Popper.js included as global scripts (legacy, used via Bootstrap)
- Custom styles in [src/styles.css](src/styles.css)
