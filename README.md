# Riddle Relay

GPS-based treasure hunt events. Teams navigate to real-world checkpoints, unlock riddles with GPS, and compete on live leaderboards.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
  - [Organizers](#organizers)
  - [Players](#players)
- [App Routes](#app-routes)
- [Project Structure](#project-structure)
- [Supabase Setup](#supabase-setup)
- [Edge Functions](#edge-functions)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

Riddle Relay lets you create and play location-based riddle events:

1. **Organizers** create events, place GPS checkpoints on a map, and write riddles for each checkpoint.
2. **Players** join events using an invite code, form teams, and navigate to checkpoints.
3. Riddles only unlock when a team is physically within the checkpoint's GPS radius.
4. Teams submit answers, earn points, and race against time on a live leaderboard.

The app works as a PWA (installable on mobile) with offline tile caching for maps.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS + Radix UI |
| Maps | Leaflet + React-Leaflet (OpenStreetMap) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| State | TanStack React Query |
| Routing | React Router v6 |
| PWA | vite-plugin-pwa (Workbox) |

---

## Getting Started

### Prerequisites

- Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm))
- A [Supabase](https://supabase.com) project

### Installation

```bash
# Clone the repository
git clone https://github.com/Unknown-Geek/geo-riddle-relay.git
cd geo-riddle-relay

# Install dependencies
npm install

# Create your .env file (see Environment Variables below)
cp .env.example .env

# Start the dev server
npm run dev
```

The app runs at `http://localhost:8080`.

### Build for Production

```bash
npm run build
npm run preview  # Preview the production build locally
```

---

## How It Works

### Organizers

Organizers create and manage GPS treasure hunt events:

1. **Sign up** as an organizer at `/auth?signup=true&role=organizer`
2. **Create an event** from the organizer dashboard at `/organize/new`
   - Fill in event details (name, description, cover image)
   - Add checkpoints: each checkpoint has a GPS coordinate (lat/lng), a radius in meters, a clue text, and an optional help token hint
   - Add riddles to each checkpoint with a question, correct answer, and point value
   - Configure game settings (help tokens per team, max teams, time limit, time penalty)
3. **Share the invite code** — each event gets a unique 8-character code (e.g., `ABC12345`) that players use to join
4. **Start the event** — change the event status from "draft" to "active" when ready
5. **Monitor in real-time** — view teams, scores, and an activity log as the hunt unfolds
6. **Export results** as CSV when the event is complete

### Players

Players join events and compete as teams:

1. **Sign up** as a player at `/auth?signup=true`
2. **Join an event** at `/join` — enter the invite code from your organizer
3. **Create a team** — pick a team name and color. You'll get a unique team code (e.g., `XYZ789`)
4. **Share the team code** with up to 3 teammates so they can join your team
5. **Navigate to checkpoints** — the app uses your device's GPS to detect when you're within a checkpoint's radius
6. **Solve riddles** — once a checkpoint is unlocked, answer the riddles to earn points
7. **Use help tokens** if you're stuck (limited supply per event)
8. **Check the leaderboard** to see how your team compares

### Scoring

- Each riddle has a max point value (default: 100)
- Events have a time limit (default: 180 minutes)
- After the time limit, a time penalty is deducted per minute (default: 5 pts/min)
- Help token hints cost nothing but are limited (default: 3 per team)

---

## App Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/auth` | Public | Sign in / Sign up (with role selector) |
| `/join` | Public | Join an event by invite code |
| `/join/:code` | Public | Direct join link with pre-filled invite code |
| `/dashboard` | Authenticated | Player game dashboard (map, riddles, submissions) |
| `/leaderboard` | Authenticated | Live event leaderboard |
| `/organize` | Organizer | Organizer dashboard — list of your events |
| `/organize/new` | Organizer | Create a new event (4-step wizard) |
| `/organize/:slug` | Organizer | Event detail (stats, checkpoints, teams, activity) |

---

## Project Structure

```
src/
  components/
    auth/              # ProtectedRoute, OrganizerRoute guards
    dashboard/         # CheckpointMap, RiddleList, SubmissionTimeline, TeamSummary
    layout/            # AppShell, MobileNav, Sidebar, PageHeader
    ui/                # shadcn/ui components (Button, Card, Input, etc.)
  contexts/
    AuthContext.tsx     # Supabase Auth state, sign-in/up/out, password reset
    EventContext.tsx    # Current event state, event switching
  hooks/
    use-geolocation.ts # Browser Geolocation API with permission handling
    use-mobile.tsx     # Mobile viewport detection
    use-toast.ts       # Toast notifications
  integrations/
    supabase/
      client.ts        # Supabase client initialization
      types.ts         # Auto-generated Supabase table types
  lib/
    geo.ts             # Geographic calculations (distance, bearing)
    rate-limit.ts      # Client-side rate limiter
    validations.ts     # Zod validation schemas
    utils.ts           # cn() utility for Tailwind class merging
  pages/
    Auth.tsx           # Sign in / Sign up
    Dashboard.tsx       # Player game dashboard
    JoinEvent.tsx       # Join event flow
    Landing.tsx        # Public landing page
    Leaderboard.tsx     # Live leaderboard
    organizer/
      CreateEvent.tsx  # 4-step event creation wizard
      Dashboard.tsx    # Organizer event list
      EventDetail.tsx  # Event management (tabs: overview, checkpoints, teams, activity)
  services/
    organizer-service.ts  # All organizer-facing Supabase queries
    player-service.ts     # All player-facing Supabase queries + real-time subscriptions

supabase/
  functions/
    _shared/
      auth.ts              # Shared Edge Function auth middleware (JWT verify, CORS, rate limiting)
    submit-riddle/         # Validate & score riddle answers
    redeem-help-token/     # Redeem help tokens for hints
    export-results/        # Export event results as CSV/JSON
  migrations/
    20260412000000_multi_event.sql           # Multi-event schema
    20260413000000_security_fixes.sql        # Security barriers, RLS fixes
```

---

## Supabase Setup

### Database Schema

The app uses these main tables:

| Table | Purpose |
|-------|---------|
| `events` | Event details, settings, invite codes, organizer FK |
| `checkpoints` | GPS locations, clue text, radius, linked to an event |
| `riddles` | Questions, answers, points, linked to a checkpoint |
| `teams` | Team info, score, status, linked to an event |
| `team_members` | Join table linking users to teams (max 4 per team) |
| `submissions` | Answer submissions with status (correct/incorrect) and points |
| `activity_logs` | Real-time event activity feed |
| `profiles` | User profiles (full_name, avatar_url, role) |

### Row Level Security (RLS)

All tables use Supabase RLS policies:
- **Players** can only see data for events they've joined via a team
- **Organizers** can only modify events they own
- **Correct answers** on riddles are hidden from players via a `player_riddles` view with `security_barrier`

### Running Migrations

Apply migrations through the Supabase Dashboard SQL Editor or the Supabase CLI:

```bash
supabase db push
```

---

## Edge Functions

All Edge Functions run on Deno and share common auth middleware from `_shared/auth.ts`:

| Function | Purpose | Auth | Rate Limit |
|----------|---------|------|------------|
| `submit-riddle` | Validate answer, calculate points, advance checkpoint | Team member | 20/min |
| `redeem-help-token` | Spend a help token, reveal the hint | Team member | 10/min |
| `export-results` | Export event data as CSV or JSON | Organizer | 5/min |

Each function:
- Verifies the JWT from the Supabase Auth session
- Validates the user's role (team member or organizer)
- Validates input with bounds checking
- Returns CORS headers only for allowlisted origins

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required — Supabase project credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Required for seed script only — DO NOT commit these
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key (safe for client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Seed script only | Service role key — **never** expose client-side |
| `SUPABASE_ACCESS_TOKEN` | Seed script only | Supabase CLI access token |

---

## Deployment

### Vercel (recommended)

The project includes a `vercel.json` for SPA routing:

```bash
npm i -g vercel
vercel
```

Set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your Vercel project settings.

### Netlify

Add a `public/_redirects` file:
```
/*    /index.html   200
```

### Lovable

Open the project on [Lovable](https://lovable.dev) and click Share → Publish.

### Custom Domain

If deploying to a custom domain, add it to the CORS allowlist in `supabase/functions/_shared/auth.ts`:

```ts
const allowed = [
  'https://riddle-relay.app',
  'https://riddle-relay.lovable.app',
  'https://your-custom-domain.com',  // Add your domain here
]
```

---

## Development

```bash
npm run dev          # Start dev server on :8080
npm run build        # Production build
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Seeding an Admin User

```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="secure-password" \
npm run seed:admin
```

---

## License

MIT
