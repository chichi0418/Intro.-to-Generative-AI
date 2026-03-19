import './index.css';
import { useState } from 'react';
import { useChat } from './hooks/useChat';
import { useSettings } from './hooks/useSettings';
import { ChatWindow } from './components/ChatWindow';
import { InputBar } from './components/InputBar';
import { SettingsPanel } from './components/SettingsPanel';
import { AVAILABLE_MODELS, DEFAULT_SETTINGS } from './types';
import { Tooltip } from './components/Tooltip';

function App() {
  const { messages, isStreaming, error, sendMessage, clearMessages } = useChat();
  const { settings, setSettings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === settings.model);

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('chatSettings');
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#1b1c20' }}>
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm font-medium" style={{ color: '#e3e3e3' }}>Playground</span>
          <div className="flex items-center gap-2">
            <Tooltip text="Clear all messages in the current conversation">
              <button
                onClick={clearMessages}
                className="px-3 py-1.5 text-xs rounded-full transition-colors"
                style={{ color: '#9aa0a6', border: '1px solid #3c3f4a' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2d2e33')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Clear chat
              </button>
            </Tooltip>
            {!sidebarOpen && (
              <Tooltip text="Open run settings sidebar">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: '#9aa0a6', border: '1px solid #3c3f4a' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#2d2e33')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5l-7 7 7 7" />
                    <path d="M19 5l-7 7 7 7" />
                  </svg>
                </button>
              </Tooltip>
            )}
          </div>
        </header>

        <ChatWindow messages={messages} error={error} />

        <InputBar
          onSend={content => sendMessage(content, settings)}
          disabled={isStreaming}
          model={currentModel?.label ?? settings.model}
        />
      </div>

      {/* Settings panel */}
      {sidebarOpen && (
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          onReset={handleReset}
          onCollapse={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
