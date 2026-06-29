import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FreshnessBadge } from "@/components/FreshnessBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  batchesQuery,
  inventoryCategoriesQuery,
  inventorySubcategoriesQuery,
  type InventoryBatch,
} from "@/lib/queries";
import { computeFreshness, formatCurrency } from "@/lib/inventory";
import { INVENTORY_DROPDOWN_OPTIONS } from "@/lib/inventoryConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(batchesQuery);
    context.queryClient.ensureQueryData(inventoryCategoriesQuery);
    context.queryClient.ensureQueryData(inventorySubcategoriesQuery);
  },
  component: InventoryPage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load inventory.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

type SortKey = "item" | "qty" | "location" | "supplier" | "sku" | "received" | "price" | "status";
type SortDirection = "asc" | "desc";
type SortState = { key: SortKey; direction: SortDirection };

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function inventoryItemLabel(batch: InventoryBatch) {
  return (
    batch.inventory_subcategories?.name ||
    batch.inventory_categories?.name ||
    batch.variety_name ||
    batch.sku ||
    "—"
  );
}

function formatStemLength(batch: InventoryBatch) {
  if (batch.stem_length === null) return null;
  const value = Number(batch.stem_length);
  if (!Number.isFinite(value)) return null;
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${batch.stem_length_unit || "cm"}`;
}

function inventoryItemDetail(batch: InventoryBatch) {
  const label = inventoryItemLabel(batch);
  const detailParts = [
    batch.variety_name && batch.variety_name !== label ? batch.variety_name : null,
    batch.primary_color || batch.color_family,
    formatStemLength(batch),
  ].filter(Boolean);

  return detailParts.join(" · ");
}

function freshnessSortValue(batch: InventoryBatch) {
  if (batch.status !== "active" || batch.qty_remaining <= 0) return batch.status;
  return computeFreshness(batch.received_date, batch.vase_life_days).status;
}

function compareStrings(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function sortValue(batch: InventoryBatch, key: SortKey): string | number {
  switch (key) {
    case "item":
      return normalizeText(`${inventoryItemLabel(batch)} ${inventoryItemDetail(batch)}`);
    case "qty":
      return batch.qty_remaining;
    case "location":
      return normalizeText(batch.locations?.name);
    case "supplier":
      return normalizeText(batch.suppliers?.name);
    case "sku":
      return normalizeText(batch.sku);
    case "received":
      return new Date(`${batch.received_date}T00:00:00`).getTime();
    case "price":
      return Number(batch.retail_price);
    case "status":
      return freshnessSortValue(batch);
  }
}

function SortableTableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex h-8 items-center gap-1 rounded-sm text-left text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <Icon className="h-3.5 w-3.5" />
      </button>
    </TableHead>
  );
}

function InventoryPage() {
  const { data: batches } = useSuspenseQuery(batchesQuery);
  const { data: categories } = useSuspenseQuery(inventoryCategoriesQuery);
  const { data: subcategories } = useSuspenseQuery(inventorySubcategoriesQuery);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("in_stock");
  const [freshnessFilter, setFreshnessFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [colorFamilyFilter, setColorFamilyFilter] = useState<string>("all");
  const [seasonalityFilter, setSeasonalityFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [qualityFilter, setQualityFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortState>({ key: "received", direction: "desc" });
  const [sellBatch, setSellBatch] = useState<InventoryBatch | null>(null);
  const [discardBatch, setDiscardBatch] = useState<InventoryBatch | null>(null);
  const filteredSubcategories = useMemo(
    () => subcategories.filter((s) => categoryFilter === "all" || s.category_id === categoryFilter),
    [categoryFilter, subcategories],
  );

  const filtered = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter === "in_stock" && (b.status !== "active" || b.qty_remaining <= 0))
        return false;
      if (statusFilter === "sold_out" && b.status !== "sold_out") return false;
      if (statusFilter === "discarded" && b.status !== "discarded") return false;
      if (categoryFilter !== "all" && b.category_id !== categoryFilter) return false;
      if (subcategoryFilter !== "all" && b.subcategory_id !== subcategoryFilter) return false;
      if (colorFamilyFilter !== "all" && b.color_family !== colorFamilyFilter) return false;
      if (seasonalityFilter !== "all" && b.seasonality !== seasonalityFilter) return false;
      if (availabilityFilter !== "all" && b.availability_status !== availabilityFilter)
        return false;
      if (qualityFilter !== "all" && String(b.quality_grade) !== qualityFilter) return false;
      if (freshnessFilter !== "all" && b.status === "active" && b.qty_remaining > 0) {
        const f = computeFreshness(b.received_date, b.vase_life_days);
        if (f.status !== freshnessFilter) return false;
      } else if (freshnessFilter !== "all") {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const blob = [
          b.variety_name,
          b.sku,
          b.inventory_categories?.name,
          b.inventory_subcategories?.name,
          b.color_family,
          b.primary_color,
          b.secondary_color,
          b.suppliers?.name,
          b.locations?.name,
          b.notes ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [
    batches,
    search,
    statusFilter,
    freshnessFilter,
    categoryFilter,
    subcategoryFilter,
    colorFamilyFilter,
    seasonalityFilter,
    availabilityFilter,
    qualityFilter,
  ]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aValue = sortValue(a, sort.key);
      const bValue = sortValue(b, sort.key);
      const result =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : compareStrings(String(aValue), String(bValue));

      return sort.direction === "asc" ? result : -result;
    });
  }, [filtered, sort]);

  function updateSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {batches.length} batches
          </p>
        </div>
      </div>

      <Card className="mb-4 p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="search" className="text-xs">
              Search
            </Label>
            <Input
              id="search"
              placeholder="Variety, SKU, supplier, notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select
              value={categoryFilter}
              onValueChange={(value) => {
                setCategoryFilter(value);
                setSubcategoryFilter("all");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Subcategory</Label>
            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subcategories</SelectItem>
                {filteredSubcategories.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Color family</Label>
            <Select value={colorFamilyFilter} onValueChange={setColorFamilyFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All colors</SelectItem>
                {INVENTORY_DROPDOWN_OPTIONS.colorFamily.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Seasonality</Label>
            <Select value={seasonalityFilter} onValueChange={setSeasonalityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All seasons</SelectItem>
                {INVENTORY_DROPDOWN_OPTIONS.seasonality.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Availability</Label>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All availability</SelectItem>
                {INVENTORY_DROPDOWN_OPTIONS.availabilityStatus.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quality</Label>
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {INVENTORY_DROPDOWN_OPTIONS.qualityGrade.map((g) => (
                  <SelectItem key={g.value} value={String(g.value)}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">In stock</SelectItem>
                <SelectItem value="sold_out">Sold out</SelectItem>
                <SelectItem value="discarded">Discarded</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Freshness</Label>
            <Select value={freshnessFilter} onValueChange={setFreshnessFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="fresh">Fresh</SelectItem>
                <SelectItem value="aging">Aging</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead label="Item" sortKey="item" sort={sort} onSort={updateSort} />
              <SortableTableHead label="Qty" sortKey="qty" sort={sort} onSort={updateSort} />
              <SortableTableHead
                label="Location"
                sortKey="location"
                sort={sort}
                onSort={updateSort}
              />
              <SortableTableHead
                label="Supplier"
                sortKey="supplier"
                sort={sort}
                onSort={updateSort}
              />
              <SortableTableHead label="SKU" sortKey="sku" sort={sort} onSort={updateSort} />
              <SortableTableHead
                label="Received"
                sortKey="received"
                sort={sort}
                onSort={updateSort}
              />
              <SortableTableHead label="Price" sortKey="price" sort={sort} onSort={updateSort} />
              <SortableTableHead label="Status" sortKey="status" sort={sort} onSort={updateSort} />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  No batches match these filters.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium">{inventoryItemLabel(b)}</div>
                    <div className="text-xs text-muted-foreground">{inventoryItemDetail(b)}</div>
                  </TableCell>
                  <TableCell>
                    {b.qty_remaining}
                    <span className="text-muted-foreground"> / {b.qty_received}</span>
                  </TableCell>
                  <TableCell className="text-sm">{b.locations?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{b.suppliers?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{b.sku ?? "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{b.received_date}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatCurrency(b.retail_price)}
                  </TableCell>
                  <TableCell>
                    {b.status === "active" && b.qty_remaining > 0 ? (
                      <FreshnessBadge
                        receivedDate={b.received_date}
                        vaseLifeDays={b.vase_life_days}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground capitalize">
                        {b.status.replace("_", " ")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === "active" && b.qty_remaining > 0 && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => setSellBatch(b)}>
                          <ShoppingCart className="h-3.5 w-3.5" /> Sell
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDiscardBatch(b)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {sellBatch && <SellDialog batch={sellBatch} onClose={() => setSellBatch(null)} />}
      {discardBatch && <DiscardDialog batch={discardBatch} onClose={() => setDiscardBatch(null)} />}
    </AppShell>
  );
}

function SellDialog({ batch, onClose }: { batch: InventoryBatch; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState(String(Number(batch.retail_price).toFixed(2)));

  const mutation = useMutation({
    mutationFn: async () => {
      const q = parseInt(qty, 10);
      const p = parseFloat(price);
      if (!Number.isFinite(q) || q <= 0 || q > batch.qty_remaining) {
        throw new Error(`Quantity must be between 1 and ${batch.qty_remaining}`);
      }
      if (!Number.isFinite(p) || p < 0) throw new Error("Invalid price");
      const newRemaining = batch.qty_remaining - q;
      const { error: sErr } = await supabase
        .from("sales")
        .insert({ batch_id: batch.id, qty_sold: q, sale_price: p });
      if (sErr) throw sErr;
      const { error: uErr } = await supabase
        .from("inventory_batches")
        .update({
          qty_remaining: newRemaining,
          status: newRemaining === 0 ? "sold_out" : "active",
        })
        .eq("id", batch.id);
      if (uErr) throw uErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_batches"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale recorded");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark sold</DialogTitle>
          <DialogDescription>
            {batch.variety_name}
            {batch.primary_color || batch.color_family
              ? ` · ${batch.primary_color || batch.color_family}`
              : ""}{" "}
            - {batch.qty_remaining} available
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="qty">Quantity sold</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={batch.qty_remaining}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="price">Sale price (per stem)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Record sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscardDialog({ batch, onClose }: { batch: InventoryBatch; onClose: () => void }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("inventory_batches")
        .update({ status: "discarded" })
        .eq("id", batch.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_batches"] });
      toast.success("Batch discarded");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discard batch?</DialogTitle>
          <DialogDescription>
            Mark the remaining {batch.qty_remaining} {batch.unit_type.toLowerCase()} of{" "}
            {batch.variety_name} as discarded. This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Discarding…" : "Discard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
