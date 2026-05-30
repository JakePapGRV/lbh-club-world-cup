import { query } from './index.js';
import { ensureSchema } from './setup.js';
import { TEAMS, DEFAULT_PLAYERS } from '../data/teams.js';
import { generateGroupFixtures } from '../lib/fixtures.js';

/** True if there are no teams loaded yet. */
async function isEmpty() {
  const { rows } = await query('SELECT COUNT(*)::int AS n FROM teams');
  return rows[0].n === 0;
}

/**
 * Seed players, teams and group fixtures. Wipes existing draft/fixture/team
 * data first so it is safe to re-run during testing.
 */
export async function seed() {
  await ensureSchema();

  // Clear in dependency order.
  await query('DELETE FROM nominations');
  await query('DELETE FROM picks');
  await query('DELETE FROM fixtures');
  await query('DELETE FROM teams');
  await query('DELETE FROM players');
  await query("UPDATE settings SET draft_status='not_started', draft_started_at=NULL WHERE id=1");

  // Players (default names; editable later in admin).
  for (const name of DEFAULT_PLAYERS) {
    await query('INSERT INTO players (name) VALUES ($1)', [name]);
  }

  // Teams.
  const teamRows = [];
  for (const t of TEAMS) {
    const { rows } = await query(
      'INSERT INTO teams (name, code, grp, ranking) VALUES ($1, $2, $3, $4) RETURNING id, grp',
      [t.name, t.code, t.grp, t.ranking]
    );
    teamRows.push(rows[0]);
  }

  // Group fixtures (round-robin), spread across the real group-stage window
  // (11–27 Jun 2026) by matchday, four kickoffs a day. UTC slots are chosen so
  // the AEST display lands on realistic morning viewing times (a North-American
  // evening kickoff is an Australian morning). These are placeholders — the API
  // import replaces them with the official schedule.
  const fixtures = generateGroupFixtures(teamRows).sort(
    (a, b) => a.matchday - b.matchday || a.grp.localeCompare(b.grp)
  );
  const DAY_MS = 86400000;
  const MATCHDAY_START = {
    1: Date.UTC(2026, 5, 11), // 11 Jun
    2: Date.UTC(2026, 5, 17), // 17 Jun
    3: Date.UTC(2026, 5, 23), // 23 Jun
  };
  const SLOT_HOURS = [16, 19, 22, 25]; // UTC → ~02:00, 05:00, 08:00, 11:00 AEST
  const perMatchday = { 1: 0, 2: 0, 3: 0 };
  for (const fx of fixtures) {
    const idx = perMatchday[fx.matchday]++;
    const kickoff = new Date(
      MATCHDAY_START[fx.matchday] + Math.floor(idx / 4) * DAY_MS + SLOT_HOURS[idx % 4] * 3600000
    );
    await query(
      `INSERT INTO fixtures (stage, grp, matchday, kickoff, home_team_id, away_team_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [fx.stage, fx.grp, fx.matchday, kickoff.toISOString(), fx.homeTeamId, fx.awayTeamId]
    );
  }

  // No knockout fixtures are seeded: the Round of 32 onwards depends on group
  // results, so those teams are unknown until the tournament. The bracket page
  // shows the empty TBD structure until the real knockout fixtures arrive via
  // the API import.

  console.log(
    `Seeded ${DEFAULT_PLAYERS.length} players, ${TEAMS.length} teams, ${fixtures.length} group fixtures.`
  );
}

/** Seed only if the database has no teams yet (used on server boot). */
export async function seedIfEmpty() {
  await ensureSchema();
  if (await isEmpty()) await seed();
}

// Allow running directly: `npm run db:seed`
if (process.argv[1]?.endsWith('seed.js')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
