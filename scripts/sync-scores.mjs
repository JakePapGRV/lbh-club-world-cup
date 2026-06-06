// Poll the score provider (SportMonks by default) and write results straight
// into Supabase. This is what the scheduled GitHub Action runs; you can also run
// it by hand:
//
//   DATABASE_URL="postgres://…supabase…" SPORTMONKS_TOKEN="…" node scripts/sync-scores.mjs
//
// DATABASE_URL must be your Supabase *connection string* (use the IPv4 "Session
// pooler" URI from Supabase → Project Settings → Database). src/db/index.js opens
// it with SSL automatically for any non-localhost host.
import { syncFromApi, scoreProviderStatus } from '../src/api/sync.js';

const { name, tokenSet } = scoreProviderStatus();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set — point it at your Supabase connection string.');
  process.exit(1);
}
if (!tokenSet) {
  console.error(`No API token set for provider "${name}". Set SPORTMONKS_TOKEN (or FOOTBALL_DATA_TOKEN).`);
  process.exit(1);
}

try {
  const r = await syncFromApi();
  console.log(
    `[sync] provider=${r.provider} fetched=${r.fetched} ` +
      `teamsLinked=${r.teamsLinked} fixturesLinked=${r.fixturesLinked} ` +
      `updated=${r.updated} inserted=${r.inserted}`
  );

  if (r.fetched === 0) {
    console.warn(
      '⚠ The provider returned 0 World Cup fixtures. The SportMonks FREE tier does ' +
        'NOT include the FIFA World Cup, so on a free plan nothing will ever sync. ' +
        'Confirm your plan covers it, and that SPORTMONKS_WC_LEAGUE_ID is correct.'
    );
  }
  if (r.unmatched.length) {
    console.warn(
      `⚠ Could not match these API teams to seeded teams: ${r.unmatched.join(', ')}. ` +
        'Add the spelling to the table in src/data/fifaRankings.js.'
    );
  }
  process.exit(0);
} catch (err) {
  console.error('[sync] failed:', err.message);
  process.exit(1);
}
