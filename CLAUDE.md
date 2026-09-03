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
- `tokenInterceptor` (functional interceptor) attaches `Authorization: Bearer <token>` to every request except `/auth/login`, `/auth/register`, `/auth/captcha`, `/auth/send-otp`, `/auth/resend-otp`, `/auth/verify-otp`
- `AuthGuard` checks token presence via `UsermanagementService.getToken()`
- On 401, the interceptor redirects to `/login`; if the response carries header `X-Auth-Reason: SESSION_SUPERSEDED`, it also shows a toast ("logged out because your account was signed in elsewhere") before clearing the session
- All `localStorage` access is guarded by `isPlatformBrowser(platformId)` for SSR compatibility — the same guard is required around any HTTP call made from a constructor/`ngOnInit` that runs on a public/prerendered route (e.g. `LoginComponent` fetching its captcha challenge): build-time SSR prerendering has no live backend to answer it, and one failed request there kills prerendering for every static route, not just that one.
- `provideHttpClient(withFetch())` is required in `app.config.ts` to suppress Angular SSR warning NG02801
- Login form includes a math-based captcha (addition/subtraction) with a 60-second timer, **verified server-side** — `GET /v1/qcmt/auth/captcha` (JWT-Auth service) issues the challenge via `CaptchaService` (in-memory, 60s TTL, one-time use); the answer never leaves the server. `login.component.ts`'s `generateCaptcha()` fetches it instead of computing it locally, and `UsermanagementService.userLogin()` sends the submitted answer back via `X-Captcha-Id`/`X-Captcha-Answer` headers (not the request body — kept separate from the `Login`/`UserDetailsMaster` payload shape). `/login` rejects with 400 if the answer's wrong/expired. This exists specifically so a caller that skips the frontend (a script hitting the API directly) can't skip the captcha either — the old version only checked the answer in the browser.
- The login password is RSA-OAEP encrypted client-side before it's ever sent, since TLS isn't set up yet (a separate infra task) — `GET /v1/qcmt/auth/publickey` (JWT-Auth service) hands out an RSA-2048 public key from `PasswordEncryptionService`. The keypair is **persisted** in `RsaKeyMaster` (a singleton DB row, id always `1`) — not generated fresh in memory per instance/restart. An earlier version did the latter and it broke `/login` with "Invalid encrypted password" any time the service restarted between a browser fetching the key and submitting the form (and would have broken the same way across multiple instances behind the Gateway's load balancer, each minting its own key). `init()` loads the existing row if present, otherwise generates one and persists it; a `DataIntegrityViolationException` on that insert means another instance won the race to create it first, so it re-loads what they persisted rather than running with a second, different key. `login.component.ts`'s `fetchPublicKey()` imports the key and `encryptPassword()` encrypts the password before `onLogin()` calls `userLogin()` — `AuthController.login()` decrypts it (`passwordEncryptionService.decrypt()`) before the existing `authenticationManager.authenticate()` call. This protects the password field specifically; it is **not** a substitute for TLS — everything else in the request/response, and all traffic metadata, is still unprotected until TLS is actually terminated somewhere in front of the Gateway. Rotating the key (e.g. after a suspected compromise) means deleting the `rsa_key_master` row and restarting — every currently-open login page's cached public key becomes stale at that point, same as the bug this fix closes, so plan a rotation around that.
- **Uses `node-forge`, not `window.crypto.subtle`, deliberately.** The native browser API only exists in a "secure context" — HTTPS, or the special `localhost`/`127.0.0.1` exception — and this app is deployed at a plain-HTTP IP address (`http://192.168.10.5:...`), which does not qualify. An earlier version used `window.crypto.subtle` and worked fine in local dev (`localhost` always counts as secure) but failed on the test server with "Unable to secure your credentials right now" — `crypto.subtle` was simply `undefined` there. `node-forge` does the same RSA-OAEP math in pure JS with no such restriction, configured to match the backend's `OAEPParameterSpec` exactly (SHA-256 for both the main digest and MGF1) via `{ md: forge.md.sha256.create(), mgf1: { md: forge.md.sha256.create() } }`. If this app ever moves to HTTPS, this still works unchanged — there's no need to revert to the native API.
- **Test/deployment IP addresses drift frequently and are recorded nowhere authoritative** — `app.constants.ts`'s `BASE_URL` and the various IPs referenced in commit history/discussion have changed several times (192.168.10.5, 192.168.11.8, 192.168.3.199 have all appeared). Don't treat any specific IP mentioned in this file as durable; always check the current value in `app.constants.ts` directly rather than trusting a remembered one.

**Brute-force protection on `/login`** (JWT-Auth service), two independent layers, deliberately **not** wired to `mnum_is_active` (doesn't touch the existing Activate/Inactivate/Unlock admin workflow at all):
- **Per-account lockout**: `UserDetailsMaster.failedLoginAttempts`/`lockoutUntil` — 5 consecutive bad passwords locks the account for 15 minutes (`AuthController.registerFailedAttempt()`/`autoUnlockIfExpired()`). `CustomUserDetails.isAccountNonLocked()` reads `lockoutUntil` directly; Spring Security's own `authenticationManager.authenticate()` then throws `LockedException` for a locked account, caught in `login()` as a 423. Success resets both fields.
- **Per-IP rate limit**: `LoginRateLimiter` (in-memory sliding window, ~20 attempts/IP/10min) catches password-spraying (many accounts, few attempts each from one source) that per-account lockout alone wouldn't trip — returns 429. In-memory only; would need a shared store behind a load balancer.

**Optional OTP second factor**: `/v1/qcmt/auth/login` is gated server-side by the JWT-Auth service's `authentication.otp.enabled` flag (backend-only config, not in this repo). The response is always `ResponseEntity<String>` either way, so `UsermanagementService.userLogin()` and `LoginComponent` must handle both shapes from the *same* endpoint:
- **OTP disabled** (default): response is the legacy plain JWT string, or `"updatepassword-<token>"` — unchanged, original behavior.
- **OTP enabled**: response is a JSON-stringified `{"status":"OTP_REQUIRED", sessionId, deliveryType, maskedEmail, maskedMobile, message}`. `UsermanagementService.isOtpRequiredResponse()` detects this via a try/parse; `LoginComponent` then shows an inline OTP step (`otpStep` flag, no route change, no redirect) instead of navigating.
- `UsermanagementService.sendOtp()` / `resendOtp()` / `verifyOtp()` call `/auth/send-otp`, `/auth/resend-otp`, `/auth/verify-otp`. `verifyOtp()`'s success response is byte-identical in shape to a normal `/login` success (plain token or `updatepassword-<token>`), so `LoginComponent` reuses the same post-login navigation logic for both.
- Each resend/send issues a **new** `sessionId` — `LoginComponent` must update its stored `sessionId` from the response before the next call, the old one becomes invalid.
- The token-storing logic itself lives in `UsermanagementService`'s private `storeLoginToken()`, shared by both `userLogin()` and `verifyOtp()`.
- `/login`'s error responses are distinguished by status code, not just caught generically: 401 means bad credentials ("Invalid Email or Password"), 502 means credentials were fine but OTP failed to send on every configured channel (backend can be configured to send on multiple channels, e.g. email + SMS, at once — see `LoginComponent.resolveLoginErrorMessage()`). Conflating the two would misleadingly tell a user their password is wrong when the real problem is OTP delivery.

**Single active session per account** (backend-enforced, not in this repo's frontend alone): `UserDetailsMaster.activeToken` (JWT-Auth service) stores the most recently issued JWT per user. `AuthController.login()` and `OtpController.verifyOtp()` both overwrite it on every successful token issuance — logging in again anywhere immediately supersedes whatever token was active before, it does not get rejected. Enforcement happens in `JwtService.isValidToken()`, called by the Gateway's `AuthenticationFilter` on *every* proxied request (`POST /v1/qcmt/auth/authenticate`): if the presented token no longer matches `activeToken`, it returns `{valid:false, reason:"SESSION_SUPERSEDED"}` instead of a plain boolean; the Gateway relays that as a `X-Auth-Reason: SESSION_SUPERSEDED` response header on the 401 it sends back. Different user accounts are entirely unaffected by each other — this is purely per-username.
- `UsermanagementService.logout()` calls the new `/v1/qcmt/auth/logout` endpoint (clears `activeToken` server-side) before clearing `localStorage` — best-effort, local session always clears regardless of the call's outcome.
- `UsermanagementService.clearSession()` is a **local-only** teardown (no backend call) — used by `tokenInterceptor` on a 401. This distinction matters: a superseded/stale token's *signature* is still valid, so if the interceptor called full `logout()` with it, that stale token would successfully authenticate against the auth service's own Spring Security filter chain (which only checks signature/expiry, not `activeToken`) and null out `activeToken` again — silently kicking out the *new* session that just superseded it. Never call `logout()` (only `clearSession()`) from 401-handling code paths.
- Rows created before this feature shipped have `activeToken = null`; `isValidToken()` treats `null` as "no session tracked yet" (always valid) rather than "always superseded", so existing logged-in users aren't force-logged-out by the deploy — enforcement kicks in from each user's next login onward. `JwtService.logout()` therefore does **not** reuse `null` to mark a logged-out session — it sets `activeToken` to `LOGGED_OUT_MARKER` (an empty string, which can never equal a real JWT) instead. Reusing `null` there was a real bug (found via external VAPT): since `null` means "always valid", a token presented right after logout would have kept passing `isValidToken()` until its natural 10h expiry.

### App Layout
`AppComponent.shouldShowHeader()` splits the UI into two layouts:
- **Public pages** (`/`, `/about`, `/contact`, `/login`, `/updatepassword`, `/privacy`, `/terms`) — show `HeaderComponent` (top nav only)
- **Authenticated pages** — show `LeftSidebarComponent` (responsive: collapses below 768px) + `MainComponent`
`ToastComponent` is always rendered at the app root level.

[src/app/app.routes.server.ts](src/app/app.routes.server.ts)'s `serverRoutes` prerenders exactly this public-page set (plus a `**` → `RenderMode.Client` fallback) and nothing else — any route behind `AuthGuard` must stay client-rendered. The auth token lives in `localStorage`, which is invisible during prerendering/SSR, so prerendering a guarded route would bake in the guard's login-redirect markup as that page's static output (seen as a flash of the login page on refresh before the client router corrects it). Adding a new public route means adding it here too, or it silently falls back to client rendering.

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
| Internal | `/iaudit` | `InternalAuditService` | `/v1/qcmt/master/saveinternalaudit`, etc. |
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

Internal Audit (`InternalAuditComponent`, route `/iaudit`) is a single flat standalone component — it injects `InternalAuditService`, `UnitService`, `UsermanagementService` directly (no facade/shared-state layer). Model is `InternalAuditRecord` (defined in `src/app/interface/InternalAuditRecord.ts`, like every other model — there is no longer a separate co-located model file for Internal Audit).

Internal Audit workflow moves through named "buckets" carried in the `status` string field: **Auditor Bucket** → **IG/DIG Bucket** → **CASO Bucket** (compliance/observation stages) → closed. `isAuditor`/`isIgDig` getters on the component derive the current user's role from `auditorList` membership and unit `unitType` (`Zone`/`Sector`) respectively — there's no separate RBAC-driven role flag for this module.

CISF Airport Sector hierarchy underlies IG/DIG-related filtering:
- 2 Sectors (APS I, APS II) headed by IG
- 4 Zones (NZ, WZ, SZ, ENEZ) headed by DIG
- Units fall under Zones, which fall under Sectors

The `/bcas` → `bcas-internal` sub-component keeps its own `igDigUserList` getter (unit `unitType === 'Zone' || 'Sector'`) — this logic is duplicated per-component now, not shared, so check both places when changing IG/DIG eligibility rules.

Internal Audit creation form follows the BCAS pattern: audit name auto-generated (`UnitName - Internal Audit - Month Year`), unit locked to logged-in user, CASO auto-filled from unit, file upload restricted to PDF/Word (.pdf/.doc/.docx). The backend `saveinternalaudit` endpoint accepts `multipart/form-data` (not JSON). `fromDate`/`toDate` are not set at creation — they are updated in a later workflow stage by another user.

Backend entity: `InternalAuditMaster` with `@OneToMany` relationships to `InternalAuditQuestionMaster`, `InternalAuditResponseMaster`, `InternalAuditFileMaster`, `InternalAuditObservationMaster`, and an `@ElementCollection` for `complianceTrail`. Controller is `InternalAuditController` (separate from `MasterController`).

### Service Patterns
Services use two patterns for cross-component communication:
- **`BehaviorSubject`** — for shared state (e.g., `currentAuditData$`, global `username$`/`userId$`)
- **`Subject` with `triggerRefresh()`** — to signal list components to re-fetch after mutations; each domain service embeds its own `refreshList$` Subject; `RefreshService` (`service/refresh.service.ts`) is a standalone version for cross-service use

File uploads that need progress tracking use `{ reportProgress: true, observe: 'events', responseType: 'text' }` on `http.post()` (used in `submitAuditorResponse`, `submitAuditObservationMessageCASO`, etc.).

### Shared Utilities
- **`DownloadService`** (`service/download.service.ts`) — `downloadCsv()`, `downloadExcel()`, `downloadPdf()` using `file-saver`, `xlsx`, and `jspdf-autotable`; pass an array of objects and optional column config. Also `downloadAuditFile(fullPath, documentName)` — the one download method that hits the backend (`GET /v1/qcmt/master/auditfile`) rather than building a file client-side: fetches via `HttpClient` with `responseType: 'blob'` (so `tokenInterceptor` attaches the Bearer token) and saves via `file-saver`. Every audit-file "Download" link across the app (`auditboard`, `adminauditschedule`, `audit-board-caso`, `auditschedule`, `auditorresponseform`, `iqcuauditlist`, `audit-observation-chat-component`) calls this — none of them use a raw `<a href="...auditfile?fullPath=...">` anymore, because `/auditfile` now requires auth and a plain anchor tag can't carry a custom header. Each component keeps a thin `downloadFile(path, documentName)` wrapper calling this service (their older `buildDownloadUrl()` method is still present in some components for other internal uses — don't assume its presence means the download button still uses it).
- **`ToastService`** (`service/toast.service.ts`) — call `toastService.show(message, type, duration)` where `type` is `'success' | 'error' | 'warning' | 'info'`; the `ToastComponent` renders `ToastService.toasts` directly (no Observable needed)

### Models / Interfaces
All TypeScript interfaces live in [src/app/interface/](src/app/interface/), including Internal Audit's (`InternalAuditRecord.ts`, exporting typed unions for status/observation types) — there is no per-module exception anymore.

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
├── internal-audit/           # Standalone Internal Audit (/iaudit route — DUPLICATE of bcas-internal); flat component, no facade
├── otherauditapshqrsdesk/    # APS HQrs tabbed view of BCAS + ICAO + Internal audits
├── dashboard/                # Dashboard with Chart.js doughnut chart
├── header/                   # Navigation header
├── left-sidebar/             # Sidebar navigation
├── pipe/                     # filter-pipe for search/filter
└── toast/                    # Toast notification service + component
```

### Important Gotchas

**Dual ICAO/Internal components**: The `/bcas` route renders `BcasComponent` which contains three tab sub-components: `BcasBcasComponent`, `BcasIcaoComponent`, `BcasInternalComponent`. There are ALSO standalone route components `IcaoComponent` (`/icao`) and `InternalAuditComponent` (`/iaudit`). When making changes to ICAO or Internal Audit, you must update BOTH the `/bcas` sub-component AND the standalone component — they are separate codebases with duplicated logic.

**Change-password validation is triplicated**: `changepassword/childcomponent/chagepasswordchild/`, `register/changepassword/`, and `login/updatepassword/` each carry their own independent copy of the same `newPassword` form group (identical `Validators.pattern` regex, identical error messages in the template). There's no shared validator/component — a fix to the password rules or their error messages must be applied in all three, exactly like the ICAO/Internal duplication above. (One real bug found this way: the regex's lookahead accepted `@` as a valid special character but the character class didn't, silently rejecting passwords containing `@` in two of the three copies while showing an unrelated "must include uppercase/lowercase" message that the regex never actually enforced.)

**Orphaned components**: `src/app/adminauditschedule/` and `src/app/student/` exist in the tree but aren't part of the audit domain — `adminauditschedule` isn't referenced in `app.routes.ts` or anywhere else (dead code), and `student`/`settings` are routed (`/student`, `/settings`, both behind `AuthGuard`) but are generic scaffolding-style pages unrelated to the CISF audit workflow. Don't assume either reflects current architecture patterns. `src/app/RBAC/` (`role/`, `permission/`, `permission-assignment/`, `rolepermission/`) is also unrouted — none of its components appear in `app.routes.ts` or the sidebar, so the role/permission management UI is built but not currently reachable.

**Unit locking**: BCAS (`bcas-bcas`) and ICAO (`bcas-icao`, `icao`) lock the unit to the logged-in user's assigned unit. The `unitId` form control is disabled at construction. After any `form.reset()`, you must re-disable it. Always use `getLoggedUserDetailList()` (Master service) — never `getUserProfileDetails()` (Auth service) — to get `unitid`.

**CASO name display format**: All user names stored in the backend use `formatDisplayName()` which returns "CISFNo, Rank, Name". Frontend table displays should use the same order: `{{ casoNo }}, {{ casoRank }}, {{ casoName }}`.

**ICAO submit confirmation**: The ICAO create form (`bcas-icao`) uses a two-step submit: `confirmSubmit()` validates and shows a warning alert, then `saveAudit()` performs the actual submission. The button reads "Submit to APS HQrs" (not "Save Audit").

**CSP ↔ file server URL sync**: When the file server base URL in `app.constants.ts` changes, you must also update the `connect-src` directive in `src/server.ts` to match — otherwise the browser will block API/file requests in production SSR mode. The CSP also needs `frame-src 'self' blob:` for the PDF file viewer (blob URLs rendered in iframes).

**Relative paths for `HttpClient`, never `APP_CONSTANTS.FILES.BASE_URL`**: `DownloadService.downloadAuditFile()` (and every other authenticated blob-fetch, e.g. `BcasAuditService.getBcasFile()`) must build its URL as a relative path (`/v1/qcmt/master/...`) so the dev-server proxy / same-origin routing handles it. `APP_CONSTANTS.FILES.BASE_URL` is an absolute cross-origin URL that only ever worked for a plain `<a href>` — browsers don't apply CORS to top-level navigation, but they do to `fetch`/`XHR`, and this app's Gateway CORS config is non-functional (dead property path), so an absolute-URL `HttpClient` call there is silently blocked. This bit a real fix: `downloadAuditFile()` briefly reused the anchor-tag's absolute-URL construction and broke every download until switched to a relative path.

**File-serving/upload endpoints, security posture** (findings from an external VAPT engagement, several since remediated):
- All four file-serving endpoints (`/auditfile`, `/bcasfile`, `/icaofile`, `/internalauditfile`) require auth and confine `fullPath` to the app's own storage directories via `FilePathValidator` (`QCMT-Master/util/`) — added after a path-traversal finding (`fullPath=/etc/passwd`) chained into server compromise via a weak/reused OS account password. The OS-credential half of that finding isn't fixable from this repo — it needs direct server remediation.
- Not every upload endpoint originally enforced `FileUploadValidator`'s PDF/Word-only allowlist — `MasterController.casoResponseFileUpload()` (`/auditcasofileupload`, backs the CASO audit-board file upload) accepted any file type unchecked until this was found and fixed. When adding a new upload endpoint, always wire in `fileUploadValidator.isAllowed(file)` before writing to disk — it is not automatic just because sibling endpoints have it.
- `JwtService.logout()` sets `activeToken` to an empty-string sentinel (`LOGGED_OUT_MARKER`), not `null` — see the single-active-session note above for why reusing `null` there was a real bug.
- `AuthController.changePassword()` rejects a new password equal to the current one (server-side) — the frontend already had this same check client-side (`updatepassword.component.ts`), which is exactly why it was bypassable by calling the API directly.
- `SecurityHeadersFilter` (`QCMT-Gateway/config/`, a `GlobalFilter`) sets hardening headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, a strict `default-src 'none'` CSP) on every Gateway response — these previously existed only on Angular SSR's own HTML responses (`src/server.ts`), so a direct API call bypassed all of them.

**Font Awesome Free only**: The project uses `@fortawesome/fontawesome-free` (v7). Use `fas` (solid), `far` (regular), or `fab` (brands) prefixes — never `fal` (light), which requires Font Awesome Pro and will render as blank/broken icons.

**Unit Master `unitType` field**: The `UnitDetails` interface, `UnitMaster` entity (both QCMT-Master and JWT-Auth), `UnitMasterBean`, and `UnitMasterBeanConverter` all carry `unitType`. The dropdown values are: ADG HQ, Sector, Zone, DIG Unit, Unit. When adding new fields to master entities, remember to update all four layers: interface (frontend) → bean → converter → entity (backend, both services if shared).

### Styling
- Bootstrap 5 + ng-bootstrap for modals, tables, forms
- Bootstrap Icons + Font Awesome Free (use `fas`/`far`/`fab` prefixes only)
- jQuery and Popper.js included as global scripts (legacy, used via Bootstrap)
- Custom styles in [src/styles.css](src/styles.css)
