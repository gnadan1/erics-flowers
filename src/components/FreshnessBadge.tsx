import { computeFreshness, freshnessClasses, freshnessLabel } from "@/lib/inventory";
import { cn } from "@/lib/utils";

export function FreshnessBadge({
  receivedDate,
  vaseLifeDays,
}: {
  receivedDate: string;
  vaseLifeDays: number;
}) {
  const f = computeFreshness(receivedDate, vaseLifeDays);
  const remaining =
    f.status === "expired"
      ? `${Math.abs(f.daysRemaining)}d over`
      : `${f.daysRemaining}d left`;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        freshnessClasses[f.status],
      )}
    >
      {freshnessLabel[f.status]} · {remaining}
    </span>
  );
}
