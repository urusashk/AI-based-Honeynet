import React, { useState } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  Skull,
  Search,
  ShieldAlert,
  Clock,
  Crosshair,
  Server,
  Layers,
  Terminal,
  Activity,
  History,
  X,
  AlertTriangle,
  BrainCircuit,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AttackersPage() {
  const { attackers = [], threats = [], events = [], setSelectedEventId } = useHoneynet();
  const [selectedIp, setSelectedIp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Combine attacker summary with live threat data
  const attackerProfiles = attackers.map((atk) => {
    const ipThreats = threats.filter((t) => t.src_ip === atk.ip);
    const maxScore = ipThreats.length > 0 ? Math.max(...ipThreats.map((t) => t.ruleScore)) : (atk.maxScore || 20);
    const maxAnomaly = ipThreats.length > 0 ? Math.max(...ipThreats.map((t) => t.anomalyScore)) : (atk.maxAnomaly || 0.4);
    const threatLevel = highestThreat?.threatLevel || (maxScore >= 81 ? 'Critical' : maxScore >= 61 ? 'High' : maxScore >= 31 ? 'Medium' : 'Low');
    const isHighRisk = threatLevel === 'Critical' || threatLevel === 'High' || maxScore >= 61;

    return {
      ...atk,
      maxScore,
      maxAnomaly: parseFloat(maxAnomaly.toFixed(3)),
      threatLevel,
      isHighRisk,
      attackType: highestThreat?.attackType || atk.attackTypes?.[0] || 'Reconnaissance / Probe',
      suspiciousCommands: Array.from(new Set(ipThreats.flatMap((t) => t.suspiciousCommands || [])))
    };
  });

  const filteredAttackers = attackerProfiles.filter((atk) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      atk.ip.toLowerCase().includes(q) ||
      (atk.attackType && atk.attackType.toLowerCase().includes(q))
    );
  });

  // Current selected attacker
  const selectedAttacker = filteredAttackers.find((a) => a.ip === selectedIp) || filteredAttackers[0] || null;

  // History timeline events for the selected attacker
  const attackerEvents = selectedAttacker ? events.filter((e) => e.src_ip === selectedAttacker.ip) : [];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Adversary Profiles & Threat Intelligence"
        subtitle="Forensic attribution, attack type classification, and Isolation Forest anomaly scoring from live honeynet telemetry"
      />

      <div className="p-6 space-y-6">
        {/* Search & Notice Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search attacker IP or attack classification..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <span className="text-xs font-mono text-slate-400">
            {filteredAttackers.length} Live Ingress Adversaries Identified
          </span>
        </div>

        {filteredAttackers.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400 font-mono text-xs">
            Awaiting attacker records from /api/threats...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Attacker List Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {filteredAttackers.map((atk) => {
                const isSelected = selectedAttacker?.ip === atk.ip;
                return (
                  <div
                    key={atk.ip}
                    onClick={() => setSelectedIp(atk.ip)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md border ${
                          atk.isHighRisk
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          <Skull className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-emerald-400 font-mono">{atk.ip}</h3>
                            {atk.isHighRisk && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-600 text-white font-mono animate-pulse">
                                HIGH RISK
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-300 font-medium">
                            {atk.attackType}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-slate-100">
                          {atk.maxScore}/100
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block">THREAT SCORE</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2.5">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Threat Level:</span>
                        <span className={`font-bold block ${
                          atk.threatLevel === 'Critical' ? 'text-red-400' : atk.threatLevel === 'High' ? 'text-orange-400' : 'text-slate-200'
                        }`}>{atk.threatLevel}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Isolation Forest:</span>
                        <span className="text-purple-400 font-bold block">{Math.round(atk.maxAnomaly * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Sessions:</span>
                        <span className="text-slate-300 font-bold block">{atk.sessionsCount || 1}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dossier & Timeline (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedAttacker && (
                <>
                  {/* Attacker Profile Header Card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                          Adversary Forensic Dossier
                        </span>
                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                          <span className="font-mono text-emerald-400">{selectedAttacker.ip}</span>
                        </h2>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">
                          Evaluated Attack Type: <span className="text-amber-300 font-semibold">{selectedAttacker.attackType}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedAttacker.isHighRisk ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-600 text-white shadow-sm shadow-red-500/30 animate-pulse flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5" /> HIGH-RISK ATTACKER
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            Risk {selectedAttacker.maxScore}/100
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Total Log Events</span>
                        <span className="font-bold text-slate-200 text-sm mt-0.5 block">
                          {selectedAttacker.totalEvents}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Threat Score</span>
                        <span className="font-bold text-red-400 text-sm mt-0.5 block">
                          {selectedAttacker.maxScore}/100
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Isolation Forest</span>
                        <span className="font-bold text-purple-400 text-sm mt-0.5 block">
                          {Math.round(selectedAttacker.maxAnomaly * 100)}%
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Threat Level</span>
                        <span className={`font-bold text-sm mt-0.5 block ${
                          selectedAttacker.threatLevel === 'Critical' ? 'text-red-400' : 'text-orange-400'
                        }`}>
                          {selectedAttacker.threatLevel}
                        </span>
                      </div>
                    </div>

                    {/* Suspicious Commands Executed by this IP */}
                    {selectedAttacker.suspiciousCommands && selectedAttacker.suspiciousCommands.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-slate-400 font-mono text-xs block">
                          Suspicious Commands Logged:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedAttacker.suspiciousCommands.map((cmd, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-red-950/40 border border-red-500/30 font-mono text-[11px] text-red-300"
                            >
                              {cmd}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attack Timeline & History */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                        <History className="h-4 w-4 text-emerald-400" />
                        Captured Event Telemetry for {selectedAttacker.ip}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        {attackerEvents.length} Events Logged
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto">
                      {attackerEvents.length === 0 ? (
                        <p className="py-6 text-center text-xs text-slate-500 font-mono">
                          No logged events found in buffer for this host.
                        </p>
                      ) : (
                        attackerEvents.slice(0, 15).map((evt) => (
                          <div
                            key={evt.id}
                            className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{evt.id}</span>
                                <span className="text-slate-500">&bull;</span>
                                <span className="text-slate-400">{evt.timestamp}</span>
                                <span className="text-slate-500">&bull;</span>
                                <span className="text-emerald-400 font-semibold uppercase">{evt.honeypot}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 truncate max-w-md">
                                {evt.alert_signature || evt.input || evt.message || evt.eventid}
                              </p>
                            </div>

                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {evt.protocol?.toUpperCase() || 'TCP'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
