
-- Add latitude and longitude columns to items table
ALTER TABLE public.items ADD COLUMN latitude double precision;
ALTER TABLE public.items ADD COLUMN longitude double precision;

-- Add index for coordinate-based queries
CREATE INDEX idx_items_coordinates ON public.items (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
