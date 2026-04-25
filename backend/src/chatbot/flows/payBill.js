/**
 * PAY BILL FLOW
 *
 * States:
 *   PAY_BILL_AWAITING_ACCOUNT   (skipped if 1 account)
 *   PAY_BILL_AWAITING_BILLER    (skipped if bill type hint resolves)
 *   PAY_BILL_AWAITING_CONFIRM   (Yes/No buttons OR typed yes/no)
 *
 * All button-driven states also accept typed text so the composer stays enabled.
 */

import { formatPKR } from '../../utils/refId.js';
import { mainMenuOptions } from '../flowEngine.js';
import { debitAccount } from '../../services/transactionService.js';
import { getBills, getRecentTransactions } from '../../data/repository.js';
import { NotFoundError } from '../../utils/errors.js';
import {
  resolveAccountByText,
  resolveBillerByText,
  resolveConfirmation
} from '../flowUtils.js';

const CATEGORY_ICON = {
  electricity: '⚡',
  gas:         '🔥',
  internet:    '🌐',
  water:       '💧'
};

export async function start({ user, context }) {
  if (user.accounts.length === 0) throw new NotFoundError('Account');

  if (user.accounts.length === 1) {
    return askBiller(user, { ...context, accountId: user.accounts[0].accountId });
  }

  return {
    response: {
      messages: [{ role: 'assistant', text: 'Which account should pay the bill?' }],
      options: user.accounts.map((a) => ({
        id: 'acc_' + a.accountId,
        label: `${a.title} ${a.maskedNumber} · ${formatPKR(a.balance)}`,
        value: a.accountId
      })),
      state: 'PAY_BILL_AWAITING_ACCOUNT'
    },
    nextFlowState: { state: 'PAY_BILL_AWAITING_ACCOUNT', context }
  };
}

export async function step({ user, state, context, input }) {

  // ── Account selection ────────────────────────────────────────────────────
  if (state === 'PAY_BILL_AWAITING_ACCOUNT') {
    const accountId =
      input.optionValue ??
      resolveAccountByText(user.accounts, input.text);

    if (!accountId) {
      return {
        response: {
          messages: [
            { role: 'assistant', text: "I couldn't match that account. Please tap one below or type the account name." },
            { role: 'assistant', text: 'Which account should pay the bill?' }
          ],
          options: user.accounts.map((a) => ({
            id: 'acc_' + a.accountId,
            label: `${a.title} ${a.maskedNumber} · ${formatPKR(a.balance)}`,
            value: a.accountId
          })),
          state: 'PAY_BILL_AWAITING_ACCOUNT'
        },
        nextFlowState: { state: 'PAY_BILL_AWAITING_ACCOUNT', context }
      };
    }

    return askBiller(user, { ...context, accountId });
  }

  // ── Biller selection ─────────────────────────────────────────────────────
  if (state === 'PAY_BILL_AWAITING_BILLER') {
    const bills = await getBills(user.userId);
    const billerId =
      input.optionValue ??
      resolveBillerByText(bills, input.text);

    if (!billerId) {
      return askBiller(
        user,
        context,
        "I couldn't find that biller. Please tap one below or type the bill type (e.g. electricity, gas, internet)."
      );
    }

    const bill = bills.find((b) => b.billerId === billerId);
    if (!bill) return askBiller(user, context, "Biller not found. Please try again.");

    const account = user.accounts.find((a) => a.accountId === context.accountId);
    if (account.balance < bill.currentDue) {
      return cancel(
        user,
        `Insufficient funds. Your ${account.title} balance is ${formatPKR(account.balance)} but the bill is ${formatPKR(bill.currentDue)}.`
      );
    }

    return askConfirm(user, { ...context, billerId });
  }

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (state === 'PAY_BILL_AWAITING_CONFIRM') {
    const answer =
      input.optionValue ??
      resolveConfirmation(input.text);

    if (answer === 'CONFIRM_NO')  return cancel(user, 'Bill payment cancelled. No money has moved.');
    if (answer === 'CONFIRM_YES') return execute(user, context);

    return askConfirm(
      user,
      context,
      "Please tap ✓ Yes or ✕ Cancel — or type \"yes\" / \"no\"."
    );
  }

  throw new Error('Unexpected state in Pay Bill flow: ' + state);
}

// ---------------------------------------------------------------------------
// Internal step builders
// ---------------------------------------------------------------------------

async function askBiller(user, context, prefixMessage) {
  const bills = await getBills(user.userId);

  // Smart skip: if a bill type hint was pre-extracted, try to resolve it
  if (context.billTypeHint && !prefixMessage) {
    const matchedBill = bills.find((b) => b.category === context.billTypeHint);
    if (matchedBill) {
      const account = user.accounts.find((a) => a.accountId === context.accountId);
      if (account && account.balance < matchedBill.currentDue) {
        return cancel(
          user,
          `Insufficient funds. Your ${account.title} balance is ${formatPKR(account.balance)} but the ${matchedBill.billerName} bill is ${formatPKR(matchedBill.currentDue)}.`
        );
      }
      return askConfirm(user, { ...context, billerId: matchedBill.billerId });
    }
  }

  if (!bills.length) {
    return cancel(user, "You don't have any saved billers. Please add a biller in your account settings first.");
  }

  const messages = [];
  if (prefixMessage) messages.push({ role: 'assistant', text: prefixMessage });
  messages.push({ role: 'assistant', text: 'Which bill would you like to pay?' });

  return {
    response: {
      messages,
      options: bills.map((b) => ({
        id:    'bil_' + b.billerId,
        label: `${CATEGORY_ICON[b.category] || '•'} ${b.billerName} · ${formatPKR(b.currentDue)} · due ${b.dueDate}`,
        value: b.billerId
      })),
      state: 'PAY_BILL_AWAITING_BILLER'
    },
    nextFlowState: { state: 'PAY_BILL_AWAITING_BILLER', context }
  };
}

async function askConfirm(user, context, prefixMessage) {
  const bills   = await getBills(user.userId);
  const bill    = bills.find((b) => b.billerId === context.billerId);
  const account = user.accounts.find((a) => a.accountId === context.accountId);

  const messages = [];
  if (prefixMessage) messages.push({ role: 'assistant', text: prefixMessage });
  messages.push({
    role: 'assistant',
    text: `Please confirm:\n\nPay ${formatPKR(bill.currentDue)} to ${bill.billerName} (${bill.accountNumber})\nFrom: ${account.title} ${account.maskedNumber}`
  });

  return {
    response: {
      messages,
      options: [
        { id: 'opt_yes', label: '✓ Yes, pay now', value: 'CONFIRM_YES' },
        { id: 'opt_no',  label: '✕ Cancel',       value: 'CONFIRM_NO'  }
      ],
      state: 'PAY_BILL_AWAITING_CONFIRM'
    },
    nextFlowState: { state: 'PAY_BILL_AWAITING_CONFIRM', context }
  };
}

async function execute(user, context) {
  const bills = await getBills(user.userId);
  const bill  = bills.find((b) => b.billerId === context.billerId);

  const { transaction, newBalance } = await debitAccount({
    userId:      user.userId,
    accountId:   context.accountId,
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

  const recent = await getRecentTransactions(user.userId, context.accountId, 3);

  return {
    response: {
      messages: [{
        role: 'assistant',
        text: `Paid! ${formatPKR(bill.currentDue)} to ${bill.billerName}.\nNew balance: ${formatPKR(newBalance)}\nRef: ${transaction.refId}`
      }],
      options: mainMenuOptions(),
      receipt: {
        type:           'bill_success',
        amount:         bill.currentDue,
        billerName:     bill.billerName,
        billerCategory: bill.category,
        consumerNumber: bill.accountNumber,
        newBalance,
        refId:          transaction.refId,
        timestamp:      transaction.timestamp,
        recent
      },
      state: 'IDLE',
      done:  true
    },
    nextFlowState: { state: 'IDLE', context: {} }
  };
}

function cancel(user, text) {
  return {
    response: {
      messages: [{ role: 'assistant', text }],
      options:  mainMenuOptions(),
      state:    'IDLE',
      done:     true
    },
    nextFlowState: { state: 'IDLE', context: {} }
  };
}
