/**
 * LAST 10 TRANSACTIONS FLOW
 *
 * States:
 *   TRANSACTIONS_AWAITING_ACCOUNT  (skipped if 1 account; accepts text OR button)
 */

import { mainMenuOptions } from '../flowEngine.js';
import { getRecentTransactions } from '../../data/repository.js';
import { resolveAccountByText } from '../flowUtils.js';

export async function start({ user }) {
  if (user.accounts.length === 1) return resolve(user, user.accounts[0].accountId);

  return {
    response: {
      messages: [{ role: 'assistant', text: "Which account's transactions would you like to see?" }],
      options: user.accounts.map((a) => ({
        id:    'acc_' + a.accountId,
        label: `${a.title} ${a.maskedNumber}`,
        value: a.accountId
      })),
      state: 'TRANSACTIONS_AWAITING_ACCOUNT'
    },
    nextFlowState: { state: 'TRANSACTIONS_AWAITING_ACCOUNT', context: {} }
  };
}

export async function step({ user, state, context, input }) {
  if (state === 'TRANSACTIONS_AWAITING_ACCOUNT') {
    const accountId =
      input.optionValue ??
      resolveAccountByText(user.accounts, input.text);

    if (!accountId) {
      return {
        response: {
          messages: [
            { role: 'assistant', text: "I couldn't match that account. Please tap one below or type the account name." },
            { role: 'assistant', text: "Which account's transactions would you like to see?" }
          ],
          options: user.accounts.map((a) => ({
            id:    'acc_' + a.accountId,
            label: `${a.title} ${a.maskedNumber}`,
            value: a.accountId
          })),
          state: 'TRANSACTIONS_AWAITING_ACCOUNT'
        },
        nextFlowState: { state: 'TRANSACTIONS_AWAITING_ACCOUNT', context }
      };
    }

    const account = user.accounts.find((a) => a.accountId === accountId);
    if (!account) {
      return {
        response: {
          messages: [{ role: 'assistant', text: "That account isn't on your profile. Please pick one below." }],
          options: user.accounts.map((a) => ({
            id:    'acc_' + a.accountId,
            label: `${a.title} ${a.maskedNumber}`,
            value: a.accountId
          })),
          state: 'TRANSACTIONS_AWAITING_ACCOUNT'
        },
        nextFlowState: { state: 'TRANSACTIONS_AWAITING_ACCOUNT', context }
      };
    }

    return resolve(user, accountId);
  }

  throw new Error('Unexpected state in Transactions flow: ' + state);
}

async function resolve(user, accountId) {
  const txns    = await getRecentTransactions(user.userId, accountId, 10);
  const account = user.accounts.find((a) => a.accountId === accountId);

  const text = txns.length
    ? `Here are your last ${txns.length} transactions for ${account.title}.`
    : `No transactions yet on ${account.title}.`;

  return {
    response: {
      messages: [{ role: 'assistant', text }],
      options:  mainMenuOptions(),
      receipt: {
        type:          'transaction_list',
        accountTitle:  account.title,
        accountMasked: account.maskedNumber,
        transactions:  txns
      },
      state: 'IDLE',
      done:  true
    },
    nextFlowState: { state: 'IDLE', context: {} }
  };
}
