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

export const batchesQuery = queryOptions({
  queryKey: ["inventory_batches"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("inventory_batches")
      .select(
        "*, inventory_categories(name), inventory_subcategories(name), suppliers(name), locations(name)",
      )
      .order("received_date", { ascending: false });
    if (error) throw error;
    return data as unknown as InventoryBatch[];
  },
});

export const salesQuery = queryOptions({
  queryKey: ["sales"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        "*, inventory_batches(variety_name, sku, color, unit_type, inventory_categories(name), inventory_subcategories(name))",
      )
      .order("sold_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data as unknown as Sale[];
  },
});
