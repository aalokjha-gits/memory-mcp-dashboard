import { useState } from 'react';
import { Search } from 'lucide-react';
import type { MemoryPayload } from '@/lib/types';
import { api } from '@/lib/api';

interface Props {
  onResults: (hits: Array<{ id: string; score: number; payload: MemoryPayload }>) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const TYPES = ['all', 'knowledge', 'decision', 'pattern', 'preference', 'context', 'debug'];

export function MemorySearch({ onResults, onLoadingChange }: Props) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    setErr(null);
    if (!q.trim()) {
      setLoading(true);
      onLoadingChange?.(true);
      try {
        const r = await api.listMemories({ limit: 30, type: type === 'all' ? undefined : type });
        onResults(r.points.map((p) => ({ id: p.id, score: 0, payload: p.payload })));
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
      return;
    }
    setLoading(true);
    onLoadingChange?.(true);
    try {
      const r = await api.searchMemories({
        query: q,
        limit: 30,
        type: type === 'all' ? undefined : type,
      });
      onResults(r.hits);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hud-cyanDim" />
          <input
            className="hud-input w-full pl-9"
            placeholder="// SEMANTIC QUERY ·  press enter"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
          />
        </div>
        <button className="hud-btn" onClick={run} disabled={loading}>
          {loading ? 'SCAN…' : 'SCAN'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={
              'hud-chip transition-colors ' +
              (type === t ? 'border-hud-cyan text-hud-cyan bg-hud-cyan/5' : 'hover:border-hud-cyan/60')
            }
          >
            {t}
          </button>
        ))}
      </div>
      {err && <div className="font-mono text-xs text-hud-red">⚠ {err}</div>}
    </div>
  );
}
