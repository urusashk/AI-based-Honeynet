import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Activity,
  BrainCircuit,
  Skull,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Radio,
  Play,
  Square,
  Server
} from 'lucide-react';
import { useHoneynet } from '../context/HoneynetContext';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isDemoStreaming, setIsDemoStreaming, honeypots } = useHoneynet();

  const navItems = [
    { name: 'Dashboard Overview', path: '/', icon: LayoutDashboard },
    { name: 'Honeynet Monitoring', path: '/honeynet', icon: Network },
    { name: 'Live Attack Stream', path: '/live-attacks', icon: Activity },
    { name: 'AI Threat Analysis', path: '/ai-analysis', icon: BrainCircuit },
    { name: 'Attackers Profile', path: '/attackers', icon: Skull },
    { name: 'Reports & Export', path: '/reports', icon: FileText },
    { name: 'Settings & Integrations', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800 bg-slate-900/90 backdrop-blur-md transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Branding Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-100 text-sm whitespace-nowrap">
                AI HONEYNET SOC
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 font-medium">
                Decoy Defense Mesh
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Demo Simulation Bar */}
      <div className="px-3 pt-4 pb-2">
        <div
          className={`rounded-xl border p-2.5 transition-all ${
            isDemoStreaming
              ? 'border-emerald-500/40 bg-emerald-950/20 shadow-sm shadow-emerald-900/20'
              : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          {!collapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Radio
                    className={`h-3.5 w-3.5 ${
                      isDemoStreaming ? 'text-emerald-400 animate-ping' : 'text-slate-500'
                    }`}
                  />
                  Live Stream Simulator
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                    isDemoStreaming
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDemoStreaming ? 'STREAMING' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Emulates Kali Linux attacks & Cowrie log ingestion.
              </p>
              <button
                onClick={() => setIsDemoStreaming(!isDemoStreaming)}
                className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                  isDemoStreaming
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
                }`}
              >
                {isDemoStreaming ? (
                  <>
                    <Square className="h-3 w-3 fill-current" /> Pause Demo Stream
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" /> Start Demo Stream
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDemoStreaming(!isDemoStreaming)}
              className={`flex h-9 w-full items-center justify-center rounded-lg ${
                isDemoStreaming ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500 text-slate-950'
              }`}
              title={isDemoStreaming ? 'Pause Demo Stream' : 'Start Demo Stream'}
            >
              {isDemoStreaming ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 px-3 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {!collapsed && (
                <span className="truncate tracking-wide">{item.name}</span>
              )}
              {!collapsed && isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Honeynet Nodes Mini Status */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider flex items-center gap-1.5">
              <Server className="h-3 w-3 text-slate-400" /> Decoy Mesh
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">3/3 Online</span>
          </div>
          <div className="space-y-1.5">
            {honeypots.slice(0, 3).map((hp) => (
              <div key={hp.id} className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="truncate max-w-[130px]">{hp.name.split(' ')[0]}</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  :{hp.port}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        {!collapsed ? (
          <>
            <span>VM: Ubuntu Server 24.04</span>
            <span className="text-emerald-500/80 font-semibold">STANDBY</span>
          </>
        ) : (
          <span className="mx-auto text-[9px] text-emerald-400">VM</span>
        )}
      </div>
    </aside>
  );
}
