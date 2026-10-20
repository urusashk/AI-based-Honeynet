import React, { useState } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileCode2,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Fingerprint,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIThreatAnalysisPage() {
  const { events, selectedEventId, setSelectedEventId } = useHoneynet();

  // Find currently selected event or default to first
  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const analysis = currentEvent.aiAnalysis;

  // Filter related events from the same simulated attacker
  const relatedEvents = events.filter(
    (e) => e.sourceIp === currentEvent.sourceIp && e.id !== currentEvent.id
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="AI Threat Classification & Triage"
        subtitle="Rule-based heuristic evaluation, MITRE ATT&CK mapping, and automated countermeasure recommendations"
      />

      <div className="p-6 space-y-6">
        {/* Transparent AI Logic Disclaimer */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 text-xs text-purple-200 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-purple-300 block">
              Transparent Demonstration Engine (Rule-based & Heuristics)
            </span>
            <p className="text-purple-300/80 leading-relaxed">
              This interface uses explainable rule-based demo heuristics to score attacks, identify behavioral indicators, and map MITRE ATT&CK techniques. The modular architecture is designed so you can later drop in your own trained Python PyTorch / Scikit-Learn or FastAPI ML pipeline endpoint (`GET /api/analysis/:id`) without modifying the frontend view.
            </p>
          </div>
        </div>

        {/* Event Selector Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs font-mono text-slate-400 shrink-0">Select Event:</span>
          {events.slice(0, 7).map((evt) => (
            <button
              key={evt.id}
              onClick={() => setSelectedEventId(evt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 border ${
                evt.id === currentEvent.id
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {evt.id} ({evt.attackType.split(' ')[0]})
            </button>
          ))}
        </div>

        {/* AI Scorecard & Classification Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Classification Card (8 cols) */}
          <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold block mb-1">
                  AI Model Classification
                </span>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {analysis?.classification || currentEvent.attackType}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Target Service: <span className="text-slate-200">{currentEvent.destinationService}</span> &bull; Port: <span className="text-emerald-400">{currentEvent.destinationPort}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">MITRE Tactic</span>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  {currentEvent.mitreTactic || 'T1190 - Initial Access'}
                </span>
              </div>
            </div>

            {/* Why the event was flagged (Explanation) */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Detection Rationale & Feature Weighting
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
                {analysis?.reasoning || currentEvent.eventDetails}
              </div>
            </div>

            {/* Suspicious Behaviour Indicators */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Observed Behavioral Anomalies
              </h3>
              <div className="space-y-2">
                {analysis?.indicators?.map((ind, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-300"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    <span>{ind}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Defensive Actions */}
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Automated Countermeasure Playbook
              </h3>
              <div className="space-y-2">
                {analysis?.recommendedActions?.map((rec, i) => (
                  <div
                    key={i}
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
            {/* Risk Score Widget */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm text-center">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-4">
                Calculated Threat Score
              </span>

              <div className="relative inline-flex items-center justify-center">
                <div
                  className={`h-36 w-36 rounded-full border-4 flex flex-col items-center justify-center ${
                    currentEvent.riskScore >= 80
                      ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                      : currentEvent.riskScore >= 60
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-amber-500 bg-amber-500/10'
                  }`}
                >
                  <span className="text-4xl font-extrabold font-mono text-slate-100">
                    {currentEvent.riskScore}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 uppercase">/ 100 max</span>
                </div>
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase font-mono ${
                    currentEvent.severity === 'Critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : currentEvent.severity === 'High'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {currentEvent.severity} Severity
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>Model Confidence:</span>
                <span className="font-bold text-purple-400">
                  {((analysis?.confidence || 0.92) * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Attacker Context Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                  <Fingerprint className="h-4 w-4 text-emerald-400" /> Attacker Identity
                </span>
                <Link
                  to="/attackers"
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Profile &rarr;
                </Link>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Source IP:</span>
                  <span className="text-emerald-400 font-bold">{currentEvent.sourceIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin:</span>
                  <span className="text-slate-300">Reserved RFC 5737 Subnet</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">User / Credential:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">
                    {currentEvent.usernameAttempted || 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Events from Same Simulated Attacker */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                Related Activity from {currentEvent.sourceIp}
              </h3>
              <p className="text-xs text-slate-400">
                Correlated events targeting other decoy services in this attack session
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              {relatedEvents.length} Correlated Events
            </span>
          </div>

          {relatedEvents.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">
              No additional concurrent events recorded for this IP in the current buffer.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedEvents.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => setSelectedEventId(rel.id)}
                  className="cursor-pointer p-3 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-purple-500/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">{rel.id}</span>
                      <span className="text-[10px] font-mono text-slate-400">{rel.timestamp}</span>
                    </div>
                    <span className="text-xs text-slate-300 block mt-1">
                      {rel.destinationService} &bull; {rel.attackType}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-100">
                    {rel.riskScore}/100
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
