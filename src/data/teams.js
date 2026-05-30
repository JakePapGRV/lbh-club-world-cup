// The 48 nations qualified for the 2026 FIFA World Cup, each with its FIFA world
// ranking (FIFA/ESPN, April 2026 — the last update before the tournament). The
// draft lists teams best-ranked first.
//
// `grp` here is a PLACEHOLDER even spread across groups A–L (it only affects the
// placeholder group fixtures used for the test run). The real groups, fixtures
// and any ranking refresh come from the SportMonks import before the tournament.
//
// Listed in ranking order; group letters are assigned by an even snake spread.
const QUALIFIED = [
  { name: 'France', code: 'FRA', ranking: 1 },
  { name: 'Spain', code: 'ESP', ranking: 2 },
  { name: 'Argentina', code: 'ARG', ranking: 3 },
  { name: 'England', code: 'ENG', ranking: 4 },
  { name: 'Portugal', code: 'POR', ranking: 5 },
  { name: 'Brazil', code: 'BRA', ranking: 6 },
  { name: 'Netherlands', code: 'NED', ranking: 7 },
  { name: 'Morocco', code: 'MAR', ranking: 8 },
  { name: 'Belgium', code: 'BEL', ranking: 9 },
  { name: 'Germany', code: 'GER', ranking: 10 },
  { name: 'Croatia', code: 'CRO', ranking: 11 },
  { name: 'Colombia', code: 'COL', ranking: 13 },
  { name: 'Senegal', code: 'SEN', ranking: 14 },
  { name: 'Mexico', code: 'MEX', ranking: 15 },
  { name: 'United States', code: 'USA', ranking: 16 },
  { name: 'Uruguay', code: 'URU', ranking: 17 },
  { name: 'Japan', code: 'JPN', ranking: 18 },
  { name: 'Switzerland', code: 'SUI', ranking: 19 },
  { name: 'Iran', code: 'IRN', ranking: 21 },
  { name: 'Turkey', code: 'TUR', ranking: 22 },
  { name: 'Ecuador', code: 'ECU', ranking: 23 },
  { name: 'Austria', code: 'AUT', ranking: 24 },
  { name: 'South Korea', code: 'KOR', ranking: 25 },
  { name: 'Australia', code: 'AUS', ranking: 27 },
  { name: 'Algeria', code: 'ALG', ranking: 28 },
  { name: 'Egypt', code: 'EGY', ranking: 29 },
  { name: 'Canada', code: 'CAN', ranking: 30 },
  { name: 'Norway', code: 'NOR', ranking: 31 },
  { name: 'Panama', code: 'PAN', ranking: 33 },
  { name: 'Ivory Coast', code: 'CIV', ranking: 34 },
  { name: 'Sweden', code: 'SWE', ranking: 38 },
  { name: 'Paraguay', code: 'PAR', ranking: 40 },
  { name: 'Czech Republic', code: 'CZE', ranking: 41 },
  { name: 'Scotland', code: 'SCO', ranking: 43 },
  { name: 'Tunisia', code: 'TUN', ranking: 44 },
  { name: 'DR Congo', code: 'COD', ranking: 46 },
  { name: 'Uzbekistan', code: 'UZB', ranking: 50 },
  { name: 'Qatar', code: 'QAT', ranking: 55 },
  { name: 'Iraq', code: 'IRQ', ranking: 57 },
  { name: 'South Africa', code: 'RSA', ranking: 60 },
  { name: 'Saudi Arabia', code: 'KSA', ranking: 61 },
  { name: 'Jordan', code: 'JOR', ranking: 63 },
  { name: 'Bosnia and Herzegovina', code: 'BIH', ranking: 65 },
  { name: 'Cape Verde', code: 'CPV', ranking: 69 },
  { name: 'Ghana', code: 'GHA', ranking: 74 },
  { name: 'Curaçao', code: 'CUW', ranking: 82 },
  { name: 'Haiti', code: 'HAI', ranking: 83 },
  { name: 'New Zealand', code: 'NZL', ranking: 85 },
];

// Placeholder group spread (one team per group, cycling) so each of the 12
// groups gets 4 teams. Real groups come from the API import.
export const TEAMS = QUALIFIED.map((t, i) => ({ ...t, grp: String.fromCharCode(65 + (i % 12)) }));

/** The 5 players (still editable in the admin setup). */
export const DEFAULT_PLAYERS = ['Papacostas', 'Kerr', 'DeWet', 'Barmentloo', 'Terpcou'];

export const TEAMS_PER_PLAYER = 9; // 5 players x 9 = 45 drafted, 3 left undrafted
