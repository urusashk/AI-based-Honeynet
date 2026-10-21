import React, { useState } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Fingerprint,
  Activity,
  Terminal,
  ShieldAlert,
  Flame,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIThreatAnalysisPage() {
  const { threats = [], highRiskCount = 0 } = useHoneynet();
  const [selectedSessionKey, setSelectedSessionKey] = useState(null);

  // Default to first threat session
  const currentThreat = threats.find((t) => `${t.src_ip}-${t.session}` === selectedSessionKey) || threats[0] || null;

  const isHighRisk = currentThreat && (currentThreat.threatLevel === 'Critical' || currentThreat.threatLevel === 'High');

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="AI Threat Classification & Triage"
        subtitle="Rule-based threat scoring (0-100), Isolation Forest anomaly detection, and automated attack classification"
      />

      <div className="p-6 space-y-6">
        {!currentThreat ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400 font-mono text-xs">
            Connecting to backend at /api/threats to retrieve evaluated session features...
          </div>
        ) : (
          <>
            {/* Session Selector Pill Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-mono text-slate-400 shrink-0">Evaluated Sessions:</span>
              {threats.slice(0, 10).map((t, idx) => {
                const key = `${t.src_ip}-${t.session}`;
                const isSelected = (!selectedSessionKey && idx === 0) || selectedSessionKey === key;
                const isCritOrHigh = t.threatLevel === 'Critical' || t.threatLevel === 'High';

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSessionKey(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {isCritOrHigh && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <span>{t.src_ip}</span>
                    <span className="text-[10px] text-slate-500">({t.session?.substring(0, 8) || 'session'})</span>
                  </button>
                );
              })}
            </div>

            {/* AI Scorecard & Classification Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Classification Card (8 cols) */}
              <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block mb-1">
                      Threat Classification
                    </span>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                      {currentThreat.attackType}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Attacker IP: <span className="text-emerald-400 font-semibold">{currentThreat.src_ip}</span> &bull; Session: <span className="text-slate-200">{currentThreat.session}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">Threat Level</span>
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold font-mono ${
                        currentThreat.threatLevel === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : currentThreat.threatLevel === 'High'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : currentThreat.threatLevel === 'Medium'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}
                    >
                      {currentThreat.threatLevel}
                    </span>
                  </div>
                </div>

                {/* Extracted Feature Vector Grid */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-purple-400" />
                    Extracted Behavioral Feature Vector
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Login Attempts</span>
                      <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                        {currentThreat.loginAttempts}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Failed-Login Ratio</span>
                      <span className="text-sm font-bold text-amber-400 mt-0.5 block">
                        {Math.round(currentThreat.failedLoginRatio * 100)}%
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Session Duration</span>
                      <span className="text-sm font-bold text-blue-400 mt-0.5 block">
                        {currentThreat.sessionDuration}s
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Commands Executed</span>
                      <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                        {currentThreat.commandCount}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Suspicious Commands</span>
                      <span className="text-sm font-bold text-red-400 mt-0.5 block">
                        {currentThreat.suspiciousCommandCount}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Distinct Ports Hit</span>
                      <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                        {currentThreat.distinctPortsCount}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Distinct Protocols</span>
                      <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                        {currentThreat.distinctProtocolsCount}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Suricata IDS Alerts</span>
                      <span className="text-sm font-bold text-red-400 mt-0.5 block">
                        {currentThreat.suricataAlertCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suspicious Commands Flagged */}
                {currentThreat.suspiciousCommands && currentThreat.suspiciousCommands.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      Suspicious Commands Triggered (wget, curl, chmod, passwd, nc)
                    </h3>
                    <div className="space-y-1.5">
                      {currentThreat.suspiciousCommands.map((cmd, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/20 border border-red-500/30 text-xs font-mono text-red-300"
                        >
                          <Terminal className="h-3.5 w-3.5 text-red-400 shrink-0" />
                          <span className="font-semibold">{cmd}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suricata Alert Signatures */}
                {currentThreat.alertSignatures && currentThreat.alertSignatures.length > 0 && (
                  <div>
                    <h3 className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-orange-400" />
                      Suricata IDS Signatures Matched
                    </h3>
                    <div className="space-y-1.5">
                      {currentThreat.alertSignatures.map((sig, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-orange-950/20 border border-orange-500/30 text-xs font-mono text-orange-300"
                        >
                          {sig}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Countermeasures (Tailored to Attack Type) */}
                <div>
                  <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Automated Defensive Recommendations ({currentThreat.attackType})
                  </h3>
                  <div className="space-y-2">
                    {(currentThreat.recommendations && currentThreat.recommendations.length > 0
                      ? currentThreat.recommendations
                      : [
                          `Block source IP ${currentThreat.src_ip} at perimeter firewall (iptables / UFW).`,
                          'Review honeypot service logs and verify container sandbox isolation.',
                          'Enforce rate limiting on targeted decoy ports.'
                        ]
                    ).map((rec, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk Gauge & Confidence Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Rule Threat Score Widget */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm text-center">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-4">
                    Rule-Based Threat Score
                  </span>

                  <div className="relative inline-flex items-center justify-center">
                    <div
                      className={`h-36 w-36 rounded-full border-4 flex flex-col items-center justify-center ${
                        currentThreat.ruleScore >= 81
                          ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                          : currentThreat.ruleScore >= 61
                          ? 'border-orange-500 bg-orange-500/10'
                          : currentThreat.ruleScore >= 31
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-emerald-500 bg-emerald-500/10'
                      }`}
                    >
                      <span className="text-4xl font-extrabold font-mono text-slate-100">
                        {currentThreat.ruleScore}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 uppercase">/ 100 max</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isHighRisk && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-red-600 text-white animate-pulse">
                        <AlertTriangle className="h-3.5 w-3.5" /> HIGH-RISK ATTACKER
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 font-mono space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Threat Level:</span>
                      <span className={`font-bold ${
                        currentThreat.threatLevel === 'Critical'
                          ? 'text-red-400'
                          : currentThreat.threatLevel === 'High'
                          ? 'text-orange-400'
                          : currentThreat.threatLevel === 'Medium'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        {currentThreat.threatLevel} ({
                          currentThreat.threatLevel === 'Critical' ? '81-100' :
                          currentThreat.threatLevel === 'High' ? '61-80' :
                          currentThreat.threatLevel === 'Medium' ? '31-60' : '0-30'
                        })
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dynamic Confidence:</span>
                      <span className="font-bold text-purple-400">
                        {Math.round((currentThreat.confidence || 0.85) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Isolation Forest Anomaly Score Widget */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-5 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-purple-300 font-bold flex items-center gap-1.5">
                      <BrainCircuit className="h-4 w-4 text-purple-400" /> Isolation Forest Model
                    </span>
                    <span className="text-[10px] font-mono bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/40">
                      Unsupervised ML
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/70 border border-purple-500/20 space-y-2 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Anomaly Score:</span>
                      <span className="text-purple-300 font-bold text-base">
                        {currentThreat.anomalyScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Anomaly Index:</span>
                      <span className="text-purple-400 font-bold">
                        {currentThreat.anomalyPercentage || Math.round(currentThreat.anomalyScore * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${currentThreat.anomalyPercentage || Math.round(currentThreat.anomalyScore * 100)}%` }}
                      />
                    </div>
                    <div className="pt-2 border-t border-purple-500/20 flex justify-between items-center text-[11px] text-purple-300">
                      <span className="text-slate-400">Sessions Trained On:</span>
                      <span className="font-bold font-mono text-purple-200">
                        {currentThreat.sessionsTrainedOn || threats.length} Sessions
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-purple-300/80 leading-relaxed font-sans">
                    Isolation Forest was fitted across <strong>{currentThreat.sessionsTrainedOn || threats.length}</strong> multi-honeypot sessions to isolate anomalous feature vectors.
                  </p>
                </div>

                {/* Attacker Context Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                      <Fingerprint className="h-4 w-4 text-emerald-400" /> Host Identity
                    </span>
                    <Link
                      to="/attackers"
                      className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      All Attackers &rarr;
                    </Link>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source IP:</span>
                      <span className="text-emerald-400 font-bold">{currentThreat.src_ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Events:</span>
                      <span className="text-slate-200">{currentThreat.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">First Seen:</span>
                      <span className="text-slate-300 truncate max-w-[150px]">
                        {currentThreat.startTime?.substring(11, 19) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
