import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Settings } from '../types';
import { AVAILABLE_MODELS, PRESET_INSTRUCTIONS } from '../types';
import { ModelSelector } from './ModelSelector';
import { SystemInstructionPanel } from './SystemInstructionPanel';
import { ApiKeyPanel } from './ApiKeyPanel';
import { AdminUsagePanel } from './AdminUsagePanel';
import { Slider } from './Slider';
import { Tooltip } from './Tooltip';

interface Props {
  settings: Settings;
  onChange: (update: Partial<Settings>) => void;
  onReset: () => void;
  onClose: () => void;
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--bg-soft-hover)' }} />;
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === 'openai') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
  if (provider === 'anthropic') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
    </svg>
  );
}

export function SettingsPanel({ settings, onChange, onReset, onClose }: Props) {
  const [modelOpen, setModelOpen] = useState(false);
  const [systemPanelOpen, setSystemPanelOpen] = useState(false);
  const [apiKeyPanelOpen, setApiKeyPanelOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === settings.model);
  const currentProvider = currentModel?.provider ?? null;
  const isUsingOwnApiKey = currentProvider ? settings.apiKeys[currentProvider].trim().length > 0 : false;
  const activeInstruction = (settings.systemInstructions ?? []).find(i => i.id === settings.activeSystemInstructionId)
    ?? PRESET_INSTRUCTIONS.find(i => i.id === settings.activeSystemInstructionId);

  return (
    <>
      {modelOpen && createPortal(
        <ModelSelector
          currentModel={settings.model}
          onSelect={model => onChange({ model })}
          onClose={() => setModelOpen(false)}
        />,
        document.body
      )}
      {systemPanelOpen && createPortal(
        <SystemInstructionPanel
          instructions={settings.systemInstructions ?? []}
          activeId={settings.activeSystemInstructionId ?? null}
          onAdd={instr => onChange({ systemInstructions: [...(settings.systemInstructions ?? []), instr] })}
          onUpdate={instr => onChange({ systemInstructions: (settings.systemInstructions ?? []).map(i => i.id === instr.id ? instr : i) })}
          onDelete={id => onChange({
            systemInstructions: (settings.systemInstructions ?? []).filter(i => i.id !== id),
            activeSystemInstructionId: settings.activeSystemInstructionId === id ? null : settings.activeSystemInstructionId,
          })}
          onActivate={id => onChange({ activeSystemInstructionId: id })}
          onClose={() => setSystemPanelOpen(false)}
        />,
        document.body
      )}
      {apiKeyPanelOpen && createPortal(
        <ApiKeyPanel
          apiKeys={settings.apiKeys}
          currentProvider={currentProvider}
          onChange={apiKeys => onChange({ apiKeys })}
          onClose={() => setApiKeyPanelOpen(false)}
        />,
        document.body
      )}
      {adminPanelOpen && createPortal(
        <AdminUsagePanel
          onClose={() => setAdminPanelOpen(false)}
        />,
        document.body
      )}

      <div
        className="flex flex-col overflow-y-auto overflow-x-hidden"
        style={{
          width: 320,
          maxHeight: '85vh',
          background: 'var(--bg-surface-strong)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--bg-soft-hover)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>Run settings</span>
          <div className="flex items-center gap-1">
            <Tooltip text="Reset all settings to default values">
              <button
                onClick={onReset}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </Tooltip>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-soft-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Model card */}
        <div className="px-4 py-3">
          <Tooltip text="Click to switch the AI model">
            <button
              onClick={() => setModelOpen(true)}
              className="w-full text-left rounded-xl p-3 transition-all"
              style={{ background: 'var(--bg-soft)', border: '1px solid var(--line)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-strong)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}><ProviderIcon provider={currentModel?.provider ?? 'google'} /></span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                  {currentModel?.label ?? settings.model}
                </span>
              </div>
              <div className="text-xs mb-1 pl-5" style={{ color: 'var(--text-muted)' }}>{settings.model}</div>
              {currentModel?.description && (
                <p className="text-xs leading-relaxed pl-5" style={{ color: 'var(--text-muted)' }}>
                  {currentModel.description}
                </p>
              )}
            </button>
          </Tooltip>
        </div>

        <Divider />

        {/* System instructions */}
        <div className="px-4 py-3">
          <Tooltip text="Set a persona or rules the model will always follow">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setSystemPanelOpen(true)}
            >
              <span className="text-sm" style={{ color: 'var(--text-main)' }}>System instructions</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Tooltip>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: activeInstruction ? 'var(--accent)' : 'var(--text-muted)' }}>
            {activeInstruction
              ? <>{activeInstruction.title}{activeInstruction.content && <span style={{ color: 'var(--text-muted)' }}> — {activeInstruction.content}</span>}</>
              : 'No active instruction'}
          </p>
        </div>

        <Divider />
        <div className="px-4 py-3">
          <Tooltip text="Set your provider API keys. Click to open panel.">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setApiKeyPanelOpen(true)}
            >
              <span className="text-sm" style={{ color: 'var(--text-main)' }}>API Keys</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Tooltip>
          <p className="text-xs mt-1" style={{ color: isUsingOwnApiKey ? 'var(--accent)' : 'var(--text-muted)' }}>
            {currentProvider
              ? (isUsingOwnApiKey ? 'Current model is using your API key' : 'Current model is using server API key')
              : 'Unknown model provider'}
          </p>
        </div>
        <Divider />
        <div className="px-4 py-3">
          <Tooltip text="View server API key usage per IP (admin token required).">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => setAdminPanelOpen(true)}
            >
              <span className="text-sm" style={{ color: 'var(--text-main)' }}>Admin Usage</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Tooltip>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Check per-IP quota usage for server API keys.
          </p>
        </div>
        <Divider />
        <Tooltip text={"Controls randomness.\nHigher = more creative, lower = more deterministic."}>
          <Slider
            label="Temperature"
            description="Controls randomness. Higher = more creative & varied; lower = more focused & deterministic."
            value={settings.temperature}
            min={0} max={2} step={0.01} decimals={2}
            onChange={v => onChange({ temperature: v })}
          />
        </Tooltip>
        <Divider />
        <Tooltip text={"Nucleus sampling.\nLower values make output more focused."}>
          <Slider
            label="Top P"
            description="Nucleus sampling threshold. Only tokens whose cumulative probability reaches this value are considered. Lower = more focused output."
            value={settings.topP}
            min={0} max={1} step={0.01} decimals={2}
            onChange={v => onChange({ topP: v })}
          />
        </Tooltip>
        <Divider />
        <Tooltip text={"Maximum tokens the model can generate\nin a single response."}>
          <Slider
            label="Max Tokens"
            description="Maximum number of tokens the model can generate in a single response. Higher allows longer replies."
            value={settings.maxTokens}
            min={64} max={4096} step={64} decimals={0}
            onChange={v => onChange({ maxTokens: v })}
          />
        </Tooltip>
      </div>
    </>
  );
}
