/**
 * Shared text-resolution helpers used across all chatbot flow modules.
 * Each function converts a natural-language string into the structured
 * value the flow state machine needs.
 */

/** Match an account from free-form text. Returns accountId or null. */
export function resolveAccountByText(accounts, text) {
  if (!text) return null;
  const lower = text.trim().toLowerCase();

  // Exact title
  for (const a of accounts) {
    if (a.title.toLowerCase() === lower) return a.accountId;
  }
  // Partial title (both directions)
  for (const a of accounts) {
    const t = a.title.toLowerCase();
    if (t.includes(lower) || lower.includes(t)) return a.accountId;
  }
  // Account type keywords
  if (/\b(savings|saving|bachat)\b/.test(lower)) {
    const a = accounts.find((a) => a.type === 'savings');
    if (a) return a.accountId;
  }
  if (/\b(current|chequing|checking)\b/.test(lower)) {
    const a = accounts.find((a) => a.type === 'current');
    if (a) return a.accountId;
  }
  // Ordinals / positional
  if (/\b(first|1st|pehla|pehli)\b/.test(lower)) return accounts[0]?.accountId ?? null;
  if (/\b(second|2nd|doosra|doosri)\b/.test(lower)) return accounts[1]?.accountId ?? null;
  // Account number fragment (digits only)
  const digits = text.replace(/\D/g, '');
  if (digits.length >= 3) {
    for (const a of accounts) {
      const masked = (a.maskedNumber || '').replace(/\D/g, '');
      if (masked && masked.endsWith(digits)) return a.accountId;
    }
  }
  return null;
}

/** Match a beneficiary from free-form text. Returns beneficiary id or null. */
export function resolveBeneficiaryByText(beneficiaries, text) {
  if (!text) return null;
  const lower = text.trim().toLowerCase();

  // Exact nickname
  for (const b of beneficiaries) {
    if (b.nickname.toLowerCase() === lower) return b.id;
  }
  // Partial nickname or full name
  for (const b of beneficiaries) {
    if (
      b.nickname.toLowerCase().includes(lower) ||
      b.fullName.toLowerCase().includes(lower)
    ) return b.id;
  }
  // Each word in user input against each word in nickname/fullName
  const queryWords = lower.split(/\s+/).filter((w) => w.length >= 2);
  for (const b of beneficiaries) {
    const nameWords = (b.nickname + ' ' + b.fullName)
      .toLowerCase()
      .split(/\s+/);
    if (queryWords.some((qw) => nameWords.includes(qw))) return b.id;
  }
  // Charity alias mapping
  const charityAliases = [
    { rx: /\bchhipa\b/, id: 'CHR_CHHIPA' },
    { rx: /\bred\s*crescent\b|\bprcs\b/, id: 'CHR_RED_CRESCENT' },
    { rx: /\bedhi\b/, id: 'CHR_EDHI' }
  ];
  for (const { rx, id } of charityAliases) {
    if (rx.test(lower)) {
      const charity = beneficiaries.find((b) => b.id === id);
      if (charity) return charity.id;
    }
  }
  return null;
}

/** Match a bill from free-form text. Returns billerId or null. */
export function resolveBillerByText(bills, text) {
  if (!text) return null;
  const lower = text.trim().toLowerCase();

  // Category keywords → find first matching bill
  const categoryMap = [
    { regex: /bijli|electric|k.electric|lesco|iesco|kesc|mepco|hesco|qesco/,  cat: 'electricity' },
    { regex: /\bgas\b|ssgc|sngpl/,                                             cat: 'gas'         },
    { regex: /internet|wifi|wi.fi|broadband|ptcl|nayatel|stormfiber|fiberlink/, cat: 'internet'   },
    { regex: /water|pani|kwsb|wasa/,                                            cat: 'water'       },
  ];
  for (const { regex, cat } of categoryMap) {
    if (regex.test(lower)) {
      const b = bills.find((b) => b.category === cat);
      if (b) return b.billerId;
    }
  }
  // Biller name partial match
  for (const b of bills) {
    if (b.billerName.toLowerCase().includes(lower) || lower.includes(b.billerName.toLowerCase())) {
      return b.billerId;
    }
  }
  return null;
}

/**
 * Parse a yes/no confirmation from free-form text.
 * Returns 'CONFIRM_YES', 'CONFIRM_NO', or null.
 */
export function resolveConfirmation(text) {
  if (!text) return null;
  const lower = text.trim().toLowerCase();
  if (/^(yes|y|confirm|ok|okay|sure|proceed|ha|haan|haji|bilkul|zaroor|karo|kar do|theek|theek hai|done|go ahead|continue|agree|approved|send it|pay it)/.test(lower)) {
    return 'CONFIRM_YES';
  }
  if (/^(no|n|cancel|nahi|na|band|rok|stop|nope|don'?t|mat karo|ruk|ruko|choro|chhoro|band karo|wapas|back|abort)/.test(lower)) {
    return 'CONFIRM_NO';
  }
  return null;
}
