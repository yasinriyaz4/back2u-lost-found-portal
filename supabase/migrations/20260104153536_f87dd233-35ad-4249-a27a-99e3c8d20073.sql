-- Fix items → profiles relationship for embedding owner profile data
--
-- Currently items.user_id is linked to auth.users, which prevents the API from embedding profiles(*)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.items'::regclass
      AND conname = 'items_user_id_fkey'
      AND contype = 'f'
  ) THEN
    ALTER TABLE public.items DROP CONSTRAINT items_user_id_fkey;
  END IF;
END $$;

-- Recreate FK to public.profiles (so select('*, profiles(*)') works)
-- Using NOT VALID to avoid migration failure if any legacy rows lack profiles.
ALTER TABLE public.items
  ADD CONSTRAINT items_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE
  NOT VALID;

-- Performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
