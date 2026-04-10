import { useState, useCallback, useEffect, useRef } from 'react';
import type { Conversation, Message } from '../types';

function loadFromStorage(key: string): Conversation[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key: string, conversations: Conversation[]) {
  localStorage.setItem(key, JSON.stringify(conversations));
}

export function useConversations(currentModel: string, storageKey: string) {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadFromStorage(storageKey));
  const [activeId, setActiveId] = useState<string | null>(null);
  const prevKeyRef = useRef(storageKey);

  // When the user switches account (or guest ↔ login), reload from the new key
  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      prevKeyRef.current = storageKey;
      setConversations(loadFromStorage(storageKey));
      setActiveId(null);
    }
  }, [storageKey]);

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
      saveToStorage(prevKeyRef.current, updated);
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
        const rawContent = firstUserMsg?.content;
        const text = typeof rawContent === 'string' ? rawContent : '';
        const title = text ? text.slice(0, 40) + (text.length > 40 ? '…' : '') : conv.title;
        return { ...conv, messages, title };
      });
      saveToStorage(prevKeyRef.current, updated);
      return updated;
    });
  }, []);

  const switchConversation = useCallback((id: string): Message[] => {
    setActiveId(id);
    const conv = loadFromStorage(prevKeyRef.current).find(c => c.id === id);
    return conv?.messages ?? [];
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToStorage(prevKeyRef.current, updated);
      return updated;
    });
    setActiveId(prev => (prev === id ? null : prev));
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setConversations(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, title } : c);
      saveToStorage(prevKeyRef.current, updated);
      return updated;
    });
  }, []);

  return { conversations, activeId, createConversation, updateConversation, switchConversation, deleteConversation, updateTitle };
}
