import React, { useState } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  Skull,
  Search,
  ExternalLink,
  ShieldAlert,
  Clock,
  Crosshair,
  Server,
  Layers,
  Terminal,
  Activity,
  History,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AttackersPage() {
  const { attackers, events, setSelectedEventId } = useHoneynet();
  const [selectedAttacker, setSelectedAttacker] = useState(attackers[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredAttackers = attackers.filter((atk) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      atk.ip.toLowerCase().includes(q) ||
      atk.label.toLowerCase().includes(q) ||
      atk.mostTargetedService.toLowerCase().includes(q) ||
      atk.mostFrequentAttackType.toLowerCase().includes(q)
    );
  });

  // History timeline events for the selected attacker
  const attackerEvents = events.filter((e) => e.sourceIp === selectedAttacker.ip);

  const handleInspectEvent = (eventId) => {
    setSelectedEventId(eventId);
    navigate('/ai-analysis');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Simulated Adversary Profiles & Recon Dossier"
        subtitle="Forensic attribution, tool fingerprints, and target correlation using RFC 5737 demo IPs"
      />

      <div className="p-6 space-y-6">
        {/* Search & Notice Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search attacker IP, tool, or target service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <span className="text-xs font-mono text-slate-400">
            {filteredAttackers.length} Simulated Actors Identified
          </span>
        </div>

        {/* Main Grid: Attacker Cards & Detail Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Attacker List Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredAttackers.map((atk) => {
              const isSelected = selectedAttacker.ip === atk.ip;
              return (
                <div
                  key={atk.ip}
                  onClick={() => setSelectedAttacker(atk)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-slate-800 text-red-400 border border-slate-700">
                        <Skull className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-100">{atk.label}</h3>
                        <span className="text-xs font-mono text-emerald-400 font-medium">
                          {atk.ip}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-slate-100">
                        {atk.riskScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">RISK</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2.5">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Target:</span>
                      <span className="text-slate-300 truncate block">{atk.mostTargetedService}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Vector:</span>
                      <span className="text-slate-300 truncate block">{atk.mostFrequentAttackType}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dossier & Timeline (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Attacker Profile Header Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Forensic Actor Dossier
                  </span>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    {selectedAttacker.label}
                  </h2>
                  <p className="text-xs font-mono text-emerald-400 mt-0.5">
                    {selectedAttacker.ip} &bull; {selectedAttacker.origin}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-500/10 text-red-400 border border-red-500/30">
                    Risk {selectedAttacker.riskScore}/100
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Total Events</span>
                  <span className="font-bold text-slate-200 text-sm mt-0.5 block">
                    {selectedAttacker.totalEvents}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">First Seen</span>
                  <span className="font-medium text-slate-300 text-[11px] mt-0.5 block truncate">
                    {selectedAttacker.firstSeen.split(' ')[1]}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Last Seen</span>
                  <span className="font-medium text-slate-300 text-[11px] mt-0.5 block truncate">
                    {selectedAttacker.lastSeen.split(' ')[1]}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Reputation</span>
                  <span className="font-bold text-amber-400 text-[11px] mt-0.5 block truncate">
                    {selectedAttacker.reputation}
                  </span>
                </div>
              </div>

              {/* Fingerprint & Detected Tools */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-500 font-mono shrink-0">OS Fingerprint:</span>
                  <span className="font-mono text-slate-200">{selectedAttacker.osFingerprint}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-slate-500 font-mono text-xs mr-1">Tools Fingerprinted:</span>
                  {selectedAttacker.toolsDetected.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Attack Timeline & History */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <History className="h-4 w-4 text-emerald-400" />
                  Observed Event History Timeline
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {attackerEvents.length} Recent Logged Probes
                </span>
              </div>

              <div className="space-y-2.5">
                {attackerEvents.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500 font-mono">
                    No recent events captured in memory buffer for this host.
                  </p>
                ) : (
                  attackerEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => handleInspectEvent(evt.id)}
                      className="cursor-pointer p-3 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="font-bold text-slate-200">{evt.id}</span>
                          <span className="text-slate-500">&bull;</span>
                          <span className="text-slate-400">{evt.timestamp}</span>
                          <span className="text-slate-500">&bull;</span>
                          <span className="text-slate-300 font-medium">{evt.attackType}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-md">
                          {evt.eventDetails}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {evt.riskScore}
                        </span>
                        <span className="text-xs text-emerald-400 font-semibold hover:underline">
                          Triage &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
