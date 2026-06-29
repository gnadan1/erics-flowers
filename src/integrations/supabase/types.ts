export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      flower_types: {
        Row: {
          category: string;
          created_at: string;
          default_vase_life_days: number;
          id: string;
          name: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          default_vase_life_days?: number;
          id?: string;
          name: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          default_vase_life_days?: number;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      inventory_categories: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_batches: {
        Row: {
          active: boolean;
          availability_status: string;
          bloom_size: string | null;
          category_id: string;
          color: string;
          color_family: string | null;
          created_at: string;
          expiration_date: string | null;
          floral_role: string | null;
          flower_type_id: string | null;
          fragrance_level: number | null;
          id: string;
          imported: boolean;
          inventory_item_id: string;
          live_plant: boolean;
          location_id: string | null;
          notes: string | null;
          organic: boolean;
          pet_toxicity: string | null;
          plant_light_requirement: string | null;
          plant_pot_size: string | null;
          plant_water_requirement: string | null;
          premium_item: boolean;
          primary_color: string | null;
          qty_received: number;
          qty_remaining: number;
          quality_grade: number;
          quantity_reserved: number;
          received_date: string;
          reorder_level: number;
          requires_hydration: boolean;
          retail_price: number;
          seasonality: string | null;
          secondary_color: string | null;
          sku: string;
          status: string;
          stem_length: number | null;
          stem_length_unit: string | null;
          stems_per_bunch: number | null;
          storage_temperature: string | null;
          subcategory_id: string;
          supplier_id: string | null;
          texture: string | null;
          unit_cost: number;
          unit_type: string;
          updated_at: string;
          vase_life_days: number;
          variety_name: string;
        };
        Insert: {
          active?: boolean;
          availability_status?: string;
          bloom_size?: string | null;
          category_id: string;
          color?: string;
          color_family?: string | null;
          created_at?: string;
          expiration_date?: string | null;
          floral_role?: string | null;
          flower_type_id?: string | null;
          fragrance_level?: number | null;
          id?: string;
          imported?: boolean;
          inventory_item_id: string;
          live_plant?: boolean;
          location_id?: string | null;
          notes?: string | null;
          organic?: boolean;
          pet_toxicity?: string | null;
          plant_light_requirement?: string | null;
          plant_pot_size?: string | null;
          plant_water_requirement?: string | null;
          premium_item?: boolean;
          primary_color?: string | null;
          qty_received: number;
          qty_remaining: number;
          quality_grade: number;
          quantity_reserved?: number;
          received_date?: string;
          reorder_level?: number;
          requires_hydration?: boolean;
          retail_price?: number;
          seasonality?: string | null;
          secondary_color?: string | null;
          sku: string;
          status?: string;
          stem_length?: number | null;
          stem_length_unit?: string | null;
          stems_per_bunch?: number | null;
          storage_temperature?: string | null;
          subcategory_id: string;
          supplier_id?: string | null;
          texture?: string | null;
          unit_cost?: number;
          unit_type: string;
          updated_at?: string;
          vase_life_days: number;
          variety_name: string;
        };
        Update: {
          active?: boolean;
          availability_status?: string;
          bloom_size?: string | null;
          category_id?: string;
          color?: string;
          color_family?: string | null;
          created_at?: string;
          expiration_date?: string | null;
          floral_role?: string | null;
          flower_type_id?: string | null;
          fragrance_level?: number | null;
          id?: string;
          imported?: boolean;
          inventory_item_id?: string;
          live_plant?: boolean;
          location_id?: string | null;
          notes?: string | null;
          organic?: boolean;
          pet_toxicity?: string | null;
          plant_light_requirement?: string | null;
          plant_pot_size?: string | null;
          plant_water_requirement?: string | null;
          premium_item?: boolean;
          primary_color?: string | null;
          qty_received?: number;
          qty_remaining?: number;
          quality_grade?: number;
          quantity_reserved?: number;
          received_date?: string;
          reorder_level?: number;
          requires_hydration?: boolean;
          retail_price?: number;
          seasonality?: string | null;
          secondary_color?: string | null;
          sku?: string;
          status?: string;
          stem_length?: number | null;
          stem_length_unit?: string | null;
          stems_per_bunch?: number | null;
          storage_temperature?: string | null;
          subcategory_id?: string;
          supplier_id?: string | null;
          texture?: string | null;
          unit_cost?: number;
          unit_type?: string;
          updated_at?: string;
          vase_life_days?: number;
          variety_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_batches_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "inventory_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_batches_flower_type_id_fkey";
            columns: ["flower_type_id"];
            isOneToOne: false;
            referencedRelation: "flower_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_batches_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_batches_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_batches_subcategory_id_fkey";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "inventory_subcategories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_batches_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          active: boolean;
          availability_status: string;
          bloom_size: string | null;
          category_id: string;
          color_family: string | null;
          created_at: string;
          expected_vase_life_days: number | null;
          floral_role: string | null;
          fragrance_level: number | null;
          id: string;
          imported: boolean;
          live_plant: boolean;
          locally_grown: boolean;
          notes: string | null;
          organic: boolean;
          pet_toxicity: string | null;
          plant_light_requirement: string | null;
          plant_pot_size: string | null;
          plant_water_requirement: string | null;
          premium_item: boolean;
          primary_color: string | null;
          quality_grade: number;
          reorder_level: number;
          requires_hydration: boolean;
          seasonality: string | null;
          secondary_color: string | null;
          sku: string;
          stem_length: number | null;
          stem_length_unit: string | null;
          stems_per_bunch: number | null;
          storage_temperature: string | null;
          subcategory_id: string;
          supplier_id: string | null;
          texture: string | null;
          unit_type: string;
          updated_at: string;
          variety_name: string;
        };
        Insert: {
          active?: boolean;
          availability_status?: string;
          bloom_size?: string | null;
          category_id: string;
          color_family?: string | null;
          created_at?: string;
          expected_vase_life_days?: number | null;
          floral_role?: string | null;
          fragrance_level?: number | null;
          id?: string;
          imported?: boolean;
          live_plant?: boolean;
          locally_grown?: boolean;
          notes?: string | null;
          organic?: boolean;
          pet_toxicity?: string | null;
          plant_light_requirement?: string | null;
          plant_pot_size?: string | null;
          plant_water_requirement?: string | null;
          premium_item?: boolean;
          primary_color?: string | null;
          quality_grade?: number;
          reorder_level?: number;
          requires_hydration?: boolean;
          seasonality?: string | null;
          secondary_color?: string | null;
          sku: string;
          stem_length?: number | null;
          stem_length_unit?: string | null;
          stems_per_bunch?: number | null;
          storage_temperature?: string | null;
          subcategory_id: string;
          supplier_id?: string | null;
          texture?: string | null;
          unit_type?: string;
          updated_at?: string;
          variety_name: string;
        };
        Update: {
          active?: boolean;
          availability_status?: string;
          bloom_size?: string | null;
          category_id?: string;
          color_family?: string | null;
          created_at?: string;
          expected_vase_life_days?: number | null;
          floral_role?: string | null;
          fragrance_level?: number | null;
          id?: string;
          imported?: boolean;
          live_plant?: boolean;
          locally_grown?: boolean;
          notes?: string | null;
          organic?: boolean;
          pet_toxicity?: string | null;
          plant_light_requirement?: string | null;
          plant_pot_size?: string | null;
          plant_water_requirement?: string | null;
          premium_item?: boolean;
          primary_color?: string | null;
          quality_grade?: number;
          reorder_level?: number;
          requires_hydration?: boolean;
          seasonality?: string | null;
          secondary_color?: string | null;
          sku?: string;
          stem_length?: number | null;
          stem_length_unit?: string | null;
          stems_per_bunch?: number | null;
          storage_temperature?: string | null;
          subcategory_id?: string;
          supplier_id?: string | null;
          texture?: string | null;
          unit_type?: string;
          updated_at?: string;
          variety_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "inventory_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_subcategory_id_fkey";
            columns: ["subcategory_id"];
            isOneToOne: false;
            referencedRelation: "inventory_subcategories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          created_at: string;
          id: string;
          inventory_batch_id: string;
          note: string | null;
          quantity: number;
          quantity_after: number | null;
          quantity_before: number | null;
          reason: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          inventory_batch_id: string;
          note?: string | null;
          quantity: number;
          quantity_after?: number | null;
          quantity_before?: number | null;
          reason: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          inventory_batch_id?: string;
          note?: string | null;
          quantity?: number;
          quantity_after?: number | null;
          quantity_before?: number | null;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_batch_id_fkey";
            columns: ["inventory_batch_id"];
            isOneToOne: false;
            referencedRelation: "inventory_batches";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_subcategories: {
        Row: {
          category_id: string;
          created_at: string;
          default_vase_life_days: number;
          display_order: number;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          default_vase_life_days?: number;
          display_order?: number;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          default_vase_life_days?: number;
          display_order?: number;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_subcategories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "inventory_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      order_arrangements: {
        Row: {
          arrangement_number: number;
          created_at: string;
          description: string | null;
          id: string;
          notes: string | null;
          order_id: string;
          price: number;
          updated_at: string;
        };
        Insert: {
          arrangement_number?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          notes?: string | null;
          order_id: string;
          price?: number;
          updated_at?: string;
        };
        Update: {
          arrangement_number?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_arrangements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_ingredients: {
        Row: {
          created_at: string;
          id: string;
          ingredient_type: string;
          inventory_batch_id: string | null;
          manual_name: string | null;
          notes: string | null;
          order_arrangement_id: string;
          quantity: number;
          unit_type: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ingredient_type?: string;
          inventory_batch_id?: string | null;
          manual_name?: string | null;
          notes?: string | null;
          order_arrangement_id: string;
          quantity: number;
          unit_type?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          ingredient_type?: string;
          inventory_batch_id?: string | null;
          manual_name?: string | null;
          notes?: string | null;
          order_arrangement_id?: string;
          quantity?: number;
          unit_type?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_ingredients_inventory_batch_id_fkey";
            columns: ["inventory_batch_id"];
            isOneToOne: false;
            referencedRelation: "inventory_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_ingredients_order_arrangement_id_fkey";
            columns: ["order_arrangement_id"];
            isOneToOne: false;
            referencedRelation: "order_arrangements";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string | null;
          created_at: string;
          fulfillment_method: string;
          id: string;
          notes: string | null;
          order_number: string;
          phone: string | null;
          recipient_name: string | null;
          referring_order_number: string | null;
          satisfaction: number | null;
          source: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          fulfillment_method?: string;
          id?: string;
          notes?: string | null;
          order_number: string;
          phone?: string | null;
          recipient_name?: string | null;
          referring_order_number?: string | null;
          satisfaction?: number | null;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          fulfillment_method?: string;
          id?: string;
          notes?: string | null;
          order_number?: string;
          phone?: string | null;
          recipient_name?: string | null;
          referring_order_number?: string | null;
          satisfaction?: number | null;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sales: {
        Row: {
          batch_id: string;
          id: string;
          qty_sold: number;
          sale_price: number;
          sold_at: string;
        };
        Insert: {
          batch_id: string;
          id?: string;
          qty_sold: number;
          sale_price?: number;
          sold_at?: string;
        };
        Update: {
          batch_id?: string;
          id?: string;
          qty_sold?: number;
          sale_price?: number;
          sold_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "inventory_batches";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          contact: string | null;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          contact?: string | null;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          contact?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
