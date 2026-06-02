// HTML renderers — direct ports of the original views/*.ejs templates, but as
// template strings. Interactive elements carry data-action attributes that
// app.js wires up. The app works the same; only the transport changed.

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------------------------------------------------- Ladder
export function renderLadder(ladder) {
  return `
  <h1>Ladder</h1>
  <table class="ladder">
    <thead><tr><th>#</th><th>Player</th><th>Teams</th><th>Points</th></tr></thead>
    <tbody>
      ${ladder.map((p, i) => `
        <tr class="${i === 0 ? 'leader' : ''}">
          <td class="rank">${i + 1}</td>
          <td>${esc(p.name)}</td>
          <td>${p.teamCount}</td>
          <td class="pts">${p.points}</td>
        </tr>`).join('')}
    </tbody>
  </table>
  <p class="hint">Points update as results are entered. Group win = 1, draw = 0.5. Knockouts: R32 = 1, R16 = 2, QF = 3, SF = 4, Final = 5.</p>`;
}

// -------------------------------------------------------------- Fixtures
export function renderFixtures(groups) {
  if (!groups.length) return `<h1>Fixtures</h1><p class="hint">No fixtures yet.</p>`;
  return `
  <h1>Fixtures</h1>
  <p class="hint">In kickoff order. Each match shows the two nations and, once the draft is done, which player owns them. Times shown in AEST.</p>
  ${groups.map((g) => `
    <section class="fxgroup">
      <h2>${esc(g.title)}</h2>
      <ul class="fixtures">
        ${g.fixtures.map((f) => `
          <li id="fx-${f.id}" class="fixture ${f.status === 'finished' ? 'played' : ''}">
            <div class="fxtop">
              <span class="fxtime">${esc(f.time_label)}</span>
              <span class="fxtag">${esc(f.stage_label)}</span>
            </div>
            <div class="teams">
              <span class="team home">${esc(f.home_name || 'TBD')}</span>
              <span class="score">${f.status === 'finished' ? `${f.home_score}&ndash;${f.away_score}` : 'v'}</span>
              <span class="team away">${esc(f.away_name || 'TBD')}</span>
            </div>
            <div class="owners">
              <span class="${f.home_owner ? 'owned' : 'unowned'}">${esc(f.home_owner || '—')}</span>
              <span class="vs">vs</span>
              <span class="${f.away_owner ? 'owned' : 'unowned'}">${esc(f.away_owner || '—')}</span>
            </div>
          </li>`).join('')}
      </ul>
    </section>`).join('')}`;
}

// --------------------------------------------------------------- Bracket
function koSide(name, owner, score, isWinner, finished, tbd) {
  return `
    <div class="ko-side ${isWinner ? 'win' : ''} ${tbd ? 'tbd' : ''}">
      <span class="ko-team">${tbd ? 'TBD' : esc(name || 'TBD')}</span>
      <span class="ko-owner">${esc(owner || '')}</span>
      <span class="ko-score">${finished && score != null ? score : ''}</span>
    </div>`;
}
function koMatch(m) {
  const finished = m.status === 'finished';
  return `
    <div class="ko-match ${finished ? 'played' : ''} ${m.tbd ? 'is-tbd' : ''}">
      ${!m.tbd && m.time_label ? `<div class="ko-when">${esc(m.date_label)} · ${esc(m.time_label)}</div>` : ''}
      ${koSide(m.home_name, m.home_owner, m.home_score, m.home_is_winner, finished, m.tbd)}
      ${koSide(m.away_name, m.away_owner, m.away_score, m.away_is_winner, finished, m.tbd)}
    </div>`;
}
export function renderBracket(b) {
  return `
  <h1>Knockout Bracket</h1>
  ${b.hasAny
    ? `<p class="hint">Advancing team highlighted. The name underneath each nation is the mate who owns it. Points: R32 = 1, R16 = 2, QF = 3, SF = 4, Final = 5.</p>`
    : `<p class="hint">The knockout bracket fills in after the group stage (add knockout matches from the Admin page once they're known). The structure is shown below.</p>`}
  <div class="bracket">
    ${b.rounds.map((rd) => `
      <div class="round">
        <h3 class="round-label">${esc(rd.label)} <span class="round-pts">${rd.pts} pt${rd.pts > 1 ? 's' : ''}</span></h3>
        <div class="round-matches">
          ${rd.matches.map(koMatch).join('')}
        </div>
      </div>`).join('')}
  </div>
  ${b.thirdPlace ? `
    <div class="third-place">
      <h3 class="round-label">Third-place playoff <span class="round-pts">1 pt</span></h3>
      ${koMatch(b.thirdPlace)}
    </div>` : ''}`;
}

// ----------------------------------------------------------------- Draft
export function renderDraft(s, isAdmin) {
  const head = `
    <div class="draft-head">
      <h1>Draft Room</h1>
      ${isAdmin && s.settings.draft_status !== 'not_started'
        ? `<form data-action="draft-reset"><button class="danger">Reset draft</button></form>` : ''}
    </div>`;

  if (s.settings.draft_status === 'not_started') {
    return head + `
      <div class="card">
        <p>The draft hasn't started yet. The pick order will be <strong>randomised</strong>, then run as a snake
          (1-2-3-4-5, then 5-4-3-2-1, and so on) for <strong>${s.teamsPerPlayer} rounds</strong> — that's
          ${s.teamsPerPlayer} teams each, with 3 nations left undrafted.</p>
        <ul class="players-list">${s.players.map((p) => `<li>${esc(p.name)}</li>`).join('')}</ul>
        ${isAdmin
          ? `<form data-action="draft-start"><button class="primary">🎲 Start draft (randomise order)</button></form>`
          : `<p class="hint">An admin needs to log in and start the draft.</p>`}
      </div>`;
  }

  const onclock = s.settings.draft_status === 'in_progress' && s.current ? `
    <div class="onclock card">
      <div class="onclock-main">
        <span class="label">On the clock</span>
        <span class="who">${esc(s.current.playerName)}</span>
        <span class="meta">Pick #${s.current.pickNumber} · Round ${s.current.round}</span>
      </div>
      ${s.upcoming.length ? `<div class="upnext">Next: ${s.upcoming.map((u) => esc(u.playerName)).join(' → ')}</div>` : ''}
    </div>`
    : (s.settings.draft_status === 'complete' ? `<div class="card done">✅ Draft complete — teams are locked in.</div>` : '');

  const rosters = `
    <section class="rosters">
      <h2>Rosters</h2>
      ${s.players.map((p) => `
        <div class="roster ${s.current && s.current.playerId === p.id ? 'active' : ''}">
          <h3><span class="slot">${p.draft_slot ?? '–'}</span> ${esc(p.name)}
            <span class="count">${p.roster.length}/${s.teamsPerPlayer}</span></h3>
          <ul>
            ${p.roster.map((pick) => `<li><span class="rank">#${pick.team_ranking}</span> ${esc(pick.team_name)}</li>`).join('')}
            ${!p.roster.length ? `<li class="empty">—</li>` : ''}
          </ul>
        </div>`).join('')}
    </section>`;

  let pickpane = '';
  if (s.settings.draft_status === 'in_progress' && isAdmin && s.current) {
    pickpane = `
      <section class="pickpane">
        <h2>Pick for <span class="hl">${esc(s.current.playerName)}</span></h2>
        <p class="hint">Best available first — by FIFA ranking</p>
        <div class="team-buttons">
          ${s.available.map((t) => `
            <button class="teambtn" data-action="draft-pick" data-team-id="${t.id}">
              <span class="rank">#${t.ranking}</span>
              <span class="tname">${esc(t.name)}</span>
              <span class="grp">${esc(t.grp)}</span>
            </button>`).join('')}
        </div>
      </section>`;
  } else if (s.settings.draft_status === 'in_progress' && !isAdmin) {
    pickpane = `<section class="pickpane"><p class="hint">Log in as admin to make picks.</p></section>`;
  }

  const progress = `
    <div class="progress">
      <div class="bar"><span style="width: ${s.totalPicks ? (s.picksMade / s.totalPicks * 100) : 0}%"></span></div>
      <span class="progress-label">${s.picksMade} / ${s.totalPicks} picks</span>
    </div>`;

  return head + progress + onclock + `<div class="draft-grid">${rosters}${pickpane}</div>`;
}

// ----------------------------------------------------------------- Admin
export function renderAdmin({ groups, players, teams, settings, mode, notice, problem }) {
  const teamOptions = (sel) => teams.map((t) => `<option value="${t.id}" ${sel === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('');

  const scoreRows = groups.map((g) => `
    <h3>${esc(g.title)}</h3>
    ${g.fixtures.map((f) => `
      <form data-action="score" id="fx-${f.id}" class="score-row">
        <input type="hidden" name="fixtureId" value="${f.id}" />
        <span class="t home">${esc(f.home_name || 'TBD')}</span>
        <input class="sc" type="number" min="0" name="homeScore" value="${f.home_score ?? ''}" />
        <input class="sc" type="number" min="0" name="awayScore" value="${f.away_score ?? ''}" />
        <span class="t away">${esc(f.away_name || 'TBD')}</span>
        ${f.stage !== 'group' ? `
          <select name="winnerTeamId">
            <option value="">advances…</option>
            <option value="${f.home_team_id}" ${f.winner_team_id === f.home_team_id ? 'selected' : ''}>${esc(f.home_name || 'Home')}</option>
            <option value="${f.away_team_id}" ${f.winner_team_id === f.away_team_id ? 'selected' : ''}>${esc(f.away_name || 'Away')}</option>
          </select>` : ''}
        <button type="submit">${f.status === 'finished' ? 'Update' : 'Save'}</button>
        ${f.stage !== 'group' ? `<button type="button" class="danger" data-action="del-fixture" data-id="${f.id}">✕</button>` : ''}
      </form>`).join('')}`).join('');

  return `
  <h1>Admin</h1>
  ${notice ? `<div class="banner ok">${esc(notice)}</div>` : ''}
  ${problem ? `<div class="banner err">${esc(problem)}</div>` : ''}

  <section class="card">
    <h2>Data <span class="provider-tag">${mode === 'supabase' ? 'supabase · shared' : 'local · this device only'}</span></h2>
    ${mode === 'supabase'
      ? `<p class="hint">Connected to Supabase — the draft, scores and ladder are shared live with everyone.</p>`
      : `<p class="hint">No Supabase keys in <code>config.js</code> yet, so data lives only in <strong>this</strong> browser. Great for a solo test run; fill in <code>config.js</code> to share with the group.</p>`}
  </section>

  <section class="card">
    <h2>Players</h2>
    <form data-action="players" class="form grid-players">
      ${players.map((p) => `<label>Slot ${p.draft_slot || '–'}<input name="player_${p.id}" value="${esc(p.name)}" /></label>`).join('')}
      <button type="submit">Save names</button>
    </form>
  </section>

  <section class="card">
    <h2>Settings</h2>
    <form data-action="settings" class="form">
      <label class="checkbox">
        <input type="checkbox" name="scoreThirdPlace" ${settings.score_third_place ? 'checked' : ''} />
        Score the third-place playoff (1 point)
      </label>
      <button type="submit">Save settings</button>
    </form>
    <hr />
    <form data-action="draft-reset"><button class="danger">Reset draft (clears all picks)</button></form>
  </section>

  <section class="card">
    <h2>Add a knockout match</h2>
    <p class="hint">Once the bracket is drawn, add each knockout tie here so it shows on the Bracket page and can be scored.</p>
    <form data-action="add-fixture" class="form">
      <label>Round
        <select name="stage">
          <option value="R32">Round of 32</option>
          <option value="R16">Round of 16</option>
          <option value="QF">Quarter-final</option>
          <option value="SF">Semi-final</option>
          <option value="third">Third-place playoff</option>
          <option value="final">Final</option>
        </select>
      </label>
      <label>Home team<select name="homeTeamId">${teamOptions()}</select></label>
      <label>Away team<select name="awayTeamId">${teamOptions()}</select></label>
      <label>Kickoff (optional)<input type="datetime-local" name="kickoff" /></label>
      <button type="submit">Add match</button>
    </form>
  </section>

  <section class="card">
    <h2>Enter scores</h2>
    <p class="hint">For knockout matches, also pick the team that advances (this is who gets the points, including penalty wins).</p>
    ${scoreRows}
  </section>`;
}

// ----------------------------------------------------------------- Login
export function renderLogin(error) {
  return `
  <h1>Admin login</h1>
  ${error ? `<p class="error">${esc(error)}</p>` : ''}
  <form data-action="login" class="card form narrow">
    <label>Password<input type="password" name="password" autofocus autocomplete="current-password" /></label>
    <button type="submit" class="primary">Log in</button>
  </form>`;
}
