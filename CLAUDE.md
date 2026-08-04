# CLAUDE.md — RotoMart

This file gives Claude (and any engineer) the full context needed to work on the RotoMart codebase without re-explaining the project each time.

**Repo:** https://github.com/Kingsley-coder-prog/roto-mart.git

## 0. Development Workflow (LOCKED — follow this every time)

1. **One feature at a time.** Pick the next feature from the Build Order (§12), plan it briefly, confirm scope with the user if anything is ambiguous, implement, verify it works, then move on. Never start a second feature mid-way.
2. **Read only what's needed.** Only open files relevant to the current feature. Don't re-read the whole codebase; this file is the source of truth for architecture.
3. **CLAUDE.md is the contract.** Any decision made during a session (schema change, new endpoint, new env var, provider choice) gets recorded here immediately. If code and this file disagree, this file wins — fix one of them.
4. **Certified = frozen.** Once a feature is verified working and checked off in §12, don't refactor or restyle it while building other features unless a change is explicitly required.
5. **Frugal output.** Short commits, no boilerplate comments, no speculative abstractions. Build what the feature needs, nothing more.

## 1. Project Overview

**RotoMart** is an e-commerce web app where buyers order everyday consumer products — farm produce, confectioneries, and hygiene items (e.g. roll-on deodorants, soaps, etc.) — from a single storefront run by one admin/client.

Key constraints that shape every technical decision below:
- **No traditional database.** Google Sheets is the system of record for all data (products, orders, categories, customers).
- **Non-technical admin.** After handover, the admin must be able to run the entire store — add/edit products, upload images, view orders, manage payouts — without touching code, JSON, or the Google Sheet directly.
- **Split payments.** Every successful payment must automatically split 7% to the developer and 93% to the admin/client who owns the app.

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Vue 3 + Vite | Buyer storefront + Admin dashboard as separate route groups (or separate apps) in the same repo |
| Backend | Node.js + Express | Thin API layer between Vue, Google Sheets, and Paystack |
| Data store | Google Sheets (via Google Sheets API v4) | Accessed only through the backend — frontend never talks to Sheets directly |
| Image storage | Cloudinary (free tier) | Sheets can't store binary data; store the image **URL** in the sheet, not the file |
| Payments | Paystack | Use **Paystack Subaccounts + Transaction Split** for the automatic 7/93 split |
| Auth (admin) | JWT + single admin login (email/password stored securely, not in Sheets) | **DECIDED:** buyers are guests only — no buyer accounts. Each order gets a tracking link instead (see §6a) |
| Email | Brevo (free tier, 300/day) via backend `notifications` module | **DECIDED:** order confirmation + status-update emails to buyers |
| Hosting | Backend: Render/Railway. Frontend: Vercel/Netlify | Cheap/free tiers suitable for a small store |

## 3. Why Google Sheets (and its limits)

Google Sheets is acceptable here because catalog size and order volume are small and the admin already understands spreadsheets. Be aware of these constraints while building:

- **Rate limits**: Google Sheets API allows ~60 read/write requests per minute per user. Batch reads/writes (`batchGet`/`batchUpdate`) instead of looping row-by-row.
- **No relational integrity**: enforce relationships (e.g. `productId` foreign keys) in backend code, not in the sheet.
- **No real concurrency control**: two simultaneous writes can race. For order creation, generate the order ID in code and always append (never update-in-place) to avoid overwrite collisions.
- **Not for images/files**: only URLs (from Cloudinary) go into cells.
- **Treat the backend as the only writer.** The admin should almost never need to open the raw sheet — everything goes through the Admin Dashboard UI, which calls the API, which calls Sheets. This keeps data consistent and keeps the admin out of spreadsheet formulas entirely.

## 4. Google Sheet Schema

One Google Sheet ("RotoMart DB") with multiple tabs, each acting as a table:

**Products**
| id | name | category | price | stock | description | imageUrl | active | createdAt |

**Categories**
| id | name | slug |

**Orders**
| id | buyerName | buyerEmail | buyerPhone | buyerAddress | items (JSON string) | subtotal | total | paystackRef | status | createdAt |

Order `status` values: `pending_payment` → `paid` → `ready` → `shipped` → `delivered` (admin can also set `cancelled`). Status changes made from the admin dashboard trigger buyer emails (see §6a).

**Payouts** (optional log for transparency)
| id | orderId | totalAmount | developerShare | adminShare | paystackSplitRef | date |

Use `googleapis` (official Google Node client) with a **service account** (not OAuth user login) so the backend can read/write without repeated admin sign-in. Share the sheet with the service account's email as Editor.

## 5. Admin CMS (non-technical handover)

There is no ready-made free CMS that plugs cleanly into Google Sheets *and* handles Cloudinary image uploads *and* Paystack — trying to bolt on Strapi/Directus would actually add complexity (they expect a real DB) and reintroduce technical maintenance the admin can't do. The right approach:

**Build a lightweight custom Admin Dashboard as part of the Vue app** (e.g. `/admin` route, JWT-protected). This *is* the CMS — tailored exactly to RotoMart, nothing more. It should let the admin, with no code or spreadsheet knowledge:
- Create / edit / delete products (name, price, category, stock, description)
- Upload a product image directly from their device (uploads to Cloudinary via the backend, URL saved to Sheets automatically)
- Toggle a product active/inactive instead of deleting (keeps order history intact)
- Manage categories
- View incoming orders and mark them as fulfilled/shipped
- View a simple payout log (how much went to them vs. the developer per order)

Design it like a simple, friendly dashboard (forms, buttons, image drag-and-drop) — no raw JSON, no sheet cell references, no technical jargon in labels.

## 6. Payment Flow (Paystack Split)

1. Buyer checks out → backend creates a **Paystack Transaction** with `subaccount` split configured.
2. Set up **one Paystack Subaccount** for the admin/client (their settlement bank account) ahead of time.
3. On each transaction, use Paystack's `transaction/initialize` with:
   - `subaccount`: admin's subaccount code
   - `bearer_type`: `subaccount` or `account` (decide who absorbs Paystack's own fee — usually `account`, i.e. the platform/developer side)
   - The split logic: **93% to the admin's subaccount, 7% retained on the main (developer) Paystack account** — this is the standard behavior when you set the subaccount's `percentage_charge` to 93 (Paystack sends the subaccount their %, and the remainder stays on the main integration account, which is the developer's).
4. Verify the transaction server-side via `transaction/verify` (never trust the frontend) before marking the order as paid and writing to the `Orders` sheet.
5. Log the split amounts to the `Payouts` tab for transparency.

Alternative if more than 2 parties are ever needed later: Paystack **Transaction Split** objects (multiple subaccounts with defined percentages) instead of a single subaccount — worth designing the payment service function so this swap is easy.

## 6a. Buyer Identity & Notifications (DECIDED)

- **Guest checkout only.** No buyer registration/login. Checkout collects name, **email**, phone, address.
- **Per-order tracking link:** after payment is verified, the buyer's confirmation email contains their order ID and a link to `/track/:orderId`, a public storefront page showing that order's items and current status. No combined "order history" — that would require accounts, which we deliberately avoid for simplicity. Revisit only if the client requests it.
- **Emails (via Brevo API, sent from the backend `notifications` module):**
  1. **Order confirmation** — sent after `transaction/verify` succeeds (never before payment is confirmed). Contains order ID, items, total, tracking link.
  2. **Status update** — sent when the admin changes an order's status to `ready` or `shipped` from the dashboard.
- Email sending must be **non-blocking and fault-tolerant**: a failed email must never fail the order. Log failures; the order and tracking page are the fallback source of truth.

## 7. Folder Structure (modular — DECIDED)

Both backend and frontend are organized by **feature module**, not by technical layer, so concerns stay separated and each feature can be built/verified in isolation.

```
rotomart/
├── backend/
│   ├── src/
│   │   ├── modules/                  # one folder per feature
│   │   │   ├── products/             # products.routes.js, products.controller.js, products.service.js
│   │   │   ├── categories/
│   │   │   ├── orders/               # includes public tracking endpoint
│   │   │   ├── payments/             # Paystack init/verify/split
│   │   │   ├── auth/                 # admin login (JWT)
│   │   │   └── notifications/        # Brevo email sending + templates
│   │   ├── infra/                    # shared low-level clients (no business logic)
│   │   │   ├── sheets.js             # Google Sheets client + batch read/write helpers
│   │   │   ├── cloudinary.js
│   │   │   ├── paystack.js           # raw Paystack HTTP client
│   │   │   └── brevo.js              # raw Brevo HTTP client
│   │   ├── middleware/               # adminAuth.js, errorHandler.js
│   │   └── app.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── storefront/           # Home, ProductDetail, Cart, Checkout, TrackOrder
│   │   │   └── admin/                # Login, Products, Categories, Orders, Payouts
│   │   ├── components/               # shared UI pieces
│   │   ├── router/                   # storefront routes + JWT-guarded /admin routes
│   │   ├── stores/                   # Pinia: cart.js, products.js, admin.js
│   │   └── api/                      # one file per backend module (products.js, orders.js, ...)
│   └── package.json
└── CLAUDE.md
```

Rules: modules never import each other's controllers — cross-module needs go through services. `infra/` files contain zero business logic (no split percentages, no email wording — those live in the owning module).

## 8. Core API Endpoints (backend)

- `GET /api/products` — public, list active products
- `GET /api/products/:id` — public
- `POST /api/admin/products` — admin, create (JSON + image upload)
- `PUT /api/admin/products/:id` — admin, edit
- `DELETE /api/admin/products/:id` — admin, soft-delete (set inactive)
- `GET /api/categories` — public
- `POST /api/admin/categories` / `PUT` / `DELETE` — admin
- `POST /api/orders` — public, create order + init Paystack transaction
- `GET /api/orders/verify/:reference` — public, verify payment on redirect (marks paid, writes to Sheets, sends confirmation email)
- `GET /api/orders/track/:id` — public, order status for the tracking page (returns only non-sensitive fields)
- `GET /api/admin/orders` — admin, list all orders
- `PATCH /api/admin/orders/:id/status` — admin, update status (triggers status email on `ready`/`shipped`)
- `GET /api/admin/payouts` — admin, payout log
- `POST /api/admin/login` — admin auth

## 9. Environment Variables

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_ADMIN_SUBACCOUNT_CODE=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
FRONTEND_URL=            # used to build tracking links in emails
```

## 10. Handover Checklist (for the engineer, before leaving the project)

- [ ] Admin dashboard covers every action the admin needs — no task requires opening the Google Sheet or code directly
- [ ] Admin has their own login credentials (not the developer's)
- [ ] Paystack subaccount is registered under the **admin's own bank details**, verified with a small test transaction
- [ ] Record/document the 7% split logic clearly in the dashboard's payout log so it's transparent to the admin
- [ ] Provide the admin a short screen-recorded walkthrough (product creation, image upload, order fulfillment) — non-technical users retain video instructions far better than written docs
- [ ] Confirm Google Sheets service account has Editor access and won't expire
- [ ] Set sensible low stock / error alerts (e.g. email admin if Sheets API fails) so a silent failure doesn't go unnoticed

## 11. Open Decisions to Confirm with Client

- Delivery/logistics: manual (admin arranges) or integrated courier API later?
- Multi-currency: NGN only, or others?
- Tax handling, if any.

Resolved decisions (do not reopen): buyer accounts → **guest + tracking link** (§6a); email provider → **Brevo** (§6a); architecture → **modular** (§7).

## 12. Build Order (check off as features are certified done)

Each item = one feature session: plan → implement → verify → check off here.

- [x] **F1. Scaffolding** — backend (Express app, error handler, env loading) + frontend (Vite + Vue 3 + router + Pinia) + repo wired to GitHub remote ✓ 2026-08-03
- [x] **F2. Sheets infra** — `infra/sheets.js` with batch read/append/update helpers against the RotoMart DB sheet ✓ 2026-08-04 (also: `deleteRow` for Categories hard-delete, `ensureHeaders` via `scripts/setup-sheets.js`; rows carry `_row` for updates)
- [ ] **F3. Products + Categories API** — public read endpoints, backed by Sheets
- [ ] **F4. Storefront catalog** — product list, category filter, product detail page
- [ ] **F5. Cart + Checkout UI** — Pinia cart, checkout form (name/email/phone/address)
- [ ] **F6. Orders + Payments** — create order, Paystack init with 93/7 split, server-side verify, write to Sheets, payout log
- [ ] **F7. Notifications** — Brevo confirmation + status emails, tracking page `/track/:orderId`
- [ ] **F8. Admin auth** — login endpoint, JWT middleware, admin route guard
- [ ] **F9. Admin: products & categories** — CRUD UI with Cloudinary image upload
- [ ] **F10. Admin: orders & payouts** — order list, status updates (triggers emails), payout log view
- [ ] **F11. Polish & handover** — empty/error states, low-stock alert email to admin, walkthrough recording, deploy