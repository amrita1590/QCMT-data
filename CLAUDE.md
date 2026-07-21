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

File server base URL is hardcoded in [src/app/constants/app.constants.ts](src/app/constants/app.constants.ts): `http://192.168.11.8:8060/`.

### Auth Flow
- `UsermanagementService` stores the JWT in `localStorage` under key `jwtToken`
- `tokenInterceptor` (functional interceptor) attaches `Authorization: Bearer <token>` to every request except `/auth/login` and `/auth/register`
- `AuthGuard` checks token presence via `UsermanagementService.getToken()`
- On 401, the interceptor redirects to `/login`
- All `localStorage` access is guarded by `isPlatformBrowser(platformId)` for SSR compatibility
- `provideHttpClient(withFetch())` is required in `app.config.ts` to suppress Angular SSR warning NG02801
- Login form includes a math-based captcha (addition/subtraction) with a 60-second timer — captcha must pass before credentials are submitted

### App Layout
`AppComponent.shouldShowHeader()` splits the UI into two layouts:
- **Public pages** (`/`, `/about`, `/contact`, `/login`, `/updatepassword`, `/privacy`, `/terms`) — show `HeaderComponent` (top nav only)
- **Authenticated pages** — show `LeftSidebarComponent` (responsive: collapses below 768px) + `MainComponent`
`ToastComponent` is always rendered at the app root level.

### SSR Security Headers
`src/server.ts` sets security headers on every response: HSTS, X-Content-Type-Options, X-Frame-Options (DENY), CSP, Referrer-Policy, Permissions-Policy. The CSP `connect-src` whitelist must include any API server the app calls — update it when the file server base URL changes.

### User Profile Endpoints (important distinction)
- `getUserProfileDetails()` → `/v1/qcmt/auth/userprofile` — JWT-Auth service. Returns user without `unitid` (auth DB doesn't store unit assignments).
- `getLoggedUserDetailList()` → `/v1/qcmt/master/loginuserdetail` — Master service. Returns `User[]` (single-element array) with `unitid` from `UserDetailsMaster`. **Use this one** when you need the logged-in user's unit.

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
| Internal | `/internalaudit` | `InternalAuditService` + `InternalAuditFacade` | `/v1/qcmt/master/saveinternalaudit`, etc. |
| Other Audits (APS desk) | `/otherauditapshqrsdesk` | BCAS + ICAO + Internal services | Aggregates all three in tabbed view |

IQCU is the most complex: it has a multi-stage workflow (schedule → questionnaire → CASO response → observations → audit board → report).

BCAS has a multi-stage workflow with conversation threading:

| Stage | Status | Action owner | What happens |
|---|---|---|---|
| 1 — PQ | `PQ_STAGE` | CASO Bucket | APS creates audit with PQ files |
| 2 — Audit | `AUDIT_STAGE` | CASO Bucket | APS adds dates, letter, final report PDF (mandatory) |
| 3 — Observations | `OBSERVATION_STAGE` | APS HQrs Bucket | APS adds observations (compliance status details mandatory per obs), sends to CASO |
| 4 — APS Responded | `APS_RESPONDED` | CASO Bucket | APS has sent compliance letter; CASO must reply per-observation |
| Done | `COMPLETED` | — | All observations resolved |

BCAS draft patterns — the get endpoints return HTTP 204 (no body) when no draft exists, handled with `catchError(() => of(null))`:
- Audit creation draft: `/savebcasauditdraft`, `/updatebcasauditdraft`, `/getbcasauditdraft`
- Observation draft: `/savebcasobservationdraft/{id}`, `/getbcasobservationdraft/{id}`
- CASO reply draft: `/savebcascasoreplydraft/{id}`, `/getbcascasoreplydraft/{id}` (stored as JSON in `BcasAuditMaster.casoReplyDraftJson` TEXT column)

BCAS conversation threading: Each observation has an append-only `messages[]` array of `BcasObsMessage` records (`BcasObsMessageMaster` in backend). Messages are created by `sendbcastocaso` (APS formal action) and `submitbcascasoreply` (CASO reply). `saveBcasObsCompliance` (progress save) only updates flat fields, never creates message records — this avoids duplicate APS entries.

BCAS per-observation file uploads use `file_{observationId}` as the FormData key. Backend extracts via `MultipartHttpServletRequest.getFile("file_" + observationId)`.

BCAS unit locking: The `unitId` form control is disabled — locked to the logged-in user's assigned unit. Uses `getRawValue()` (not `form.value`) to read disabled control values. Audit list is filtered to `loggedUser.unitid` in the `filteredAudits` getter. After `form.reset()`, `unitId` must be re-disabled (`get('unitId')?.disable()`) because Angular's `reset()` re-enables controls.

BCAS user tracking on `BcasAuditMaster`: `createdBy`/`createdById` (Stage 1), `updatedBy`/`updatedByName` (Stage 2 — who submitted final report), `obsCreatedBy`/`obsCreatedByName` (Stage 3 — who submitted observations). Backend `formatDisplayName(UserDetailsMaster)` formats all stored names as "CISFNo, Rank, Name".

Internal Audit uses the `InternalAuditFacade` pattern — a `providedIn: 'root'` service that owns all state (audits list, forms, user lists) and is shared across the 7 tab sub-components. The parent `InternalAuditComponent` calls `facade.init()` on `ngOnInit`. The model is `InternalAuditRecord` (not the old `InternalAuditSchedule` which was removed).

CISF Airport Sector hierarchy determines IG/DIG dropdown filtering:
- 2 Sectors (APS I, APS II) headed by IG
- 4 Zones (NZ, WZ, SZ, ENEZ) headed by DIG
- Units fall under Zones, which fall under Sectors

IG/DIG dropdown filtering logic (`InternalAuditFacade.igDigUserList`):
- `unitType === 'DIG Unit'` → shows users from the **same sector** as logged-in user
- `unitType === 'Unit'` → shows users whose unit type is **"Zone"**
- Otherwise → shows all users

Internal Audit creation form follows the BCAS pattern: audit name auto-generated (`UnitName - Internal Audit - Month Year`), unit locked to logged-in user, CASO auto-filled from unit, file upload restricted to PDF/Word (.pdf/.doc/.docx). The backend `saveinternalaudit` endpoint accepts `multipart/form-data` (not JSON). `fromDate`/`toDate` are not set at creation — they are updated in a later workflow stage by another user.

Backend entity: `InternalAuditMaster` with `@OneToMany` relationships to `InternalAuditQuestionMaster`, `InternalAuditResponseMaster`, `InternalAuditFileMaster`, `InternalAuditObservationMaster`, and an `@ElementCollection` for `complianceTrail`. Controller is `InternalAuditController` (separate from `MasterController`).

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
├── bcas/                     # Tabbed container: bcas-bcas/, bcas-icao/, bcas-internal/
│   ├── bcas-bcas/            #   BCAS audit sub-component (the main BCAS workflow)
│   ├── bcas-icao/            #   ICAO audit sub-component (CASO creates ICAO here)
│   └── bcas-internal/        #   Internal audit sub-component
├── icao/                     # Standalone ICAO audit (separate /icao route — DUPLICATE of bcas-icao)
├── internal-audit/           # CISF Internal audit; models in internal-audit.model.ts
├── otherauditapshqrsdesk/    # APS HQrs tabbed view of BCAS + ICAO + Internal audits
├── dashboard/                # Dashboard with Chart.js doughnut chart
├── header/                   # Navigation header
├── left-sidebar/             # Sidebar navigation
├── pipe/                     # filter-pipe for search/filter
└── toast/                    # Toast notification service + component
```

### Important Gotchas

**Dual ICAO/Internal components**: The `/bcas` route renders `BcasComponent` which contains three tab sub-components: `BcasBcasComponent`, `BcasIcaoComponent`, `BcasInternalComponent`. There are ALSO standalone route components `IcaoComponent` (`/icao`) and `InternalAuditComponent` (`/internalaudit`). When making changes to ICAO or Internal Audit, you must update BOTH the `/bcas` sub-component AND the standalone component — they are separate codebases with duplicated logic.

**Unit locking**: BCAS (`bcas-bcas`) and ICAO (`bcas-icao`, `icao`) lock the unit to the logged-in user's assigned unit. The `unitId` form control is disabled at construction. After any `form.reset()`, you must re-disable it. Always use `getLoggedUserDetailList()` (Master service) — never `getUserProfileDetails()` (Auth service) — to get `unitid`.

**CASO name display format**: All user names stored in the backend use `formatDisplayName()` which returns "CISFNo, Rank, Name". Frontend table displays should use the same order: `{{ casoNo }}, {{ casoRank }}, {{ casoName }}`.

**ICAO submit confirmation**: The ICAO create form (`bcas-icao`) uses a two-step submit: `confirmSubmit()` validates and shows a warning alert, then `saveAudit()` performs the actual submission. The button reads "Submit to APS HQrs" (not "Save Audit").

**CSP ↔ file server URL sync**: When the file server base URL in `app.constants.ts` changes, you must also update the `connect-src` directive in `src/server.ts` to match — otherwise the browser will block API/file requests in production SSR mode. The CSP also needs `frame-src 'self' blob:` for the PDF file viewer (blob URLs rendered in iframes).

**Font Awesome Free only**: The project uses `@fortawesome/fontawesome-free` (v7). Use `fas` (solid), `far` (regular), or `fab` (brands) prefixes — never `fal` (light), which requires Font Awesome Pro and will render as blank/broken icons.

**Unit Master `unitType` field**: The `UnitDetails` interface, `UnitMaster` entity (both QCMT-Master and JWT-Auth), `UnitMasterBean`, and `UnitMasterBeanConverter` all carry `unitType`. The dropdown values are: ADG HQ, Sector, Zone, DIG Unit, Unit. When adding new fields to master entities, remember to update all four layers: interface (frontend) → bean → converter → entity (backend, both services if shared).

### Styling
- Bootstrap 5 + ng-bootstrap for modals, tables, forms
- Bootstrap Icons + Font Awesome Free (use `fas`/`far`/`fab` prefixes only)
- jQuery and Popper.js included as global scripts (legacy, used via Bootstrap)
- Custom styles in [src/styles.css](src/styles.css)
