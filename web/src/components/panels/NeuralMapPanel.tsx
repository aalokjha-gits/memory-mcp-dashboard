import { useEffect, useMemo, useState } from 'react';
import type { GraphReport } from '@/lib/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { Panel } from '../hud/Panel';
import { MemoryDetail } from './MemoryDetail';

const TYPE_META: Record<
  string,
  { code: string; label: string; color: string; hex: string; sector: string }
> = {
  knowledge:  { code: 'KNO', label: 'knowledge',  color: 'text-hud-cyan',    hex: '#00f0ff', sector: 'N'  },
  decision:   { code: 'DEC', label: 'decision',   color: 'text-hud-amber',   hex: '#ffb454', sector: 'NE' },
  pattern:    { code: 'PAT', label: 'pattern',    color: 'text-hud-violet',  hex: '#b388ff', sector: 'SE' },
  context:    { code: 'CTX', label: 'context',    color: 'text-hud-cyanDim', hex: '#0b8ba0', sector: 'S'  },
  debug:      { code: 'DBG', label: 'debug',      color: 'text-hud-red',     hex: '#ff4d6d', sector: 'SW' },
  preference: { code: 'PRE', label: 'preference', color: 'text-hud-green',   hex: '#57f287', sector: 'NW' },
};
const TYPE_ORDER = ['knowledge', 'decision', 'pattern', 'context', 'debug', 'preference'];
const FALLBACK = { code: '---', label: 'unknown', color: 'text-hud-mute', hex: '#5a7a8c', sector: '—' };

const VB = { w: 1000, h: 720 };
const CX = 500;
const CY = 360;
const R_MAX = 310;

const RINGS = [
  { r: 70,    label: 'CORE',    thresh: 0.75 },
  { r: 150,   label: 'INNER',   thresh: 0.5  },
  { r: 230,   label: 'MID',     thresh: 0.25 },
  { r: R_MAX, label: 'OUTER',   thresh: 0    },
];

type SortKey = 'importance' | 'recent' | 'links' | 'type';

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function positionFor(id: string, type: string, importance: number) {
  const h = hash32(id);
  const idx = TYPE_ORDER.indexOf(type);
  const sectorIdx = idx >= 0 ? idx : 0;
  const sectorCount = TYPE_ORDER.length;
  const sectorWidth = (Math.PI * 2) / sectorCount;
  // Start sector 0 at top (-PI/2) and lay out clockwise.
  const sectorStart = -Math.PI / 2 + sectorIdx * sectorWidth;
  const t = 0.12 + ((h & 0xffff) / 0xffff) * 0.76; // keep clear of sector boundaries
  const a = sectorStart + t * sectorWidth;

  const imp = Math.min(1, Math.max(0, importance));
  const baseR = R_MAX * (1 - imp) + 24;
  const jitter = (((h >>> 16) & 0xff) / 0xff - 0.5) * 22;
  const r = Math.min(R_MAX - 6, Math.max(26, baseR + jitter));

  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a), a, r };
}

// Quadratic bezier with midpoint pulled toward the core — synapses bow inward
function synapsePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = CX - mx;
  const dy = CY - my;
  const k = 0.35;
  const bx = mx + dx * k;
  const by = my + dy * k;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${bx.toFixed(1)} ${by.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hud-line px-2 py-1.5">
      <div className="hud-label">{label}</div>
      <div className="text-hud-cyan font-mono text-[11px]">{value}</div>
    </div>
  );
}

export function NeuralMapPanel() {
  const [data, setData] = useState<GraphReport>({ nodes: [], links: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showSynapses, setShowSynapses] = useState(true);
  const [showSweep, setShowSweep] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('importance');
  const [refreshKey, setRefreshKey] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    api.graph().then(setData).catch(() => setData({ nodes: [], links: [] }));
  }, [refreshKey]);

  const linkCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of data.links) {
      m.set(l.source, (m.get(l.source) ?? 0) + 1);
      m.set(l.target, (m.get(l.target) ?? 0) + 1);
    }
    return m;
  }, [data.links]);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    for (const n of data.nodes) m[n.type] = (m[n.type] ?? 0) + 1;
    return m;
  }, [data.nodes]);

  const filtered = useMemo(() => {
    let list = typeFilter ? data.nodes.filter((n) => n.type === typeFilter) : data.nodes;
    switch (sortKey) {
      case 'importance':
        list = [...list].sort((a, b) => b.importance - a.importance);
        break;
      case 'recent':
        list = [...list].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        break;
      case 'links':
        list = [...list].sort((a, b) => (linkCount.get(b.id) ?? 0) - (linkCount.get(a.id) ?? 0));
        break;
      case 'type':
        list = [...list].sort((a, b) => a.type.localeCompare(b.type) || b.importance - a.importance);
        break;
    }
    return list;
  }, [data.nodes, typeFilter, sortKey, linkCount]);

  const positions = useMemo(() => {
    const m = new Map<string, { x: number; y: number; a: number; r: number }>();
    for (const n of data.nodes) m.set(n.id, positionFor(n.id, n.type, n.importance));
    return m;
  }, [data.nodes]);

  const neighbors = useMemo(() => {
    if (!selected) return new Set<string>();
    const n = new Set<string>();
    for (const l of data.links) {
      if (l.source === selected) n.add(l.target);
      if (l.target === selected) n.add(l.source);
    }
    return n;
  }, [data.links, selected]);

  const visibleIds = useMemo(() => new Set(filtered.map((n) => n.id)), [filtered]);
  const synapses = showSynapses
    ? data.links.filter((l) => visibleIds.has(l.source) && visibleIds.has(l.target))
    : [];

  const maxTypeCount = Math.max(...Object.values(byType), 1);
  const avgImp = data.nodes.length
    ? data.nodes.reduce((s, n) => s + n.importance, 0) / data.nodes.length
    : 0;

  const hoveredNode = hovered ? data.nodes.find((n) => n.id === hovered) : null;

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* CONTROL DECK */}
      <Panel
        code="NEU-A"
        title="Control Deck"
        subtitle="// filters · stats"
        className="col-span-3 flex flex-col overflow-y-auto"
        delay={0.05}
      >
        <div className="space-y-5">
          <div>
            <div className="hud-label mb-1.5">SORT / HIGHLIGHT</div>
            <div className="flex flex-wrap gap-1">
              {(['importance', 'recent', 'links', 'type'] as SortKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setSortKey(k)}
                  className={cn(
                    'hud-chip transition-colors',
                    sortKey === k
                      ? 'border-hud-cyan text-hud-cyan bg-hud-cyan/10'
                      : 'hover:border-hud-cyan/60',
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="hud-label">SECTOR LOCK</span>
              {typeFilter && (
                <button
                  className="font-mono text-[10px] text-hud-cyanDim hover:text-hud-cyan"
                  onClick={() => setTypeFilter(null)}
                >
                  clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {TYPE_ORDER.map((type) => {
                const meta = TYPE_META[type];
                const count = byType[type] ?? 0;
                const active = typeFilter === type;
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(active ? null : type)}
                    className={cn(
                      'relative border px-2 py-1.5 text-left transition-all',
                      active
                        ? 'border-hud-cyan bg-hud-cyan/10'
                        : count === 0
                          ? 'border-hud-line/40 opacity-50'
                          : 'border-hud-line hover:border-hud-cyan/60',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'font-display text-[10px] tracking-[0.2em]',
                          meta.color,
                        )}
                      >
                        {meta.code}
                      </span>
                      <span className="font-mono text-[10px] text-hud-text">{count}</span>
                    </div>
                    <div className="mt-1 h-[3px] bg-black/50">
                      <div
                        className="h-full"
                        style={{
                          background: meta.hex,
                          width: `${(count / maxTypeCount) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-0.5 font-mono text-[9px] text-hud-mute">
                      sector · {meta.sector}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="hud-label mb-1.5">LAYERS</div>
            <div className="space-y-1">
              <button
                onClick={() => setShowSynapses((v) => !v)}
                className={cn(
                  'hud-chip w-full text-left transition-colors',
                  showSynapses
                    ? 'border-hud-cyan text-hud-cyan bg-hud-cyan/10'
                    : 'hover:border-hud-cyan/60',
                )}
              >
                synapses · {showSynapses ? 'on' : 'off'}
              </button>
              <button
                onClick={() => setShowSweep((v) => !v)}
                className={cn(
                  'hud-chip w-full text-left transition-colors',
                  showSweep
                    ? 'border-hud-cyan text-hud-cyan bg-hud-cyan/10'
                    : 'hover:border-hud-cyan/60',
                )}
              >
                radar sweep · {showSweep ? 'on' : 'off'}
              </button>
            </div>
          </div>

          <div>
            <div className="hud-label mb-1.5">TELEMETRY</div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="NEURONS" value={`${filtered.length}/${data.nodes.length}`} />
              <Stat label="SYNAPSES" value={String(data.links.length)} />
              <Stat label="AVG·IMP" value={avgImp.toFixed(2)} />
              <Stat label="CLUSTERS" value={String(Object.keys(byType).length)} />
            </div>
          </div>

          <div>
            <div className="hud-label mb-1.5">ORBITAL KEY</div>
            <div className="space-y-1 font-mono text-[10px]">
              {RINGS.map((ring) => (
                <div key={ring.label} className="flex items-center gap-2">
                  <span className="w-6 text-center text-hud-cyanDim">{ring.label[0]}</span>
                  <span className="flex-1 text-hud-text">{ring.label}</span>
                  <span className="text-hud-mute">imp ≥ {ring.thresh.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 font-mono text-[10px] text-hud-mute leading-relaxed">
              // closer to core = higher importance
              <br />
              // sector = memory type
            </div>
          </div>
        </div>
      </Panel>

      {/* CONSTELLATION */}
      <Panel
        code="NEU-02"
        title="Neural Constellation"
        subtitle="// polar radar · type ⇒ sector · imp ⇒ radius"
        className="col-span-6 flex flex-col"
        delay={0.1}
        actions={
          <button
            className="hud-chip hover:border-hud-cyan/60 hover:text-hud-cyan"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            resync
          </button>
        }
      >
        <div className="flex-1 min-h-0 relative border border-hud-line bg-black/60 overflow-hidden">
          {data.nodes.length === 0 ? (
            <div className="h-full flex items-center justify-center font-mono text-xs text-hud-mute">
              // CONSTELLATION EMPTY — NO SIGNALS DETECTED
            </div>
          ) : (
            <>
              {showSweep && !reducedMotion && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none animate-[spin_9s_linear_infinite]"
                  style={{
                    background:
                      'conic-gradient(from 0deg at 50% 50%, rgba(0,240,255,0) 0deg, rgba(0,240,255,0.14) 26deg, rgba(0,240,255,0) 60deg, rgba(0,240,255,0) 360deg)',
                    mixBlendMode: 'screen',
                  }}
                />
              )}
              <svg
                viewBox={`0 0 ${VB.w} ${VB.h}`}
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full relative"
              >
                <defs>
                  <radialGradient id="stage-fill" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#072030" stopOpacity="0.75" />
                    <stop offset="60%" stopColor="#040912" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#020408" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.5" />
                    <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <circle cx={CX} cy={CY} r={R_MAX + 12} fill="url(#stage-fill)" />

                {/* concentric rings */}
                {RINGS.map((ring, i) => (
                  <g key={ring.label}>
                    <circle
                      cx={CX}
                      cy={CY}
                      r={ring.r}
                      fill="none"
                      stroke="rgba(0,240,255,0.18)"
                      strokeWidth="0.6"
                      strokeDasharray={i === 0 ? undefined : '1.5 4'}
                    />
                    <text
                      x={CX + ring.r + 6}
                      y={CY - 3}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="8"
                      fill="rgba(0,240,255,0.38)"
                      letterSpacing="1"
                    >
                      {ring.label}
                    </text>
                  </g>
                ))}

                {/* sector dividers + labels */}
                {TYPE_ORDER.map((type, i) => {
                  const a = -Math.PI / 2 + (i / TYPE_ORDER.length) * Math.PI * 2;
                  const x1 = CX + Math.cos(a) * 40;
                  const y1 = CY + Math.sin(a) * 40;
                  const x2 = CX + Math.cos(a) * R_MAX;
                  const y2 = CY + Math.sin(a) * R_MAX;
                  const labelA = a + Math.PI / TYPE_ORDER.length;
                  const lx = CX + Math.cos(labelA) * (R_MAX + 30);
                  const ly = CY + Math.sin(labelA) * (R_MAX + 30);
                  const meta = TYPE_META[type];
                  const active = typeFilter === type;
                  return (
                    <g key={type}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="rgba(0,240,255,0.12)"
                        strokeWidth="0.5"
                      />
                      <text
                        x={lx}
                        y={ly}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily="Orbitron, sans-serif"
                        fontSize="11"
                        letterSpacing="2"
                        fill={active ? meta.hex : 'rgba(0,240,255,0.5)'}
                        opacity={active ? 1 : 0.9}
                      >
                        {meta.code}
                      </text>
                    </g>
                  );
                })}

                {/* core */}
                <circle cx={CX} cy={CY} r={60} fill="url(#core-glow)" />
                <circle cx={CX} cy={CY} r={4} fill="#00f0ff" />
                <circle
                  cx={CX}
                  cy={CY}
                  r={10}
                  fill="none"
                  stroke="rgba(0,240,255,0.6)"
                  strokeWidth="0.8"
                />
                <circle
                  cx={CX}
                  cy={CY}
                  r={18}
                  fill="none"
                  stroke="rgba(0,240,255,0.25)"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                />
                <text
                  x={CX}
                  y={CY + 34}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8"
                  fill="rgba(0,240,255,0.55)"
                  letterSpacing="2"
                >
                  CORE
                </text>

                {/* synapses */}
                {synapses.length > 0 && (
                  <g fill="none">
                    {synapses.map((l, i) => {
                      const a = positions.get(l.source);
                      const b = positions.get(l.target);
                      if (!a || !b) return null;
                      const isSel =
                        l.source === selected ||
                        l.target === selected ||
                        l.source === hovered ||
                        l.target === hovered;
                      return (
                        <path
                          key={i}
                          d={synapsePath(a.x, a.y, b.x, b.y)}
                          stroke={isSel ? '#00f0ff' : 'rgba(0,240,255,0.18)'}
                          strokeWidth={isSel ? 1.2 : 0.5}
                          opacity={isSel ? 0.95 : 0.6}
                        />
                      );
                    })}
                  </g>
                )}

                {/* nodes */}
                {filtered.map((n) => {
                  const p = positions.get(n.id);
                  if (!p) return null;
                  const meta = TYPE_META[n.type] ?? FALLBACK;
                  const sel = n.id === selected;
                  const hov = n.id === hovered;
                  const near = selected ? neighbors.has(n.id) : false;
                  const dim = selected && !sel && !near;
                  const rOuter = 3 + n.importance * 6;
                  const rInner = rOuter * 0.55;
                  return (
                    <g
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${n.type} memory · importance ${Math.round(n.importance * 100)}`}
                      aria-pressed={sel}
                      style={{ cursor: 'pointer', outline: 'none' }}
                      onClick={() => setSelected(n.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelected(n.id);
                        }
                      }}
                      onFocus={() => setHovered(n.id)}
                      onBlur={() => setHovered((h) => (h === n.id ? null : h))}
                      onMouseEnter={() => setHovered(n.id)}
                      onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                      opacity={dim ? 0.3 : 1}
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={rOuter + (sel ? 8 : hov || near ? 3 : 1)}
                        fill={meta.hex}
                        opacity={sel ? 0.4 : hov || near ? 0.22 : 0.08}
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={rOuter}
                        fill="none"
                        stroke={meta.hex}
                        strokeWidth={sel ? 1.6 : 0.9}
                        opacity={sel ? 1 : hov || near ? 0.95 : 0.7}
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={rInner}
                        fill={meta.hex}
                        opacity={sel ? 1 : 0.9}
                      />
                      {sel && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={rOuter + 6}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="0.7"
                          strokeDasharray="3 2"
                        />
                      )}
                    </g>
                  );
                })}

                {/* crosshair on selected */}
                {selected && positions.get(selected) && (
                  <g stroke="rgba(0,240,255,0.35)" strokeWidth="0.5" strokeDasharray="3 4">
                    <line
                      x1={positions.get(selected)!.x}
                      y1={0}
                      x2={positions.get(selected)!.x}
                      y2={VB.h}
                    />
                    <line
                      x1={0}
                      y1={positions.get(selected)!.y}
                      x2={VB.w}
                      y2={positions.get(selected)!.y}
                    />
                  </g>
                )}

                {/* corner brackets */}
                <g stroke="rgba(0,240,255,0.6)" strokeWidth="1" fill="none">
                  <path d="M 8 8 L 8 22 M 8 8 L 22 8" />
                  <path d={`M ${VB.w - 8} 8 L ${VB.w - 8} 22 M ${VB.w - 8} 8 L ${VB.w - 22} 8`} />
                  <path d={`M 8 ${VB.h - 8} L 8 ${VB.h - 22} M 8 ${VB.h - 8} L 22 ${VB.h - 8}`} />
                  <path
                    d={`M ${VB.w - 8} ${VB.h - 8} L ${VB.w - 8} ${
                      VB.h - 22
                    } M ${VB.w - 8} ${VB.h - 8} L ${VB.w - 22} ${VB.h - 8}`}
                  />
                </g>

                <g
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8"
                  fill="rgba(0,240,255,0.55)"
                  letterSpacing="1"
                >
                  <text x="16" y="22">// NEU-02 · POLAR CONSTELLATION · v0.2</text>
                  <text x={VB.w - 16} y="22" textAnchor="end">
                    N={data.nodes.length} · S={data.links.length} · F={filtered.length}
                  </text>
                  <text x="16" y={VB.h - 14}>TYPE→SECTOR  IMP→RADIUS</text>
                  <text x={VB.w - 16} y={VB.h - 14} textAnchor="end">
                    {sortKey.toUpperCase()}
                    {typeFilter ? ` · ${typeFilter.toUpperCase()} LOCK` : ''}
                  </text>
                </g>
              </svg>

              {hoveredNode && (
                <div className="absolute left-3 right-3 bottom-3 border border-hud-line bg-black/90 px-3 py-2 pointer-events-none">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={cn(
                        'font-display text-[10px] tracking-[0.2em]',
                        (TYPE_META[hoveredNode.type] ?? FALLBACK).color,
                      )}
                    >
                      {(TYPE_META[hoveredNode.type] ?? FALLBACK).code}
                    </span>
                    <span className="font-mono text-[10px] text-hud-cyan">
                      IMP {Math.round(hoveredNode.importance * 100)}
                    </span>
                    <span className="font-mono text-[10px] text-hud-mute">
                      LNK {linkCount.get(hoveredNode.id) ?? 0}
                    </span>
                    <span className="font-mono text-[10px] text-hud-mute truncate">
                      {hoveredNode.id.slice(0, 14)}…
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-hud-text line-clamp-2 leading-snug">
                    {hoveredNode.content}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Panel>

      {/* INSPECTOR */}
      <Panel
        code="NEU-03"
        title="Signal Inspector"
        subtitle="// node dossier"
        className="col-span-3 overflow-y-auto"
        delay={0.15}
      >
        <MemoryDetail
          id={selected}
          onDeleted={() => {
            setSelected(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      </Panel>
    </div>
  );
}
