# Site Field Journal

Mobile-first field note journal for a one-off site visit.

## Features

- Live map with current position.
- Heading indicator from orientation sensor (fallback to geolocation heading when available).
- Drop pings at current location.
- Two measurement modes:
  - `direct`: one reading.
  - `calculated`: base + top readings (stored as entered, no computed final height).
- Local-first persistence in IndexedDB.
- Cloud sync to Supabase via protected Next.js API routes.
- Import/export tools (`JSON` and `CSV`).
- Responsive layouts for phone, tablet, and desktop.

## Stack

- Next.js (App Router) + TypeScript
- Leaflet + React-Leaflet
- Dexie (IndexedDB)
- Supabase Postgres
- Zod for validation
- `jose` for passcode-unlocked JWT session tokens

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy env file and fill values:

```bash
cp .env.example .env.local
```

3. Create Supabase table using `supabase/schema.sql`.

4. Run dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Required server env vars

- `VISIT_PASSCODE`
- `SESSION_SIGNING_KEY` (32+ chars)
- `VISIT_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Client env vars

- `NEXT_PUBLIC_DEFAULT_UNIT` (`imperial` or `metric`)
- `NEXT_PUBLIC_VISIT_ID` (must match `VISIT_ID` for consistency)

## API

- `POST /api/unlock`
- `GET /api/entries?since=<ISO8601 optional>`
- `POST /api/entries/batch-upsert`
- `GET /api/health`

## Sync Behavior

- Entry writes are always local-first.
- When unlocked and online, pending entries upsert to cloud.
- Cloud entries are merged into local store (`updatedAt` latest wins).

## Deployment (Vercel)

1. Push repo to Git provider.
2. Import project in Vercel.
3. Add all environment variables.
4. Deploy.

Use HTTPS in production for geolocation and orientation APIs.
