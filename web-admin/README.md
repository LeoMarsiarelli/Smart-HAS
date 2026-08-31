# Smart HAS — Web Admin Dashboard

Angular admin dashboard for **Smart HAS** (Hipertensão Arterial Sistêmica /
systemic hypertension monitoring), Part 3 of the FIAP assignment. It consumes
the same REST API used by the mobile app, as defined in
[`../docs/api-contract.md`](../docs/api-contract.md), and includes the
**AI Logistics Extension** view (medication delivery requests prioritized by
the backend's rules engine).

Built with Angular 17 (standalone components, no NgModules), scaffolded with
`@angular/cli`.

## Install & run

```bash
cd web-admin
npm install
npm start        # same as `ng serve` — http://localhost:4200
```

The backend (Spring Boot, `../backend`) must be running at
`http://localhost:8080/api` with CORS open for local dev. Start it first,
then log in with a user created via its `/api/auth/register` endpoint (or
seed data), or register through your own test flow.

## Build

```bash
npm run build     # same as `ng build` — output in dist/web-admin
```

Build has been verified to compile cleanly (`npx ng build`, Angular 17.3.17,
Node 22.22.2 — see the "Sandbox notes" section below). `ng test` needs a
local Chrome/Chromium install (Karma) that is not available in every CI/
sandbox environment; the app itself does not depend on it.

## Pointing the app at the backend

The API base URL lives in `src/environments/environment.ts` (dev) and
`src/environments/environment.prod.ts` (used automatically for
`ng build --configuration production`, wired via `fileReplacements` in
`angular.json`):

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

Change `apiUrl` here if the backend runs on a different host/port (e.g. a
deployed instance) — every service reads it from `environment.apiUrl`,
nothing is hardcoded elsewhere.

## Structure

```
src/
  environments/
    environment.ts            dev config (apiUrl)
    environment.prod.ts       prod config, swapped in at build time
  app/
    models/                   TypeScript interfaces mirroring api-contract.md
      user.model.ts             User, AuthResponse
      reading.model.ts          BloodPressureReading, CreateReadingRequest
      delivery.model.ts         MedicationDeliveryRequest, CreateDeliveryRequest, ...
    services/                 HttpClient-based API access, one per resource
      auth.service.ts           login/register/logout, JWT + user in localStorage,
                                 currentUser$ observable for reactive UI
      reading.service.ts        GET/POST/PUT/DELETE /api/readings
      delivery.service.ts       GET/POST/DELETE /api/deliveries, PATCH .../status
    interceptors/
      auth.interceptor.ts       attaches `Authorization: Bearer <token>` to
                                 every outgoing HttpClient request
    guards/
      auth.guard.ts              blocks /home for anonymous users -> /login
      admin.guard.ts             blocks /admin for non-ADMIN users -> /home
    shared/navbar/               nav bar: login state, role badge, logout
    pages/
      login/                    template-driven login form ([(ngModel)],
                                 validation, success/error banners)
      home/                     overview: totals + counts by classification
                                 (readings) and priority (deliveries)
      admin/                    management view: filterable tables of
                                 readings and deliveries, inline delivery
                                 status update, delete actions, and the
                                 "create delivery request" ngModel form
    app.routes.ts               /login, /home, /admin, default + wildcard
    app.config.ts                provideHttpClient + auth interceptor, router
```

### Where each assignment requirement lives

- **HttpClient services**: `auth.service.ts`, `reading.service.ts`,
  `delivery.service.ts`. **Interceptor**: `interceptors/auth.interceptor.ts`,
  registered in `app.config.ts` via `provideHttpClient(withInterceptors([...]))`.
- **Data binding** (`{{ }}`, `[ ]`, `( )`, `[( )]`): used throughout, e.g.
  `home.component.html` and `admin.component.html` (interpolation for stats/
  table cells), `navbar.component.html` (`[class.active]`, `[class.role-admin]`),
  `(click)` on every button, `[(ngModel)]` on the login and delivery forms and
  on the admin page's filter/status `<select>`s.
- **`*ngIf` / `*ngFor`**: loading spinners, error/empty banners and role-based
  UI (`*ngIf="auth.isAdmin()"`) throughout `home` and `admin`; `*ngFor` renders
  the readings/deliveries tables and the stat cards.
- **`[(ngModel)]` form with validation + feedback**: the "Nova solicitação de
  entrega" form in `admin.component.html` (required fields, min length/value,
  success/error banners) and the login form in `login.component.html`.
- **Routing**: `app.routes.ts` — `/login`, `/home` (guarded), `/admin`
  (guarded, ADMIN only), `''` redirects to `/login`, wildcard redirects to
  `/login`. Nav bar (`shared/navbar`) shows/hides links based on login state
  and role.

## API assumptions (per `docs/api-contract.md`)

- Base URL `http://localhost:8080/api`, JWT via `Authorization: Bearer`.
- `classification` (readings) and `riskScore`/`priority`/`estimatedWindow*`
  (deliveries) are **server-computed** — the client never sends them; the
  "create delivery" form only posts `medicationName`, `quantity`,
  `deliveryAddress`.
- Delivery status changes use `PATCH /api/deliveries/{id}/status` with
  `{ status }`, not a full `PUT`.
- `GET /api/readings` accepts an optional `?userId=` (used by admins);
  `GET /api/deliveries` returns only the caller's own requests for a
  `PATIENT` and all requests for an `ADMIN` — no query param needed.

## Sandbox notes

This project was scaffolded with `npx @angular/cli@17 new` and built inside
this environment against Node 22.22.2 (Angular 17 officially targets Node
18/20, but the CLI ran without issue beyond a version warning). Both
`npm install` and `npx ng build` were run and completed successfully here.
`ng test` (Karma) could not be run headlessly because no Chrome/Chromium
binary is installed in this sandbox — set `CHROME_BIN` to a local Chrome
install to run it elsewhere.
