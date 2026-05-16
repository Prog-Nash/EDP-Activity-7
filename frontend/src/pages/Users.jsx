import React, { useEffect, useMemo, useState } from 'react';
import { Users as UsersIcon, Search, Shield, UserPlus, UserPen, UserCheck, UserX, Mail, Lock, X, BadgeCheck, LoaderCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import { ACCOUNT_ROLES } from '../constants/accountOptions';
import { apiFetch } from '../lib/api';

const emptyForm = {
  FullName: '',
  Email: '',
  Role: 'Read-Only',
  Status: 'Active',
  Password: '',
};

function formatLastLogin(value) {
  if (!value) {
    return 'Never logged in';
  }
  return new Date(value).toLocaleString();
}

export default function Users({ currentUser, onCurrentUserChange, onForcedLogout }) {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (roleFilter !== 'All') params.set('role', roleFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);

      const data = await apiFetch(`/api/users${params.toString() ? `?${params.toString()}` : ''}`);
      setAccounts(data);
    } catch (error) {
      setBanner({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    const loadAccounts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (roleFilter !== 'All') params.set('role', roleFilter);
        if (statusFilter !== 'All') params.set('status', statusFilter);

        const data = await apiFetch(`/api/users${params.toString() ? `?${params.toString()}` : ''}`);
        if (isCurrent) {
          setAccounts(data);
        }
      } catch (error) {
        if (isCurrent) {
          setBanner({ type: 'error', message: error.message });
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    loadAccounts();

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearch, roleFilter, statusFilter]);

  const summary = useMemo(() => {
    return accounts.reduce((totals, account) => {
      totals.total += 1;
      if (account.Status === 'Active') totals.active += 1;
      if (account.Status === 'Inactive') totals.inactive += 1;
      if (account.Role === 'Administrator') totals.admins += 1;
      return totals;
    }, { total: 0, active: 0, inactive: 0, admins: 0 });
  }, [accounts]);

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData(emptyForm);
    setBanner(null);
    setIsModalOpen(true);
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setFormData({
      FullName: account.FullName,
      Email: account.Email,
      Role: account.Role,
      Status: account.Status,
      Password: '',
    });
    setBanner(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData(emptyForm);
    setIsSubmitting(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setBanner(null);

    const endpoint = editingAccount ? `/api/users/${editingAccount.AccountID}` : '/api/users';
    const method = editingAccount ? 'PUT' : 'POST';

    try {
      const data = await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setBanner({ type: 'success', message: data.message });
      closeModal();
      await fetchAccounts();

      if (currentUser?.AccountID === data.account.AccountID) {
        onCurrentUserChange?.(data.account);
      }
    } catch (error) {
      setBanner({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (account) => {
    const nextStatus = account.Status === 'Active' ? 'Inactive' : 'Active';
    const confirmed = window.confirm(`Change ${account.FullName} to ${nextStatus}?`);
    if (!confirmed) {
      return;
    }

    setBanner(null);
    try {
      const data = await apiFetch(`/api/users/${account.AccountID}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      setBanner({ type: 'success', message: data.message });
      await fetchAccounts();

      if (currentUser?.AccountID === data.account.AccountID) {
        if (data.account.Status === 'Inactive') {
          onForcedLogout?.();
        } else {
          onCurrentUserChange?.(data.account);
        }
      }
    } catch (error) {
      setBanner({ type: 'error', message: error.message });
    }
  };

  return (
    <div className="p-6 h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <UsersIcon className="w-8 h-8 mr-3 text-blue-400" />
            User Management
          </h1>
          <p className="text-slate-300 text-sm mt-1">Manage system access, roles, and accounts.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium shadow-lg transition-all"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {banner && (
        <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
          banner.type === 'success'
            ? 'border-green-500/30 bg-green-500/10 text-green-100'
            : 'border-red-500/30 bg-red-500/10 text-red-100'
        }`}>
          {banner.message}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <GlassCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Accounts</p>
          <p className="mt-2 text-2xl font-bold text-white">{summary.total}</p>
        </GlassCard>
        <GlassCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-bold text-green-300">{summary.active}</p>
        </GlassCard>
        <GlassCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inactive</p>
          <p className="mt-2 text-2xl font-bold text-slate-200">{summary.inactive}</p>
        </GlassCard>
        <GlassCard className="p-4 bg-white/5 border-white/10">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Administrators</p>
          <p className="mt-2 text-2xl font-bold text-blue-300">{summary.admins}</p>
        </GlassCard>
      </div>

      <GlassCard className="mb-6 p-4 shrink-0 flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-md">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users by name, email, or account code..."
            className="bg-white/10 border border-white/10 rounded-lg py-2 pl-9 pr-3 w-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm transition-all"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">Role:</span>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="All" className="bg-[#1e1b4b]">All Roles</option>
            {ACCOUNT_ROLES.map((role) => (
              <option key={role} value={role} className="bg-[#1e1b4b]">{role}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="All" className="bg-[#1e1b4b]">All Statuses</option>
            <option value="Active" className="bg-[#1e1b4b]">Active</option>
            <option value="Inactive" className="bg-[#1e1b4b]">Inactive</option>
          </select>
        </div>
      </GlassCard>

      <GlassCard className="flex-1 flex flex-col min-h-0 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex-1 overflow-auto custom-scrollbar p-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="sticky top-0 bg-[#0f172a]/80 backdrop-blur-md z-10">
              <tr className="text-slate-300 text-xs uppercase tracking-wider border-b border-white/10">
                <th className="py-4 px-6 font-medium">User</th>
                <th className="py-4 px-6 font-medium">Role</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Last Login</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-10">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Loading accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    No accounts matched your search.
                  </td>
                </tr>
              ) : accounts.map((user) => (
                <tr key={user.AccountID} className="transition-colors hover:bg-white/5">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg mr-3">
                        {user.FullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{user.FullName}</div>
                        <div className="text-xs text-slate-400">{user.AccountCode} | {user.Email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="flex items-center text-slate-300">
                      {user.Role === 'Administrator' && <Shield className="w-4 h-4 mr-2 text-blue-400" />}
                      {user.Role}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.Status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {user.Status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400">{formatLastLogin(user.LastLogin)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        title="Edit account"
                        onClick={() => openEditModal(user)}
                        className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <UserPen className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={user.Status === 'Active' ? 'Set inactive' : 'Set active'}
                        onClick={() => handleToggleStatus(user)}
                        className={`rounded-lg p-2 transition-colors ${
                          user.Status === 'Active'
                            ? 'text-amber-300 hover:bg-amber-500/10'
                            : 'text-green-300 hover:bg-green-500/10'
                        }`}
                      >
                        {user.Status === 'Active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0f172a]/75 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-950/90 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editingAccount ? 'Update Account Profile' : 'Add New Account'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {editingAccount
                    ? `Editing ${editingAccount.AccountCode}. Leave password blank to keep the current password.`
                    : 'Create a new user account with role-based access.'}
                </p>
              </div>
              <button onClick={closeModal} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.FullName}
                  onChange={(event) => setFormData((previous) => ({ ...previous, FullName: event.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.Email}
                    onChange={(event) => setFormData((previous) => ({ ...previous, Email: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="name@lumina.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Role</label>
                  <select
                    value={formData.Role}
                    onChange={(event) => setFormData((previous) => ({ ...previous, Role: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {ACCOUNT_ROLES.map((role) => (
                      <option key={role} value={role} className="bg-slate-900">{role}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Account Status</label>
                  <select
                    value={formData.Status}
                    onChange={(event) => setFormData((previous) => ({ ...previous, Status: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="Active" className="bg-slate-900">Active</option>
                    <option value="Inactive" className="bg-slate-900">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  {editingAccount ? 'New Password (optional)' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={formData.Password}
                    onChange={(event) => setFormData((previous) => ({ ...previous, Password: event.target.value }))}
                    required={!editingAccount}
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder={editingAccount ? 'Leave blank to keep current password' : 'At least 6 characters'}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-white/20 px-5 py-2.5 font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 font-medium text-white shadow-lg transition-all hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="mr-2 h-4 w-4" />
                      {editingAccount ? 'Save Changes' : 'Create Account'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
