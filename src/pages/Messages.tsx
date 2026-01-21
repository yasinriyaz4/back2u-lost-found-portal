import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { ChatThread } from '@/components/messages/ChatThread';
import { ConversationList } from '@/components/messages/ConversationList';
import { Profile } from '@/types/database';

const Messages = () => {
  const { user } = useAuth();
  const { messages, loading } = useMessages();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Group messages into conversations
  const conversations = useMemo(() => {
    if (!user) return [];

    const convMap = new Map<string, {
      otherUserId: string;
      otherProfile: Profile | null;
      messages: typeof messages;
      lastMessage: typeof messages[0];
      unreadCount: number;
    }>();

    messages.forEach((msg) => {
      const otherUserId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
      const otherProfile = msg.from_user_id === user.id ? msg.to_profile : msg.from_profile;

      if (!convMap.has(otherUserId)) {
        convMap.set(otherUserId, {
          otherUserId,
          otherProfile: otherProfile || null,
          messages: [],
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      const conv = convMap.get(otherUserId)!;
      conv.messages.push(msg);
      
      // Update last message if this one is newer
      if (new Date(msg.created_at) > new Date(conv.lastMessage.created_at)) {
        conv.lastMessage = msg;
      }

      // Count unread
      if (msg.to_user_id === user.id && !msg.is_read) {
        conv.unreadCount++;
      }
    });

    // Sort by last message date
    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    );
  }, [messages, user]);

  const handleSelectConversation = (userId: string, profile: Profile | null) => {
    setSelectedUserId(userId);
    setSelectedProfile(profile);
  };

  const handleBack = () => {
    setSelectedUserId(null);
    setSelectedProfile(null);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>

        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-muted-foreground mb-4">No messages yet</p>
              <Button asChild>
                <Link to="/items">Browse items to contact owners</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="flex h-[600px]">
              {/* Conversation List - Hidden on mobile when chat is open */}
              <div className={`w-full md:w-80 border-r border-border overflow-y-auto ${selectedUserId ? 'hidden md:block' : ''}`}>
                <div className="p-4 border-b border-border bg-muted/30">
                  <h2 className="font-semibold">Conversations</h2>
                </div>
                <ConversationList
                  conversations={conversations}
                  selectedUserId={selectedUserId}
                  onSelect={handleSelectConversation}
                />
              </div>

              {/* Chat Thread */}
              <div className={`flex-1 ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
                {selectedUserId ? (
                  <ChatThread
                    otherUserId={selectedUserId}
                    otherProfile={selectedProfile}
                    onBack={handleBack}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Messages;
