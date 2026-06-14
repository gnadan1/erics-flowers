import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FLOWER_CATEGORIES = ["FLOWERS", "NOVELTY", "TROPICALS", "GREENS", "LIVE PLANTS"] as const;
export type FlowerCategory = (typeof FLOWER_CATEGORIES)[number];
export type FlowerType = { id: string; name: string; category: FlowerCategory; default_vase_life_days: number };
export type Supplier = { id: string; name: string; contact: string | null };
export type Location = { id: string; name: string };
export type InventoryBatch = {
  id: string;
  flower_type_id: string;
  color: string;
  supplier_id: string | null;
  location_id: string | null;
  qty_received: number;
  qty_remaining: number;
  unit_cost: number;
  retail_price: number;
  received_date: string;
  vase_life_days: number;
  status: "active" | "sold_out" | "discarded";
  notes: string | null;
  created_at: string;
  updated_at: string;
  flower_types: { name: string } | null;
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
    flower_types: { name: string } | null;
  } | null;
};

export const flowerTypesQuery = queryOptions({
  queryKey: ["flower_types"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("flower_types")
      .select("*")
      .order("name");
    if (error) throw error;
    return data as FlowerType[];
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
        "*, flower_types(name), suppliers(name), locations(name)",
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
      .select("*, inventory_batches(color, flower_types(name))")
      .order("sold_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data as unknown as Sale[];
  },
});
