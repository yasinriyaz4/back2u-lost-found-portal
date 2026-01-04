import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Item, ItemCategory, ItemStatus } from '@/types/database';

interface ItemFilters {
  search?: string;
  category?: ItemCategory | 'all';
  status?: ItemStatus | 'all';
  startDate?: string;
  endDate?: string;
  userId?: string;
}

interface UseItemsOptions {
  filters?: ItemFilters;
  page?: number;
  limit?: number;
}

export const useItems = (options: UseItemsOptions = {}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const { filters = {}, page = 1, limit = 12 } = options;

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('items')
        .select('*, profiles(*)', { count: 'exact' });

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
        );
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('item_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('item_date', filters.endDate);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setItems((data || []) as unknown as Item[]);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [JSON.stringify(filters), page, limit]);

  return { items, loading, error, totalCount, refetch: fetchItems };
};

export const useItem = (id: string | undefined) => {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchItem = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*, profiles(*)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setItem(data as unknown as Item);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  return { item, loading, error };
};
