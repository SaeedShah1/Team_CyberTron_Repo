# Hisaab — Banking Chatbot (v2)

A controlled-flow conversational banking chatbot. Authenticated, button-driven, JSON-backed, no LLM dependencies. Supports four operations only:

1. Check Balance
2. Fund Transfer
3. Pay Bill
4. Last 10 Transactions

User can type intents in **English or Roman Urdu** ("balance batao", "paise bhejo", "bill bharo") — the intent engine maps them to one of the four operations, or politely restricts the conversation if out-of-scope.

## Project layout

```
hisaab-v2/
├── backend/
│   ├── package.json                # Express, bcryptjs, uuid, dotenv, cors
│   ├── .env.example                # PORT, DATA_FILE, SESSION_TIMEOUT_MINUTES, BCRYPT_ROUNDS
│   ├── data/                       # Auto-created on first run
│   │   ├── db.json                 # Auto-seeded with 2 sample users
│   │   └── operations.log          # Append-only operation log
│   └── src/
│       ├── server.js
│       ├── config/config.js
│       ├── auth/                   # sessions.js, authService.js
│       ├── chatbot/
│       │   ├── intentEngine.js     # English + Roman Urdu keyword matcher
│       │   ├── flowEngine.js       # FSM dispatcher
│       │   └── flows/              # checkBalance, fundTransfer, payBill, transactions
│       ├── data/                   # repository.js (atomic JSON I/O), seed.js
│       ├── services/               # transactionService.js
│       ├── middleware/             # requireSession.js, errorHandler.js
│       ├── utils/                  # logger.js, errors.js, refId.js
│       └── routes/                 # auth.js, chat.js
└── frontend/
    ├── package.json                # React 18, Vite, Tailwind, Framer Motion, lucide-react
    ├── vite.config.js              # Dev proxy /api/* → :4000
    └── src/
        ├── App.jsx                 # Login → Chat shell + desktop side panel
        ├── screens/                # LoginScreen.jsx, ChatScreen.jsx
        ├── components/             # Header, MessageBubble, ButtonOptions,
        │                             ReceiptCard, Composer, SessionExpiredOverlay
        ├── hooks/useSessionTimer.js
        ├── services/api.js
        ├── utils/format.js
        └── styles/globals.css
```

## Running it

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev    # http://localhost:4000
```
First boot will auto-create `data/db.json` with sample users and history.

### Frontend
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

## Demo credentials

| User ID | Password | Profile                                       |
|---------|----------|-----------------------------------------------|
| user1   | 1234     | Ahmed Khan — 2 accounts, 3 beneficiaries, 3 bills |
| user2   | 1234     | Sara Khan — 1 account, 1 beneficiary, 2 bills |

## API contract

### `POST /api/auth/login`
```json
{ "userId": "user1", "password": "1234" }
→
{
  "token": "...",
  "user": { "userId", "fullName", "email", "accountCount" },
  "sessionTimeoutMs": 300000
}
```

### `GET /api/chat/bootstrap`
Returns greeting + main menu. Resets session FSM to IDLE.

### `POST /api/chat`
Body: `{ text?: string, optionValue?: any }` — text or button click, never both.
```json
{
  "response": {
    "messages":  [{ "role": "assistant", "text": "..." }],
    "options":   [{ "id", "label", "value" }] | null,
    "receipt":   { "type": "balance" | "transfer_success" | "bill_success" | "transaction_list", ... } | null,
    "state":     "IDLE" | "FUND_TRANSFER_AWAITING_AMOUNT" | ...,
    "done":      true | false
  },
  "sessionRemainingMs": 287000
}
```

When `options === null`, the UI must show free-text input. Otherwise it shows the buttons and disables text input.

## Step 11 extras (all implemented)

1. **Negative balance prevention** — `transactionService.debitAccount()` throws `InsufficientFundsError` before write
2. **Confirmation step** — every transfer / bill payment passes through `*_AWAITING_CONFIRM` state
3. **Error handling** — typed errors (`InvalidInputError`, `AuthError`, `OutOfScopeError`, etc.) → JSON responses
4. **Session timeout** — server-tracked 5-minute idle, client banner countdown, modal lock on expiry
5. **Reference IDs** — format `REF-{TFR|BIL|BAL}-{YYYYMMDD}-{6 hex}` (e.g. `REF-TFR-20260425-A4F2C9`)
6. **Mini-statement preview** — every receipt card shows last 3 transactions
7. **Logging** — JSON-line append to `data/operations.log` plus structured entries inside `db.json`'s `logs[]`

## How the conversation engine works

Server holds per-session FSM state: `{ state, context }`. Each user turn:

1. Server reads current state from session
2. If `IDLE`: run intent detection on free text (or accept menu button click)
3. If mid-flow: dispatch to that flow's `step()` handler
4. Flow handler validates input, builds the next response, returns the new state
5. Server saves state back to the session, returns response to client

The four flows live in `chatbot/flows/`:
- `checkBalance.js`   — 1 or 2 steps (skips picker when 1 account)
- `fundTransfer.js`   — account → beneficiary → amount → confirm → execute
- `payBill.js`        — account → biller → confirm → execute
- `transactions.js`   — account → list

Atomic balance updates happen in `transactionService.debitAccount()` — under a write-mutex chain over the JSON file.

## What's intentionally out of scope

- No Gemini, OpenAI, or any LLM. This system uses deterministic keyword intent matching.
- No real database. JSON file with atomic temp-write + rename. Single-process only.
- No KYC, account opening, card management, or any operation outside the four listed.
- No streaming. Each turn is a single request/response.

## Building for production

```bash
cd frontend && npm run build    # static files in frontend/dist/
cd ../backend && NODE_ENV=production npm start
```

You can serve `frontend/dist/` from any static host (nginx, Vercel, etc.) or have the Express server serve it directly. For real production, swap the JSON repository for a real database — every consumer of `data/repository.js` already uses an async API.
