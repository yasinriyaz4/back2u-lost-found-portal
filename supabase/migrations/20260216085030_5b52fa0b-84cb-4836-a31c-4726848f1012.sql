CREATE OR REPLACE FUNCTION public.award_points(_user_id uuid, _points integer, _action_type point_action, _item_id uuid DEFAULT NULL::uuid, _verified boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if verified
  IF NOT _verified THEN
    INSERT INTO public.point_transactions (user_id, points, action_type, item_id, verified)
    VALUES (_user_id, _points, _action_type, _item_id, false);
    RETURN;
  END IF;

  -- Prevent duplicate points for the same item and action
  IF _item_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.point_transactions
      WHERE user_id = _user_id
        AND item_id = _item_id
        AND action_type = _action_type
        AND verified = true
    ) THEN
      RETURN; -- Already awarded, skip
    END IF;
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
$function$