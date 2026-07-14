# Kandy Bottle Distribution — Inventory Management System

A full MERN stack app (MongoDB, Express, React, Node) for a bottle supplier who buys
190ml and 250ml bottles from a bottle company agent and distributes them to shops
around Kandy via salesmen on delivery routes.

## What it does

- **Two stocks**: 190ml (cost LKR 115 / sell LKR 130) and 250ml (cost LKR 145 / sell LKR 180), pre-loaded on setup.
- **Three roles**:
  - **System owner** — full access to everything, including creating employee accounts and editing prices.
  - **Second owner** — adds stock received from the agent (the company expense is calculated and logged automatically), manages routes/shops, views expenses.
  - **Salesman** — picks a route, sees the shops on it (red = not yet visited today, green = completed), opens a shop and records: distributed bottles, empty bottles collected, and missing bottles. The remaining bottle balance at the shop is calculated automatically.
- **Automatic expense tracking**: every stock purchase from the agent logs quantity × cost price as a company expense — this is separate from shop sales.
- **Running bottle balance per shop**: `remaining = previous balance + distributed − empty collected − missing`. This is the deposit-style balance of bottles currently out with each shop.
- **Dashboard**: live stock levels, total expense, total revenue, profit, and total bottles currently out with shops.
- **History**: a full log of every shop visit.

## Tech stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt password hashing.
- Frontend: React (Vite), React Router, Tailwind CSS, Axios.

This doesn't have to be MongoDB — the schema is simple enough that it could be ported to
PostgreSQL with Prisma/Sequelize if you'd prefer a relational database later. MongoDB was
used here because it's the fastest way to stand up the full MERN stack you asked for.

## Project structure

```
bottle-inventory/
  server/            Express API
    models/           Mongoose schemas (User, Stock, StockTransaction, Route, Shop, Distribution)
    routes/           API endpoints, grouped by feature
    middleware/auth.js   JWT auth + role-based access control
    seed.js           Creates the first owner login + starter stock/route/shops
    server.js         App entry point
  client/            React frontend
    src/pages/        One file per screen (Dashboard, Stock, Routes & Shops, Expenses,
                       Employees, My Routes, Route Detail, Shop Visit, History, Login)
    src/context/      Auth state (JWT + current user)
    src/components/   Navbar, route guard
```

## Setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB instance — either install MongoDB locally (https://www.mongodb.com/try/download/community)
  or use a free MongoDB Atlas cluster (https://www.mongodb.com/cloud/atlas) and copy its connection string.

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI (and a real JWT_SECRET) if not using the local default
npm run seed     # creates stock items, a sample route with 5 shops, and the owner login
npm run dev      # starts the API on http://localhost:5000
```

The seed script prints the first login:
```
email: owner@bottlesupplier.lk
password: Owner@123
```
Log in as the owner and change this password by creating a fresh owner account, or simply
keep using it and just be mindful it's a shared credential — there's no self-service
"change my password" screen yet, so if you want a different password, update it directly
in the database or ask me to add that screen.

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env   # only needed if your API isn't on localhost:5000
npm run dev             # starts the app on http://localhost:5173
```

Open http://localhost:5173 and log in.

### 4. First-time walkthrough
1. Log in as the owner (seeded above).
2. Go to **Employees** and create a Second Owner and one or more Salesman accounts.
3. Go to **Stock** and add stock received from the agent (this logs the expense automatically).
4. Go to **Routes & Shops** to add more routes/shops around Kandy (5 sample shops on "Kandy Town Route" are already seeded).
5. Log in as a salesman, go to **My Routes**, pick a route, and start recording shop visits.

## Notes on the business logic

- **Stock decreases** when a salesman distributes bottles (bottles leave the warehouse).
- **Stock increases** when the owner/second owner adds stock from the agent, or if a
  visit is edited/corrected (the previous quantities are reversed first, then reapplied).
- **Missing bottles** are entered by the salesman based on what the shop reports (broken,
  lost, etc.) and reduce the shop's outstanding balance without any bottle physically
  coming back.
- A shop only turns **green** on the route screen once its visit for that day has been saved.

## Possible next steps
- Add a "my password" screen for employees to set their own password on first login.
- Add printable daily/weekly reports (PDF export) for the owner.
- Add photo capture (e.g. shop signature or invoice photo) on each visit — would need file storage (e.g. S3-compatible bucket).

---

# Going live: MongoDB Atlas + real hosting

Running this on `localhost` only works on your own computer — your client's phone or
laptop can't reach `localhost:5000` on your machine over the internet. To make the link
work from any device, you need two things:

1. **MongoDB Atlas** — a cloud database, so you're not relying on a database running on
   someone's laptop.
2. **A public host for the backend and frontend** — so there's a real URL (like
   `https://kandy-bottles.vercel.app`) instead of `localhost`.

Both have generous free tiers and are enough to run this comfortably.

## Part 1: MongoDB Atlas setup (free, 512MB)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **Project** (any name, e.g. "Bottle Supplier").
3. Click **Build a Database** → choose the **M0 Free** tier → pick a cloud provider/region close to Sri Lanka (e.g. AWS Mumbai, `ap-south-1`) → **Create**.
4. **Create a database user**: you'll be prompted for a username and password — save these somewhere safe, you'll need them in a moment. (Or go to **Database Access** in the left menu later to add one.)
5. **Allow network access**: go to **Network Access** in the left menu → **Add IP Address** → for now choose **Allow Access from Anywhere** (`0.0.0.0/0`). This is the simplest option for a small business app; you can tighten it later if you want.
6. Once the cluster is created, click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with the database user you created, and add your database name before the `?`, e.g.:
   ```
   mongodb+srv://bottleAdmin:YourPassword123@cluster0.xxxxx.mongodb.net/bottle_inventory?retryWrites=true&w=majority
   ```
8. This full string is your `MONGO_URI`. You'll paste it into the backend's environment variables (locally in `.env`, and later into your hosting provider's settings).

512MB is plenty for a long time at this business's scale (each visit record is tiny). If you outgrow it, Atlas lets you upgrade to a paid tier at any point — no migration needed, just a plan change.

## Part 2: Run it locally against Atlas first (sanity check)

Before deploying anywhere, confirm Atlas works from your machine:

```
cd server
# edit .env -> set MONGO_URI to your Atlas connection string from above
npm run seed
npm run dev
```

If `npm run seed` completes and prints the owner login, Atlas is wired up correctly.

## Part 3: Deploy the backend (Render — free tier)

Render is a simple free option for a small Node API like this. (Railway or Fly.io work similarly if you prefer those.)

1. Push this project to a GitHub repository (create one, then in the project folder: `git init`, `git add .`, `git commit -m "initial"`, then follow GitHub's instructions to push).
2. Go to https://render.com, sign up, click **New +** → **Web Service** → connect your GitHub repo.
3. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Under **Environment**, add these variables (same as your `.env`):
   - `MONGO_URI` → your Atlas connection string
   - `JWT_SECRET` → a long random string
   - `CLIENT_URL` → leave as `*` for now, you'll update it once the frontend is deployed (Part 4)
5. Click **Create Web Service**. Render will build and deploy it, giving you a URL like `https://kandy-bottles-api.onrender.com`.
6. Test it: visit `https://kandy-bottles-api.onrender.com/api/health` in a browser — you should see `{"status":"ok"}`.
7. Run the seed script once against production. Easiest way: temporarily set `MONGO_URI` in your local `.env` to the Atlas string and run `npm run seed` from your own machine (Part 2 already did this) — it seeds the same Atlas database your live backend uses, so you don't need to run it "on" Render itself.

> Free-tier note: Render's free web services "sleep" after 15 minutes of no traffic and take ~30-50 seconds to wake up on the next request. Fine for a small team; if that delay bothers your client, Render's cheapest paid tier ($7/mo) removes it.

## Part 4: Deploy the frontend (Vercel — free tier)

1. In `client/.env`, set:
   ```
   VITE_API_URL=https://kandy-bottles-api.onrender.com/api
   ```
   (your actual Render URL from Part 3, with `/api` on the end)
2. Push this change to the same GitHub repo.
3. Go to https://vercel.com, sign up, click **Add New** → **Project** → import your repo.
4. Settings:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (auto-detected)
   - **Environment Variables**: add `VITE_API_URL` with the same value as above
5. Click **Deploy**. Vercel gives you a URL like `https://kandy-bottles.vercel.app` — this is the link you give your client.

## Part 5: Lock down CORS

Now that you have a real frontend URL, go back to Render → your backend service → **Environment** → update `CLIENT_URL` to:
```
https://kandy-bottles.vercel.app
```
(You can list more than one, comma-separated, if you also want to keep testing from `localhost:5173` — e.g. `http://localhost:5173,https://kandy-bottles.vercel.app`.) Save — Render will redeploy automatically.

## Part 6: Test from a phone

Open `https://kandy-bottles.vercel.app` on any phone or laptop, log in, and confirm it works. Because it's a normal responsive web app (not a native app), no app-store install is needed — your client just opens the link in their phone's browser. For daily use, they can add it to their home screen for a more app-like feel:
- **Android (Chrome)**: menu (⋮) → **Add to Home screen**.
- **iPhone (Safari)**: Share icon → **Add to Home Screen**.

## Ongoing costs

- **MongoDB Atlas M0**: free forever, 512MB storage cap.
- **Render free web service**: free forever, with the sleep/wake delay mentioned above.
- **Vercel free tier**: free forever for a project at this scale.

So the whole thing can run at **LKR 0/month** to start. If in ~2 months you outgrow the
512MB (unlikely at this business's scale unless you're storing photos), Atlas lets you
upgrade the same cluster to a paid tier — your data and connection string stay the same,
nothing needs to be rebuilt.
