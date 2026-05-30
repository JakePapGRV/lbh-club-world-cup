// Approximate FIFA world rankings used to order the draft. The football data
// API does not expose rankings, so when we import official teams we enrich them
// from this table (matched by 3-letter code, then by name). Values are editable
// and only affect the draft's "best available first" ordering.
//
// [name, code, ranking]
const TABLE = [
  ['Argentina', 'ARG', 1],
  ['France', 'FRA', 2],
  ['Spain', 'ESP', 3],
  ['England', 'ENG', 4],
  ['Brazil', 'BRA', 5],
  ['Portugal', 'POR', 6],
  ['Netherlands', 'NED', 7],
  ['Belgium', 'BEL', 8],
  ['Italy', 'ITA', 9],
  ['Germany', 'GER', 10],
  ['Croatia', 'CRO', 11],
  ['Morocco', 'MAR', 12],
  ['Colombia', 'COL', 13],
  ['Uruguay', 'URU', 14],
  ['United States', 'USA', 15],
  ['Switzerland', 'SUI', 16],
  ['Mexico', 'MEX', 17],
  ['Japan', 'JPN', 18],
  ['Senegal', 'SEN', 19],
  ['Iran', 'IRN', 20],
  ['Denmark', 'DEN', 21],
  ['Korea Republic', 'KOR', 22],
  ['South Korea', 'KOR', 22],
  ['Austria', 'AUT', 23],
  ['Australia', 'AUS', 24],
  ['Sweden', 'SWE', 25],
  ['Ecuador', 'ECU', 26],
  ['Norway', 'NOR', 27],
  ['Nigeria', 'NGA', 28],
  ['Serbia', 'SRB', 29],
  ['Chile', 'CHI', 30],
  ['Canada', 'CAN', 31],
  ['Poland', 'POL', 32],
  ['Cameroon', 'CMR', 33],
  ['Tunisia', 'TUN', 34],
  ['Peru', 'PER', 35],
  ['Egypt', 'EGY', 36],
  ['Qatar', 'QAT', 37],
  ['Ghana', 'GHA', 38],
  ['Saudi Arabia', 'KSA', 39],
  ['Ivory Coast', 'CIV', 40],
  ["Côte d'Ivoire", 'CIV', 40],
  ['Algeria', 'ALG', 41],
  ['Costa Rica', 'CRC', 42],
  ['Jamaica', 'JAM', 43],
  ['Panama', 'PAN', 44],
  ['Mali', 'MLI', 45],
  ['New Zealand', 'NZL', 46],
  ['Honduras', 'HON', 47],
  ['South Africa', 'RSA', 48],
  ['United Arab Emirates', 'UAE', 49],
  ['Turkey', 'TUR', 26],
  ['Türkiye', 'TUR', 26],
  ['Wales', 'WAL', 30],
  ['Scotland', 'SCO', 33],
  ['Hungary', 'HUN', 39],
  ['Czech Republic', 'CZE', 36],
  ['Greece', 'GRE', 41],
  ['Paraguay', 'PAR', 45],
  ['Venezuela', 'VEN', 48],
];

export const FIFA_RANKINGS = Object.fromEntries(TABLE.map(([, code, rank]) => [code, rank]));
const BY_NAME = Object.fromEntries(TABLE.map(([name, , rank]) => [name.toLowerCase(), rank]));

/** Best-effort ranking lookup by code then name; null if unknown (sorts last). */
export function rankFor(name, code) {
  if (code && FIFA_RANKINGS[code.toUpperCase()] != null) return FIFA_RANKINGS[code.toUpperCase()];
  if (name && BY_NAME[name.toLowerCase()] != null) return BY_NAME[name.toLowerCase()];
  return null;
}
