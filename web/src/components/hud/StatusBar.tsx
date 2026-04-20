import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { HealthReport } from '@/lib/types';
import { cn } from '@/lib/cn';

function Dot({ ok }: { ok?: boolean }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full animate-pulseDot',
        ok ? 'bg-hud-green shadow-[0_0_8px_#57f287]' : 'bg-hud-red shadow-[0_0_8px_#ff4d6d]',
      )}
    />
  );
}

export function StatusBar() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const poll = async () => {
      try {
        const h = await api.health();
        setHealth(h);
      } catch {
        setHealth(null);
      }
    };
    poll();
    const i = setInterval(poll, 5000);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(i);
      clearInterval(t);
    };
  }, []);

  const ts = now.toISOString().replace('T', ' ').slice(0, 19) + 'Z';

  return (
    <footer className="relative z-20 border-t border-hud-line bg-black/70 px-4 py-2 flex items-center justify-between text-[11px] font-mono">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <Dot ok={health?.vectordb.ok} />
          <span className="hud-label">STORE</span>
          <span className="text-hud-text">
            {health?.vectordb.ok
              ? `${health.vectordb.latency_ms}ms`
              : health === null
                ? '—'
                : 'OFFLINE'}
          </span>
          {health?.vectordb.provider && (
            <span className="hud-chip border-hud-line text-hud-cyanDim">
              {health.vectordb.provider}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dot ok={health?.embedding.ok} />
          <span className="hud-label">EMBED</span>
          <span className="text-hud-text">
            {health?.embedding.ok
              ? `${health.embedding.latency_ms}ms${health.embedding.dim ? ` · ${health.embedding.dim}d` : ''}`
              : health === null
                ? '—'
                : 'OFFLINE'}
          </span>
          {health?.embedding.provider && (
            <span className="hud-chip border-hud-line text-hud-cyanDim">
              {health.embedding.provider}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hud-label">API</span>
          <span className="text-hud-green">ONLINE</span>
        </div>
      </div>
      <div className="flex items-center gap-5 text-hud-mute">
        <span>{ts}</span>
        <span className="text-hud-cyan animate-flicker">// MEM-MCP v0.1</span>
      </div>
    </footer>
  );
}
