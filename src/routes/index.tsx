import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { batchesQuery, salesQuery } from "@/lib/queries";
import { computeFreshness, formatCurrency } from "@/lib/inventory";
import { AlertTriangle, DollarSign, Package, Receipt } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Petal Inventory" },
      {
        name: "description",
        content: "Track flower shop inventory, freshness, and sales at a glance.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(batchesQuery);
    context.queryClient.ensureQueryData(salesQuery);
  },
  component: Dashboard,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load the dashboard.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

function Dashboard() {
  const { data: batches } = useSuspenseQuery(batchesQuery);
  const { data: sales } = useSuspenseQuery(salesQuery);

  const active = batches.filter((b) => b.status === "active" && b.qty_remaining > 0);
  const stockValue = active.reduce((s, b) => s + Number(b.retail_price) * b.qty_remaining, 0);
  const stockUnits = active.reduce((s, b) => s + b.qty_remaining, 0);

  const withFreshness = active.map((b) => ({
    b,
    f: computeFreshness(b.received_date, b.vase_life_days),
  }));
  const needsAttention = withFreshness
    .filter((x) => x.f.status === "critical" || x.f.status === "expired")
    .sort((a, b) => a.f.daysRemaining - b.f.daysRemaining);

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSales = sales.filter((s) => new Date(s.sold_at).getTime() >= oneWeekAgo);
  const revenue7d = recentSales.reduce((s, x) => s + Number(x.sale_price) * x.qty_sold, 0);

  const stats = [
    {
      label: "Stock value",
      value: formatCurrency(stockValue),
      icon: DollarSign,
      sub: `${stockUnits} units`,
    },
    {
      label: "Active batches",
      value: active.length.toString(),
      icon: Package,
      sub: `${batches.length} total`,
    },
    {
      label: "Needs attention",
      value: needsAttention.length.toString(),
      icon: AlertTriangle,
      sub: "critical or expired",
    },
    {
      label: "Revenue (7d)",
      value: formatCurrency(revenue7d),
      icon: Receipt,
      sub: `${recentSales.length} sales`,
    },
  ];

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Today's snapshot of your shop.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/receive">Receive new</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/inventory">View inventory</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Needs attention</CardTitle>
        </CardHeader>
        <CardContent>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everything looks fresh. 🌿</p>
          ) : (
            <ul className="divide-y divide-border">
              {needsAttention.slice(0, 10).map(({ b, f }) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {b.variety_name}
                      {b.primary_color || b.color_family
                        ? ` · ${b.primary_color || b.color_family}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.qty_remaining} {b.unit_type.toLowerCase()} ·{" "}
                      {b.locations?.name ?? "no location"}
                    </p>
                  </div>
                  <FreshnessBadge receivedDate={b.received_date} vaseLifeDays={b.vase_life_days} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
