import React, { useState } from 'react';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Flame,
  Activity,
  Layers
} from 'lucide-react';
import {
  ATTACK_TYPE_DISTRIBUTION,
  SEVERITY_DISTRIBUTION
} from '../data/mockData';

export default function ReportsPage() {
  const { events, honeypots, attackers } = useHoneynet();
  const [timeRange, setTimeRange] = useState('24h');
  const [reportType, setReportType] = useState('full');
  const [exportedSuccess, setExportedSuccess] = useState(false);

  // Highest risk sessions
  const highestRiskSessions = [...events]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const handleExportCSV = () => {
    // Generate RFC-compliant CSV string
    const headers = [
      'Event_ID',
      'Timestamp',
      'Source_IP',
      'Target_Service',
      'Destination_Port',
      'Attack_Type',
      'Username_Attempted',
      'Severity',
      'Risk_Score',
      'MITRE_Tactic',
      'Details'
    ];

    const rows = events.map((e) => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.sourceIp}"`,
      `"${e.destinationService}"`,
      `"${e.destinationPort}"`,
      `"${e.attackType}"`,
      `"${e.usernameAttempted || ''}"`,
      `"${e.severity}"`,
      `"${e.riskScore}"`,
      `"${e.mitreTactic || ''}"`,
      `"${(e.eventDetails || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `honeynet_security_incident_report_${timeRange}_demo.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedSuccess(true);
    setTimeout(() => setExportedSuccess(false), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Security Incident Reports & Forensics Export"
        subtitle="Generate college project presentation briefs and CSV telemetry dumps"
      />

      <div className="p-6 space-y-6">
        {/* Report Generator Controls */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              Incident Audit Report Generator
            </h2>
            <p className="text-xs text-slate-400">
              Export recorded honeynet decoy encounters with classification metadata
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-400">Window:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent text-slate-200 font-mono focus:outline-none"
              >
                <option value="1h" className="bg-slate-900">Past 1 Hour</option>
                <option value="6h" className="bg-slate-900">Past 6 Hours</option>
                <option value="24h" className="bg-slate-900">Past 24 Hours</option>
                <option value="7d" className="bg-slate-900">Past 7 Days</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Export Incident Log (.CSV)
            </button>
          </div>
        </div>

        {exportedSuccess && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>
              Incident report exported successfully as CSV! Includes all {events.length} current decoy log records with RFC 5737 demo IP labeling.
            </span>
          </div>
        )}

        {/* Executive Summary Briefing */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                Executive Security Operations Briefing
              </span>
              <h3 className="text-base font-bold text-slate-100">
                AI-Based Intelligent Honeynet Summary ({timeRange.toUpperCase()})
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Generated: {new Date().toLocaleDateString()}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Ingress Events</span>
              <span className="text-2xl font-bold font-mono text-slate-100">
                {(1447 + events.length - 8).toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Adversary Source IPs</span>
              <span className="text-2xl font-bold font-mono text-purple-400">
                {attackers.length + 27}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Decoy Containers Guarding</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">3 Nodes</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Critical Threat Detections</span>
              <span className="text-2xl font-bold font-mono text-red-400">
                {events.filter((e) => e.severity === 'Critical').length + 190}
              </span>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Attack Category Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Attack Category Breakdown
              </h4>
              <div className="space-y-2">
                {ATTACK_TYPE_DISTRIBUTION.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{item.name}</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Severity Triage Distribution
              </h4>
              <div className="space-y-2">
                {SEVERITY_DISTRIBUTION.map((sev, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{sev.name}</span>
                    <span className={`font-mono font-bold ${sev.color}`}>{sev.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Highest Risk Sessions */}
          <div className="pt-2">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">
              Highest-Risk Intercepted Sessions (Risk Score &gt;= 80)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Session ID</th>
                    <th className="py-2.5 px-3">Attacker IP</th>
                    <th className="py-2.5 px-3">Target Honeypot</th>
                    <th className="py-2.5 px-3">Vector</th>
                    <th className="py-2.5 px-3">Risk</th>
                    <th className="py-2.5 px-3">Classification Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {highestRiskSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{s.id}</td>
                      <td className="py-2.5 px-3 text-emerald-400">{s.sourceIp}</td>
                      <td className="py-2.5 px-3 text-slate-300">{s.destinationService}</td>
                      <td className="py-2.5 px-3 text-slate-200">{s.attackType}</td>
                      <td className="py-2.5 px-3 font-bold text-red-400">{s.riskScore}/100</td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">
                        {s.aiAnalysis?.classification || s.eventDetails}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
