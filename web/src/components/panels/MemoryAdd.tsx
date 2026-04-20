import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';

const TYPES = ['auto', 'knowledge', 'decision', 'pattern', 'preference', 'context', 'debug'] as const;
type TypeOpt = (typeof TYPES)[number];

export function MemoryAdd({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [type, setType] = useState<TypeOpt>('auto');
  const [tags, setTags] = useState('');
  const [project, setProject] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setContent('');
    setType('auto');
    setTags('');
    setProject('');
    setErr(null);
  };

  const submit = async () => {
    setErr(null);
    if (!content.trim()) {
      setErr('content required');
      return;
    }
    setBusy(true);
    try {
      await api.addMemory({
        content,
        type,
        tags: tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        project: project.trim() || undefined,
      });
      reset();
      setOpen(false);
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button className="hud-btn flex items-center gap-1.5" onClick={() => setOpen(true)}>
        <Plus size={12} /> INJECT
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => !busy && setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="hud-panel w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="hud-corners"><span /><span /></div>
              <header className="flex items-center justify-between px-4 py-2.5 border-b border-hud-line">
                <div className="flex items-baseline gap-3">
                  <span className="hud-label text-hud-cyan">INJ-01</span>
                  <h3 className="font-display uppercase tracking-[0.2em] text-sm">Inject Memory</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-hud-mute hover:text-hud-cyan">
                  <X size={16} />
                </button>
              </header>
              <div className="p-4 space-y-3">
                <div>
                  <label className="hud-label block mb-1">CONTENT</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="hud-input w-full resize-none"
                    placeholder="// transmit knowledge · decision · pattern · context …"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="hud-label block mb-1">TYPE</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as TypeOpt)}
                      className="hud-input w-full"
                    >
                      {TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="hud-label block mb-1">TAGS (comma)</label>
                    <input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="hud-input w-full"
                      placeholder="arch, backend"
                    />
                  </div>
                  <div>
                    <label className="hud-label block mb-1">PROJECT</label>
                    <input
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className="hud-input w-full"
                      placeholder="my-app"
                    />
                  </div>
                </div>
                {err && <div className="font-mono text-xs text-hud-red">⚠ {err}</div>}
                <div className="flex justify-end gap-2 pt-2">
                  <button className="hud-btn" onClick={() => setOpen(false)} disabled={busy}>
                    CANCEL
                  </button>
                  <button
                    className="hud-btn border-hud-cyan bg-hud-cyan/10"
                    onClick={submit}
                    disabled={busy}
                  >
                    {busy ? 'TRANSMITTING…' : 'TRANSMIT'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
