import { Brain, Activity, Database, Radio, Settings2, Zap, Orbit, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type NavKey = 'memory' | 'neural' | 'telemetry' | 'agents' | 'datastore' | 'signals' | 'config';

interface NavItem {
  key: NavKey;
  label: string;
  code: string;
  icon: LucideIcon;
  disabled?: boolean;
}

const items: NavItem[] = [
  { key: 'memory', label: 'Memory', code: 'MEM-01', icon: Brain },
  { key: 'neural', label: 'Neural Map', code: 'NEU-02', icon: Orbit },
  { key: 'telemetry', label: 'Telemetry', code: 'TEL-03', icon: Activity, disabled: true },
  { key: 'agents', label: 'Agents', code: 'AGT-04', icon: Zap, disabled: true },
  { key: 'datastore', label: 'Datastore', code: 'QDR-05', icon: Database, disabled: true },
  { key: 'signals', label: 'Signals', code: 'SIG-06', icon: Radio, disabled: true },
  { key: 'config', label: 'Config', code: 'CFG-07', icon: Settings2, disabled: true },
];

export function Sidebar({ active, onSelect }: { active: NavKey; onSelect: (k: NavKey) => void }) {
  return (
    <aside className="relative z-10 w-56 border-r border-hud-line bg-black/70 flex flex-col">
      <div className="px-4 py-5 border-b border-hud-line">
        <div className="font-display text-2xl tracking-[0.3em] text-hud-cyan leading-none">MEM·MCP</div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-hud-mute">
          DASHBOARD · CONTROL
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              disabled={it.disabled}
              onClick={() => onSelect(it.key)}
              className={cn(
                'w-full group flex items-center gap-3 px-3 py-2.5 border-l-2 transition-all',
                isActive
                  ? 'border-hud-cyan bg-hud-cyan/10 text-hud-cyan'
                  : 'border-transparent hover:border-hud-cyan/50 hover:bg-hud-cyan/5 text-hud-text/70',
                it.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <Icon size={16} className={cn(isActive ? 'text-hud-cyan' : 'text-hud-cyanDim')} />
              <div className="flex-1 text-left">
                <div className="font-display uppercase tracking-wider text-xs">{it.label}</div>
                <div className="font-mono text-[9px] text-hud-mute">{it.code}</div>
              </div>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-hud-cyan shadow-[0_0_6px_#00f0ff] animate-pulseDot" />}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-hud-line font-mono text-[10px] text-hud-mute">
        <div className="flex justify-between">
          <span>BUILD</span>
          <span className="text-hud-cyanDim">0.1.0-alpha</span>
        </div>
        <div className="flex justify-between">
          <span>NODE</span>
          <span className="text-hud-cyanDim">bun</span>
        </div>
      </div>
    </aside>
  );
}
