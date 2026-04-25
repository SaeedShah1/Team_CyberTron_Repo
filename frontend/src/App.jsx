import { useEffect, useState } from 'react';
import { LoginScreen } from './screens/LoginScreen.jsx';
import { ChatScreen } from './screens/ChatScreen.jsx';
import { api, tokenStore } from './services/api.js';

export default function App() {
  const [auth, setAuth] = useState(null); // { user, sessionTimeoutMs }
  const [bootstrapping, setBootstrapping] = useState(true);

  // On mount: if we have a stored token, try to use it
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setBootstrapping(false); return; }
    api.me()
      .then((res) => {
        setAuth({ user: res.user, sessionTimeoutMs: res.sessionRemainingMs });
      })
      .catch(() => {
        tokenStore.clear();
      })
      .finally(() => setBootstrapping(false));
  }, []);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    tokenStore.clear();
    setAuth(null);
  };

  if (bootstrapping) return null; // brief flash, no UI

  return (
    <div className="min-h-screen md:flex md:items-center md:justify-center md:gap-12 md:py-8 md:px-4">
      <SidePanel hasAuth={!!auth} />

      {auth
        ? <ChatScreen
            user={auth.user}
            sessionTimeoutMs={auth.sessionTimeoutMs}
            onLogout={handleLogout}
            onSessionExpired={() => setAuth(null)}
          />
        : <LoginScreen onLoggedIn={(result) => {
            setAuth({ user: result.user, sessionTimeoutMs: result.sessionTimeoutMs });
          }} />
      }
    </div>
  );
}

function SidePanel({ hasAuth }) {
  return (
    <aside className="hidden md:block max-w-sm">
      <p className="text-[10px] uppercase tracking-[0.22em] text-forest-700 font-medium mb-4">
        Banking Chatbot · Pakistan
      </p>
      <h2 className="font-display text-5xl font-semibold leading-[1.05] text-ink-900 mb-5">
        BanklifyAi.<br />
        <span className="italic text-forest-700">A bank that listens.</span>
      </h2>
      <p className="text-[15px] text-ink-700 leading-relaxed mb-6 max-w-[360px]">
        Four operations, guided every step of the way. Type in English or
        Roman Urdu — say <em>"balance batao"</em> and watch it work.
      </p>
      <div className="gold-rule mb-6" />
      <div className="space-y-3 text-[13px]">
        <Feat label="Controlled flow" body="Every action is button-driven and confirmed before money moves. No surprises." />
        <Feat label="Roman Urdu native" body='Type "balance batao", "paise bhejna", or "bill bharo" — the intent engine handles it.' />
        <Feat label="Real persistence" body="Every transfer and bill payment writes atomically to the JSON store with a unique reference ID." />
        <Feat label="Session security" body="Five-minute idle timeout. Bcrypt-hashed passwords. All state on the server." />
      </div>
      {!hasAuth && (
        <p className="mt-6 text-[11px] text-ink-400 italic">
          Use the demo credentials shown on the right to sign in.
        </p>
      )}
    </aside>
  );
}

function Feat({ label, body }) {
  return (
    <div>
      <p className="font-display font-semibold text-forest-800 mb-0.5">{label}</p>
      <p className="text-ink-500 leading-relaxed">{body}</p>
    </div>
  );
}
