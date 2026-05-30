import { query, withTransaction } from '../db/index.js';
import * as footballData from './footballData.js';
import * as sportmonks from './sportmonks.js';
import { rankFor } from '../data/fifaRankings.js';

// Which score provider is active, and its token. Defaults to SportMonks.
function activeProvider() {
  const name = (process.env.SCORE_PROVIDER || 'sportmonks').toLowerCase();
  if (name === 'football-data') {
    return { name: 'football-data', fetch: footballData.fetchMatches, token: process.env.FOOTBALL_DATA_TOKEN };
  }
  return { name: 'sportmonks', fetch: sportmonks.fetchMatches, token: process.env.SPORTMONKS_TOKEN };
}

/** For the UI / startup logging: which provider and whether its token is set. */
export function scoreProviderStatus() {
  const p = activeProvider();
  return { name: p.name, tokenSet: Boolean(p.token) };
}

/** Map a normalised match's winner side to a concrete team id (null = draw/unknown). */
function winnerTeamId(match, homeId, awayId) {
  if (match.winnerSide === 'HOME_TEAM') return homeId;
  if (match.winnerSide === 'AWAY_TEAM') return awayId;
  return null;
}

/**
 * Replace teams + fixtures with official data from normalised matches.
 * Only allowed before the draft starts (it wipes any picks). Run this once,
 * before drafting, when the real fixtures are published.
 */
export async function importMatches(matches) {
  const settings = (await query('SELECT draft_status FROM settings WHERE id = 1')).rows[0];
  if (settings && settings.draft_status !== 'not_started') {
    throw new Error('Reset the draft before importing official data.');
  }

  // Unique teams keyed by API id; group comes from their group-stage match.
  const teams = new Map();
  for (const m of matches) {
    for (const side of [m.home, m.away]) {
      if (!side.apiId) continue;
      if (!teams.has(side.apiId)) {
        teams.set(side.apiId, { apiId: side.apiId, name: side.name, code: side.code, group: null });
      }
      if (m.stage === 'group' && m.group && !teams.get(side.apiId).group) {
        teams.get(side.apiId).group = m.group;
      }
    }
  }

  const importable = matches.filter((m) => m.stage);

  await withTransaction(async (tx) => {
    await tx.query('DELETE FROM nominations');
    await tx.query('DELETE FROM picks');
    await tx.query('DELETE FROM fixtures');
    await tx.query('DELETE FROM teams');

    const idByApi = new Map();
    for (const t of teams.values()) {
      const { rows } = await tx.query(
        'INSERT INTO teams (name, code, grp, ranking, api_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [t.name, t.code, t.group, rankFor(t.name, t.code), t.apiId]
      );
      idByApi.set(t.apiId, rows[0].id);
    }

    for (const m of importable) {
      const homeId = m.home.apiId ? idByApi.get(m.home.apiId) ?? null : null;
      const awayId = m.away.apiId ? idByApi.get(m.away.apiId) ?? null : null;
      await tx.query(
        `INSERT INTO fixtures (api_id, stage, grp, kickoff, home_team_id, away_team_id,
                               home_score, away_score, winner_team_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          m.apiId,
          m.stage,
          m.group,
          m.utcDate,
          homeId,
          awayId,
          m.finished ? m.homeScore : null,
          m.finished ? m.awayScore : null,
          m.finished ? winnerTeamId(m, homeId, awayId) : null,
          m.finished ? 'finished' : 'scheduled',
        ]
      );
    }
  });

  return { teams: teams.size, fixtures: importable.length };
}

/**
 * Keep fixtures in step with the API, matched by API id. Safe to run repeatedly
 * during the tournament (this is what the cron job + "Sync now" call). It:
 *   - inserts fixtures that didn't exist at import time (e.g. knockout ties
 *     created once the bracket is drawn),
 *   - fills in knockout participants as they get confirmed (resolving teams by
 *     their API id — teams themselves are never changed here),
 *   - records final scores + the advancing team for finished matches,
 *   - never clobbers an existing score for a match the API hasn't finished yet
 *     (so a manual entry survives until the API catches up).
 * It does NOT touch teams or picks, so it's safe after the draft is locked.
 */
export async function syncScores(matches) {
  const teamRows = (await query('SELECT id, api_id FROM teams WHERE api_id IS NOT NULL')).rows;
  const teamIdByApi = new Map(teamRows.map((r) => [String(r.api_id), r.id]));
  const resolve = (apiId) => (apiId != null ? teamIdByApi.get(String(apiId)) ?? null : null);

  let updated = 0;
  let inserted = 0;
  for (const m of matches) {
    if (!m.stage) continue; // skip matches whose stage we couldn't map
    const homeId = resolve(m.home.apiId);
    const awayId = resolve(m.away.apiId);
    const existing = (await query('SELECT id FROM fixtures WHERE api_id = $1', [m.apiId])).rows[0];

    if (!existing) {
      await query(
        `INSERT INTO fixtures (api_id, stage, grp, kickoff, home_team_id, away_team_id,
                               home_score, away_score, winner_team_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          m.apiId, m.stage, m.group, m.utcDate, homeId, awayId,
          m.finished ? m.homeScore : null,
          m.finished ? m.awayScore : null,
          m.finished ? winnerTeamId(m, homeId, awayId) : null,
          m.finished ? 'finished' : 'scheduled',
        ]
      );
      inserted += 1;
      continue;
    }

    if (m.finished) {
      await query(
        `UPDATE fixtures
            SET stage = $1, grp = $2, kickoff = $3, home_team_id = $4, away_team_id = $5,
                home_score = $6, away_score = $7, winner_team_id = $8,
                status = 'finished', updated_at = now()
          WHERE id = $9`,
        [m.stage, m.group, m.utcDate, homeId, awayId, m.homeScore, m.awayScore, winnerTeamId(m, homeId, awayId), existing.id]
      );
    } else {
      // Refresh matchup/kickoff (e.g. knockout teams getting confirmed) without
      // touching the score/status, so a finished or manually-entered result stays.
      await query(
        `UPDATE fixtures
            SET stage = $1, grp = $2, kickoff = $3, home_team_id = $4, away_team_id = $5, updated_at = now()
          WHERE id = $6`,
        [m.stage, m.group, m.utcDate, homeId, awayId, existing.id]
      );
    }
    updated += 1;
  }
  return { updated, inserted };
}

// Fetch-and-do helpers used by the cron job and the admin buttons. They pick the
// active provider (SportMonks by default) and read its token from the env.
export async function importFromApi() {
  const p = activeProvider();
  if (!p.token) throw new Error(`No API token set for provider "${p.name}".`);
  return importMatches(await p.fetch(p.token));
}
export async function syncFromApi() {
  const p = activeProvider();
  if (!p.token) throw new Error(`No API token set for provider "${p.name}".`);
  return syncScores(await p.fetch(p.token));
}
