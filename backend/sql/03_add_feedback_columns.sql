USE ConvoBankDB;
GO

IF COL_LENGTH('bank.Transactions', 'FeedbackRating') IS NULL
BEGIN
  ALTER TABLE bank.Transactions
  ADD FeedbackRating NVARCHAR(10) NULL;
END;
GO

IF COL_LENGTH('bank.Transactions', 'FeedbackAt') IS NULL
BEGIN
  ALTER TABLE bank.Transactions
  ADD FeedbackAt DATETIME2 NULL;
END;
GO
