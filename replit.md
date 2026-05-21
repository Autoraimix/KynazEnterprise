# Kynaz Enterprise Portal

Malaysia's integrated insurance, takaful, and road tax service portal with a cashback/referral rewards system, customer dashboard, and admin portal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 → proxied at `/api`)
- `pnpm --filter @workspace/kynaz run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Frontend: React 19 + Vite, Tailwind CSS, shadcn/ui, Framer Motion, Wouter
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/` — Express route handlers (auth, services, quotations, cashback, referrals, dashboard, admin)
- `artifacts/kynaz/src/pages/` — React pages split into `public/`, `auth/`, `dashboard/`, `admin/`
- `artifacts/kynaz/src/components/layout/` — PublicLayout, ProtectedLayout, AdminLayout, Navbar, Footer
- `artifacts/kynaz/src/context/AuthContext.tsx` — auth state, localStorage persistence, `setAuthTokenGetter` wiring
- `lib/db/src/schema/` — Drizzle schema files (users, services, quotations, cashback, referrals, notifications, settings/testimonials)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated hooks & schemas (do not edit manually)
- `lib/api-zod/` — Zod validation schemas for request bodies

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → React Query hooks. No manual fetch calls in components.
- **Auth**: SHA-256 password hashing with salt `kynaz_salt_2024`. In-memory token Map on server. Token stored in `localStorage` under `kynaz_token`/`kynaz_user`. `setAuthTokenGetter` from the api-client injects the token into all API requests.
- **Route protection**: Frontend redirects unauthenticated users to `/login`. Backend enforces `requireAuth` and `requireAdmin` middleware.
- **Admin quotation detail**: No `GET /admin/quotations/:id` endpoint — `AdminQuotationDetail` uses `useListAdminQuotations` and filters by ID locally.
- **Home icon naming**: `Home` lucide icon is aliased as `HomeIcon` in public pages to avoid conflict with the exported `Home` function.

## Product

- **Public site**: Landing page, Services catalogue (10 services), Service detail with quotation CTA, About, Contact
- **Auth**: Login, Register, Forgot Password
- **Customer dashboard**: Summary, Quotations list + detail (accept flow), New Quotation form, Cashback wallet, Referrals, Notifications, Profile
- **Admin portal**: Dashboard with stats, Quotation management (status updates, remarks, document URL), User management (suspend/unsuspend), Cashback adjustments, Settings (fast mode toggle)

## Demo accounts (seeded)

- Customer: `demo@kynaz.com` / `demo123`
- Admin: `admin@kynaz.com` / `admin123`

## User preferences

- Design: corporate fintech, dark navy (`#0d1f3c`) + emerald green + gold (`#c9a84c`) accent
- Framer Motion page transitions throughout
- Malaysian context: RM currency, EN-MY locale for dates

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes before editing frontend
- `getListAdminQuotationsQueryKey()` takes no parameters
- `useSuspendUser` handles both suspend and unsuspend — pass `{ data: { suspended: true/false } }`
- `useGetQuotation(id, { query: { enabled: !!id, queryKey: getGetQuotationQueryKey(id) } })` — queryKey is required in UseQueryOptions
- Never use `Home` from lucide-react without aliasing when in a file that exports a component named `Home`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
