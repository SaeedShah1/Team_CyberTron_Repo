import bcrypt from 'bcryptjs';
import { config } from '../config/config.js';

/**
 * Generates the initial DB content.
 * Two users:
 *   user1 / 1234   — Ahmed Khan, two accounts, two cards each
 *   user2 / 1234   — Sara Khan,  one account, one card
 */
export async function seedDatabase() {
  const hash = (pw) => bcrypt.hashSync(pw, config.bcryptRounds);

  const now = new Date();
  const isoDaysAgo = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };

  return {
    users: [
      {
        userId: 'user1',
        password: hash('1234'),
        fullName: 'Ahmed Khan',
        email: 'ahmed.khan@example.com',
        phone: '+92 300 1234567',
        accounts: [
          { accountId: 'ACC1001', type: 'savings',  title: 'Savings Account', maskedNumber: '••0042', balance: 185611, currency: 'PKR' },
          { accountId: 'ACC1002', type: 'current',  title: 'Current Account', maskedNumber: '••0078', balance:  42300, currency: 'PKR' }
        ],
        beneficiaries: [
          { id: 'BEN001', nickname: 'Sara (Wife)',     fullName: 'Sara Ahmed Khan',   accountNumber: '04567890123456', maskedNumber: '••3456', bank: 'Meezan Bank'  },
          { id: 'BEN002', nickname: 'Bilal (Brother)', fullName: 'Bilal Ahmed Khan',  accountNumber: '03345112299876', maskedNumber: '••9876', bank: 'MCB Bank'     },
          { id: 'BEN003', nickname: 'Ayesha (Rent)',   fullName: 'Ayesha Tariq',      accountNumber: '12349876543210', maskedNumber: '••3210', bank: 'United Bank'  }
        ]
      },
      {
        userId: 'user2',
        password: hash('1234'),
        fullName: 'Sara Khan',
        email: 'sara.khan@example.com',
        phone: '+92 321 4567890',
        accounts: [
          { accountId: 'ACC2001', type: 'savings', title: 'Savings Account', maskedNumber: '••5511', balance: 67400, currency: 'PKR' }
        ],
        beneficiaries: [
          { id: 'BEN101', nickname: 'Mom', fullName: 'Naseem Akhtar', accountNumber: '00012345678901', maskedNumber: '••8901', bank: 'HBL' }
        ]
      }
    ],

    cards: [
      // Ahmed's cards
      {
        cardId: 'CARD001', userId: 'user1', accountId: 'ACC1001',
        type: 'debit',  network: 'Visa',       last4: '4521',
        maskedNumber: '4321 •••• •••• 4521', expiryDate: '12/27', status: 'active'
      },
      {
        cardId: 'CARD002', userId: 'user1', accountId: 'ACC1001',
        type: 'credit', network: 'Mastercard', last4: '8834',
        maskedNumber: '5178 •••• •••• 8834', expiryDate: '09/26', status: 'active'
      },
      {
        cardId: 'CARD003', userId: 'user1', accountId: 'ACC1002',
        type: 'debit',  network: 'Visa',       last4: '7712',
        maskedNumber: '4532 •••• •••• 7712', expiryDate: '03/28', status: 'active'
      },
      // Sara's card
      {
        cardId: 'CARD101', userId: 'user2', accountId: 'ACC2001',
        type: 'debit',  network: 'Visa',       last4: '3390',
        maskedNumber: '4111 •••• •••• 3390', expiryDate: '06/27', status: 'active'
      }
    ],

    bills: [
      { billerId: 'BIL_KE',    userId: 'user1', billerName: 'K-Electric',    category: 'electricity', accountNumber: 'KE-04-21-3398-0421-7',  currentDue: 9200, dueDate: '2026-05-22' },
      { billerId: 'BIL_SSGC',  userId: 'user1', billerName: 'SSGC Gas',      category: 'gas',         accountNumber: 'SSGC-7821-44513-2',      currentDue: 2050, dueDate: '2026-05-18' },
      { billerId: 'BIL_PTCL',  userId: 'user1', billerName: 'PTCL Internet', category: 'internet',    accountNumber: 'PTCL-021-35870234',      currentDue: 3500, dueDate: '2026-05-05' },
      { billerId: 'BIL_KE2',   userId: 'user2', billerName: 'K-Electric',    category: 'electricity', accountNumber: 'KE-05-11-1100-9876-2',   currentDue: 4100, dueDate: '2026-05-22' },
      { billerId: 'BIL_PTCL2', userId: 'user2', billerName: 'PTCL Internet', category: 'internet',    accountNumber: 'PTCL-021-99887766',      currentDue: 3500, dueDate: '2026-05-05' }
    ],

    transactions: [
      { id: 'TXN001', refId: 'REF-CRD-' + ymd(now, -28) + '-A11111', userId: 'user1', accountId: 'ACC1001', type: 'credit',   amount:  285000, description: 'Salary Credit',                    balanceAfter: 470611, timestamp: isoDaysAgo(28), status: 'completed' },
      { id: 'TXN002', refId: 'REF-BIL-' + ymd(now, -22) + '-B22222', userId: 'user1', accountId: 'ACC1001', type: 'bill',     amount:    8610, description: 'K-Electric · Bill Payment',        balanceAfter: 461001, timestamp: isoDaysAgo(22), status: 'completed' },
      { id: 'TXN003', refId: 'REF-TFR-' + ymd(now, -18) + '-C33333', userId: 'user1', accountId: 'ACC1001', type: 'transfer', amount:   25000, description: 'Transfer to Sara (Wife)',          balanceAfter: 436001, timestamp: isoDaysAgo(18), status: 'completed' },
      { id: 'TXN004', refId: 'REF-BIL-' + ymd(now, -18) + '-D44444', userId: 'user1', accountId: 'ACC1001', type: 'bill',     amount:    2050, description: 'SSGC Gas · Bill Payment',         balanceAfter: 433951, timestamp: isoDaysAgo(18), status: 'completed' },
      { id: 'TXN005', refId: 'REF-TFR-' + ymd(now, -12) + '-E55555', userId: 'user1', accountId: 'ACC1001', type: 'transfer', amount:   15000, description: 'Transfer to Bilal (Brother)',      balanceAfter: 418951, timestamp: isoDaysAgo(12), status: 'completed' },
      { id: 'TXN006', refId: 'REF-BIL-' + ymd(now,  -8) + '-F66666', userId: 'user1', accountId: 'ACC1001', type: 'bill',     amount:    3500, description: 'PTCL Internet · Bill Payment',    balanceAfter: 415451, timestamp: isoDaysAgo( 8), status: 'completed' },
      { id: 'TXN007', refId: 'REF-TFR-' + ymd(now,  -6) + '-G77777', userId: 'user1', accountId: 'ACC1001', type: 'transfer', amount:   55000, description: 'Transfer to Ayesha (Rent)',       balanceAfter: 360451, timestamp: isoDaysAgo( 6), status: 'completed' }
    ],
    logs: [],
    sessions: []
  };
}

function ymd(now, offset = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}
