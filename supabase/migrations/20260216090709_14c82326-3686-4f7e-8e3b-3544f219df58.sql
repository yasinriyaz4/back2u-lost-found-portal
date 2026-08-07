
CREATE OR REPLACE FUNCTION public.get_leaderboard_by_period(_limit integer DEFAULT 10, _start_date timestamptz DEFAULT NULL)
 RETURNS TABLE(user_id uuid, total_points bigint, rank bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    pt.user_id,
    SUM(pt.points)::bigint as total_points,
    ROW_NUMBER() OVER (ORDER BY SUM(pt.points) DESC) as rank
  FROM public.point_transactions pt
  WHERE pt.verified = true
    AND (_start_date IS NULL OR pt.created_at >= _start_date)
  GROUP BY pt.user_id
  HAVING SUM(pt.points) > 0
  ORDER BY total_points DESC
  LIMIT _limit;
$function$;
