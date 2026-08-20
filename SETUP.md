# Setup checklist

One-time setup, ordered by when you need it. Every step is done by you in a browser; no step shares a password with anyone. All services are free tier.

## 1. GitHub repo (needed first)

- [ ] Create a **public** repo called `money-tree-tracker` on github.com (no README, we have one).
- [ ] Push this folder to it (or let Claude push once you have created it).
- [ ] Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

After the first push the `deploy-pages` workflow publishes the app at
`https://favour-okoye.github.io/money-tree-tracker/`.

## 2. Email alerts (Gmail app password)

- [ ] Google Account → Security → turn on **2-Step Verification** (if not already on).
- [ ] Google Account → search "App passwords" → create one named `moneytree`.
- [ ] Repo **Settings → Secrets and variables → Actions → New repository secret**, add three:
  - `MAIL_USERNAME` = your Gmail address
  - `MAIL_APP_PASSWORD` = the 16-character app password
  - `MAIL_TO` = the address that should receive alerts (same Gmail is fine)

Test: Actions tab → `poll-feeds` → Run workflow. It should say "No new uploads". The email only sends when she actually posts.

## 3. Supabase (personal tracking: watched, notes, XP)

- [ ] supabase.com → New project. Region: **eu-central (Frankfurt)**. Save the database password it asks you to set (you rarely need it again).
- [ ] Project → **SQL Editor** → paste the whole of `supabase/migrations/0001_core.sql` → Run.
- [ ] Project → **Settings → API**: copy the **Project URL** and the **anon public** key.
- [ ] On your laptop: copy `frontend/.env.example` to `frontend/.env.local` and fill both values in.
- [ ] In the repo: **Settings → Secrets and variables → Actions → Variables** (not secrets, these two are public by design), add:
  - `VITE_SUPABASE_URL` = the Project URL
  - `VITE_SUPABASE_ANON_KEY` = the anon key
- [ ] Supabase → **Authentication → Sign In / Providers → Email**: make sure Email is enabled. Then open **Emails → Magic Link template** and check the body contains `{{ .Token }}` (the 6-digit code). If it only has a link, add a line like: `Your code: {{ .Token }}`.
- [ ] Sign in once in the app (email code). Then Supabase → **Authentication → Sign In / Providers → turn OFF "Allow new users to sign up"**. You are in; the door closes behind you.

## 4. YouTube API key (exact dates and durations)

The app already works with approximate dates from the keyless backfill. This upgrades everything to exact data and keeps it healed monthly.

- [ ] console.cloud.google.com → New project (any name) → **APIs & Services → Library → YouTube Data API v3 → Enable**.
- [ ] **APIs & Services → Credentials → Create credentials → API key.** No billing account needed.
- [ ] Repo **Settings → Secrets → New repository secret**: `YT_API_KEY` = the key.
- [ ] Actions tab → `backfill-and-enrich` → Run workflow → mode: `enrich`.

## 5. Put it on your phone

- [ ] Open `https://favour-okoye.github.io/money-tree-tracker/` on your phone.
- [ ] **Android Chrome**: menu ⋮ → *Install app*. **iPhone Safari**: Share → *Add to Home Screen*.
- [ ] Sign in once; the session sticks.

## Recap of what lives where

| Thing | Where | Why it is safe |
|---|---|---|
| `MAIL_APP_PASSWORD`, `YT_API_KEY` | GitHub repo **secrets** | encrypted, only Actions can read them |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | GitHub repo **variables** + `frontend/.env.local` | public by design; row-level security protects the data |
| Your notes, statuses, XP | Supabase Postgres | RLS: only your signed-in user can read or write |
| Her catalogue | `data/*.json` in the repo | public information anyway |
