import { generateRefId } from '../utils/refId.js';
import { InsufficientFundsError, InvalidInputError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { v4 as uuid } from 'uuid';
import { getPool, sql } from '../data/sqlClient.js';

/**
 * Atomically debit an account, write a transaction record.
 * Returns the new balance + transaction object.
 */
export async function debitAccount({ userId, accountId, amount, type, description, meta = {} }) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new InvalidInputError('Amount must be a positive number');
  }
  if (!['transfer', 'bill'].includes(type)) {
    throw new InvalidInputError('Invalid transaction type');
  }

  const refType = type === 'transfer' ? 'TFR' : 'BIL';
  const refId = generateRefId(refType);

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

  try {
    const lockResult = await tx.request()
      .input('userId', sql.NVarChar(20), userId)
      .input('accountId', sql.NVarChar(20), accountId)
      .query(`
        SELECT Balance
        FROM bank.Accounts WITH (UPDLOCK, ROWLOCK)
        WHERE CustomerId = @userId AND AccountId = @accountId;
      `);

    const account = lockResult.recordset[0];
    if (!account) {
      const userResult = await tx.request()
        .input('userId', sql.NVarChar(20), userId)
        .query('SELECT 1 AS ok FROM bank.Customers WHERE CustomerId = @userId;');

      if (!userResult.recordset[0]) throw new NotFoundError('User');
      throw new NotFoundError('Account');
    }

    const currentBalance = Number(account.Balance);
    if (currentBalance < amount) throw new InsufficientFundsError();

    const newBalance = Math.round((currentBalance - amount) * 100) / 100;
    const transactionId = 'TXN' + uuid().replace(/-/g, '').slice(0, 12).toUpperCase();
    const metaJson = meta && Object.keys(meta).length ? JSON.stringify(meta) : null;

    await tx.request()
      .input('newBalance', sql.Decimal(18, 2), newBalance)
      .input('userId', sql.NVarChar(20), userId)
      .input('accountId', sql.NVarChar(20), accountId)
      .query(`
        UPDATE bank.Accounts
        SET Balance = @newBalance
        WHERE CustomerId = @userId AND AccountId = @accountId;
      `);

    const insertTxResult = await tx.request()
      .input('transactionId', sql.NVarChar(30), transactionId)
      .input('refId', sql.NVarChar(40), refId)
      .input('userId', sql.NVarChar(20), userId)
      .input('accountId', sql.NVarChar(20), accountId)
      .input('type', sql.NVarChar(20), type)
      .input('amount', sql.Decimal(18, 2), amount)
      .input('description', sql.NVarChar(255), description)
      .input('balanceAfter', sql.Decimal(18, 2), newBalance)
      .input('status', sql.NVarChar(20), 'completed')
      .input('meta', sql.NVarChar(sql.MAX), metaJson)
      .query(`
        INSERT INTO bank.Transactions (
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
        )
        OUTPUT inserted.[Timestamp]
        VALUES (
          @transactionId,
          @refId,
          @userId,
          @accountId,
          @type,
          @amount,
          @description,
          @balanceAfter,
          SYSUTCDATETIME(),
          @status,
          @meta
        );
      `);

    const ts = insertTxResult.recordset[0]?.Timestamp || new Date();

    await tx.request()
      .input('ts', sql.DateTime2, ts)
      .input('userId', sql.NVarChar(20), userId)
      .input('action', sql.NVarChar(50), type === 'transfer' ? 'FUND_TRANSFER' : 'BILL_PAYMENT')
      .input('outcome', sql.NVarChar(20), 'success')
      .input('meta', sql.NVarChar(sql.MAX), JSON.stringify({ refId, amount, accountId }))
      .query(`
        INSERT INTO bank.OperationLogs (Ts, CustomerId, [Action], Outcome, Meta)
        VALUES (@ts, @userId, @action, @outcome, @meta);
      `);

    await tx.commit();

    const txn = {
      id: transactionId,
      refId,
      userId,
      accountId,
      type,
      amount,
      description,
      balanceAfter: newBalance,
      timestamp: new Date(ts).toISOString(),
      status: 'completed',
      ...meta
    };

    logger.info('debit ok', { userId, accountId, amount, refId, type });
    return { transaction: txn, newBalance };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
