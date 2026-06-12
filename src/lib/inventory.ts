import { differenceInCalendarDays } from "date-fns";

export type FreshnessStatus = "fresh" | "aging" | "critical" | "expired";

export function computeFreshness(
  receivedDate: string,
  vaseLifeDays: number,
  today: Date = new Date(),
): { status: FreshnessStatus; daysElapsed: number; daysRemaining: number; pct: number } {
  const received = new Date(receivedDate + "T00:00:00");
  const daysElapsed = Math.max(0, differenceInCalendarDays(today, received));
  const daysRemaining = vaseLifeDays - daysElapsed;
  const pct = vaseLifeDays > 0 ? daysElapsed / vaseLifeDays : 1;
  let status: FreshnessStatus;
  if (pct >= 1) status = "expired";
  else if (pct >= 0.9) status = "critical";
  else if (pct >= 0.5) status = "aging";
  else status = "fresh";
  return { status, daysElapsed, daysRemaining, pct };
}

export const freshnessLabel: Record<FreshnessStatus, string> = {
  fresh: "Fresh",
  aging: "Aging",
  critical: "Critical",
  expired: "Expired",
};

export const freshnessClasses: Record<FreshnessStatus, string> = {
  fresh: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
  aging: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  critical: "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-900",
  expired: "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900",
};

export function formatCurrency(n: number | string | null | undefined): string {
  const num = typeof n === "string" ? Number(n) : (n ?? 0);
  return `$${num.toFixed(2)}`;
}
