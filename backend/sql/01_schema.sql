USE ConvoBankDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'bank')
BEGIN
  EXEC ('CREATE SCHEMA bank');
END;
GO

IF OBJECT_ID(N'bank.Customers', N'U') IS NULL
BEGIN
  CREATE TABLE bank.Customers (
    CustomerId NVARCHAR(20) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Password NVARCHAR(100) NOT NULL,
    Phone NVARCHAR(30) NULL
  );
END;
GO

IF OBJECT_ID(N'bank.Accounts', N'U') IS NULL
BEGIN
  CREATE TABLE bank.Accounts (
    AccountId NVARCHAR(20) PRIMARY KEY,
    CustomerId NVARCHAR(20) NOT NULL,
    [Type] NVARCHAR(30) NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    MaskedNumber NVARCHAR(30) NOT NULL,
    Balance DECIMAL(18,2) NOT NULL,
    Currency NVARCHAR(10) NOT NULL DEFAULT N'PKR',
    CONSTRAINT FK_Accounts_Customers FOREIGN KEY (CustomerId) REFERENCES bank.Customers(CustomerId)
  );
END;
GO

IF OBJECT_ID(N'bank.Beneficiaries', N'U') IS NULL
BEGIN
  CREATE TABLE bank.Beneficiaries (
    BeneficiaryId NVARCHAR(20) PRIMARY KEY,
    CustomerId NVARCHAR(20) NOT NULL,
    Nickname NVARCHAR(100) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Bank NVARCHAR(100) NOT NULL,
    AccountNumber NVARCHAR(30) NOT NULL,
    MaskedNumber NVARCHAR(30) NOT NULL,
    CONSTRAINT FK_Beneficiaries_Customers FOREIGN KEY (CustomerId) REFERENCES bank.Customers(CustomerId)
  );
END;
GO

IF OBJECT_ID(N'bank.Bills', N'U') IS NULL
BEGIN
  CREATE TABLE bank.Bills (
    BillerId NVARCHAR(20) PRIMARY KEY,
    CustomerId NVARCHAR(20) NOT NULL,
    BillerName NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) NOT NULL,
    AccountNumber NVARCHAR(50) NOT NULL,
    CurrentDue DECIMAL(18,2) NOT NULL,
    DueDate DATE NOT NULL,
    CONSTRAINT FK_Bills_Customers FOREIGN KEY (CustomerId) REFERENCES bank.Customers(CustomerId)
  );
END;
GO

IF OBJECT_ID(N'bank.Cards', N'U') IS NULL
BEGIN
  CREATE TABLE bank.Cards (
    CardId NVARCHAR(20) PRIMARY KEY,
    CustomerId NVARCHAR(20) NOT NULL,
    AccountId NVARCHAR(20) NOT NULL,
    [Type] NVARCHAR(20) NOT NULL,
    Network NVARCHAR(30) NOT NULL,
    Last4 NVARCHAR(4) NOT NULL,
    MaskedNumber NVARCHAR(30) NOT NULL,
    ExpiryDate NVARCHAR(10) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL,
    BlockedAt DATETIME2 NULL,
    CONSTRAINT FK_Cards_Customers FOREIGN KEY (CustomerId) REFERENCES bank.Customers(CustomerId),
    CONSTRAINT FK_Cards_Accounts FOREIGN KEY (AccountId) REFERENCES bank.Accounts(AccountId)
  );
END;
GO

IF OBJECT_ID(N'bank.Transactions', N'U') IS NULL
BEGIN
  CREATE TABLE bank.Transactions (
    TransactionId NVARCHAR(30) PRIMARY KEY,
    RefId NVARCHAR(40) NULL,
    CustomerId NVARCHAR(20) NOT NULL,
    AccountId NVARCHAR(20) NOT NULL,
    [Type] NVARCHAR(20) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL,
    [Description] NVARCHAR(255) NOT NULL,
    BalanceAfter DECIMAL(18,2) NOT NULL,
    [Timestamp] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    [Status] NVARCHAR(20) NOT NULL,
    Meta NVARCHAR(MAX) NULL,
    FeedbackRating NVARCHAR(10) NULL,
    FeedbackAt DATETIME2 NULL,
    CONSTRAINT FK_Transactions_Customers FOREIGN KEY (CustomerId) REFERENCES bank.Customers(CustomerId),
    CONSTRAINT FK_Transactions_Accounts FOREIGN KEY (AccountId) REFERENCES bank.Accounts(AccountId)
  );
END;
GO

IF OBJECT_ID(N'bank.OperationLogs', N'U') IS NULL
BEGIN
  CREATE TABLE bank.OperationLogs (
    LogId BIGINT IDENTITY(1,1) PRIMARY KEY,
    Ts DATETIME2 NOT NULL,
    CustomerId NVARCHAR(20) NOT NULL,
    [Action] NVARCHAR(50) NOT NULL,
    Outcome NVARCHAR(20) NOT NULL,
    Meta NVARCHAR(MAX) NULL,
    CONSTRAINT FK_OperationLogs_Customers FOREIGN KEY (CustomerId) REFERENCES bank.Customers(CustomerId)
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Accounts_CustomerId' AND object_id = OBJECT_ID(N'bank.Accounts'))
  CREATE INDEX IX_Accounts_CustomerId ON bank.Accounts(CustomerId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Beneficiaries_CustomerId' AND object_id = OBJECT_ID(N'bank.Beneficiaries'))
  CREATE INDEX IX_Beneficiaries_CustomerId ON bank.Beneficiaries(CustomerId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Bills_CustomerId' AND object_id = OBJECT_ID(N'bank.Bills'))
  CREATE INDEX IX_Bills_CustomerId ON bank.Bills(CustomerId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Cards_CustomerId' AND object_id = OBJECT_ID(N'bank.Cards'))
  CREATE INDEX IX_Cards_CustomerId ON bank.Cards(CustomerId);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Transactions_Customer_Account_Time' AND object_id = OBJECT_ID(N'bank.Transactions'))
  CREATE INDEX IX_Transactions_Customer_Account_Time ON bank.Transactions(CustomerId, AccountId, [Timestamp] DESC);
GO
