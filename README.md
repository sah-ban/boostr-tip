# $BOOSTR Tip Tracker

A **Farcaster Mini App** (Frame v2) for the $BOOSTR tipping economy on Warpcast. Users tip each other by replying to casts with `100 $BOOSTR`. A bot validates tips against weekly allowances, awards points, and this dashboard lets users track everything in real-time.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | PostgreSQL via Prisma ORM |
| Blockchain | `viem` → Base mainnet |
| Farcaster | `@farcaster/miniapp-sdk`, `@farcaster/core` |
| Styling | Tailwind CSS |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | Base URL for API calls (e.g. `http://localhost:3000/api`) |
| `NEXT_PUBLIC_URL` | Public domain for the Mini App (used in Farcaster frame metadata) |
| `ALLOWED_DEV_ORIGIN` | Dev server IP/origin allowed by CORS |
| `BOT_FID` | FID of the Farcaster tipping bot (e.g. `545039`) |
| `SIGNER` | Ed25519 private key of the bot's Farcaster signer |
| `HUB_URL` | Farcaster Hub URL (e.g. `https://nemes.farcaster.xyz:2281`) |
| `HOOK_SECRET` | Secret key to validate incoming webhook payloads |
| `BOOSTR_CONTRACT_ADDRESS` | ERC-20 token address on Base (`0x4ed4e862860bed51a9570b96d89af5e1b0efefed`) |
| `RPC_URL` | Base RPC URL (use `https://base-rpc.publicnode.com` to avoid rate limits) |

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Run the development server

```bash
npm run dev            # default port 3000
npm run dev -- -p 3001 # custom port
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile production build |
| `npm start` | Run the production server |
| `npm run lint` | Run ESLint |
| `npm run allot` | **Weekly allowance script** — reads $BOOSTR holdings on Base and assigns weekly tip allowances to users |

---

## Weekly Allowance Cycle

The entire economy is week-based, anchored to **Week 0 = September 7, 2026**.

1. **Every Monday**, run `npm run allot` to distribute allowances based on each user's $BOOSTR token holdings on Base.
2. All `Points` and `Allowance` rows are stamped with the current week's `snapshotDay` (Monday midnight UTC), segmenting data into clean weekly buckets.
3. Week numbers are computed by `getAppWeekNumber()` in `src/lib/dateUtils.ts`.

---

## Architecture

### Webhook (`/webhook`)

Receives cast events from the Farcaster bot. For each incoming tip:

1. **Skips** any cast from `BOT_FID` (prevents infinite loops).
2. **Skips** self-tips (`senderFid === recipientFid`).
3. Looks up the sender's `Allowance` for the current week.
4. If sufficient balance: creates a `valid` tip, deducts allowance, and credits `Points` to both sender and recipient.
5. Posts a reply to the cast via the Farcaster Hub.

### API Routes

All routes are forced dynamic (`export const dynamic = "force-dynamic"`) to prevent stale build-time caching.

| Route | Description |
|---|---|
| `GET /api/user?fid=X` | Fetch or create a user profile |
| `GET /api/points?fid=X` | Current week's points and global rank |
| `GET /api/points/week?fid=X&week=0` | Points for a specific week (by number or date) |
| `GET /api/allowance?fid=X` | Historical weekly allowances |
| `GET /api/tips?fid=X` | Tips sent by user |
| `GET /api/tips/received?fid=X` | Tips received by user |
| `GET /api/leaderboard` | Top 100 by points (current week) |
| `GET /api/leaderboard/allowance` | Top 100 by allowance (current week) |
| `GET /api/price` | Live $BOOSTR price from DexScreener |

### Frontend Views

- **Home (Dashboard)** — Current week allowance, tips sent (valid/invalid/total), tips received, points, countdown to next reset.
- **Tips** — Full tip history (sent & received), labelled by week, with links to the Warpcast cast.
- **Allowance** — Historical weekly allowances and rankings.
- **Leaders** — Global leaderboard by points or allowance, with pinned current-user row.

---

## Database Schema

```
User         → fid, username, pfpUrl, walletAddresses, allTimePoints
Tip          → castHash, senderFid, recipientFid, amount, status (valid|invalid), snapshotDay
Allowance    → userFid, snapshotDay, tipAllowance, remainingAllowance, userRank
Points       → userFid, snapshotDay, points, rainPoints, leaderboardRank
```

> **Indexes:** `Points` and `Allowance` have compound descending indexes on `(snapshotDay DESC, points DESC)` for fast leaderboard queries. Do not remove them.

---

## Deployment

Deploy to [Vercel](https://vercel.com) or any Node.js host. Set all environment variables in the platform dashboard.

For Farcaster Frame v2 recognition, `NEXT_PUBLIC_URL` must point to your live domain — Warpcast uses it to render the "Launch Frame" button.
