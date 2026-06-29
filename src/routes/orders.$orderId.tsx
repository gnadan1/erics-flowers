import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { OrderHeaderForm } from "@/components/OrderHeaderForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  batchesQuery,
  orderQuery,
  type IngredientType,
  type InventoryBatch,
  type Order,
  type OrderArrangement,
  type OrderIngredient,
} from "@/lib/queries";
import { orderPayloadFromForm, orderToFormValues, type OrderFormValues } from "@/lib/orderForm";
import { formatCurrency } from "@/lib/inventory";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const NONE = "none";

const INGREDIENT_TYPE_OPTIONS: ReadonlyArray<{ value: IngredientType; label: string }> = [
  { value: "flower", label: "Flower" },
  { value: "green", label: "Green" },
  { value: "non_floral", label: "Non-floral" },
  { value: "other", label: "Other" },
];

export const Route = createFileRoute("/orders/$orderId")({
  head: () => ({ meta: [{ title: "Order Detail - Petal Inventory" }] }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(orderQuery(params.orderId));
    context.queryClient.ensureQueryData(batchesQuery);
  },
  component: OrderDetailPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load order.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

function optionalText(value: string) {
  return value.trim() || null;
}

function invalidateOrder(qc: ReturnType<typeof useQueryClient>, orderId: string) {
  qc.invalidateQueries({ queryKey: ["orders"] });
  qc.invalidateQueries({ queryKey: ["orders", orderId] });
}

function orderTotal(order: Order) {
  return order.order_arrangements.reduce(
    (total, arrangement) => total + Number(arrangement.price),
    0,
  );
}

function nextArrangementNumber(order: Order) {
  return (
    order.order_arrangements.reduce((max, arrangement) => {
      return Math.max(max, arrangement.arrangement_number);
    }, 0) + 1
  );
}

function sortedArrangements(order: Order) {
  return [...order.order_arrangements].sort((a, b) => {
    return a.arrangement_number - b.arrangement_number || a.created_at.localeCompare(b.created_at);
  });
}

function sortedIngredients(arrangement: OrderArrangement) {
  return [...arrangement.order_ingredients].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
}

function batchLabel(batch: InventoryBatch) {
  return (
    batch.variety_name ||
    batch.inventory_subcategories?.name ||
    batch.inventory_categories?.name ||
    batch.sku ||
    "Inventory batch"
  );
}

function batchDetail(batch: InventoryBatch) {
  const parts = [
    batch.sku,
    batch.color_family || batch.primary_color,
    `${batch.qty_remaining} ${batch.unit_type ?? "units"}`,
    batch.received_date,
  ].filter(Boolean);

  return parts.join(" · ");
}

function ingredientLabel(ingredient: OrderIngredient) {
  return ingredient.inventory_batches?.variety_name || ingredient.manual_name || "Ingredient";
}

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const qc = useQueryClient();
  const { data: order } = useSuspenseQuery(orderQuery(orderId));
  const { data: batches } = useSuspenseQuery(batchesQuery);
  const [headerValues, setHeaderValues] = useState<OrderFormValues>(() => orderToFormValues(order));

  useEffect(() => {
    setHeaderValues(orderToFormValues(order));
  }, [order]);

  const activeBatches = useMemo(() => {
    return batches.filter((batch) => batch.status === "active" && batch.qty_remaining > 0);
  }, [batches]);

  const headerMutation = useMutation({
    mutationFn: async () => {
      const payload = orderPayloadFromForm(headerValues);
      const { error } = await supabase.from("orders").update(payload).eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateOrder(qc, order.id);
      toast.success("Order updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteArrangementMutation = useMutation({
    mutationFn: async (arrangementId: string) => {
      const { error } = await supabase.from("order_arrangements").delete().eq("id", arrangementId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateOrder(qc, order.id);
      toast.success("Arrangement removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: async (ingredientId: string) => {
      const { error } = await supabase.from("order_ingredients").delete().eq("id", ingredientId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateOrder(qc, order.id);
      toast.success("Ingredient removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0">
            <Link to="/orders">
              <ArrowLeft className="h-4 w-4" /> Orders
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Order {order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {order.order_arrangements.length} arrangements · {formatCurrency(orderTotal(order))}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order header</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderHeaderForm
              values={headerValues}
              onChange={setHeaderValues}
              onSubmit={() => headerMutation.mutate()}
              submitLabel="Save order"
              isPending={headerMutation.isPending}
            />
          </CardContent>
        </Card>

        <ArrangementCreateForm order={order} />

        {sortedArrangements(order).map((arrangement) => (
          <Card key={arrangement.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    Arrangement {arrangement.arrangement_number}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {arrangement.description || "No description"} ·{" "}
                    {formatCurrency(arrangement.price)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteArrangementMutation.mutate(arrangement.id)}
                  disabled={deleteArrangementMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {arrangement.notes && (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {arrangement.notes}
                </p>
              )}
              <IngredientList
                arrangement={arrangement}
                onDelete={(ingredientId) => deleteIngredientMutation.mutate(ingredientId)}
                isDeleting={deleteIngredientMutation.isPending}
              />
              <IngredientCreateForm
                orderId={order.id}
                arrangement={arrangement}
                batches={activeBatches}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function ArrangementCreateForm({ order }: { order: Order }) {
  const qc = useQueryClient();
  const [arrangementNumber, setArrangementNumber] = useState(String(nextArrangementNumber(order)));
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setArrangementNumber(String(nextArrangementNumber(order)));
  }, [order]);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedNumber = parseInt(arrangementNumber, 10);
      const parsedPrice = price.trim() ? parseFloat(price) : 0;
      if (!Number.isFinite(parsedNumber) || parsedNumber <= 0) {
        throw new Error("Arrangement number must be greater than 0");
      }
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new Error("Arrangement price must be at least 0");
      }

      const { error } = await supabase.from("order_arrangements").insert({
        order_id: order.id,
        arrangement_number: parsedNumber,
        description: optionalText(description),
        price: parsedPrice,
        notes: optionalText(notes),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDescription("");
      setPrice("");
      setNotes("");
      invalidateOrder(qc, order.id);
      toast.success("Arrangement added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add arrangement</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="arrangement_number">Arrangement #</Label>
              <Input
                id="arrangement_number"
                type="number"
                min={1}
                value={arrangementNumber}
                onChange={(event) => setArrangementNumber(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="arrangement_description">Description</Label>
              <Input
                id="arrangement_description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="arrangement_price">Price</Label>
              <Input
                id="arrangement_price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="arrangement_notes">Notes</Label>
              <Input
                id="arrangement_notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              <Plus className="h-4 w-4" /> {mutation.isPending ? "Adding..." : "Add arrangement"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function IngredientList({
  arrangement,
  onDelete,
  isDeleting,
}: {
  arrangement: OrderArrangement;
  onDelete: (ingredientId: string) => void;
  isDeleting: boolean;
}) {
  const ingredients = sortedIngredients(arrangement);

  if (ingredients.length === 0) {
    return <p className="text-sm text-muted-foreground">No ingredients yet.</p>;
  }

  return (
    <div className="divide-y divide-border rounded-md border">
      {ingredients.map((ingredient) => (
        <div key={ingredient.id} className="flex items-center justify-between gap-3 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{ingredientLabel(ingredient)}</p>
            <p className="text-xs text-muted-foreground">
              {ingredient.quantity} {ingredient.unit_type ?? "units"} ·{" "}
              {ingredient.ingredient_type.replace("_", " ")}
              {ingredient.inventory_batches?.sku ? ` · ${ingredient.inventory_batches.sku}` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(ingredient.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function IngredientCreateForm({
  orderId,
  arrangement,
  batches,
}: {
  orderId: string;
  arrangement: OrderArrangement;
  batches: InventoryBatch[];
}) {
  const qc = useQueryClient();
  const [ingredientType, setIngredientType] = useState<IngredientType>("flower");
  const [inventoryBatchId, setInventoryBatchId] = useState(NONE);
  const [manualName, setManualName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitType, setUnitType] = useState("");
  const [notes, setNotes] = useState("");

  const selectedBatch = batches.find((batch) => batch.id === inventoryBatchId) ?? null;
  const requiresInventoryBatch = ingredientType === "flower" || ingredientType === "green";

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedQuantity = parseInt(quantity, 10);
      if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
        throw new Error("Ingredient quantity must be greater than 0");
      }
      if (requiresInventoryBatch && !selectedBatch) {
        throw new Error("Flower and green ingredients must link to an inventory batch");
      }
      if (!requiresInventoryBatch && !manualName.trim()) {
        throw new Error("Manual ingredient name is required");
      }

      const { error } = await supabase.from("order_ingredients").insert({
        order_arrangement_id: arrangement.id,
        inventory_batch_id: selectedBatch?.id ?? null,
        ingredient_type: ingredientType,
        manual_name: selectedBatch ? null : manualName.trim(),
        quantity: parsedQuantity,
        unit_type: selectedBatch?.unit_type ?? optionalText(unitType),
        notes: optionalText(notes),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setInventoryBatchId(NONE);
      setManualName("");
      setQuantity("1");
      setUnitType("");
      setNotes("");
      invalidateOrder(qc, orderId);
      toast.success("Ingredient added");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <form
      className="grid gap-3 rounded-md border border-dashed p-3"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <Label>Type</Label>
          <Select
            value={ingredientType}
            onValueChange={(value) => {
              const nextType = value as IngredientType;
              setIngredientType(nextType);
              if (nextType === "non_floral" || nextType === "other") {
                setInventoryBatchId(NONE);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INGREDIENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {requiresInventoryBatch ? (
          <div className="md:col-span-2">
            <Label>Inventory batch *</Label>
            <Select value={inventoryBatchId} onValueChange={setInventoryBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose inventory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Choose inventory</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batchLabel(batch)} · {batchDetail(batch)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="md:col-span-2">
            <Label htmlFor={`manual_name_${arrangement.id}`}>Ingredient name *</Label>
            <Input
              id={`manual_name_${arrangement.id}`}
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
            />
          </div>
        )}
        <div>
          <Label htmlFor={`ingredient_qty_${arrangement.id}`}>Qty *</Label>
          <Input
            id={`ingredient_qty_${arrangement.id}`}
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>
      </div>
      {!requiresInventoryBatch && (
        <div>
          <Label htmlFor={`ingredient_unit_${arrangement.id}`}>Unit type</Label>
          <Input
            id={`ingredient_unit_${arrangement.id}`}
            value={unitType}
            onChange={(event) => setUnitType(event.target.value)}
          />
        </div>
      )}
      <div>
        <Label htmlFor={`ingredient_notes_${arrangement.id}`}>Notes</Label>
        <Input
          id={`ingredient_notes_${arrangement.id}`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={mutation.isPending}>
          <Plus className="h-4 w-4" /> {mutation.isPending ? "Adding..." : "Add ingredient"}
        </Button>
      </div>
    </form>
  );
}
