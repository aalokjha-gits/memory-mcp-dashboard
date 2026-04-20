import { useState } from 'react';
import { Sidebar, type NavKey } from '@/components/hud/Sidebar';
import { TopBar } from '@/components/hud/TopBar';
import { StatusBar } from '@/components/hud/StatusBar';
import { MemoryPanel } from '@/components/panels/MemoryPanel';
import { NeuralMapPanel } from '@/components/panels/NeuralMapPanel';
import { Panel } from '@/components/hud/Panel';

export function Dashboard() {
  const [active, setActive] = useState<NavKey>('memory');

  return (
    <div className="relative z-10 h-screen flex">
      <Sidebar active={active} onSelect={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden p-4">
          {active === 'memory' ? (
            <MemoryPanel />
          ) : active === 'neural' ? (
            <NeuralMapPanel />
          ) : (
            <Panel code="SYS-∅" title="Offline Module" subtitle="// coming online">
              <div className="py-16 text-center font-mono text-xs text-hud-mute">
                // MODULE <span className="text-hud-cyan">{active.toUpperCase()}</span> NOT YET DEPLOYED
              </div>
            </Panel>
          )}
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
