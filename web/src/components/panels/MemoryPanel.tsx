import { useEffect, useState } from 'react';
import type { MemoryPayload } from '@/lib/types';
import { Panel } from '../hud/Panel';
import { MemorySearch } from './MemorySearch';
import { MemoryList } from './MemoryList';
import { MemoryDetail } from './MemoryDetail';
import { MemoryAdd } from './MemoryAdd';
import { api } from '@/lib/api';

type Hit = { id: string; score: number; payload: MemoryPayload };

export function MemoryPanel() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadInitial = async () => {
    try {
      const r = await api.listMemories({ limit: 30 });
      setHits(r.points.map((p) => ({ id: p.id, score: 0, payload: p.payload })));
    } catch {
      setHits([]);
    }
  };

  useEffect(() => {
    loadInitial();
  }, [refreshKey]);

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <Panel
        code="MEM-01"
        title="Memory Index"
        subtitle="// qdrant · cosine · 384d"
        className="col-span-7 flex flex-col"
        actions={<MemoryAdd onCreated={bump} />}
        delay={0.05}
      >
        <div className="space-y-3 flex-1 min-h-0">
          <MemorySearch onResults={setHits} />
          <div className="hud-divider" />
          <MemoryList hits={hits} selectedId={selected} onSelect={setSelected} />
        </div>
      </Panel>

      <Panel
        code="MEM-02"
        title="Inspector"
        subtitle="// node dossier"
        className="col-span-5 overflow-y-auto"
        delay={0.1}
      >
        <MemoryDetail
          id={selected}
          onDeleted={() => {
            setSelected(null);
            bump();
          }}
        />
      </Panel>
    </div>
  );
}
