import { Message, Profile } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Conversation {
  otherUserId: string;
  otherProfile: Profile | null;
  lastMessage: Message;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedUserId: string | null;
  onSelect: (userId: string, profile: Profile | null) => void;
}

export const ConversationList = ({
  conversations,
  selectedUserId,
  onSelect,
}: ConversationListProps) => {
  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p className="text-4xl mb-2">💬</p>
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map((conv) => (
        <button
          key={conv.otherUserId}
          onClick={() => onSelect(conv.otherUserId, conv.otherProfile)}
          className={`w-full p-4 flex items-start gap-3 hover:bg-accent/50 transition-colors text-left ${
            selectedUserId === conv.otherUserId ? 'bg-accent' : ''
          }`}
        >
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={conv.otherProfile?.avatar_url || undefined} />
            <AvatarFallback>
              {conv.otherProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">
                {conv.otherProfile?.name || 'Unknown User'}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {format(new Date(conv.lastMessage.created_at), 'MMM d')}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className="text-sm text-muted-foreground truncate">
                {conv.lastMessage.content}
              </p>
              {conv.unreadCount > 0 && (
                <Badge variant="default" className="shrink-0">
                  {conv.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
