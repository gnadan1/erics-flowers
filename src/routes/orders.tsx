import { createFileRoute, Link } from "@tanstack/react-router";
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
import { formatCurrency } from "@/lib/inventory";
import { ordersQuery, type Order } from "@/lib/queries";

const SOURCE_LABELS: Record<Order["source"], string> = {
  dove: "DOVE",
  fsn: "FSN",
  phone: "Phone",
  in_person: "In-person",
  spec: "Spec",
};

const FULFILLMENT_LABELS: Record<Order["fulfillment_method"], string> = {
  pickup: "Pickup",
  shop: "Shop",
  delivery: "Delivery",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In progress",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Order - Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(ordersQuery);
  },
  component: OrdersPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load orders.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

function orderTotal(order: Order) {
  return order.order_arrangements.reduce((total, arrangement) => {
    return total + Number(arrangement.price);
  }, 0);
}

function ingredientCount(order: Order) {
  return order.order_arrangements.reduce((total, arrangement) => {
    return total + arrangement.order_ingredients.length;
  }, 0);
}

function OrdersPage() {
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const activeOrders = orders.filter(
    (order) => order.status !== "fulfilled" && order.status !== "cancelled",
  );

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order</h1>
          <p className="text-sm text-muted-foreground">
            {activeOrders.length} active orders · {orders.length} total
          </p>
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
              <TableHead>Ref #</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Satisfaction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-medium">{order.order_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {order.order_arrangements.length} arrangements · {ingredientCount(order)}{" "}
                      ingredients
                    </div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {SOURCE_LABELS[order.source]}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {order.referring_order_number ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.recipient_name ?? "—"}</div>
                    {order.notes && (
                      <div className="max-w-56 truncate text-xs text-muted-foreground">
                        {order.notes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm whitespace-nowrap">
                      {FULFILLMENT_LABELS[order.fulfillment_method]}
                    </div>
                    {order.address && (
                      <div className="max-w-64 truncate text-xs text-muted-foreground">
                        {order.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{order.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {order.satisfaction === null ? "—" : `${order.satisfaction}/5`}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {STATUS_LABELS[order.status]}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatCurrency(orderTotal(order))}
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
