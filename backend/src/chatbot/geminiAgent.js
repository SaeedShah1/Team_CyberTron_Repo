/**
 * AI Agent — powered by OpenRouter (OpenAI-compatible endpoint).
 *
 * Conversation format: OpenAI chat-completion messages
 *   { role: 'system'|'user'|'assistant'|'tool', content, tool_calls?, tool_call_id? }
 *
 * Tool-calling loop per turn:
 *   1. Build messages = [system, ...storedHistory, newUserMessage]
 *   2. Call OpenRouter → model decides to call tools or reply
 *   3. If tool_calls present → execute each, append results, loop back to 2
 *   4. When model replies with plain text → extract text, infer UI buttons,
 *      attach any receipt from the last executed tool, return
 *
 * History persisted in session: everything except the system message.
 */

import OpenAI          from 'openai';
import { config }      from '../config/config.js';
import { TOOLS }       from './toolDefinitions.js';
import { executeTool } from './toolExecutor.js';
import { logger }      from '../utils/logger.js';
import { detectIntent, extractBeneficiaryHint, extractBillType } from './intentEngine.js';
import { saveOperationFeedback, saveTransactionFeedback } from '../data/repository.js';

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are BanklifyAi, a secure AI banking assistant for a Pakistani bank.
You help users with EXACTLY these supported operations — nothing else:
  1. Check Balance
  2. Fund Transfer (to saved beneficiaries only)
  3. Pay Utility Bill (electricity, gas, internet, water)
  4. View Last 10 Transactions
  5. View Cards and Block a Card
  6. Spending analytics and insights (graphs/summaries from transactions)

SCOPE AND MAPPING RULE:
Map natural-language payment requests to the closest supported banking operation:
- grocery/shopping/payment to a person or merchant -> Fund Transfer (saved beneficiary flow)
- utility/service/dues/recharge requests -> Pay Utility Bill (saved biller flow)
- history/statement/spending/activity requests -> Last 10 Transactions
If still unrelated (for example loans, investments, card issuance), explain briefly that only
balance, transfer, bill payment, transactions, and card blocking are supported.
For unsupported questions, respond exactly:
"This feature is not available. Please call bank at this number 11111111."

CONFIRMATION RULE (non-negotiable):
Before calling transferFunds, payBill, or blockCard you MUST summarise the action and
ask the user to confirm. Wait for "yes", "haan", "confirm", or equivalent.
Only call the mutating tool after receiving explicit confirmation.

TOOL USAGE RULES:
- Always call getAccounts() before using an accountId you don't know.
- Call getBeneficiaries() when the user mentions a name or person.
- Match beneficiary names loosely (e.g. "sara" → "Sara (Wife)").
- For bills call getBills(), then match by category or name.
- For card blocking call getCards(), list active cards, ask user to pick if multiple.
- For card list/details requests call getCards() and show card list receipt.
- When user has multiple accounts, list them and ask which to use.
- For analytics/graph/spending summary requests call getSpendingAnalytics.
- After each successful transfer or bill payment, ask if user also wants to donate to charity
  using saved charity beneficiaries (e.g. Chhipa Welfare, Red Crescent, Edhi Foundation).

LANGUAGE:
Support English and Roman Urdu naturally.
"balance batao" = check balance
"sara ko paise bhejna" / "transfer to sara" = fund transfer
"bijli ka bill pay karo" = pay electricity bill
"transactions dikhao" = last transactions
"card block karo" = block card

FORMAT:
- Be concise. Use bullet points for lists.
- Format amounts as "PKR X,XXX".
- Always include reference IDs after successful operations.`;

// ---------------------------------------------------------------------------
// OpenAI client pointed at OpenRouter
// ---------------------------------------------------------------------------
let _client = null;

function getClient() {
  if (!_client) {
    if (!config.openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured. Add it to the backend .env file.');
    }
    _client = new OpenAI({
      baseURL:        config.openrouterBaseUrl,
      apiKey:         config.openrouterApiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://hisaab.banking',
        'X-Title':      'BanklifyAi Banking Chatbot'
      }
    });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process one chat turn.
 * @param {string}   userId              — authenticated user id
 * @param {string}   userMessage         — raw user text (or button value)
 * @param {object[]} conversationHistory — OpenAI message array (no system msg)
 * @returns {{ text, options, receipt, conversationHistory }}
 */
export async function handleChatTurn({ userId, userMessage, conversationHistory = [] }) {
  const systemAction = parseSystemAction(userMessage);
  if (systemAction.type === 'NO_CHARITY') {
    const text = 'How was your experience with this transaction?';
    const updatedHistory = [
      ...truncateHistory(conversationHistory),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: text }
    ];
    return {
      text,
      options: buildFeedbackOptions(systemAction.refId),
      receipt: null,
      conversationHistory: updatedHistory
    };
  }

  if (systemAction.type === 'FEEDBACK') {
    if (systemAction.refId && systemAction.refId !== 'NO_REF') {
      await saveTransactionFeedback({ userId, refId: systemAction.refId, rating: systemAction.rating });
    }
    await saveOperationFeedback({
      userId,
      rating: systemAction.rating,
      status: systemAction.status,
      refId: systemAction.refId
    });
    const text = 'Thanks for your feedback.';
    const updatedHistory = [
      ...truncateHistory(conversationHistory),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: text }
    ];
    return {
      text,
      options: mainMenuOptions(),
      receipt: null,
      conversationHistory: updatedHistory
    };
  }

  if (systemAction.type === 'YES_CHARITY') {
    userMessage = 'Yes, add charity donation';
  }

  if (isCardListRequest(userMessage)) {
    const toolResult = await executeTool(userId, 'getCards', {});
    const text = 'Here are your cards.';
    const updatedHistory = [
      ...truncateHistory(conversationHistory),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: text }
    ];
    return {
      text,
      options: null,
      receipt: toolResult?.receipt || null,
      conversationHistory: updatedHistory
    };
  }

  if (isOutOfScopeQuestion(userMessage)) {
    const text = 'This feature is not available. Please call bank at this number 11111111.';
    const updatedHistory = [
      ...truncateHistory(conversationHistory),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: text }
    ];
    return { text, options: mainMenuOptions(), receipt: null, conversationHistory: updatedHistory };
  }

  const client = getClient();
  const mappedMessage = mapUserMessageToSupportedScope(userMessage);

  // Build full message list for this request (system is prepended fresh each time)
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...truncateHistory(conversationHistory),
    { role: 'user', content: mappedMessage }
  ];

  const toolCallLog = [];
  const MAX_ITER    = 12;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let completion;
    try {
      completion = await client.chat.completions.create({
        model:       config.openrouterModel || 'google/gemini-2.0-flash',
        messages,
        tools:       TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens:  1024
      });
    } catch (err) {
      logger.error('OpenRouter API error', { error: err.message });
      throw new Error('AI service unavailable. Please try again in a moment.');
    }

    const choice  = completion.choices[0];
    const message = choice.message;

    // Always append the model's message to maintain a valid history
    messages.push(message);

    // ── No tool calls → final text response ──────────────────────────────
    if (!message.tool_calls || message.tool_calls.length === 0) {
      const text = (message.content || '').trim();

      // Store history without the system message
      const updatedHistory = messages.slice(1);

      const options = inferOptions(text, toolCallLog);
      const receipt = extractReceipt(toolCallLog);
      const normalizedText = normalizeAssistantText(text, options);

      logger.info('turn complete', {
        userId,
        tools: toolCallLog.map((t) => t.name),
        finish: choice.finish_reason
      });

      return { text: normalizedText, options, receipt, conversationHistory: updatedHistory };
    }

    // ── Tool calls → execute each and feed results back ──────────────────
    for (const toolCall of message.tool_calls) {
      let args;
      try {
        args = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        args = {};
      }

      const toolName   = toolCall.function.name;
      logger.info('tool call', { userId, tool: toolName, args });

      const toolResult = await executeTool(userId, toolName, args);
      toolCallLog.push({ name: toolName, result: toolResult });

      messages.push({
        role:         'tool',
        tool_call_id: toolCall.id,
        content:      JSON.stringify(toolResult)
      });
    }
    // Loop: ask the model again with tool results attached
  }

  throw new Error('Agent tool-call loop exceeded maximum iterations.');
}

// ---------------------------------------------------------------------------
// UI option inference — buttons that complement the AI's text response
// ---------------------------------------------------------------------------

function inferOptions(text, toolCallLog) {
  const lower = (text || '').toLowerCase();

  // ── Yes / No confirmation buttons ────────────────────────────────────────
  const isConfirmQuestion =
    /shall i proceed|would you like (?:me )?to|do you (?:want|wish) to|please confirm|type yes|say yes|proceed\?|is that correct\?|confirm.*\?|haan karein\?|karein\?/.test(lower);

  if (isConfirmQuestion) {
    return [
      { id: 'opt_yes', label: '✓ Yes, proceed', value: 'Yes' },
      { id: 'opt_no',  label: '✕ Cancel',       value: 'No'  }
    ];
  }

  // ── Account selection buttons ─────────────────────────────────────────────
  const accountsCall = toolCallLog.find(
    (t) => t.name === 'getAccounts' && (t.result.accounts?.length ?? 0) > 1
  );
  if (accountsCall) {
    const isAskingAccount =
      /which account|select.*account|account.*use|choose.*account|which one.*account|specify.*account|pick.*account/.test(lower);
    const isListingOnly =
      /your accounts|here are.*accounts|account list|accounts are/.test(lower);
    if (isAskingAccount && !isListingOnly) {
      return accountsCall.result.accounts.map((a) => ({
        id:    'acc_' + a.accountId,
        label: `${a.title} ${a.maskedNumber} · PKR ${Number(a.balance).toLocaleString()}`,
        value: `${a.title} (${a.maskedNumber})`
      }));
    }
  }

  // ── Card selection buttons ────────────────────────────────────────────────
  const cardsCall = toolCallLog.find(
    (t) => t.name === 'getCards' && (t.result.cards?.length ?? 0) > 0
  );
  if (cardsCall) {
    const isAskingCard =
      /which card|select.*card|choose.*card|block.*which|multiple cards|which .* card|specify.*card|last 4|masked number|visa|mastercard/.test(lower);
    const activeCards = (cardsCall.result.cards || []).filter((c) => c.status !== 'blocked');
    if (isAskingCard && activeCards.length > 1) {
      return activeCards.map((c) => ({
        id:    'card_' + c.cardId,
        label: `${c.network} ${c.type} ••••${c.last4} (exp ${c.expiryDate})`,
        value: `${c.network} ${c.type} ending in ${c.last4}`
      }));
    }
  }

  // ── Beneficiary selection buttons (including charities) ───────────────────
  const benCall = toolCallLog.find(
    (t) => t.name === 'getBeneficiaries' && (t.result.beneficiaries?.length ?? 0) > 0
  );
  if (benCall) {
    const isAskingBeneficiary =
      /which beneficiary|select.*beneficiary|choose.*beneficiary|who should i send|which one should i send|pick (a )?beneficiary/.test(lower);
    const isListingOnly =
      /here are your saved beneficiaries|personal beneficiaries|charity beneficiaries|saved beneficiaries/.test(lower);
    if (isAskingBeneficiary && !isListingOnly) {
      return (benCall.result.beneficiaries || []).map((b) => ({
        id:    `${b.isCharity ? 'charity' : 'ben'}_${b.beneficiaryId}`,
        label: `${b.nickname} · ${b.bank} ${b.maskedNumber}`,
        value: b.nickname
      }));
    }
  }

  // ── Main menu after a completed operation ─────────────────────────────────
  const isDone = toolCallLog.some((t) =>
    ['transferFunds', 'payBill', 'blockCard'].includes(t.name) && t.result?.success
  );
  const lastMutation = [...toolCallLog]
    .reverse()
    .find((t) => ['transferFunds', 'payBill', 'blockCard'].includes(t.name) && t.result?.success);
  const failedMutation = [...toolCallLog]
    .reverse()
    .find((t) => ['transferFunds', 'payBill', 'blockCard'].includes(t.name) && t.result?.error);

  if (lastMutation && ['transferFunds', 'payBill'].includes(lastMutation.name)) {
    if (lastMutation.result?.isCharityDonation) {
      return buildFeedbackOptions(lastMutation.result?.refId || null, 'SUCCESS');
    }
    const refId = lastMutation.result?.refId || '';
    return [
      { id: 'opt_charity_yes', label: '❤️ Add charity donation', value: `YES_CHARITY|${refId}` },
      { id: 'opt_charity_no', label: 'Skip for now', value: `NO_CHARITY|${refId}` }
    ];
  }

  if (lastMutation && lastMutation.name === 'blockCard') {
    return buildFeedbackOptions(lastMutation.result?.refId || null, 'SUCCESS');
  }

  if (failedMutation) {
    return buildFeedbackOptions(null, 'FAILURE');
  }

  if (isDone) return mainMenuOptions();

  return null;
}

function extractReceipt(toolCallLog) {
  const receiptTools = [
    'getAccounts',
    'getBalance',
    'getBills',
    'getCards',
    'transferFunds',
    'payBill',
    'blockCard',
    'getTransactions',
    'getSpendingAnalytics'
  ];
  for (let i = toolCallLog.length - 1; i >= 0; i--) {
    const { name, result } = toolCallLog[i];
    if (receiptTools.includes(name) && result?.receipt) return result.receipt;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function mainMenuOptions() {
  return [
    { id: 'opt_balance',  label: '💰 Check Balance',       value: 'Check my balance'     },
    { id: 'opt_transfer', label: '↗ Fund Transfer',        value: 'Transfer money'        },
    { id: 'opt_bill',     label: '⚡ Pay Bill',              value: 'Pay a bill'           },
    { id: 'opt_txns',     label: '📋 Last 10 Transactions', value: 'Show my transactions' },
    { id: 'opt_block',    label: '🔒 Block Card',           value: 'Block my card'        }
  ];
}

/**
 * Keep history manageable. Always cut at a user-text boundary so the
 * message sequence stays valid (tool results always follow their call).
 */
function truncateHistory(history, maxEntries = 40) {
  if (history.length <= maxEntries) return history;
  const slice = history.slice(-maxEntries);
  for (let i = 0; i < slice.length; i++) {
    if (slice[i].role === 'user' && typeof slice[i].content === 'string') {
      return slice.slice(i);
    }
  }
  return slice;
}

function mapUserMessageToSupportedScope(userMessage) {
  const raw = String(userMessage || '').trim();
  if (!raw) return raw;

  const lower = raw.toLowerCase();
  const intent = detectIntent(raw);
  const beneficiaryHint = extractBeneficiaryHint(raw);
  const billTypeHint = extractBillType(raw);

  if (intent === 'transactions') {
    return `${raw}\n\n[RoutingHint: User intent is transaction history or account activity. Prefer getTransactions.]`;
  }

  if (/\banalytics|analysis|graph|chart|spend|spending|expense|expenses|breakdown|report\b/.test(lower)) {
    const txMatch = lower.match(/last\s+(\d+)\s+(transactions?|txns?)/);
    const txHint = txMatch ? `Transaction count hint: ${txMatch[1]}.` : '';
    return `${raw}\n\n[RoutingHint: User is asking for spending analytics. Prefer getSpendingAnalytics. ${txHint}]`;
  }

  if (/\bcards?\b|card list|list of cards|show.*cards|my cards|card details|debit card|credit card/.test(lower)) {
    return `${raw}\n\n[RoutingHint: User is asking for cards information. Prefer getCards.]`;
  }

  if (intent === 'pay_bill' || /\bbill|dues?|recharge|top up|topup|utility|invoice\b/.test(lower)) {
    const billHintText = billTypeHint ? `Bill category hint: ${billTypeHint}.` : '';
    return `${raw}\n\n[RoutingHint: User is asking for bill payment. Prefer getBills then payBill. ${billHintText}]`;
  }

  if (
    intent === 'fund_transfer'
    || /\bgrocer(y|ies)|shopping|mart|store|supermarket|merchant|vendor|payment\b/.test(lower)
  ) {
    const beneficiaryText = beneficiaryHint ? `Beneficiary hint: ${beneficiaryHint}.` : '';
    return `${raw}\n\n[RoutingHint: Map this as a transfer/payment flow. Prefer getBeneficiaries then transferFunds. ${beneficiaryText}]`;
  }

  return raw;
}

function normalizeAssistantText(text, options) {
  if (!Array.isArray(options) || options.length === 0) return text;
  const hasCharityPrompt = options.some((o) => String(o.id || '').startsWith('opt_charity_'));
  if (hasCharityPrompt) {
    return 'Do you want to perform a charity donation?';
  }
  const hasFeedbackPrompt = options.some((o) => String(o.id || '').startsWith('opt_feedback_'));
  if (hasFeedbackPrompt) {
    return 'How was your experience with this transaction?';
  }
  const hasCardChoices = options.some((o) => String(o.id || '').startsWith('card_'));
  if (hasCardChoices) {
    return 'Please choose a card below.';
  }
  const hasAccountChoices = options.some((o) => String(o.id || '').startsWith('acc_'));
  if (hasAccountChoices) {
    return 'Please choose an account below.';
  }
  const hasBeneficiaryChoices = options.some((o) => {
    const id = String(o.id || '');
    return id.startsWith('ben_') || id.startsWith('charity_');
  });
  if (hasBeneficiaryChoices) {
    return 'Please choose a beneficiary below.';
  }
  return text;
}

function parseSystemAction(rawMessage) {
  const text = String(rawMessage || '').trim();
  if (!text) return { type: 'NONE' };
  if (text.startsWith('NO_CHARITY|')) {
    return { type: 'NO_CHARITY', refId: text.split('|')[1] || null };
  }
  if (text.startsWith('YES_CHARITY|')) {
    return { type: 'YES_CHARITY', refId: text.split('|')[1] || null };
  }
  if (text.startsWith('FEEDBACK_UP|')) {
    const [, refId, status] = text.split('|');
    return { type: 'FEEDBACK', rating: 'UP', refId: refId || null, status: status || 'SUCCESS' };
  }
  if (text.startsWith('FEEDBACK_DOWN|')) {
    const [, refId, status] = text.split('|');
    return { type: 'FEEDBACK', rating: 'DOWN', refId: refId || null, status: status || 'SUCCESS' };
  }
  return { type: 'NONE' };
}

function buildFeedbackOptions(refId, status = 'SUCCESS') {
  const safeRef = refId || 'NO_REF';
  const safeStatus = String(status || '').toUpperCase() === 'FAILURE' ? 'FAILURE' : 'SUCCESS';
  return [
    { id: 'opt_feedback_up', label: '👍', value: `FEEDBACK_UP|${safeRef}|${safeStatus}` },
    { id: 'opt_feedback_down', label: '👎', value: `FEEDBACK_DOWN|${safeRef}|${safeStatus}` }
  ];
}

function isOutOfScopeQuestion(userMessage) {
  const text = String(userMessage || '').trim().toLowerCase();
  if (!text) return false;

  const isQuestionLike = /\?|what|how|why|when|where|can you|do you|please/.test(text);
  if (!isQuestionLike) return false;

  const supportedPatterns = [
    /balance|account/,
    /transfer|send|beneficiar|charity|donat|pay to/,
    /bill|dues|recharge|invoice|utility|biller/,
    /transaction|statement|history|activity/,
    /card|cards|block|freeze|card list|card details|show cards/,
    /analytics|graph|chart|spending|expense/
  ];

  const inScope = supportedPatterns.some((rx) => rx.test(text));
  return !inScope;
}

function isCardListRequest(userMessage) {
  const text = String(userMessage || '').trim().toLowerCase();
  if (!text) return false;
  return /\bcards?\b|card list|list of cards|show.*cards|my cards|card details|debit card|credit card/.test(text)
    && !/\bblock|freeze|stop\b/.test(text);
}
