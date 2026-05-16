import React, { useState } from 'react';
import { ClipboardCheck, Info, Package, Plus, Search, X } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { apiFetch } from '../lib/api';

// Removed Mock Data

export default function Inventory({ currentUser }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  const fetchInventoryData = async () => {
    try {
      const [productData, categoryData, supplierData] = await Promise.all([
        apiFetch('/api/products'),
        apiFetch('/api/categories'),
        apiFetch('/api/suppliers')
      ]);

      setProducts(productData);
      setCategories(categoryData);
      setSuppliers(supplierData);
    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    let isCurrent = true;

    const loadInventoryData = async () => {
      try {
        const [productData, categoryData, supplierData] = await Promise.all([
          apiFetch('/api/products'),
          apiFetch('/api/categories'),
          apiFetch('/api/suppliers')
        ]);

        if (!isCurrent) return;
        setProducts(productData);
        setCategories(categoryData);
        setSuppliers(supplierData);
      } catch (err) {
        console.error("Failed to fetch inventory data:", err);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadInventoryData();

    return () => {
      isCurrent = false;
    };
  }, []);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    Name: '', CategoryID: '', SupplierID: '', Price: '', StockQty: '', ReorderLevel: ''
  });
  const [stockAdjustment, setStockAdjustment] = useState({
    ProductID: '',
    NewStockQty: '',
    Reason: ''
  });

  const selectedAdjustmentProduct = products.find((product) => String(product.ProductID) === String(stockAdjustment.ProductID));

  const openAdjustmentModal = () => {
    const firstProduct = products[0];
    setStockAdjustment({
      ProductID: firstProduct ? String(firstProduct.ProductID) : '',
      NewStockQty: firstProduct ? String(firstProduct.StockQty) : '',
      Reason: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleAdjustmentProductChange = (productId) => {
    const product = products.find((item) => String(item.ProductID) === String(productId));
    setStockAdjustment((previous) => ({
      ProductID: productId,
      NewStockQty: product ? String(product.StockQty) : '',
      Reason: previous.Reason
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      alert(`Product "${newProduct.Name}" added successfully!`);
      setIsAddModalOpen(false);
      setNewProduct({ Name: '', CategoryID: '', SupplierID: '', Price: '', StockQty: '', ReorderLevel: '' });
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleStockAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setIsAdjustingStock(true);

    try {
      const data = await apiFetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ProductID: stockAdjustment.ProductID,
          NewStockQty: stockAdjustment.NewStockQty,
          Reason: stockAdjustment.Reason,
          AdjustedByAccountID: currentUser?.AccountID,
          AdjustedByName: currentUser?.FullName || 'System User'
        })
      });

      alert(`${data.message} Difference: ${data.adjustment.QuantityDifference}`);
      setIsAdjustModalOpen(false);
      setStockAdjustment({ ProductID: '', NewStockQty: '', Reason: '' });
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsAdjustingStock(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-slate-300 text-sm mt-1">Manage products, stock levels, and suppliers.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsAboutModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-blue-300 hover:text-white"
          >
            <Info className="w-4 h-4" />
            <span className="text-sm font-medium">System Info</span>
          </button>
          <button 
            onClick={openAdjustmentModal}
            disabled={products.length === 0}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/20 hover:bg-emerald-500/25 transition-colors text-emerald-200 hover:text-white disabled:opacity-50"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Inventory Count</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-300" />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm w-72 backdrop-blur-sm transition-all"
          />
        </div>
        <div className="flex space-x-2">
          {/* Mock filters */}
          <select className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm">
            <option value="" className="bg-[#1e1b4b]">All Categories</option>
            {categories.map(c => <option key={c.CategoryID} value={c.CategoryID} className="bg-[#1e1b4b]">{c.Name}</option>)}
          </select>
        </div>
      </div>

      {/* Blurred Data Grid */}
      <GlassCard className="flex-1 flex flex-col min-h-0 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex-1 overflow-auto custom-scrollbar p-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-10">
              <tr className="text-slate-300 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="py-4 px-6 font-medium">Product ID</th>
                <th className="py-4 px-6 font-medium">Product Name</th>
                <th className="py-4 px-6 font-medium">Category</th>
                <th className="py-4 px-6 font-medium">Supplier</th>
                <th className="py-4 px-6 font-medium text-right">Price</th>
                <th className="py-4 px-6 font-medium text-right">Stock</th>
                <th className="py-4 px-6 font-medium text-right">Reorder</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan="7" className="py-4 text-center text-slate-400">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" className="py-4 text-center text-slate-400">No products found.</td></tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.StockQty <= product.ReorderLevel;
                  
                  return (
                    <tr key={product.ProductID} className="transition-colors hover:bg-white/5">
                      <td className="py-4 px-6 font-mono text-xs text-slate-300">{product.ProductID}</td>
                      <td className="py-4 px-6 font-medium text-white flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mr-3 shrink-0">
                          <Package className="w-4 h-4 text-blue-300" />
                        </div>
                        {product.Name}
                      </td>
                      <td className="py-4 px-6 text-slate-300">{product.Category}</td>
                      <td className="py-4 px-6 text-slate-300">{product.Supplier}</td>
                      <td className="py-4 px-6 text-right font-medium">₱{Number(product.Price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className={`py-4 px-6 text-right font-bold ${isLowStock ? 'text-red-400' : 'text-slate-200'}`}>
                        {product.StockQty}
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400">{product.ReorderLevel}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add Product Modal (Heavy Blur) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-2xl"
            onClick={() => setIsAddModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Plus className="w-6 h-6 mr-2 text-blue-400" />
              Add New Product
            </h2>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Product Name</label>
                <input 
                  type="text" required
                  value={newProduct.Name} onChange={e => setNewProduct({...newProduct, Name: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select 
                    required
                    value={newProduct.CategoryID} onChange={e => setNewProduct({...newProduct, CategoryID: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                  >
                    <option value="" disabled className="bg-[#1e1b4b]">Select Category...</option>
                    {categories.map(c => (
                      <option key={c.CategoryID} value={c.CategoryID} className="bg-[#1e1b4b]">{c.Name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Supplier</label>
                  <select 
                    required
                    value={newProduct.SupplierID} onChange={e => setNewProduct({...newProduct, SupplierID: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                  >
                    <option value="" disabled className="bg-[#1e1b4b]">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.SupplierID} value={s.SupplierID} className="bg-[#1e1b4b]">{s.Name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Price (PHP)</label>
                  <input 
                    type="number" step="0.01" required
                    value={newProduct.Price} onChange={e => setNewProduct({...newProduct, Price: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Initial Stock</label>
                  <input 
                    type="number" required
                    value={newProduct.StockQty} onChange={e => setNewProduct({...newProduct, StockQty: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Reorder Level</label>
                  <input 
                    type="number" required
                    value={newProduct.ReorderLevel} onChange={e => setNewProduct({...newProduct, ReorderLevel: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg transition-all"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0f172a]/70 backdrop-blur-md"
            onClick={() => setIsAdjustModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-xl bg-gradient-to-b from-emerald-900/55 to-blue-900/55 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_0_50px_-12px_rgba(16,185,129,0.45)] p-8">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <ClipboardCheck className="w-6 h-6 mr-2 text-emerald-300" />
              Inventory Count / Stock Adjustment
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Records the counted stock, updates inventory, and stores the transaction for Excel reporting.
            </p>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Product</label>
                <select
                  required
                  value={stockAdjustment.ProductID}
                  onChange={(event) => handleAdjustmentProductChange(event.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                >
                  <option value="" disabled className="bg-[#1e1b4b]">Select product...</option>
                  {products.map((product) => (
                    <option key={product.ProductID} value={product.ProductID} className="bg-[#1e1b4b]">
                      {product.Name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAdjustmentProduct && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current Stock</p>
                    <p className="mt-2 text-2xl font-bold text-white">{selectedAdjustmentProduct.StockQty}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Reorder Level</p>
                    <p className="mt-2 text-2xl font-bold text-blue-200">{selectedAdjustmentProduct.ReorderLevel}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Count Difference</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-200">
                      {stockAdjustment.NewStockQty === '' ? 0 : Number(stockAdjustment.NewStockQty) - Number(selectedAdjustmentProduct.StockQty)}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Counted / New Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stockAdjustment.NewStockQty}
                  onChange={(event) => setStockAdjustment((previous) => ({ ...previous, NewStockQty: event.target.value }))}
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Enter actual counted stock"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Reason / Remarks</label>
                <textarea
                  required
                  value={stockAdjustment.Reason}
                  onChange={(event) => setStockAdjustment((previous) => ({ ...previous, Reason: event.target.value }))}
                  className="min-h-24 w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Example: Monthly inventory count, damaged items, physical count correction..."
                />
              </div>

              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                This transaction will be recorded under <strong>{currentUser?.FullName || 'System User'}</strong> and can be exported from the Reports page.
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingStock}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium shadow-lg transition-all disabled:opacity-60"
                >
                  {isAdjustingStock ? 'Saving Count...' : 'Save Inventory Count'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About System Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md"
            onClick={() => setIsAboutModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-gradient-to-b from-blue-900/40 to-purple-900/40 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
            <div className="absolute top-0 right-0 p-4">
              <button onClick={() => setIsAboutModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-3xl shadow-lg border border-white/30">
                L
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Lumina Distribution Hub</h2>
            <h3 className="text-blue-300 font-medium text-center mb-6 tracking-wide uppercase text-sm">Trigger-Based Inventory Engine</h3>
            
            <div className="space-y-4 text-slate-300 text-sm leading-relaxed bg-black/20 p-5 rounded-xl border border-white/5">
              <p>
                This system operates on a robust <strong>Server-Side Trigger Architecture</strong> built on top of the <code className="bg-black/30 px-1.5 py-0.5 rounded text-blue-200">InventorySalesDB</code> MySQL database.
              </p>
              <p>
                Unlike traditional applications where the frontend or API calculates stock levels, Lumina relies on native SQL triggers (e.g., <code className="bg-black/30 px-1.5 py-0.5 rounded text-purple-200">AfterOrderInsert</code>) to automate stock deductions.
              </p>
              <p>
                <strong>Why this matters:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Guarantees data integrity during concurrent high-volume transactions.</li>
                <li>Eliminates race conditions between the application tier and the database.</li>
                <li>All stock adjustments are automatically recorded in the <code className="bg-black/30 px-1.5 py-0.5 rounded text-slate-200">AuditLog</code>.</li>
              </ul>
            </div>
            
            <button 
              onClick={() => setIsAboutModalOpen(false)}
              className="mt-8 w-full px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
