/**
 * Get current week start (Monday) in UTC as YYYY-MM-DD
 */
export function currentWeekStartUTC(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0..6 (Sun=0)
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diffToMonday)
  );
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Get week start date from any date
 */
export function getWeekStart(date: Date = new Date()): Date {
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diffToMonday)
  );
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Format date as DD/MM/YY
 */
export function formatDateDDMMYY(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}
