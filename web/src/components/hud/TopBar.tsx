import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { StatsReport } from '@/lib/types';

function Stat({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex items-baseline gap-2 px-4 py-1.5 border-l border-hud-line first:border-l-0">
      <span className="hud-label">{label}</span>
      <span className="font-mono text-lg text-hud-cyan tracking-wider">{value}</span>
      {unit && <span className="font-mono text-[10px] text-hud-mute">{unit}</span>}
    </div>
  );
}

export function TopBar() {
  const [stats, setStats] = useState<StatsReport | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        setStats(await api.stats());
      } catch {
        setStats(null);
      }
    };
    poll();
    const i = setInterval(poll, 10_000);
    return () => clearInterval(i);
  }, []);

  return (
    <header className="relative z-10 border-b border-hud-line bg-black/70 flex items-stretch">
      <div className="flex-1 flex items-center">
        <Stat label="MEMORIES" value={stats?.total_memories ?? '—'} />
        <Stat label="LINKS" value={stats?.total_links ?? '—'} />
        <Stat label="TYPES" value={stats ? Object.keys(stats.by_type).length : '—'} />
        <Stat label="COLLECTIONS" value={stats?.collections.length ?? '—'} />
      </div>
      <div className="flex items-center gap-3 px-4 border-l border-hud-line">
        <span className="w-2 h-2 rounded-full bg-hud-red shadow-[0_0_8px_#ff4d6d] animate-pulseDot" />
        <span className="font-display uppercase tracking-[0.3em] text-xs text-hud-red">REC</span>
      </div>
    </header>
  );
}
