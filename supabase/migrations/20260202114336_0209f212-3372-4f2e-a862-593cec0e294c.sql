-- Create point transaction types
CREATE TYPE public.point_action AS ENUM (
  'found_item_posted',
  'item_returned',
  'false_claim',
  'reported_misuse',
  'report_verified'
);

-- Create user_points table to track total points
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create point_transactions table for audit trail
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action_type point_action NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_points (public read, system write)
CREATE POLICY "User points are viewable by everyone"
ON public.user_points FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own points record"
ON public.user_points FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update points"
ON public.user_points FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for point_transactions
CREATE POLICY "Users can view their own transactions"
ON public.point_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
ON public.point_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert transactions"
ON public.point_transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update transactions"
ON public.point_transactions FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to award points (only for verified actions)
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id UUID,
  _points INTEGER,
  _action_type point_action,
  _item_id UUID DEFAULT NULL,
  _verified BOOLEAN DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if verified
  IF NOT _verified THEN
    -- Insert unverified transaction for later processing
    INSERT INTO public.point_transactions (user_id, points, action_type, item_id, verified)
    VALUES (_user_id, _points, _action_type, _item_id, false);
    RETURN;
  END IF;

  -- Insert verified transaction
  INSERT INTO public.point_transactions (user_id, points, action_type, item_id, verified)
  VALUES (_user_id, _points, _action_type, _item_id, true);

  -- Upsert user_points
  INSERT INTO public.user_points (user_id, total_points, updated_at)
  VALUES (_user_id, _points, now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_points = public.user_points.total_points + _points,
    updated_at = now();
END;
$$;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  total_points INTEGER,
  rank BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    up.user_id,
    up.total_points,
    ROW_NUMBER() OVER (ORDER BY up.total_points DESC) as rank
  FROM public.user_points up
  WHERE up.total_points > 0
  ORDER BY up.total_points DESC
  LIMIT _limit;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();