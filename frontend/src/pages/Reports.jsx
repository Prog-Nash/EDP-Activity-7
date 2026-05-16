import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calendar, Download, FileSpreadsheet, LoaderCircle, RefreshCw, Search } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { apiFetch, buildApiUrl } from '../lib/api';

const REPORTS = {
  sales: {
    title: 'Sales Transaction Report',
    description: 'Product sales, quantity sold, revenue, and latest sale date.',
    endpoint: '/api/reports/sales',
    exportEndpoint: '/api/reports/sales/export',
    fileName: 'sales-transaction-report.xlsx',
    supportsDateFilter: true,
    columns: [
      { label: 'Product ID', key: 'ProductID' },
      { label: 'Product Name', key: 'ProductName' },
      { label: 'Category', key: 'CategoryName' },
      { label: 'Qty Sold', key: 'TotalQtySold', align: 'right' },
      { label: 'Total Revenue', key: 'TotalRevenue', align: 'right', format: 'money' },
      { label: 'Last Sale', key: 'LastSaleDate', align: 'right', format: 'date' },
    ],
  },
  inventory: {
    title: 'Inventory Stock Report',
    description: 'Current product stock levels, reorder points, supplier, and status.',
    endpoint: '/api/reports/inventory',
    exportEndpoint: '/api/reports/inventory/export',
    fileName: 'inventory-stock-report.xlsx',
    supportsDateFilter: false,
    columns: [
      { label: 'Product ID', key: 'ProductID' },
      { label: 'Product Name', key: 'ProductName' },
      { label: 'Category', key: 'CategoryName' },
      { label: 'Supplier', key: 'SupplierName' },
      { label: 'Unit Price', key: 'UnitPrice', align: 'right', format: 'money' },
      { label: 'Stock', key: 'StockQty', align: 'right' },
      { label: 'Reorder', key: 'ReorderLevel', align: 'right' },
      { label: 'Status', key: 'StockStatus' },
    ],
  },
  adjustments: {
    title: 'Inventory Count Adjustment Report',
    description: 'Inventory count corrections with previous stock, new stock, reason, and user.',
    endpoint: '/api/reports/stock-adjustments',
    exportEndpoint: '/api/reports/stock-adjustments/export',
    fileName: 'inventory-count-adjustment-report.xlsx',
    supportsDateFilter: true,
    columns: [
      { label: 'Adjustment ID', key: 'AdjustmentID' },
      { label: 'Product Name', key: 'ProductName' },
      { label: 'Previous', key: 'PreviousStockQty', align: 'right' },
      { label: 'New', key: 'NewStockQty', align: 'right' },
      { label: 'Difference', key: 'QuantityDifference', align: 'right' },
      { label: 'Reason', key: 'Reason' },
      { label: 'Adjusted By', key: 'AdjustedByName' },
      { label: 'Date', key: 'AdjustmentDate', align: 'right', format: 'datetime' },
    ],
  },
};

function formatValue(value, format) {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }

  if (format === 'money') {
    return `PHP ${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (format === 'date') {
    return new Date(value).toLocaleDateString('en-PH');
  }

  if (format === 'datetime') {
    return new Date(value).toLocaleString('en-PH');
  }

  return value;
}

function buildQueryString(report, filters, currentUser, signatory) {
  const params = new URLSearchParams();
  params.set('generatedBy', currentUser?.FullName || 'System User');
  params.set('signatory', signatory || currentUser?.FullName || 'Authorized Signatory');

  if (report.supportsDateFilter) {
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
  }

  return params.toString();
}

export default function Reports({ currentUser }) {
  const [activeReportKey, setActiveReportKey] = useState('sales');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [signatory, setSignatory] = useState(currentUser?.FullName || '');

  const activeReport = REPORTS[activeReportKey];

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(query))
    );
  }, [rows, search]);

  const summary = useMemo(() => {
    if (activeReportKey === 'sales') {
      return {
        label: 'Total Revenue',
        value: `PHP ${rows.reduce((sum, row) => sum + Number(row.TotalRevenue || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };
    }

    if (activeReportKey === 'inventory') {
      return {
        label: 'Low Stock Items',
        value: rows.filter((row) => row.StockStatus === 'Low Stock').length,
      };
    }

    return {
      label: 'Adjustments Logged',
      value: rows.length,
    };
  }, [activeReportKey, rows]);

  useEffect(() => {
    let isCurrent = true;

    const loadReport = async () => {
      setIsLoading(true);
      setMessage(null);

      try {
        const queryString = buildQueryString(activeReport, filters, currentUser, signatory);
        const data = await apiFetch(`${activeReport.endpoint}?${queryString}`);

        if (isCurrent) {
          setRows(data);
        }
      } catch (error) {
        if (isCurrent) {
          setMessage({ type: 'error', text: error.message });
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadReport();

    return () => {
      isCurrent = false;
    };
  }, [activeReport, currentUser, filters, refreshKey, signatory]);

  const handleApplyFilters = () => {
    setRefreshKey((previous) => previous + 1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const queryString = buildQueryString(activeReport, filters, currentUser, signatory);
      const response = await fetch(buildApiUrl(`${activeReport.exportEndpoint}?${queryString}`));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Unable to export report.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = activeReport.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: `${activeReport.title} exported successfully.` });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center text-3xl font-bold tracking-tight">
            <FileSpreadsheet className="mr-3 h-8 w-8 text-emerald-300" />
            MS Excel Report Center
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Generate Data Grid reports and export Excel templates with header, logo, signature, and graph sheet.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 font-medium text-white shadow-lg transition-all hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-60"
        >
          {isExporting ? <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
          Export to Excel
        </button>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-3">
        {Object.entries(REPORTS).map(([key, report]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveReportKey(key)}
            className={`rounded-2xl border p-5 text-left transition-all ${
              activeReportKey === key
                ? 'border-emerald-300/50 bg-emerald-500/15 shadow-lg shadow-emerald-950/30'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Template</span>
              <BarChart3 className="h-5 w-5 text-cyan-200" />
            </div>
            <h2 className="text-lg font-bold text-white">{report.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{report.description}</p>
          </button>
        ))}
      </div>

      {message && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
          message.type === 'success'
            ? 'border-green-500/30 bg-green-500/10 text-green-100'
            : 'border-red-500/30 bg-red-500/10 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <GlassCard className="mb-5 p-4 bg-white/5 border-white/10">
        <div className="flex flex-wrap items-end gap-4">
          <div className="relative min-w-[240px] flex-1">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Search Grid</label>
            <Search className="absolute left-3 top-[38px] h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search report records..."
              className="w-full rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {activeReport.supportsDateFilter && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) => setFilters((previous) => ({ ...previous, startDate: event.target.value }))}
                    className="rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) => setFilters((previous) => ({ ...previous, endDate: event.target.value }))}
                    className="rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </>
          )}

          <div className="min-w-[240px]">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Report Signatory</label>
            <input
              type="text"
              value={signatory}
              onChange={(event) => setSignatory(event.target.value)}
              placeholder="Name of signer"
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <button
            type="button"
            onClick={handleApplyFilters}
            className="inline-flex items-center rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Report
          </button>
        </div>
      </GlassCard>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <GlassCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Report</p>
          <p className="mt-2 text-lg font-bold text-white">{activeReport.title}</p>
        </GlassCard>
        <GlassCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Grid Records</p>
          <p className="mt-2 text-2xl font-bold text-cyan-200">{filteredRows.length}</p>
        </GlassCard>
        <GlassCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{summary.label}</p>
          <p className="mt-2 text-2xl font-bold text-emerald-200">{summary.value}</p>
        </GlassCard>
      </div>

      <GlassCard className="flex-1 flex flex-col min-h-0 bg-white/5 border-white/10 shadow-2xl">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-white">{activeReport.title} Data Grid</h2>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar p-1">
          <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#0f172a]/90 backdrop-blur-md">
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-300">
                {activeReport.columns.map((column) => (
                  <th key={column.key} className={`px-6 py-4 font-medium ${column.align === 'right' ? 'text-right' : ''}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={activeReport.columns.length} className="py-10 text-center text-slate-400">
                    <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                    Loading report...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={activeReport.columns.length} className="py-10 text-center text-slate-400">
                    No report records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIndex) => (
                  <tr key={`${activeReportKey}-${rowIndex}`} className="transition-colors hover:bg-white/5">
                    {activeReport.columns.map((column) => (
                      <td key={column.key} className={`px-6 py-4 ${column.align === 'right' ? 'text-right' : ''}`}>
                        {formatValue(row[column.key], column.format)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
