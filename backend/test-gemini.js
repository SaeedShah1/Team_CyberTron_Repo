/**
 * Quick end-to-end smoke test for the Gemini-powered chat.
 * Run after adding GEMINI_API_KEY to .env:
 *   node test-gemini.js
 */

const BASE = 'http://localhost:4000/api';

async function post(url, body, tok) {
  const r = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...(tok ? { 'X-Session-Token': tok } : {}) },
    body:    JSON.stringify(body)
  });
  return r.json();
}
async function get(url, tok) {
  const r = await fetch(url, { headers: tok ? { 'X-Session-Token': tok } : {} });
  return r.json();
}

function log(label, res) {
  console.log(`\n── ${label} ──`);
  const msgs = res?.response?.messages || [];
  msgs.forEach((m) => console.log(`  BOT: ${m.text?.slice(0, 120)}`));
  if (res?.response?.options)
    console.log(`  BUTTONS: [${res.response.options.map((o) => o.label).join('] [')}]`);
  if (res?.response?.receipt)
    console.log(`  RECEIPT: type=${res.response.receipt.type}`);
  if (res?.error)
    console.log(`  ERROR: ${res.error}`);
}

async function run() {
  console.log('Logging in as user1...');
  const { token } = await post(BASE + '/auth/login', { userId: 'user1', password: '1234' });
  if (!token) { console.error('Login failed'); process.exit(1); }
  console.log('OK');

  log('BOOTSTRAP', await get(BASE + '/chat/bootstrap', token));

  // 1. Check balance (Roman Urdu)
  log('balance batao', await post(BASE + '/chat', { text: 'mera balance batao' }, token));

  // 2. Fund transfer with name entity
  log('transfer to sara', await post(BASE + '/chat', { text: 'sara ko 2000 bhejna hai' }, token));

  // 3. Say "no" to cancel
  log('nahi (cancel)', await post(BASE + '/chat', { text: 'nahi, cancel karo' }, token));

  // 4. Pay electricity bill
  log('bijli bill', await post(BASE + '/chat', { text: 'bijli ka bill pay karna hai' }, token));

  // 5. Cancel again
  log('cancel', await post(BASE + '/chat', { text: 'No, cancel' }, token));

  // 6. Block card
  log('block card', await post(BASE + '/chat', { text: 'mera card block karo' }, token));

  // 7. Out of scope
  log('out of scope', await post(BASE + '/chat', { text: 'what is the weather in karachi?' }, token));
}

run().catch(console.error);
