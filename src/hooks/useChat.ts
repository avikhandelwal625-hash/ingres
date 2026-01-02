import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { streamChat } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { toast } = useToast();

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }
    
    setConversations(data || []);
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading messages:', error);
      return;
    }
    
    setMessages(data?.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })) || []);
    setConversationId(convId);
  }, []);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({ title })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    
    setConversationId(data.id);
    loadConversations();
    return data.id;
  }, [loadConversations]);

  // Save message to database
  const saveMessage = useCallback(async (convId: string, role: 'user' | 'assistant', content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, role, content })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving message:', error);
      return null;
    }
    
    return data.id;
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      convId = await createConversation(content);
      if (!convId) {
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to create conversation',
          variant: 'destructive',
        });
        return;
      }
    }

    // Add user message
    const userMsgId = crypto.randomUUID();
    const userMessage: Message = { id: userMsgId, role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message
    await saveMessage(convId, 'user', content);

    // Add placeholder assistant message
    const assistantMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }]);

    let fullResponse = '';

    await streamChat({
      messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
      onDelta: (delta) => {
        fullResponse += delta;
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantMsgId 
              ? { ...m, content: fullResponse }
              : m
          )
        );
      },
      onDone: async () => {
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantMsgId 
              ? { ...m, isStreaming: false }
              : m
          )
        );
        
        // Save assistant message
        if (fullResponse && convId) {
          await saveMessage(convId, 'assistant', fullResponse);
        }
        
        setIsLoading(false);
      },
      onError: (error) => {
        console.error('Chat error:', error);
        setMessages(prev => prev.filter(m => m.id !== assistantMsgId));
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        setIsLoading(false);
      },
    });
  }, [messages, isLoading, conversationId, createConversation, saveMessage, toast]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (convId: string) => {
    // Delete messages first (foreign key constraint)
    const { error: msgError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', convId);
    
    if (msgError) {
      console.error('Error deleting messages:', msgError);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
      return false;
    }

    // Delete conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', convId);
    
    if (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive',
      });
      return false;
    }

    // Clear current chat if we deleted it
    if (conversationId === convId) {
      setMessages([]);
      setConversationId(null);
    }

    loadConversations();
    toast({
      title: 'Deleted',
      description: 'Conversation deleted successfully',
    });
    return true;
  }, [conversationId, loadConversations, toast]);

  // Rename conversation
  const renameConversation = useCallback(async (convId: string, newTitle: string) => {
    const { error } = await supabase
      .from('conversations')
      .update({ title: newTitle })
      .eq('id', convId);
    
    if (error) {
      console.error('Error renaming conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to rename conversation',
        variant: 'destructive',
      });
      return false;
    }

    loadConversations();
    return true;
  }, [loadConversations, toast]);

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
