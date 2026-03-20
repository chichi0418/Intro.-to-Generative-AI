import { useState, useCallback } from 'react';
import type { Conversation, Message } from '../types';

const STORAGE_KEY = 'chatConversations';

function loadFromStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function useConversations(currentModel: string) {
  const [conversations, setConversations] = useState<Conversation[]>(loadFromStorage);
  const [activeId, setActiveId] = useState<string | null>(null);

  const createConversation = useCallback(() => {
    const id = crypto.randomUUID();
    const newConv: Conversation = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: Date.now(),
      model: currentModel,
    };
    setConversations(prev => {
      const updated = [newConv, ...prev];
      saveToStorage(updated);
      return updated;
    });
    setActiveId(id);
    return id;
  }, [currentModel]);

  const updateConversation = useCallback((id: string, messages: Message[]) => {
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id !== id) return conv;
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg
          ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '…' : '')
          : conv.title;
        return { ...conv, messages, title };
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const switchConversation = useCallback((id: string): Message[] => {
    setActiveId(id);
    const conv = loadFromStorage().find(c => c.id === id);
    return conv?.messages ?? [];
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToStorage(updated);
      return updated;
    });
    setActiveId(prev => (prev === id ? null : prev));
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setConversations(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, title } : c);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return { conversations, activeId, createConversation, updateConversation, switchConversation, deleteConversation, updateTitle };
}
