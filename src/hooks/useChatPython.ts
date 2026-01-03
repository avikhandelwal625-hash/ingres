import { useState, useCallback, useEffect } from 'react';
import { 
  sendChatMessage,
  fetchConversations, 
  fetchMessages,
  type Conversation,
} from '@/lib/pythonApi';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function useChatPython() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    try {
      const data = await fetchMessages(convId);
      setMessages(data?.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) || []);
      setConversationId(convId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);

    // Add user message to UI
    const userMsgId = crypto.randomUUID();
    const userMessage: Message = { id: userMsgId, role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder assistant message
    const assistantMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);

    try {
      // Send to backend
      const response = await sendChatMessage(
        [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        conversationId
      );

      // Update conversation ID if new
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
        loadConversations(); // Refresh list
      }

      // Update assistant message with reply
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, content: response.reply, isStreaming: false }
            : m
        )
      );
    } catch (error) {
      console.error('Chat error:', error);
      // Remove placeholder on error
      setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, conversationId, loadConversations, toast]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  // Delete conversation (stub - no endpoint provided)
  const deleteConversation = useCallback(async (convId: string) => {
    toast({
      title: 'Not implemented',
      description: 'Delete endpoint not available',
      variant: 'destructive',
    });
    return false;
  }, [toast]);

  // Rename conversation (stub - no endpoint provided)
  const renameConversation = useCallback(async (convId: string, newTitle: string) => {
    toast({
      title: 'Not implemented',
      description: 'Rename endpoint not available',
      variant: 'destructive',
    });
    return false;
  }, [toast]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    messages,
    isLoading,
    sendMessage,
    conversations,
    loadMessages,
    startNewChat,
    conversationId,
    deleteConversation,
    renameConversation,
  };
}
