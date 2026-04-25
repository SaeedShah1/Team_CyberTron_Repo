import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle } from 'lucide-react';
import { api, tokenStore } from '../services/api.js';

export function LoginScreen({ onLoggedIn }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!userId || !password) {
      setError('Please enter both User ID and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.login(userId.trim(), password);
      tokenStore.set(result.token);
      onLoggedIn(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="phone-frame grain">
      {/* Top hero */}
      <div className="relative bg-forest-900 text-cream-50 px-6 pt-10 pb-12 overflow-hidden">
        <div className="grain absolute inset-0" />
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(ellipse 400px 200px at 80% 0%, rgba(200, 156, 77, 0.18), transparent 70%)' }}
        />
        <div className="relative">
          <div className="inline-flex items-baseline gap-2 mb-1">
            <span className="font-display text-3xl font-semibold tracking-tight">BanklifyAi</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-cream-200/60">by cyberTron</span>
          </div>
          <p className="text-cream-200/70 text-sm">Sign in to continue</p>
          <div className="gold-rule mt-6" />
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6 py-8">
        <h1 className="font-display text-2xl font-semibold leading-tight mb-1">
          Welcome back.
        </h1>
        <p className="text-sm text-ink-500 mb-7">
          Use your banking credentials to sign in.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <Field
            label="User ID"
            icon={<User size={15} />}
            value={userId}
            onChange={setUserId}
            placeholder="user1"
            autoFocus
          />
          <Field
            label="Password"
            icon={<Lock size={15} />}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••"
          />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 px-3 py-2.5 bg-brass-400/10 border border-brass-400/30 rounded-xl"
            >
              <AlertCircle size={14} className="text-brass-600 mt-0.5 shrink-0" />
              <p className="text-[13px] text-ink-800">{error}</p>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={busy}
            className="w-full py-3 bg-forest-700 text-cream-50 rounded-xl font-medium text-[15px] disabled:opacity-50 shadow-lift hover:bg-forest-800 transition-colors"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>

        {/* Demo credentials hint */}
        {/* <div className="mt-8 p-3.5 bg-forest-50/60 border border-forest-100 rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium mb-2">
            Demo credentials
          </p>
          <div className="text-[12px] text-ink-700 space-y-1 num">
            <p><span className="text-ink-500">user1</span> / 1234 — Ahmed Khan (2 accounts)</p>
            <p><span className="text-ink-500">user2</span> / 1234 — Sara Khan (1 account)</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}

function Field({ label, icon, type = 'text', value, onChange, placeholder, autoFocus }) {
  return (
    <label className="block">
      <span className="block text-[11px] uppercase tracking-[0.16em] text-ink-500 font-medium mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-forest-200/60 rounded-xl focus-within:border-forest-400 transition-colors">
        <span className="text-ink-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 outline-none text-[15px] bg-transparent placeholder:text-ink-400"
        />
      </div>
    </label>
  );
}
