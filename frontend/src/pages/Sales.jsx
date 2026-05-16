import React, { useState } from 'react';
import { Calendar, ShoppingCart, CheckCircle, Search, TrendingUp, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { apiFetch } from '../lib/api';

// Removed Mock Data

export default function Sales() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [salesReport, setSalesReport] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSalesData = async () => {
    try {
      const [salesData, customerData, productData] = await Promise.all([
        apiFetch('/api/sales-report'),
        apiFetch('/api/customers'),
        apiFetch('/api/products')
      ]);

      setSalesReport(salesData);
      setCustomers(customerData);
      setProducts(productData);
    } catch (err) {
      console.error("Failed to fetch sales data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    let isCurrent = true;

    const loadSalesData = async () => {
      try {
        const [salesData, customerData, productData] = await Promise.all([
          apiFetch('/api/sales-report'),
          apiFetch('/api/customers'),
          apiFetch('/api/products')
        ]);

        if (!isCurrent) return;
        setSalesReport(salesData);
        setCustomers(customerData);
        setProducts(productData);
      } catch (err) {
        console.error("Failed to fetch sales data:", err);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadSalesData();

    return () => {
      isCurrent = false;
    };
  }, []);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Transaction Form States
  const [txData, setTxData] = useState({
    CustomerID: '',
    ProductID: '',
    Quantity: ''
  });

  const showToast = (message, type = 'success') => {
    setToast(message);
    setToastType(type);
    setTimeout(() => setToast(null), 5000);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CustomerID: txData.CustomerID,
          ProductID: txData.ProductID,
          Quantity: txData.Quantity
        })
      });

      setIsModalOpen(false);
      showToast(`SUCCESS: ${data.Message} Order ID: ${data.NewOrderID}. Stock updated automatically.`, 'success');
      setTxData({ CustomerID: '', ProductID: '', Quantity: '' });
      fetchSalesData();
    } catch (err) {
      console.error(err);
      showToast(`ERROR: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-blue-400" />
            Sales & Order Interface
          </h1>
          <p className="text-slate-300 text-sm mt-1">Generate reports and process new transactions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>New Sale</span>
        </button>
      </div>

      {/* Translucent Date Filters */}
      <GlassCard className="mb-6 p-4 shrink-0 flex flex-wrap items-end gap-4 bg-white/5 backdrop-blur-md">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Start Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">End Date</label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
            />
          </div>
        </div>
        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm font-medium transition-colors">
          Generate Report
        </button>
        
        <div className="ml-auto relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm w-64 backdrop-blur-sm transition-all"
          />
        </div>
      </GlassCard>

      {/* Sales Report Grid (vw_ProductSalesReport) */}
      <GlassCard className="flex-1 flex flex-col min-h-0 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="p-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-semibold">Product Sales Report</h2>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar p-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-10">
              <tr className="text-slate-300 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="py-4 px-6 font-medium">Product ID</th>
                <th className="py-4 px-6 font-medium">Product Name</th>
                <th className="py-4 px-6 font-medium text-right">Quantity Sold</th>
                <th className="py-4 px-6 font-medium text-right">Total Revenue</th>
                <th className="py-4 px-6 font-medium text-right">Last Sale Date</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan="5" className="py-4 text-center text-slate-400">Loading report...</td></tr>
              ) : salesReport.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-center text-slate-400">No sales data found.</td></tr>
              ) : (
                salesReport.map((item) => (
                  <tr key={item.ProductID} className="transition-colors hover:bg-white/5">
                    <td className="py-4 px-6 font-mono text-xs text-slate-300">{item.ProductID}</td>
                    <td className="py-4 px-6 font-medium text-white">{item.ProductName}</td>
                    <td className="py-4 px-6 text-right font-medium text-blue-300">{item.TotalQtySold}</td>
                    <td className="py-4 px-6 text-right font-medium text-green-400">
                      ₱{Number(item.TotalRevenue).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-400">N/A</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md bg-gradient-to-b from-blue-900/60 to-purple-900/60 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] p-8">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">New Sale Transaction</h2>
            <p className="text-sm text-slate-300 mb-6">Executes <code className="bg-black/30 px-1 py-0.5 rounded text-purple-300 font-mono text-xs">sp_PlaceOrder</code></p>
            
            <form onSubmit={handleTransactionSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Customer</label>
                <select 
                  required
                  value={txData.CustomerID} onChange={e => setTxData({...txData, CustomerID: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="" disabled className="bg-[#1e1b4b]">Select Customer...</option>
                  {customers.map(c => <option key={c.CustomerID} value={c.CustomerID} className="bg-[#1e1b4b]">{c.Name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Product</label>
                <select 
                  required
                  value={txData.ProductID} onChange={e => setTxData({...txData, ProductID: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                >
                  <option value="" disabled className="bg-[#1e1b4b]">Select Product...</option>
                  {products.map(p => <option key={p.ProductID} value={p.ProductID} className="bg-[#1e1b4b]">{p.Name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Quantity</label>
                <input 
                  type="number" min="1" required
                  value={txData.Quantity} onChange={e => setTxData({...txData, Quantity: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter quantity"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg transition-all disabled:opacity-50 flex justify-center items-center"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Processing Transaction...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`backdrop-blur-xl border p-4 rounded-xl shadow-2xl flex items-start max-w-md ${
            toastType === 'success' 
              ? 'bg-green-500/20 border-green-500/50 text-green-100' 
              : 'bg-red-500/20 border-red-500/50 text-red-100'
          }`}>
            <CheckCircle className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${toastType === 'success' ? 'text-green-400' : 'text-red-400'}`} />
            <p className="text-sm font-medium leading-relaxed">{toast}</p>
            <button onClick={() => setToast(null)} className={`ml-4 shrink-0 ${toastType === 'success' ? 'text-green-400/70 hover:text-green-300' : 'text-red-400/70 hover:text-red-300'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
