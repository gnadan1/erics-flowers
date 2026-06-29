import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import {
  inventoryCategoriesQuery,
  inventorySubcategoriesQuery,
  suppliersQuery,
  locationsQuery,
} from "@/lib/queries";
import { INVENTORY_DROPDOWN_OPTIONS } from "@/lib/inventoryConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/receive")({
  head: () => ({ meta: [{ title: "Receive Stock - Petal Inventory" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(inventoryCategoriesQuery);
    context.queryClient.ensureQueryData(inventorySubcategoriesQuery);
    context.queryClient.ensureQueryData(suppliersQuery);
    context.queryClient.ensureQueryData(locationsQuery);
  },
  component: ReceivePage,
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm">
        <p className="font-medium">Couldn't load form data.</p>
        <p className="mt-1 text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline" className="mt-3">
          Try again
        </Button>
      </div>
    </AppShell>
  ),
});

const NONE = "none";

function optionalNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalText(value: string) {
  return value.trim() || null;
}

function categoryPriceMultiplier(categoryName?: string) {
  const normalized = categoryName?.trim().toLowerCase();
  if (normalized === "flowers" || normalized === "tropicals") return 3.5;
  if (normalized === "greens" || normalized === "live plants") return 2;
  return null;
}

function defaultSellingPrice(cost: string, categoryName?: string) {
  const parsedCost = optionalNumber(cost);
  const multiplier = categoryPriceMultiplier(categoryName);
  if (parsedCost === null || multiplier === null) return "";
  return (parsedCost * multiplier).toFixed(2);
}

function ReceivePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: categories } = useSuspenseQuery(inventoryCategoriesQuery);
  const { data: subcategories } = useSuspenseQuery(inventorySubcategoriesQuery);
  const { data: suppliers } = useSuspenseQuery(suppliersQuery);
  const { data: locations } = useSuspenseQuery(locationsQuery);

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [varietyName, setVarietyName] = useState("");
  const [sku, setSku] = useState("");
  const [supplierId, setSupplierId] = useState<string>(NONE);
  const [locationId, setLocationId] = useState<string>(NONE);
  const [colorFamily, setColorFamily] = useState("");
  const [seasonality, setSeasonality] = useState("Year Round");
  const [availabilityStatus, setAvailabilityStatus] = useState("In Stock");
  const [qualityGrade, setQualityGrade] = useState("3");
  const [stemLength, setStemLength] = useState("");
  const [storageTemperature, setStorageTemperature] = useState("");
  const [petToxicity, setPetToxicity] = useState("Unknown");
  const [unitType, setUnitType] = useState("Stem");
  const [quantityReceived, setQuantityReceived] = useState("");
  const [quantityReserved, setQuantityReserved] = useState("0");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [sellingPriceEdited, setSellingPriceEdited] = useState(false);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.name.trim().toLowerCase() !== "novelty"),
    [categories],
  );
  const category = categories.find((c) => c.id === categoryId);
  const filteredSubcategories = useMemo(
    () => subcategories.filter((s) => s.category_id === categoryId),
    [categoryId, subcategories],
  );
  const subcategory = subcategories.find((s) => s.id === subcategoryId);
  const vaseLifeDays = subcategory?.default_vase_life_days ?? 7;
  const isLivePlant = category?.name === "Live Plants";

  useEffect(() => {
    if (category?.name === "Live Plants") {
      if (unitType === "Stem") setUnitType("Plant");
    }
  }, [category, unitType]);

  useEffect(() => {
    if (!sellingPriceEdited) {
      setSellingPrice(defaultSellingPrice(costPerUnit, category?.name));
    }
  }, [category?.name, costPerUnit, sellingPriceEdited]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!categoryId) throw new Error("Category is required");
      if (!subcategoryId) throw new Error("Subcategory is required");
      if (!varietyName.trim()) throw new Error("Variety / item name is required");
      if (!sku.trim()) throw new Error("SKU is required");
      if (!unitType) throw new Error("Unit type is required");

      const grade = parseInt(qualityGrade, 10);
      const qty = parseInt(quantityReceived, 10);
      const reserved = parseInt(quantityReserved || "0", 10);
      const vaseLife = vaseLifeDays;
      if (!Number.isFinite(grade) || grade < 1 || grade > 5)
        throw new Error("Quality grade must be 1-5");
      if (!Number.isFinite(qty) || qty < 0) throw new Error("Quantity received must be at least 0");
      if (!Number.isFinite(reserved) || reserved < 0)
        throw new Error("Quantity reserved must be at least 0");

      const itemPayload = {
        category_id: categoryId,
        subcategory_id: subcategoryId,
        sku: sku.trim(),
        variety_name: varietyName.trim(),
        supplier_id: supplierId === NONE ? null : supplierId,
        color_family: optionalText(colorFamily),
        primary_color: null,
        secondary_color: null,
        seasonality,
        availability_status: availabilityStatus,
        quality_grade: grade,
        floral_role: null,
        stem_length: optionalNumber(stemLength),
        stem_length_unit: optionalNumber(stemLength) === null ? null : "cm",
        bloom_size: null,
        stems_per_bunch: null,
        fragrance_level: null,
        texture: null,
        expected_vase_life_days: vaseLife,
        requires_hydration: true,
        storage_temperature: optionalText(storageTemperature),
        pet_toxicity: optionalText(petToxicity),
        live_plant: isLivePlant,
        plant_pot_size: null,
        plant_light_requirement: null,
        plant_water_requirement: null,
        unit_type: unitType,
        reorder_level: 0,
        premium_item: false,
        organic: false,
        locally_grown: false,
        imported: false,
        active: true,
        notes: optionalText(notes),
      };

      const { data: item, error: itemError } = await supabase
        .from("inventory_items")
        .upsert(itemPayload, { onConflict: "sku" })
        .select("id")
        .single();
      if (itemError) throw itemError;

      const { error: batchError } = await supabase.from("inventory_batches").insert({
        category_id: categoryId,
        subcategory_id: subcategoryId,
        inventory_item_id: item.id,
        sku: sku.trim(),
        variety_name: varietyName.trim(),
        color: colorFamily || "",
        color_family: optionalText(colorFamily),
        primary_color: null,
        secondary_color: null,
        supplier_id: supplierId === NONE ? null : supplierId,
        location_id: locationId === NONE ? null : locationId,
        qty_received: qty,
        qty_remaining: qty,
        quantity_reserved: reserved,
        unit_cost: optionalNumber(costPerUnit) ?? 0,
        retail_price: optionalNumber(sellingPrice) ?? 0,
        received_date: receivedDate,
        expiration_date: optionalText(expirationDate),
        vase_life_days: vaseLife,
        status: qty === 0 ? "sold_out" : "active",
        seasonality,
        availability_status: availabilityStatus,
        quality_grade: grade,
        floral_role: null,
        stem_length: optionalNumber(stemLength),
        stem_length_unit: optionalNumber(stemLength) === null ? null : "cm",
        bloom_size: null,
        stems_per_bunch: null,
        fragrance_level: null,
        texture: null,
        requires_hydration: true,
        storage_temperature: optionalText(storageTemperature),
        pet_toxicity: optionalText(petToxicity),
        live_plant: isLivePlant,
        plant_pot_size: null,
        plant_light_requirement: null,
        plant_water_requirement: null,
        unit_type: unitType,
        reorder_level: 0,
        premium_item: false,
        organic: false,
        locally_grown: false,
        imported: false,
        active: true,
        notes: optionalText(notes),
      });
      if (batchError) throw batchError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory_batches"] });
      qc.invalidateQueries({ queryKey: ["inventory_items"] });
      toast.success("Inventory item received");
      navigate({ to: "/inventory" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Receive stock</h1>
        <p className="text-sm text-muted-foreground">
          Create or update a SKU and log quantity into inventory.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label>Category *</Label>
                <Select
                  value={categoryId}
                  onValueChange={(value) => {
                    setCategoryId(value);
                    setSubcategoryId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {visibleCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory *</Label>
                <Select
                  value={subcategoryId}
                  onValueChange={setSubcategoryId}
                  disabled={!categoryId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={categoryId ? "Choose subcategory" : "Pick category first"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubcategories.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="variety">Variety / item name *</Label>
                <Input
                  id="variety"
                  value={varietyName}
                  onChange={(e) => setVarietyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label>Vendor / supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Select value={locationId} onValueChange={setLocationId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <SelectField
                label="Color family"
                value={colorFamily}
                onValueChange={setColorFamily}
                options={INVENTORY_DROPDOWN_OPTIONS.colorFamily}
              />
              <SelectField
                label="Seasonality"
                value={seasonality}
                onValueChange={setSeasonality}
                options={INVENTORY_DROPDOWN_OPTIONS.seasonality}
              />
              <SelectField
                label="Availability"
                value={availabilityStatus}
                onValueChange={setAvailabilityStatus}
                options={INVENTORY_DROPDOWN_OPTIONS.availabilityStatus}
              />
              <SelectField
                label="Quality grade *"
                value={qualityGrade}
                onValueChange={setQualityGrade}
                options={INVENTORY_DROPDOWN_OPTIONS.qualityGrade.map((g) => ({
                  value: String(g.value),
                  label: g.label,
                }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <Label htmlFor="stem_length">Stem length (cm)</Label>
                <Input
                  id="stem_length"
                  type="number"
                  min={0}
                  step="0.01"
                  value={stemLength}
                  onChange={(e) => setStemLength(e.target.value)}
                />
              </div>
              <SelectField
                label="Storage temperature"
                value={storageTemperature}
                onValueChange={setStorageTemperature}
                options={INVENTORY_DROPDOWN_OPTIONS.storageTemperature}
              />
              <SelectField
                label="Pet toxicity"
                value={petToxicity}
                onValueChange={setPetToxicity}
                options={INVENTORY_DROPDOWN_OPTIONS.petToxicity}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectField
                label="Unit type *"
                value={unitType}
                onValueChange={setUnitType}
                options={INVENTORY_DROPDOWN_OPTIONS.unitType}
              />
              <div>
                <Label htmlFor="qty">Quantity received *</Label>
                <Input
                  id="qty"
                  type="number"
                  min={0}
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reserved">Quantity reserved</Label>
                <Input
                  id="reserved"
                  type="number"
                  min={0}
                  value={quantityReserved}
                  onChange={(e) => setQuantityReserved(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost per unit</Label>
                <Input
                  id="cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="price">Selling price</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => {
                    setSellingPriceEdited(true);
                    setSellingPrice(e.target.value);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="received">Received date *</Label>
                <Input
                  id="received"
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expiration">Expiration / pull date</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/inventory" })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save inventory"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

type SelectOption = string | { value: string; label: string };

function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value || NONE}
        onValueChange={(next) => onValueChange(next === NONE ? "" : next)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None</SelectItem>
          {options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            return (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
