CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_batch_id UUID NOT NULL REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (
    reason IN (
      'used_in_order',
      'breakage',
      'unusable_on_arrival',
      'spec_arrangement',
      'spec_refresh',
      'aged_out',
      'manual_adjustment'
    )
  ),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  quantity_before INTEGER CHECK (quantity_before IS NULL OR quantity_before >= 0),
  quantity_after INTEGER CHECK (quantity_after IS NULL OR quantity_after >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO anon, authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inventory_movements" ON public.inventory_movements FOR SELECT USING (true);
CREATE POLICY "Public insert inventory_movements" ON public.inventory_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inventory_movements" ON public.inventory_movements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete inventory_movements" ON public.inventory_movements FOR DELETE USING (true);

CREATE INDEX inventory_movements_batch_idx ON public.inventory_movements(inventory_batch_id);
CREATE INDEX inventory_movements_reason_idx ON public.inventory_movements(reason);
CREATE INDEX inventory_movements_created_at_idx ON public.inventory_movements(created_at);
