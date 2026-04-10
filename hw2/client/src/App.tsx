import './index.css';
import { useState, useEffect, useRef } from 'react';
import { useChat } from './hooks/useChat';
import { useSettings } from './hooks/useSettings';
import { useConversations } from './hooks/useConversations';
import { ChatWindow } from './components/ChatWindow';
import { InputBar } from './components/InputBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ConversationSidebar } from './components/ConversationSidebar';
import { AuthModal } from './components/AuthModal';
import { AVAILABLE_MODELS, DEFAULT_SETTINGS } from './types';
import type { ContentPart } from './types';
import { getStoredToken, getStoredUsername, logout } from './api/authApi';

type ThemeMode = 'light' | 'dark';

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
  const { messages, setMessages, isStreaming, error, errorCode, sendMessage, stopStreaming, editAndResend, clearMessages } = useChat();
  const { settings, setSettings } = useSettings();
  const isMobile = useIsMobile();

  // Auth state
  const [authUser, setAuthUser] = useState<string | null>(() => getStoredToken() ? getStoredUsername() : null);
  const [showAuthModal, setShowAuthModal] = useState(() => !getStoredToken() && !localStorage.getItem('guestMode'));

  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('uiTheme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [keyQuotaNotice, setKeyQuotaNotice] = useState<string | null>(null);

  // Auto-close sidebars when switching to mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setLeftSidebarOpen(false);
    }
  }, [isMobile]);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === settings.model);

  const storageKey = authUser ? `chatConversations_u_${authUser}` : 'chatConversations_guest';

  const {
    conversations,
    activeId,
    createConversation,
    updateConversation,
    switchConversation,
    deleteConversation,
    updateTitle,
  } = useConversations(settings.model, storageKey);

  // Clear current chat when switching identity
  const prevStorageKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevStorageKeyRef.current !== storageKey) {
      prevStorageKeyRef.current = storageKey;
      clearMessages();
    }
  }, [storageKey, clearMessages]);

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

  function handleSend(content: string | ContentPart[]) {
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
      editAndResend(index - 1, messages[index - 1].content as string, settings);
    }
  }

  function handleRetry() {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { editAndResend(i, messages[i].content as string, settings); return; }
    }
  }

  const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('uiTheme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-animating');
    const t = window.setTimeout(() => {
      root.classList.remove('theme-animating');
    }, 360);
    return () => {
      window.clearTimeout(t);
      root.classList.remove('theme-animating');
    };
  }, [theme]);

  useEffect(() => {
    if (errorCode === 'SERVER_API_KEY_QUOTA_EXCEEDED' && error) {
      setKeyQuotaNotice(error);
      setSidebarOpen(true);
    }
  }, [errorCode, error]);

  function handleAuthSuccess(username: string) {
    setAuthUser(username);
    setShowAuthModal(false);
    localStorage.removeItem('guestMode');
  }

  function handleGuest() {
    localStorage.setItem('guestMode', '1');
    setShowAuthModal(false);
  }

  function handleLogout() {
    logout();
    setAuthUser(null);
    setShowAuthModal(true);
    localStorage.removeItem('guestMode');
  }

  function handleShowAuth() {
    setShowAuthModal(true);
  }

  return (
    <div className="flex h-screen overflow-hidden app-shell">
      {showAuthModal && <AuthModal onSuccess={handleAuthSuccess} onGuest={handleGuest} />}
      <div className="flex w-full h-full">
        {keyQuotaNotice && (
          <div
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              width: 'min(560px, calc(100vw - 24px))',
              background: 'var(--warning-soft)',
              border: '1px solid var(--warning-border)',
              color: 'var(--warning)',
              borderRadius: 12,
              padding: 12,
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            <div className="text-sm font-medium mb-1">Server API key quota reached</div>
            <div className="text-xs mb-2" style={{ color: 'var(--text-main)' }}>{keyQuotaNotice}</div>
            <div className="flex items-center gap-2">
              <button
                className="px-2.5 py-1.5 text-xs rounded-md"
                style={{ background: 'var(--warning-border)', color: 'var(--warning)' }}
                onClick={() => setSidebarOpen(true)}
              >
                Open settings
              </button>
              <button
                className="px-2.5 py-1.5 text-xs rounded-md"
                style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--line)' }}
                onClick={() => setKeyQuotaNotice(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Left sidebar ── */}
        {isMobile ? (
          <>
            {leftSidebarOpen && (
              <div
                onClick={() => setLeftSidebarOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 38, background: 'var(--overlay)', backdropFilter: 'blur(1px)' }}
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
                onOpenSettings={() => setSidebarOpen(true)}
                theme={theme}
                onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
                authUser={authUser}
                onLogout={handleLogout}
                onShowAuth={handleShowAuth}
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
                onOpenSettings={() => setSidebarOpen(true)}
                theme={theme}
                onToggleTheme={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
                authUser={authUser}
                onLogout={handleLogout}
                onShowAuth={handleShowAuth}
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
            leftSidebarOpen={leftSidebarOpen}
            onToggleLeftSidebar={() => setLeftSidebarOpen(v => !v)}
          />
          <InputBar
            onSend={handleSend}
            onStop={stopStreaming}
            disabled={isStreaming}
            model={currentModel?.label ?? settings.model}
            supportsVision={currentModel?.supportsVision ?? false}
          />
        </div>

        {/* ── Settings panel — centered overlay ── */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 48, background: 'var(--overlay)', backdropFilter: 'blur(1px)' }}
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
