
-- Flower types
CREATE TABLE public.flower_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  default_vase_life_days INTEGER NOT NULL DEFAULT 7 CHECK (default_vase_life_days > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flower_types TO anon, authenticated;
GRANT ALL ON public.flower_types TO service_role;
ALTER TABLE public.flower_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read flower_types" ON public.flower_types FOR SELECT USING (true);
CREATE POLICY "Public insert flower_types" ON public.flower_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update flower_types" ON public.flower_types FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete flower_types" ON public.flower_types FOR DELETE USING (true);

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO anon, authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Public insert suppliers" ON public.suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update suppliers" ON public.suppliers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete suppliers" ON public.suppliers FOR DELETE USING (true);

-- Locations
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO anon, authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Public insert locations" ON public.locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update locations" ON public.locations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete locations" ON public.locations FOR DELETE USING (true);

-- Inventory batches
CREATE TABLE public.inventory_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flower_type_id UUID NOT NULL REFERENCES public.flower_types(id) ON DELETE RESTRICT,
  color TEXT NOT NULL DEFAULT '',
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  qty_received INTEGER NOT NULL CHECK (qty_received > 0),
  qty_remaining INTEGER NOT NULL CHECK (qty_remaining >= 0),
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  retail_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (retail_price >= 0),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vase_life_days INTEGER NOT NULL CHECK (vase_life_days > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold_out','discarded')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_batches TO anon, authenticated;
GRANT ALL ON public.inventory_batches TO service_role;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inventory_batches" ON public.inventory_batches FOR SELECT USING (true);
CREATE POLICY "Public insert inventory_batches" ON public.inventory_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inventory_batches" ON public.inventory_batches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete inventory_batches" ON public.inventory_batches FOR DELETE USING (true);

CREATE INDEX inventory_batches_status_idx ON public.inventory_batches(status);
CREATE INDEX inventory_batches_received_idx ON public.inventory_batches(received_date);

-- Sales
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
  qty_sold INTEGER NOT NULL CHECK (qty_sold > 0),
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (sale_price >= 0),
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon, authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Public insert sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sales" ON public.sales FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete sales" ON public.sales FOR DELETE USING (true);

CREATE INDEX sales_batch_idx ON public.sales(batch_id);
CREATE INDEX sales_sold_at_idx ON public.sales(sold_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_inventory_batches_updated_at
BEFORE UPDATE ON public.inventory_batches
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed flower types
INSERT INTO public.flower_types (name, default_vase_life_days) VALUES
  ('Rose', 7),
  ('Tulip', 5),
  ('Lily', 10),
  ('Carnation', 14),
  ('Sunflower', 7),
  ('Hydrangea', 5),
  ('Orchid', 14),
  ('Daisy', 7),
  ('Peony', 5),
  ('Chrysanthemum', 14);

-- Seed locations
INSERT INTO public.locations (name) VALUES
  ('Cooler A'),
  ('Cooler B'),
  ('Front Display'),
  ('Back Room');

-- Seed suppliers
INSERT INTO public.suppliers (name) VALUES
  ('Local Farm'),
  ('Wholesale Co.');
