const crypto = require('crypto');

const ACCOUNT_ROLES = ['Administrator', 'Sales Manager', 'Inventory Clerk', 'Read-Only'];
const ACCOUNT_STATUSES = ['Active', 'Inactive'];
const DEFAULT_ADMIN_EMAIL = 'admin@lumina.com';
const DEFAULT_ADMIN_PASSWORD = 'password';

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeStatus(status) {
  return ACCOUNT_STATUSES.includes(status) ? status : 'Active';
}

function normalizeRole(role) {
  return ACCOUNT_ROLES.includes(role) ? role : 'Read-Only';
}

function assertRole(role) {
  if (role && !ACCOUNT_ROLES.includes(role)) {
    throw createHttpError(400, 'Invalid account role.');
  }
}

function assertStatus(status) {
  if (status && !ACCOUNT_STATUSES.includes(status)) {
    throw createHttpError(400, 'Invalid account status.');
  }
}

function formatAccountCode(accountId) {
  return `ACC-${String(accountId).padStart(4, '0')}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { passwordHash, passwordSalt: salt };
}

function verifyPassword(password, passwordSalt, passwordHash) {
  const candidateHash = crypto.pbkdf2Sync(password, passwordSalt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(passwordHash, 'hex'));
}

function createRecoveryCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sanitizeAccount(account) {
  return {
    AccountID: account.AccountID,
    AccountCode: account.AccountCode || formatAccountCode(account.AccountID),
    FullName: account.FullName,
    Email: account.Email,
    Role: account.Role,
    Status: account.Status,
    LastLogin: account.LastLogin,
    CreatedAt: account.CreatedAt,
    UpdatedAt: account.UpdatedAt,
  };
}

async function logAuditEvent(db, action, recordId, notes) {
  try {
    await db.query(
      'INSERT INTO AuditLog (Action, TableName, RecordID, Notes) VALUES (?, ?, ?, ?)',
      [action, 'UserAccounts', recordId, notes]
    );
  } catch (error) {
    console.warn('Audit log entry skipped:', error.message);
  }
}

async function ensureAccountsTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS UserAccounts (
      AccountID INT AUTO_INCREMENT PRIMARY KEY,
      AccountCode VARCHAR(20) UNIQUE,
      FullName VARCHAR(120) NOT NULL,
      Email VARCHAR(120) NOT NULL UNIQUE,
      Role ENUM('Administrator','Sales Manager','Inventory Clerk','Read-Only') NOT NULL DEFAULT 'Read-Only',
      PasswordHash VARCHAR(255) NOT NULL,
      PasswordSalt VARCHAR(255) NOT NULL,
      Status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
      RecoveryCode VARCHAR(10) DEFAULT NULL,
      RecoveryCodeExpiry DATETIME DEFAULT NULL,
      LastLogin DATETIME DEFAULT NULL,
      CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await db.query('SELECT AccountID FROM UserAccounts WHERE Email = ?', [DEFAULT_ADMIN_EMAIL]);
  if (rows.length > 0) {
    return;
  }

  const { passwordHash, passwordSalt } = hashPassword(DEFAULT_ADMIN_PASSWORD);
  const [result] = await db.query(
    `
      INSERT INTO UserAccounts (AccountCode, FullName, Email, Role, PasswordHash, PasswordSalt, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [null, 'Admin User', DEFAULT_ADMIN_EMAIL, 'Administrator', passwordHash, passwordSalt, 'Active']
  );

  const accountCode = formatAccountCode(result.insertId);
  await db.query('UPDATE UserAccounts SET AccountCode = ? WHERE AccountID = ?', [accountCode, result.insertId]);
  await logAuditEvent(db, 'INSERT', result.insertId, 'Seeded default administrator account.');
}

async function getAccountById(db, accountId) {
  const [rows] = await db.query('SELECT * FROM UserAccounts WHERE AccountID = ?', [accountId]);
  if (rows.length === 0) {
    throw createHttpError(404, 'Account not found.');
  }
  return rows[0];
}

async function ensureUniqueEmail(db, email, currentAccountId = null) {
  const normalizedEmail = normalizeEmail(email);
  const params = [normalizedEmail];
  let sql = 'SELECT AccountID FROM UserAccounts WHERE Email = ?';

  if (currentAccountId !== null) {
    sql += ' AND AccountID <> ?';
    params.push(currentAccountId);
  }

  const [rows] = await db.query(sql, params);
  if (rows.length > 0) {
    throw createHttpError(409, 'That email address is already in use.');
  }
}

async function ensureAdminSafety(db, existingAccount, nextRole, nextStatus) {
  const keepsAdminPrivileges = nextRole === 'Administrator' && nextStatus === 'Active';
  if (keepsAdminPrivileges || existingAccount.Role !== 'Administrator' || existingAccount.Status !== 'Active') {
    return;
  }

  const [rows] = await db.query(
    `
      SELECT COUNT(*) AS activeAdminCount
      FROM UserAccounts
      WHERE Role = 'Administrator'
        AND Status = 'Active'
        AND AccountID <> ?
    `,
    [existingAccount.AccountID]
  );

  if (rows[0].activeAdminCount === 0) {
    throw createHttpError(400, 'At least one active administrator account must remain in the system.');
  }
}

async function listAccounts(db, filters = {}) {
  const search = String(filters.search || '').trim();
  const status = filters.status && filters.status !== 'All' ? filters.status : '';
  const role = filters.role && filters.role !== 'All' ? filters.role : '';
  const searchLike = `%${search}%`;

  const [rows] = await db.query(
    `
      SELECT AccountID, AccountCode, FullName, Email, Role, Status, LastLogin, CreatedAt, UpdatedAt
      FROM UserAccounts
      WHERE
        (? = '' OR (
          AccountCode LIKE ?
          OR FullName LIKE ?
          OR Email LIKE ?
          OR Role LIKE ?
        ))
        AND (? = '' OR Status = ?)
        AND (? = '' OR Role = ?)
      ORDER BY
        CASE WHEN Status = 'Active' THEN 0 ELSE 1 END,
        FullName ASC
    `,
    [search, searchLike, searchLike, searchLike, searchLike, status, status, role, role]
  );

  return rows.map(sanitizeAccount);
}

async function createAccount(db, payload) {
  const fullName = String(payload.FullName || '').trim();
  const email = normalizeEmail(payload.Email);
  const password = String(payload.Password || '');
  assertRole(payload.Role);
  assertStatus(payload.Status);
  const role = normalizeRole(payload.Role);
  const status = normalizeStatus(payload.Status);

  if (!fullName || !email || !password) {
    throw createHttpError(400, 'Full name, email, and password are required.');
  }

  if (password.length < 6) {
    throw createHttpError(400, 'Password must be at least 6 characters long.');
  }

  await ensureUniqueEmail(db, email);

  const { passwordHash, passwordSalt } = hashPassword(password);
  const [result] = await db.query(
    `
      INSERT INTO UserAccounts (AccountCode, FullName, Email, Role, PasswordHash, PasswordSalt, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [null, fullName, email, role, passwordHash, passwordSalt, status]
  );

  const accountCode = formatAccountCode(result.insertId);
  await db.query('UPDATE UserAccounts SET AccountCode = ? WHERE AccountID = ?', [accountCode, result.insertId]);
  await logAuditEvent(db, 'INSERT', result.insertId, `Created account ${accountCode} for ${email}.`);
  return sanitizeAccount(await getAccountById(db, result.insertId));
}

async function updateAccount(db, accountId, payload) {
  const existingAccount = await getAccountById(db, accountId);
  const fullName = String(payload.FullName ?? existingAccount.FullName).trim();
  const email = normalizeEmail(payload.Email ?? existingAccount.Email);
  assertRole(payload.Role);
  assertStatus(payload.Status);
  const role = normalizeRole(payload.Role ?? existingAccount.Role);
  const status = normalizeStatus(payload.Status ?? existingAccount.Status);
  const password = String(payload.Password || '');

  if (!fullName || !email) {
    throw createHttpError(400, 'Full name and email are required.');
  }

  await ensureUniqueEmail(db, email, existingAccount.AccountID);
  await ensureAdminSafety(db, existingAccount, role, status);

  let passwordHash = existingAccount.PasswordHash;
  let passwordSalt = existingAccount.PasswordSalt;

  if (password) {
    if (password.length < 6) {
      throw createHttpError(400, 'Password must be at least 6 characters long.');
    }
    const hashedPassword = hashPassword(password);
    passwordHash = hashedPassword.passwordHash;
    passwordSalt = hashedPassword.passwordSalt;
  }

  await db.query(
    `
      UPDATE UserAccounts
      SET FullName = ?, Email = ?, Role = ?, Status = ?, PasswordHash = ?, PasswordSalt = ?
      WHERE AccountID = ?
    `,
    [fullName, email, role, status, passwordHash, passwordSalt, existingAccount.AccountID]
  );

  await logAuditEvent(db, 'UPDATE', existingAccount.AccountID, `Updated profile for ${existingAccount.AccountCode || formatAccountCode(existingAccount.AccountID)}.`);
  return sanitizeAccount(await getAccountById(db, existingAccount.AccountID));
}

async function updateAccountStatus(db, accountId, status) {
  assertStatus(status);
  const normalizedStatus = normalizeStatus(status);

  const existingAccount = await getAccountById(db, accountId);
  await ensureAdminSafety(db, existingAccount, existingAccount.Role, normalizedStatus);

  await db.query('UPDATE UserAccounts SET Status = ? WHERE AccountID = ?', [normalizedStatus, existingAccount.AccountID]);
  await logAuditEvent(db, 'UPDATE', existingAccount.AccountID, `${existingAccount.AccountCode || formatAccountCode(existingAccount.AccountID)} marked as ${normalizedStatus}.`);
  return sanitizeAccount(await getAccountById(db, existingAccount.AccountID));
}

async function authenticateUser(db, email, password) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) {
    throw createHttpError(400, 'Email and password are required.');
  }

  const [rows] = await db.query('SELECT * FROM UserAccounts WHERE Email = ?', [normalizedEmail]);
  if (rows.length === 0) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  const account = rows[0];
  if (account.Status !== 'Active') {
    throw createHttpError(403, 'This account is inactive. Please contact an administrator.');
  }

  if (!verifyPassword(password, account.PasswordSalt, account.PasswordHash)) {
    throw createHttpError(401, 'Invalid email or password.');
  }

  await db.query('UPDATE UserAccounts SET LastLogin = NOW() WHERE AccountID = ?', [account.AccountID]);
  await logAuditEvent(db, 'UPDATE', account.AccountID, `${account.AccountCode || formatAccountCode(account.AccountID)} logged in successfully.`);
  return sanitizeAccount(await getAccountById(db, account.AccountID));
}

async function requestPasswordRecovery(db, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw createHttpError(400, 'Email address is required.');
  }

  const [rows] = await db.query('SELECT * FROM UserAccounts WHERE Email = ?', [normalizedEmail]);
  if (rows.length === 0) {
    throw createHttpError(404, 'No account found for that email address.');
  }

  const account = rows[0];
  const recoveryCode = createRecoveryCode();
  const [expiryRows] = await db.query('SELECT DATE_ADD(NOW(), INTERVAL 15 MINUTE) AS expiresAt');
  const expiresAt = expiryRows[0].expiresAt;

  await db.query(
    'UPDATE UserAccounts SET RecoveryCode = ?, RecoveryCodeExpiry = ? WHERE AccountID = ?',
    [recoveryCode, expiresAt, account.AccountID]
  );

  await logAuditEvent(db, 'UPDATE', account.AccountID, `Password recovery code issued for ${account.AccountCode || formatAccountCode(account.AccountID)}.`);

  return {
    message: 'Recovery code generated successfully.',
    demoCode: recoveryCode,
    expiresAt,
    account: sanitizeAccount(account),
  };
}

async function resetPassword(db, email, recoveryCode, newPassword) {
  const normalizedEmail = normalizeEmail(email);
  const cleanCode = String(recoveryCode || '').trim();
  const cleanPassword = String(newPassword || '');

  if (!normalizedEmail || !cleanCode || !cleanPassword) {
    throw createHttpError(400, 'Email, recovery code, and new password are required.');
  }

  if (cleanPassword.length < 6) {
    throw createHttpError(400, 'New password must be at least 6 characters long.');
  }

  const [rows] = await db.query(
    `
      SELECT *
      FROM UserAccounts
      WHERE Email = ?
        AND RecoveryCode = ?
        AND RecoveryCodeExpiry IS NOT NULL
        AND RecoveryCodeExpiry >= NOW()
    `,
    [normalizedEmail, cleanCode]
  );

  if (rows.length === 0) {
    throw createHttpError(400, 'Invalid or expired recovery code.');
  }

  const account = rows[0];
  const { passwordHash, passwordSalt } = hashPassword(cleanPassword);

  await db.query(
    `
      UPDATE UserAccounts
      SET PasswordHash = ?,
          PasswordSalt = ?,
          RecoveryCode = NULL,
          RecoveryCodeExpiry = NULL
      WHERE AccountID = ?
    `,
    [passwordHash, passwordSalt, account.AccountID]
  );

  await logAuditEvent(db, 'UPDATE', account.AccountID, `Password reset completed for ${account.AccountCode || formatAccountCode(account.AccountID)}.`);
  return sanitizeAccount(await getAccountById(db, account.AccountID));
}

module.exports = {
  ACCOUNT_ROLES,
  ACCOUNT_STATUSES,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  authenticateUser,
  createAccount,
  createHttpError,
  ensureAccountsTable,
  getAccountById,
  listAccounts,
  requestPasswordRecovery,
  resetPassword,
  updateAccount,
  updateAccountStatus,
};
