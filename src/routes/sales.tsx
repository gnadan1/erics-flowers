import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { salesQuery } from "@/lib/queries";
import { formatCurrency } from "@/lib/inventory";
import { format } from "date-fns";

export const Route = createFileRoute("/sales")({
  head: () => ({ meta: [{ title: "Sales — Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(salesQuery);
  },
  component: SalesPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load sales.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

function SalesPage() {
  const { data: sales } = useSuspenseQuery(salesQuery);
  const total = sales.reduce((s, x) => s + Number(x.sale_price) * x.qty_sold, 0);
  const stems = sales.reduce((s, x) => s + x.qty_sold, 0);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">
            {sales.length} sales · {stems} stems · {formatCurrency(total)} revenue
          </p>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Flower</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Price/stem</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No sales yet.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(new Date(s.sold_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{s.inventory_batches?.variety_name ?? "—"}</span>
                    {s.inventory_batches?.color && (
                      <span className="text-muted-foreground"> · {s.inventory_batches.color}</span>
                    )}
                  </TableCell>
                  <TableCell>{s.qty_sold}</TableCell>
                  <TableCell>{formatCurrency(s.sale_price)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(Number(s.sale_price) * s.qty_sold)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
