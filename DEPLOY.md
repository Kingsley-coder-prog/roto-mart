# RotoMart — Deployment (Render + Vercel)

Backend (Express API) → **Render**. Frontend (Vue/Vite) → **Vercel**.
Both deploy from the GitHub repo. Deploy the **backend first** (you need its URL for the frontend),
then the frontend, then point the backend back at the frontend URL.

Deploying in **test mode** (current Paystack test keys). Real-money go-live is a later step — see CLAUDE.md §6/§10.

---

## 0. Prerequisite
Push the repo to GitHub (`git push origin main`). Render and Vercel deploy from there.

## 1. Backend → Render
1. render.com → **New → Blueprint** → pick this repo. Render reads `render.yaml`
   (service `rotomart-api`, root `backend`, `npm install` / `npm start`, health check `/api/health`).
2. It will prompt for every env var (all are `sync: false`, so nothing secret is in the repo).
   Copy them from your local `backend/.env`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (paste with the `\n` escapes exactly as in `.env`), `GOOGLE_SHEET_ID`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_ADMIN_SUBACCOUNT_CODE` (test values)
   - `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
   - `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`
   - `LOW_STOCK_THRESHOLD` (optional)
   - `FRONTEND_URL` → put a placeholder for now (e.g. `http://localhost:5173`); fixed in step 3.
   - Do **not** set `PORT` — Render provides it.
3. Deploy. Note the URL, e.g. `https://rotomart-api.onrender.com`. Check `…/api/health` returns `{"ok":true}`.
   (Free tier sleeps after ~15 min idle; first hit then takes a few seconds.)

## 2. Frontend → Vercel
1. vercel.com → **Add New → Project** → import this repo.
2. Set **Root Directory = `frontend`** (Vercel auto-detects Vite; build `npm run build`, output `dist`).
   `frontend/vercel.json` handles SPA routing (deep links like `/admin`, `/track/:id`).
3. Add env var **`VITE_API_BASE_URL`** = your Render URL from step 1 (no trailing slash),
   e.g. `https://rotomart-api.onrender.com`.
4. Deploy. Note the URL, e.g. `https://rotomart.vercel.app`.

## 3. Point the backend at the frontend
1. Render → the service → **Environment** → set `FRONTEND_URL` = your Vercel URL (no trailing slash).
   This drives CORS, the Paystack `callback_url`, and email links.
2. Save → Render redeploys.

## 4. Smoke test the live site
- Open the Vercel URL → browse products, add to cart.
- Checkout → pay with Paystack **test** card `4084 0840 8408 4081` (any future expiry, CVV `408`, PIN `0000`, OTP `123456`).
- Confirm redirect to the confirmation page, the confirmation email arrives, and the order shows in **/admin/orders**.
- Log in at `/admin` and click through Products, Orders, Payouts, Analytics.

## 5. Go-live (later — real money). See CLAUDE.md §6 (Config B) & §10:
- Client's own Paystack account (their BVN/bank) as main; your subaccount for 7%; swap in **live** keys;
  change `transaction_charge` to 93%.
- Client sets their **own** admin password (rotate off the temp one) and rotate `JWT_SECRET`.
- Verify the **Brevo sender** (irotomart@gmail.com) for deliverability; turn off Paystack's own receipt email.
- Rename the Paystack business to **RotoMart**.
- (Optional) custom domain on Vercel; then update `FRONTEND_URL` + `VITE_API_BASE_URL` accordingly.
