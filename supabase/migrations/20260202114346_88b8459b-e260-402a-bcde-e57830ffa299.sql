-- Drop the overly permissive policies
DROP POLICY IF EXISTS "System can insert transactions" ON public.point_transactions;

-- Create more restrictive insert policy (only via the award_points function which is SECURITY DEFINER)
CREATE POLICY "Users can insert their own transactions"
ON public.point_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);