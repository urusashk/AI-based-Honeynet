import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Activity,
  Radio,
  Clock,
  Layers,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Users,
  X,
  Lock,
  Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LiveAttacksPage() {
  const {
    events,
    totalEvents,
    failedLogins,
    successfulLogins,
    uniqueAttackers,
    setSelectedEventId
  } = useHoneynet();
  const navigate = useNavigate();

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [eventIdFilter, setEventIdFilter] = useState('All');
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false); // default: newest first
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected event for details drawer
  const [activeSession, setActiveSession] = useState(null);

  // Filtered & Sorted Events (newest first by default)
  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((evt) => {
        if (eventIdFilter !== 'All') {
          if (eventIdFilter === 'failed' && !(evt.eventid || '').includes('login.failed')) return false;
          if (eventIdFilter === 'success' && !(evt.eventid || '').includes('login.success')) return false;
          if (eventIdFilter === 'command' && !(evt.eventid || '').includes('command') && !evt.input) return false;
        }

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matches =
            (evt.timestamp || '').toLowerCase().includes(q) ||
            (evt.src_ip || evt.sourceIp || '').toLowerCase().includes(q) ||
            (evt.eventid || '').toLowerCase().includes(q) ||
            (evt.username || '').toLowerCase().includes(q) ||
            (evt.password || '').toLowerCase().includes(q) ||
            (evt.input || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = (a[sortField] || a.timestamp || '');
        const valB = (b[sortField] || b.timestamp || '');
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [events, eventIdFilter, searchQuery, sortField, sortAsc]);

  // Keep activeSession synced if not set or invalidated
  const currentActive = activeSession || filteredEvents[0] || null;

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
        title="Live Attacks Monitor"
        subtitle="Live Cowrie honeypot stream: real-time telemetry from http://localhost:3001/cowrie.json"
      />

      <div className="p-6 space-y-6">
        {/* Metric Summary Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <div className="rounded-xl border border-blue-500/30 bg-slate-900/60 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Total Events</span>
                <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                  {(totalEvents || events.length).toLocaleString()}
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">Streamed from /logs/cowrie.json</p>
          </div>

          {/* Failed Logins */}
          <div className="rounded-xl border border-red-500/30 bg-slate-900/60 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Failed Logins</span>
                <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
                  {failedLogins.toLocaleString()}
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <UserX className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">Brute force & auth rejections</p>
          </div>

          {/* Successful Logins */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Successful Logins</span>
                <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                  {successfulLogins.toLocaleString()}
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">Decoy shell sessions opened</p>
          </div>

          {/* Unique Attacker IPs */}
          <div className="rounded-xl border border-purple-500/30 bg-slate-900/60 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Unique Attacker IPs</span>
                <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
                  {uniqueAttackers.toLocaleString()}
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">Distinct ingress sources</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by timestamp, src_ip, eventid, username, password, or input..."
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

          <div className="md:col-span-4">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">Type:</span>
              <select
                value={eventIdFilter}
                onChange={(e) => {
                  setEventIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1 truncate font-mono"
              >
                <option value="All" className="bg-slate-900">All Events</option>
                <option value="failed" className="bg-slate-900 text-red-400">Failed Logins</option>
                <option value="success" className="bg-slate-900 text-amber-400">Successful Logins</option>
                <option value="command" className="bg-slate-900 text-emerald-400">Commands / Input</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Attacks Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Live Attacks Feed (Newest First)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Auto-refreshing every 3s
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-slate-200 whitespace-nowrap"
                    onClick={() => {
                      setSortField('timestamp');
                      setSortAsc(!sortAsc);
                    }}
                  >
                    <span className="flex items-center gap-1">
                      Timestamp <ArrowUpDown className="h-3 w-3" />
                    </span>
                  </th>
                  <th className="py-3 px-4 whitespace-nowrap">src_ip</th>
                  <th className="py-3 px-4 whitespace-nowrap">eventid</th>
                  <th className="py-3 px-4 whitespace-nowrap">username</th>
                  <th className="py-3 px-4 whitespace-nowrap">password</th>
                  <th className="py-3 px-4 whitespace-nowrap">input</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      {events.length === 0
                        ? 'Waiting for incoming Cowrie logs from http://localhost:3001/cowrie.json...'
                        : 'No events match the selected filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((evt, idx) => {
                    const eid = evt.eventid || '';
                    const isFailed = eid.includes('login.failed') || eid.includes('auth.failed');
                    const isSuccess = eid.includes('login.success') || eid.includes('auth.success');
                    const isCommand = eid.includes('command') || Boolean(evt.input);
                    const isSelected = currentActive?.id === evt.id;

                    return (
                      <tr
                        key={evt.id || idx}
                        onClick={() => handleRowClick(evt)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* timestamp */}
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {evt.timestamp || 'N/A'}
                        </td>

                        {/* src_ip */}
                        <td className="py-3 px-4 text-emerald-400 font-medium whitespace-nowrap">
                          {evt.src_ip || evt.sourceIp || '127.0.0.1'}
                        </td>

                        {/* eventid */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isCommand
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                : isFailed
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : isSuccess
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {evt.eventid || 'cowrie.event'}
                          </span>
                        </td>

                        {/* username */}
                        <td className="py-3 px-4 text-slate-200 whitespace-nowrap font-medium">
                          {evt.username ? (
                            <span className="text-slate-200">{evt.username}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* password */}
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {evt.password ? (
                            <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                              {evt.password}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* input */}
                        <td className="py-3 px-4 max-w-[260px] truncate" title={evt.input || ''}>
                          {evt.input ? (
                            <span className="text-amber-300 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {evt.input}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        {/* action */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeepAnalysis(evt.id);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium transition-colors"
                          >
                            Inspect
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
