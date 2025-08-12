## BJJ DApp Web

Next.js app for the Decentralized BJJ Belt System.

### Prerequisites
- Node.js 20 (for local/dev)
- Docker + Docker Compose (for container deploy)

### Environment
Create `.env.local` (local dev) or `.env` (docker-compose) at project root:

```bash
NEXT_PUBLIC_API_URL=https://bjjserver-995707778143.europe-west1.run.app
NEXT_PUBLIC_PROFILE_POLICY_ID=<policy_id>
NEXT_PUBLIC_NETWORK_ID=1
```

### Development
```bash
npm ci
npm run dev
# http://localhost:3000
```

### Production build (bare metal)
```bash
npm ci
npm run build
npm run start -- -p 3000
```

Ensure the following directories exist and are writable for persistence:
- `data/` for SQLite DB (`profile-metadata`)
- `public/uploads/` for profile images

### Reverse proxy (optional)
Use Nginx to proxy `http://127.0.0.1:3000` and enable TLS. Increase `client_max_body_size` to allow uploads.

### Docker (recommended)
A multi-stage Dockerfile and docker-compose are provided.

1) Build and run
```bash
docker compose up -d --build
```

2) Volumes (persisted on host)
- `./data` → `/app/data`
- `./public/uploads` → `/app/public/uploads`

3) Environment (compose reads from `.env`)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PROFILE_POLICY_ID`
- `NEXT_PUBLIC_NETWORK_ID`

### Server-side API proxies
To keep Basic Auth server-side, the app uses Next.js API routes to proxy to the backend:
- `/api/build-tx`, `/api/submit-tx`
- `/api/practitioner/[id]`, `/api/organization/[id]`
- `/api/belts`, `/api/belts/count`, `/api/belts/frequency`
- `/api/promotions`, `/api/promotions/count`
- `/api/profiles`, `/api/profiles/count`

Client calls (in `src/lib/api.ts`) target these routes; no Basic Auth is exposed to the browser.

### Persistence
- Off-chain profile metadata stored in SQLite at `data/metadata.db` via `/api/profile-metadata`.
- Profile images stored under `public/uploads/` (resized WebP), uploaded via `/api/profile-image`.

### Notes
- Native modules: `better-sqlite3`, `sharp` are built in the Docker image. If building on host, you may need build-essential and Python.
- If you change env values, rebuild or restart the container: `docker compose up -d --build`.
