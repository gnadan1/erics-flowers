import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InventoryCategory = { id: string; name: string; display_order: number };
export type InventorySubcategory = {
  id: string;
  category_id: string;
  name: string;
  default_vase_life_days: number;
  display_order: number;
};
export type InventoryItem = {
  id: string;
  category_id: string;
  subcategory_id: string;
  sku: string;
  variety_name: string;
  supplier_id: string | null;
  color_family: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  seasonality: string | null;
  availability_status: string;
  quality_grade: number;
  floral_role: string | null;
  stem_length: number | null;
  stem_length_unit: string | null;
  bloom_size: string | null;
  stems_per_bunch: number | null;
  fragrance_level: number | null;
  texture: string | null;
  expected_vase_life_days: number | null;
  requires_hydration: boolean;
  storage_temperature: string | null;
  pet_toxicity: string | null;
  live_plant: boolean;
  plant_pot_size: string | null;
  plant_light_requirement: string | null;
  plant_water_requirement: string | null;
  unit_type: string;
  reorder_level: number;
  premium_item: boolean;
  organic: boolean;
  locally_grown: boolean;
  imported: boolean;
  active: boolean;
  notes: string | null;
};
export type Supplier = { id: string; name: string; contact: string | null };
export type Location = { id: string; name: string };
export type InventoryBatch = {
  id: string;
  flower_type_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  inventory_item_id: string | null;
  sku: string | null;
  variety_name: string | null;
  color: string;
  color_family: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  supplier_id: string | null;
  location_id: string | null;
  qty_received: number;
  qty_remaining: number;
  quantity_reserved: number;
  reorder_level: number;
  unit_cost: number;
  retail_price: number;
  received_date: string;
  expiration_date: string | null;
  vase_life_days: number;
  status: "active" | "sold_out" | "discarded";
  seasonality: string | null;
  availability_status: string;
  quality_grade: number | null;
  floral_role: string | null;
  stem_length: number | null;
  stem_length_unit: string | null;
  bloom_size: string | null;
  stems_per_bunch: number | null;
  fragrance_level: number | null;
  texture: string | null;
  requires_hydration: boolean;
  storage_temperature: string | null;
  pet_toxicity: string | null;
  live_plant: boolean;
  plant_pot_size: string | null;
  plant_light_requirement: string | null;
  plant_water_requirement: string | null;
  unit_type: string | null;
  premium_item: boolean;
  organic: boolean;
  locally_grown: boolean;
  imported: boolean;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  inventory_categories: { name: string } | null;
  inventory_subcategories: { name: string } | null;
  suppliers: { name: string } | null;
  locations: { name: string } | null;
};
export type Sale = {
  id: string;
  batch_id: string;
  qty_sold: number;
  sale_price: number;
  sold_at: string;
  inventory_batches: {
    color: string;
    variety_name: string;
    sku: string;
    unit_type: string;
    inventory_categories: { name: string } | null;
    inventory_subcategories: { name: string } | null;
  } | null;
};
export type OrderSource = "dove" | "fsn" | "phone" | "in_person" | "spec";
export type FulfillmentMethod = "pickup" | "shop" | "delivery";
export type OrderStatus = "draft" | "scheduled" | "in_progress" | "fulfilled" | "cancelled";
export type IngredientType = "flower" | "green" | "non_floral" | "other";
export type OrderIngredient = {
  id: string;
  order_arrangement_id: string;
  inventory_batch_id: string | null;
  ingredient_type: IngredientType;
  manual_name: string | null;
  quantity: number;
  unit_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  inventory_batches: {
    color: string;
    variety_name: string | null;
    sku: string | null;
    unit_type: string | null;
  } | null;
};
export type OrderArrangement = {
  id: string;
  order_id: string;
  arrangement_number: number;
  description: string | null;
  price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_ingredients: OrderIngredient[];
};
export type Order = {
  id: string;
  order_number: string;
  source: OrderSource;
  referring_order_number: string | null;
  recipient_name: string | null;
  fulfillment_method: FulfillmentMethod;
  address: string | null;
  phone: string | null;
  satisfaction: number | null;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_arrangements: OrderArrangement[];
};

export const inventoryCategoriesQuery = queryOptions({
  queryKey: ["inventory_categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("inventory_categories")
      .select("*")
      .order("display_order")
      .order("name");
    if (error) throw error;
    return data as InventoryCategory[];
  },
});

export const inventorySubcategoriesQuery = queryOptions({
  queryKey: ["inventory_subcategories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("inventory_subcategories")
      .select("*")
      .order("display_order")
      .order("name");
    if (error) throw error;
    return data as InventorySubcategory[];
  },
});

export const inventoryItemsQuery = queryOptions({
  queryKey: ["inventory_items"],
  queryFn: async () => {
    const { data, error } = await supabase.from("inventory_items").select("*").order("sku");
    if (error) throw error;
    return data as InventoryItem[];
  },
});

export const suppliersQuery = queryOptions({
  queryKey: ["suppliers"],
  queryFn: async () => {
    const { data, error } = await supabase.from("suppliers").select("*").order("name");
    if (error) throw error;
    return data as Supplier[];
  },
});

export const locationsQuery = queryOptions({
  queryKey: ["locations"],
  queryFn: async () => {
    const { data, error } = await supabase.from("locations").select("*").order("name");
    if (error) throw error;
    return data as Location[];
  },
});

function byId<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

export const batchesQuery = queryOptions({
  queryKey: ["inventory_batches"],
  queryFn: async () => {
    const [batches, categories, subcategories, suppliers, locations] = await Promise.all([
      supabase.from("inventory_batches").select("*").order("received_date", { ascending: false }),
      supabase.from("inventory_categories").select("id, name"),
      supabase.from("inventory_subcategories").select("id, name"),
      supabase.from("suppliers").select("id, name"),
      supabase.from("locations").select("id, name"),
    ]);

    const error =
      batches.error ??
      categories.error ??
      subcategories.error ??
      suppliers.error ??
      locations.error;
    if (error) throw error;

    const categoriesById = byId(categories.data);
    const subcategoriesById = byId(subcategories.data);
    const suppliersById = byId(suppliers.data);
    const locationsById = byId(locations.data);

    return (batches.data ?? []).map((batch) => ({
      ...batch,
      inventory_categories: batch.category_id
        ? { name: categoriesById.get(batch.category_id)?.name ?? "" }
        : null,
      inventory_subcategories: batch.subcategory_id
        ? { name: subcategoriesById.get(batch.subcategory_id)?.name ?? "" }
        : null,
      suppliers: batch.supplier_id
        ? { name: suppliersById.get(batch.supplier_id)?.name ?? "" }
        : null,
      locations: batch.location_id
        ? { name: locationsById.get(batch.location_id)?.name ?? "" }
        : null,
    })) as InventoryBatch[];
  },
});

export const salesQuery = queryOptions({
  queryKey: ["sales"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("*, inventory_batches(variety_name, sku, color, unit_type)")
      .order("sold_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data as unknown as Sale[];
  },
});

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, order_arrangements(*, order_ingredients(*, inventory_batches(variety_name, sku, color, unit_type)))",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as unknown as Order[];
  },
});

export function orderQuery(orderId: string) {
  return queryOptions({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, order_arrangements(*, order_ingredients(*, inventory_batches(variety_name, sku, color, unit_type)))",
        )
        .eq("id", orderId)
        .single();
      if (error) throw error;
      return data as unknown as Order;
    },
  });
}
