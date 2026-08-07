-- Add foreign key relationship so the API can embed profiles in items queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'items_user_id_fkey'
  ) THEN
    ALTER TABLE public.items
      ADD CONSTRAINT items_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Optional: index for faster dashboard queries
CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);