import { logger } from '../utils/logger.js';
import { getPool, sql } from './sqlClient.js';

export async function ensureDb() {
  const pool = await getPool();
  await pool.request().query(`
    SELECT 1 AS ok;
    IF COL_LENGTH('bank.Transactions', 'FeedbackRating') IS NULL
      ALTER TABLE bank.Transactions ADD FeedbackRating NVARCHAR(10) NULL;
    IF COL_LENGTH('bank.Transactions', 'FeedbackAt') IS NULL
      ALTER TABLE bank.Transactions ADD FeedbackAt DATETIME2 NULL;
  `);
}

export async function findUserById(userId) {
  const pool = await getPool();

  const userResult = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .query(`
      SELECT
        CustomerId,
        FullName,
        Email,
        Password,
        Phone
      FROM bank.Customers
      WHERE CustomerId = @userId;
    `);

  const user = userResult.recordset[0];
  if (!user) return null;

  const [accountsResult, beneficiariesResult] = await Promise.all([
    pool.request()
      .input('userId', sql.NVarChar(20), userId)
      .query(`
        SELECT
          AccountId,
          [Type],
          Title,
          MaskedNumber,
          Balance,
          Currency
        FROM bank.Accounts
        WHERE CustomerId = @userId
        ORDER BY AccountId ASC;
      `),
    pool.request()
      .input('userId', sql.NVarChar(20), userId)
      .query(`
        SELECT
          BeneficiaryId,
          Nickname,
          FullName,
          Bank,
          AccountNumber,
          MaskedNumber
        FROM bank.Beneficiaries
        WHERE CustomerId = @userId
        ORDER BY BeneficiaryId ASC;
      `)
  ]);

  return {
    userId: user.CustomerId,
    fullName: user.FullName,
    email: user.Email,
    password: user.Password,
    phone: user.Phone,
    accounts: accountsResult.recordset.map(mapAccount),
    beneficiaries: beneficiariesResult.recordset.map(mapBeneficiary)
  };
}

export async function getAccountById(userId, accountId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .input('accountId', sql.NVarChar(20), accountId)
    .query(`
      SELECT
        AccountId,
        [Type],
        Title,
        MaskedNumber,
        Balance,
        Currency
      FROM bank.Accounts
      WHERE CustomerId = @userId AND AccountId = @accountId;
    `);

  const account = result.recordset[0];
  return account ? mapAccount(account) : null;
}

export async function getBeneficiaries(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .query(`
      SELECT
        BeneficiaryId,
        Nickname,
        FullName,
        Bank,
        AccountNumber,
        MaskedNumber
      FROM bank.Beneficiaries
      WHERE CustomerId = @userId
      ORDER BY BeneficiaryId ASC;
    `);

  return result.recordset.map(mapBeneficiary);
}

export async function getBills(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .query(`
      SELECT
        BillerId,
        CustomerId,
        BillerName,
        Category,
        AccountNumber,
        CurrentDue,
        DueDate
      FROM bank.Bills
      WHERE CustomerId = @userId
      ORDER BY DueDate ASC;
    `);

  return result.recordset.map((row) => ({
    billerId: row.BillerId,
    userId: row.CustomerId,
    billerName: row.BillerName,
    category: row.Category,
    accountNumber: row.AccountNumber,
    currentDue: Number(row.CurrentDue),
    dueDate: row.DueDate instanceof Date ? row.DueDate.toISOString().slice(0, 10) : row.DueDate
  }));
}

export async function getRecentTransactions(userId, accountId, limit = 10) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .input('accountId', sql.NVarChar(20), accountId)
    .input('limit', sql.Int, Math.max(1, Number(limit) || 10))
    .query(`
      SELECT TOP (@limit)
        TransactionId,
        RefId,
        CustomerId,
        AccountId,
        [Type],
        Amount,
        [Description],
        BalanceAfter,
        [Timestamp],
        [Status],
        Meta
      FROM bank.Transactions
      WHERE CustomerId = @userId AND AccountId = @accountId
      ORDER BY [Timestamp] DESC;
    `);

  return result.recordset.map(mapTransaction);
}

export async function getTransactionsForUser(userId, days = 90, limit = 300) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .input('days', sql.Int, Math.max(1, Number(days) || 90))
    .input('limit', sql.Int, Math.max(1, Number(limit) || 300))
    .query(`
      SELECT TOP (@limit)
        TransactionId,
        RefId,
        CustomerId,
        AccountId,
        [Type],
        Amount,
        [Description],
        BalanceAfter,
        [Timestamp],
        [Status],
        Meta
      FROM bank.Transactions
      WHERE CustomerId = @userId
        AND [Timestamp] >= DATEADD(DAY, -@days, SYSUTCDATETIME())
      ORDER BY [Timestamp] DESC;
    `);

  return result.recordset.map(mapTransaction);
}

export async function saveTransactionFeedback({ userId, refId, rating }) {
  const safeRating = String(rating || '').toUpperCase() === 'DOWN' ? 'DOWN' : 'UP';
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .input('refId', sql.NVarChar(40), refId)
    .input('rating', sql.NVarChar(10), safeRating)
    .query(`
      UPDATE bank.Transactions
      SET
        FeedbackRating = @rating,
        FeedbackAt = SYSUTCDATETIME()
      WHERE CustomerId = @userId AND RefId = @refId;

      SELECT @@ROWCOUNT AS updatedRows;
    `);

  return Number(result.recordset[0]?.updatedRows || 0) > 0;
}

export async function saveOperationFeedback({ userId, rating, status, refId = null }) {
  const safeRating = String(rating || '').toUpperCase() === 'DOWN' ? 'DOWN' : 'UP';
  const safeStatus = String(status || '').toUpperCase() === 'FAILURE' ? 'FAILURE' : 'SUCCESS';
  const pool = await getPool();
  await pool.request()
    .input('ts', sql.DateTime2, new Date())
    .input('userId', sql.NVarChar(20), userId)
    .input('action', sql.NVarChar(50), 'TRANSACTION_FEEDBACK')
    .input('outcome', sql.NVarChar(20), safeStatus.toLowerCase())
    .input('meta', sql.NVarChar(sql.MAX), JSON.stringify({ rating: safeRating, status: safeStatus, refId }))
    .query(`
      INSERT INTO bank.OperationLogs (Ts, CustomerId, [Action], Outcome, Meta)
      VALUES (@ts, @userId, @action, @outcome, @meta);
    `);
}

export async function getCards(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .query(`
      SELECT
        CardId,
        CustomerId,
        AccountId,
        [Type],
        Network,
        Last4,
        MaskedNumber,
        ExpiryDate,
        [Status],
        BlockedAt
      FROM bank.Cards
      WHERE CustomerId = @userId
      ORDER BY CardId ASC;
    `);

  return result.recordset.map(mapCard);
}

export async function blockCard(userId, cardId) {
  const pool = await getPool();

  const updateResult = await pool.request()
    .input('userId', sql.NVarChar(20), userId)
    .input('cardId', sql.NVarChar(20), cardId)
    .input('blocked', sql.NVarChar(20), 'blocked')
    .query(`
      UPDATE bank.Cards
      SET
        [Status] = @blocked,
        BlockedAt = SYSUTCDATETIME()
      OUTPUT
        inserted.CardId,
        inserted.CustomerId,
        inserted.AccountId,
        inserted.[Type],
        inserted.Network,
        inserted.Last4,
        inserted.MaskedNumber,
        inserted.ExpiryDate,
        inserted.[Status],
        inserted.BlockedAt
      WHERE CardId = @cardId AND CustomerId = @userId AND [Status] <> @blocked;
    `);

  const updated = updateResult.recordset[0];
  if (!updated) {
    const existingResult = await pool.request()
      .input('userId', sql.NVarChar(20), userId)
      .input('cardId', sql.NVarChar(20), cardId)
      .query(`
        SELECT [Status]
        FROM bank.Cards
        WHERE CardId = @cardId AND CustomerId = @userId;
      `);

    const existing = existingResult.recordset[0];
    if (!existing) throw new Error('Card not found');
    if (existing.Status === 'blocked') throw new Error('Card is already blocked.');
    throw new Error('Unable to block card');
  }

  await pool.request()
    .input('ts', sql.DateTime2, updated.BlockedAt)
    .input('userId', sql.NVarChar(20), userId)
    .input('action', sql.NVarChar(50), 'CARD_BLOCK')
    .input('outcome', sql.NVarChar(20), 'success')
    .input('meta', sql.NVarChar(sql.MAX), JSON.stringify({ cardId, last4: updated.Last4 }))
    .query(`
      INSERT INTO bank.OperationLogs (Ts, CustomerId, [Action], Outcome, Meta)
      VALUES (@ts, @userId, @action, @outcome, @meta);
    `);

  return mapCard(updated);
}

function mapAccount(row) {
  return {
    accountId: row.AccountId,
    type: row.Type,
    title: row.Title,
    maskedNumber: row.MaskedNumber,
    balance: Number(row.Balance),
    currency: row.Currency
  };
}

function mapBeneficiary(row) {
  return {
    id: row.BeneficiaryId,
    nickname: row.Nickname,
    fullName: row.FullName,
    bank: row.Bank,
    accountNumber: row.AccountNumber,
    maskedNumber: row.MaskedNumber
  };
}

function mapCard(row) {
  return {
    cardId: row.CardId,
    userId: row.CustomerId,
    accountId: row.AccountId,
    type: row.Type,
    network: row.Network,
    last4: row.Last4,
    maskedNumber: row.MaskedNumber,
    expiryDate: row.ExpiryDate,
    status: row.Status,
    blockedAt: row.BlockedAt ? new Date(row.BlockedAt).toISOString() : null
  };
}

function mapTransaction(row) {
  const tx = {
    id: row.TransactionId,
    refId: row.RefId,
    userId: row.CustomerId,
    accountId: row.AccountId,
    type: row.Type,
    amount: Number(row.Amount),
    description: row.Description,
    balanceAfter: Number(row.BalanceAfter),
    timestamp: row.Timestamp instanceof Date ? row.Timestamp.toISOString() : row.Timestamp,
    status: row.Status
  };

  if (row.Meta) {
    try {
      Object.assign(tx, JSON.parse(row.Meta));
    } catch {
      // Ignore malformed metadata to preserve primary transaction data.
    }
  }

  return tx;
}
