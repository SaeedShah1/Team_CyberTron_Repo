/**
 * FUND TRANSFER FLOW
 *
 * States:
 *   FUND_TRANSFER_AWAITING_ACCOUNT     (skipped if 1 account)
 *   FUND_TRANSFER_AWAITING_BENEFICIARY (skipped if name hint resolves)
 *   FUND_TRANSFER_AWAITING_AMOUNT      (always free text)
 *   FUND_TRANSFER_AWAITING_CONFIRM     (Yes/No buttons OR typed yes/no)
 *
 * All button-driven states also accept typed text so the composer can
 * remain enabled at all times.
 */

import { formatPKR } from '../../utils/refId.js';
import { mainMenuOptions } from '../flowEngine.js';
import { debitAccount } from '../../services/transactionService.js';
import { getRecentTransactions } from '../../data/repository.js';
import { NotFoundError } from '../../utils/errors.js';
import {
  resolveAccountByText,
  resolveBeneficiaryByText,
  resolveConfirmation
} from '../flowUtils.js';

export async function start({ user, context }) {
  if (user.accounts.length === 0) throw new NotFoundError('Account');

  if (user.accounts.length === 1) {
    return askBeneficiary(user, { ...context, accountId: user.accounts[0].accountId });
  }

  return {
    response: {
      messages: [{ role: 'assistant', text: 'Which account should I send from?' }],
      options: user.accounts.map((a) => ({
        id: 'acc_' + a.accountId,
        label: `${a.title} ${a.maskedNumber} · ${formatPKR(a.balance)}`,
        value: a.accountId
      })),
      state: 'FUND_TRANSFER_AWAITING_ACCOUNT'
    },
    nextFlowState: { state: 'FUND_TRANSFER_AWAITING_ACCOUNT', context }
  };
}

export async function step({ user, state, context, input }) {

  // ── Account selection ────────────────────────────────────────────────────
  if (state === 'FUND_TRANSFER_AWAITING_ACCOUNT') {
    const accountId =
      input.optionValue ??
      resolveAccountByText(user.accounts, input.text);

    if (!accountId) {
      return {
        response: {
          messages: [
            { role: 'assistant', text: "I couldn't match that account. Please tap one below or type the account name." },
            { role: 'assistant', text: 'Which account should I send from?' }
          ],
          options: user.accounts.map((a) => ({
            id: 'acc_' + a.accountId,
            label: `${a.title} ${a.maskedNumber} · ${formatPKR(a.balance)}`,
            value: a.accountId
          })),
          state: 'FUND_TRANSFER_AWAITING_ACCOUNT'
        },
        nextFlowState: { state: 'FUND_TRANSFER_AWAITING_ACCOUNT', context }
      };
    }

    return askBeneficiary(user, { ...context, accountId });
  }

  // ── Beneficiary selection ────────────────────────────────────────────────
  if (state === 'FUND_TRANSFER_AWAITING_BENEFICIARY') {
    const beneficiaryId =
      input.optionValue ??
      resolveBeneficiaryByText(user.beneficiaries, input.text);

    if (!beneficiaryId) {
      return askBeneficiary(
        user,
        context,
        "I couldn't find that name in your saved beneficiaries. Please tap one below or try typing a different name."
      );
    }

    const beneficiary = user.beneficiaries.find((b) => b.id === beneficiaryId);
    if (!beneficiary) return askBeneficiary(user, context, "Beneficiary not found. Please try again.");

    return askAmount(user, { ...context, beneficiaryId });
  }

  // ── Amount entry ─────────────────────────────────────────────────────────
  if (state === 'FUND_TRANSFER_AWAITING_AMOUNT') {
    const raw = (input.text || '').replace(/[,\s]/g, '');
    const amount = Number(raw);

    if (!Number.isFinite(amount) || amount <= 0) {
      return askAmount(user, context, "Please enter a valid positive amount in PKR, e.g. 5000.");
    }
    if (!Number.isInteger(amount * 100)) {
      return askAmount(user, context, "Amount can have at most 2 decimal places.");
    }

    const account = user.accounts.find((a) => a.accountId === context.accountId);
    if (account.balance < amount) {
      return askAmount(
        user,
        context,
        `Insufficient balance. Your ${account.title} has ${formatPKR(account.balance)} available. Please enter a smaller amount.`
      );
    }

    return askConfirm(user, { ...context, amount });
  }

  // ── Confirmation ─────────────────────────────────────────────────────────
  if (state === 'FUND_TRANSFER_AWAITING_CONFIRM') {
    const answer =
      input.optionValue ??
      resolveConfirmation(input.text);

    if (answer === 'CONFIRM_NO')  return cancel(user, 'Transfer cancelled. No money has moved.');
    if (answer === 'CONFIRM_YES') return execute(user, context);

    return askConfirm(
      user,
      context,
      "Please tap ✓ Yes or ✕ Cancel — or type \"yes\" / \"no\"."
    );
  }

  throw new Error('Unexpected state in Fund Transfer flow: ' + state);
}

// ---------------------------------------------------------------------------
// Internal step builders
// ---------------------------------------------------------------------------

function askBeneficiary(user, context, prefixMessage) {
  // Smart skip: if a beneficiary hint was pre-extracted, try to resolve it now
  if (context.beneficiaryNameHint && !prefixMessage) {
    const matchedId = resolveBeneficiaryByText(user.beneficiaries, context.beneficiaryNameHint);
    if (matchedId) {
      return askAmount(user, { ...context, beneficiaryId: matchedId });
    }
  }

  if (!user.beneficiaries.length) {
    return cancel(user, "You don't have any saved beneficiaries. Please add one in your account settings first.");
  }

  const messages = [];
  if (prefixMessage) messages.push({ role: 'assistant', text: prefixMessage });
  messages.push({ role: 'assistant', text: 'Who would you like to send money to?' });

  return {
    response: {
      messages,
      options: user.beneficiaries.map((b) => ({
        id: 'ben_' + b.id,
        label: `${b.nickname} · ${b.bank} ${b.maskedNumber}`,
        value: b.id
      })),
      state: 'FUND_TRANSFER_AWAITING_BENEFICIARY'
    },
    nextFlowState: { state: 'FUND_TRANSFER_AWAITING_BENEFICIARY', context }
  };
}

function askAmount(user, context, prefixMessage) {
  const beneficiary = user.beneficiaries.find((b) => b.id === context.beneficiaryId);
  const messages = [];
  if (prefixMessage) messages.push({ role: 'assistant', text: prefixMessage });
  messages.push({
    role: 'assistant',
    text: `How much would you like to send to ${beneficiary.nickname}? (enter amount in PKR)`
  });
  return {
    response: {
      messages,
      options: null,
      state: 'FUND_TRANSFER_AWAITING_AMOUNT'
    },
    nextFlowState: { state: 'FUND_TRANSFER_AWAITING_AMOUNT', context }
  };
}

function askConfirm(user, context, prefixMessage) {
  const account     = user.accounts.find((a) => a.accountId === context.accountId);
  const beneficiary = user.beneficiaries.find((b) => b.id === context.beneficiaryId);
  const messages = [];
  if (prefixMessage) messages.push({ role: 'assistant', text: prefixMessage });
  messages.push({
    role: 'assistant',
    text: `Please confirm:\n\nSend ${formatPKR(context.amount)} from ${account.title} ${account.maskedNumber} to ${beneficiary.nickname} (${beneficiary.bank} ${beneficiary.maskedNumber})?`
  });
  return {
    response: {
      messages,
      options: [
        { id: 'opt_yes', label: '✓ Yes, transfer', value: 'CONFIRM_YES' },
        { id: 'opt_no',  label: '✕ Cancel',        value: 'CONFIRM_NO'  }
      ],
      state: 'FUND_TRANSFER_AWAITING_CONFIRM'
    },
    nextFlowState: { state: 'FUND_TRANSFER_AWAITING_CONFIRM', context }
  };
}

async function execute(user, context) {
  const beneficiary = user.beneficiaries.find((b) => b.id === context.beneficiaryId);

  const { transaction, newBalance } = await debitAccount({
    userId:      user.userId,
    accountId:   context.accountId,
    amount:      context.amount,
    type:        'transfer',
    description: `Transfer to ${beneficiary.nickname}`,
    meta: {
      beneficiaryId:      beneficiary.id,
      beneficiaryName:    beneficiary.fullName,
      beneficiaryBank:    beneficiary.bank,
      beneficiaryAccount: beneficiary.maskedNumber
    }
  });

  const recent = await getRecentTransactions(user.userId, context.accountId, 3);

  return {
    response: {
      messages: [{
        role: 'assistant',
        text: `Done! ${formatPKR(context.amount)} sent to ${beneficiary.nickname}.\nNew balance: ${formatPKR(newBalance)}\nRef: ${transaction.refId}`
      }],
      options: mainMenuOptions(),
      receipt: {
        type:               'transfer_success',
        amount:             context.amount,
        beneficiary:        beneficiary.nickname,
        beneficiaryBank:    beneficiary.bank,
        beneficiaryAccount: beneficiary.maskedNumber,
        newBalance,
        refId:              transaction.refId,
        timestamp:          transaction.timestamp,
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
