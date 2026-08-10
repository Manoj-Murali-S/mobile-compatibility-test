# Mobile Compatibility Finder
## Application and Database Setup Guide

## 1. Application overview

Mobile Compatibility Finder helps a mobile accessory shop find compatible products quickly. A shop employee searches for a phone model, selects an accessory category such as tempered glass or back case, and sees other devices that share the same accessory fit.

The current application includes:

- Public catalog search with brand and model suggestions
- Bidirectional compatibility lookup
- Grid/list result views
- Accessory categories and compatibility groups
- Admin dashboard for brands, mobiles, compatibility groups, import/export, backups, and settings
- Offline catalog snapshots using browser IndexedDB
- Mock online sync controls in Admin → Settings

The current app uses mock TypeScript data. No real database connection is active yet.

## 2. Current storage behavior

There are currently two data layers:

### Mock catalog data

Files in `lib/` provide in-memory data for development and demos:

- `mock-data.ts` — brands and mobile models
- `mock-accessories.ts` — accessory categories and accessory items
- `mock-compatibility.ts` — shared compatibility groups and reverse lookups
- `admin-mock-data.ts` — admin dashboard statistics, activity, backups, and export history

Changes to these files are code changes, not user-managed database records.

### Offline storage

`lib/offline-store.ts` saves a complete catalog snapshot in IndexedDB under:

- Database: `mobile-compatibility-finder`
- Object store: `catalog`
- Snapshot key: `catalog-snapshot`

The snapshot contains brands, mobiles, compatibility data, accessories, settings, and a timestamp. IndexedDB survives browser and computer restarts, but it can be removed when the user clears site data, uses private browsing, changes browsers, or resets the device.

The current **Sync online now** action is only a mock UI. It does not upload data until a real database and API are connected.

## 3. Recommended production architecture

Use a server database as the source of truth and IndexedDB as the offline cache.

```text
Admin or shop user
        |
        v
Next.js Server Actions / Route Handlers
        |
        v
Postgres database  <---- authoritative online data
        |
        v
Catalog snapshot API
        |
        v
IndexedDB            <---- offline read cache and pending changes
```

Recommended rules:

1. Read from IndexedDB when offline.
2. Read fresh catalog data from the server when online.
3. Save local edits to a pending-changes queue.
4. Sync pending changes when the user presses **Sync online now** or when connectivity returns.
5. Resolve conflicts using a revision number or `updatedAt` timestamp.
6. Replace the local snapshot only after the server confirms a successful sync.

## 4. Database choice

A PostgreSQL database is a good fit because the app has relational data:

- One brand has many mobile models.
- One mobile can belong to many compatibility groups.
- One accessory category contains many accessories.
- One compatibility group can connect many mobiles and accessories.
- Admin actions and backups need audit records.

For a production Next.js deployment, Neon Postgres with Drizzle ORM is the recommended default. Supabase is also suitable if you want built-in authentication, storage, and a dashboard.

## 5. Suggested database schema

The following schema supports the current application without storing compatibility as duplicated arrays.

```sql
create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table mobiles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete restrict,
  model text not null,
  slug text not null unique,
  release_year integer,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, model)
);

create table mobile_variants (
  id uuid primary key default gen_random_uuid(),
  mobile_id uuid not null references mobiles(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0
);

create table accessory_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0
);

create table accessories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references accessory_categories(id) on delete restrict,
  name text not null,
  description text,
  featured boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table compatibility_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table compatibility_group_mobiles (
  group_id uuid not null references compatibility_groups(id) on delete cascade,
  mobile_id uuid not null references mobiles(id) on delete cascade,
  primary key (group_id, mobile_id)
);

create table compatibility_group_accessories (
  group_id uuid not null references compatibility_groups(id) on delete cascade,
  accessory_id uuid not null references accessories(id) on delete cascade,
  primary key (group_id, accessory_id)
);

create table catalog_revisions (
  id bigint generated always as identity primary key,
  revision bigint not null unique,
  created_at timestamptz not null default now()
);

create table admin_activity (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## 6. How compatibility lookup works

The lookup should not create a separate row for every search direction. Store the relationship once through a compatibility group.

Example:

```text
Tempered Glass Group A
├── Samsung Galaxy S24
├── Nokia 5510
├── Mi Note 11
└── Redmi Note 13
```

When the user searches `S24`, query the group containing Galaxy S24 and return the other mobiles in that group.

When the user searches `Nokia 5510`, query the same group and return Galaxy S24, Mi Note 11, and Redmi Note 13.

Conceptual SQL:

```sql
select distinct
  m.id,
  m.model,
  b.name as brand_name,
  g.name as compatibility_group
from mobiles searched
join compatibility_group_mobiles searched_link
  on searched_link.mobile_id = searched.id
join compatibility_groups g
  on g.id = searched_link.group_id
join compatibility_group_mobiles result_link
  on result_link.group_id = g.id
join mobiles m
  on m.id = result_link.mobile_id
join brands b
  on b.id = m.brand_id
where searched.slug = $1
  and m.id <> searched.id
  and exists (
    select 1
    from compatibility_group_accessories ga
    join accessories a on a.id = ga.accessory_id
    join accessory_categories ac on ac.id = a.category_id
    where ga.group_id = g.id
      and ac.slug = $2
  )
order by b.name, m.model;
```

Always use parameterized queries. Do not interpolate search text directly into SQL.

## 7. Connecting Neon Postgres

### Step 1: Provision Neon

Connect Neon to the Vercel project, then obtain the project database URL from the integration environment variables. Do not hardcode credentials in source files.

Typical variable:

```env
DATABASE_URL=postgresql://...
```

### Step 2: Install the database packages

```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
```

### Step 3: Add the Drizzle client

Create `lib/db/index.ts`:

```ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)
```

In production code, validate that `DATABASE_URL` exists at startup and keep all database access on the server.

### Step 4: Define Drizzle schema

Create `lib/db/schema.ts` with tables matching the SQL model above. Use foreign keys for brand, mobile, category, accessory, and group relationships. Add unique constraints for slugs and composite join-table keys.

### Step 5: Run migrations

Create a Drizzle config and migration scripts, then apply migrations through the deployment workflow. Never run destructive migrations against production without a backup.

### Step 6: Replace mock reads

Replace imports such as:

```ts
import { getCompatibleDevices } from '@/lib/mock-compatibility'
```

with server-side functions such as:

```ts
export async function findCompatibleMobiles(
  mobileSlug: string,
  categorySlug: string,
) {
  // Query the compatibility joins with Drizzle.
}
```

Use Server Components for initial catalog reads and Route Handlers or Server Actions for mutations.

## 8. Syncing the offline catalog

The current browser snapshot should become a cache of the server catalog.

### Pull flow

1. Request `/api/catalog` with the latest known revision.
2. Server returns catalog data and a revision number.
3. Save the response with `saveOfflineCatalog`.
4. Update `lastSyncedAt` in settings.

### Push flow

1. Store local changes in an IndexedDB `pending-changes` object store.
2. When the user presses **Sync online now**, send pending changes to `/api/sync`.
3. Server validates permissions and data relationships.
4. Server applies changes in a transaction.
5. Server returns accepted changes, conflicts, and the new revision.
6. Client updates the local snapshot and clears accepted pending changes.

### Conflict handling

For a small shop, use a simple policy:

- Server wins for records edited by another admin.
- Client changes that conflict are shown in a review dialog.
- Never silently overwrite a newer server record.
- Keep an audit log for every accepted, rejected, and resolved change.

## 9. API surface to add

Suggested endpoints:

```text
GET    /api/catalog
GET    /api/compatibility?mobile=s24&category=tempered-glass
POST   /api/brands
PATCH  /api/brands/:id
DELETE /api/brands/:id
POST   /api/mobiles
PATCH  /api/mobiles/:id
DELETE /api/mobiles/:id
POST   /api/compatibility-groups
PATCH  /api/compatibility-groups/:id
POST   /api/sync
GET    /api/backups
POST   /api/backups
POST   /api/backups/:id/restore
```

Protect admin mutations with authentication and authorization. Public compatibility lookup can remain read-only.

## 10. Import, export, backups, and restore

### Import

Parse Excel files on the server, validate every row, report errors by row number, and commit valid rows in a transaction. Validate referenced brands and categories before creating relationships.

### Export

Generate exports from database queries, not from browser mock data. Include a generated timestamp and catalog revision so shop staff can identify the data version.

### Backups

Use managed database backups for disaster recovery. The application backup page can additionally export catalog tables to a versioned file stored in private object storage.

### Restore

Require confirmation, create a pre-restore backup, restore in a transaction where possible, and write an admin activity record.

## 11. Security checklist

- Keep database credentials server-side.
- Use parameterized queries or Drizzle query builders.
- Validate all import, admin, and sync payloads with a schema validator.
- Add authentication and admin authorization before production use.
- Restrict backup downloads to authorized admins.
- Use private storage for backup files.
- Record admin actions and restore operations.
- Do not trust client-provided `updatedAt`, revision, or user role values.
- Add rate limits to import, export, and sync endpoints.

## 12. Recommended migration order

1. Create the Postgres schema and seed the current mock catalog.
2. Implement read-only `/api/catalog` and `/api/compatibility` endpoints.
3. Switch the public search and compatibility explorer to server data.
4. Add admin CRUD mutations for brands, mobiles, and compatibility groups.
5. Add IndexedDB pending changes and real sync responses.
6. Connect import/export and backup storage.
7. Add authentication, authorization, audit logging, and conflict review.

## 13. Important current limitation

The current application is a mock-data prototype. IndexedDB provides browser-local persistence, but the **Sync online now** button does not yet communicate with a real database. A real database integration is required for sharing changes across browsers, computers, and shop employees.

Once connected, Postgres becomes the source of truth and IndexedDB remains the offline-first cache.
