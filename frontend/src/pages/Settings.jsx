import React from 'react';
import { Settings as SettingsIcon, Server, ShieldCheck, Database, UserCircle2, KeyRound } from 'lucide-react';
import GlassCard from '../components/GlassCard';

export default function Settings({ currentUser }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4">
          <div className="inline-flex items-center rounded-3xl bg-white/10 px-4 py-2 border border-white/10 backdrop-blur-md shadow-xl shadow-blue-900/20">
            <SettingsIcon className="w-5 h-5 text-blue-300 mr-3" />
            <span className="text-sm uppercase tracking-[0.3em] text-blue-200">Settings & About</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Lumina Hub Version 1.0.0</h1>
            <p className="mt-3 max-w-2xl text-slate-300 text-sm leading-7">
              Enterprise-grade management for regional wholesale operations, combining a modern frontend experience with robust backend transaction control and data governance.
            </p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <GlassCard className="p-6 bg-white/10 border border-white/20 backdrop-blur-md">
              <h2 className="text-xl font-semibold text-white mb-4">System Configuration</h2>
              <div className="space-y-6">
                <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-2xl bg-blue-500/15 p-2 text-blue-300">
                      <UserCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">Current Session</p>
                      <p className="text-slate-400 text-xs">Authenticated account information</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-300">
                    <div className="rounded-2xl bg-slate-900/80 px-4 py-3">
                      <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Name</p>
                      <p className="mt-1 text-white font-medium">{currentUser?.FullName}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 px-4 py-3">
                      <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Role</p>
                      <p className="mt-1 text-white font-medium">{currentUser?.Role}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 px-4 py-3">
                      <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Email</p>
                      <p className="mt-1 text-white font-medium">{currentUser?.Email}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                  <h3 className="text-lg font-semibold text-white mb-3">Appearance</h3>
                  <div className="space-y-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3">
                      <div>
                        <p className="font-medium text-white">Glassmorphism Theme</p>
                        <p className="text-slate-400 text-xs">Enable UI blur for a premium glass surface.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-12 h-6 rounded-full bg-slate-700/80 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer peer-checked:bg-blue-500 transition-colors"></div>
                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-6"></span>
                      </label>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3">
                      <div>
                        <p className="font-medium text-white">Compact Mode</p>
                        <p className="text-slate-400 text-xs">Increase data density across the interface.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-12 h-6 rounded-full bg-slate-700/80 peer-focus:ring-2 peer-focus:ring-blue-500/50 peer peer-checked:bg-blue-500 transition-colors"></div>
                        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-6"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-lg font-semibold text-white">Connection</p>
                      <p className="text-slate-400 text-xs">Live database connectivity</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300 text-xs font-medium border border-emerald-400/20">
                      Connected
                    </span>
                  </div>
                  <div className="space-y-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between rounded-2xl bg-slate-900/80 px-4 py-3">
                      <span>InventorySalesDB</span>
                      <span className="text-slate-200">MySQL 8.0</span>
                    </div>
                    <div className="rounded-2xl bg-slate-900/80 px-4 py-3">
                      <p className="text-slate-400 text-xs uppercase tracking-[0.2em]">Database</p>
                      <p className="mt-1 text-white font-medium">InventorySalesDB</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-8 bg-white/10 border border-white/20 backdrop-blur-md">
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.3em] text-blue-300">About the Program</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Lumina Hub Version 1.0.0</h2>
                <p className="mt-4 max-w-2xl text-slate-300 leading-7 text-sm">
                  A professional regional wholesale management system with a secure data foundation and transparent warehouse operations.
                </p>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-4 text-blue-300">
                    <Database className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-white">Trigger-Based Inventory Engine</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-7">
                    The system enforces business logic directly at the database tier by leveraging SQL triggers such as <code className="rounded bg-slate-900/70 px-1.5 py-0.5 text-blue-200">trg_AfterInsertOrderItem</code>. This architecture guarantees data consistency and transactional integrity for stock movements, independent of client behavior.
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-4 text-blue-300">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-white">Security & Architecture</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-7">
                    Activity 5 adds database-backed user authentication, password recovery, and account lifecycle controls. User account creation, profile updates, activation, and deactivation now run through the backend with hashed passwords and searchable account records.
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-4 text-blue-300">
                    <KeyRound className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-white">Password Recovery</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-7">
                    Recovery requests generate a time-limited verification code, allowing secure password resets during your classroom demonstration without needing an external email service.
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-950/80 border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-4 text-blue-300">
                    <Server className="w-5 h-5" />
                    <h3 className="text-lg font-semibold text-white">Transactions</h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-7">
                    Critical operations are executed through secure backend stored procedures such as <code className="rounded bg-slate-900/70 px-1.5 py-0.5 text-blue-200">sp_PlaceOrder</code>, ensuring that order entry, inventory update, and audit recording occur within a controlled server-side workflow.
                  </p>
                </div>
              </div>

              <div className="mt-10 border-t border-white/10 pt-5 text-center text-xs text-slate-500">
                © 2026 Lumina Regional Wholesalers. All rights reserved.
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
