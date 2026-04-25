import { motion } from 'framer-motion';
import { CheckCircle2, ArrowUpRight, Wallet, Receipt as ReceiptIcon, ListChecks, ShieldOff } from 'lucide-react';
import { formatPKR, formatDateTime, formatDate, TXN_ICON } from '../utils/format.js';

/**
 * Single dispatcher — picks the visual based on receipt.type:
 *   balance              → big number card
 *   transfer_success     → green check + amount + ref id + mini-statement
 *   bill_success         → same, but for bills
 *   transaction_list     → list of last 10 txns
 */
export function ReceiptCard({ receipt }) {
  if (!receipt) return null;

  switch (receipt.type) {
    case 'balance':           return <BalanceReceipt {...receipt} />;
    case 'account_list':      return <AccountListReceipt {...receipt} />;
    case 'bill_list':         return <BillListReceipt {...receipt} />;
    case 'card_list':         return <CardListReceipt {...receipt} />;
    case 'transfer_success':  return <TransferReceipt {...receipt} />;
    case 'bill_success':      return <BillReceipt {...receipt} />;
    case 'transaction_list':  return <TransactionListReceipt {...receipt} />;
    case 'spending_analytics': return <SpendingAnalyticsReceipt {...receipt} />;
    case 'beneficiary_list':   return <BeneficiaryListReceipt {...receipt} />;
    case 'card_blocked':      return <CardBlockedReceipt {...receipt} />;
    default: return null;
  }
}

function AccountListReceipt({ accounts = [] }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-3 border-b border-forest-100/60 bg-forest-50/40">
        <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">Your Accounts</p>
      </div>
      <ul className="px-5 py-3 space-y-2">
        {accounts.map((a) => (
          <li key={a.accountId} className="rounded-xl border border-forest-100/70 px-3 py-2">
            <p className="text-[13px] font-medium text-ink-900">{a.title}</p>
            <p className="text-[11px] text-ink-500">{a.maskedNumber} · {a.type}</p>
            <p className="text-[12px] num font-medium text-ink-900 mt-0.5">{formatPKR(a.balance)}</p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function BillListReceipt({ bills = [] }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-3 border-b border-forest-100/60 bg-forest-50/40">
        <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">Pending Bills</p>
      </div>
      <ul className="px-5 py-3 space-y-2">
        {bills.map((b) => (
          <li key={b.billerId} className="rounded-xl border border-forest-100/70 px-3 py-2">
            <p className="text-[13px] font-medium text-ink-900">{b.billerName}</p>
            <p className="text-[11px] text-ink-500 capitalize">{b.category} · {b.accountNumber}</p>
            <p className="text-[12px] num font-medium text-ink-900 mt-0.5">{formatPKR(b.currentDue)}</p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function CardListReceipt({ cards = [] }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-3 border-b border-forest-100/60 bg-forest-50/40">
        <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">Your Cards</p>
      </div>
      <ul className="px-5 py-3 space-y-2">
        {cards.map((c) => (
          <li key={c.cardId} className="rounded-xl border border-forest-100/70 px-3 py-2">
            <p className="text-[13px] font-medium text-ink-900">{c.network} {c.type} ••••{c.last4}</p>
            <p className="text-[11px] text-ink-500">Exp {c.expiryDate} · <span className="capitalize">{c.status}</span></p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function BeneficiaryListReceipt({ personal = [], charity = [], billers = [] }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-3 border-b border-forest-100/60 bg-forest-50/40">
        <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">
          Saved Beneficiaries
        </p>
        <p className="text-[11px] text-ink-500 mt-0.5">
          Personal: <span className="num">{personal.length}</span> · Charity: <span className="num">{charity.length}</span> · Billers: <span className="num">{billers.length}</span>
        </p>
      </div>
      <div className="px-5 py-3 space-y-3">
        {personal.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-medium mb-1.5">Personal</p>
            <ul className="space-y-1.5">
              {personal.map((b) => (
                <li key={b.beneficiaryId} className="rounded-xl border border-forest-100/70 px-3 py-2">
                  <p className="text-[13px] font-medium text-ink-900">{b.nickname}</p>
                  <p className="text-[11px] text-ink-500">{b.bank} · <span className="num">{b.maskedNumber}</span></p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {charity.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-medium mb-1.5">Charity</p>
            <ul className="space-y-1.5">
              {charity.map((b) => (
                <li key={b.beneficiaryId} className="rounded-xl border border-forest-100/70 bg-forest-50/40 px-3 py-2">
                  <p className="text-[13px] font-medium text-ink-900">{b.nickname}</p>
                  <p className="text-[11px] text-ink-500">{b.bank} · <span className="num">{b.maskedNumber}</span></p>
                </li>
              ))}
            </ul>
          </section>
        )}
        {billers.length > 0 && (
          <section>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-medium mb-1.5">Billers</p>
            <ul className="space-y-1.5">
              {billers.map((b) => (
                <li key={b.beneficiaryId} className="rounded-xl border border-forest-100/70 bg-cream-100/40 px-3 py-2">
                  <p className="text-[13px] font-medium text-ink-900">{b.nickname}</p>
                  <p className="text-[11px] text-ink-500 capitalize">{b.bank} · <span className="num">{b.maskedNumber}</span></p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </motion.div>
  );
}

function SpendingAnalyticsReceipt({
  periodDays,
  transactionCountRequested,
  basisLabel,
  totalSpend,
  avgDailySpend,
  transactionCount,
  byType = [],
  timeline = [],
  topTransactions = []
}) {
  const max = Math.max(...timeline.map((d) => Number(d.amount || 0)), 1);
  const chartData = timeline.slice(-10);

  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-3 border-b border-forest-100/60 bg-forest-50/40">
        <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">
          Spending Analytics
        </p>
        <p className="text-[11px] text-ink-500 mt-0.5">
          Basis: <span className="num">{basisLabel || (transactionCountRequested ? `last ${transactionCountRequested} transactions` : `last ${periodDays} days`)}</span>
        </p>
        <p className="text-[11px] text-ink-500">
          Transactions analyzed: <span className="num">{transactionCount}</span>
        </p>
      </div>

      <div className="px-5 py-3 grid grid-cols-2 gap-y-2 gap-x-3 text-[11px]">
        <Cell label="Total Spend"><span className="num font-medium text-ink-900">{formatPKR(totalSpend)}</span></Cell>
        <Cell label="Avg / Active Day"><span className="num">{formatPKR(avgDailySpend)}</span></Cell>
      </div>

      {chartData.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-medium mb-2">Trend</p>
          <div className="h-28 flex items-end gap-1.5">
            {chartData.map((point) => (
              <div key={point.day} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-forest-500/85"
                  style={{ height: `${Math.max(8, (Number(point.amount || 0) / max) * 84)}px` }}
                  title={`${point.date || point.label}: ${formatPKR(point.amount)}`}
                />
                <span className="text-[9px] text-ink-400 num">{point.label || String(point.day || '').slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {byType.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-ink-500 font-medium mb-1.5">By Type</p>
          <ul className="space-y-1">
            {byType.slice(0, 4).map((row) => (
              <li key={row.type} className="flex items-center justify-between text-[12px]">
                <span className="capitalize text-ink-700">{row.type}</span>
                <span className="num font-medium text-ink-900">{formatPKR(row.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {topTransactions.length > 0 && (
        <>
          <div className="gold-rule mx-5 my-1" />
          <div className="px-5 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium mb-2">Top Spending</p>
            <ul className="space-y-1.5">
              {topTransactions.slice(0, 3).map((t, i) => (
                <li key={`${t.date}_${i}`} className="flex items-center gap-2 text-[12px]">
                  <span className="flex-1 truncate text-ink-700">{t.description}</span>
                  <span className="num text-ink-400 text-[10px]">{t.date}</span>
                  <span className="num font-medium text-ink-900">{formatPKR(t.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
function BalanceReceipt({ accountTitle, accountMasked, balance, currency }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card relative overflow-hidden mb-3">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-forest-500 via-brass-400 to-forest-700" />
      <div className="px-5 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={14} className="text-forest-700" />
          <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">
            Available Balance
          </p>
        </div>
        <p className="font-display text-3xl font-semibold num text-ink-900 leading-none">
          {formatPKR(balance)}
        </p>
        <p className="text-[12px] text-ink-500 mt-2">
          {accountTitle} · <span className="num">{accountMasked}</span>
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
function TransferReceipt({ amount, beneficiary, beneficiaryBank, beneficiaryAccount, newBalance, refId, timestamp, recent }) {
  return (
    <SuccessReceipt
      Icon={ArrowUpRight}
      headline={`Sent to ${beneficiary}`}
      subline={`${beneficiaryBank} · ${beneficiaryAccount}`}
      amount={amount}
      refId={refId}
      timestamp={timestamp}
      newBalance={newBalance}
      recent={recent}
    />
  );
}

function BillReceipt({ amount, billerName, billerCategory, consumerNumber, newBalance, refId, timestamp, recent }) {
  return (
    <SuccessReceipt
      Icon={ReceiptIcon}
      headline={`Paid ${billerName}`}
      subline={`${billerCategory} · ${consumerNumber}`}
      amount={amount}
      refId={refId}
      timestamp={timestamp}
      newBalance={newBalance}
      recent={recent}
    />
  );
}

function SuccessReceipt({ Icon, headline, subline, amount, refId, timestamp, newBalance, recent }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-4 flex items-start gap-3 border-b border-forest-100/60">
        <div className="w-10 h-10 rounded-full bg-forest-600 text-cream-50 flex items-center justify-center shrink-0">
          <CheckCircle2 size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">
            Successful
          </p>
          <p className="font-display font-semibold text-ink-900 text-base mt-0.5 truncate flex items-center gap-1">
            <Icon size={14} className="shrink-0" /> {headline}
          </p>
          <p className="text-[11px] text-ink-500 truncate mt-0.5">{subline}</p>
        </div>
        <p className="font-display text-lg font-semibold num text-ink-900 shrink-0">
          {formatPKR(amount)}
        </p>
      </div>

      <div className="px-5 py-3 grid grid-cols-2 gap-y-2 gap-x-3 text-[11px]">
        <Cell label="Reference">
          <span className="font-mono text-[10.5px]">{refId}</span>
        </Cell>
        <Cell label="When">
          <span className="num">{formatDateTime(timestamp)}</span>
        </Cell>
        <Cell label="New Balance">
          <span className="num font-medium text-ink-900">{formatPKR(newBalance)}</span>
        </Cell>
        <Cell label="Status"><span className="text-forest-700 font-medium">Completed</span></Cell>
      </div>

      {/* Mini statement preview */}
      {recent?.length > 0 && (
        <>
          <div className="gold-rule mx-5 my-1" />
          <div className="px-5 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink-500 font-medium mb-2">
              Mini Statement
            </p>
            <ul className="space-y-1.5">
              {recent.slice(0, 3).map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-[12px]">
                  <span className="text-ink-400 w-3 text-center">{TXN_ICON[t.type] || '•'}</span>
                  <span className="flex-1 truncate text-ink-700">{t.description}</span>
                  <span className="num text-ink-400 text-[10px]">{formatDate(t.timestamp)}</span>
                  <span className={`num font-medium w-20 text-right ${t.type === 'credit' ? 'text-forest-600' : 'text-ink-900'}`}>
                    {t.type === 'credit' ? '+' : '−'}{formatPKR(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </motion.div>
  );
}

function Cell({ label, children }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.16em] text-ink-400 font-medium">{label}</p>
      <p className="text-[12px] text-ink-800 mt-0.5">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
function TransactionListReceipt({ accountTitle, accountMasked, transactions = [] }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-3 flex items-center gap-2 border-b border-forest-100/60 bg-forest-50/40">
        <ListChecks size={14} className="text-forest-700" />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-forest-700 font-medium">
            Last {transactions.length} Transactions
          </p>
          <p className="text-[11px] text-ink-500 mt-0.5">{accountTitle} · <span className="num">{accountMasked}</span></p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-6 text-center text-[12px] text-ink-500">No transactions yet.</p>
      ) : (
        <ul className="divide-y divide-forest-100/40">
          {transactions.map((t) => (
            <li key={t.id} className="px-5 py-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                t.type === 'credit' ? 'bg-forest-100 text-forest-700' : 'bg-cream-200/70 text-ink-700'
              }`}>
                <span>{TXN_ICON[t.type] || '•'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-ink-900 truncate">{t.description}</p>
                <p className="text-[10px] text-ink-500 num mt-0.5">
                  {formatDate(t.timestamp)} · <span className="font-mono">{t.refId}</span>
                </p>
              </div>
              <div className={`text-[13px] font-semibold num shrink-0 ${
                t.type === 'credit' ? 'text-forest-600' : 'text-ink-900'
              }`}>
                {t.type === 'credit' ? '+' : '−'}{formatPKR(t.amount)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
function CardBlockedReceipt({ network, cardType, last4, maskedNumber, blockedAt }) {
  return (
    <motion.div {...rise} className="bg-white border border-forest-100/60 rounded-2xl shadow-card overflow-hidden mb-3">
      <div className="px-5 py-4 flex items-start gap-3 border-b border-forest-100/60">
        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
          <ShieldOff size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-red-600 font-medium">Card Blocked</p>
          <p className="font-display font-semibold text-ink-900 text-base mt-0.5">
            {network} {cardType} ••••{last4}
          </p>
          <p className="text-[11px] text-ink-500 mt-0.5 num">{maskedNumber}</p>
        </div>
      </div>
      <div className="px-5 py-3 grid grid-cols-2 gap-y-2 text-[11px]">
        <Cell label="Status"><span className="text-red-600 font-medium">Blocked</span></Cell>
        <Cell label="Blocked At"><span className="num">{blockedAt ? new Date(blockedAt).toLocaleString('en-PK') : '—'}</span></Cell>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
const rise = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
};
