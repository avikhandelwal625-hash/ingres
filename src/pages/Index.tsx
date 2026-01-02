import { useRef, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { QuickActions } from '@/components/QuickActions';
import { ChatHistory } from '@/components/ChatHistory';
import { GroundwaterCharts } from '@/components/GroundwaterCharts';
import IndiaMap from '@/components/IndiaMap';
import { useChat } from '@/hooks/useChat';
import { useLanguage } from '@/hooks/useLanguage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, BarChart3, X, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

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
  const { t } = useLanguage();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [showMap, setShowMap] = useState(false);

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

  const MainContent = () => (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
      <div className="flex items-center border-b border-border bg-background z-10 flex-shrink-0">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden m-2 flex-shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <ChatHistoryPanel />
          </SheetContent>
        </Sheet>
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <Header />
        </div>
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        {!hasMessages ? (
          <WelcomeScreen onQuickAction={sendMessage} />
        ) : (
          <ScrollArea ref={scrollAreaRef} className="flex-1">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
              {/* Toggle Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant={showMap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                  className="gap-2"
                >
                  {showMap ? <X className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                  {showMap ? 'Hide Map' : 'View Map'}
                </Button>
                <Button
                  variant={showCharts ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCharts(!showCharts)}
                  className="gap-2"
                >
                  {showCharts ? <X className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                  {showCharts ? t('hideCharts') : t('viewCharts')}
                </Button>
              </div>

              {/* Map */}
              {showMap && (
                <div className="animate-fade-in">
                  <IndiaMap />
                </div>
              )}

              {/* Charts */}
              {showCharts && (
                <div className="animate-fade-in">
                  <GroundwaterCharts />
                </div>
              )}

              {/* Messages */}
              <div className="space-y-2">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={msg.isStreaming}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Chat Input */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-lg flex-shrink-0">
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
  );

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Mobile Layout - no resizable panels */}
      <div className="md:hidden h-full">
        <MainContent />
      </div>

      {/* Desktop Layout - with resizable panels */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar Panel */}
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={35}
            className="bg-card"
          >
            <ChatHistoryPanel />
          </ResizablePanel>
          
          {/* Resize Handle */}
          <ResizableHandle withHandle />
          
          {/* Main Content Panel */}
          <ResizablePanel defaultSize={80} minSize={50}>
            <MainContent />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;