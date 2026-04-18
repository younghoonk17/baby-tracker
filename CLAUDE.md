# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

| Task | Command |
|------|---------|
| Install dependencies | `npm ci` |
| Start development server | `npm run dev` |
| Build production assets | `npm run build` |
| Run linting (ESLint) | `npm run lint` |
| Format code (Prettier) | `npm run format` |
| Run all tests | `npm test` |
| Run a single test file | `npm test -- <path/to/test>` |
| Watch tests in CI mode | `npm run test:watch` |

## High-Level Architecture

The project is a **React + TypeScript** baby sleep and feeding tracker PWA, bootstrapped with Vite.

* **`src/`** – All source code lives here. Main entry point: `src/main.tsx`.
* **Components** – Located in `src/components/`:
  - `ActivityGanttChart.tsx` – Visualizes today's sleep/feed activity on a timeline
  - `RecentActivityList.tsx` – Displays recent sleep and feed events
  - `EditLogModal.tsx` – Modal for editing/deleting logs
* **State Management** – React hooks (`useState`, `useEffect`) handle all state. No Context providers currently used.
* **Styling** – Tailwind CSS via `@tailwindcss/vite` plugin + `src/index.css`. Uses Lucide React icons.
* **Persistence/Backend** – Supabase (PostgreSQL backend with auth, RLS for permissions). See `src/lib/supabase.ts`.
* **PWA** – Service worker registration via `virtual:pwa-register` in `src/main.tsx`, offline support configured in `vite.config.ts`.

### Baby Tracker Features

- **Sleep Tracking** – Toggle sleep start/end, track duration, age-appropriate wake window recommendations
- **Feeding Tracker** – Start/stop feeds with left/right boob side selection
- **Activity Gantt Chart** – Visual timeline of today's sleep and feed sessions
- **Recent Activity** – List of last 10 sleep/feed events with timestamps and durations
- **Day Summary (Stats Tab)** – Sleep sessions count, longest session, feed sessions, total feeding time

## Tech Stack

- React 18+
- TypeScript
- Tailwind CSS
- date-fns (date utility)
- Supabase (auth + backend)
- VitePWA (PWA support)
- Lucide React (icons)

## Important Configuration Files

* **`vite.config.ts`** – Vite plugins, PWA config with code splitting for recharts/react-is
* **`.eslintrc.js`** – ESLint configuration with TypeScript/React rules
* **`.prettierrc.json`** – Prettier formatting options
* **`src/lib/supabase.ts`** – Supabase client setup (check `.env` for credentials)
* **`src/utils/sleepRecommendations.ts`** – Age-based wake window logic

## Data Models (from SUPABASE_SCHEMA.sql)

- `babies` – Baby info (name, birth_date, user_id)
- `baby_members` – User permissions for babies (owner/member roles)
- `sleep_logs` – Sleep sessions (start_time, end_time, baby_id)
- `feed_logs` – Feeding sessions (start_time, end_time, baby_id, boob_side)

## Build Output

Production bundle is in `dist/`. Serve with: `npx serve dist -p <port>` or deploy to GitHub Pages.
