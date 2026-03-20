import './index.css';
import { useState, useEffect, useRef } from 'react';
import { useChat } from './hooks/useChat';
import { useSettings } from './hooks/useSettings';
import { useConversations } from './hooks/useConversations';
import { ChatWindow } from './components/ChatWindow';
import { InputBar } from './components/InputBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ConversationSidebar } from './components/ConversationSidebar';
import { AVAILABLE_MODELS, DEFAULT_SETTINGS } from './types';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function App() {
  const { messages, setMessages, isStreaming, error, sendMessage, stopStreaming, editAndResend, clearMessages } = useChat();
  const { settings, setSettings } = useSettings();
  const isMobile = useIsMobile();

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => window.innerWidth >= 768);

  // Auto-close sidebars when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setLeftSidebarOpen(false);
    }
  }, [isMobile]);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === settings.model);

  const {
    conversations,
    activeId,
    createConversation,
    updateConversation,
    switchConversation,
    deleteConversation,
    updateTitle,
  } = useConversations(settings.model);

  const activeIdRef = useRef(activeId);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  useEffect(() => {
    if (activeIdRef.current && messages.length > 0) {
      updateConversation(activeIdRef.current, messages);
    }
  }, [messages, updateConversation]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'k') { e.preventDefault(); handleNewChat(); }
      if (mod && e.key === '/') { e.preventDefault(); setSidebarOpen(prev => !prev); }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSend(content: string) {
    if (!activeIdRef.current) {
      const id = createConversation();
      activeIdRef.current = id;
    }
    sendMessage(content, settings);
  }

  function handleNewChat() {
    clearMessages();
    createConversation();
  }

  function handleSwitch(id: string) {
    const msgs = switchConversation(id);
    setMessages(msgs);
    if (isMobile) setLeftSidebarOpen(false);
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('chatSettings');
  }

  function handleRegenerate(index: number) {
    if (index > 0 && messages[index - 1]?.role === 'user') {
      editAndResend(index - 1, messages[index - 1].content, settings);
    }
  }

  function handleRetry() {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { editAndResend(i, messages[i].content, settings); return; }
    }
  }

  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #07070a 55%, #0d0a14 100%)' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Content */}
      <div className="flex w-full h-full" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Left sidebar ── */}
        {isMobile ? (
          <>
            {leftSidebarOpen && (
              <div
                onClick={() => setLeftSidebarOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 38, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
              />
            )}
            <div style={{
              position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 39, width: 240,
              transform: leftSidebarOpen ? 'translateX(0)' : 'translateX(-240px)',
              transition: `transform 0.3s ${EASING}`,
            }}>
              <ConversationSidebar
                conversations={conversations}
                activeId={activeId}
                onNew={handleNewChat}
                onSwitch={handleSwitch}
                onDelete={deleteConversation}
                onRename={updateTitle}
              />
            </div>
          </>
        ) : (
          <div style={{ width: leftSidebarOpen ? 240 : 0, flexShrink: 0, overflow: 'hidden', transition: `width 0.3s ${EASING}` }}>
            <div style={{ width: 240, height: '100%', transform: leftSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: `transform 0.3s ${EASING}` }}>
              <ConversationSidebar
                conversations={conversations}
                activeId={activeId}
                onNew={handleNewChat}
                onSwitch={handleSwitch}
                onDelete={deleteConversation}
                onRename={updateTitle}
              />
            </div>
          </div>
        )}

        {/* ── Main chat area ── */}
        <div className="flex flex-col flex-1 min-w-0" style={{ position: 'relative' }}>
          <ChatWindow
            messages={messages}
            error={error}
            onEditMessage={(index, newContent) => editAndResend(index, newContent, settings)}
            onRegenerate={handleRegenerate}
            onRetry={handleRetry}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            leftSidebarOpen={leftSidebarOpen}
            onToggleLeftSidebar={() => setLeftSidebarOpen(v => !v)}
          />
          <InputBar
            onSend={handleSend}
            onStop={stopStreaming}
            disabled={isStreaming}
            model={currentModel?.label ?? settings.model}
          />
        </div>

        {/* ── Settings panel — centered overlay ── */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
          />
        )}
        <div style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: sidebarOpen
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.95)',
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          zIndex: 49,
          transition: `transform 0.25s ${EASING}, opacity 0.2s`,
        }}>
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            onReset={handleReset}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

      </div>
    </div>
  );
}

export default App;
