## Project Tour

This is a quick guided tour of the most important files so you can find your way around.

### 1) Pages (UI entry points)
- `src/app/page.tsx` → Home dashboard (charts, counts, recent lists)
- `src/app/belts/page.tsx` → Belts listing with filters
- `src/app/profiles/page.tsx` → Profiles listing with filters
- `src/app/profile/page.tsx` → Your profile (connect wallet, edit metadata, accept promotions)

These are React components that render the page. They use React Query to fetch data.

### 2) Components (reusable UI)
- `src/components/Navigation.tsx` → Top navigation bar
- `src/components/BeltList.tsx` / `ProfileList.tsx` → Render lists with pagination
- `src/components/LoginModal.tsx` → Sign in/create profile and build/submit transactions
- `src/components/AwardBeltModal.tsx` → Promote a profile (build/submit transaction)

### 3) Data access layer
- `src/lib/api.ts` → Central API wrapper (typed). Some calls go directly to the backend, others go through Next API routes.
- `src/config/api.ts` → API base URL, credentials, and chain-related config (network id, policy id).

### 4) Server endpoints (Next API routes)
- `src/app/api/build-tx/route.ts` → Build unsigned transaction (proxy to backend)
- `src/app/api/submit-tx/route.ts` → Submit signed transaction (proxy to backend)
- `src/app/api/practitioner/[id]/route.ts` / `organization/[id]/route.ts` → Fetch profiles via proxy
- `src/app/api/profile-image/route.ts` → Upload/resize/store avatar image
- `src/app/api/profile-metadata/route.ts` → Store profile contact info in SQLite (fallback to memory)

### 5) Global state and types
- `src/contexts/AuthContext.tsx` → Stores profile id/type in localStorage and fetches the current user profile
- `src/types/api.ts` → TypeScript types (belts, ranks, promotions, interactions)
- `src/app/providers.tsx` → React Query and AuthProvider wrappers

### 6) Useful scripts
- `scripts/test-api.js` → Quick test that backend endpoints are reachable
- `scripts/test-build-tx.js` → Exercise the /build-tx endpoint with different address shapes
- `scripts/init-db.js` → Initialize local SQLite database for metadata

### 7) Config and build
- `next.config.ts` → Next.js config (enables async WebAssembly for Cardano libs)
- `tsconfig.json` → TypeScript settings and path aliases

With these in mind, check `docs/ARCHITECTURE.md` for a diagram of how requests flow from the UI to the backend.


