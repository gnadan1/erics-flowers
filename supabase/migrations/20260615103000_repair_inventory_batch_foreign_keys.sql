DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_batches_category_id_fkey'
      AND conrelid = 'public.inventory_batches'::regclass
  ) THEN
    ALTER TABLE public.inventory_batches
      ADD CONSTRAINT inventory_batches_category_id_fkey
      FOREIGN KEY (category_id)
      REFERENCES public.inventory_categories(id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_batches_subcategory_id_fkey'
      AND conrelid = 'public.inventory_batches'::regclass
  ) THEN
    ALTER TABLE public.inventory_batches
      ADD CONSTRAINT inventory_batches_subcategory_id_fkey
      FOREIGN KEY (subcategory_id)
      REFERENCES public.inventory_subcategories(id)
      ON DELETE RESTRICT
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inventory_batches_inventory_item_id_fkey'
      AND conrelid = 'public.inventory_batches'::regclass
  ) THEN
    ALTER TABLE public.inventory_batches
      ADD CONSTRAINT inventory_batches_inventory_item_id_fkey
      FOREIGN KEY (inventory_item_id)
      REFERENCES public.inventory_items(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;
