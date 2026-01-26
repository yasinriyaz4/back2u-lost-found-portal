import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Profile } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

type MessageWithProfiles = Message & {
  from_profile?: Profile;
  to_profile?: Profile;
};

async function fetchProfilesForUsers(userIds: string[]): Promise<Map<string, Profile>> {
  if (!userIds.length) return new Map();
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  const map = new Map<string, Profile>();
  data?.forEach(profile => map.set(profile.id, profile));
  return map;
}

export function useMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = messages.filter(m => m.to_user_id === user?.id && !m.is_read).length;

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*, item:items(*)')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      if (!data?.length) {
        setMessages([]);
        return;
      }

      const userIds = [...new Set(data.flatMap(m => [m.from_user_id, m.to_user_id]))];
      const profiles = await fetchProfilesForUsers(userIds);

      setMessages(data.map(msg => ({
        ...msg,
        from_profile: profiles.get(msg.from_user_id),
        to_profile: profiles.get(msg.to_user_id),
      })) as MessageWithProfiles[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendMessage = useCallback(async (toUserId: string, content: string, itemId?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase.from('messages').insert({
      from_user_id: user.id,
      to_user_id: toUserId,
      content,
      item_id: itemId ?? null,
    });

    if (!error) fetchMessages();
    return { error };
  }, [user, fetchMessages]);

  const markAsRead = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) fetchMessages();
    return { error };
  }, [fetchMessages]);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user, fetchMessages]);

  return { messages, loading, error, unreadCount, sendMessage, markAsRead, refetch: fetchMessages };
}
