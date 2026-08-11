# RotoMart 🛒

A single-vendor e-commerce web app for everyday consumer goods — farm produce, confectioneries, and hygiene items — with a buyer storefront and a full admin dashboard. Built to be run end-to-end by a **non-technical owner**: no database to manage, no code or spreadsheets to touch.

**Live:** storefront → your Vercel URL · admin dashboard → `/admin`

---

## Highlights

- **No traditional database.** Google Sheets is the system of record (products, orders, categories, payouts), accessed only through the backend.
- **Guest checkout + Paystack payments** with an automatic revenue split (client / developer) and server-side verification.
- **Custom admin dashboard** (JWT-protected) — products & categories CRUD with image upload, order fulfilment with buyer emails, payouts log, and analytics. No spreadsheet or code knowledge required.
- **Transactional email** (order confirmation, status updates, low-stock alerts) via Brevo.
- **Per-order tracking page** for buyers — no accounts needed.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vue 3 + Vite + Pinia + Vue Router |
| Backend | Node.js + Express |
| Data store | Google Sheets (Sheets API v4, service account) |
| Images | Cloudinary |
| Payments | Paystack (subaccount transaction split) |
| Email | Brevo |
| Auth | JWT (single admin) |
| Hosting | Backend → Render · Frontend → Vercel |

## Architecture

Both frontend and backend are organized **by feature module**, not by technical layer. `infra/` holds low-level clients (Sheets, Cloudinary, Paystack, Brevo) with zero business logic; each feature module owns its own rules.

```
rotomart/
├── backend/
│   └── src/
│       ├── modules/        # products, categories, orders, payments, auth, notifications, analytics
│       ├── infra/          # sheets.js, cloudinary.js, paystack.js, brevo.js
│       ├── middleware/     # adminAuth.js, errorHandler.js
│       └── app.js
└── frontend/
    └── src/
        ├── views/          # storefront/ + admin/
        ├── components/     # shared UI + AdminNav
        ├── stores/         # Pinia: cart, catalog, admin
        └── api/            # one file per backend module
```

Key constraints handled in code (not the sheet): foreign-key integrity, no hard-deletes of orders/products (soft-hide instead), batched Sheets reads/writes to respect API quotas, and server-side recomputation of every order total (the cart is never trusted for amounts).

## Local development

**Prerequisites:** Node 20+, and accounts/keys for Google Cloud (service account), Cloudinary, Paystack (test), and Brevo.

```bash
# Backend
cd backend
cp .env.example .env        # fill in your keys (see below)
npm install
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173  (proxies /api → :4000)
```

Seed the Google Sheet headers/sample data with the scripts in `backend/scripts/` if starting fresh.

### Environment variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full list with comments. In short: Google service account + Sheet ID, Cloudinary keys, Paystack keys + subaccount code, `JWT_SECRET`, admin email + bcrypt password hash, Brevo key + sender, and `FRONTEND_URL`.

Generate an admin password hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD',10))"
```

## Deployment

Full step-by-step (Render + Vercel) is in [`DEPLOY.md`](DEPLOY.md). In short: deploy the backend to Render (root `backend`, env vars from the dashboard), the frontend to Vercel (root `frontend`, set `VITE_API_BASE_URL` to the backend URL), then point the backend's `FRONTEND_URL` at the Vercel URL.

## Payment split

Every paid order is split via a Paystack subaccount: **93% to the store owner, 7% to the developer**, verified server-side before the order is finalized, with the actual figures logged to the Payouts sheet. The account-ownership model (which party is the main merchant vs. the subaccount) and the go-live steps are documented in `CLAUDE.md` §6.

## Project docs

`CLAUDE.md` is the engineering contract — architecture decisions, the Google Sheet schema, the API surface, and the go-live/handover checklist. Read it before making changes.

## License

Private project. All rights reserved.
