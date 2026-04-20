import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps {
  title?: string;
  subtitle?: string;
  code?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
  delay?: number;
}

export function Panel({ title, subtitle, code, actions, className, children, delay = 0 }: PanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={cn('hud-panel relative', className)}
    >
      <div className="hud-corners">
        <span /><span />
      </div>
      {(title || actions) && (
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-hud-line">
          <div className="flex items-baseline gap-3">
            {code && <span className="hud-label text-hud-cyan">{code}</span>}
            {title && <h2 className="font-display uppercase tracking-[0.2em] text-sm text-hud-text">{title}</h2>}
            {subtitle && <span className="font-mono text-[11px] text-hud-mute">{subtitle}</span>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </motion.section>
  );
}
