import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { QuickActions } from '@/components/QuickActions';
import { streamChat, type Message } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (input: string) => {
    const userMsg: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = '';

    const upsertAssistant = (nextChunk: string) => {
      assistantSoFar += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: [...messages, userMsg],
      onDelta: (chunk) => upsertAssistant(chunk),
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
      },
    });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden">
        {!hasMessages ? (
          <WelcomeScreen onQuickAction={handleSend} />
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-2">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={isLoading && idx === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Chat Input */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
            {hasMessages && !isLoading && (
              <div className="flex flex-wrap gap-2">
                <QuickActions onSelect={handleSend} />
              </div>
            )}
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
