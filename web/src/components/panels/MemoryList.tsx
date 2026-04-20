import type { MemoryPayload } from '@/lib/types';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

interface Hit {
  id: string;
  score: number;
  payload: MemoryPayload;
}

const TYPE_COLOR: Record<string, string> = {
  knowledge: 'text-hud-cyan',
  decision: 'text-hud-amber',
  pattern: 'text-hud-violet',
  preference: 'text-hud-green',
  context: 'text-hud-cyanDim',
  debug: 'text-hud-red',
};

export function MemoryList({
  hits,
  selectedId,
  onSelect,
}: {
  hits: Hit[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (hits.length === 0) {
    return (
      <div className="text-center py-12 font-mono text-xs text-hud-mute">
        // NO SIGNAL · TRY A QUERY
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
      {hits.map((h, i) => {
        const p = h.payload;
        const isSel = h.id === selectedId;
        return (
          <motion.button
            key={h.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.015 }}
            onClick={() => onSelect(h.id)}
            className={cn(
              'w-full text-left border p-3 transition-all group',
              isSel
                ? 'border-hud-cyan bg-hud-cyan/10 shadow-glow'
                : 'border-hud-line hover:border-hud-cyan/60 hover:bg-hud-cyan/[0.03]',
            )}
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span className={cn('hud-chip border-current', TYPE_COLOR[p.type] ?? 'text-hud-cyanDim')}>
                  {p.type}
                </span>
                {h.score > 0 && (
                  <span className="font-mono text-[10px] text-hud-cyan">
                    {h.score.toFixed(3)}
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] text-hud-mute">
                {new Date(p.timestamp).toISOString().slice(0, 10)}
              </span>
            </div>
            <p className="font-mono text-xs text-hud-text line-clamp-2 leading-relaxed">{p.content}</p>
            <div className="mt-2 h-1 bg-black/40 border border-hud-line overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-hud-cyan/60 to-hud-cyan"
                style={{ width: `${Math.round(p.importance * 100)}%` }}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
