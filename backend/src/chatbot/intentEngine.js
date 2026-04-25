/**
 * Intent detection — deterministic keyword matching.
 * Maps user input to one of 4 intents, or returns null (out of scope).
 *
 * Roman Urdu keywords are first-class. Order matters: more specific intents
 * are tested before generic ones.
 */

export const INTENTS = {
  CHECK_BALANCE:    'check_balance',
  FUND_TRANSFER:    'fund_transfer',
  PAY_BILL:         'pay_bill',
  TRANSACTIONS:     'transactions'
};

// Each entry: { intent, patterns: [string|RegExp] }
// Patterns are matched against the LOWERCASED input.
// Strings match if present as a whole word; regexes match raw.
const RULES = [
  // Last 10 transactions  (test before "balance" — "transaction history" should win over a stray "balance" word)
  {
    intent: INTENTS.TRANSACTIONS,
    patterns: [
      'transactions', 'transaction history', 'last 10', 'recent transactions',
      'mini statement', 'statement',
      'lendaen', 'lain dain', 'lein dein',          // Roman Urdu: dealings/transactions
      'history dikhao', 'transactions dikhao',
      'pichli', 'recent activity'
    ]
  },

  // Pay Bill
  {
    intent: INTENTS.PAY_BILL,
    patterns: [
      'pay bill', 'bill pay', 'utility bill', 'pay my bill',
      'electricity bill', 'gas bill', 'internet bill',
      'water bill', 'dues', 'monthly due', 'invoice',
      'topup', 'top up', 'mobile recharge', 'recharge',
      'bill bharo', 'bill pay karna', 'bill pay karo', 'bill jama',
      'bijli ka bill', 'gas ka bill', 'internet ka bill',
      'k-electric', 'ke bill', 'ssgc', 'ptcl'
    ]
  },

  // Fund Transfer
  {
    intent: INTENTS.FUND_TRANSFER,
    patterns: [
      'transfer', 'send money', 'send funds', 'fund transfer', 'wire',
      'groceries', 'grocery', 'shopping', 'merchant payment', 'vendor payment',
      'pay to', 'payment to', 'store payment',
      'paise bhejna', 'paise bhejo', 'paisay bhejna',
      'rupay bhejo', 'transfer karna', 'transfer karo',
      'bhejna hai', 'send karna', 'send karo',
      'remit'
    ]
  },

  // Check Balance — broadest, last
  {
    intent: INTENTS.CHECK_BALANCE,
    patterns: [
      'balance', 'check balance', 'my balance', 'account balance',
      'balance batao', 'balance check', 'balance kya hai', 'kitne paise',
      'kitne paisay', 'available balance', 'kitna hai'
    ]
  }
];

/**
 * Detect intent from raw text. Returns INTENTS.* or null.
 */
export function detectIntent(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.trim().toLowerCase();
  if (!lower) return null;

  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (p instanceof RegExp) {
        if (p.test(lower)) return rule.intent;
      } else if (lower.includes(p)) {
        return rule.intent;
      }
    }
  }
  return null;
}

/** Friendly label for an intent (for chat replies) */
export function intentLabel(intent) {
  return {
    [INTENTS.CHECK_BALANCE]: 'Check Balance',
    [INTENTS.FUND_TRANSFER]: 'Fund Transfer',
    [INTENTS.PAY_BILL]:      'Pay Bill',
    [INTENTS.TRANSACTIONS]:  'Last 10 Transactions'
  }[intent] || intent;
}

/**
 * Extract a beneficiary name hint from free-form text.
 * Returns a lowercase name string or null.
 * Used to pre-fill context so the beneficiary selection step can be skipped.
 */
export function extractBeneficiaryHint(text) {
  if (!text) return null;
  const lower = text.trim().toLowerCase();

  const patterns = [
    // "to wife sara", "to my friend bilal" — relationship keyword before name
    /\bto\s+(?:my\s+)?(?:wife|husband|bhai|behen|maa|baap|friend|yaar|dost|bro|sis|sister|brother|uncle|aunty|boss|family|mama|papa|ammi|abbu)\s+([a-z][a-z]{2,20})/,
    // Roman Urdu: NAME comes BEFORE "ko" — "bilal ko paise bhejna"
    /\b([a-z][a-z]{2,20})\s+ko\s+(?:paise|paisay|rupay|send|transfer|bhejna|bhejo)/,
    // "send money to sara", "transfer money to bilal"
    /send\s+(?:money\s+)?to\s+([a-z][a-z\s]{2,25})(?:\s|$)/,
    /transfer\s+(?:money\s+)?to\s+([a-z][a-z\s]{2,25})(?:\s|$)/,
    // Generic English: "to sara"
    /\bto\s+([a-z][a-z]{2,20})(?:\s|$)/,
  ];

  const stopWords = new Set([
    'the', 'my', 'his', 'her', 'their', 'and', 'or', 'please', 'now',
    'account', 'bank', 'money', 'funds', 'transfer', 'send', 'pay',
  ]);

  for (const p of patterns) {
    const m = lower.match(p);
    if (m) {
      const name = m[1].trim();
      if (name.length >= 2 && !stopWords.has(name)) return name;
    }
  }
  return null;
}

/**
 * Extract a bill category from free-form text.
 * Returns 'electricity' | 'gas' | 'internet' | 'water' | null.
 */
export function extractBillType(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/bijli|electric|k.electric|lesco|iesco|kesc|mepco|hesco|qesco/.test(lower)) return 'electricity';
  if (/\bgas\b|ssgc|sngpl/.test(lower)) return 'gas';
  if (/internet|wifi|wi.fi|broadband|ptcl|nayatel|stormfiber|fiberlink/.test(lower)) return 'internet';
  if (/water|pani|kwsb|wasa/.test(lower)) return 'water';
  return null;
}
