/** Passed to `restGetUpcomingMatches` as `timeHours` (see `ltSecondsFromTimeHours` in restSports). */
export const SOON_FILTER_OPTIONS = [
  { key: '3', label: 'Next 3h' },
  { key: '6', label: 'Next 6h' },
  { key: '12', label: 'Next 12h' },
  { key: '24', label: 'Next 24h' },
] as const;

export type SoonFilterKey = (typeof SOON_FILTER_OPTIONS)[number]['key'];

export function isSoonFilterKey(v: string | null | undefined): v is SoonFilterKey {
  return v != null && SOON_FILTER_OPTIONS.some((o) => o.key === v);
}

/** Subheader text, e.g. "next 6h" */
export const SOON_HEADER_LABEL: Record<SoonFilterKey, string> = {
  '3': 'next 3h',
  '6': 'next 6h',
  '12': 'next 12h',
  '24': 'next 24h',
};
