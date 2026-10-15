import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Tags,
  Wallet,
  User,
  LogOut,
  Sun,
  Moon,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Categories', path: '/categories', icon: Tags },
  { name: 'Budgets', path: '/budgets', icon: Wallet },
  { name: 'Reports & Analytics', path: '/reports', icon: PieChart },
  { name: 'Profile & Settings', path: '/profile', icon: User },
];

export const Sidebar = ({ onQuickAdd }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 dark:border-slate-800">
        <NavLink to="/" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-sky-500/20">
            EF
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              ExpenseFlow
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-sky-600 dark:text-sky-400">
              Smart Tracker
            </span>
          </div>
        </NavLink>
      </div>

      {/* Quick Action Button */}
      {onQuickAdd && (
        <div className="px-4 pt-5 pb-2">
          <button
            type="button"
            onClick={onQuickAdd}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-xl shadow-sm transition-all shadow-sky-600/25 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="text-sm">Add Transaction</span>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer User Profile & Theme Toggle */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold text-sm border border-slate-200 dark:border-slate-700">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
