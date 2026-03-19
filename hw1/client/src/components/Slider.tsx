import { useState, useRef, useCallback } from 'react';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (v: number) => void;
}

function snap(value: number, min: number, max: number, step: number) {
  const clamped = Math.min(max, Math.max(min, value));
  const steps = Math.round((clamped - min) / step);
  return parseFloat((min + steps * step).toFixed(10));
}

export function Slider({ label, value, min, max, step, decimals = 2, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const percent = ((value - min) / (max - min)) * 100;

  const valueFromClientX = useCallback((clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snap(min + ratio * (max - min), min, max, step);
  }, [min, max, step]);

  function handleTrackMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    onChange(valueFromClientX(e.clientX));
    setDragging(true);

    function onMove(ev: MouseEvent) { onChange(valueFromClientX(ev.clientX)); }
    function onUp() {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function startEdit() {
    setDraft(value.toFixed(decimals));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitDraft() {
    const n = parseFloat(draft);
    if (!isNaN(n)) onChange(snap(n, min, max, step));
    setEditing(false);
  }

  return (
    <div className="px-4 py-3">
      {/* Label + value box */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: '#e3e3e3' }}>{label}</span>

        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={draft}
            min={min} max={max} step={step}
            onChange={e => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={e => {
              if (e.key === 'Enter') commitDraft();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="w-14 text-center text-xs rounded-lg px-2 py-1 outline-none font-mono"
            style={{ background: '#1b1c20', color: '#e3e3e3', border: '1px solid #8ab4f8', caretColor: '#8ab4f8' }}
          />
        ) : (
          <button
            onClick={startEdit}
            className="text-xs rounded-lg px-2.5 py-1 font-mono transition-colors"
            style={{ background: '#2d2e33', color: '#e3e3e3', minWidth: '3rem', textAlign: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3c3f4a')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2d2e33')}
          >
            {value.toFixed(decimals)}
          </button>
        )}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative select-none"
        style={{ height: 36, display: 'flex', alignItems: 'center' }}
        onMouseDown={handleTrackMouseDown}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
      <div
        className="relative w-full rounded-full"
        style={{ height: 5, background: '#45474e', cursor: dragging ? 'grabbing' : 'pointer' }}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ width: `${percent}%`, background: '#9aa0a6' }}
        />
        {/* Thumb halo */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 36,
            height: 36,
            background: 'rgba(255,255,255,0.15)',
            left: `${percent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: dragging || hovering ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        />
        {/* Thumb dot */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 11,
            height: 11,
            background: '#e3e3e3',
            left: `${percent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            transition: dragging ? 'none' : 'left 0.05s',
          }}
        />
      </div>
      </div>
    </div>
  );
}
