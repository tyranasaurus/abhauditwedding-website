/* The schedule's date lines carry the weekday and the month in full, which is
 * right on a laptop and is most of a phone's line width before the forecast
 * has even been added. These are the abbreviations for the narrow panel — the
 * schedule only. The hero's own date and the map's kicker are set elsewhere
 * and are left long at every width.
 *
 * March, April, May, June and July are not abbreviated, by convention. */
const ABBREVIATIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bSunday\b/g, 'Sun'],
  [/\bMonday\b/g, 'Mon'],
  [/\bTuesday\b/g, 'Tue'],
  [/\bWednesday\b/g, 'Wed'],
  [/\bThursday\b/g, 'Thu'],
  [/\bFriday\b/g, 'Fri'],
  [/\bSaturday\b/g, 'Sat'],
  [/\bJanuary\b/g, 'Jan.'],
  [/\bFebruary\b/g, 'Feb.'],
  [/\bAugust\b/g, 'Aug.'],
  [/\bSeptember\b/g, 'Sept.'],
  [/\bOctober\b/g, 'Oct.'],
  [/\bNovember\b/g, 'Nov.'],
  [/\bDecember\b/g, 'Dec.'],
]

export function abbreviateDate(date: string) {
  return ABBREVIATIONS.reduce(
    (short, [full, brief]) => short.replace(full, brief),
    date,
  )
}
