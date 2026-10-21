import React from 'react';
import {
  Bell,
  Search,
  Wifi,
  Cpu,
  Layers,
  Terminal,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useHoneynet } from '../context/HoneynetContext';

export default function Header({ title, subtitle }) {
  const { isDemoStreaming, settings, events } = useHoneynet();
  const criticalCount = events.filter((e) => e.severity === 'Critical').length;

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-md">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
          {title}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            HONEYNET (Cowrie &bull; Heralding &bull; Suricata)
          </span>
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-normal leading-none mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Controls & Status Chips */}
      <div className="flex items-center gap-3">
        {/* Environment Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-300">
          <Layers className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-slate-400">Decoys:</span>
          <span className="font-mono text-emerald-400 font-semibold">3 Docker Containers</span>
        </div>

        {/* AI Engine Status */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-300">
          <Cpu className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-400">AI Engine:</span>
          <span className="font-mono text-slate-200 font-medium">Heuristic & ML Pipeline</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Multi-Honeypot Live Ingestion */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 text-xs font-mono font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE INGESTION ACTIVE</span>
        </div>

        {/* Alert Notifications */}
        <div className="relative">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title={`${criticalCount} Critical alerts recorded`}
          >
            <Bell className="h-4 w-4" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {criticalCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
