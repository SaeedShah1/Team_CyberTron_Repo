import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

/**
 * The composer is ALWAYS enabled — the user can type at any point.
 * When the server is waiting for a button click, the placeholder reminds
 * the user they can also type their answer instead of tapping a button.
 *
 * `hasOptions`   — true when the server returned button options (hybrid mode)
 * `placeholderHint` — custom placeholder used when no options are showing
 */
export function Composer({ onSend, disabled, hasOptions, placeholderHint }) {
  const [text, setText] = useState('');
  const ref = useRef(null);

  // Auto-focus when switching to pure free-text mode (no buttons shown)
  useEffect(() => {
    if (!hasOptions && !disabled) ref.current?.focus();
  }, [hasOptions, disabled]);

  const submit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  const placeholder = disabled
    ? 'Thinking…'
    : hasOptions
      ? 'Or type your answer here…'
      : (placeholderHint || 'Type your message…');

  return (
    <div className="px-4 py-3 bg-cream-50 border-t border-forest-100/60 shrink-0">
      <div className={`flex items-end gap-2 bg-white rounded-2xl border px-3 py-2 shadow-card transition-colors ${
        disabled
          ? 'border-forest-100/40 opacity-60'
          : 'border-forest-200/60 focus-within:border-forest-400'
      }`}>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none outline-none text-[15px] bg-transparent placeholder:text-ink-400 max-h-32 py-1.5 disabled:cursor-not-allowed"
          style={{ minHeight: '24px' }}
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={submit}
          disabled={!canSend}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
            canSend
              ? 'bg-forest-700 text-cream-50 shadow-lift'
              : 'bg-forest-100 text-forest-400'
          }`}
          aria-label="Send"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </motion.button>
      </div>
      <p className="text-[10px] text-ink-400 text-center mt-1.5 tracking-wide">
        BanklifyAi · Type in English or Roman Urdu
      </p>
    </div>
  );
}
