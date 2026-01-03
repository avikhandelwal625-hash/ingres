// Python FastAPI Backend API

// Configure this to your FastAPI backend URL
export const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

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

// ============= Chat Streaming =============

export async function streamChat({
  messages,
  conversationId,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  conversationId?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}) {
  try {
    const resp = await fetch(`${PYTHON_API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages,
        conversation_id: conversationId,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: 'Request failed' }));
      onError(errorData.error || errorData.detail || `Request failed with status ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError('No response body');
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          // Support both OpenAI-style and custom formats
          const content = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? parsed.text;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? parsed.text;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error('Stream error:', error);
    onError(error instanceof Error ? error.message : 'Connection failed');
  }
}

// ============= Conversations CRUD =============

export async function fetchConversations(): Promise<Conversation[]> {
  const resp = await fetch(`${PYTHON_API_URL}/conversations`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!resp.ok) {
    throw new Error(`Failed to fetch conversations: ${resp.status}`);
  }
  
  return resp.json();
}

export async function createConversation(title: string): Promise<Conversation> {
  const resp = await fetch(`${PYTHON_API_URL}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  
  if (!resp.ok) {
    throw new Error(`Failed to create conversation: ${resp.status}`);
  }
  
  return resp.json();
}

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  const resp = await fetch(`${PYTHON_API_URL}/conversations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  
  if (!resp.ok) {
    throw new Error(`Failed to update conversation: ${resp.status}`);
  }
  
  return resp.json();
}

export async function deleteConversationApi(id: string): Promise<void> {
  const resp = await fetch(`${PYTHON_API_URL}/conversations/${id}`, {
    method: 'DELETE',
  });
  
  if (!resp.ok) {
    throw new Error(`Failed to delete conversation: ${resp.status}`);
  }
}

// ============= Messages CRUD =============

export async function fetchMessages(conversationId: string): Promise<MessageRecord[]> {
  const resp = await fetch(`${PYTHON_API_URL}/conversations/${conversationId}/messages`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!resp.ok) {
    throw new Error(`Failed to fetch messages: ${resp.status}`);
  }
  
  return resp.json();
}

export async function saveMessageApi(
  conversationId: string, 
  role: 'user' | 'assistant', 
  content: string
): Promise<MessageRecord> {
  const resp = await fetch(`${PYTHON_API_URL}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, content }),
  });
  
  if (!resp.ok) {
    throw new Error(`Failed to save message: ${resp.status}`);
  }
  
  return resp.json();
}
