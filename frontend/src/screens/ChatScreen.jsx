import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Header } from '../components/Header.jsx';
import { MessageBubble, TypingIndicator } from '../components/MessageBubble.jsx';
import { ButtonOptions } from '../components/ButtonOptions.jsx';
import { ReceiptCard } from '../components/ReceiptCard.jsx';
import { Composer } from '../components/Composer.jsx';
import { SessionExpiredOverlay } from '../components/SessionExpiredOverlay.jsx';
import { api, tokenStore } from '../services/api.js';
import { useSessionTimer } from '../hooks/useSessionTimer.js';

export function ChatScreen({ user, sessionTimeoutMs, onLogout, onSessionExpired }) {
  const [messages, setMessages]       = useState([]);
  const [activeOptions, setActiveOptions] = useState(null);
  const [isThinking, setIsThinking]   = useState(false);
  const [expired, setExpired]         = useState(false);

  const idRef    = useRef(0);
  const scrollRef = useRef(null);
  const nextId   = () => `m_${++idRef.current}`;

  const [remainingMs, setRemainingMs] = useSessionTimer(sessionTimeoutMs, () => {
    handleExpiry();
  });

  const handleExpiry = useCallback(() => {
    setExpired(true);
    tokenStore.clear();
  }, []);

  // Boot: fetch greeting + main menu
  useEffect(() => {
    let mounted = true;
    api.bootstrap()
      .then((res) => { if (mounted) applyResponse(res); })
      .catch((err) => {
        if (err.code === 'SESSION_EXPIRED') handleExpiry();
        else pushSystem(err.message);
      });
    return () => { mounted = false; };
  }, []);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, activeOptions, isThinking]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const pushSystem = (text) => {
    setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text }]);
  };

  const applyResponse = (res) => {
    if (typeof res.sessionRemainingMs === 'number') setRemainingMs(res.sessionRemainingMs);

    const r = res.response || res;
    const styleOnlyReceiptTypes = new Set([
      'balance',
      'account_list',
      'beneficiary_list',
      'bill_list',
      'card_list',
      'transfer_success',
      'bill_success',
      'transaction_list',
      'spending_analytics',
      'card_blocked'
    ]);
    const newMessages = (r.messages || []).map((m) => ({
      id: nextId(),
      role: m.role || 'assistant',
      text:
        r.receipt && styleOnlyReceiptTypes.has(r.receipt.type) && (m.role || 'assistant') === 'assistant'
          ? ''
          : m.text
    }));

    // Attach receipt to the last assistant message in this batch
    if (r.receipt && newMessages.length) {
      newMessages[newMessages.length - 1].receipt = r.receipt;
    }

    setMessages((prev) => [...prev, ...newMessages]);
    setActiveOptions(r.options || null);
  };

  // ── User actions ──────────────────────────────────────────────────────────

  const sendOption = async (opt) => {
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: opt.label }]);
    setActiveOptions(null);
    setIsThinking(true);
    try {
      const res = await api.chat({ optionValue: opt.value });
      applyResponse(res);
    } catch (err) {
      handleError(err);
    } finally {
      setIsThinking(false);
    }
  };

  const sendText = async (text) => {
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text }]);
    setActiveOptions(null);
    setIsThinking(true);
    try {
      const res = await api.chat({ text });
      applyResponse(res);
    } catch (err) {
      handleError(err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleError = (err) => {
    if (err.code === 'SESSION_EXPIRED') { handleExpiry(); return; }
    // Show the error inline; backend keeps state intact so the user can retry
    pushSystem(err.message);
  };

  return (
    <div className="phone-frame grain relative">
      <Header user={user} remainingMs={remainingMs} onLogout={onLogout} />

      <main ref={scrollRef} className="flex-1 overflow-y-auto scroll-area px-4 py-4">
        {messages.map((m) => (
          <div key={m.id}>
            {String(m.text || '').trim() ? <MessageBubble message={m} /> : null}
            {m.receipt && <ReceiptCard receipt={m.receipt} />}
          </div>
        ))}

        <ButtonOptions
          options={activeOptions}
          onPick={sendOption}
          disabled={isThinking}
        />

        <AnimatePresence>
          {isThinking && <TypingIndicator />}
        </AnimatePresence>
      </main>

      <Composer
        onSend={sendText}
        disabled={isThinking}
        hasOptions={!!activeOptions}
        placeholderHint="Try: balance batao · send money to sara · bijli ka bill"
      />

      <AnimatePresence>
        {expired && <SessionExpiredOverlay onSignInAgain={onSessionExpired} />}
      </AnimatePresence>
    </div>
  );
}
