import { motion } from 'framer-motion';

export function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div
        className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[14.5px] leading-snug whitespace-pre-line ${
          isUser
            ? 'bg-forest-700 text-cream-50 rounded-br-md'
            : 'bg-white text-ink-900 border border-forest-100/60 rounded-bl-md shadow-card'
        }`}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-white border border-forest-100/60 rounded-2xl rounded-bl-md px-4 py-3 shadow-card">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-typing" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-typing" style={{ animationDelay: '160ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-forest-400 animate-typing" style={{ animationDelay: '320ms' }} />
        </div>
      </div>
    </div>
  );
}
