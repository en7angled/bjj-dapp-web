## High-level Architecture

This app is a full-stack Next.js application. The UI (React) runs in the browser, while simple server endpoints run inside Next.js API routes. Many data calls are proxied through those API routes to a separate backend service.

### Request/Data Flow

```mermaid
graph TD;
  A["User (Browser)"] --> B["React Pages\n(src/app/*/page.tsx)"];
  B --> C["BeltSystemAPI\n(src/lib/api.ts)"];
  C -- "Direct ky GETs\n(public data)" --> E["Backend Service\n(API_CONFIG.BASE_URL)"];
  C -- "Fetch to Next API\n(CORS/credentials)" --> D["Next API Routes\n(src/app/api/*/route.ts)"];
  D -- "Basic auth proxy\n-> fetch upstream" --> E;
  
  subgraph Client State
  F["AuthContext\n(src/contexts/AuthContext.tsx)"]
  G["React Query Cache\n(src/app/providers.tsx)"]
  end
  B --> F;
  B --> G;

  subgraph Assets
  H["Profile Image Upload\n(src/app/api/profile-image/route.ts)"]
  I["Public Uploads\n(public/uploads)"]
  end
  A -->|POST file| H;
  H --> I;
```

Key points:

- React pages/components call typed functions in `src/lib/api.ts`.
- Some functions call the Next API routes to keep credentials on the server and avoid CORS issues (e.g., building/submitting Cardano transactions, practitioner/org profile lookups).
- Next API routes proxy requests to the upstream backend defined by `API_CONFIG.BASE_URL` with Basic auth.
- Off-chain profile metadata and images are handled by Next API routes:
  - `profile-metadata` persists to SQLite (or memory fallback)
  - `profile-image` resizes and stores images under `public/uploads`

### Cardano Transaction Flow

```mermaid
sequenceDiagram
  participant UI as UI Component (LoginModal/AwardBeltModal)
  participant API as BeltSystemAPI (client)
  participant NAPI as Next API /api/build-tx
  participant BE as Backend Service
  participant WAL as Browser Wallet (CIP-30)

  UI->>API: buildTransaction(interaction)
  API->>NAPI: POST /api/build-tx
  NAPI->>BE: POST /build-tx (Basic auth)
  BE-->>NAPI: unsigned tx (hex)
  NAPI-->>API: unsigned tx (hex)
  API-->>UI: unsigned tx (hex)
  UI->>WAL: signTx(unsigned, partial = true)
  WAL-->>UI: witness set (or signed tx)
  UI->>API: submitTransaction({ tx_unsigned, tx_wit })
  API->>NAPI: POST /api/submit-tx
  NAPI->>BE: POST /submit-tx (Basic auth)
  BE-->>NAPI: tx id
  NAPI-->>API: tx id
  API-->>UI: tx id
```

Notes:

- The “interaction” object carries the action (e.g., create profile, promote profile) plus user addresses.
- Wallets sometimes return a full signed transaction instead of a witness set; components extract the witness set when needed before submission.

### Where to Find Things

- UI pages: `src/app/*/page.tsx`
- Reusable components: `src/components/*`
- Data access layer: `src/lib/api.ts`
- Global config: `src/config/api.ts`
- Auth/global state: `src/contexts/AuthContext.tsx`
- Next API routes (server): `src/app/api/**/route.ts`
- Types: `src/types/api.ts`


