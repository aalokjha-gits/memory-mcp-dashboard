import { useEffect, useState } from 'react';
import { Trash2, Link2, Copy } from 'lucide-react';
import type { MemoryPayload } from '@/lib/types';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export function MemoryDetail({ id, onDeleted }: { id: string | null; onDeleted: () => void }) {
  const [payload, setPayload] = useState<MemoryPayload | null>(null);
  const [linked, setLinked] = useState<Array<{ id: string; payload: MemoryPayload }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setPayload(null);
      setLinked([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await api.getMemory(id);
        if (cancelled) return;
        setPayload(r.payload);
        const ids = r.payload.linked_ids ?? [];
        const resolved = await Promise.all(
          ids.map((x) => api.getMemory(x).catch(() => null)),
        );
        if (cancelled) return;
        setLinked(resolved.filter((x): x is { id: string; payload: MemoryPayload } => !!x));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <div className="h-full flex items-center justify-center text-center font-mono text-xs text-hud-mute">
        // SELECT A MEMORY NODE TO INSPECT
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="hud-label">MEM-ID</div>
            <div className="font-mono text-[11px] text-hud-cyan break-all">{id}</div>
          </div>
          <div className="flex gap-2">
            <button
              className="hud-btn flex items-center gap-1.5"
              onClick={() => navigator.clipboard.writeText(payload?.content ?? '')}
              disabled={!payload}
            >
              <Copy size={12} /> COPY
            </button>
            <button
              className="hud-btn border-hud-red/60 text-hud-red hover:bg-hud-red/10 hover:border-hud-red flex items-center gap-1.5"
              onClick={async () => {
                if (!id) return;
                if (!confirm('Purge this memory? This is irreversible.')) return;
                await api.deleteMemory(id);
                onDeleted();
              }}
            >
              <Trash2 size={12} /> PURGE
            </button>
          </div>
        </div>

        {loading && <div className="font-mono text-xs text-hud-cyanDim">// LOADING…</div>}

        {payload && (
          <>
            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <Field label="TYPE" value={payload.type} />
              <Field label="IMPORTANCE" value={payload.importance.toFixed(2)} />
              <Field label="PROJECT" value={payload.project ?? '—'} />
              <Field label="CREATED" value={new Date(payload.timestamp).toISOString().slice(0, 19) + 'Z'} />
            </div>

            {payload.tags && payload.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {payload.tags.map((t) => (
                  <span key={t} className="hud-chip">#{t}</span>
                ))}
              </div>
            )}

            <div>
              <div className="hud-label mb-1.5">CONTENT</div>
              <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-hud-text bg-black/30 border border-hud-line p-3 max-h-80 overflow-y-auto">
                {payload.content}
              </pre>
            </div>

            <div>
              <div className="hud-label mb-1.5 flex items-center gap-2">
                <Link2 size={10} /> LINKED NODES · {linked.length}
              </div>
              {linked.length === 0 ? (
                <div className="font-mono text-[11px] text-hud-mute">// no connections</div>
              ) : (
                <div className="space-y-1.5">
                  {linked.map((l) => (
                    <div key={l.id} className="border border-hud-line p-2 font-mono text-[11px]">
                      <div className="text-hud-cyanDim truncate">{l.id}</div>
                      <div className="text-hud-text line-clamp-2 mt-0.5">{l.payload.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="hud-label">{label}</div>
      <div className="text-hud-text">{value}</div>
    </div>
  );
}
