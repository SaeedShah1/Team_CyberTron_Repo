USE ConvoBankDB;
GO

IF NOT EXISTS (SELECT 1 FROM bank.Customers WHERE CustomerId = N'user1')
BEGIN
  INSERT INTO bank.Customers (CustomerId, FullName, Email, Password, Phone)
  VALUES
    (N'user1', N'Ahmed Khan', N'ahmed.khan@example.com', N'$2a$08$S/R98EK1nfQ4CRMRyA9QJeChXa4fXAgbp509xjRLcnnhQIU7sSXs2', N'+92 300 1234567'),
    (N'user2', N'Sara Khan', N'sara.khan@example.com', N'$2a$08$ELAyosubWL7AvGDz5h1qkOOLUxjLNtvNTC3HIlQ1bVuaZ1JELMCR.', N'+92 321 4567890');
END;
GO

IF NOT EXISTS (SELECT 1 FROM bank.Accounts WHERE AccountId = N'ACC1001')
BEGIN
  INSERT INTO bank.Accounts (AccountId, CustomerId, [Type], Title, MaskedNumber, Balance, Currency)
  VALUES
    (N'ACC1001', N'user1', N'savings', N'Savings Account', N'••0042', 183591.00, N'PKR'),
    (N'ACC1002', N'user1', N'current', N'Current Account', N'••0078', 41800.00, N'PKR'),
    (N'ACC2001', N'user2', N'savings', N'Savings Account', N'••5511', 67400.00, N'PKR');
END;
GO

IF NOT EXISTS (SELECT 1 FROM bank.Beneficiaries WHERE BeneficiaryId = N'BEN001')
BEGIN
  INSERT INTO bank.Beneficiaries (BeneficiaryId, CustomerId, Nickname, FullName, Bank, AccountNumber, MaskedNumber)
  VALUES
    (N'BEN001', N'user1', N'Sara (Wife)', N'Sara Ahmed Khan', N'Meezan Bank', N'04567890123456', N'••3456'),
    (N'BEN002', N'user1', N'Bilal (Brother)', N'Bilal Ahmed Khan', N'MCB Bank', N'03345112299876', N'••9876'),
    (N'BEN003', N'user1', N'Ayesha (Rent)', N'Ayesha Tariq', N'United Bank', N'12349876543210', N'••3210'),
    (N'BEN101', N'user2', N'Mom', N'Naseem Akhtar', N'HBL', N'00012345678901', N'••8901');
END;
GO

IF NOT EXISTS (SELECT 1 FROM bank.Bills WHERE BillerId = N'BIL_KE')
BEGIN
  INSERT INTO bank.Bills (BillerId, CustomerId, BillerName, Category, AccountNumber, CurrentDue, DueDate)
  VALUES
    (N'BIL_KE', N'user1', N'K-Electric', N'electricity', N'KE-04-21-3398-0421-7', 9200.00, '2026-05-22'),
    (N'BIL_SSGC', N'user1', N'SSGC Gas', N'gas', N'SSGC-7821-44513-2', 2050.00, '2026-05-18'),
    (N'BIL_PTCL', N'user1', N'PTCL Internet', N'internet', N'PTCL-021-35870234', 3500.00, '2026-05-05'),
    (N'BIL_KE2', N'user2', N'K-Electric', N'electricity', N'KE-05-11-1100-9876-2', 4100.00, '2026-05-22'),
    (N'BIL_PTCL2', N'user2', N'PTCL Internet', N'internet', N'PTCL-021-99887766', 3500.00, '2026-05-05');
END;
GO

IF NOT EXISTS (SELECT 1 FROM bank.Cards WHERE CardId = N'CARD001')
BEGIN
  INSERT INTO bank.Cards (CardId, CustomerId, AccountId, [Type], Network, Last4, MaskedNumber, ExpiryDate, [Status], BlockedAt)
  VALUES
    (N'CARD001', N'user1', N'ACC1001', N'debit', N'Visa', N'4521', N'4321 •••• •••• 4521', N'12/27', N'blocked', '2026-04-25T11:03:31.970Z'),
    (N'CARD002', N'user1', N'ACC1001', N'credit', N'Mastercard', N'8834', N'5178 •••• •••• 8834', N'09/26', N'active', NULL),
    (N'CARD003', N'user1', N'ACC1002', N'debit', N'Visa', N'7712', N'4532 •••• •••• 7712', N'03/28', N'blocked', '2026-04-25T11:26:16.217Z'),
    (N'CARD101', N'user2', N'ACC2001', N'debit', N'Visa', N'3390', N'4111 •••• •••• 3390', N'06/27', N'active', NULL);
END;
GO
