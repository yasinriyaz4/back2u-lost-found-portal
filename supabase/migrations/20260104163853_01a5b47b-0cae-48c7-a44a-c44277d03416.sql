-- Add image_urls column for multiple images (text array)
ALTER TABLE public.items 
ADD COLUMN image_urls text[] DEFAULT '{}';

-- Migrate existing image_url data to the new array column
UPDATE public.items 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';

-- Note: Keeping image_url column for backward compatibility during transition