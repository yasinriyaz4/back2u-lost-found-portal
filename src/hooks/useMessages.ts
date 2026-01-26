import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message, Profile } from '@/types/database';
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
      // Fetch messages without the profile join hints
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*, item:items(*)')
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      // Get unique user IDs from messages
      const userIds = new Set<string>();
      messagesData.forEach(m => {
        userIds.add(m.from_user_id);
        userIds.add(m.to_user_id);
      });

      // Fetch all profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      // Create a map of profiles
      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach(p => profilesMap.set(p.id, p as Profile));

      // Combine messages with profile data
      const messagesWithProfiles = messagesData.map(m => ({
        ...m,
        from_profile: profilesMap.get(m.from_user_id),
        to_profile: profilesMap.get(m.to_user_id),
      }));
      
      setMessages(messagesWithProfiles as unknown as Message[]);
      setUnreadCount(messagesData?.filter(m => m.to_user_id === user.id && !m.is_read).length || 0);
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
