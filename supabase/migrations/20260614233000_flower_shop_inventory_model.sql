CREATE TABLE public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_categories TO anon, authenticated;
GRANT ALL ON public.inventory_categories TO service_role;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inventory_categories" ON public.inventory_categories FOR SELECT USING (true);
CREATE POLICY "Public insert inventory_categories" ON public.inventory_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inventory_categories" ON public.inventory_categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete inventory_categories" ON public.inventory_categories FOR DELETE USING (true);

CREATE TABLE public.inventory_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.inventory_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_vase_life_days INTEGER NOT NULL DEFAULT 7 CHECK (default_vase_life_days > 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_subcategories TO anon, authenticated;
GRANT ALL ON public.inventory_subcategories TO service_role;
ALTER TABLE public.inventory_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inventory_subcategories" ON public.inventory_subcategories FOR SELECT USING (true);
CREATE POLICY "Public insert inventory_subcategories" ON public.inventory_subcategories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inventory_subcategories" ON public.inventory_subcategories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete inventory_subcategories" ON public.inventory_subcategories FOR DELETE USING (true);

CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.inventory_categories(id) ON DELETE RESTRICT,
  subcategory_id UUID NOT NULL REFERENCES public.inventory_subcategories(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL UNIQUE,
  variety_name TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  color_family TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  seasonality TEXT,
  availability_status TEXT NOT NULL DEFAULT 'In Stock',
  quality_grade INTEGER NOT NULL DEFAULT 3 CHECK (quality_grade BETWEEN 1 AND 5),
  floral_role TEXT,
  stem_length NUMERIC(8,2),
  stem_length_unit TEXT,
  bloom_size TEXT,
  stems_per_bunch INTEGER CHECK (stems_per_bunch IS NULL OR stems_per_bunch >= 0),
  fragrance_level INTEGER CHECK (fragrance_level IS NULL OR fragrance_level BETWEEN 0 AND 5),
  texture TEXT,
  expected_vase_life_days INTEGER CHECK (expected_vase_life_days IS NULL OR expected_vase_life_days > 0),
  requires_hydration BOOLEAN NOT NULL DEFAULT true,
  storage_temperature TEXT,
  pet_toxicity TEXT,
  live_plant BOOLEAN NOT NULL DEFAULT false,
  plant_pot_size TEXT,
  plant_light_requirement TEXT,
  plant_water_requirement TEXT,
  unit_type TEXT NOT NULL DEFAULT 'Stem',
  reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  premium_item BOOLEAN NOT NULL DEFAULT false,
  organic BOOLEAN NOT NULL DEFAULT false,
  locally_grown BOOLEAN NOT NULL DEFAULT false,
  imported BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_items TO anon, authenticated;
GRANT ALL ON public.inventory_items TO service_role;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read inventory_items" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Public insert inventory_items" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update inventory_items" ON public.inventory_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete inventory_items" ON public.inventory_items FOR DELETE USING (true);

ALTER TABLE public.inventory_batches
  DROP CONSTRAINT IF EXISTS inventory_batches_qty_received_check,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.inventory_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.inventory_subcategories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS variety_name TEXT,
  ADD COLUMN IF NOT EXISTS color_family TEXT,
  ADD COLUMN IF NOT EXISTS primary_color TEXT,
  ADD COLUMN IF NOT EXISTS secondary_color TEXT,
  ADD COLUMN IF NOT EXISTS seasonality TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'In Stock',
  ADD COLUMN IF NOT EXISTS quality_grade INTEGER CHECK (quality_grade IS NULL OR quality_grade BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS floral_role TEXT,
  ADD COLUMN IF NOT EXISTS stem_length NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS stem_length_unit TEXT,
  ADD COLUMN IF NOT EXISTS bloom_size TEXT,
  ADD COLUMN IF NOT EXISTS stems_per_bunch INTEGER CHECK (stems_per_bunch IS NULL OR stems_per_bunch >= 0),
  ADD COLUMN IF NOT EXISTS fragrance_level INTEGER CHECK (fragrance_level IS NULL OR fragrance_level BETWEEN 0 AND 5),
  ADD COLUMN IF NOT EXISTS texture TEXT,
  ADD COLUMN IF NOT EXISTS requires_hydration BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS storage_temperature TEXT,
  ADD COLUMN IF NOT EXISTS pet_toxicity TEXT,
  ADD COLUMN IF NOT EXISTS live_plant BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plant_pot_size TEXT,
  ADD COLUMN IF NOT EXISTS plant_light_requirement TEXT,
  ADD COLUMN IF NOT EXISTS plant_water_requirement TEXT,
  ADD COLUMN IF NOT EXISTS unit_type TEXT,
  ADD COLUMN IF NOT EXISTS quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  ADD COLUMN IF NOT EXISTS reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  ADD COLUMN IF NOT EXISTS expiration_date DATE,
  ADD COLUMN IF NOT EXISTS premium_item BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organic BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locally_grown BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS imported BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.inventory_batches
  ADD CONSTRAINT inventory_batches_qty_received_check CHECK (qty_received >= 0);

CREATE INDEX IF NOT EXISTS inventory_subcategories_category_idx ON public.inventory_subcategories(category_id);
CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON public.inventory_items(category_id);
CREATE INDEX IF NOT EXISTS inventory_items_subcategory_idx ON public.inventory_items(subcategory_id);
CREATE INDEX IF NOT EXISTS inventory_batches_category_idx ON public.inventory_batches(category_id);
CREATE INDEX IF NOT EXISTS inventory_batches_subcategory_idx ON public.inventory_batches(subcategory_id);
CREATE INDEX IF NOT EXISTS inventory_batches_sku_idx ON public.inventory_batches(sku);

CREATE TRIGGER update_inventory_categories_updated_at
BEFORE UPDATE ON public.inventory_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_subcategories_updated_at
BEFORE UPDATE ON public.inventory_subcategories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

WITH config AS (
  SELECT '[
    {"name":"Flowers","subcategories":["Alstroemeria","Aster-Focal","Aster-Spray","Bells of Ireland","Bouquets","Calla Lily","Carnations","Carnations-Mini","Combo Box","Daffodil","Dahlia","Delphinium","Gerbera","Gladiolus","Gypsophila","Hydrangea","Hypericum","Iris","Laceflower","Larkspur","Liatris","Lilies","Limonium","Lisianthus","Mums-Bunched","Mums-Stem","Novelty","Peony","Pom Pons","Ranunculus","Roses-Garden","Roses-Spray","Roses-Standard","Roses-Sweetheart","Snapdragon","Statice","Stock","Sunflower","Sweet Pea","Tulips","Tulips-French","Waxflower"]},
    {"name":"Novelty","subcategories":["Agapanthus","Ageratum","Alchemilla","Allium","Amaranthus","Anemone","Artemisia","Asclepias","Astilbe","Astrantia","Berry","Branch","Brunia","Bupleurum","Calendula","Campanula","Clematis","Cornflower","Cosmos","Craspedia","Daisy","Dianthus","Dill","Euphorbia","Fever Few","Foxglove","Freesia","Geranium","Godetia","Grass","Heather","Heliopsis","Helleborus","Hyacinth","Kale/Brassica","Kangaroo Paw","Lamb''s Ear","Lavender","Lilac","Lysimachia","Mini Gerbera","Mint","Miscellaneous Fillers","Nigella","Ornithogalum","Phlox","Pods","Poppy","Poppy Mix","Rosemary","Rudbeckia","Rumex","Safflower","Sarracenia","Scabiosa","Silene","Strawflower","Thistle","Trachelium","Tuberose","Tweedia","Veronica","Viburnum","Yarrow","Zinnia"]},
    {"name":"Tropicals","subcategories":["Anthurium","Bird of Paradise","Bouquet","Cymbidium","Gardenia","Ginger","Heliconia","Leaves","Orchids","Proteaceae","Stephanotis","Uluhe"]},
    {"name":"Greens","subcategories":["Aspidistra","Bear Grass","Bouquets","Boxwood","Cedar Port Orford","Cocculus","Emerald","Eucalyptus","Flat Fern","Foxtail","Garlands","Huckleberry","Ivy","Leatherleaf","Magnolia Foliage","Ming Fern","Miscellaneous Greens","Monkey Grass","Moss","Myrtle","Palm","Papyrus","Pittosporum","Plumosus","Rhamnus","Ruscus","Salal","Smilax","Springeri","Sword Fern","Tree Fern","Willow Curly"]},
    {"name":"Live Plants","subcategories":["Accessories","Aglaonema","Azalea","Bromeliads","Cactus and Succulents","Carnivorous Plants","Dieffenbachia","Dish Gardens","Dracaena","Fern","Ficus","Hanging Baskets","Hibiscus","Hydrangea","Ivy","Kalanchoe","Miscellaneous Flowering","Miscellaneous Foliage","Mum Plants","Orchid","Palm","Philodendron","Pothos","Schefflera","Spathiphyllum","Violets"]}
  ]'::jsonb AS categories
),
category_rows AS (
  SELECT category.value->>'name' AS name, category.ordinality::integer - 1 AS display_order
  FROM config, jsonb_array_elements(config.categories) WITH ORDINALITY AS category(value, ordinality)
),
inserted_categories AS (
  INSERT INTO public.inventory_categories (name, display_order)
  SELECT name, display_order FROM category_rows
  ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order
  RETURNING id, name
)
INSERT INTO public.inventory_subcategories (category_id, name, display_order)
SELECT c.id, subcategory.value #>> '{}', subcategory.ordinality::integer - 1
FROM config
JOIN category_rows cr ON true
JOIN public.inventory_categories c ON c.name = cr.name
JOIN jsonb_array_elements(config.categories) category(value) ON category.value->>'name' = cr.name
JOIN jsonb_array_elements(category.value->'subcategories') WITH ORDINALITY AS subcategory(value, ordinality) ON true
ON CONFLICT (category_id, name) DO UPDATE SET display_order = EXCLUDED.display_order;

WITH legacy_categories AS (
  SELECT DISTINCT
    CASE ft.category
      WHEN 'FLOWERS' THEN 'Flowers'
      WHEN 'NOVELTY' THEN 'Novelty'
      WHEN 'TROPICALS' THEN 'Tropicals'
      WHEN 'GREENS' THEN 'Greens'
      WHEN 'LIVE PLANTS' THEN 'Live Plants'
      ELSE initcap(lower(ft.category))
    END AS name
  FROM public.flower_types ft
)
INSERT INTO public.inventory_categories (name, display_order)
SELECT name, 1000 FROM legacy_categories
ON CONFLICT (name) DO NOTHING;

WITH legacy_subcategories AS (
  SELECT DISTINCT
    c.id AS category_id,
    ft.name
  FROM public.flower_types ft
  JOIN public.inventory_categories c ON c.name = CASE ft.category
    WHEN 'FLOWERS' THEN 'Flowers'
    WHEN 'NOVELTY' THEN 'Novelty'
    WHEN 'TROPICALS' THEN 'Tropicals'
    WHEN 'GREENS' THEN 'Greens'
    WHEN 'LIVE PLANTS' THEN 'Live Plants'
    ELSE initcap(lower(ft.category))
  END
)
INSERT INTO public.inventory_subcategories (category_id, name, display_order)
SELECT category_id, name, 1000 FROM legacy_subcategories
ON CONFLICT (category_id, name) DO NOTHING;

INSERT INTO public.inventory_items (
  category_id,
  subcategory_id,
  sku,
  variety_name,
  color_family,
  seasonality,
  quality_grade,
  floral_role,
  stem_length,
  stem_length_unit,
  unit_type,
  stems_per_bunch,
  expected_vase_life_days,
  live_plant,
  active
)
SELECT
  c.id,
  sc.id,
  item.sku,
  item.variety_name,
  item.color_family,
  item.seasonality,
  item.quality_grade,
  item.floral_role,
  item.stem_length,
  item.stem_length_unit,
  item.unit_type,
  item.stems_per_bunch,
  item.expected_vase_life_days,
  item.live_plant,
  item.active
FROM (
  VALUES
    ('ROSE-STANDARD-FREEDOM-60CM','Flowers','Roses-Standard','Freedom','Red','Year Round',4,'Focal',60,'cm','Stem',25,7,false,true),
    ('EUCALYPTUS-SILVER-DOLLAR','Greens','Eucalyptus','Silver Dollar','Green','Year Round',3,'Greenery',NULL,NULL,'Bunch',10,14,false,true),
    ('ORCHID-PHALAENOPSIS-6IN','Live Plants','Orchid','Phalaenopsis Orchid','White','Year Round',4,'Plant',NULL,NULL,'Plant',NULL,60,true,true)
) AS item(sku, category_name, subcategory_name, variety_name, color_family, seasonality, quality_grade, floral_role, stem_length, stem_length_unit, unit_type, stems_per_bunch, expected_vase_life_days, live_plant, active)
JOIN public.inventory_categories c ON c.name = item.category_name
JOIN public.inventory_subcategories sc ON sc.category_id = c.id AND sc.name = item.subcategory_name
ON CONFLICT (sku) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  subcategory_id = EXCLUDED.subcategory_id,
  variety_name = EXCLUDED.variety_name,
  color_family = EXCLUDED.color_family,
  seasonality = EXCLUDED.seasonality,
  quality_grade = EXCLUDED.quality_grade,
  floral_role = EXCLUDED.floral_role,
  stem_length = EXCLUDED.stem_length,
  stem_length_unit = EXCLUDED.stem_length_unit,
  unit_type = EXCLUDED.unit_type,
  stems_per_bunch = EXCLUDED.stems_per_bunch,
  expected_vase_life_days = EXCLUDED.expected_vase_life_days,
  live_plant = EXCLUDED.live_plant,
  active = EXCLUDED.active;

WITH legacy_batches AS (
  SELECT
    ib.id AS batch_id,
    COALESCE(NULLIF(ib.sku, ''), 'LEGACY-' || replace(ib.id::text, '-', '')) AS sku,
    COALESCE(NULLIF(ib.variety_name, ''), ft.name) AS variety_name,
    ib.supplier_id,
    c.id AS category_id,
    sc.id AS subcategory_id,
    NULLIF(COALESCE(ib.color_family, ib.color), '') AS color_family,
    NULLIF(COALESCE(ib.primary_color, ib.color), '') AS primary_color,
    NULLIF(ib.secondary_color, '') AS secondary_color,
    ib.seasonality,
    COALESCE(NULLIF(ib.availability_status, ''), 'In Stock') AS availability_status,
    COALESCE(ib.quality_grade, 3) AS quality_grade,
    ib.floral_role,
    ib.stem_length,
    ib.stem_length_unit,
    ib.bloom_size,
    ib.stems_per_bunch,
    ib.fragrance_level,
    ib.texture,
    ib.vase_life_days,
    COALESCE(ib.requires_hydration, true) AS requires_hydration,
    ib.storage_temperature,
    ib.pet_toxicity,
    COALESCE(ib.live_plant, c.name = 'Live Plants') AS live_plant,
    ib.plant_pot_size,
    ib.plant_light_requirement,
    ib.plant_water_requirement,
    COALESCE(NULLIF(ib.unit_type, ''), CASE WHEN c.name = 'Live Plants' THEN 'Plant' ELSE 'Stem' END) AS unit_type,
    COALESCE(ib.reorder_level, 0) AS reorder_level,
    COALESCE(ib.premium_item, false) AS premium_item,
    COALESCE(ib.organic, false) AS organic,
    COALESCE(ib.locally_grown, false) AS locally_grown,
    COALESCE(ib.imported, false) AS imported,
    COALESCE(ib.active, ib.status = 'active') AS active,
    ib.notes
  FROM public.inventory_batches ib
  JOIN public.flower_types ft ON ft.id = ib.flower_type_id
  JOIN public.inventory_categories c ON c.name = CASE ft.category
    WHEN 'FLOWERS' THEN 'Flowers'
    WHEN 'NOVELTY' THEN 'Novelty'
    WHEN 'TROPICALS' THEN 'Tropicals'
    WHEN 'GREENS' THEN 'Greens'
    WHEN 'LIVE PLANTS' THEN 'Live Plants'
    ELSE initcap(lower(ft.category))
  END
  JOIN public.inventory_subcategories sc ON sc.category_id = c.id AND sc.name = ft.name
)
INSERT INTO public.inventory_items (
  category_id,
  subcategory_id,
  sku,
  variety_name,
  supplier_id,
  color_family,
  primary_color,
  secondary_color,
  seasonality,
  availability_status,
  quality_grade,
  floral_role,
  stem_length,
  stem_length_unit,
  bloom_size,
  stems_per_bunch,
  fragrance_level,
  texture,
  expected_vase_life_days,
  requires_hydration,
  storage_temperature,
  pet_toxicity,
  live_plant,
  plant_pot_size,
  plant_light_requirement,
  plant_water_requirement,
  unit_type,
  reorder_level,
  premium_item,
  organic,
  locally_grown,
  imported,
  active,
  notes
)
SELECT
  category_id,
  subcategory_id,
  sku,
  variety_name,
  supplier_id,
  color_family,
  primary_color,
  secondary_color,
  seasonality,
  availability_status,
  quality_grade,
  floral_role,
  stem_length,
  stem_length_unit,
  bloom_size,
  stems_per_bunch,
  fragrance_level,
  texture,
  vase_life_days,
  requires_hydration,
  storage_temperature,
  pet_toxicity,
  live_plant,
  plant_pot_size,
  plant_light_requirement,
  plant_water_requirement,
  unit_type,
  reorder_level,
  premium_item,
  organic,
  locally_grown,
  imported,
  active,
  notes
FROM legacy_batches
ON CONFLICT (sku) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  subcategory_id = EXCLUDED.subcategory_id,
  variety_name = EXCLUDED.variety_name,
  supplier_id = EXCLUDED.supplier_id,
  color_family = EXCLUDED.color_family,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  seasonality = EXCLUDED.seasonality,
  availability_status = EXCLUDED.availability_status,
  quality_grade = EXCLUDED.quality_grade,
  floral_role = EXCLUDED.floral_role,
  stem_length = EXCLUDED.stem_length,
  stem_length_unit = EXCLUDED.stem_length_unit,
  bloom_size = EXCLUDED.bloom_size,
  stems_per_bunch = EXCLUDED.stems_per_bunch,
  fragrance_level = EXCLUDED.fragrance_level,
  texture = EXCLUDED.texture,
  expected_vase_life_days = EXCLUDED.expected_vase_life_days,
  requires_hydration = EXCLUDED.requires_hydration,
  storage_temperature = EXCLUDED.storage_temperature,
  pet_toxicity = EXCLUDED.pet_toxicity,
  live_plant = EXCLUDED.live_plant,
  plant_pot_size = EXCLUDED.plant_pot_size,
  plant_light_requirement = EXCLUDED.plant_light_requirement,
  plant_water_requirement = EXCLUDED.plant_water_requirement,
  unit_type = EXCLUDED.unit_type,
  reorder_level = EXCLUDED.reorder_level,
  premium_item = EXCLUDED.premium_item,
  organic = EXCLUDED.organic,
  locally_grown = EXCLUDED.locally_grown,
  imported = EXCLUDED.imported,
  active = EXCLUDED.active,
  notes = EXCLUDED.notes;

WITH legacy_batches AS (
  SELECT
    ib.id AS batch_id,
    COALESCE(NULLIF(ib.sku, ''), 'LEGACY-' || replace(ib.id::text, '-', '')) AS sku,
    COALESCE(NULLIF(ib.variety_name, ''), ft.name) AS variety_name,
    c.id AS category_id,
    sc.id AS subcategory_id,
    NULLIF(COALESCE(ib.color_family, ib.color), '') AS color_family,
    NULLIF(COALESCE(ib.primary_color, ib.color), '') AS primary_color,
    COALESCE(ib.quality_grade, 3) AS quality_grade,
    COALESCE(NULLIF(ib.unit_type, ''), CASE WHEN c.name = 'Live Plants' THEN 'Plant' ELSE 'Stem' END) AS unit_type,
    COALESCE(ib.active, ib.status = 'active') AS active
  FROM public.inventory_batches ib
  JOIN public.flower_types ft ON ft.id = ib.flower_type_id
  JOIN public.inventory_categories c ON c.name = CASE ft.category
    WHEN 'FLOWERS' THEN 'Flowers'
    WHEN 'NOVELTY' THEN 'Novelty'
    WHEN 'TROPICALS' THEN 'Tropicals'
    WHEN 'GREENS' THEN 'Greens'
    WHEN 'LIVE PLANTS' THEN 'Live Plants'
    ELSE initcap(lower(ft.category))
  END
  JOIN public.inventory_subcategories sc ON sc.category_id = c.id AND sc.name = ft.name
)
UPDATE public.inventory_batches ib
SET
  category_id = lb.category_id,
  subcategory_id = lb.subcategory_id,
  inventory_item_id = ii.id,
  sku = lb.sku,
  variety_name = lb.variety_name,
  color_family = lb.color_family,
  primary_color = lb.primary_color,
  quality_grade = lb.quality_grade,
  unit_type = lb.unit_type,
  active = lb.active
FROM legacy_batches lb
JOIN public.inventory_items ii ON ii.sku = lb.sku
WHERE ib.id = lb.batch_id;

ALTER TABLE public.inventory_batches ALTER COLUMN flower_type_id DROP NOT NULL;
ALTER TABLE public.inventory_batches ALTER COLUMN category_id SET NOT NULL;
ALTER TABLE public.inventory_batches ALTER COLUMN subcategory_id SET NOT NULL;
ALTER TABLE public.inventory_batches ALTER COLUMN inventory_item_id SET NOT NULL;
ALTER TABLE public.inventory_batches ALTER COLUMN sku SET NOT NULL;
ALTER TABLE public.inventory_batches ALTER COLUMN variety_name SET NOT NULL;
ALTER TABLE public.inventory_batches ALTER COLUMN quality_grade SET NOT NULL;
ALTER TABLE public.inventory_batches ALTER COLUMN unit_type SET NOT NULL;
