import { useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { QuickActions } from '@/components/QuickActions';
import { ChatHistory } from '@/components/ChatHistory';
import { useChat } from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Index = () => {
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    conversations, 
    loadMessages, 
    startNewChat,
    conversationId 
  } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

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

  const hasMessages = messages.length > 0;

  const ChatHistoryPanel = () => (
    <ChatHistory
      conversations={conversations}
      currentId={conversationId}
      onSelect={loadMessages}
      onNewChat={startNewChat}
    />
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64">
        <ChatHistoryPanel />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center border-b border-border">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden m-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <ChatHistoryPanel />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <Header />
          </div>
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          {!hasMessages ? (
            <WelcomeScreen onQuickAction={sendMessage} />
          ) : (
            <ScrollArea ref={scrollAreaRef} className="flex-1">
              <div className="max-w-4xl mx-auto px-4 py-6 space-y-2">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={msg.isStreaming}
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
                  <QuickActions onSelect={sendMessage} />
                </div>
              )}
              <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
