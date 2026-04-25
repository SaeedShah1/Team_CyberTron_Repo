import { motion, AnimatePresence } from 'framer-motion';

/**
 * Renders the option buttons returned by the server.
 * options shape: [{ id, label, value }] — null/empty means free-text.
 *
 * Layout:
 *   - Confirm-style 2-button rows (Yes/No or main menu CONFIRM_YES/NO) → side by side
 *   - Otherwise vertical stack
 */
export function ButtonOptions({ options, onPick, disabled }) {
  if (!options || options.length === 0) return null;

  // Detect Yes/No confirmation pattern → render side by side
  const isConfirm = options.length === 2 &&
    options.some((o) => String(o.value).startsWith('CONFIRM_'));

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={options.map((o) => o.id).join('|')}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={isConfirm ? 'grid grid-cols-2 gap-2 mb-3' : 'space-y-2 mb-3'}
      >
        {options.map((opt, i) => {
          const cardLike = isEntityCard(opt);
          return (
            <motion.button
            key={opt.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i }}
            whileTap={{ scale: 0.97 }}
            onClick={() => !disabled && onPick(opt)}
            disabled={disabled}
            className={`text-left px-4 py-3 rounded-xl text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-card ${
              isYes(opt)
                ? 'bg-forest-700 text-cream-50 hover:bg-forest-800 text-center'
                : isNo(opt)
                ? 'bg-white border border-forest-200 text-ink-700 hover:bg-cream-100 text-center'
                : `bg-white border border-forest-200 text-ink-900 hover:border-forest-400 hover:bg-forest-50/50 ${cardLike ? 'min-h-[62px]' : ''}`
            }`}
          >
            {cardLike ? (
              <span className="block">
                <span className="text-[10px] uppercase tracking-[0.16em] text-forest-700 font-medium">
                  {opt.id.startsWith('acc_') ? 'Account' : 'Beneficiary'}
                </span>
                <span className="block mt-1">{opt.label}</span>
              </span>
            ) : (
              opt.label
            )}
            </motion.button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

function isYes(opt) { return String(opt.value) === 'CONFIRM_YES'; }
function isNo(opt)  { return String(opt.value) === 'CONFIRM_NO'; }
function isEntityCard(opt) {
  const id = String(opt.id || '');
  return id.startsWith('acc_') || id.startsWith('ben_') || id.startsWith('charity_') || id.startsWith('card_');
}
