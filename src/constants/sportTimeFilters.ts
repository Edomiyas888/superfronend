/** Sport page kickoff windows; each key is passed to `restGetMatchesForSport` as `timeHours`. */
export const SPORT_TIME_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '1', label: '1 hour' },
  { key: '3', label: '3 hours' },
  { key: '6', label: '6 hours' },
  { key: '12', label: '12 hours' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'Week' },
] as const;

export type SportTimeFilterKey = (typeof SPORT_TIME_FILTERS)[number]['key'];

export const DEFAULT_SPORT_TIME_FILTER: SportTimeFilterKey = 'all';

export function isSportTimeFilterKey(v: string | null | undefined): v is SportTimeFilterKey {
  return v != null && SPORT_TIME_FILTERS.some((o) => o.key === v);
}
