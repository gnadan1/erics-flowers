# Flower Shop Inventory Tracker

A personal inventory tool for your shop — no login, just open and use. Track flowers from arrival through sale, with automatic freshness status.

## What you'll be able to do

- **Add received items** with variety, color, supplier, quantity, unit cost, retail price, location in store, and received date
- **See everything at a glance** in a sortable/filterable list with color-coded freshness
- **Mark sold** — full or partial quantity (e.g. received 24 roses, sold 6, 18 still in stock)
- **Discard** items past their prime
- **Dashboard** with quick stats: total stock value, items aging soon, items expired, recent sales

## Aging logic

Each flower type (Rose, Tulip, Lily, etc.) has a default vase life in days. You can edit defaults anytime and override per-batch when receiving. Status auto-computes from received date:

- **Fresh** (green) — under 50% of vase life elapsed
- **Aging** (amber) — 50–90% elapsed
- **Critical** (orange) — 90–100% elapsed
- **Expired** (red) — past vase life

## Screens

1. **Dashboard** — stat cards (in-stock value, items by status, sold this week) + "needs attention" list (Critical/Expired)
2. **Inventory** — table of all batches with filters (status, variety, location, supplier), search, and row actions (Sell, Discard, Edit)
3. **Receive new** — form to log an incoming batch
4. **Sales history** — log of every sale with date, item, qty, price
5. **Settings** — manage flower types and their default vase-life days; manage suppliers and store locations

## Data model

- `flower_types` — name, default_vase_life_days
- `suppliers` — name, contact (optional)
- `locations` — name (Cooler A, Front display, etc.)
- `inventory_batches` — flower_type, color, supplier, location, qty_received, qty_remaining, unit_cost, retail_price, received_date, vase_life_days (copied from type default, editable), status (active/sold_out/discarded), notes
- `sales` — batch_id, qty_sold, sale_price, sold_at

Status (Fresh/Aging/Critical/Expired) is computed live from received_date + vase_life_days, not stored.

## Technical notes

- **Stack**: TanStack Start (already set up), Tailwind, shadcn/ui
- **Backend**: Lovable Cloud (Postgres) for persistence — single shared dataset, no auth required
- **Seed data**: pre-populate common flower types (Rose 7d, Tulip 5d, Lily 10d, Carnation 14d, Sunflower 7d, Hydrangea 5d, Orchid 14d) and a few default locations so you can start immediately
- All tables get appropriate grants; since there's no login, policies allow anonymous read/write (this is a personal/internal tool)

## Out of scope (v1)

- Multi-user / staff logins
- Barcode scanning
- Supplier ordering / reorder alerts
- Customer records
- Photo uploads per batch

Easy to add later if useful.

## Build order

1. Enable Lovable Cloud, create schema + seed data
2. Dashboard + Inventory list with status badges
3. Receive-new form
4. Sell / discard actions (with partial qty)
5. Sales history page
6. Settings (flower types, locations, suppliers)
