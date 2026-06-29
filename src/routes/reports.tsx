import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/inventory";
import {
  batchesQuery,
  inventoryMovementsQuery,
  ordersQuery,
  type InventoryBatch,
  type InventoryMovementReason,
  type OrderSource,
} from "@/lib/queries";
import { AlertTriangle, Boxes, ClipboardList, DollarSign, PackageCheck } from "lucide-react";

const SOURCE_LABELS: Record<OrderSource, string> = {
  dove: "DOVE",
  fsn: "FSN",
  phone: "Phone",
  in_person: "In-person",
  spec: "Spec",
};

const MOVEMENT_REASON_LABELS: Record<InventoryMovementReason, string> = {
  used_in_order: "Used in order",
  breakage: "Breakage",
  unusable_on_arrival: "Unusable on arrival",
  spec_arrangement: "Spec arrangement",
  spec_refresh: "Spec refresh",
  aged_out: "Aged out",
  manual_adjustment: "Manual adjustment",
};

const MOVEMENT_REASONS = Object.keys(MOVEMENT_REASON_LABELS) as InventoryMovementReason[];
const ORDER_SOURCES = Object.keys(SOURCE_LABELS) as OrderSource[];

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports - Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(batchesQuery);
    context.queryClient.ensureQueryData(ordersQuery);
    context.queryClient.ensureQueryData(inventoryMovementsQuery);
  },
  component: ReportsPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load reports.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

type SourceSummary = {
  source: OrderSource;
  orders: number;
  arrangements: number;
  ingredients: number;
  revenue: number;
  ingredientCost: number;
};

type MovementSummary = {
  reason: InventoryMovementReason;
  count: number;
  units: number;
  cost: number;
  retail: number;
};

type BatchSummary = {
  batch: InventoryBatch;
  orderUnits: number;
  movementUnits: number;
  remainingCost: number;
};

function numberValue(value: number | string | null | undefined) {
  const parsed = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUnits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function batchName(batch: InventoryBatch) {
  return (
    batch.variety_name ||
    batch.inventory_subcategories?.name ||
    batch.inventory_categories?.name ||
    batch.sku ||
    "Inventory batch"
  );
}

function ReportsPage() {
  const { data: batches } = useSuspenseQuery(batchesQuery);
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const { data: movements } = useSuspenseQuery(inventoryMovementsQuery);

  const purchasedUnits = batches.reduce((total, batch) => total + batch.qty_received, 0);
  const purchasedCost = batches.reduce((total, batch) => {
    return total + batch.qty_received * numberValue(batch.unit_cost);
  }, 0);
  const onHandUnits = batches.reduce((total, batch) => total + batch.qty_remaining, 0);
  const onHandCost = batches.reduce((total, batch) => {
    return total + batch.qty_remaining * numberValue(batch.unit_cost);
  }, 0);
  const onHandRetail = batches.reduce((total, batch) => {
    return total + batch.qty_remaining * numberValue(batch.retail_price);
  }, 0);

  const sourceSummaries = ORDER_SOURCES.map<SourceSummary>((source) => ({
    source,
    orders: 0,
    arrangements: 0,
    ingredients: 0,
    revenue: 0,
    ingredientCost: 0,
  }));
  const sourceByKey = new Map(sourceSummaries.map((summary) => [summary.source, summary]));
  const orderUnitsByBatch = new Map<string, number>();

  for (const order of orders) {
    const summary = sourceByKey.get(order.source);
    if (!summary) continue;
    summary.orders += 1;
    summary.arrangements += order.order_arrangements.length;

    for (const arrangement of order.order_arrangements) {
      summary.revenue += numberValue(arrangement.price);
      for (const ingredient of arrangement.order_ingredients) {
        summary.ingredients += 1;
        if (!ingredient.inventory_batch_id || !ingredient.inventory_batches) continue;
        const cost = ingredient.quantity * numberValue(ingredient.inventory_batches.unit_cost);
        summary.ingredientCost += cost;
        orderUnitsByBatch.set(
          ingredient.inventory_batch_id,
          (orderUnitsByBatch.get(ingredient.inventory_batch_id) ?? 0) + ingredient.quantity,
        );
      }
    }
  }

  const orderIngredientUnits = [...orderUnitsByBatch.values()].reduce(
    (total, qty) => total + qty,
    0,
  );
  const orderIngredientCost = sourceSummaries.reduce(
    (total, summary) => total + summary.ingredientCost,
    0,
  );
  const orderRevenue = sourceSummaries.reduce((total, summary) => total + summary.revenue, 0);

  const movementSummaries = MOVEMENT_REASONS.map<MovementSummary>((reason) => ({
    reason,
    count: 0,
    units: 0,
    cost: 0,
    retail: 0,
  }));
  const movementByReason = new Map(movementSummaries.map((summary) => [summary.reason, summary]));
  const movementUnitsByBatch = new Map<string, number>();

  for (const movement of movements) {
    const summary = movementByReason.get(movement.reason);
    if (!summary) continue;
    const unitCost = numberValue(movement.inventory_batches?.unit_cost);
    const retailPrice = numberValue(movement.inventory_batches?.retail_price);
    summary.count += 1;
    summary.units += movement.quantity;
    summary.cost += movement.quantity * unitCost;
    summary.retail += movement.quantity * retailPrice;
    movementUnitsByBatch.set(
      movement.inventory_batch_id,
      (movementUnitsByBatch.get(movement.inventory_batch_id) ?? 0) + movement.quantity,
    );
  }

  const movementUnits = movementSummaries.reduce((total, summary) => total + summary.units, 0);
  const movementCost = movementSummaries.reduce((total, summary) => total + summary.cost, 0);
  const agedOut = movementByReason.get("aged_out");
  const agedOutUnits = agedOut?.units ?? 0;
  const agedOutCost = agedOut?.cost ?? 0;

  const batchSummaries = batches
    .map<BatchSummary>((batch) => ({
      batch,
      orderUnits: orderUnitsByBatch.get(batch.id) ?? 0,
      movementUnits: movementUnitsByBatch.get(batch.id) ?? 0,
      remainingCost: batch.qty_remaining * numberValue(batch.unit_cost),
    }))
    .sort((a, b) => {
      return (
        b.remainingCost - a.remainingCost ||
        b.batch.received_date.localeCompare(a.batch.received_date)
      );
    });

  const stats = [
    {
      label: "Purchased",
      value: formatCurrency(purchasedCost),
      sub: `${formatUnits(purchasedUnits)} units received`,
      icon: Boxes,
    },
    {
      label: "Order ingredients",
      value: formatCurrency(orderIngredientCost),
      sub: `${formatUnits(orderIngredientUnits)} linked units`,
      icon: ClipboardList,
    },
    {
      label: "Use/loss",
      value: formatCurrency(movementCost),
      sub: `${formatUnits(movementUnits)} units adjusted`,
      icon: PackageCheck,
    },
    {
      label: "Aged out",
      value: formatCurrency(agedOutCost),
      sub: `${formatUnits(agedOutUnits)} units`,
      icon: AlertTriangle,
    },
    {
      label: "On hand",
      value: formatCurrency(onHandCost),
      sub: `${formatUnits(onHandUnits)} units · ${formatCurrency(onHandRetail)} retail`,
      icon: DollarSign,
    },
  ];

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} orders · {movements.length} inventory movements
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Use/loss by reason</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementSummaries.map((summary) => (
                  <TableRow key={summary.reason}>
                    <TableCell className="font-medium">
                      {MOVEMENT_REASON_LABELS[summary.reason]}
                    </TableCell>
                    <TableCell className="text-right">{summary.count}</TableCell>
                    <TableCell className="text-right">{formatUnits(summary.units)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summary.cost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(summary.retail)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order source summary</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Arrangements</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceSummaries.map((summary) => {
                  const profit = summary.revenue - summary.ingredientCost;
                  const margin = summary.revenue > 0 ? profit / summary.revenue : 0;
                  return (
                    <TableRow key={summary.source}>
                      <TableCell className="font-medium">{SOURCE_LABELS[summary.source]}</TableCell>
                      <TableCell className="text-right">{summary.orders}</TableCell>
                      <TableCell className="text-right">{summary.arrangements}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(summary.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(summary.ingredientCost)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(profit)}</TableCell>
                      <TableCell className="text-right">{formatPercent(margin)}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right">
                    {sourceSummaries.reduce((total, summary) => total + summary.orders, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {sourceSummaries.reduce((total, summary) => total + summary.arrangements, 0)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(orderRevenue)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(orderIngredientCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(orderRevenue - orderIngredientCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(
                      orderRevenue > 0 ? (orderRevenue - orderIngredientCost) / orderRevenue : 0,
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Batch utilization</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Received</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Movements</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Remaining cost</TableHead>
                <TableHead className="text-right">Used %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchSummaries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No inventory batches yet.
                  </TableCell>
                </TableRow>
              ) : (
                batchSummaries.slice(0, 25).map((summary) => {
                  const usedRatio =
                    summary.batch.qty_received > 0
                      ? (summary.batch.qty_received - summary.batch.qty_remaining) /
                        summary.batch.qty_received
                      : 0;
                  return (
                    <TableRow key={summary.batch.id}>
                      <TableCell>
                        <div className="font-medium">{batchName(summary.batch)}</div>
                        <div className="text-xs text-muted-foreground">
                          {summary.batch.sku ?? "No SKU"} · {summary.batch.unit_type ?? "units"}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {summary.batch.received_date}
                      </TableCell>
                      <TableCell className="text-right">{summary.batch.qty_received}</TableCell>
                      <TableCell className="text-right">
                        {formatUnits(summary.orderUnits)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatUnits(summary.movementUnits)}
                      </TableCell>
                      <TableCell className="text-right">{summary.batch.qty_remaining}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(summary.remainingCost)}
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(usedRatio)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
