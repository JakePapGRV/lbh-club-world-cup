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

  // Group fixtures (round-robin). Ordered by matchday then group, then given a
  // placeholder kickoff schedule (4 matches/day from 11 Jun 2026) so the
  // fixtures page can sort by game time. Real kickoffs come from the API import.
  const fixtures = generateGroupFixtures(teamRows).sort(
    (a, b) => a.matchday - b.matchday || a.grp.localeCompare(b.grp)
  );
  const FIRST_KICKOFF = Date.UTC(2026, 5, 11, 9, 0, 0); // 11 Jun 2026 09:00 UTC
  const DAY_MS = 86400000;
  for (let i = 0; i < fixtures.length; i++) {
    const fx = fixtures[i];
    const kickoff = new Date(FIRST_KICKOFF + Math.floor(i / 4) * DAY_MS + (i % 4) * 3 * 3600000);
    await query(
      `INSERT INTO fixtures (stage, grp, matchday, kickoff, home_team_id, away_team_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [fx.stage, fx.grp, fx.matchday, kickoff.toISOString(), fx.homeTeamId, fx.awayTeamId]
    );
  }

  console.log(`Seeded ${DEFAULT_PLAYERS.length} players, ${TEAMS.length} teams, ${fixtures.length} group fixtures.`);
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
