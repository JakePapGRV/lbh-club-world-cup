// PLACEHOLDER seed data for the test run.
//
// The 2026 World Cup has 48 teams in 12 groups (A–L) of 4. The group
// assignments and `ranking` values below are approximate placeholders so you
// can test the draft + ladder end to end before the tournament. For the live
// competition the real teams, groups, fixtures and rankings are pulled from the
// football data API.
//
// `ranking` is the FIFA world ranking (1 = best). The draft lists available
// teams by this ranking rather than by group.

export const TEAMS = [
  // Group A
  { name: 'Mexico', code: 'MEX', grp: 'A', ranking: 17 },
  { name: 'Croatia', code: 'CRO', grp: 'A', ranking: 11 },
  { name: 'South Korea', code: 'KOR', grp: 'A', ranking: 22 },
  { name: 'Ghana', code: 'GHA', grp: 'A', ranking: 38 },
  // Group B
  { name: 'Canada', code: 'CAN', grp: 'B', ranking: 31 },
  { name: 'Belgium', code: 'BEL', grp: 'B', ranking: 8 },
  { name: 'Morocco', code: 'MAR', grp: 'B', ranking: 12 },
  { name: 'Saudi Arabia', code: 'KSA', grp: 'B', ranking: 39 },
  // Group C
  { name: 'United States', code: 'USA', grp: 'C', ranking: 15 },
  { name: 'Netherlands', code: 'NED', grp: 'C', ranking: 7 },
  { name: 'Japan', code: 'JPN', grp: 'C', ranking: 18 },
  { name: 'Egypt', code: 'EGY', grp: 'C', ranking: 36 },
  // Group D
  { name: 'Argentina', code: 'ARG', grp: 'D', ranking: 1 },
  { name: 'Australia', code: 'AUS', grp: 'D', ranking: 24 },
  { name: 'Nigeria', code: 'NGA', grp: 'D', ranking: 28 },
  { name: 'Costa Rica', code: 'CRC', grp: 'D', ranking: 42 },
  // Group E
  { name: 'France', code: 'FRA', grp: 'E', ranking: 2 },
  { name: 'Denmark', code: 'DEN', grp: 'E', ranking: 21 },
  { name: 'Iran', code: 'IRN', grp: 'E', ranking: 20 },
  { name: 'Ecuador', code: 'ECU', grp: 'E', ranking: 26 },
  // Group F
  { name: 'Brazil', code: 'BRA', grp: 'F', ranking: 5 },
  { name: 'Switzerland', code: 'SUI', grp: 'F', ranking: 16 },
  { name: 'Cameroon', code: 'CMR', grp: 'F', ranking: 33 },
  { name: 'Qatar', code: 'QAT', grp: 'F', ranking: 37 },
  // Group G
  { name: 'England', code: 'ENG', grp: 'G', ranking: 4 },
  { name: 'Senegal', code: 'SEN', grp: 'G', ranking: 19 },
  { name: 'Poland', code: 'POL', grp: 'G', ranking: 32 },
  { name: 'Peru', code: 'PER', grp: 'G', ranking: 35 },
  // Group H
  { name: 'Spain', code: 'ESP', grp: 'H', ranking: 3 },
  { name: 'Serbia', code: 'SRB', grp: 'H', ranking: 29 },
  { name: 'Tunisia', code: 'TUN', grp: 'H', ranking: 34 },
  { name: 'New Zealand', code: 'NZL', grp: 'H', ranking: 46 },
  // Group I
  { name: 'Portugal', code: 'POR', grp: 'I', ranking: 6 },
  { name: 'Uruguay', code: 'URU', grp: 'I', ranking: 14 },
  { name: 'Ivory Coast', code: 'CIV', grp: 'I', ranking: 40 },
  { name: 'Panama', code: 'PAN', grp: 'I', ranking: 44 },
  // Group J
  { name: 'Germany', code: 'GER', grp: 'J', ranking: 10 },
  { name: 'Colombia', code: 'COL', grp: 'J', ranking: 13 },
  { name: 'Algeria', code: 'ALG', grp: 'J', ranking: 41 },
  { name: 'Jamaica', code: 'JAM', grp: 'J', ranking: 43 },
  // Group K
  { name: 'Italy', code: 'ITA', grp: 'K', ranking: 9 },
  { name: 'Sweden', code: 'SWE', grp: 'K', ranking: 25 },
  { name: 'Mali', code: 'MLI', grp: 'K', ranking: 45 },
  { name: 'Honduras', code: 'HON', grp: 'K', ranking: 47 },
  // Group L
  { name: 'Norway', code: 'NOR', grp: 'L', ranking: 27 },
  { name: 'Chile', code: 'CHI', grp: 'L', ranking: 30 },
  { name: 'South Africa', code: 'RSA', grp: 'L', ranking: 48 },
  { name: 'United Arab Emirates', code: 'UAE', grp: 'L', ranking: 49 },
];

/** The 5 players (still editable in the admin setup). */
export const DEFAULT_PLAYERS = ['Papacostas', 'Kerr', 'DeWet', 'Barmentloo', 'Terpcou'];

export const TEAMS_PER_PLAYER = 9; // 5 players x 9 = 45 drafted, 3 left undrafted
