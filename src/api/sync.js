import { query, withTransaction } from '../db/index.js';
import { fetchMatches } from './footballData.js';
import { rankFor } from '../data/fifaRankings.js';

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
 * Update scores for FINISHED matches, matched to our fixtures by API id.
 * Safe to run repeatedly (this is what the cron job calls).
 */
export async function syncScores(matches) {
  let updated = 0;
  for (const m of matches) {
    if (!m.finished) continue;
    const fx = (
      await query('SELECT id, home_team_id, away_team_id FROM fixtures WHERE api_id = $1', [m.apiId])
    ).rows[0];
    if (!fx) continue;
    await query(
      `UPDATE fixtures
          SET home_score = $1, away_score = $2, winner_team_id = $3,
              status = 'finished', updated_at = now()
        WHERE id = $4`,
      [m.homeScore, m.awayScore, winnerTeamId(m, fx.home_team_id, fx.away_team_id), fx.id]
    );
    updated += 1;
  }
  return { updated };
}

// Fetch-and-do helpers used by the cron job and the admin buttons.
export async function importFromApi(token) {
  return importMatches(await fetchMatches(token));
}
export async function syncFromApi(token) {
  return syncScores(await fetchMatches(token));
}
