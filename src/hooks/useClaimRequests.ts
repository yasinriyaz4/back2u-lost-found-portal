import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClaimRequest {
  id: string;
  item_id: string;
  claimer_id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  claimer?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

export const useClaimRequests = (itemId: string | undefined) => {
  const { user } = useAuth();
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [userClaimRequest, setUserClaimRequest] = useState<ClaimRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClaimRequests = useCallback(async () => {
    if (!itemId || !user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('claim_requests')
        .select('*, claimer:profiles!claim_requests_claimer_id_fkey(id, name, email, avatar_url)')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requests = (data || []) as unknown as ClaimRequest[];
      setClaimRequests(requests);
      setUserClaimRequest(requests.find(r => r.claimer_id === user.id) || null);
    } catch (err) {
      console.error('Failed to fetch claim requests:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId, user]);

  useEffect(() => {
    fetchClaimRequests();
  }, [fetchClaimRequests]);

  const submitClaimRequest = async (message: string) => {
    if (!itemId || !user) return { error: 'Not authenticated' };

    const { error } = await supabase.from('claim_requests').insert({
      item_id: itemId,
      claimer_id: user.id,
      message: message || null,
    });

    if (!error) await fetchClaimRequests();
    return { error: error?.message || null };
  };

  const updateClaimRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('claim_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (!error) await fetchClaimRequests();
    return { error: error?.message || null };
  };

  const cancelClaimRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('claim_requests')
      .delete()
      .eq('id', requestId);

    if (!error) await fetchClaimRequests();
    return { error: error?.message || null };
  };

  return {
    claimRequests,
    userClaimRequest,
    loading,
    submitClaimRequest,
    updateClaimRequestStatus,
    cancelClaimRequest,
    refetch: fetchClaimRequests,
  };
};
