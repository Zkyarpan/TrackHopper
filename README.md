# TrackHopper

**AI-powered London commute planner** — plan journeys in plain English, get live TfL status, fares, and step-by-step routes on an interactive map.

🔗 **Live app:** [trackhopper.vercel.app](https://trackhopper.vercel.app)

---

## What it does

TrackHopper helps you get around London without needing to know exact station names or TfL jargon.

- **Ask in plain English** — type something like *"how do I get from Stratford to UEL by 9am"* or *"canary wharf to the shard"* and it figures out what you mean, typos and all
- **Landmark-aware search** — works with landmarks and informal place names, not just official station names, by combining TfL's station search with OpenStreetMap geocoding
- **Live line status** — see delays and disruptions across the network at a glance
- **Interactive map** — every journey result is plotted on a live map, not just a text list
- **Use my location** — one tap to start planning from wherever you are, with nearby station suggestions
- **Save your routes** — sign in to save frequent journeys and re-run them in one click
- **Admin dashboard** — usage stats, saved route activity, and API health monitoring (admin-only)

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Journey & station data | [TfL Unified API](https://api-portal.tfl.gov.uk) |
| Natural language parsing | [Pollinations AI](https://pollinations.ai) |
| Landmark geocoding | OpenStreetMap Nominatim |
| Maps | Leaflet + React-Leaflet |
| Database & Auth | Supabase (Postgres + Row Level Security) |
| Hosting | Vercel |

## How it works

```
User types a request (free text or structured form)
        ↓
Pollinations AI extracts intent: from, to, arrival/departure time
        ↓
Place resolution: TfL StopPoint Search → falls back to
Nominatim geocoding → nearest TfL station lookup
        ↓
TfL Journey Planner returns the route(s)
        ↓
Results rendered as step-by-step directions + live map
        ↓
Optionally saved to Supabase, scoped to the signed-in user via RLS
```

## Getting started locally

```bash
git clone https://github.com/Zkyarpan/TrackHopper.git
cd TrackHopper
npm install
cp .env.example .env.local
```

Fill in `.env.local` with your own keys:

| Variable | Where to get it |
|---|---|
| `TFL_APP_KEY` | Register at [api-portal.tfl.gov.uk](https://api-portal.tfl.gov.uk) → Products → subscribe to Unified API |
| `POLLINATIONS_API_KEY` | Generate at [enter.pollinations.ai](https://enter.pollinations.ai) (use the `sk_` secret key) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project → Settings → API |

Then run the database migrations in the Supabase SQL editor (see `/supabase/migrations`), and start the dev server:

```bash
npm run dev
```

## Database & security notes

- All user data is protected with Postgres Row Level Security — users can only read/write their own saved routes
- Admin access is gated by an `is_admin` flag on a `profiles` table, checked server-side (not just hidden in the UI)
- API calls to TfL, Pollinations, and Nominatim are logged for basic health monitoring, visible in the admin dashboard

## License

MIT
