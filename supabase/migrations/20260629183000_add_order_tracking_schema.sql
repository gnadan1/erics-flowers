CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'phone' CHECK (
    source IN ('dove', 'fsn', 'phone', 'in_person', 'spec')
  ),
  referring_order_number TEXT,
  recipient_name TEXT,
  fulfillment_method TEXT NOT NULL DEFAULT 'pickup' CHECK (
    fulfillment_method IN ('pickup', 'shop', 'delivery')
  ),
  address TEXT,
  phone TEXT,
  satisfaction INTEGER CHECK (satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scheduled', 'in_progress', 'fulfilled', 'cancelled')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

CREATE INDEX orders_source_idx ON public.orders(source);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_created_at_idx ON public.orders(created_at);

CREATE TABLE public.order_arrangements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  arrangement_number INTEGER NOT NULL DEFAULT 1 CHECK (arrangement_number > 0),
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_arrangements TO anon, authenticated;
GRANT ALL ON public.order_arrangements TO service_role;
ALTER TABLE public.order_arrangements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read order_arrangements" ON public.order_arrangements FOR SELECT USING (true);
CREATE POLICY "Public insert order_arrangements" ON public.order_arrangements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update order_arrangements" ON public.order_arrangements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete order_arrangements" ON public.order_arrangements FOR DELETE USING (true);

CREATE INDEX order_arrangements_order_idx ON public.order_arrangements(order_id);

CREATE TABLE public.order_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_arrangement_id UUID NOT NULL REFERENCES public.order_arrangements(id) ON DELETE CASCADE,
  inventory_batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  ingredient_type TEXT NOT NULL DEFAULT 'flower' CHECK (
    ingredient_type IN ('flower', 'green', 'non_floral', 'other')
  ),
  manual_name TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (inventory_batch_id IS NOT NULL OR manual_name IS NOT NULL)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_ingredients TO anon, authenticated;
GRANT ALL ON public.order_ingredients TO service_role;
ALTER TABLE public.order_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read order_ingredients" ON public.order_ingredients FOR SELECT USING (true);
CREATE POLICY "Public insert order_ingredients" ON public.order_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update order_ingredients" ON public.order_ingredients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete order_ingredients" ON public.order_ingredients FOR DELETE USING (true);

CREATE INDEX order_ingredients_arrangement_idx ON public.order_ingredients(order_arrangement_id);
CREATE INDEX order_ingredients_inventory_batch_idx ON public.order_ingredients(inventory_batch_id);
CREATE INDEX order_ingredients_type_idx ON public.order_ingredients(ingredient_type);

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_arrangements_updated_at
BEFORE UPDATE ON public.order_arrangements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_ingredients_updated_at
BEFORE UPDATE ON public.order_ingredients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
