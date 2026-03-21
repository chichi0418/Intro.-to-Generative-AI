import { useState, useEffect, useRef } from 'react';
import type { SystemInstruction } from '../types';
import { PRESET_INSTRUCTIONS } from '../types';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface Props {
  instructions: SystemInstruction[];
  activeId: string | null;
  onAdd: (instr: SystemInstruction) => void;
  onUpdate: (instr: SystemInstruction) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string | null) => void;
  onClose: () => void;
}

export function SystemInstructionPanel({
  instructions, activeId, onAdd, onUpdate, onDelete, onActivate, onClose,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(
    activeId ?? (instructions.length > 0 ? instructions[0].id : null)
  );
  const [closing, setClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  // On mobile: 'list' or 'editor'
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const allInstructions = [...PRESET_INSTRUCTIONS, ...instructions];
  const editingInstr = allInstructions.find(i => i.id === editingId) ?? null;
  const isEditingPreset = editingInstr ? editingInstr.id.startsWith('preset:') : false;

  useEffect(() => {
    if (mobileView === 'editor') titleRef.current?.focus();
  }, [editingId, mobileView]);

  useEffect(() => {
    if (!isMobile) titleRef.current?.focus();
  }, [editingId, isMobile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') triggerClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function triggerClose() { setClosing(true); }

  function handleNew() {
    const instr: SystemInstruction = { id: genId(), title: 'New instruction', content: '' };
    onAdd(instr);
    setEditingId(instr.id);
    if (isMobile) setMobileView('editor');
  }

  function handleDelete(id: string) {
    const remaining = instructions.filter(i => i.id !== id);
    if (activeId === id) onActivate(null);
    onDelete(id);
    if (editingId === id) {
      setEditingId(remaining.length > 0 ? remaining[0].id : null);
      if (isMobile) setMobileView('list');
    }
  }

  function handleToggleActive(id: string) {
    onActivate(activeId === id ? null : id);
  }

  function handleSelectItem(id: string) {
    setEditingId(id);
    if (isMobile) setMobileView('editor');
  }

  const panelClass = closing ? 'animate-slideOutRight' : 'animate-slideInRight';

  // ── Shared sub-components ──

  const listPane = (
    <div className="flex flex-col h-full">
      {/* New button */}
      <div className="p-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: '#8ab4f8', border: '1px solid rgba(138,180,248,0.25)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(138,180,248,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New instruction
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Presets */}
        <p className="px-3 pt-2 pb-1 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Presets</p>
        {PRESET_INSTRUCTIONS.map(instr => {
          const isEditing = instr.id === editingId;
          const isActive = instr.id === activeId;
          return (
            <div
              key={instr.id}
              className="group flex items-center gap-1.5 mx-1 px-2 py-2 rounded-lg cursor-pointer"
              style={{ background: isEditing && !isMobile ? 'rgba(255,255,255,0.07)' : 'transparent' }}
              onMouseEnter={e => { if (!isEditing || isMobile) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isEditing || isMobile) e.currentTarget.style.background = 'transparent'; }}
              onClick={() => handleSelectItem(instr.id)}
            >
              <button
                className="flex-shrink-0 transition-colors"
                style={{ color: isActive ? '#8ab4f8' : 'rgba(255,255,255,0.2)' }}
                onClick={e => { e.stopPropagation(); handleToggleActive(instr.id); }}
                title={isActive ? 'Currently active — click to deactivate' : 'Click to use this instruction'}
              >
                {isActive ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" fill="#07070a" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
              </button>
              <span className="flex-1 text-xs truncate" style={{ color: isActive ? '#ededef' : '#9aa0a6' }}>
                {instr.title}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>Built-in</span>
            </div>
          );
        })}

        {/* Divider */}
        <div className="mx-3 my-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <p className="px-3 pb-1 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>My instructions</p>

        {instructions.length === 0 && (
          <p className="text-xs text-center py-4 px-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            No instructions yet
          </p>
        )}
        {instructions.map(instr => {
          const isEditing = instr.id === editingId;
          const isActive = instr.id === activeId;
          return (
            <div
              key={instr.id}
              className="group flex items-center gap-1.5 mx-1 px-2 py-2 rounded-lg cursor-pointer"
              style={{ background: isEditing && !isMobile ? 'rgba(255,255,255,0.07)' : 'transparent' }}
              onMouseEnter={e => { if (!isEditing || isMobile) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isEditing || isMobile) e.currentTarget.style.background = 'transparent'; }}
              onClick={() => handleSelectItem(instr.id)}
            >
              <button
                className="flex-shrink-0 transition-colors"
                style={{ color: isActive ? '#8ab4f8' : 'rgba(255,255,255,0.2)' }}
                onClick={e => { e.stopPropagation(); handleToggleActive(instr.id); }}
                title={isActive ? 'Currently active — click to deactivate' : 'Click to use this instruction'}
              >
                {isActive ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" fill="#07070a" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
              </button>
              <span className="flex-1 text-xs truncate" style={{ color: isActive ? '#ededef' : '#9aa0a6' }}>
                {instr.title || 'Untitled'}
              </span>
              {isMobile && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
              <button
                className={`flex-shrink-0 transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                style={{ color: '#8a8f98' }}
                onClick={e => { e.stopPropagation(); handleDelete(instr.id); }}
                title="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Active status */}
      <div className="px-3 py-2.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {activeId ? (
          <p className="text-xs" style={{ color: '#8ab4f8' }}>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>Active: </span>
            {allInstructions.find(i => i.id === activeId)?.title || 'Untitled'}
          </p>
        ) : (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No active instruction</p>
        )}
      </div>
    </div>
  );

  const editorPane = editingInstr ? (
    <div className="flex flex-col h-full">
      {/* Title input */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {isEditingPreset ? (
          <span className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#9aa0a6' }}>
            {editingInstr.title}
          </span>
        ) : (
          <input
            ref={titleRef}
            value={editingInstr.title}
            onChange={e => onUpdate({ ...editingInstr, title: e.target.value })}
            placeholder="Instruction title"
            className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ededef',
              caretColor: '#8ab4f8',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(138,180,248,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        )}
        {editingInstr.id !== activeId ? (
          <button
            onClick={() => onActivate(editingInstr.id)}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(138,180,248,0.12)', color: '#8ab4f8', border: '1px solid rgba(138,180,248,0.25)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(138,180,248,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(138,180,248,0.12)')}
          >
            Use
          </button>
        ) : (
          <span className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(138,180,248,0.08)', color: '#8ab4f8', border: '1px solid rgba(138,180,248,0.2)' }}>
            Active
          </span>
        )}
      </div>

      {/* Textarea */}
      <div className="flex-1 p-4">
        <textarea
          value={editingInstr.content}
          onChange={e => !isEditingPreset && onUpdate({ ...editingInstr, content: e.target.value })}
          readOnly={isEditingPreset}
          placeholder="Enter instructions for the model (tone, persona, rules, etc.)"
          className="w-full h-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none"
          style={{
            background: isEditingPreset ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: isEditingPreset ? '#9aa0a6' : '#ededef',
            caretColor: '#8ab4f8',
            lineHeight: '1.6',
            cursor: isEditingPreset ? 'default' : 'text',
          }}
          onFocus={e => { if (!isEditingPreset) e.currentTarget.style.borderColor = 'rgba(138,180,248,0.3)'; }}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
        />
      </div>
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 h-full">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
      <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Create a new instruction<br />to get started
      </p>
      <button
        onClick={handleNew}
        className="px-4 py-2 rounded-lg text-sm transition-colors"
        style={{ background: 'rgba(138,180,248,0.1)', color: '#8ab4f8', border: '1px solid rgba(138,180,248,0.2)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(138,180,248,0.18)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(138,180,248,0.1)')}
      >
        + New instruction
      </button>
    </div>
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-end animate-fadeIn"
      style={{
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={e => { if (e.target === overlayRef.current) triggerClose(); }}
    >
      <div
        className={`flex flex-col h-full ${panelClass}`}
        style={{
          width: isMobile ? '100%' : 580,
          background: 'rgba(8,8,12,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
        }}
        onAnimationEnd={() => { if (closing) onClose(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            {isMobile && mobileView === 'editor' && (
              <button
                onClick={() => setMobileView('list')}
                className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                style={{ color: '#8a8f98' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <span className="text-base font-medium" style={{ color: '#ededef' }}>
              {isMobile && mobileView === 'editor' && editingInstr
                ? editingInstr.title || 'Edit instruction'
                : 'System instructions'}
            </span>
          </div>
          <button
            onClick={triggerClose}
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {isMobile ? (
          // Mobile: single-column, switch between list and editor
          <div className="flex-1 min-h-0 overflow-hidden">
            {mobileView === 'list' ? listPane : editorPane}
          </div>
        ) : (
          // Desktop: two-column layout
          <div className="flex flex-1 min-h-0">
            <div className="flex flex-col flex-shrink-0" style={{ width: 196, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              {listPane}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              {editorPane}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>Instructions are saved in local storage.</p>
        </div>
      </div>
    </div>
  );
}
