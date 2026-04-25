import { motion } from 'framer-motion';
import { LogOut, Clock } from 'lucide-react';
import { formatCountdown } from '../utils/format.js';

export function Header({ user, remainingMs, onLogout }) {
  const firstName = user?.fullName?.split(' ')[0] || '';
  const lowTime = remainingMs > 0 && remainingMs < 60_000;

  return (
    <header className="relative bg-forest-900 text-cream-50 px-5 pt-5 pb-5 overflow-hidden shrink-0">
      <div className="grain absolute inset-0" />
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse 400px 200px at 80% 0%, rgba(200, 156, 77, 0.18), transparent 70%)' }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tight">BanklifyAi</span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-cream-200/60">by cyberTron</span>
          </div>
          <div className="flex items-center gap-2">
            <SessionPill remainingMs={remainingMs} low={lowTime} />
            <button
              onClick={onLogout}
              className="w-7 h-7 rounded-full bg-forest-800/70 border border-forest-700/50 flex items-center justify-center text-cream-200 hover:text-cream-50 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
        <p className="text-cream-200/80 text-[13px]">
          Signed in as <span className="font-medium text-cream-50">{firstName}</span>
        </p>
        <div className="gold-rule mt-3" />
      </div>
    </header>
  );
}

function SessionPill({ remainingMs, low }) {
  if (remainingMs <= 0) return null;
  return (
    <motion.div
      animate={low ? { scale: [1, 1.04, 1] } : {}}
      transition={low ? { repeat: Infinity, duration: 1 } : {}}
      className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] num font-medium ${
        low
          ? 'bg-brass-400/20 border-brass-400/40 text-brass-400'
          : 'bg-forest-800/60 border-forest-700/50 text-cream-200/80'
      }`}
    >
      <Clock size={10} />
      <span>{formatCountdown(remainingMs)}</span>
    </motion.div>
  );
}
