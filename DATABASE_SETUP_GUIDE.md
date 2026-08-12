# Mobile Compatibility Finder
## Beginner Database Setup Guide

This guide explains how the project stores mobile-phone compatibility data and how a beginner can understand the database setup.

## 1. What does the database do?

The application helps a mobile shop find accessories that fit different phones.

For example:

- Search for `Galaxy S24`.
- Select `Tempered Glass`.
- See other phones that use the same tempered glass.

The database stores this information so it is available after restarting the computer and can be shared between multiple shop devices.

## 2. Database used by this project

This project uses **Neon PostgreSQL**.

Think of PostgreSQL as a collection of organized Excel sheets. Each sheet is called a **table**. Each row is one record, and each column stores one piece of information.

Neon hosts the database online. The Next.js application connects to Neon through the server. Database passwords must never be placed directly in browser code.

The project uses:

- **Neon** — online PostgreSQL database
- **Drizzle ORM** — safe TypeScript database queries
- **Better Auth** — email/password user accounts
- **IndexedDB/Dexie** — local offline cache in the browser

## 3. Online database versus offline storage

There are two storage locations:

### Online database

Neon is the main source of truth. It allows the shop to use the same catalog from different computers and phones.

### Offline database

IndexedDB stores a local copy inside the browser. It helps the application continue working when the internet is unavailable.

When the device is online:

1. The app reads the latest catalog from Neon.
2. The app saves a local copy in IndexedDB.
3. Local changes can be uploaded during synchronization.

When the device is offline:

1. The app reads the saved IndexedDB copy.
2. New changes wait locally.
3. The changes can be synchronized after the internet returns.

Clearing browser site data can remove the local copy. The online Neon database is not affected.

## 4. Important environment variables

The Neon integration provides the database connection values to the Vercel project.

The most important variables are:

```env
DATABASE_URL=your-neon-database-connection
BETTER_AUTH_SECRET=your-secure-secret
```

Do not commit these values to GitHub or write them inside React components.

`BETTER_AUTH_SECRET` is used to protect login sessions. It should be a long random value.

## 5. Main database tables

The current database contains these main tables:

### `shops`

Stores each mobile shop.

| Column | Meaning |
|---|---|
| `id` | Unique shop ID |
| `name` | Shop name |
| `created_at` | Date the shop was created |

### `catalog_mobiles`

Stores phone models.

| Column | Meaning |
|---|---|
| `id` | Unique phone ID |
| `shop_id` | Shop that owns the record |
| `brand` | Samsung, Apple, Redmi, etc. |
| `model` | Galaxy S24, iPhone 15, etc. |
| `year` | Release year |
| `variants` | Storage, color, or other variants |
| `updated_at` | Last update time |

### `catalog_compatibility`

Stores which phone models are compatible with each other for an accessory type.

| Column | Meaning |
|---|---|
| `id` | Unique compatibility ID |
| `shop_id` | Shop that owns the record |
| `accessory_type` | Tempered glass, case, camera protector, etc. |
| `source_model_id` | First phone model |
| `compatible_model_id` | Phone model with the same fit |
| `updated_at` | Last update time |

Example:

```text
Galaxy S24 -> Nokia 5510 -> Tempered Glass
```

The application can use this relationship in either direction.

### `catalog_backups`

Stores verified backup snapshots.

| Column | Meaning |
|---|---|
| `id` | Unique backup ID |
| `shop_id` | Shop that owns the backup |
| `checksum` | Used to verify the backup was not changed |
| `payload` | Backup data in JSON format |
| `created_at` | Backup creation time |

### Authentication tables

Better Auth also uses these tables:

- `user` — registered users
- `session` — active login sessions
- `account` — login credentials
- `verification` — verification records

Do not manually delete these tables while authentication is enabled.

## 6. How a search works

When a user searches for a model:

1. The app receives the search text.
2. The server searches phone models globally across all brands.
3. It finds compatibility records for the selected accessory type.
4. It returns matching phone models.
5. The screen displays the results.

The search is not limited to the currently selected brand. Searching `R` can show brands or models such as Redmi, Realme, and Motorola.

## 7. How to connect the project to Neon

The Neon integration is already connected to this project. A fresher should follow these steps when setting up another copy of the project:

### Step 1: Install dependencies

```bash
pnpm install
```

The project already includes the database packages. Do not install a second database library unless the project owner approves it.

### Step 2: Check environment variables

In Vercel project settings, open **Vars** and confirm that `DATABASE_URL` and `BETTER_AUTH_SECRET` exist.

Never paste database credentials into source code.

### Step 3: Use the database client

The shared database client is located at:

```text
lib/db/index.ts
```

It creates one Drizzle connection using `DATABASE_URL`.

### Step 4: Use the schema

The database table definitions are located at:

```text
lib/db/schema.ts
```

When adding a new table:

1. Add its definition to the schema.
2. Apply the table change through the connected Neon database tools.
3. Add server-side queries.
4. Add the user interface.

Do not write database queries directly inside browser components.

## 8. Shop-level security

Every catalog row has a `shop_id`. This is important because one shop must not see or change another shop's data.

Every server query must filter by the current shop:

```ts
// Conceptual example
where(eq(catalogMobiles.shopId, currentShopId))
```

Never trust a `shop_id` sent by the browser. Read the current user session on the server and determine the user's shop there.

## 9. Importing Excel files

The import page supports `.xlsx` files.

Recommended workflow:

1. Download the template.
2. Fill in the brand, model, year, and variant columns.
3. Upload the Excel file.
4. Review the preview.
5. Fix row-level validation errors.
6. Import only after the preview is correct.

Typical validation errors include:

- Missing brand
- Missing model
- Invalid year
- Duplicate model
- Unsupported accessory type

The application should never insert invalid rows silently.

## 10. Exporting data

Export creates an Excel-compatible file containing catalog data. Use exports to:

- Review catalog data in Excel
- Send data to a supplier
- Make a manual copy
- Prepare data for another system

Always verify the downloaded file before deleting or changing the original data.

## 11. Backup and restore

A backup contains a complete catalog snapshot and a checksum.

A safe restore process is:

1. Select a backup.
2. Download or inspect it.
3. Verify the checksum.
4. Preview the records that would change.
5. Confirm the restore.
6. Create a new backup before replacing current data.

Do not restore an unknown file directly into the database.

For scheduled backups, a server-side scheduled job should create a backup at a regular interval. Browser-only timers are not reliable because the browser can be closed.

## 12. PWA and offline use

The project includes:

- `app/manifest.ts` — application name and install settings
- `public/sw.js` — service worker for cached app files
- `components/pwa-register.tsx` — registers the service worker
- `public/icon.svg` — app icon

On a supported phone or tablet, the user can choose **Add to Home Screen** or **Install App** in the browser menu.

The PWA helps the shop open the app quickly and continue using cached catalog data offline. It does not replace the Neon database. The app should sync with Neon whenever the device is online.

## 13. Beginner troubleshooting

### The app cannot connect to Neon

Check that `DATABASE_URL` exists in Vercel Vars and that the latest deployment has access to it.

### Login does not work

Check that `BETTER_AUTH_SECRET` exists and is at least 32 characters long.

### Data disappears after browser cleanup

That is expected for IndexedDB. Sign in while online and download the latest catalog from Neon again.

### Excel import shows errors

Read the row-level error messages, correct the Excel file, and upload it again. Do not remove validation just to force an import.

### One shop sees another shop's catalog

This is a security issue. Check that every server query filters by the authenticated user's `shop_id`.

## 14. Simple development rules

- Keep Neon as the online source of truth.
- Keep IndexedDB as the offline cache.
- Use Drizzle for database queries.
- Use server routes or server actions for database access.
- Validate all imported data.
- Scope every catalog query to the current shop.
- Never expose secrets in client-side code.
- Back up data before bulk imports or restores.
- Test offline mode before releasing a new version.

## 15. Recommended next production steps

1. Connect each authenticated user to a shop record.
2. Replace the demo shop fallback with the session shop ID.
3. Add server-side catalog create, update, and delete actions.
4. Add a synchronization queue for offline edits.
5. Add scheduled server backups.
6. Add restore preview and checksum verification.
7. Test the PWA on the shop's actual phones and tablets.
8. Add monitoring and audit logs for important changes.

This setup gives the shop a reliable online catalog while still allowing searches when the internet is temporarily unavailable.
