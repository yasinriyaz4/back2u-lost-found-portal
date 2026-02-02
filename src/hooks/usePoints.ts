import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  rank: number;
  profile?: {
    name: string;
    avatar_url: string | null;
  };
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  action_type: string;
  item_id: string | null;
  verified: boolean;
  created_at: string;
}

// Point values for different actions
export const POINT_VALUES = {
  found_item_posted: 10,
  item_returned: 50,
  false_claim: -25,
  reported_misuse: -15,
  report_verified: 5,
} as const;

export const usePoints = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current user's points
  const { data: userPoints, isLoading: pointsLoading } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['point-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as PointTransaction[];
    },
    enabled: !!user,
  });

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // Use the database function to get ranked leaderboard
      const { data, error } = await supabase.rpc('get_leaderboard', { _limit: 20 });
      
      if (error) throw error;
      
      // Fetch profiles for leaderboard entries
      const userIds = (data as LeaderboardEntry[]).map(entry => entry.user_id);
      
      if (userIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data as LeaderboardEntry[]).map(entry => ({
        ...entry,
        profile: profileMap.get(entry.user_id),
      }));
    },
  });

  // Award points mutation (for verified actions)
  const awardPoints = useMutation({
    mutationFn: async ({ 
      userId, 
      actionType, 
      itemId, 
      verified = true 
    }: {
      userId: string;
      actionType: keyof typeof POINT_VALUES;
      itemId?: string;
      verified?: boolean;
    }) => {
      const points = POINT_VALUES[actionType];
      
      const { error } = await supabase.rpc('award_points', {
        _user_id: userId,
        _points: points,
        _action_type: actionType,
        _item_id: itemId || null,
        _verified: verified,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  // Get user's rank
  const userRank = leaderboard?.find(entry => entry.user_id === user?.id)?.rank;

  return {
    userPoints: userPoints?.total_points ?? 0,
    transactions: transactions ?? [],
    leaderboard: leaderboard ?? [],
    userRank,
    pointsLoading,
    transactionsLoading,
    leaderboardLoading,
    awardPoints,
  };
};
