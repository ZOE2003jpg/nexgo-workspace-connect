-- Phase 2: Expand vendor categories beyond food
CREATE TYPE public.vendor_category AS ENUM ('food', 'market', 'supermarket', 'retail', 'container');

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS category public.vendor_category NOT NULL DEFAULT 'food';

CREATE INDEX IF NOT EXISTS idx_restaurants_category ON public.restaurants(category);