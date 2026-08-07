import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Item } from '@/types/database';

export interface ItemMatch {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  match_score: number;
  match_reason: string | null;
  status: 'pending' | 'confirmed' | 'dismissed';
  created_at: string;
  lost_item?: Item;
  found_item?: Item;
}

export const useItemMatches = (itemId?: string) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<ItemMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    if (!user) {
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('item_matches')
        .select(`
          *,
          lost_item:items!item_matches_lost_item_id_fkey(*),
          found_item:items!item_matches_found_item_id_fkey(*)
        `)
        .neq('status', 'dismissed')
        .order('match_score', { ascending: false });

      if (itemId) {
        query = query.or(`lost_item_id.eq.${itemId},found_item_id.eq.${itemId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMatches((data || []) as unknown as ItemMatch[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const updateMatchStatus = async (matchId: string, status: 'confirmed' | 'dismissed') => {
    const { error } = await supabase
      .from('item_matches')
      .update({ status })
      .eq('id', matchId);

    if (!error) {
      if (status === 'dismissed') {
        setMatches(prev => prev.filter(m => m.id !== matchId));
      } else {
        setMatches(prev =>
          prev.map(m => (m.id === matchId ? { ...m, status } : m))
        );
      }
    }

    return { error };
  };

  const findMatches = async (itemId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('find-matches', {
        body: { itemId },
      });

      if (error) throw error;

      // Refetch matches after finding new ones
      await fetchMatches();

      return { data, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Failed to find matches') };
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [user, itemId]);

  return {
    matches,
    loading,
    error,
    updateMatchStatus,
    findMatches,
    refetch: fetchMatches,
  };
};
