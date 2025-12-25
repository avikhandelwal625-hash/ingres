import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface ChatHistoryProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function ChatHistory({ conversations, currentId, onSelect, onNewChat }: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <Button 
          onClick={onNewChat}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  "hover:bg-accent/50 flex items-center gap-2",
                  currentId === conv.id && "bg-accent"
                )}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {conv.title || 'New conversation'}
                </span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
