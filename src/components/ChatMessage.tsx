import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isAssistant = role === 'assistant';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-xl animate-fade-in',
        isAssistant ? 'bg-secondary/50' : 'bg-transparent'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
          isAssistant ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isAssistant ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-medium mb-1 text-muted-foreground">
          {isAssistant ? 'INGRES Assistant' : 'You'}
        </p>
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="whitespace-pre-wrap leading-relaxed">
            {content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
