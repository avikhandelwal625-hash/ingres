// Python FastAPI Backend API

export const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://127.0.0.1:8000';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at?: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatResponse {
  conversation_id: string;
  reply: string;
}

// ============= Chat =============

export async function sendChatMessage(
  messages: Message[],
  conversationId?: string | null
): Promise<ChatResponse> {
  const resp = await fetch(`${PYTHON_API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId || null,
      messages,
    }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || errorData.detail || `Request failed with status ${resp.status}`);
  }

  return resp.json();
}

// ============= Conversations =============

export async function fetchConversations(): Promise<Conversation[]> {
  const resp = await fetch(`${PYTHON_API_URL}/chat/conversations`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch conversations: ${resp.status}`);
  }

  return resp.json();
}

// ============= Messages =============

export async function fetchMessages(conversationId: string): Promise<MessageRecord[]> {
  const resp = await fetch(`${PYTHON_API_URL}/chat/${conversationId}/messages`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch messages: ${resp.status}`);
  }

  return resp.json();
}
