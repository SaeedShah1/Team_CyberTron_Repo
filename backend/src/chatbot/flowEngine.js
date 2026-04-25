/**
 * Flow Engine — finite-state machine driving all chatbot conversations.
 *
 * Key behaviours added over the base version:
 *   • Intent override: typing a new intent at ANY mid-flow state resets the
 *     flow and starts the newly requested operation.
 *   • Entity pre-fill: the first message is parsed for a beneficiary name
 *     (fund transfer) or bill type (pay bill) so those steps can be skipped.
 *   • Text input everywhere: every flow step now accepts both optionValue
 *     (button click) and text (typed answer), so the composer stays enabled.
 *
 * State shape stored on the session:
 *   { state: 'STATE_NAME', context: { ... } }
 *
 * ChatResponse shape:
 *   {
 *     messages: [{ role: 'assistant', text }]
 *     options:  [{ id, label, value }] | null
 *     state:    next FSM state name
 *     receipt?: { ... }
 *     done?:    boolean
 *   }
 */

import { INTENTS, detectIntent, intentLabel, extractBeneficiaryHint, extractBillType } from './intentEngine.js';
import * as checkBalance from './flows/checkBalance.js';
import * as fundTransfer from './flows/fundTransfer.js';
import * as payBill      from './flows/payBill.js';
import * as transactions from './flows/transactions.js';
import { findUserById } from '../data/repository.js';
import { InvalidInputError } from '../utils/errors.js';

const FLOWS = {
  CHECK_BALANCE: checkBalance,
  FUND_TRANSFER: fundTransfer,
  PAY_BILL:      payBill,
  TRANSACTIONS:  transactions
};

const INTENT_TO_FLOW = {
  [INTENTS.CHECK_BALANCE]: 'CHECK_BALANCE',
  [INTENTS.FUND_TRANSFER]: 'FUND_TRANSFER',
  [INTENTS.PAY_BILL]:      'PAY_BILL',
  [INTENTS.TRANSACTIONS]:  'TRANSACTIONS'
};

export async function handleTurn({ userId, flowState, input }) {
  const user = await findUserById(userId);
  if (!user) throw new InvalidInputError('User not found in session');

  const currentState = flowState?.state || 'IDLE';
  const context = { ...(flowState?.context || {}) };

  // -------------------------------------------------------------------------
  // 1. IDLE — detect intent from text or menu button click
  // -------------------------------------------------------------------------
  if (currentState === 'IDLE') {
    if (input.optionValue) {
      const intent = mapMenuToIntent(input.optionValue);
      if (intent) {
        const flowKey = INTENT_TO_FLOW[intent];
        return await FLOWS[flowKey].start({ user, context: {} });
      }
    }

    const text = (input.text || '').trim();
    if (!text) return { response: greet(user), nextFlowState: { state: 'IDLE', context: {} } };

    const intent = detectIntent(text);
    if (!intent) {
      return {
        response: {
          messages: [{ role: 'assistant', text: "I can help with balance, transfers, bills, and transactions. Please choose one or type what you need:" }],
          options: mainMenuOptions(),
          state: 'IDLE'
        },
        nextFlowState: { state: 'IDLE', context: {} }
      };
    }

    const flowKey = INTENT_TO_FLOW[intent];
    const extractedCtx = buildExtractedContext(intent, text);
    return await FLOWS[flowKey].start({ user, context: extractedCtx });
  }

  // -------------------------------------------------------------------------
  // 2. Mid-flow — check for intent override before dispatching to current flow
  // -------------------------------------------------------------------------
  if (input.text) {
    const newIntent = detectIntent(input.text.trim());
    if (newIntent) {
      const newFlowKey = INTENT_TO_FLOW[newIntent];
      const extractedCtx = buildExtractedContext(newIntent, input.text.trim());
      const result = await FLOWS[newFlowKey].start({ user, context: extractedCtx });
      // Prepend a brief context-switch notice
      result.response.messages = [
        { role: 'assistant', text: `Sure — switching to ${intentLabel(newIntent)}.` },
        ...result.response.messages
      ];
      return result;
    }
  }

  // -------------------------------------------------------------------------
  // 3. Dispatch to the current flow's step handler
  // -------------------------------------------------------------------------
  const handler = pickFlowFromState(currentState);
  if (!handler) {
    return {
      response: greet(user, 'Something went wrong — let me reset. Please pick an option:'),
      nextFlowState: { state: 'IDLE', context: {} }
    };
  }

  return await handler.step({ user, state: currentState, context, input });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickFlowFromState(state) {
  if (state.startsWith('CHECK_BALANCE'))  return FLOWS.CHECK_BALANCE;
  if (state.startsWith('FUND_TRANSFER'))  return FLOWS.FUND_TRANSFER;
  if (state.startsWith('PAY_BILL'))       return FLOWS.PAY_BILL;
  if (state.startsWith('TRANSACTIONS'))   return FLOWS.TRANSACTIONS;
  return null;
}

function mapMenuToIntent(value) {
  return {
    MENU_CHECK_BALANCE: INTENTS.CHECK_BALANCE,
    MENU_FUND_TRANSFER: INTENTS.FUND_TRANSFER,
    MENU_PAY_BILL:      INTENTS.PAY_BILL,
    MENU_TRANSACTIONS:  INTENTS.TRANSACTIONS
  }[value] ?? null;
}

/** Build pre-extracted context from the opening message to enable step-skipping */
function buildExtractedContext(intent, text) {
  const ctx = {};
  if (intent === INTENTS.FUND_TRANSFER) {
    const hint = extractBeneficiaryHint(text);
    if (hint) ctx.beneficiaryNameHint = hint;
  }
  if (intent === INTENTS.PAY_BILL) {
    const billType = extractBillType(text);
    if (billType) ctx.billTypeHint = billType;
  }
  return ctx;
}

export function mainMenuOptions() {
  return [
    { id: 'opt_balance',  label: '💰 Check Balance',        value: 'MENU_CHECK_BALANCE' },
    { id: 'opt_transfer', label: '↗ Fund Transfer',         value: 'MENU_FUND_TRANSFER' },
    { id: 'opt_bill',     label: '⚡ Pay Bill',               value: 'MENU_PAY_BILL'      },
    { id: 'opt_txns',     label: '📋 Last 10 Transactions',  value: 'MENU_TRANSACTIONS'  }
  ];
}

export function greet(user, prefix) {
  const hour = new Date().getHours();
  const tod = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const text = prefix
    ? prefix
    : `${tod}, ${user.fullName.split(' ')[0]}. What would you like to do today?`;
  return {
    messages: [{ role: 'assistant', text }],
    options: mainMenuOptions(),
    state: 'IDLE'
  };
}
