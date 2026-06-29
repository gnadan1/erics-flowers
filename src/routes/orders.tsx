import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Order - Petal Inventory" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
          <p className="text-sm text-muted-foreground">0 active orders</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/sales">Legacy sales log</Link>
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                No orders yet.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}
