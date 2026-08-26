# Mobile Compatibility Finder

An offline-first mobile device compatibility catalog built with **Electron + Next.js + SQLite**, with optional cloud sync via **Supabase**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 43 |
| UI framework | Next.js 16 (React 19) |
| Local database | SQLite (via Node.js built-in `node:sqlite`) |
| Cloud sync | Supabase (optional) |
| Styling | Tailwind CSS v4 |

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** or **pnpm** (project uses pnpm lockfile)

---

## Installation

```bash
# Clone the repo
git clone <repo-url>
cd mobile-compatibility-test

# Install dependencies
npm install
# or
pnpm install
```

---

## Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

> **The app works fully offline without any env vars set.** Supabase is optional.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Your Supabase anon/public key |

If left blank, the app runs in **offline-only mode** with local SQLite storage.

---

## Running the App

### Option 1 — Electron Desktop App (recommended)

The full desktop experience with local SQLite database.

**Step 1: Compile the Electron main process**

```bash
npm run electron:compile
```

**Step 2: Start the app (dev mode)**

```bash
npm run electron:dev
```

This runs the Next.js dev server on `http://localhost:3000` and launches Electron pointing at it. Hot reload is enabled for UI changes.

---

### Option 2 — Web Browser Only

Run as a standard Next.js web app (no Electron, no SQLite):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> ⚠️ Some features (SQLite, local auth) require the Electron shell. Web mode is best for UI development only.

---

## Default Login

On first launch, a superadmin account is created automatically:

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `password123` |

Change this password after first login.

---

## Key Pages

| Route | Description |
|---|---|
| `/` | Home — device catalog browser |
| `/sign-in` | Login page |
| `/sign-up` | New user registration (pending admin approval) |
| `/details` | Device compatibility details |
| `/search-demo` | Interactive search component demo |
| `/admin` | Admin panel (superadmin only) |

---

## SQLite Database Location

The local database file is created automatically on first launch:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\mobile-compatibility-finder\catalog.db` |
| macOS | `~/Library/Application Support/mobile-compatibility-finder/catalog.db` |
| Linux | `~/.config/mobile-compatibility-finder/catalog.db` |

---

## Supabase Cloud Sync

If Supabase credentials are set in `.env.local`, the app will sync local SQLite changes to Supabase automatically.

### Apply Supabase Migrations

Run these SQL files in your Supabase SQL Editor **in order**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_add_audit_columns.sql
supabase/migrations/003_add_image_column.sql
```

> **Tip:** If the Supabase project is paused (free tier pauses after ~7 days of inactivity), connections will fail with `context deadline exceeded`. Restore it from the [Supabase dashboard](https://supabase.com/dashboard).

---

## Building for Production

### Build the Electron desktop installer

```bash
# Build Next.js static export + compile Electron main process
npm run electron:build

# Package into a distributable (platform-specific)
npm run electron:package

# Create installer (Squirrel on Windows, deb/rpm on Linux)
npm run electron:make
```

### Build Next.js web only

```bash
npm run build
npm run start
```

---

## Project Structure

```
├── app/                  # Next.js App Router pages & API routes
│   ├── admin/            # Admin panel
│   ├── api/db/           # SQLite API route (web fallback)
│   ├── details/          # Device detail page
│   ├── search-demo/      # Search component demo
│   ├── sign-in/          # Login
│   └── sign-up/          # Registration
├── components/           # Shared UI components
├── electron/
│   ├── main.ts           # Electron main process (SQLite + IPC handlers)
│   └── preload.ts        # Preload bridge (contextIsolation)
├── hooks/                # React hooks (search, keyboard navigation)
├── lib/
│   ├── repository/       # Data access layer (brands, mobiles, etc.)
│   ├── sqlite/           # SQLite schema SQL
│   └── sync/             # Supabase sync manager
├── supabase/migrations/  # Cloud DB migration SQL files
├── .env.local.example    # Environment variable template
└── package.json
```

---

## Troubleshooting

**Electron app shows a blank screen**
- Run `npm run electron:compile` first — the compiled `.electron/` directory must exist before launching.

**`better-sqlite3` native module error**
- Run `npm run electron:rebuild` to recompile native modules against your Electron version.

**Supabase sync fails with `context deadline exceeded`**
- Your Supabase project is paused (free tier). Restore it from the [Supabase dashboard](https://supabase.com/dashboard).

**Login not working**
- Default credentials: `admin@example.com` / `password123`
- The Electron shell must be running for auth to work (auth uses SQLite via IPC).
