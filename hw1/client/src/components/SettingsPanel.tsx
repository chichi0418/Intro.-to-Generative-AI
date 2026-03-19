import { useState } from 'react';
import type { Settings } from '../types';
import { AVAILABLE_MODELS } from '../types';
import { ModelSelector } from './ModelSelector';
import { SystemInstructionPanel } from './SystemInstructionPanel';
import { Slider } from './Slider';
import { Tooltip } from './Tooltip';

interface Props {
  settings: Settings;
  onChange: (update: Partial<Settings>) => void;
  onReset: () => void;
  onCollapse: () => void;
}

function Divider() {
  return <div style={{ height: '1px', background: '#2e3035' }} />;
}

const PROVIDER_ICONS: Record<string, string> = {
  openai: '⬡',
  anthropic: '◆',
  google: '✦',
};

export function SettingsPanel({ settings, onChange, onReset, onCollapse }: Props) {
  const [modelOpen, setModelOpen] = useState(false);
  const [systemPanelOpen, setSystemPanelOpen] = useState(false);

  const currentModel = AVAILABLE_MODELS.find(m => m.id === settings.model);

  return (
    <>
      {modelOpen && (
        <ModelSelector
          currentModel={settings.model}
          onSelect={model => onChange({ model })}
          onClose={() => setModelOpen(false)}
        />
      )}
      {systemPanelOpen && (
        <SystemInstructionPanel
          value={settings.systemPrompt}
          onChange={systemPrompt => onChange({ systemPrompt })}
          onClose={() => setSystemPanelOpen(false)}
        />
      )}

      <div
        className="w-72 flex-shrink-0 flex flex-col overflow-y-auto overflow-x-hidden border-l"
        style={{ background: '#1b1c20', borderColor: '#2e3035' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-medium pl-1" style={{ color: '#e3e3e3' }}>Run settings</span>
          <div className="flex items-center gap-1">
            <Tooltip text="Reset all settings to default values">
              <button
                onClick={onReset}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: '#9aa0a6' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2d2e33')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </Tooltip>
            <Tooltip text="Collapse settings sidebar">
              <button
                onClick={onCollapse}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: '#9aa0a6' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2d2e33')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 5l7 7-7 7" />
                  <path d="M5 5l7 7-7 7" />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Model card */}
        <div className="px-4 py-3">
          <Tooltip text="Click to switch the AI model">
            <button
              onClick={() => setModelOpen(true)}
              className="w-full text-left rounded-xl p-3 transition-colors"
              style={{ background: '#2d2e33', border: '1px solid #3c3f4a' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#55585f')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#3c3f4a')}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span style={{ color: '#9aa0a6' }}>{PROVIDER_ICONS[currentModel?.provider ?? 'google']}</span>
                <span className="text-sm font-medium" style={{ color: '#e3e3e3' }}>
                  {currentModel?.label ?? settings.model}
                </span>
              </div>
              <div className="text-xs mb-1 pl-5" style={{ color: '#9aa0a6' }}>{settings.model}</div>
              {currentModel?.description && (
                <p className="text-xs leading-relaxed pl-5" style={{ color: '#9aa0a6' }}>
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
              <span className="text-sm" style={{ color: '#e3e3e3' }}>System instructions</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </Tooltip>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9aa0a6' }}>
            {settings.systemPrompt || 'Optional tone and style instructions for the model'}
          </p>
        </div>

        <Divider />
        <Tooltip text={"Controls randomness.\nHigher = more creative, lower = more deterministic."}>
          <Slider
            label="Temperature"
            value={settings.temperature}
            min={0} max={2} step={0.01} decimals={2}
            onChange={v => onChange({ temperature: v })}
          />
        </Tooltip>
        <Divider />
        <Tooltip text={"Nucleus sampling.\nLower values make output more focused."}>
          <Slider
            label="Top P"
            value={settings.topP}
            min={0} max={1} step={0.01} decimals={2}
            onChange={v => onChange({ topP: v })}
          />
        </Tooltip>
        <Divider />
        <Tooltip text={"Maximum tokens the model can generate\nin a single response."}>
          <Slider
            label="Max Tokens"
            value={settings.maxTokens}
            min={64} max={4096} step={64} decimals={0}
            onChange={v => onChange({ maxTokens: v })}
          />
        </Tooltip>
      </div>
    </>
  );
}
