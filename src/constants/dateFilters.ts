/** Values passed to `restGetUpcomingMatches` / `restGetMatchesForSport` as `timeHours` (see `ltSecondsFromTimeHours` in restSports). */
export const DATE_FILTER_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'Week' },
  { key: 'all', label: 'All' },
] as const;

export type DateFilterKey = (typeof DATE_FILTER_OPTIONS)[number]['key'];

export function isDateFilterKey(v: string | null | undefined): v is DateFilterKey {
  return v != null && DATE_FILTER_OPTIONS.some((o) => o.key === v);
}
