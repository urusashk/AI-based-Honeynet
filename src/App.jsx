import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import HoneynetPage from './pages/HoneynetPage';
import LiveAttacksPage from './pages/LiveAttacksPage';
import AIThreatAnalysisPage from './pages/AIThreatAnalysisPage';
import AttackersPage from './pages/AttackersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Collapsible Cybersecurity SOC Sidebar */}
      <Sidebar />

      {/* Main SOC Dashboard Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/honeynet" element={<HoneynetPage />} />
          <Route path="/live-attacks" element={<LiveAttacksPage />} />
          <Route path="/ai-analysis" element={<AIThreatAnalysisPage />} />
          <Route path="/attackers" element={<AttackersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
