import React, { useState, useEffect } from 'react';
import { Package, Search, Bell, Activity, AlertCircle, ShoppingCart, Users } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { apiFetch } from '../lib/api';

export default function Dashboard() {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [kpis, setKpis] = useState({ totalRevenue: 0, activeOrders: 0, itemsLowStock: 0, fulfillmentRate: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [lowStockData, auditData, kpiData] = await Promise.all([
          apiFetch('/api/low-stock'),
          apiFetch('/api/audit-log'),
          apiFetch('/api/dashboard/kpis')
        ]);

        setLowStockProducts(lowStockData);
        setAuditLog(auditData);
        setKpis(kpiData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Helper to get appropriate icon based on Action
  const getLogIconDetails = (action) => {
    if (action.includes('INSERT') || action.includes('Add')) return { Icon: Package, color: 'text-green-400', bg: 'bg-green-400/20' };
    if (action.includes('UPDATE') || action.includes('Adjust')) return { Icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-400/20' };
    if (action.includes('DELETE') || action.includes('Cancel')) return { Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/20' };
    return { Icon: Activity, color: 'text-slate-300', bg: 'bg-white/10' };
  };
  return (
    <div className="p-6 h-full flex flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-white">Command Center</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search dashboard..." 
              className="bg-slate-900/70 border border-slate-800 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm w-64 backdrop-blur-sm transition-all text-white"
            />
          </div>
          <button className="p-2 rounded-full bg-slate-900/70 hover:bg-slate-800/90 transition-colors relative border border-white/10">
            <Bell className="w-5 h-5 text-blue-300" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-950"></span>
          </button>
        </div>
      </div>

      {/* Main Grid: High Density Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left/Center Column (Main Content) */}
        <div className="xl:col-span-3 flex flex-col space-y-6 min-h-0">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 shrink-0">
            <GlassCard className="p-5 flex items-center space-x-4 border-l-4 border-l-blue-500 bg-slate-950/80">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
                <p className="text-xl font-bold text-white leading-tight">₱{Number(kpis.totalRevenue).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </GlassCard>
            
            <GlassCard className="p-5 flex items-center space-x-4 border-l-4 border-l-cyan-500 bg-slate-950/80">
              <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-300">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Orders</p>
                <p className="text-2xl font-bold text-white">{kpis.activeOrders}</p>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center space-x-4 border-l-4 border-l-amber-500 bg-slate-950/80">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Items Low Stock</p>
                <p className="text-2xl font-bold text-white">{kpis.itemsLowStock}</p>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center space-x-4 border-l-4 border-l-sky-500 bg-slate-950/80">
              <div className="p-3 rounded-xl bg-sky-500/20 text-sky-300">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Fulfillment Rate</p>
                <p className="text-2xl font-bold text-white">{kpis.fulfillmentRate}%</p>
              </div>
            </GlassCard>
          </div>

          {/* Low Stock Alerts Table */}
          <GlassCard className="flex-1 flex flex-col min-h-0 bg-slate-950/80">
            <div className="p-4 border-b border-white/10 shrink-0 flex justify-between items-center bg-slate-900/80 rounded-t-xl">
              <h2 className="text-lg font-semibold flex items-center text-white">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-300" />
                Low Stock Alerts
              </h2>
              <button className="text-xs font-semibold text-blue-300 hover:text-white transition-colors">
                View All
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
                  <tr className="text-slate-300 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4 font-medium">Product ID</th>
                    <th className="py-3 px-4 font-medium">Name</th>
                    <th className="py-3 px-4 font-medium text-right">Current Stock</th>
                    <th className="py-3 px-4 font-medium text-right">Reorder Level</th>
                    <th className="py-3 px-4 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-800">
                {isLoading ? (
                  <tr><td colSpan="5" className="py-4 text-center text-slate-400">Loading data...</td></tr>
                ) : lowStockProducts.length === 0 ? (
                  <tr><td colSpan="5" className="py-4 text-center text-slate-400">No low stock items.</td></tr>
                ) : (
                  lowStockProducts.map((item) => {
                    const isCritical = item.StockQty === 0;
                    return (
                      <tr 
                        key={item.ProductID} 
                        className={`transition-colors hover:bg-slate-900/50 ${isCritical ? 'bg-red-500/10' : 'bg-slate-950/70'}`}
                      >
                        <td className="py-4 px-4 font-mono text-xs text-slate-300">{item.ProductID}</td>
                        <td className="py-4 px-4 font-medium text-white">{item.ProductName}</td>
                        <td className="py-4 px-4 text-center font-bold text-amber-300">{item.StockQty}</td>
                        <td className="py-4 px-4 text-center text-slate-400">{item.ReorderLevel}</td>
                        <td className="py-4 px-4 text-right">
                          <button className="px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-xs font-semibold rounded-lg transition-colors border border-blue-500/20">
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right Column (Activity Feed Sidebar) */}
        <GlassCard className="xl:col-span-1 flex flex-col min-h-0 bg-slate-950/80">
          <div className="p-4 border-b border-white/10 shrink-0 bg-slate-900/85 rounded-t-xl">
            <h2 className="text-lg font-semibold flex items-center text-white">
              <Activity className="w-5 h-5 mr-2 text-blue-300" />
              Activity Feed
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {isLoading ? (
              <div className="text-center text-slate-400 text-sm">Loading activity...</div>
            ) : (
              auditLog.map((log) => {
                const { Icon, color, bg } = getLogIconDetails(log.Action);
                return (
                  <div key={log.LogID} className="flex items-start space-x-3 p-3 rounded-2xl transition-colors border border-white/10 hover:border-blue-500/20 hover:bg-slate-900/70">
                    <div className={`p-2 rounded-lg ${bg} ${color} mt-0.5 shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{log.Action}</p>
                      <p className="text-xs text-slate-400 mt-1 truncate">{log.Notes}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0 whitespace-nowrap">
                      {new Date(log.ChangeDate).toLocaleDateString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
        
      </div>
    </div>
  );
}
