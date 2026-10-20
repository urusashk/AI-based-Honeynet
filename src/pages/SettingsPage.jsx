import React, { useState } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  Settings as SettingsIcon,
  Server,
  Terminal,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Database,
  Sliders,
  Shield,
  Radio,
  FileCode2,
  ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useHoneynet();
  const [formData, setFormData] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // 'testing', 'success', 'failed'

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${formData.apiUrl}/api/overview`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('failed');
      }
    } catch {
      setTestStatus('failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Settings & System Integration Readiness"
        subtitle="Configure future FastAPI/Flask backend connectors, Cowrie log ingestion paths, and AI thresholds"
      />

      <div className="p-6 space-y-6">
        {/* Readiness Info Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            <FileCode2 className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <span className="font-bold text-slate-200 block">
              Pluggable Architecture for Ubuntu & Python Backend Integration
            </span>
            <p className="text-slate-400 leading-relaxed">
              When you launch your Ubuntu Server VM running Cowrie and Docker containers, start your Python backend (FastAPI/Flask) and update the API URL below. The frontend will automatically switch from simulated demo data to live log streams without modifying code.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Settings successfully saved and persisted to local configuration!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Backend API Configuration */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-400" />
                Backend Ingestion API
              </h3>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">
                REST / WebSocket
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Backend API URL (FastAPI / Flask)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.apiUrl}
                    onChange={(e) => handleChange('apiUrl', e.target.value)}
                    placeholder="http://localhost:8000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono shrink-0 transition-colors"
                  >
                    Test Ping
                  </button>
                </div>
                {testStatus === 'testing' && (
                  <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                    Pinging endpoint...
                  </span>
                )}
                {testStatus === 'success' && (
                  <span className="text-[11px] font-mono text-emerald-400 mt-1 block">
                    Connected! Backend API responded with 200 OK.
                  </span>
                )}
                {testStatus === 'failed' && (
                  <span className="text-[11px] font-mono text-amber-400 mt-1 block">
                    Endpoint unavailable. Seamlessly running in simulated DEMO MODE.
                  </span>
                )}
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Data Provider Mode
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="useMockData"
                      checked={formData.useMockData === true}
                      onChange={() => handleChange('useMockData', true)}
                      className="accent-emerald-500"
                    />
                    <span>Demo Mode (Mock Simulation)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="useMockData"
                      checked={formData.useMockData === false}
                      onChange={() => handleChange('useMockData', false)}
                      className="accent-emerald-500"
                    />
                    <span>Live Backend Stream</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Cowrie & Docker Ingestion Status */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                Honeypot Decoy Service Configuration
              </h3>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                Docker Containers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Cowrie SSH Log Path (Ubuntu Server Host)
                </label>
                <input
                  type="text"
                  value={formData.cowrieLogPath}
                  onChange={(e) => handleChange('cowrieLogPath', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Docker Daemon Socket / Host
                </label>
                <input
                  type="text"
                  value={formData.dockerSocket}
                  onChange={(e) => handleChange('dockerSocket', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Cowrie SSH Decoy Container:</span>
                <span className="text-emerald-400">Ready for Volume Mount</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Fake Web Server (Nginx / PHP Decoy):</span>
                <span className="text-emerald-400">Ready for Volume Mount</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Fake Database Service (MySQL Decoy):</span>
                <span className="text-emerald-400">Ready for Volume Mount</span>
              </div>
            </div>
          </div>

          {/* Section 3: AI Engine & Alert Thresholds */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-purple-400" />
                AI Threat Classification Engine Thresholds
              </h3>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded">
                ML Heuristic Model
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Alert Severity Threshold Score ({formData.alertThreshold}/100)
                </label>
                <input
                  type="range"
                  min={40}
                  max={95}
                  value={formData.alertThreshold}
                  onChange={(e) => handleChange('alertThreshold', Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] font-mono text-slate-500 mt-1 block">
                  Events scoring above {formData.alertThreshold} trigger critical SOC sound alerts.
                </span>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1.5">
                  Telemetry Stream Refresh Rate (ms)
                </label>
                <select
                  value={formData.refreshInterval}
                  onChange={(e) => handleChange('refreshInterval', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value={1000}>1,000 ms (1 second)</option>
                  <option value={3000}>3,000 ms (3 seconds)</option>
                  <option value={5000}>5,000 ms (5 seconds)</option>
                  <option value={10000}>10,000 ms (10 seconds)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              <Save className="h-4 w-4" /> Save Integration Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
