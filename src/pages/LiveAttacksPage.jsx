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
  Key,
  Flame,
  AlertOctagon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function LiveAttacksPage() {
  const {
    events,
    totalEvents,
    failedLogins,
    successfulLogins,
    uniqueAttackers,
    countsPerHoneypot = { cowrie: 0, heralding: 0, suricata: 0 },
    countsPerProtocol = {},
    alertsBySignature = [],
    setSelectedEventId
  } = useHoneynet();
  const navigate = useNavigate();

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [honeypotFilter, setHoneypotFilter] = useState('All'); // 'All' | 'cowrie' | 'heralding' | 'suricata'
  const [eventIdFilter, setEventIdFilter] = useState('All');
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false); // default: newest first
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Selected event for details drawer
  const [activeSession, setActiveSession] = useState(null);

  // Compute live alerts by signature chart data (from backend stats or live filtered/unfiltered events)
  const suricataChartData = useMemo(() => {
    if (alertsBySignature && alertsBySignature.length > 0) {
      return alertsBySignature.slice(0, 8);
    }
    // Fallback: derive dynamically from current events
    const sigMap = {};
    for (const e of events) {
      if (e.honeypot === 'suricata' || e.alert_signature) {
        const sig = e.alert_signature || 'Generic IDS Alert';
        sigMap[sig] = (sigMap[sig] || 0) + 1;
      }
    }
    return Object.entries(sigMap)
      .map(([signature, count]) => ({ signature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [alertsBySignature, events]);

  // Helper to reliably parse any honeypot timestamp (ISO 8601, SQL datetime, etc.) into epoch millis
  const parseTimestamp = (ts) => {
    if (!ts) return 0;
    let s = String(ts).trim();
    if (s.includes(' ') && !s.includes('T')) {
      s = s.replace(' ', 'T');
    }
    if (!s.endsWith('Z') && !/[+-]\d{2}/.test(s)) {
      s += 'Z';
    }
    const time = new Date(s).getTime();
    return isNaN(time) ? 0 : time;
  };

  // Filtered & Sorted Events (always newest ingestion at the first by default)
  const filteredEvents = useMemo(() => {
    return [...events]
      .filter((evt) => {
        // Honeypot filter
        if (honeypotFilter !== 'All') {
          const hp = (evt.honeypot || 'cowrie').toLowerCase();
          if (hp !== honeypotFilter.toLowerCase()) return false;
        }

        // Event type filter
        if (eventIdFilter !== 'All') {
          if (eventIdFilter === 'failed' && !(evt.eventid || '').includes('login.failed') && evt.eventid !== 'heralding.auth') return false;
          if (eventIdFilter === 'success' && !(evt.eventid || '').includes('login.success')) return false;
          if (eventIdFilter === 'command' && !(evt.eventid || '').includes('command') && !evt.input) return false;
          if (eventIdFilter === 'alert' && evt.honeypot !== 'suricata' && !evt.alert_signature) return false;
        }

        // Search filter
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matches =
            (evt.timestamp || '').toLowerCase().includes(q) ||
            (evt.honeypot || '').toLowerCase().includes(q) ||
            (evt.protocol || '').toLowerCase().includes(q) ||
            (evt.src_ip || evt.sourceIp || '').toLowerCase().includes(q) ||
            (evt.dest_ip || '').toLowerCase().includes(q) ||
            (evt.alert_signature || '').toLowerCase().includes(q) ||
            (evt.eventid || '').toLowerCase().includes(q) ||
            (evt.username || '').toLowerCase().includes(q) ||
            (evt.password || '').toLowerCase().includes(q) ||
            (evt.input || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'timestamp' || sortField === 'ingestion') {
          // Primary sort: ingestion ID (newest ingestion at top by default)
          const idA = a.db_id || (typeof a.id === 'number' ? a.id : parseInt(String(a.id).replace(/\D/g, ''), 10)) || 0;
          const idB = b.db_id || (typeof b.id === 'number' ? b.id : parseInt(String(b.id).replace(/\D/g, ''), 10)) || 0;
          if (idA !== idB) {
            return sortAsc ? idA - idB : idB - idA;
          }

          // Secondary sort: normalized timestamp
          const timeA = parseTimestamp(a.timestamp);
          const timeB = parseTimestamp(b.timestamp);
          if (timeA !== timeB) {
            return sortAsc ? timeA - timeB : timeB - timeA;
          }
          return 0;
        }

        const valA = a[sortField] || '';
        const valB = b[sortField] || '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
  }, [events, honeypotFilter, eventIdFilter, searchQuery, sortField, sortAsc]);

  // Keep activeEvent synced if not set or invalidated
  const currentActive = activeSession || filteredEvents[0] || null;

  // Find all events belonging to the current active session, ordered chronologically (oldest first)
  const sessionTimelineEvents = useMemo(() => {
    if (!currentActive) return [];
    const sessId = currentActive.session;
    if (sessId) {
      return [...events]
        .filter((e) => e.session === sessId)
        .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
    }
    return [currentActive];
  }, [events, currentActive]);

  // Extract client version and key exchange info from raw_json across the session
  const sessionMetadata = useMemo(() => {
    let clientVersion = null;
    let kexAlgs = null;
    let encAlgs = null;
    let macAlgs = null;

    for (const evt of sessionTimelineEvents) {
      if (!evt.raw_json) continue;
      try {
        const parsed = JSON.parse(evt.raw_json);
        if (parsed.eventid === 'cowrie.client.version' || parsed.version) {
          clientVersion = parsed.version || parsed.message;
        }
        if (parsed.eventid === 'cowrie.client.kex' || parsed.kexAlgs) {
          kexAlgs = parsed.kexAlgs;
          encAlgs = parsed.encCS || parsed.encAlgs;
          macAlgs = parsed.macCS || parsed.macAlgs;
        }
      } catch {}
    }

    return { clientVersion, kexAlgs, encAlgs, macAlgs };
  }, [sessionTimelineEvents]);

  // Helper to format Cowrie & Heralding event actions according to exact type
  const renderEventAction = (evt) => {
    const eid = evt.eventid || '';
    const hp = (evt.honeypot || '').toLowerCase();
    if (hp === 'suricata' || eid.startsWith('suricata.')) {
      return (
        <span className="text-red-400 font-semibold">
          [Suricata IDS Alert] &rarr; <span className="font-bold text-red-300">{evt.alert_signature || evt.message || 'Signature Match'}</span> (Sev: {evt.alert_severity || 3}, Target: {evt.dest_ip || 'honeynet'}:{evt.dest_port || 'any'})
        </span>
      );
    }

    if (hp === 'heralding' || eid === 'heralding.auth') {
      const proto = (evt.protocol || evt.proto || 'auth').toUpperCase();
      return (
        <span className="text-amber-300">
          Heralding [{proto}] &rarr; User: <span className="font-bold text-slate-100">"{evt.username || 'N/A'}"</span> | Pass: <span className="font-bold text-slate-100">"{evt.password || 'N/A'}"</span> on port {evt.src_port || 'N/A'}
        </span>
      );
    }

    if (eid === 'cowrie.login.failed' || eid.includes('login.failed') || eid.includes('auth.failed')) {
      return (
        <span className="text-red-400">
          Login Failed &rarr; Username: <span className="font-bold text-slate-100">"{evt.username || 'N/A'}"</span> | Password: <span className="font-bold text-slate-100">"{evt.password || 'N/A'}"</span>
        </span>
      );
    }

    if (eid === 'cowrie.login.success' || eid.includes('login.success') || eid.includes('auth.success')) {
      return (
        <span className="text-emerald-400 font-semibold">
          Login Successful &rarr; Username: <span className="font-bold text-slate-100">"{evt.username || 'N/A'}"</span> | Password: <span className="font-bold text-slate-100">"{evt.password || 'N/A'}"</span>
        </span>
      );
    }

    if (eid === 'cowrie.command.input' || eid.includes('command') || evt.input) {
      return (
        <span className="text-amber-300">
          Command Executed: <span className="bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-200 font-bold">{evt.input || 'N/A'}</span>
        </span>
      );
    }

    if (eid === 'cowrie.session.connect' || eid.includes('connect')) {
      return (
        <span className="text-blue-300">
          Inbound Connection &rarr; Source: <span className="font-bold text-slate-100">{evt.src_ip || 'unknown'}</span>:{evt.src_port || 'unknown'}
        </span>
      );
    }

    if (eid === 'cowrie.session.closed' || eid.includes('closed')) {
      return (
        <span className="text-slate-400">
          Session Closed &rarr; Duration: <span className="font-bold text-slate-200">{evt.duration !== null && evt.duration !== undefined ? `${evt.duration}s` : 'N/A'}</span>
        </span>
      );
    }

    return (
      <span className="text-slate-300">
        {evt.message || eid}
      </span>
    );
  };

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

  const cowrieCount = countsPerHoneypot?.cowrie || 0;
  const heraldingCount = countsPerHoneypot?.heralding || 0;
  const suricataCount = countsPerHoneypot?.suricata || 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Live Attacks Monitor"
        subtitle="Multi-Source Ingestion: Cowrie (SSH/Telnet), Heralding (Multi-Protocol Auth) & Suricata (IDS Alerts)"
      />

      <div className="p-6 space-y-6">
        {/* Metric Summary Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Events */}
          <div className="rounded-xl border border-blue-500/30 bg-slate-900/60 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Total Ingested Events</span>
                <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                  {(totalEvents || events.length).toLocaleString()}
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">SQLite backed from /api/events</p>
          </div>

          {/* Failed Logins */}
          <div className="rounded-xl border border-red-500/30 bg-slate-900/60 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Failed / Probed Logins</span>
                <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
                  {failedLogins.toLocaleString()}
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <UserX className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">Brute force & cleartext probes</p>
          </div>

          {/* Successful Logins */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-4 backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase tracking-wider block">Successful Decoy Logins</span>
                <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                  {successfulLogins.toLocaleString()}
                </span>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">Sessions permitted by honeypots</p>
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
            <p className="text-[11px] text-slate-400 mt-2 font-mono">Cowrie, Heralding & Suricata</p>
          </div>
        </div>

        {/* Honeypot & Protocol Breakdown Chips */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Honeypot Counts */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Honeypots / Sources:</span>
            <button
              onClick={() => {
                setHoneypotFilter('All');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                honeypotFilter === 'All'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Sources ({totalEvents})
            </button>
            <button
              onClick={() => {
                setHoneypotFilter('cowrie');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border flex items-center gap-1.5 ${
                honeypotFilter === 'cowrie'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Cowrie ({cowrieCount})
            </button>
            <button
              onClick={() => {
                setHoneypotFilter('heralding');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border flex items-center gap-1.5 ${
                honeypotFilter === 'heralding'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Heralding ({heraldingCount})
            </button>
            <button
              onClick={() => {
                setHoneypotFilter('suricata');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border flex items-center gap-1.5 ${
                honeypotFilter === 'suricata'
                  ? 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Suricata IDS ({suricataCount})
            </button>
          </div>

          {/* Protocol Breakdown Badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-slate-500 text-[11px] uppercase tracking-wider font-bold">Protocols:</span>
            {Object.keys(countsPerProtocol).length === 0 ? (
              <span className="text-slate-500 text-xs">Awaiting traffic...</span>
            ) : (
              Object.entries(countsPerProtocol).map(([proto, count]) => (
                <span
                  key={proto}
                  className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 text-[11px]"
                >
                  <span className="text-emerald-400 font-bold uppercase">{proto}</span>: {count}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by timestamp, honeypot, protocol, src_ip, dest_ip, signature, eventid..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 font-mono"
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
              <span className="text-[11px] text-slate-400 font-mono">Source:</span>
              <select
                value={honeypotFilter}
                onChange={(e) => {
                  setHoneypotFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1 truncate font-mono"
              >
                <option value="All" className="bg-slate-900">All Sources</option>
                <option value="cowrie" className="bg-slate-900 text-blue-400">Cowrie</option>
                <option value="heralding" className="bg-slate-900 text-amber-400">Heralding</option>
                <option value="suricata" className="bg-slate-900 text-red-400">Suricata IDS</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400 font-mono">Type:</span>
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
                <option value="alert" className="bg-slate-900 text-purple-400">Suricata Alerts</option>
              </select>
            </div>
          </div>
        </div>

        {/* Suricata Alerts by Signature Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Suricata NIDS &bull; Alerts by Signature
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Live intrusion detection signatures triggered on honeynet decoys
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-bold">
                {suricataCount} Alerts Logged
              </span>
              <button
                onClick={() => {
                  setHoneypotFilter('suricata');
                  setCurrentPage(1);
                }}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-mono"
              >
                Filter Suricata &rarr;
              </button>
            </div>
          </div>

          {suricataChartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting Suricata IDS alert signatures from http://localhost:3003/eve.json...
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={suricataChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="signature"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    width={240}
                    tickFormatter={(val) => (val && val.length > 32 ? `${val.substring(0, 32)}...` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                      fontFamily: 'monospace'
                    }}
                    formatter={(val) => [`${val} alerts`, 'Count']}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    fill="#ef4444"
                  >
                    {suricataChartData.map((_, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={idx === 0 ? '#ef4444' : idx === 1 ? '#f97316' : '#eab308'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Live Attacks Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Live Ingress Stream (Cowrie, Heralding & Suricata)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Auto-refreshing every 3s &bull; Filter: <span className="text-emerald-400 font-bold uppercase">{honeypotFilter}</span>
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
                  <th className="py-3 px-4 whitespace-nowrap">Honeypot / Source</th>
                  <th className="py-3 px-4 whitespace-nowrap">Severity</th>
                  <th className="py-3 px-4 whitespace-nowrap">Protocol</th>
                  <th className="py-3 px-4 whitespace-nowrap">src_ip</th>
                  <th className="py-3 px-4 whitespace-nowrap">dest_ip</th>
                  <th className="py-3 px-4 whitespace-nowrap">eventid / signature</th>
                  <th className="py-3 px-4 whitespace-nowrap">username</th>
                  <th className="py-3 px-4 whitespace-nowrap">password</th>
                  <th className="py-3 px-4 whitespace-nowrap">input / details</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      {events.length === 0
                        ? 'Waiting for incoming Cowrie, Heralding & Suricata logs from http://localhost:4000/api/events...'
                        : 'No events match the selected filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((evt, idx) => {
                    const eid = evt.eventid || '';
                    const hp = (evt.honeypot || 'cowrie').toLowerCase();
                    const proto = (evt.protocol || evt.proto || 'ssh').toLowerCase();
                    const isSuricata = hp === 'suricata' || eid.startsWith('suricata.');
                    const isHeralding = hp === 'heralding' || eid === 'heralding.auth';
                    const isFailed = eid.includes('login.failed') || eid.includes('auth.failed') || isHeralding;
                    const isSuccess = eid.includes('login.success') || eid.includes('auth.success');
                    const isCommand = eid.includes('command') || Boolean(evt.input);
                    const isSelected = currentActive?.id === evt.id;

                    // Severity classification for Suricata & honeypots
                    let sevLabel = evt.severity || 'Medium';
                    let sevBadgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                    if (isSuricata) {
                      if (evt.alert_severity === 1 || evt.severity === 'Critical') {
                        sevLabel = 'Critical';
                        sevBadgeColor = 'bg-red-500/20 text-red-300 border-red-500/40 font-bold';
                      } else if (evt.alert_severity === 2 || evt.severity === 'High') {
                        sevLabel = 'High';
                        sevBadgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold';
                      } else if (evt.alert_severity === 3 || evt.severity === 'Medium') {
                        sevLabel = 'Medium';
                        sevBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                      } else {
                        sevLabel = 'Low';
                        sevBadgeColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
                      }
                    } else if (isCommand || isSuccess) {
                      sevLabel = 'Critical';
                      sevBadgeColor = 'bg-purple-500/15 text-purple-300 border-purple-500/40 font-bold';
                    } else if (isFailed) {
                      sevLabel = 'High';
                      sevBadgeColor = 'bg-red-500/15 text-red-400 border-red-500/30';
                    } else {
                      sevLabel = 'Low';
                      sevBadgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                    }

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

                        {/* honeypot badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              isSuricata
                                ? 'bg-red-500/15 text-red-300 border border-red-500/40'
                                : isHeralding
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {hp}
                          </span>
                        </td>

                        {/* severity badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${sevBadgeColor}`}>
                            {isSuricata && evt.alert_severity ? `Sev ${evt.alert_severity} • ` : ''}{sevLabel}
                          </span>
                        </td>

                        {/* protocol badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-bold uppercase">
                            {proto}
                          </span>
                        </td>

                        {/* src_ip */}
                        <td className="py-3 px-4 text-emerald-400 font-medium whitespace-nowrap">
                          {evt.src_ip || evt.sourceIp || '127.0.0.1'}
                          {evt.src_port ? <span className="text-slate-500 text-[11px]">:{evt.src_port}</span> : ''}
                        </td>

                        {/* dest_ip */}
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {evt.dest_ip ? (
                            <span>
                              {evt.dest_ip}
                              {evt.dest_port ? <span className="text-slate-500 text-[11px]">:{evt.dest_port}</span> : ''}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* eventid / signature */}
                        <td className="py-3 px-4 whitespace-nowrap max-w-[200px] truncate" title={evt.alert_signature || evt.eventid || ''}>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold truncate ${
                              isSuricata
                                ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                                : isHeralding
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : isCommand
                                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                : isFailed
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : isSuccess
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {evt.alert_signature || evt.eventid || 'cowrie.event'}
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

                        {/* input / details */}
                        <td className="py-3 px-4 max-w-[220px] truncate" title={evt.alert_signature || evt.input || evt.message || ''}>
                          {evt.alert_signature ? (
                            <span className="text-red-300 font-medium bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 inline-flex items-center gap-1.5">
                              <span>{evt.alert_signature}</span>
                              {evt.alert_count > 1 && (
                                <span className="bg-red-500/30 text-red-200 text-[10px] px-1 rounded font-bold">
                                  {evt.alert_count}x
                                </span>
                              )}
                            </span>
                          ) : evt.input ? (
                            <span className="text-amber-300 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {evt.input}
                            </span>
                          ) : evt.message ? (
                            <span className="text-slate-400 text-[11px] truncate">{evt.message}</span>
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

        {/* Selected Session Audit Trail Panel */}
        {currentActive && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Terminal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Session Audit Trail
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                      Session: {currentActive.session || 'N/A'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {sessionTimelineEvents.length} Events in Session
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Attacker IP: <span className="text-emerald-400 font-semibold">{currentActive.src_ip || currentActive.sourceIp}</span>
                    {currentActive.src_port ? ` (Port ${currentActive.src_port})` : ''} &bull; Target: Cowrie SSH Honeypot
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDeepAnalysis(currentActive.id)}
                className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1.5"
              >
                Open Full AI Threat Breakdown &rarr;
              </button>
            </div>

            {/* Sequence of Observed Actions Timeline (In Time Order) */}
            <div>
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block mb-3">
                Full Session Event Timeline (Chronological Order):
              </span>
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {sessionTimelineEvents.map((evt, index) => {
                  const eid = evt.eventid || '';
                  const timeStr = evt.timestamp ? evt.timestamp.replace('T', ' ').substring(11, 19) : '00:00:00';

                  return (
                    <div
                      key={evt.id || index}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
                    >
                      <span className="h-5 w-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 shrink-0 font-bold">
                        {index + 1}
                      </span>
                      <span className="text-slate-400 shrink-0 font-mono text-[11px]">{timeStr}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 shrink-0">
                        {eid}
                      </span>
                      <div className="text-slate-200 flex-1 leading-relaxed">
                        {renderEventAction(evt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw Ingress Payload, Client Version & Key Exchange Details */}
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                Raw Ingress Payload & Handshake Metadata:
              </span>

              {/* Client Version & Key Exchange Info */}
              {(sessionMetadata.clientVersion || sessionMetadata.kexAlgs) && (
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 space-y-1 text-[11px]">
                  {sessionMetadata.clientVersion && (
                    <div>
                      <span className="text-slate-400 font-semibold">cowrie.client.version: </span>
                      <span className="text-purple-300 font-bold">{sessionMetadata.clientVersion}</span>
                    </div>
                  )}
                  {sessionMetadata.kexAlgs && (
                    <div>
                      <span className="text-slate-400 font-semibold">Key Exchange Algorithms (KEX): </span>
                      <span className="text-slate-300">{Array.isArray(sessionMetadata.kexAlgs) ? sessionMetadata.kexAlgs.join(', ') : sessionMetadata.kexAlgs}</span>
                    </div>
                  )}
                  {sessionMetadata.encAlgs && (
                    <div>
                      <span className="text-slate-400 font-semibold">Ciphers / Encryption: </span>
                      <span className="text-slate-300">{Array.isArray(sessionMetadata.encAlgs) ? sessionMetadata.encAlgs.join(', ') : sessionMetadata.encAlgs}</span>
                    </div>
                  )}
                  {sessionMetadata.macAlgs && (
                    <div>
                      <span className="text-slate-400 font-semibold">MAC Algorithms: </span>
                      <span className="text-slate-300">{Array.isArray(sessionMetadata.macAlgs) ? sessionMetadata.macAlgs.join(', ') : sessionMetadata.macAlgs}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Exact raw_json from the selected event */}
              <div className="overflow-x-auto">
                <span className="text-[10px] text-slate-500 block mb-1">Selected Event Raw JSON:</span>
                <pre className="text-emerald-400 text-[11px] whitespace-pre-wrap break-all bg-slate-950 p-2 rounded border border-slate-900">
                  {currentActive.raw_json || JSON.stringify({
                    timestamp: currentActive.timestamp,
                    session: currentActive.session,
                    eventid: currentActive.eventid,
                    src_ip: currentActive.src_ip,
                    src_port: currentActive.src_port,
                    username: currentActive.username,
                    password: currentActive.password,
                    input: currentActive.input,
                    duration: currentActive.duration,
                    message: currentActive.message
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
