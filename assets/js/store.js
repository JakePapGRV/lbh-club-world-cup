// Data layer. Two interchangeable backends behind one interface:
//   • Supabase (when config.js has a URL + anon key) — shared across everyone.
//   • localStorage (fallback) — this browser only, for a solo test run.
// Both expose the same methods so the rest of the app doesn't care which is live.

import { supabaseEnabled, sbSelect, sbInsert, sbUpdate, sbDelete } from './supabase.js?v=2';
import { TEAMS, DEFAULT_PLAYERS, TEAMS_PER_PLAYER } from './lib/teams.js?v=2';
import { buildPickSequence, shuffle } from './lib/draft.js?v=2';
import { generateGroupFixtures } from './lib/fixtures.js?v=2';

const nowIso = () => new Date().toISOString();

// ---- shared seed (matches src/db/seed.js so local + Supabase are identical) ----
function seedGroupFixtures() {
  const teamRows = TEAMS.map((t, i) => ({ id: i + 1, grp: t.grp }));
  const fixtures = generateGroupFixtures(teamRows).sort(
    (a, b) => a.matchday - b.matchday || a.grp.localeCompare(b.grp)
  );
  const DAY_MS = 86400000;
  const MATCHDAY_START = { 1: Date.UTC(2026, 5, 11), 2: Date.UTC(2026, 5, 17), 3: Date.UTC(2026, 5, 23) };
  const SLOT_HOURS = [16, 19, 22, 25];
  const per = { 1: 0, 2: 0, 3: 0 };
  return fixtures.map((fx, i) => {
    const idx = per[fx.matchday]++;
    const kickoff = new Date(
      MATCHDAY_START[fx.matchday] + Math.floor(idx / 4) * DAY_MS + SLOT_HOURS[idx % 4] * 3600000
    );
    return {
      id: i + 1, api_id: null, stage: 'group', grp: fx.grp, matchday: fx.matchday,
      kickoff: kickoff.toISOString(), home_team_id: fx.homeTeamId, away_team_id: fx.awayTeamId,
      home_score: null, away_score: null, winner_team_id: null, status: 'scheduled',
    };
  });
}

// =========================================================================
//  localStorage backend
// =========================================================================
const LS_KEY = 'lbh_wc_state_v1';

function freshLocalState() {
  return {
    settings: { id: 1, draft_status: 'not_started', draft_started_at: null, score_third_place: true },
    players: DEFAULT_PLAYERS.map((name, i) => ({ id: i + 1, name, draft_slot: null })),
    teams: TEAMS.map((t, i) => ({ id: i + 1, name: t.name, code: t.code, grp: t.grp, ranking: t.ranking, api_id: null })),
    fixtures: seedGroupFixtures(),
    picks: [],
    nominations: [],
    nextFixtureId: 1000,
  };
}
function lsLoad() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const s = freshLocalState();
  localStorage.setItem(LS_KEY, JSON.stringify(s));
  return s;
}
function lsSave(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

const localBackend = {
  mode: 'local',
  async loadAll() {
    const s = lsLoad();
    return { settings: s.settings, players: s.players, teams: s.teams, fixtures: s.fixtures, picks: s.picks, nominations: s.nominations };
  },
  async startDraft() {
    const s = lsLoad();
    const order = shuffle(s.players.map((p) => p.id));
    order.forEach((id, i) => { s.players.find((p) => p.id === id).draft_slot = i + 1; });
    s.settings.draft_status = 'in_progress';
    s.settings.draft_started_at = nowIso();
    lsSave(s);
  },
  async makePick(teamId) {
    const s = lsLoad();
    if (s.settings.draft_status !== 'in_progress') throw new Error('Draft is not in progress');
    const order = s.players.filter((p) => p.draft_slot != null).sort((a, b) => a.draft_slot - b.draft_slot).map((p) => p.id);
    const seq = buildPickSequence(order, TEAMS_PER_PLAYER);
    const current = seq[s.picks.length];
    if (!current) throw new Error('Draft is already complete');
    if (s.picks.some((p) => p.team_id === teamId)) throw new Error('That team has already been picked');
    s.picks.push({ id: s.picks.length + 1, pick_number: current.pickNumber, round: current.round, player_id: current.playerId, team_id: teamId });
    if (s.picks.length >= seq.length) s.settings.draft_status = 'complete';
    lsSave(s);
  },
  async resetDraft() {
    const s = lsLoad();
    s.nominations = [];
    s.picks = [];
    s.players.forEach((p) => { p.draft_slot = null; });
    s.settings.draft_status = 'not_started';
    s.settings.draft_started_at = null;
    lsSave(s);
  },
  async setScore(fixtureId, home, away, winnerTeamId) {
    const s = lsLoad();
    const f = s.fixtures.find((x) => x.id === fixtureId);
    if (!f) throw new Error('Unknown fixture');
    f.home_score = home; f.away_score = away; f.winner_team_id = winnerTeamId ?? null;
    f.status = 'finished';
    lsSave(s);
  },
  async addFixture({ stage, kickoff, homeTeamId, awayTeamId }) {
    const s = lsLoad();
    const id = s.nextFixtureId++;
    s.fixtures.push({ id, api_id: null, stage, grp: null, matchday: null, kickoff: kickoff || null, home_team_id: homeTeamId ?? null, away_team_id: awayTeamId ?? null, home_score: null, away_score: null, winner_team_id: null, status: 'scheduled' });
    lsSave(s);
    return id;
  },
  async deleteFixture(fixtureId) {
    const s = lsLoad();
    s.nominations = s.nominations.filter((n) => n.fixture_id !== fixtureId);
    s.fixtures = s.fixtures.filter((x) => x.id !== fixtureId);
    lsSave(s);
  },
  async updatePlayerNames(map) {
    const s = lsLoad();
    for (const p of s.players) { if (map[p.id] != null && String(map[p.id]).trim()) p.name = String(map[p.id]).trim(); }
    lsSave(s);
  },
  async setThirdPlace(on) {
    const s = lsLoad();
    s.settings.score_third_place = Boolean(on);
    lsSave(s);
  },
  async setNomination(fixtureId, playerId, teamId) {
    const s = lsLoad();
    s.nominations = s.nominations.filter((n) => !(n.fixture_id === fixtureId && n.player_id === playerId));
    if (teamId != null) s.nominations.push({ fixture_id: fixtureId, player_id: playerId, team_id: teamId });
    lsSave(s);
  },
};

// =========================================================================
//  Supabase backend
// =========================================================================
const supabaseBackend = {
  mode: 'supabase',
  async loadAll() {
    const [settings, players, teams, fixtures, picks, nominations] = await Promise.all([
      sbSelect('settings', 'select=*&id=eq.1'),
      sbSelect('players', 'select=*&order=id.asc'),
      sbSelect('teams', 'select=*&order=ranking.asc.nullslast,name.asc'),
      sbSelect('fixtures', 'select=*&order=kickoff.asc.nullslast,id.asc'),
      sbSelect('picks', 'select=*&order=pick_number.asc'),
      sbSelect('nominations', 'select=*'),
    ]);
    return { settings: (settings && settings[0]) || null, players: players || [], teams: teams || [], fixtures: fixtures || [], picks: picks || [], nominations: nominations || [] };
  },
  async startDraft() {
    const players = (await sbSelect('players', 'select=id&order=id.asc')) || [];
    if (!players.length) throw new Error('No players to draft');
    const order = shuffle(players.map((p) => p.id));
    await Promise.all(order.map((id, i) => sbUpdate('players', `id=eq.${id}`, { draft_slot: i + 1 })));
    await sbUpdate('settings', 'id=eq.1', { draft_status: 'in_progress', draft_started_at: nowIso() });
  },
  async makePick(teamId) {
    const [settingsArr, players, picks] = await Promise.all([
      sbSelect('settings', 'select=*&id=eq.1'),
      sbSelect('players', 'select=id,draft_slot&draft_slot=not.is.null&order=draft_slot.asc'),
      sbSelect('picks', 'select=team_id,pick_number'),
    ]);
    const settings = settingsArr && settingsArr[0];
    if (!settings || settings.draft_status !== 'in_progress') throw new Error('Draft is not in progress');
    const seq = buildPickSequence((players || []).map((p) => p.id), TEAMS_PER_PLAYER);
    const current = seq[(picks || []).length];
    if (!current) throw new Error('Draft is already complete');
    if ((picks || []).some((p) => p.team_id === teamId)) throw new Error('That team has already been picked');
    await sbInsert('picks', { pick_number: current.pickNumber, round: current.round, player_id: current.playerId, team_id: teamId });
    if ((picks || []).length + 1 >= seq.length) await sbUpdate('settings', 'id=eq.1', { draft_status: 'complete' });
  },
  async resetDraft() {
    await sbDelete('nominations', 'player_id=gt.0');
    await sbDelete('picks', 'pick_number=gt.0');
    await sbUpdate('players', 'id=gt.0', { draft_slot: null });
    await sbUpdate('settings', 'id=eq.1', { draft_status: 'not_started', draft_started_at: null });
  },
  async setScore(fixtureId, home, away, winnerTeamId) {
    await sbUpdate('fixtures', `id=eq.${fixtureId}`, {
      home_score: home, away_score: away, winner_team_id: winnerTeamId ?? null, status: 'finished', updated_at: nowIso(),
    });
  },
  async addFixture({ stage, kickoff, homeTeamId, awayTeamId }) {
    const rows = await sbInsert('fixtures', { stage, kickoff: kickoff || null, home_team_id: homeTeamId ?? null, away_team_id: awayTeamId ?? null, status: 'scheduled' });
    return rows && rows[0] && rows[0].id;
  },
  async deleteFixture(fixtureId) {
    await sbDelete('nominations', `fixture_id=eq.${fixtureId}`);
    await sbDelete('fixtures', `id=eq.${fixtureId}`);
  },
  async updatePlayerNames(map) {
    const entries = Object.entries(map).filter(([, v]) => v != null && String(v).trim());
    await Promise.all(entries.map(([id, v]) => sbUpdate('players', `id=eq.${id}`, { name: String(v).trim() })));
  },
  async setThirdPlace(on) {
    await sbUpdate('settings', 'id=eq.1', { score_third_place: Boolean(on) });
  },
  async setNomination(fixtureId, playerId, teamId) {
    await sbDelete('nominations', `fixture_id=eq.${fixtureId}&player_id=eq.${playerId}`);
    if (teamId != null) await sbInsert('nominations', { fixture_id: fixtureId, player_id: playerId, team_id: teamId });
  },
};

export const store = supabaseEnabled ? supabaseBackend : localBackend;
export const TEAMS_PER_PLAYER_EXPORT = TEAMS_PER_PLAYER;
