import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BarChart3, LayoutDashboard, Package, ShoppingCart, Users as UsersIcon, Settings as SettingsIcon, LogOut, Shield, UserCircle2 } from 'lucide-react';
import GlassCard from './components/GlassCard';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Auth from './components/Auth';
import luminaLogo from './assets/lumina-logo.svg';

const PERSISTENT_USER_KEY = 'lumina-current-user';
const SESSION_USER_KEY = 'lumina-session-user';

function readStoredUser() {
  const persistentUser = localStorage.getItem(PERSISTENT_USER_KEY);
  if (persistentUser) {
    return JSON.parse(persistentUser);
  }

  const sessionUser = sessionStorage.getItem(SESSION_USER_KEY);
  return sessionUser ? JSON.parse(sessionUser) : null;
}

function storeUser(user, rememberMe) {
  localStorage.removeItem(PERSISTENT_USER_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);

  if (rememberMe) {
    localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(user));
    return;
  }

  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

function clearStoredUser() {
  localStorage.removeItem(PERSISTENT_USER_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
}

function Sidebar({ currentUser, onLogout }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const getLinkClass = (path) => {
    const isActive = currentPath === path;
    return `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;
  };

  return (
    <div className="w-64 border-r border-white/10 bg-slate-950/80 backdrop-blur-xl p-6 flex flex-col h-screen sticky top-0 shadow-inner shadow-blue-950/20">
      <div className="mb-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center shadow-lg shadow-blue-950/20">
          <img
            src={luminaLogo}
            alt="Lumina Hub logo"
            className="mx-auto h-20 w-20 object-contain"
          />
          <div className="mt-3">
            <div className="text-lg font-bold tracking-[0.24em] text-white">LUMINA</div>
            <div className="text-sm font-semibold text-blue-300">Hub</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 flex flex-col">
        <Link to="/" className={getLinkClass('/')}>
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
        <Link to="/inventory" className={getLinkClass('/inventory')}>
          <Package className="w-5 h-5" />
          <span>Inventory</span>
        </Link>
        <Link to="/sales" className={getLinkClass('/sales')}>
          <ShoppingCart className="w-5 h-5" />
          <span>Sales</span>
        </Link>
        <Link to="/reports" className={getLinkClass('/reports')}>
          <BarChart3 className="w-5 h-5" />
          <span>Reports</span>
        </Link>
        <Link to="/users" className={getLinkClass('/users')}>
          <UsersIcon className="w-5 h-5" />
          <span>Users</span>
        </Link>
        <Link to="/settings" className={getLinkClass('/settings')}>
          <SettingsIcon className="w-5 h-5" />
          <span>Settings & About</span>
        </Link>

        <div className="mt-auto pt-6 space-y-4">
          <GlassCard className="p-4 bg-white/5 border-white/10">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 rounded-lg bg-blue-500/15 p-2 text-blue-300">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{currentUser?.FullName}</p>
                <p className="truncate text-xs text-slate-400">{currentUser?.Email}</p>
                <div className="mt-2 inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-200">
                  <Shield className="mr-1 h-3.5 w-3.5" />
                  {currentUser?.Role}
                </div>
              </div>
            </div>
          </GlassCard>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = React.useState(() => readStoredUser());

  const handleLogout = React.useCallback(() => {
    setCurrentUser(null);
    clearStoredUser();
  }, []);

  const handleLogin = React.useCallback((user, { rememberMe }) => {
    setCurrentUser(user);
    storeUser(user, rememberMe);
  }, []);

  const handleCurrentUserChange = React.useCallback((updatedUser) => {
    setCurrentUser((previousUser) => {
      if (!previousUser || previousUser.AccountID !== updatedUser.AccountID) {
        return previousUser;
      }

      if (updatedUser.Status === 'Inactive') {
        clearStoredUser();
        return null;
      }

      const mergedUser = { ...previousUser, ...updatedUser };
      if (localStorage.getItem(PERSISTENT_USER_KEY)) {
        localStorage.setItem(PERSISTENT_USER_KEY, JSON.stringify(mergedUser));
      } else if (sessionStorage.getItem(SESSION_USER_KEY)) {
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(mergedUser));
      }
      return mergedUser;
    });
  }, []);

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Sidebar currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory currentUser={currentUser} />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/reports" element={<Reports currentUser={currentUser} />} />
            <Route
              path="/users"
              element={<Users currentUser={currentUser} onCurrentUserChange={handleCurrentUserChange} onForcedLogout={handleLogout} />}
            />
            <Route path="/settings" element={<Settings currentUser={currentUser} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
