import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export const useMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_user_id_fkey(*),
          to_profile:profiles!messages_to_user_id_fkey(*),
          item:items(*)
        `)
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMessages(data as unknown as Message[]);
      setUnreadCount(data?.filter(m => m.to_user_id === user.id && !m.is_read).length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (toUserId: string, content: string, itemId?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('messages')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        content,
        item_id: itemId || null
      });

    if (!error) {
      fetchMessages();
    }

    return { error };
  };

  const markAsRead = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (!error) {
      fetchMessages();
    }

    return { error };
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  return { messages, loading, error, unreadCount, sendMessage, markAsRead, refetch: fetchMessages };
};
