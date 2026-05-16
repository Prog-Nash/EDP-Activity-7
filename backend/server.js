const express = require('express');
const cors = require('cors');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const db = require('./db');
require('dotenv').config({ quiet: true });
const {
  ACCOUNT_ROLES,
  ACCOUNT_STATUSES,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  authenticateUser,
  createAccount,
  ensureAccountsTable,
  getAccountById,
  listAccounts,
  requestPasswordRecovery,
  resetPassword,
  updateAccount,
  updateAccountStatus,
} = require('./accountService');

const app = express();
const PORT = process.env.PORT || 5000;
const COMPANY_NAME = 'Lumina Distribution Hub';
const REPORT_LOGO_PATH = path.join(__dirname, '..', 'frontend', 'src', 'assets', 'hero.png');

app.use(cors());
app.use(express.json());

// Helper function to handle async route errors
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function parseReportFilters(query) {
  const filters = {};
  if (query.startDate) {
    filters.startDate = query.startDate;
  }
  if (query.endDate) {
    filters.endDate = query.endDate;
  }
  return filters;
}

function getRequestUser(query) {
  return String(query.generatedBy || query.user || 'System User').trim() || 'System User';
}

function getSignatory(query) {
  return String(query.signatory || query.generatedBy || 'Authorized Signatory').trim() || 'Authorized Signatory';
}

function normalizeReportValue(value) {
  if (value instanceof Date) {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  return value;
}

function safeFileName(value) {
  return String(value)
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function ensureActivity6Tables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS StockAdjustments (
      AdjustmentID INT AUTO_INCREMENT PRIMARY KEY,
      ProductID INT NOT NULL,
      PreviousStockQty INT NOT NULL,
      NewStockQty INT NOT NULL,
      QuantityDifference INT NOT NULL,
      Reason VARCHAR(255) NOT NULL,
      AdjustedByAccountID INT NULL,
      AdjustedByName VARCHAR(120) NOT NULL,
      AdjustmentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_stock_adjustment_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
      CONSTRAINT fk_stock_adjustment_user FOREIGN KEY (AdjustedByAccountID) REFERENCES UserAccounts(AccountID) ON DELETE SET NULL
    )
  `);
}

function buildDateWhereClause(columnName, filters, params) {
  const clauses = [];

  if (filters.startDate) {
    clauses.push(`${columnName} >= ?`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    clauses.push(`${columnName} <= ?`);
    params.push(filters.endDate);
  }

  return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
}

async function getSalesReport(filters = {}) {
  const params = [];
  const whereClause = buildDateWhereClause('DATE(o.OrderDate)', filters, params);
  const [rows] = await db.query(
    `
      SELECT
        p.ProductID,
        p.ProductName,
        c.CategoryName,
        SUM(oi.Quantity) AS TotalQtySold,
        SUM(oi.Quantity * oi.UnitPrice) AS TotalRevenue,
        MAX(o.OrderDate) AS LastSaleDate
      FROM OrderItems oi
      JOIN Orders o ON oi.OrderID = o.OrderID
      JOIN Products p ON oi.ProductID = p.ProductID
      JOIN Categories c ON p.CategoryID = c.CategoryID
      ${whereClause}
      GROUP BY p.ProductID, p.ProductName, c.CategoryName
      ORDER BY TotalRevenue DESC, p.ProductName ASC
    `,
    params
  );

  return rows;
}

async function getInventoryReport() {
  const [rows] = await db.query(`
    SELECT
      p.ProductID,
      p.ProductName,
      c.CategoryName,
      s.SupplierName,
      p.UnitPrice,
      p.StockQty,
      p.ReorderLevel,
      CASE WHEN p.StockQty <= p.ReorderLevel THEN 'Low Stock' ELSE 'Healthy' END AS StockStatus
    FROM Products p
    JOIN Categories c ON p.CategoryID = c.CategoryID
    JOIN Suppliers s ON p.SupplierID = s.SupplierID
    ORDER BY p.ProductName ASC
  `);

  return rows;
}

async function getStockAdjustmentReport(filters = {}) {
  const params = [];
  const whereClause = buildDateWhereClause('DATE(sa.AdjustmentDate)', filters, params);
  const [rows] = await db.query(
    `
      SELECT
        sa.AdjustmentID,
        sa.ProductID,
        p.ProductName,
        sa.PreviousStockQty,
        sa.NewStockQty,
        sa.QuantityDifference,
        sa.Reason,
        sa.AdjustedByName,
        sa.AdjustmentDate
      FROM StockAdjustments sa
      JOIN Products p ON sa.ProductID = p.ProductID
      ${whereClause}
      ORDER BY sa.AdjustmentDate DESC, sa.AdjustmentID DESC
    `,
    params
  );

  return rows;
}

function styleTitleCell(cell, size = 18) {
  cell.font = { bold: true, size, color: { argb: 'FFFFFFFF' } };
  cell.alignment = { vertical: 'middle', horizontal: 'left' };
}

function addReportHeader(workbook, worksheet, reportTitle, generatedBy, filters) {
  worksheet.properties.defaultRowHeight = 22;
  worksheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 7 }];
  worksheet.mergeCells('B1:H1');
  worksheet.mergeCells('B2:H2');
  worksheet.mergeCells('B3:H3');
  worksheet.mergeCells('B4:H4');

  worksheet.getCell('B1').value = COMPANY_NAME;
  worksheet.getCell('B2').value = reportTitle;
  worksheet.getCell('B3').value = `Generated by: ${generatedBy}`;
  worksheet.getCell('B4').value = `Generated on: ${new Date().toLocaleString('en-PH')}`;

  styleTitleCell(worksheet.getCell('B1'), 20);
  styleTitleCell(worksheet.getCell('B2'), 15);
  worksheet.getCell('B3').font = { color: { argb: 'FFDDEBFF' } };
  worksheet.getCell('B4').font = { color: { argb: 'FFDDEBFF' } };

  worksheet.getCell('A1').value = 'LH';
  worksheet.getCell('A1').font = { bold: true, size: 22, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  worksheet.getCell('A1').border = {
    top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
  };
  worksheet.getRow(1).height = 42;
  worksheet.getRow(2).height = 24;

  if (fs.existsSync(REPORT_LOGO_PATH)) {
    const logoId = workbook.addImage({
      filename: REPORT_LOGO_PATH,
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 1 },
      ext: { width: 64, height: 64 },
    });
  }

  ['A1:H4'].forEach((range) => {
    worksheet.getCell(range.split(':')[0]).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF172554' },
    };
  });

  for (let rowNumber = 1; rowNumber <= 4; rowNumber += 1) {
    for (let columnNumber = 1; columnNumber <= 8; columnNumber += 1) {
      const cell = worksheet.getCell(rowNumber, columnNumber);
      if (!cell.fill || !cell.fill.fgColor) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF172554' },
        };
      }
    }
  }

  const periodText = filters.startDate || filters.endDate
    ? `Period: ${filters.startDate || 'Beginning'} to ${filters.endDate || 'Present'}`
    : 'Period: All records';
  worksheet.mergeCells('A6:H6');
  worksheet.getCell('A6').value = periodText;
  worksheet.getCell('A6').font = { bold: true, color: { argb: 'FF1E3A8A' } };
  worksheet.getCell('A6').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDBEAFE' },
  };
}

function writeDataGrid(worksheet, columns, rows) {
  const headerRowNumber = 8;
  const headerRow = worksheet.getRow(headerRowNumber);

  columns.forEach((column, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = column.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D4ED8' },
    };
    cell.alignment = { horizontal: column.align || 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF93C5FD' } },
      left: { style: 'thin', color: { argb: 'FF93C5FD' } },
      bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
      right: { style: 'thin', color: { argb: 'FF93C5FD' } },
    };
  });

  rows.forEach((record, rowIndex) => {
    const excelRow = worksheet.getRow(headerRowNumber + rowIndex + 1);
    columns.forEach((column, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      cell.value = normalizeReportValue(record[column.key]);
      cell.alignment = { horizontal: column.align || 'left', vertical: 'middle' };
      if (column.numFmt) {
        cell.numFmt = column.numFmt;
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (rowIndex % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
    });
  });

  columns.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = column.width || 18;
  });

  return headerRowNumber + rows.length + 3;
}

function addSignatureArea(worksheet, startRow, generatedBy, signatory) {
  worksheet.getCell(startRow, 1).value = 'Prepared by:';
  worksheet.getCell(startRow, 5).value = 'Checked / Approved by:';
  worksheet.getCell(startRow, 1).font = { bold: true };
  worksheet.getCell(startRow, 5).font = { bold: true };

  worksheet.getCell(startRow + 3, 1).value = generatedBy;
  worksheet.getCell(startRow + 3, 5).value = signatory;
  worksheet.getCell(startRow + 4, 1).value = 'System User / Report Generator';
  worksheet.getCell(startRow + 4, 5).value = 'Signature over Printed Name';

  [1, 5].forEach((columnNumber) => {
    worksheet.getCell(startRow + 3, columnNumber).border = {
      bottom: { style: 'thin', color: { argb: 'FF111827' } },
    };
    worksheet.getCell(startRow + 4, columnNumber).font = {
      italic: true,
      color: { argb: 'FF64748B' },
    };
  });
}

function addGraphSheet(workbook, reportTitle, rows, config) {
  const worksheet = workbook.addWorksheet('Sheet 2 - Graph');
  worksheet.views = [{ showGridLines: false }];
  worksheet.mergeCells('A1:N1');
  worksheet.getCell('A1').value = `${reportTitle} Graph`;
  worksheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  worksheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF172554' },
  };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  worksheet.getCell('A3').value = config.labelHeader;
  worksheet.getCell('B3').value = config.valueHeader;
  worksheet.getCell('C3').value = 'Graph';
  ['A3', 'B3', 'C3'].forEach((address) => {
    worksheet.getCell(address).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(address).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D4ED8' },
    };
  });

  const graphRows = rows
    .slice(0, 10)
    .map((record) => ({
      label: String(record[config.labelKey] || 'N/A').slice(0, 42),
      value: Math.abs(Number(record[config.valueKey]) || 0),
    }))
    .filter((record) => record.value > 0);

  const fallbackRows = graphRows.length ? graphRows : [{ label: 'No records yet', value: 0 }];
  const maxValue = Math.max(...fallbackRows.map((record) => record.value), 1);

  fallbackRows.forEach((record, index) => {
    const rowNumber = index + 4;
    worksheet.getCell(rowNumber, 1).value = record.label;
    worksheet.getCell(rowNumber, 2).value = record.value;
    worksheet.getCell(rowNumber, 2).numFmt = config.numFmt || '#,##0';

    const barLength = record.value === 0 ? 1 : Math.max(1, Math.round((record.value / maxValue) * 12));
    for (let columnNumber = 3; columnNumber <= 14; columnNumber += 1) {
      const cell = worksheet.getCell(rowNumber, columnNumber);
      cell.value = columnNumber - 2 <= barLength ? ' ' : '';
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: columnNumber - 2 <= barLength ? 'FF38BDF8' : 'FFE2E8F0' },
      };
    }
  });

  worksheet.getColumn(1).width = 34;
  worksheet.getColumn(2).width = 16;
  for (let columnNumber = 3; columnNumber <= 14; columnNumber += 1) {
    worksheet.getColumn(columnNumber).width = 4;
  }

  worksheet.getCell(fallbackRows.length + 6, 1).value = 'Note: This sheet visualizes the generated report data using an Excel bar graph layout.';
  worksheet.getCell(fallbackRows.length + 6, 1).font = { italic: true, color: { argb: 'FF475569' } };
}

async function buildExcelReport({ reportTitle, columns, rows, generatedBy, signatory, filters, graph }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_NAME;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Sheet 1 - Report');
  addReportHeader(workbook, worksheet, reportTitle, generatedBy, filters);
  const signatureStartRow = writeDataGrid(worksheet, columns, rows);
  addSignatureArea(worksheet, signatureStartRow, generatedBy, signatory);
  addGraphSheet(workbook, reportTitle, rows, graph);

  return workbook;
}

async function sendExcelReport(res, reportConfig) {
  const workbook = await buildExcelReport(reportConfig);
  const fileName = `${safeFileName(reportConfig.reportTitle)}-${Date.now()}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  await workbook.xlsx.write(res);
  res.end();
}

// ==========================================
// INVENTORY ENDPOINTS
// ==========================================

// Get all products (with category and supplier names joined)
app.get('/api/products', asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.ProductID, p.ProductName as Name, c.CategoryName as Category, s.SupplierName as Supplier, p.UnitPrice as Price, p.StockQty, p.ReorderLevel
    FROM Products p
    JOIN Categories c ON p.CategoryID = c.CategoryID
    JOIN Suppliers s ON p.SupplierID = s.SupplierID
  `);
  res.json(rows);
}));

// Get categories
app.get('/api/categories', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT CategoryID, CategoryName as Name FROM Categories');
  res.json(rows);
}));

// Get suppliers
app.get('/api/suppliers', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT SupplierID, SupplierName as Name FROM Suppliers');
  res.json(rows);
}));

// Add a new product
app.post('/api/products', asyncHandler(async (req, res) => {
  const { Name, CategoryID, SupplierID, Price, StockQty, ReorderLevel } = req.body;
  
  if (!Name || !CategoryID || !SupplierID || !Price || StockQty === undefined || ReorderLevel === undefined) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const [result] = await db.query(
    'INSERT INTO Products (ProductName, CategoryID, SupplierID, UnitPrice, StockQty, ReorderLevel) VALUES (?, ?, ?, ?, ?, ?)',
    [Name, CategoryID, SupplierID, Price, StockQty, ReorderLevel]
  );
  
  res.status(201).json({ message: 'Product created successfully', ProductID: result.insertId });
}));

// Inventory Count / Stock Adjustment transaction
app.post('/api/stock-adjustments', asyncHandler(async (req, res) => {
  const {
    ProductID,
    NewStockQty,
    Reason,
    AdjustedByAccountID,
    AdjustedByName,
  } = req.body;

  const productId = Number(ProductID);
  const newStockQty = Number(NewStockQty);
  const reason = String(Reason || '').trim();
  const adjustedByName = String(AdjustedByName || 'System User').trim();
  const adjustedByAccountId = AdjustedByAccountID ? Number(AdjustedByAccountID) : null;

  if (!productId || !Number.isInteger(newStockQty) || newStockQty < 0 || !reason) {
    return res.status(400).json({ error: 'Product, counted stock, and reason are required. Stock must be 0 or higher.' });
  }

  const pool = await db.ensurePool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [productRows] = await connection.query(
      'SELECT ProductID, ProductName, StockQty FROM Products WHERE ProductID = ? FOR UPDATE',
      [productId]
    );

    if (productRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = productRows[0];
    const previousStockQty = Number(product.StockQty);
    const quantityDifference = newStockQty - previousStockQty;

    await connection.query(
      'UPDATE Products SET StockQty = ? WHERE ProductID = ?',
      [newStockQty, productId]
    );

    const [insertResult] = await connection.query(
      `
        INSERT INTO StockAdjustments
          (ProductID, PreviousStockQty, NewStockQty, QuantityDifference, Reason, AdjustedByAccountID, AdjustedByName)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [productId, previousStockQty, newStockQty, quantityDifference, reason, adjustedByAccountId, adjustedByName]
    );

    await connection.query(
      `
        INSERT INTO AuditLog (Action, TableName, RecordID, Notes)
        VALUES (?, ?, ?, ?)
      `,
      [
        'UPDATE',
        'Products',
        productId,
        `${adjustedByName} adjusted ${product.ProductName} stock from ${previousStockQty} to ${newStockQty}. Reason: ${reason}`,
      ]
    ).catch(() => {});

    await connection.commit();

    res.status(201).json({
      message: 'Stock adjustment recorded successfully.',
      adjustment: {
        AdjustmentID: insertResult.insertId,
        ProductID: productId,
        ProductName: product.ProductName,
        PreviousStockQty: previousStockQty,
        NewStockQty: newStockQty,
        QuantityDifference: quantityDifference,
        Reason: reason,
        AdjustedByName: adjustedByName,
      },
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// ==========================================
// AUTHENTICATION & USER MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/auth/bootstrap', asyncHandler(async (req, res) => {
  res.json({
    adminEmail: DEFAULT_ADMIN_EMAIL,
    adminPassword: DEFAULT_ADMIN_PASSWORD,
    roles: ACCOUNT_ROLES,
    statuses: ACCOUNT_STATUSES,
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateUser(db, email, password);
  res.json({ message: 'Login successful.', user });
}));

app.post('/api/auth/recovery/request', asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await requestPasswordRecovery(db, email);
  res.json(result);
}));

app.post('/api/auth/recovery/reset', asyncHandler(async (req, res) => {
  const { email, recoveryCode, newPassword } = req.body;
  const account = await resetPassword(db, email, recoveryCode, newPassword);
  res.json({ message: 'Password reset successful.', account });
}));

app.get('/api/users', asyncHandler(async (req, res) => {
  const accounts = await listAccounts(db, req.query);
  res.json(accounts);
}));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const account = await getAccountById(db, req.params.id);
  res.json({
    AccountID: account.AccountID,
    AccountCode: account.AccountCode,
    FullName: account.FullName,
    Email: account.Email,
    Role: account.Role,
    Status: account.Status,
    LastLogin: account.LastLogin,
    CreatedAt: account.CreatedAt,
    UpdatedAt: account.UpdatedAt,
  });
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const account = await createAccount(db, req.body);
  res.status(201).json({ message: 'Account created successfully.', account });
}));

app.put('/api/users/:id', asyncHandler(async (req, res) => {
  const account = await updateAccount(db, req.params.id, req.body);
  res.json({ message: 'Account profile updated successfully.', account });
}));

app.patch('/api/users/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const account = await updateAccountStatus(db, req.params.id, status);
  res.json({ message: `Account marked as ${account.Status}.`, account });
}));

// ==========================================
// DASHBOARD ENDPOINTS
// ==========================================

// Get Low Stock Products View
app.get('/api/low-stock', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM vw_LowStockProducts');
  res.json(rows);
}));

// Get Audit Log
app.get('/api/audit-log', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM AuditLog ORDER BY ChangeDate DESC LIMIT 15');
  res.json(rows);
}));

// Get Dashboard KPIs (Mocked calculation from tables/views for demonstration)
app.get('/api/dashboard/kpis', asyncHandler(async (req, res) => {
  // Total Revenue
  const [revenueRows] = await db.query('SELECT SUM(TotalRevenue) as total FROM vw_ProductSalesReport');
  const totalRevenue = revenueRows[0].total || 0;

  // Active Orders (Pending)
  const [activeOrdersRows] = await db.query('SELECT COUNT(*) as count FROM Orders WHERE Status = "Pending"');
  const activeOrders = activeOrdersRows[0].count;

  // Items Low Stock
  const [lowStockRows] = await db.query('SELECT COUNT(*) as count FROM vw_LowStockProducts');
  const itemsLowStock = lowStockRows[0].count;

  res.json({
    totalRevenue,
    activeOrders,
    itemsLowStock,
    fulfillmentRate: 98.2 // Hardcoded for now
  });
}));

// ==========================================
// SALES & ORDERS ENDPOINTS
// ==========================================

// Get Sales Report View
app.get('/api/sales-report', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM vw_ProductSalesReport');
  res.json(rows);
}));

// ==========================================
// ACTIVITY 6 REPORTS & EXCEL EXPORTS
// ==========================================

app.get('/api/reports/sales', asyncHandler(async (req, res) => {
  const rows = await getSalesReport(parseReportFilters(req.query));
  res.json(rows);
}));

app.get('/api/reports/inventory', asyncHandler(async (req, res) => {
  const rows = await getInventoryReport();
  res.json(rows);
}));

app.get('/api/reports/stock-adjustments', asyncHandler(async (req, res) => {
  const rows = await getStockAdjustmentReport(parseReportFilters(req.query));
  res.json(rows);
}));

app.get('/api/reports/sales/export', asyncHandler(async (req, res) => {
  const filters = parseReportFilters(req.query);
  const rows = await getSalesReport(filters);

  await sendExcelReport(res, {
    reportTitle: 'Sales Transaction Report',
    rows,
    generatedBy: getRequestUser(req.query),
    signatory: getSignatory(req.query),
    filters,
    columns: [
      { header: 'Product ID', key: 'ProductID', width: 12 },
      { header: 'Product Name', key: 'ProductName', width: 28 },
      { header: 'Category', key: 'CategoryName', width: 20 },
      { header: 'Qty Sold', key: 'TotalQtySold', width: 12, align: 'right', numFmt: '#,##0' },
      { header: 'Total Revenue', key: 'TotalRevenue', width: 16, align: 'right', numFmt: '"PHP" #,##0.00' },
      { header: 'Last Sale Date', key: 'LastSaleDate', width: 18, numFmt: 'yyyy-mm-dd' },
    ],
    graph: {
      labelHeader: 'Product',
      valueHeader: 'Revenue',
      labelKey: 'ProductName',
      valueKey: 'TotalRevenue',
      numFmt: '"PHP" #,##0.00',
    },
  });
}));

app.get('/api/reports/inventory/export', asyncHandler(async (req, res) => {
  const rows = await getInventoryReport();

  await sendExcelReport(res, {
    reportTitle: 'Inventory Stock Report',
    rows,
    generatedBy: getRequestUser(req.query),
    signatory: getSignatory(req.query),
    filters: {},
    columns: [
      { header: 'Product ID', key: 'ProductID', width: 12 },
      { header: 'Product Name', key: 'ProductName', width: 28 },
      { header: 'Category', key: 'CategoryName', width: 20 },
      { header: 'Supplier', key: 'SupplierName', width: 24 },
      { header: 'Unit Price', key: 'UnitPrice', width: 14, align: 'right', numFmt: '"PHP" #,##0.00' },
      { header: 'Stock Qty', key: 'StockQty', width: 12, align: 'right', numFmt: '#,##0' },
      { header: 'Reorder Level', key: 'ReorderLevel', width: 14, align: 'right', numFmt: '#,##0' },
      { header: 'Status', key: 'StockStatus', width: 14 },
    ],
    graph: {
      labelHeader: 'Product',
      valueHeader: 'Stock Qty',
      labelKey: 'ProductName',
      valueKey: 'StockQty',
      numFmt: '#,##0',
    },
  });
}));

app.get('/api/reports/stock-adjustments/export', asyncHandler(async (req, res) => {
  const filters = parseReportFilters(req.query);
  const rows = await getStockAdjustmentReport(filters);

  await sendExcelReport(res, {
    reportTitle: 'Inventory Count Adjustment Report',
    rows,
    generatedBy: getRequestUser(req.query),
    signatory: getSignatory(req.query),
    filters,
    columns: [
      { header: 'Adjustment ID', key: 'AdjustmentID', width: 14 },
      { header: 'Product Name', key: 'ProductName', width: 28 },
      { header: 'Previous Stock', key: 'PreviousStockQty', width: 16, align: 'right', numFmt: '#,##0' },
      { header: 'New Stock', key: 'NewStockQty', width: 14, align: 'right', numFmt: '#,##0' },
      { header: 'Difference', key: 'QuantityDifference', width: 14, align: 'right', numFmt: '#,##0' },
      { header: 'Reason', key: 'Reason', width: 32 },
      { header: 'Adjusted By', key: 'AdjustedByName', width: 22 },
      { header: 'Date', key: 'AdjustmentDate', width: 18, numFmt: 'yyyy-mm-dd hh:mm' },
    ],
    graph: {
      labelHeader: 'Product',
      valueHeader: 'Stock Difference',
      labelKey: 'ProductName',
      valueKey: 'QuantityDifference',
      numFmt: '#,##0',
    },
  });
}));

// Get Customers
app.get('/api/customers', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT CustomerID, CONCAT(FirstName, " ", LastName) as Name FROM Customers');
  res.json(rows);
}));

// Place a new order (Calls stored procedure)
app.post('/api/orders', asyncHandler(async (req, res) => {
  const { CustomerID, ProductID, Quantity } = req.body;

  if (!CustomerID || !ProductID || !Quantity) {
    return res.status(400).json({ error: 'CustomerID, ProductID, and Quantity are required.' });
  }

  // CALL sp_PlaceOrder
  try {
    const [results] = await db.query('CALL sp_PlaceOrder(?, ?, ?)', [CustomerID, ProductID, Quantity]);
    // sp_PlaceOrder returns a select statement at the end: SELECT v_OrderID AS NewOrderID, 'Order placed successfully.' AS Message;
    const procedureResult = results[0][0]; 

    res.status(200).json(procedureResult);
  } catch (err) {
    // Catch SIGNAL SQLSTATE errors from procedure
    res.status(400).json({ error: err.message });
  }
}));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal Server Error' });
});

async function startServer() {
  await ensureAccountsTable(db);
  await ensureActivity6Tables();
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});
