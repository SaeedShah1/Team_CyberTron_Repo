/**
 * CHECK BALANCE FLOW
 *
 * States:
 *   CHECK_BALANCE_AWAITING_ACCOUNT  (only if 2+ accounts; accepts text OR button)
 *
 * Single-account users resolve immediately.
 */

import { formatPKR } from '../../utils/refId.js';
import { mainMenuOptions } from '../flowEngine.js';
import { resolveAccountByText } from '../flowUtils.js';

export async function start({ user }) {
  if (user.accounts.length === 1) return resolve(user, user.accounts[0]);

  return {
    response: {
      messages: [{ role: 'assistant', text: 'Which account would you like the balance for?' }],
      options: user.accounts.map((a) => ({
        id:    'acc_' + a.accountId,
        label: `${a.title} ${a.maskedNumber}`,
        value: a.accountId
      })),
      state: 'CHECK_BALANCE_AWAITING_ACCOUNT'
    },
    nextFlowState: { state: 'CHECK_BALANCE_AWAITING_ACCOUNT', context: {} }
  };
}

export async function step({ user, state, context, input }) {
  if (state === 'CHECK_BALANCE_AWAITING_ACCOUNT') {
    const accountId =
      input.optionValue ??
      resolveAccountByText(user.accounts, input.text);

    if (!accountId) {
      return {
        response: {
          messages: [
            { role: 'assistant', text: "I couldn't match that account. Please tap one below or type the account name (e.g. \"savings\")." },
            { role: 'assistant', text: 'Which account would you like the balance for?' }
          ],
          options: user.accounts.map((a) => ({
            id:    'acc_' + a.accountId,
            label: `${a.title} ${a.maskedNumber}`,
            value: a.accountId
          })),
          state: 'CHECK_BALANCE_AWAITING_ACCOUNT'
        },
        nextFlowState: { state: 'CHECK_BALANCE_AWAITING_ACCOUNT', context }
      };
    }

    const account = user.accounts.find((a) => a.accountId === accountId);
    if (!account) {
      return {
        response: {
          messages: [
            { role: 'assistant', text: "That account isn't on your profile. Please pick one below." }
          ],
          options: user.accounts.map((a) => ({
            id:    'acc_' + a.accountId,
            label: `${a.title} ${a.maskedNumber}`,
            value: a.accountId
          })),
          state: 'CHECK_BALANCE_AWAITING_ACCOUNT'
        },
        nextFlowState: { state: 'CHECK_BALANCE_AWAITING_ACCOUNT', context }
      };
    }

    return resolve(user, account);
  }

  throw new Error('Unexpected state in Check Balance flow: ' + state);
}

function resolve(user, account) {
  return {
    response: {
      messages: [
        {
          role: 'assistant',
          text: `Your ${account.title} (${account.maskedNumber}) balance is ${formatPKR(account.balance)}.`
        },
        {
          role: 'assistant',
          text: 'Anything else I can help with?'
        }
      ],
      options: mainMenuOptions(),
      receipt: {
        type:          'balance',
        accountTitle:  account.title,
        accountMasked: account.maskedNumber,
        balance:       account.balance,
        currency:      account.currency
      },
      state: 'IDLE',
      done:  true
    },
    nextFlowState: { state: 'IDLE', context: {} }
  };
}
