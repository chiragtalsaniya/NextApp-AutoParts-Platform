# Bolt Implementation Plan

## Purpose

Use this document as the implementation plan after the initial repository review.
The repository is a monorepo with these current applications:

- `apps/NextApp-CRM`: React, TypeScript, and Vite administration portal
- `apps/NextApp-Mobile`: Expo and React Native application
- `apps/Nextapp-API`: Node.js and Express REST API
- `packages/shared-types`: shared TypeScript API contracts
- `database/mysql`: authoritative MySQL initializer and schema scripts
- `database/supabase`: historical/reference files only; not used at runtime

MySQL is the only authoritative application database. The Express API is the only
runtime database access layer. CRM and Mobile must never connect directly to
Supabase, MySQL, or any other database service. The files under `database/supabase`
are historical/reference assets and must not be used for new runtime behavior.

Do not treat README claims or the existing status matrix as proof that a feature
is complete. Verify behavior end to end against MySQL, API routes, CRM screens,
Mobile screens, authorization, validation, and tests.

## Non-negotiable Rules

1. Read `AGENTS.md` and every file under `docs/` before changing code.
2. Work on one bounded feature at a time.
3. Preserve existing API routes unless all consumers are migrated in the same change.
4. Shared request, response, entity, role, and pagination types belong in `packages/shared-types`.
5. Do not share React web components with React Native components.
6. Enforce authorization in the API. Client-side route guards are not sufficient.
7. Never commit `.env` files, passwords, JWT secrets, private keys, or database credentials.
8. Use parameterized SQL and validate every request body, query parameter, and path parameter.
9. Every feature must handle loading, empty, validation, unauthorized, forbidden,
   network failure, server failure, and success states.
10. Run focused tests after each slice and the full validation suite before release.
11. Do not use `--force` or `--legacy-peer-deps` to hide dependency conflicts.
12. Keep Mobile out of the Linux server deployment workflow unless Mobile deployment
    is explicitly requested. The server workflow deploys CRM and API only.
13. Maintain the production origins: `https://yogrind.shop` and the configured
    localhost development origins.
14. Every feature must be implemented and verified across the complete path:
  MySQL schema and migration, API route/service/authorization, shared contract,
  CRM consumer, Mobile consumer, and automated tests.

## Current Baseline

The API currently has route modules for:

- Authentication
- Users
- Companies
- Stores
- Retailers
- Parts
- Orders
- Regions
- Reports
- Item status

The web portal has screens for dashboard, companies, stores, users, retailers,
parts, orders, regions, reports, item status, and settings.

The Mobile app has screens for authentication, dashboard, inventory, parts,
retailers, orders, order creation, order details, reports, and profile.

The following are known completion gaps from the current project status:

| Area | Current status | Required outcome |
|---|---|---|
| Authentication tests | Incomplete | Tested login, refresh, logout, protected routes, expiry, and role access |
| Parts tests | Incomplete | Tested API, web, mobile, validation, stock behavior, and permissions |
| Orders tests | Incomplete | Tested lifecycle, totals, status transitions, and cross-app behavior |
| Push notifications | Not implemented | Decide, implement, test, or explicitly defer with documented reason |
| Offline synchronization | Not implemented | Define scope and implement Mobile sync or explicitly defer with documented reason |
| API contract consistency | Needs audit | Remove duplicate models and align all consumers with shared types |
| Security review | Needs audit | Remove secrets, verify authorization, validation, CORS, JWT, uploads, and rate limits |
| Deployment verification | Partially configured | Verify Linux server, HTTPS, Nginx, PM2, migrations, health checks, and rollback |

Update `docs/implementation-status.md` only after evidence exists.

## Required Execution Order

### Phase 0: Evidence and baseline

Before implementation:

1. Read `AGENTS.md`, all root docs, all app manifests, and all environment examples.
2. Map every web and Mobile API call to an actual API route.
3. Compare `packages/shared-types` with:
   - `apps/NextApp-CRM/src/types`
   - `apps/NextApp-Mobile/types`
   - API request and response shapes
4. Identify mocked data, hardcoded users, fake totals, TODOs, silent catches,
   insecure defaults, endpoints that return inconsistent shapes, and any direct
   Supabase/database access from CRM or Mobile.
5. Run the baseline commands and record failures without fixing unrelated issues:

```bash
npm ci
npm run build --workspace=apps/NextApp-CRM
npm run lint --workspace=apps/NextApp-CRM
npm run lint --workspace=apps/NextApp-Mobile
node --check apps/Nextapp-API/index.js
```

6. Produce a short report with file paths, route names, severity, and a proposed fix.
Do not change application code in Phase 0.

### Phase 1: MySQL authority, contract, and configuration cleanup

Remove database architecture ambiguity before adding features. Deliver one
MySQL-backed API contract consumed by both clients.

Tasks:

- Complete shared models for authentication, users, roles, parts, orders,
  retailers, stores, pagination, API errors, and validation payloads.
- Inventory every table used by the API and document its MySQL schema, keys,
  relationships, indexes, and migration/initializer ownership.
- Remove or isolate direct CRM Supabase usage, including Supabase client imports,
  Supabase auth calls, direct table queries, and Supabase-only environment
  variables. Replace runtime behavior with API calls backed by MySQL.
- Treat `database/supabase` as historical/reference only. Convert any required
  schema behavior into MySQL scripts; do not execute both database systems for
  the same feature.
- Add shared role and permission constants without importing UI code.
- Add shared endpoint path constants only when they reduce duplication and do
  not hide route differences.
- Replace duplicate CRM and Mobile entity interfaces with type-only imports from
  `@nextapp/shared-types` where the wire shape is actually the same.
- Document intentional database-field-to-API-field transformations.
- Standardize response envelopes and error responses.
- Keep secrets only in server environment files.
- Ensure CRM uses `VITE_API_URL`, Mobile uses `EXPO_PUBLIC_API_URL`, and API uses
  `WEB_ORIGINS` plus database and JWT configuration.

Acceptance criteria:

- No duplicated API model is used by both clients.
- API responses are typed in shared contracts.
- MySQL is the only runtime database and all CRM/Mobile data access goes through
  the Express API.
- Every runtime table has a repeatable MySQL schema/initializer path and is
  covered by API integration fixtures.
- Invalid environment configuration fails clearly at startup or build time.
- No real secret appears in tracked files, examples, logs, or compiled frontend code.

### Phase 2: Authentication and authorization

Make authentication the first complete vertical slice because every later feature
depends on it.

Database/API tasks:

- Verify password hashing and comparison.
- Verify JWT access-token expiry and refresh-token behavior.
- Add refresh-token rotation or document why the current design is sufficient.
- Implement logout or token revocation behavior appropriate to the current token design.
- Validate login, refresh, password change, and profile requests.
- Return consistent `401` and `403` responses.
- Enforce role and resource ownership rules in API middleware and route handlers.
- Remove development credentials and insecure password fallbacks.

Web tasks:

- Verify login, logout, session restore, expired-token handling, and redirect behavior.
- Ensure protected routes do not render protected data before authentication is known.
- Show clear loading, invalid-credentials, expired-session, forbidden, and network states.

Mobile tasks:

- Verify secure token storage, session restoration, logout, expired-token handling,
  and navigation reset after logout.
- Ensure all protected screens handle an unauthenticated state.

Tests:

- Login success and invalid credentials
- Expired access token
- Refresh success, refresh failure, and reuse behavior
- Logout/session clearing
- Every role accessing an allowed and forbidden endpoint
- Resource ownership checks for retailer, store, and company-scoped data

### Phase 3: Parts and inventory

Complete the parts catalog and stock behavior across database, API, web, and Mobile.

Tasks:

- Verify the canonical part field names and price units.
- Define stock quantity semantics and avoid mixing catalog data with store-level stock.
- Validate create, update, search, filtering, sorting, pagination, categories,
  focus groups, low-stock alerts, and image handling.
- Verify item-status behavior for branch and part combinations.
- Enforce which roles can create, edit, view, and update stock.
- Add transaction-safe stock updates where orders or sales change stock.
- Ensure web and Mobile use identical pagination and error contracts.
- Add loading, empty, low-stock, invalid-part, forbidden, and server-error states.

Tests:

- Part validation and duplicate part number
- Search, filters, sort, pagination, and empty results
- Role permissions for catalog and stock updates
- Store-specific stock calculations
- Low-stock threshold behavior
- Item-status create/update and invalid branch/part combinations

### Phase 4: Retailers, companies, stores, users, and regions

Finish the supporting master data before order completion work.

Tasks:

- Verify CRUD validation and deletion rules for each master entity.
- Add pagination and consistent response envelopes where lists can grow.
- Enforce company, store, region, and retailer relationships in the API.
- Prevent deletion of records referenced by orders or other protected records.
- Verify image upload limits, content type validation, storage paths, and cleanup.
- Ensure web and Mobile show permission-aware actions rather than only hiding buttons.
- Add audit entries for privileged changes where the database supports audit logs.

Tests:

- CRUD success, invalid payloads, missing records, and duplicate records
- Relationship and deletion protection
- Role matrix for Super Admin, Admin, Manager, Storeman, Salesman, and Retailer
- Upload validation and unauthorized upload attempts
- Pagination and empty states

### Phase 5: Orders and lifecycle

Implement the order flow as one vertical feature, not as isolated screens.

Database/API tasks:

- Verify order and order-item field names, price units, discounts, and totals.
- Define and enforce valid status transitions in one shared business-rule module.
- Validate quantities, part availability, retailer ownership, branch access,
  purchase-order fields, urgency, and remarks.
- Use transactions for order creation, item insertion, totals, and stock effects.
- Define idempotency behavior for retries from Mobile.
- Verify status update authorization by role and current status.
- Return a stable order detail shape including items and related display fields.

Web/Mobile tasks:

- Create, list, filter, search, view, and update orders using the same contracts.
- Show status history or a clear lifecycle timeline.
- Prevent invalid transitions in the UI while keeping API enforcement authoritative.
- Handle partial failures and retry behavior.
- Cover loading, empty orders, validation errors, forbidden actions, offline/error,
  and successful creation/update states.

Tests:

- Order creation validation and transaction rollback
- Totals, discounts, urgent flag, and quantity calculations
- Valid and invalid status transitions
- Role-based status updates
- Duplicate submission/idempotency behavior
- Retailer/store/company data isolation
- Web and Mobile contract compatibility

### Phase 6: Reports and dashboard correctness

Treat reports as derived data that must be verified against source tables.

Tasks:

- Define report filters, date/timezone rules, pagination, and export limits.
- Compare dashboard totals with direct database queries for representative fixtures.
- Verify reports/orders, reports/inventory, reports/sales, and reports/retailers.
- Protect sensitive reports by role and scope.
- Add server-side limits to expensive queries.
- Add empty, invalid-date, no-permission, and query-failure states.

Tests:

- Date boundaries and timezone behavior
- Role-limited report access
- Totals against known fixtures
- Large result pagination/limits
- Export content and error behavior

### Phase 7: Mobile offline and notifications decision

Do not implement these as vague feature requests. First create a technical design.

Offline synchronization design must specify:

- Offline-readable entities
- Offline-create/update entities
- Local storage technology
- Queue format and operation IDs
- Conflict resolution rules
- Retry and backoff behavior
- Authentication and sensitive data handling
- Connectivity indicators and user-visible sync states
- Server idempotency and cursor/version fields

Push notification design must specify:

- Provider and platform support
- Device-token registration and revocation
- Notification event types
- User and role targeting rules
- Deep links into Mobile screens
- Permission prompts and disabled states
- Delivery failure handling
- Secrets and server-side provider integration

If product requirements do not yet define these behaviors, mark them as deferred
in `docs/implementation-status.md` instead of adding a partial implementation.

### Phase 8: Security, reliability, and operations

Tasks:

- Remove all hardcoded credentials and unsafe defaults.
- Review CORS allowlist for production and localhost only.
- Review Helmet, rate limits, request body limits, file uploads, and error leakage.
- Validate all route parameters and query values with Joi or the established validator.
- Add structured request IDs and safe production logging.
- Ensure health checks do not expose secrets or database details.
- Verify migrations are repeatable and do not insert demo credentials in production.
- Add database indexes based on measured query paths.
- Add graceful shutdown for HTTP server and database pool.
- Define backup, restore, and rollback procedures.

### Phase 9: Testing and release hardening

Add the missing test foundation before declaring the system complete.

Recommended layers:

- Shared-type compile checks
- API unit tests for validators, authorization, and business rules
- API integration tests against an isolated test database
- Web component/page tests for auth and critical CRUD flows
- Mobile tests for auth, parts, order creation, and offline decision outcomes
- Contract tests that compare API payloads with shared types
- Smoke test for `/api/health` and production deployment

For every completed feature, record end-to-end evidence before marking it
complete:

| Layer | Evidence required |
|---|---|
| MySQL | Schema, keys, constraints, indexes, initializer/migration, and fixtures |
| API | Route, validation, query/service behavior, authorization, response contract, and error mapping |
| Shared types | Request, response, entity, enum, pagination, and error types used by consumers |
| CRM | API integration, permissions, loading, empty, validation, error, and success states |
| Mobile | API integration, permissions, loading, empty, validation, network/offline, error, and success states |
| Tests | Focused unit/integration/client tests plus a cross-layer smoke path |

Required commands should be available from the root:

```bash
npm run lint
npm run typecheck
npm test
npm run build --workspace=apps/NextApp-CRM
node --check apps/Nextapp-API/index.js
```

Do not claim full completion if a required command is missing. Add the command or
document why the project uses a different test runner.

### Phase 10: Deployment and production verification

The current deployment workflow builds CRM and deploys API to a Linux server.
Mobile is intentionally excluded from that server deployment.

Verify:

- Node.js 24 is installed on the server.
- `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, and `DEPLOY_SSH_KEY` are configured.
- The server has MySQL, Nginx, PM2, and Certbot as required.
- `/var/www/nextapp-autoparts/apps/Nextapp-API/.env` exists only on the server.
- Nginx serves `apps/NextApp-CRM/dist` and proxies `/api/` to port 3001.
- HTTPS works for `https://yogrind.shop`.
- CORS accepts `https://yogrind.shop` and intended localhost origins.
- Database migrations run successfully and safely on a fresh and existing database.
- PM2 restart and rollback behavior is documented.
- Deployment health check passes: `https://yogrind.shop/api/health`.

## Bolt Working Protocol

For each phase, Bolt must:

1. State the exact files and behavior it will change.
2. Identify the database, API, web, Mobile, shared-type, and test impact.
3. Implement the smallest vertical slice.
4. Add or update focused tests.
5. Run focused validation.
6. Report failures and remaining risks.
7. Update `docs/implementation-status.md` only with evidence.
8. Stop and request the next bounded slice instead of expanding scope.

## Bounded Prompts

Use these prompts one at a time, in order. Replace the phase number only after the
previous phase's acceptance criteria pass.

### Prompt 1: Baseline audit

```text
Read AGENTS.md and every file under docs. Inspect all package.json files,
environment examples, API routes, database scripts, shared types, web services,
and Mobile services. Do not change code.

Map every web and Mobile API call to an API route. Find duplicate models,
mocked data, hardcoded credentials, incomplete authorization, inconsistent
responses, missing validation, missing tests, and inaccurate documentation.

Create a prioritized report with file paths, severity, evidence, and the smallest
recommended fix. Run only baseline checks needed to support the report.
```

### Prompt 2: Shared contracts and configuration

```text
Implement only the shared contract and configuration cleanup from Phase 1 of
docs/bolt-implementation-plan.md. Do not implement new UI features.

Use packages/shared-types as the source of truth. Migrate only models whose wire
shape is verified. Preserve existing API endpoints. Add focused compile checks
and update environment examples if needed. Run the relevant typecheck/build
commands and report any unresolved contract mismatches.
```

### Prompt 3: Authentication

```text
Implement only the authentication and authorization vertical slice from Phase 2.
Cover API, database behavior, web, Mobile, shared types, validation, and tests.

Verify login, session restore, refresh, logout, expiry, password change, role
permissions, and resource ownership. Do not begin Parts or Orders. Do not weaken
JWT, CORS, validation, or error handling to make tests pass.
```

### Prompt 4: Parts and inventory

```text
Implement only the Parts and inventory vertical slice from Phase 3.

First verify field names and price/stock units against the database and API.
Then align shared contracts, API validation/authorization, CRM, Mobile, loading,
empty, error, pagination, filters, and focused tests. Do not change Orders except
where a verified stock rule is required and documented.
```

### Prompt 5: Master data

```text
Implement only the supporting master-data slice from Phase 4: companies, stores,
retailers, users, and regions.

Verify relationships, role scope, deletion protection, pagination, upload
validation, loading/empty/error states, shared types, and focused tests. Preserve
existing endpoint paths and report any API response mismatch before changing it.
```

### Prompt 6: Orders

```text
Implement only the Orders vertical slice from Phase 5.

Verify database fields, price units, totals, discounts, stock effects, status
transitions, authorization, idempotency, transactions, CRM, Mobile, shared types,
loading/empty/error states, and tests. Keep the status transition rules in one
business-rule module and enforce them on the API.
```

### Prompt 7: Reports

```text
Implement only the reports and dashboard correctness slice from Phase 6.

Verify each report against source-table fixtures, date boundaries, role scope,
query limits, pagination, exports, and UI states. Add focused tests. Do not add
new report types without documenting the API contract first.
```

### Prompt 8: Offline and notifications decision

```text
Review Phase 7 requirements and current product behavior. Do not write partial
offline or push-notification code.

Produce two short technical designs with data flow, storage, security, conflict
or delivery handling, API changes, client states, tests, and deployment impact.
If requirements are insufficient, update implementation-status.md to mark the
features deferred and explain the missing product decisions.
```

### Prompt 9: Security and operations

```text
Implement only the security, reliability, and operations review from Phase 8.

Audit secrets, CORS, JWT, validation, SQL parameters, uploads, rate limits,
Helmet, error leakage, logging, health checks, graceful shutdown, migrations,
and backups. Fix confirmed issues with focused tests. Do not perform unrelated
feature refactors.
```

### Prompt 10: Release readiness

```text
Run the complete release-hardening and deployment verification plan from Phases
9 and 10. Add missing root validation scripts, focused integration/smoke tests,
and deployment documentation. Verify the Node 24 GitHub Actions workflow,
Linux server prerequisites, Nginx, HTTPS, PM2, migrations, CORS, and the API
health check. Report anything that cannot be verified without server credentials.
Do not claim production readiness for unverified infrastructure.
```

## Definition of Complete

The system is complete only when:

- Shared API contracts are authoritative and consumed consistently.
- Authentication, refresh, logout, authorization, and resource scope are tested.
- Parts, inventory, master data, orders, and reports work across database, API,
  CRM, and Mobile where applicable.
- Every critical screen has loading, empty, validation, unauthorized, forbidden,
  network, server-error, and success states.
- No secrets or insecure credential defaults are tracked.
- Offline sync and push notifications are either fully designed and implemented
  with tests or explicitly deferred with documented product decisions.
- Root validation commands pass.
- The Node 24 deployment workflow succeeds on a clean runner.
- The production health check and rollback procedure are verified.
- `docs/implementation-status.md` reflects evidence, not assumptions.
