import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Message, Profile } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader } from '@/components/ui/loader';
import { Send, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface ChatThreadProps {
  otherUserId: string;
  otherProfile: Profile | null;
  itemId?: string;
  onBack: () => void;
}

export const ChatThread = ({ otherUserId, otherProfile, itemId, onBack }: ChatThreadProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages for this conversation
  const fetchMessages = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
      
      // Mark unread messages as read
      const unreadIds = data
        .filter(m => m.to_user_id === user.id && !m.is_read)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${user?.id}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.from_user_id === user?.id && newMsg.to_user_id === otherUserId) ||
            (newMsg.from_user_id === otherUserId && newMsg.to_user_id === user?.id)
          ) {
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if it's for us
            if (newMsg.to_user_id === user?.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMsg.id);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to typing indicator via presence
    const presenceChannel = supabase
      .channel(`typing:${[user?.id, otherUserId].sort().join(':')}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const otherUserPresence = Object.values(state).flat().find(
          (p: any) => p.user_id === otherUserId && p.typing
        );
        setIsTyping(!!otherUserPresence);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user?.id, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const { error } = await supabase
      .from('messages')
      .insert({
        from_user_id: user.id,
        to_user_id: otherUserId,
        content: newMessage.trim(),
        item_id: itemId || null,
      });

    if (!error) {
      setNewMessage('');
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    // Broadcast typing indicator
    const channel = supabase.channel(`typing:${[user?.id, otherUserId].sort().join(':')}`);
    channel.track({ user_id: user?.id, typing: true });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ user_id: user?.id, typing: false });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherProfile?.avatar_url || undefined} />
          <AvatarFallback>
            {otherProfile?.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{otherProfile?.name || 'Unknown User'}</h3>
          {isTyping && (
            <p className="text-xs text-muted-foreground animate-pulse">typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isFromMe = msg.from_user_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isFromMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
            {sending ? <Loader size="sm" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
