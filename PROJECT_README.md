# $BOOSTR Tipping App - Agent Handoff Document

This document is intended to explain the architecture, schema, and logic of the Zabal-Tip ($BOOSTR) tipping system to any future developers or AI agents working on the codebase.

## 1. Project Overview
This is a Farcaster-based tipping economy. Users can tip each other `$BOOSTR` simply by replying to casts on Warpcast (e.g., `100 $BOOSTR`). A bot listens to these replies via a webhook, validates if the user has enough weekly allowance, deducts the allowance, and awards Points to both the sender and the receiver. 

The app includes a **Farcaster Frame v2 Mini App** frontend where users can view their current allowance, track their points, view global leaderboards, and check their tipping history.

## 2. Tech Stack
- **Framework:** Next.js (App Router)
- **Database ORM:** Prisma
- **Database:** PostgreSQL
- **Blockchain reading:** `viem` (connected to Base network)
- **Styling:** Tailwind CSS

## 3. Database Schema (`prisma/schema.prisma`)
- **User:** Tracks FIDs, Farcaster profiles, and `allTimePoints` (a running total of all points ever earned to prevent expensive sum queries).
- **Tip:** A ledger of every single tip sent. Tracks `status` (`valid` or `invalid`), the `amount`, and the `castHash`.
- **Allowance:** Tracks a user's weekly tipping capacity. Includes `tipAllowance` (total they started with) and `remainingAllowance`. Uniquely compound-indexed by `[userFid, snapshotDay]`.
- **Points:** Tracks a user's weekly points earned. Points are earned 1:1 for every $BOOSTR tipped *and* received. Uniquely compound-indexed by `[userFid, snapshotDay]`.

## 4. The "Weekly Cycle" Core Logic
The entire economy resets on a weekly basis. This is managed by the `snapshotDay` concept.

1. **`getCurrentPeriodStart()`:** Located in `src/lib/dateUtils.ts`. This function calculates the midnight timestamp of the most recent Monday. All `Points` and `Allowance` rows are stamped with this exact Date. This neatly segments data into weekly buckets.
2. **The Allotment Script (`npm run allot`):** 
   - Located at `src/scripts/allot-allowance.ts`. 
   - When run, it queries the Farcaster Hub for users' verified Ethereum wallets.
   - It then queries the Base network RPC (`https://base-rpc.publicnode.com`) to check their token holdings for a specific token address (defined in `.env` as `BOOSTR_CONTRACT_ADDRESS`).
   - It proportionally calculates and creates new `Allowance` rows for the current `snapshotDay`.
3. **The Webhook (`/webhook`):**
   - Receives Farcaster cast events.
   - Ignores loopbacks (if the sender is the bot's own FID, defined in `.env` as `BOT_FID`).
   - Looks up the sender's `Allowance` for the current `snapshotDay`.
   - If they have enough `remainingAllowance`, it creates a `valid` tip, deducts the allowance, and updates the `Points` for *both* sender and recipient. It also updates their `allTimePoints` on the `User` model.
   - Sends a cast reply to the Farcaster Hub using the bot's Ed25519 `SIGNER`.

## 5. API Architecture
All API routes are forced to be dynamic (`export const dynamic = "force-dynamic";`) to prevent Next.js from aggressively statically caching the database responses at build time.

- `/api/user`: Fetches a user's profile and toggles `isAllowanceEnabled`.
- `/api/points`: Fetches the user's points and dynamically calculates their global rank.
- `/api/points/week`: A flexible API to fetch points by passing `?week=current`, an absolute app week number (`?week=0`), or a date string (`?week=2026-09-07`). Week 0 is locked to the project launch on Sept 7, 2026.
- `/api/allowance`: Fetches the user's historical weekly allowances and zips them with their historical points.
- `/api/tips` & `/api/tips/received`: Fetches the raw ledger of tips involving the user.
- `/api/leaderboard` & `/api/leaderboard/allowance`: Strictly filters by `getCurrentPeriodStart()` to display the current week's top 100 users, powered by high-performance compound indexes in the database.

## 6. Frontend Structure
The frontend is a mobile-first UI designed to act as a Farcaster Frame v2 Mini App (configured via `<meta name="fc:frame">` tags in `layout.tsx`).

- **Dashboard.tsx:** The home tab. Displays the current week's remaining allowance, points, and valid tips. Filters data strictly to match the current week's `snapshotDay`.
- **AllowanceTracker.tsx:** A historical table of previous weeks' allowances and points.
- **TipsTracker.tsx:** An all-time chronological feed of tips sent and received, with week-labels and deep links to the Warpcast cast hash.
- **Leaderboard.tsx:** The global ranking system.

## 7. Critical Nuances for Agents
- **Base RPC Rate Limits:** The public Base RPC (`mainnet.base.org`) aggressively rate limits the allotment script. We currently use `https://base-rpc.publicnode.com` and a 300ms sleep delay between contract reads.
- **Database Indexes:** `Points` and `Allowance` have compound descending indexes (`@@index([snapshotDay(sort: Desc), points(sort: Desc)])`) to ensure the leaderboard API remains instantaneous at scale. Do not remove them.
- **Bot Loops:** The bot will endlessly reply to itself if it detects its own cast mentioning "$BOOSTR". Always strictly enforce `if (senderFid === BOT_FID) return;` in the webhook.
