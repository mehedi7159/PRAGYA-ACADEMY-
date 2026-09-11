/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { FeeCollection } from './pages/FeeCollection';
import { DueList } from './pages/DueList';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { SmartBatches } from './pages/SmartBatches';
import { Guide } from './pages/Guide';
import { RecycleBin } from './pages/RecycleBin';
import { Payroll } from './pages/Payroll';

import { Attendance } from './pages/Attendance';
import Teachers from './pages/Teachers';
import { Exams } from './pages/Exams';
import { Communication } from './pages/Communication';

import { useAppContext } from './store/AppContext';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { } = useAppContext(); // Keep if we need context, but let's just render the pages.

  // Global listener for navigation
  React.useEffect(() => {
    const handleNavigate = (e: any) => setCurrentPage(e.detail);
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />;
      case 'students': return <Students />;
      case 'attendance': return <Attendance />;
      case 'teachers': return <Teachers />;
      case 'smart-batches': return <SmartBatches />;
      case 'fees': return <FeeCollection />;
      case 'dues': return <DueList />;
      case 'expenses': return <Expenses />;
      case 'reports': return <Reports />;
      case 'recycle-bin': return <RecycleBin />;
      case 'payroll': return <Payroll />;
      case 'exams': return <Exams />;
      case 'communication': return <Communication />;
      case 'settings': return <Settings />;
      case 'guide': return <Guide />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
