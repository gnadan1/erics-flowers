import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

type BoolFieldProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function BoolField({ label, checked, onCheckedChange }: BoolFieldProps) {
  return (
    <label className="flex h-10 items-center justify-between rounded-md border border-input px-3 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function optionalNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalText(value: string) {
  return value.trim() || null;
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
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [seasonality, setSeasonality] = useState("Year Round");
  const [availabilityStatus, setAvailabilityStatus] = useState("In Stock");
  const [qualityGrade, setQualityGrade] = useState("3");
  const [floralRole, setFloralRole] = useState("");
  const [stemLength, setStemLength] = useState("");
  const [stemLengthUnit, setStemLengthUnit] = useState("");
  const [bloomSize, setBloomSize] = useState("");
  const [stemsPerBunch, setStemsPerBunch] = useState("");
  const [fragranceLevel, setFragranceLevel] = useState("");
  const [texture, setTexture] = useState("");
  const [expectedVaseLifeDays, setExpectedVaseLifeDays] = useState("");
  const [requiresHydration, setRequiresHydration] = useState(true);
  const [storageTemperature, setStorageTemperature] = useState("");
  const [petToxicity, setPetToxicity] = useState("Unknown");
  const [livePlant, setLivePlant] = useState(false);
  const [plantPotSize, setPlantPotSize] = useState("");
  const [plantLightRequirement, setPlantLightRequirement] = useState("");
  const [plantWaterRequirement, setPlantWaterRequirement] = useState("");
  const [unitType, setUnitType] = useState("Stem");
  const [quantityOnHand, setQuantityOnHand] = useState("");
  const [quantityReserved, setQuantityReserved] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("0");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [expirationDate, setExpirationDate] = useState("");
  const [premiumItem, setPremiumItem] = useState(false);
  const [organic, setOrganic] = useState(false);
  const [locallyGrown, setLocallyGrown] = useState(false);
  const [imported, setImported] = useState(false);
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");

  const category = categories.find((c) => c.id === categoryId);
  const filteredSubcategories = useMemo(
    () => subcategories.filter((s) => s.category_id === categoryId),
    [categoryId, subcategories],
  );
  const subcategory = subcategories.find((s) => s.id === subcategoryId);

  useEffect(() => {
    if (subcategory && !expectedVaseLifeDays) {
      setExpectedVaseLifeDays(String(subcategory.default_vase_life_days));
    }
  }, [subcategory, expectedVaseLifeDays]);

  useEffect(() => {
    if (category?.name === "Live Plants") {
      setLivePlant(true);
      if (unitType === "Stem") setUnitType("Plant");
    }
  }, [category, unitType]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!categoryId) throw new Error("Category is required");
      if (!subcategoryId) throw new Error("Subcategory is required");
      if (!varietyName.trim()) throw new Error("Variety / item name is required");
      if (!sku.trim()) throw new Error("SKU is required");
      if (!unitType) throw new Error("Unit type is required");

      const grade = parseInt(qualityGrade, 10);
      const qty = parseInt(quantityOnHand, 10);
      const reserved = parseInt(quantityReserved || "0", 10);
      const reorder = parseInt(reorderLevel || "0", 10);
      const vaseLife = parseInt(expectedVaseLifeDays, 10);
      if (!Number.isFinite(grade) || grade < 1 || grade > 5)
        throw new Error("Quality grade must be 1-5");
      if (!Number.isFinite(qty) || qty < 0) throw new Error("Quantity on hand must be at least 0");
      if (!Number.isFinite(reserved) || reserved < 0)
        throw new Error("Quantity reserved must be at least 0");
      if (!Number.isFinite(reorder) || reorder < 0)
        throw new Error("Reorder level must be at least 0");
      if (!Number.isFinite(vaseLife) || vaseLife <= 0)
        throw new Error("Expected vase life days must be positive");

      const itemPayload = {
        category_id: categoryId,
        subcategory_id: subcategoryId,
        sku: sku.trim(),
        variety_name: varietyName.trim(),
        supplier_id: supplierId === NONE ? null : supplierId,
        color_family: optionalText(colorFamily),
        primary_color: optionalText(primaryColor),
        secondary_color: optionalText(secondaryColor),
        seasonality,
        availability_status: availabilityStatus,
        quality_grade: grade,
        floral_role: optionalText(floralRole),
        stem_length: optionalNumber(stemLength),
        stem_length_unit: optionalText(stemLengthUnit),
        bloom_size: optionalText(bloomSize),
        stems_per_bunch: optionalNumber(stemsPerBunch),
        fragrance_level: optionalNumber(fragranceLevel),
        texture: optionalText(texture),
        expected_vase_life_days: vaseLife,
        requires_hydration: requiresHydration,
        storage_temperature: optionalText(storageTemperature),
        pet_toxicity: optionalText(petToxicity),
        live_plant: livePlant,
        plant_pot_size: optionalText(plantPotSize),
        plant_light_requirement: optionalText(plantLightRequirement),
        plant_water_requirement: optionalText(plantWaterRequirement),
        unit_type: unitType,
        reorder_level: reorder,
        premium_item: premiumItem,
        organic,
        locally_grown: locallyGrown,
        imported,
        active,
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
        color: primaryColor.trim() || colorFamily || "",
        color_family: optionalText(colorFamily),
        primary_color: optionalText(primaryColor),
        secondary_color: optionalText(secondaryColor),
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
        floral_role: optionalText(floralRole),
        stem_length: optionalNumber(stemLength),
        stem_length_unit: optionalText(stemLengthUnit),
        bloom_size: optionalText(bloomSize),
        stems_per_bunch: optionalNumber(stemsPerBunch),
        fragrance_level: optionalNumber(fragranceLevel),
        texture: optionalText(texture),
        requires_hydration: requiresHydration,
        storage_temperature: optionalText(storageTemperature),
        pet_toxicity: optionalText(petToxicity),
        live_plant: livePlant,
        plant_pot_size: optionalText(plantPotSize),
        plant_light_requirement: optionalText(plantLightRequirement),
        plant_water_requirement: optionalText(plantWaterRequirement),
        unit_type: unitType,
        reorder_level: reorder,
        premium_item: premiumItem,
        organic,
        locally_grown: locallyGrown,
        imported,
        active,
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
                    {categories.map((c) => (
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
              <div>
                <Label htmlFor="primary_color">Primary color</Label>
                <Input
                  id="primary_color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="secondary_color">Secondary color</Label>
                <Input
                  id="secondary_color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </div>
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
              <SelectField
                label="Floral role"
                value={floralRole}
                onValueChange={setFloralRole}
                options={INVENTORY_DROPDOWN_OPTIONS.floralRole}
              />
              <div>
                <Label htmlFor="stem_length">Stem length</Label>
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
                label="Stem length unit"
                value={stemLengthUnit}
                onValueChange={setStemLengthUnit}
                options={INVENTORY_DROPDOWN_OPTIONS.stemLengthUnit}
              />
              <SelectField
                label="Bloom size"
                value={bloomSize}
                onValueChange={setBloomSize}
                options={INVENTORY_DROPDOWN_OPTIONS.bloomSize}
              />
              <div>
                <Label htmlFor="stems_per_bunch">Stems per bunch</Label>
                <Input
                  id="stems_per_bunch"
                  type="number"
                  min={0}
                  value={stemsPerBunch}
                  onChange={(e) => setStemsPerBunch(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fragrance">Fragrance level</Label>
                <Input
                  id="fragrance"
                  type="number"
                  min={0}
                  max={5}
                  value={fragranceLevel}
                  onChange={(e) => setFragranceLevel(e.target.value)}
                />
              </div>
              <SelectField
                label="Texture"
                value={texture}
                onValueChange={setTexture}
                options={INVENTORY_DROPDOWN_OPTIONS.texture}
              />
              <div>
                <Label htmlFor="vase_life">Expected vase life days *</Label>
                <Input
                  id="vase_life"
                  type="number"
                  min={1}
                  value={expectedVaseLifeDays}
                  onChange={(e) => setExpectedVaseLifeDays(e.target.value)}
                  required
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
                <Label htmlFor="qty">Quantity on hand *</Label>
                <Input
                  id="qty"
                  type="number"
                  min={0}
                  value={quantityOnHand}
                  onChange={(e) => setQuantityOnHand(e.target.value)}
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
                <Label htmlFor="reorder">Reorder level</Label>
                <Input
                  id="reorder"
                  type="number"
                  min={0}
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(e.target.value)}
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
                  onChange={(e) => setSellingPrice(e.target.value)}
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <BoolField
                label="Requires hydration"
                checked={requiresHydration}
                onCheckedChange={setRequiresHydration}
              />
              <BoolField label="Live plant" checked={livePlant} onCheckedChange={setLivePlant} />
              <BoolField
                label="Premium item"
                checked={premiumItem}
                onCheckedChange={setPremiumItem}
              />
              <BoolField label="Organic" checked={organic} onCheckedChange={setOrganic} />
              <BoolField
                label="Locally grown"
                checked={locallyGrown}
                onCheckedChange={setLocallyGrown}
              />
              <BoolField label="Imported" checked={imported} onCheckedChange={setImported} />
              <BoolField label="Active" checked={active} onCheckedChange={setActive} />
            </div>

            {livePlant && (
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="pot_size">Plant pot size</Label>
                  <Input
                    id="pot_size"
                    value={plantPotSize}
                    onChange={(e) => setPlantPotSize(e.target.value)}
                  />
                </div>
                <SelectField
                  label="Plant light requirement"
                  value={plantLightRequirement}
                  onValueChange={setPlantLightRequirement}
                  options={INVENTORY_DROPDOWN_OPTIONS.plantLightRequirement}
                />
                <SelectField
                  label="Plant water requirement"
                  value={plantWaterRequirement}
                  onValueChange={setPlantWaterRequirement}
                  options={INVENTORY_DROPDOWN_OPTIONS.plantWaterRequirement}
                />
              </div>
            )}

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
