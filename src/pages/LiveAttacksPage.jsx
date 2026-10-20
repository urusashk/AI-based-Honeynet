import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  Search,
  Filter,
  Play,
  Square,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Terminal,
  Activity,
  Radio,
  Clock,
  Layers,
  Info,
  ExternalLink,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LiveAttacksPage() {
  const {
    events,
    isDemoStreaming,
    setIsDemoStreaming,
    streamSpeed,
    setStreamSpeed,
    setSelectedEventId
  } = useHoneynet();
  const navigate = useNavigate();

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [attackTypeFilter, setAttackTypeFilter] = useState('All');
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected session for bottom/side detail drawer
  const [activeSession, setActiveSession] = useState(events[0]);

  // Unique Attack Types for Filter dropdown
  const attackTypes = ['All', 'SQL Injection', 'SSH Brute Force', 'Command Injection', 'SYN Port Sweep', 'Directory Traversal', 'DB Brute Force'];

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        if (severityFilter !== 'All' && evt.severity !== severityFilter) return false;
        if (attackTypeFilter !== 'All' && evt.attackType !== attackTypeFilter) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matches =
            evt.sourceIp.toLowerCase().includes(q) ||
            evt.destinationService.toLowerCase().includes(q) ||
            evt.attackType.toLowerCase().includes(q) ||
            (evt.usernameAttempted && evt.usernameAttempted.toLowerCase().includes(q)) ||
            evt.eventDetails.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'riskScore') {
          return sortAsc ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [events, severityFilter, attackTypeFilter, searchQuery, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (evt) => {
    setActiveSession(evt);
  };

  const handleDeepAnalysis = (id) => {
    setSelectedEventId(id);
    navigate('/ai-analysis');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Live Decoy Attack Ingestion Stream"
        subtitle="Real-time event capture across Cowrie SSH, Web honeypot, and Database services"
      />

      <div className="p-6 space-y-6">
        {/* Stream Control & Demo Simulator Bar */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-lg border ${
                isDemoStreaming
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-slate-800/60 text-slate-400'
              }`}
            >
              <Radio
                className={`h-5 w-5 ${isDemoStreaming ? 'animate-pulse text-emerald-400' : ''}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 text-sm">
                  Simulated Event Generator (Demo Mode)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  RFC 5737 RESERVED SUBNETS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates real-time inbound Kali Linux reconnaissance without generating actual network packets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Speed:</span>
              <select
                value={streamSpeed}
                onChange={(e) => setStreamSpeed(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-slate-700"
              >
                <option value={2000}>2s (Fast)</option>
                <option value={4000}>4s (Normal)</option>
                <option value={7000}>7s (Slow)</option>
              </select>
            </div>

            <button
              onClick={() => setIsDemoStreaming(!isDemoStreaming)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                isDemoStreaming
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              {isDemoStreaming ? (
                <>
                  <Square className="h-3.5 w-3.5 fill-current" /> Stop Generator
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" /> Start Generator
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search IP, vector, honeypot, username, or payload details..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1 font-mono"
              >
                <option value="All" className="bg-slate-900">All Levels</option>
                <option value="Critical" className="bg-slate-900 text-red-400">Critical (80-100)</option>
                <option value="High" className="bg-slate-900 text-orange-400">High (60-79)</option>
                <option value="Medium" className="bg-slate-900 text-amber-400">Medium (40-59)</option>
                <option value="Low" className="bg-slate-900 text-emerald-400">Low (0-39)</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">Vector:</span>
              <select
                value={attackTypeFilter}
                onChange={(e) => {
                  setAttackTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1 truncate font-mono"
              >
                {attackTypes.map((type) => (
                  <option key={type} value={type} className="bg-slate-900">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Attack Events Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-200"
                    onClick={() => {
                      setSortField('timestamp');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Timestamp <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Decoy Target</th>
                  <th className="py-3 px-4">Vector</th>
                  <th className="py-3 px-4">Payload / Auth Attempt</th>
                  <th className="py-3 px-4">Severity</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-200"
                    onClick={() => {
                      setSortField('riskScore');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Risk Score <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="py-3 px-4 text-right">Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No matching attack events found. Try adjusting filters or starting the demo generator.
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((evt) => {
                    const isCrit = evt.severity === 'Critical';
                    const isHigh = evt.severity === 'High';
                    const isMed = evt.severity === 'Medium';
                    const isSelected = activeSession?.id === evt.id;

                    return (
                      <tr
                        key={evt.id}
                        onClick={() => handleRowClick(evt)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {evt.timestamp}
                        </td>
                        <td className="py-3 px-4 text-emerald-400 font-medium whitespace-nowrap">
                          {evt.sourceIp}
                        </td>
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {evt.destinationService}
                        </td>
                        <td className="py-3 px-4 text-slate-200 whitespace-nowrap font-medium">
                          {evt.attackType}
                        </td>
                        <td className="py-3 px-4 text-slate-400 max-w-[220px] truncate" title={evt.usernameAttempted || evt.eventDetails}>
                          {evt.usernameAttempted && evt.usernameAttempted !== 'N/A'
                            ? evt.usernameAttempted
                            : evt.eventDetails}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isCrit
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : isHigh
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                : isMed
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {evt.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-100 whitespace-nowrap">
                          {evt.riskScore}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeepAnalysis(evt.id);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium transition-colors"
                          >
                            Analyze
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>
              Showing {paginatedEvents.length} of {filteredEvents.length} events
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 text-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Session Details Panel */}
        {activeSession && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Session Audit Trail: {activeSession.id}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activeSession.attackType}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Source: {activeSession.sourceIp} &rarr; Target: {activeSession.destinationService} (Port {activeSession.destinationPort})
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDeepAnalysis(activeSession.id)}
                className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1.5"
              >
                Open Full AI Threat Breakdown &rarr;
              </button>
            </div>

            {/* Sequence of Observed Actions Timeline */}
            <div>
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block mb-3">
                Sequence of Observed Adversary Actions:
              </span>
              <div className="space-y-2">
                {activeSession.sessionActions?.map((act, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
                  >
                    <span className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-bold">
                      {act.step}
                    </span>
                    <span className="text-slate-400 shrink-0">{act.time}</span>
                    <span className="text-slate-200">{act.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Payload / Event Details */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1 font-bold">
                Raw Ingress Payload / Telemetry Note:
              </span>
              <p className="text-emerald-400">{activeSession.eventDetails}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
