/**
 * Tool definitions in OpenAI function-calling format.
 * Used with OpenRouter (openai-compatible endpoint).
 *
 * Each entry: { type: 'function', function: { name, description, parameters } }
 * Parameter types use JSON Schema (lowercase: 'object', 'string', 'number', 'array').
 */

export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'getAccounts',
      description:
        'Get all bank accounts for the current user including accountId, title, ' +
        'masked number, balance, and currency. ' +
        'Call this whenever the user wants to check balance, transfer money, pay a bill, ' +
        'view transactions, or needs to select an account.',
      parameters: { type: 'object', properties: {} }
    }
  },

  {
    type: 'function',
    function: {
      name: 'getBalance',
      description:
        'Get the current balance for a specific account. ' +
        'Call getAccounts first to obtain the accountId if you do not already have it.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'Account ID, e.g. ACC1001' }
        },
        required: ['accountId']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'getBeneficiaries',
      description:
        'Get all saved beneficiaries (people the user can send money to). ' +
        'Each entry has beneficiaryId, nickname, fullName, bank, and masked account number. ' +
        'Call this when the user mentions a name to transfer to, or describes a payment ' +
        'such as groceries/shopping/merchant payment that should be handled as a transfer.',
      parameters: { type: 'object', properties: {} }
    }
  },

  {
    type: 'function',
    function: {
      name: 'transferFunds',
      description:
        'Execute a fund transfer from the user\'s account to a saved beneficiary. ' +
        'CRITICAL: Only call this AFTER the user has explicitly confirmed with "yes", ' +
        '"haan", "confirm", or similar. Never call without confirmation.',
      parameters: {
        type: 'object',
        properties: {
          fromAccountId: { type: 'string', description: 'Source account ID, e.g. ACC1001' },
          beneficiaryId: { type: 'string', description: 'Destination beneficiary ID, e.g. BEN001' },
          amount:        { type: 'number', description: 'Amount in PKR (must be positive)' }
        },
        required: ['fromAccountId', 'beneficiaryId', 'amount']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'getBills',
      description:
        'Get all pending utility or saved biller bills for the current user. ' +
        'Each bill has billerId, billerName, category (electricity/gas/internet/water), ' +
        'currentDue amount, and dueDate. ' +
        'Use this when user asks for paying bills/dues/recharge/invoice-like requests.',
      parameters: { type: 'object', properties: {} }
    }
  },

  {
    type: 'function',
    function: {
      name: 'payBill',
      description:
        'Pay a utility bill from the user\'s account. Deducts the bill\'s currentDue amount. ' +
        'CRITICAL: Only call this AFTER the user has explicitly confirmed with "yes", ' +
        '"haan", "confirm", or similar.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'Account ID to pay from' },
          billerId:  { type: 'string', description: 'Biller ID to pay, e.g. BIL_KE' }
        },
        required: ['accountId', 'billerId']
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'getTransactions',
      description:
        'Get the last 10 transactions for a specific account, sorted newest first. ' +
        'Call getAccounts first if you do not already have the accountId.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'Account ID to fetch transactions for' }
        },
        required: ['accountId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getSpendingAnalytics',
      description:
        'Get spending analytics and summary insights from user transactions. ' +
        'Use this when user asks analytics, spending graph, expense trends, breakdowns, or reports.',
      parameters: {
        type: 'object',
        properties: {
          periodDays: {
            type: 'number',
            description: 'Lookback period in days (default 30, max 365)'
          },
          transactionCount: {
            type: 'number',
            description: 'Optional: analyze the last N debit/expense transactions (max 100)'
          },
          accountId: {
            type: 'string',
            description: 'Optional accountId to filter analytics for one account'
          }
        }
      }
    }
  },

  {
    type: 'function',
    function: {
      name: 'getCards',
      description:
        'Get all debit and credit cards linked to the user. ' +
        'Each card has cardId, type (debit/credit), network (Visa/Mastercard), ' +
        'last4 digits, expiry, and status (active/blocked). ' +
        'Call this when the user wants to block a card.',
      parameters: { type: 'object', properties: {} }
    }
  },

  {
    type: 'function',
    function: {
      name: 'blockCard',
      description:
        'Permanently block (freeze) a specific card. ' +
        'CRITICAL: Only call this AFTER the user has explicitly confirmed with "yes", ' +
        '"haan", "confirm", or similar. Blocked cards cannot be unblocked here.',
      parameters: {
        type: 'object',
        properties: {
          cardId: { type: 'string', description: 'Card ID to block, e.g. CARD001' }
        },
        required: ['cardId']
      }
    }
  }
];
