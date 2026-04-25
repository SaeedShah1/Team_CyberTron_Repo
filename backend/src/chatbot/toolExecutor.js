/**
 * Tool Executor — maps Gemini function call names to real backend operations.
 *
 * Each handler receives (userId, args) and returns a plain object that is
 * sent back to Gemini as the function result.  Handlers that mutate data
 * also attach a `receipt` field which the agent surfaces to the frontend.
 */

import { formatPKR, generateRefId } from '../utils/refId.js';
import {
  findUserById,
  getBills,
  getRecentTransactions,
  getTransactionsForUser,
  getCards,
  blockCard as repoBlockCard
} from '../data/repository.js';
import { debitAccount } from '../services/transactionService.js';
import { logger } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Route table
// ---------------------------------------------------------------------------
const HANDLERS = {
  getAccounts,
  getBalance,
  getBeneficiaries,
  transferFunds,
  getBills:       getBillsTool,
  payBill,
  getTransactions,
  getSpendingAnalytics,
  getCards:       getCardsTool,
  blockCard
};

export async function executeTool(userId, name, args = {}) {
  const handler = HANDLERS[name];
  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }
  try {
    return await handler(userId, args);
  } catch (err) {
    logger.warn(`Tool ${name} error`, { userId, error: err.message });
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function getAccounts(userId) {
  const user = await findUserById(userId);
  if (!user) return { error: 'User not found' };
  const accounts = user.accounts.map((a) => ({
    accountId:    a.accountId,
    title:        a.title,
    type:         a.type,
    maskedNumber: a.maskedNumber,
    balance:      a.balance,
    currency:     a.currency
  }));
  return {
    accounts,
    receipt: {
      type: 'account_list',
      accounts
    }
  };
}

async function getBalance(userId, { accountId }) {
  const user = await findUserById(userId);
  if (!user) return { error: 'User not found' };
  const account = user.accounts.find((a) => a.accountId === accountId);
  if (!account) return { error: `Account ${accountId} not found` };
  return {
    accountId:    account.accountId,
    title:        account.title,
    maskedNumber: account.maskedNumber,
    balance:      account.balance,
    currency:     account.currency,
    formattedBalance: formatPKR(account.balance),
    receipt: {
      type: 'balance',
      accountTitle: account.title,
      accountMasked: account.maskedNumber,
      balance: account.balance,
      currency: account.currency
    }
  };
}

async function getBeneficiaries(userId) {
  const user = await findUserById(userId);
  if (!user) return { error: 'User not found' };
  const bills = await getBills(userId);
  const beneficiaries = (user.beneficiaries || []).map((b) => ({
    beneficiaryId: b.id,
    nickname:      b.nickname,
    fullName:      b.fullName,
    bank:          b.bank,
    maskedNumber:  b.maskedNumber,
    isCharity:     isCharityId(b.id)
  }));
  const billPayees = bills.map((b) => ({
    beneficiaryId: `BIL_${b.billerId}`,
    nickname: b.billerName,
    fullName: b.billerName,
    bank: b.category,
    maskedNumber: b.accountNumber,
    isCharity: false,
    isBiller: true
  }));

  const allPayees = [...beneficiaries, ...billPayees];
  return {
    beneficiaries: allPayees
  };
}

async function transferFunds(userId, { fromAccountId, beneficiaryId, amount }) {
  const user = await findUserById(userId);
  if (!user) return { error: 'User not found' };

  const beneficiary = (user.beneficiaries || []).find((b) => b.id === beneficiaryId);
  if (!beneficiary) return { error: `Beneficiary ${beneficiaryId} not found` };
  const isCharityDonation = isCharityId(beneficiary.id);

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return { error: 'Amount must be a positive number' };
  }

  const { transaction, newBalance } = await debitAccount({
    userId,
    accountId:   fromAccountId,
    amount:      numAmount,
    type:        'transfer',
    description: isCharityDonation
      ? `Charity donation to ${beneficiary.nickname}`
      : `Transfer to ${beneficiary.nickname}`,
    meta: {
      beneficiaryId:      beneficiary.id,
      beneficiaryName:    beneficiary.fullName,
      beneficiaryBank:    beneficiary.bank,
      beneficiaryAccount: beneficiary.maskedNumber,
      isCharityDonation
    }
  });

  const account = user.accounts.find((a) => a.accountId === fromAccountId);

  return {
    success:     true,
    refId:       transaction.refId,
    amount:      numAmount,
    beneficiary: beneficiary.nickname,
    isCharityDonation,
    newBalance,
    formattedAmount:     formatPKR(numAmount),
    formattedNewBalance: formatPKR(newBalance),
    timestamp:   transaction.timestamp,
    receipt: {
      type:               'transfer_success',
      amount:             numAmount,
      beneficiary:        beneficiary.nickname,
      beneficiaryBank:    beneficiary.bank,
      beneficiaryAccount: beneficiary.maskedNumber,
      fromAccount:        account?.title,
      isCharityDonation,
      newBalance,
      refId:              transaction.refId,
      timestamp:          transaction.timestamp
    }
  };
}

function isCharityId(beneficiaryId) {
  return String(beneficiaryId || '').toUpperCase().startsWith('CHR_');
}

async function getBillsTool(userId) {
  const bills = await getBills(userId);
  const mappedBills = bills.map((b) => ({
    billerId:          b.billerId,
    billerName:        b.billerName,
    category:          b.category,
    accountNumber:     b.accountNumber,
    currentDue:        b.currentDue,
    formattedDue:      formatPKR(b.currentDue),
    dueDate:           b.dueDate
  }));
  return {
    bills: mappedBills,
    receipt: {
      type: 'bill_list',
      bills: mappedBills
    }
  };
}

async function payBill(userId, { accountId, billerId }) {
  const user  = await findUserById(userId);
  if (!user) return { error: 'User not found' };

  const bills = await getBills(userId);
  const bill  = bills.find((b) => b.billerId === billerId);
  if (!bill) return { error: `Bill ${billerId} not found` };

  const account = user.accounts.find((a) => a.accountId === accountId);
  if (!account) return { error: `Account ${accountId} not found` };

  if (account.balance < bill.currentDue) {
    return {
      error: `Insufficient funds. Balance is ${formatPKR(account.balance)}, bill is ${formatPKR(bill.currentDue)}.`
    };
  }

  const { transaction, newBalance } = await debitAccount({
    userId,
    accountId,
    amount:      bill.currentDue,
    type:        'bill',
    description: `${bill.billerName} · Bill Payment`,
    meta: {
      billerId:       bill.billerId,
      billerName:     bill.billerName,
      billerCategory: bill.category,
      consumerNumber: bill.accountNumber
    }
  });

  return {
    success:     true,
    refId:       transaction.refId,
    billerName:  bill.billerName,
    amount:      bill.currentDue,
    newBalance,
    formattedAmount:     formatPKR(bill.currentDue),
    formattedNewBalance: formatPKR(newBalance),
    timestamp:   transaction.timestamp,
    receipt: {
      type:           'bill_success',
      amount:         bill.currentDue,
      billerName:     bill.billerName,
      billerCategory: bill.category,
      consumerNumber: bill.accountNumber,
      newBalance,
      refId:          transaction.refId,
      timestamp:      transaction.timestamp
    }
  };
}

async function getTransactions(userId, { accountId }) {
  const user = await findUserById(userId);
  if (!user) return { error: 'User not found' };

  const account = user.accounts.find((a) => a.accountId === accountId);
  if (!account) return { error: `Account ${accountId} not found` };

  const txns = await getRecentTransactions(userId, accountId, 10);
  return {
    accountTitle:  account.title,
    maskedNumber:  account.maskedNumber,
    transactions: txns.map((t) => ({
      refId:       t.refId,
      type:        t.type,
      amount:      t.amount,
      description: t.description,
      date:        t.timestamp.slice(0, 10),
      balanceAfter: t.balanceAfter
    })),
    receipt: {
      type:          'transaction_list',
      accountTitle:  account.title,
      accountMasked: account.maskedNumber,
      transactions:  txns
    }
  };
}

async function getSpendingAnalytics(userId, { periodDays = 30, transactionCount, accountId } = {}) {
  const user = await findUserById(userId);
  if (!user) return { error: 'User not found' };

  const days = Math.min(365, Math.max(7, Number(periodDays) || 30));
  const txCount = Number.isFinite(Number(transactionCount))
    ? Math.min(100, Math.max(3, Number(transactionCount)))
    : null;
  const txns = await getTransactionsForUser(userId, days, 600);

  const accountSet = new Set(user.accounts.map((a) => a.accountId));
  const filtered = txns.filter((t) => {
    if (!accountSet.has(t.accountId)) return false;
    if (accountId && t.accountId !== accountId) return false;
    return true;
  });

  let debitTxns = filtered.filter((t) => t.type !== 'credit');
  if (txCount) debitTxns = debitTxns.slice(0, txCount);
  const totalSpend = debitTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const byTypeMap = debitTxns.reduce((acc, t) => {
    const key = t.type || 'other';
    acc[key] = (acc[key] || 0) + Number(t.amount || 0);
    return acc;
  }, {});
  const byType = Object.entries(byTypeMap)
    .map(([type, amount]) => ({ type, amount }))
    .sort((a, b) => b.amount - a.amount);

  const timeline = txCount
    ? [...debitTxns]
      .reverse()
      .map((t, idx) => ({
        label: `T${idx + 1}`,
        amount: Number(t.amount || 0),
        date: String(t.timestamp).slice(0, 10)
      }))
    : (() => {
      const dailyMap = debitTxns.reduce((acc, t) => {
        const day = String(t.timestamp).slice(0, 10);
        acc[day] = (acc[day] || 0) + Number(t.amount || 0);
        return acc;
      }, {});
      return Object.keys(dailyMap)
        .sort()
        .map((day) => ({ label: day.slice(5), amount: dailyMap[day], date: day }));
    })();

  const topTransactions = [...debitTxns]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map((t) => ({
      description: t.description,
      amount: t.amount,
      date: t.timestamp.slice(0, 10),
      type: t.type
    }));

  const avgDailySpend = timeline.length ? totalSpend / timeline.length : 0;
  const basisLabel = txCount ? `last ${debitTxns.length} transactions` : `last ${days} days`;

  return {
    periodDays: days,
    transactionCountRequested: txCount,
    accountId: accountId || null,
    basisLabel,
    totalSpend,
    avgDailySpend,
    transactionCount: debitTxns.length,
    byType,
    timeline,
    topTransactions,
    receipt: {
      type: 'spending_analytics',
      periodDays: days,
      transactionCountRequested: txCount,
      basisLabel,
      totalSpend,
      avgDailySpend,
      transactionCount: debitTxns.length,
      byType,
      timeline,
      topTransactions
    }
  };
}

async function getCardsTool(userId) {
  const cards = await getCards(userId);
  const mappedCards = cards.map((c) => ({
    cardId:       c.cardId,
    type:         c.type,
    network:      c.network,
    last4:        c.last4,
    maskedNumber: c.maskedNumber,
    expiryDate:   c.expiryDate,
    status:       c.status,
    accountId:    c.accountId
  }));
  return {
    cards: mappedCards,
    receipt: {
      type: 'card_list',
      cards: mappedCards
    }
  };
}

async function blockCard(userId, { cardId }) {
  const card = await repoBlockCard(userId, cardId);
  return {
    success:      true,
    cardId:       card.cardId,
    last4:        card.last4,
    network:      card.network,
    type:         card.type,
    maskedNumber: card.maskedNumber,
    status:       'blocked',
    blockedAt:    card.blockedAt,
    receipt: {
      type:         'card_blocked',
      network:      card.network,
      cardType:     card.type,
      last4:        card.last4,
      maskedNumber: card.maskedNumber,
      blockedAt:    card.blockedAt
    }
  };
}
