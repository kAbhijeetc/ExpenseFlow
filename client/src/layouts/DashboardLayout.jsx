import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { TransactionModal } from '../components/TransactionModal';

export const DashboardLayout = () => {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionSuccess = () => {
    // Increment trigger to notify active pages
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar onQuickAdd={() => setQuickAddOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Top Header */}
        <Navbar onQuickAdd={() => setQuickAddOpen(true)} />

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ refreshTrigger, setRefreshTrigger }} />
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
};
