import { useState, useRef, useEffect } from 'react';
import type { Conversation } from '../types';

function exportConversation(conv: Conversation) {
  const content = `# ${conv.title}\n\n` + conv.messages.map(m =>
    `**${m.role === 'user' ? 'You' : 'Assistant'}**\n\n${m.content}`
  ).join('\n\n---\n\n');
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onOpenSettings: () => void;
}

function groupByDate(conversations: Conversation[]) {
  const now = Date.now();
  const dayMs = 86400000;
  const today: Conversation[] = [];
  const yesterday: Conversation[] = [];
  const earlier: Conversation[] = [];

  for (const c of conversations) {
    const age = now - c.createdAt;
    if (age < dayMs) today.push(c);
    else if (age < 2 * dayMs) yesterday.push(c);
    else earlier.push(c);
  }

  return { today, yesterday, earlier };
}

function ConvItem({
  conv,
  active,
  onSwitch,
  onDelete,
  onRename,
}: {
  conv: Conversation;
  active: boolean;
  onSwitch: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setEditTitle(conv.title);
    setEditing(true);
  }

  function handleRenameSubmit() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conv.title) onRename(trimmed);
    setEditing(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') { setEditing(false); setEditTitle(conv.title); }
  }

  return (
    <div
      onClick={editing ? undefined : onSwitch}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm select-none transition-all"
      style={{
        background: active
          ? 'rgba(255,255,255,0.08)'
          : hovered
          ? 'rgba(255,255,255,0.05)'
          : 'transparent',
        color: active ? '#ededef' : '#8a8f98',
        borderLeft: active ? '2px solid #8ab4f8' : '2px solid transparent',
        cursor: editing ? 'default' : 'pointer',
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleRenameKeyDown}
          onClick={e => e.stopPropagation()}
          className="flex-1 mr-1 text-sm outline-none bg-transparent"
          style={{
            color: '#ededef',
            border: 'none',
            borderBottom: '1px solid rgba(138,180,248,0.5)',
            borderRadius: 0,
            padding: '0 2px',
          }}
        />
      ) : (
        <span
          className="truncate flex-1 mr-1"
          onDoubleClick={handleDoubleClick}
          title="Double-click to rename"
        >
          {conv.title}
        </span>
      )}
      {hovered && !editing && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); exportConversation(conv); }}
            title="Export as Markdown"
            className="w-5 h-5 flex items-center justify-center rounded transition-colors"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8ab4f8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a8f98')}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Delete"
            className="w-5 h-5 flex items-center justify-center rounded transition-colors"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f28b82')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8a8f98')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ label, items, activeId, onSwitch, onDelete, onRename }: {
  label: string;
  items: Conversation[];
  activeId: string | null;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="px-3 py-1 text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </div>
      {items.map(c => (
        <ConvItem
          key={c.id}
          conv={c}
          active={c.id === activeId}
          onSwitch={() => onSwitch(c.id)}
          onDelete={() => onDelete(c.id)}
          onRename={(title) => onRename(c.id, title)}
        />
      ))}
    </div>
  );
}

export function ConversationSidebar({ conversations, activeId, onNew, onSwitch, onDelete, onRename, onOpenSettings }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  const { today, yesterday, earlier } = groupByDate(filtered);
  const hasAny = conversations.length > 0;

  return (
    <div
      className="flex flex-col h-full shrink-0"
      style={{
        width: 240,
        background: 'rgba(10,10,15,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-sm font-medium" style={{ color: '#ededef' }}>History</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            title="Settings (Cmd+/)"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            onClick={onNew}
            title="New chat (Cmd+K)"
            className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
            style={{ color: '#8a8f98' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      {hasAny && (
        <div className="px-2 pt-2 pb-1">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#8a8f98', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-xs outline-none bg-transparent"
              style={{ color: '#ededef', caretColor: '#8ab4f8' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: '#8a8f98', lineHeight: 1 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {hasAny ? (
          filtered.length > 0 ? (
            <>
              <Section label="Today"     items={today}     activeId={activeId} onSwitch={onSwitch} onDelete={onDelete} onRename={onRename} />
              <Section label="Yesterday" items={yesterday} activeId={activeId} onSwitch={onSwitch} onDelete={onDelete} onRename={onRename} />
              <Section label="Earlier"   items={earlier}   activeId={activeId} onSwitch={onSwitch} onDelete={onDelete} onRename={onRename} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full pb-16">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No results</span>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-full pb-16">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No conversations yet</span>
          </div>
        )}
      </div>
    </div>
  );
}
