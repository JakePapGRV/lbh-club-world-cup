# LBH Club — World Cup Draft

A 5-player fantasy draft for the 2026 FIFA World Cup. Draft your teams in a
snake order, then earn points as your nations win through the tournament.

- **Draft room** — random order, then snake (1-2-3-4-5, 5-4-3-2-1, …), 9 teams each.
- **Ladder** — live points table.
- **Fixtures** — every match with the owner overlay (e.g. *Australia vs USA = Jake vs Mickey*).
- **Admin** — start/reset the draft, edit player names, enter scores, settings.

## Scoring

| Stage | Win | Draw |
|---|---|---|
| Group | 1 | 0.5 |
| Round of 32 | 1 | — |
| Round of 16 | 2 | — |
| Quarter-final | 3 | — |
| Semi-final | 4 | — |
| Third-place playoff | 1 | — |
| Final | 5 | — |

Knockouts decided by penalties: the team that advances takes the full win
points. If you own **both** teams in a match, nominate a winner in advance —
correct nomination scores the win, a draw scores 0.5, a wrong/no nomination
scores 0.

## Run it locally (zero setup)

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no `DATABASE_URL`, it uses an in-memory
Postgres (PGlite) seeded with placeholder teams — perfect for a test run. **Data
is not saved between restarts in this mode.**

The admin area (start/reset draft, scores) is behind a password — default `admin`
locally. Set `ADMIN_PASSWORD` to change it.

Run the tests (rules engine + full draft flow):

```bash
npm test
```

## Deploy to Render (persistent)

1. Push this repo to GitHub.
2. On [render.com](https://render.com): **New + → Blueprint**, point it at the repo.
   `render.yaml` provisions the web service **and** a managed Postgres database.
3. In the service's **Environment** tab set:
   - `ADMIN_PASSWORD` — your admin password.
   - `FOOTBALL_DATA_TOKEN` — a free token from
     [football-data.org](https://www.football-data.org/client/register) (only
     needed once live-score auto-sync is enabled).
4. With `DATABASE_URL` present (Render sets it automatically), data persists
   across restarts and redeploys.

## Test run, then the real thing

1. Deploy (or run locally), log in as admin, open **Draft Room**, hit **Start
   draft** and run through it.
2. When you're happy, **Admin → Reset draft** (or **Draft Room → Reset draft**)
   clears all picks and re-rolls the order.
3. Do the real draft once. Teams lock in when all 45 picks are made.

## Environment variables

See `.env.example`. Key ones: `DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`,
`FOOTBALL_DATA_TOKEN`.

## Status / roadmap

- ✅ Rules engine (draft order + scoring), fully tested
- ✅ Draft room, ladder, fixtures, admin score entry
- ⬜ Live score auto-sync from football-data.org (manual entry works today)
- ⬜ Real 2026 teams/fixtures import + knockout bracket (placeholder data for now)
