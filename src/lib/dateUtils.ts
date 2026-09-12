export function getCurrentPeriodStart(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  // 0 is Sunday, 1 is Monday. We start the week on Monday.
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d;
}

export function getAppWeekNumber(snapshotDay: string | Date): number {
  const epoch = new Date('2026-09-07T00:00:00.000Z').getTime();
  const current = new Date(snapshotDay).getTime();
  const diff = current - epoch;
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}
