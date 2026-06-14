import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { flowerTypesQuery, suppliersQuery, locationsQuery, FLOWER_CATEGORIES, type FlowerCategory } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/receive")({
  head: () => ({ meta: [{ title: "Receive Stock — Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(flowerTypesQuery);
    context.queryClient.ensureQueryData(suppliersQuery);
    context.queryClient.ensureQueryData(locationsQuery);
  },
  component: ReceivePage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load form data.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">Try again</Button>
      </div>
    </AppShell>
  ),
});

function ReceivePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: flowerTypes } = useSuspenseQuery(flowerTypesQuery);
  const { data: suppliers } = useSuspenseQuery(suppliersQuery);
  const { data: locations } = useSuspenseQuery(locationsQuery);

  const [category, setCategory] = useState<FlowerCategory | "">("");
  const [flowerTypeId, setFlowerTypeId] = useState("");
  const filteredTypes = category ? flowerTypes.filter((t) => t.category === category) : [];
  const [color, setColor] = useState("");
  const [supplierId, setSupplierId] = useState<string>("none");
  const [locationId, setLocationId] = useState<string>("none");
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [vaseLifeDays, setVaseLifeDays] = useState("");
  const [notes, setNotes] = useState("");

  // Default vase life from chosen flower type
  useEffect(() => {
    if (!flowerTypeId) return;
    const ft = flowerTypes.find((t) => t.id === flowerTypeId);
    if (ft) setVaseLifeDays(String(ft.default_vase_life_days));
  }, [flowerTypeId, flowerTypes]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!flowerTypeId) throw new Error("Pick a flower type");
      const q = parseInt(qty, 10);
      const v = parseInt(vaseLifeDays, 10);
      if (!Number.isFinite(q) || q <= 0) throw new Error("Quantity must be positive");
      if (!Number.isFinite(v) || v <= 0) throw new Error("Vase life must be positive");
      const { error } = await supabase.from("inventory_batches").insert({
        flower_type_id: flowerTypeId,
        color: color.trim(),
        supplier_id: supplierId === "none" ? null : supplierId,
        location_id: locationId === "none" ? null : locationId,
        qty_received: q,
        qty_remaining: q,
        unit_cost: parseFloat(unitCost) || 0,
        retail_price: parseFloat(retailPrice) || 0,
        received_date: receivedDate,
        vase_life_days: v,
        notes: notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_batches"] });
      toast.success("Batch added");
      navigate({ to: "/inventory" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Receive stock</h1>
        <p className="text-sm text-muted-foreground">Log a new batch of flowers arriving at the shop.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">New batch</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="sm:col-span-1">
              <Label>Flower type *</Label>
              <Select value={flowerTypeId} onValueChange={setFlowerTypeId}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {flowerTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} <span className="text-muted-foreground">({t.default_vase_life_days}d)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="e.g. Red" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
            <div>
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qty">Quantity (stems) *</Label>
              <Input id="qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="vase">Vase life (days) *</Label>
              <Input id="vase" type="number" min={1} value={vaseLifeDays} onChange={(e) => setVaseLifeDays(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="cost">Unit cost</Label>
              <Input id="cost" type="number" min={0} step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="price">Retail price (per stem)</Label>
              <Input id="price" type="number" min={0} step="0.01" value={retailPrice} onChange={(e) => setRetailPrice(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="received">Received date *</Label>
              <Input id="received" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/inventory" })}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Add batch"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
