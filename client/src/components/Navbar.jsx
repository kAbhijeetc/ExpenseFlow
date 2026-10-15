import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Tags,
  Wallet,
  User,
  LogOut,
  Sun,
  Moon,
  Plus,
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

export const Navbar = ({ onQuickAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 text-white font-bold flex items-center justify-center text-xs">
              EF
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              ExpenseFlow
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onQuickAdd && (
            <button
              type="button"
              onClick={onQuickAdd}
              className="p-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-sm"
              title="Add Transaction"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-1 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
