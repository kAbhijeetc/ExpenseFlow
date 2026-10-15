import React from 'react';

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse"
        >
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 h-12 bg-slate-100 dark:bg-slate-800"></div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/5"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
