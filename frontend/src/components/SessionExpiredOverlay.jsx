import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export function SessionExpiredOverlay({ onSignInAgain }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-forest-950/85 backdrop-blur-sm flex items-center justify-center px-6"
    >
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="bg-cream-50 rounded-2xl px-6 py-7 max-w-xs w-full text-center shadow-phone"
      >
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brass-400/15 border border-brass-400/30 flex items-center justify-center">
          <Lock size={20} className="text-brass-600" />
        </div>
        <h2 className="font-display text-lg font-semibold text-ink-900">Session expired</h2>
        <p className="text-[13px] text-ink-500 mt-1.5 leading-relaxed">
          For your security, we've signed you out due to inactivity.
        </p>
        <button
          onClick={onSignInAgain}
          className="mt-5 w-full py-2.5 bg-forest-700 text-cream-50 rounded-xl text-[14px] font-medium hover:bg-forest-800 transition-colors"
        >
          Sign in again
        </button>
      </motion.div>
    </motion.div>
  );
}
