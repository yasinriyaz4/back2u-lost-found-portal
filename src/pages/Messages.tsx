import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/hooks/useMessages';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MessageSquare, User, Package, Check } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { messages, loading, markAsRead } = useMessages();

  const handleMarkAsRead = async (messageId: string) => {
    await markAsRead(messageId);
  };

  if (!user) {
    return null;
  }

  // Group messages by conversation (other user)
  const conversations = messages.reduce((acc, msg) => {
    const otherUserId = msg.from_user_id === user.id ? msg.to_user_id : msg.from_user_id;
    if (!acc[otherUserId]) {
      acc[otherUserId] = [];
    }
    acc[otherUserId].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>);

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : messages.length === 0 ? (
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
          <div className="space-y-4">
            {messages.map((msg) => {
              const isFromMe = msg.from_user_id === user.id;
              const otherProfile = isFromMe ? msg.to_profile : msg.from_profile;
              
              return (
                <Card 
                  key={msg.id} 
                  className={`transition-colors ${!msg.is_read && !isFromMe ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {isFromMe ? `To: ${otherProfile?.name || 'Unknown'}` : `From: ${otherProfile?.name || 'Unknown'}`}
                          </span>
                          {!msg.is_read && !isFromMe && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {msg.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}</span>
                          {msg.item_id && (
                            <Link 
                              to={`/items/${msg.item_id}`} 
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              <Package className="h-3 w-3" />
                              View Item
                            </Link>
                          )}
                        </div>
                      </div>
                      {!msg.is_read && !isFromMe && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(msg.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Messages;
