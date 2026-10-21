import React, { useMemo } from 'react';
import {
  ShieldAlert,
  Flame,
  Users,
  Server,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  BrainCircuit,
  Lock,
  Terminal,
  Crosshair
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import Header from '../components/Header';
import { useHoneynet } from '../context/HoneynetContext';
import { useNavigate } from 'react-router-dom';

const ATTACK_TYPE_COLORS = {
  'Malware Download Attempt': '#ef4444',
  'Reconnaissance or Port Scan': '#f59e0b',
  'Brute Force': '#ec4899',
  'Credential Stuffing': '#8b5cf6',
  'Interactive Shell Execution': '#06b6d4',
  'Signature-Matched Network Attack': '#f97316',
  'Reconnaissance / Probe': '#3b82f6'
};

export default function OverviewPage() {
  const {
    events,
    honeypots,
    attackers,
    threats = [],
    highRiskCount = 0,
    setSelectedEventId
  } = useHoneynet();
  const navigate = useNavigate();

  // Summary Metrics from live SQLite database
  const totalEvents = events.length;
  const uniqueAttackerCount = new Set(events.map((e) => e.src_ip).filter(Boolean)).size || attackers.length;
  const activeHoneypotsCount = honeypots.filter((h) => h.status === 'active').length || 3;

  // Real Threat Score Timeline: computed from analyzed sessions chronologically
  const scoreTimeline = useMemo(() => {
    if (!threats || threats.length === 0) return [];

    // Filter threats with startTime and sort chronologically
    const sorted = [...threats]
      .filter((t) => t.startTime)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return sorted.map((t, idx) => {
      const timeStr = t.startTime ? t.startTime.replace('T', ' ').substring(11, 19) : `#${idx + 1}`;
      return {
        time: timeStr,
        ip: t.src_ip,
        session: t.session,
        ruleScore: t.ruleScore,
        anomalyScore: Math.round(t.anomalyScore * 100),
        threatLevel: t.threatLevel,
        attackType: t.attackType
      };
    });
  }, [threats]);

  // Real Attack Type Distribution from live threats
  const attackTypeDistribution = useMemo(() => {
    if (!threats || threats.length === 0) return [];
    const counts = {};
    for (const t of threats) {
      const type = t.attackType || 'Reconnaissance / Probe';
      counts[type] = (counts[type] || 0) + 1;
    }
    const total = threats.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
      fill: ATTACK_TYPE_COLORS[name] || '#64748b'
    }));
  }, [threats]);

  // Real Threat Level Breakdown
  const threatLevelCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    for (const t of threats) {
      if (counts[t.threatLevel] !== undefined) {
        counts[t.threatLevel]++;
      }
    }
    return [
      { name: 'Critical Risk', count: counts.Critical, color: 'text-red-400', fill: '#ef4444', border: 'border-red-500/40', bg: 'bg-red-500/5' },
      { name: 'High Risk', count: counts.High, color: 'text-orange-400', fill: '#f97316', border: 'border-orange-500/40', bg: 'bg-orange-500/5' },
      { name: 'Medium Risk', count: counts.Medium, color: 'text-amber-400', fill: '#f59e0b', border: 'border-amber-500/40', bg: 'bg-amber-500/5' },
      { name: 'Low Risk', count: counts.Low, color: 'text-emerald-400', fill: '#10b981', border: 'border-emerald-500/40', bg: 'bg-emerald-500/5' }
    ];
  }, [threats]);

  const statCards = [
    {
      title: 'Total Decoy Events',
      value: totalEvents.toLocaleString(),
      change: 'Cowrie &bull; Heralding &bull; Suricata',
      isIncrease: true,
      icon: Activity,
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
      bgGlow: 'bg-blue-500/5'
    },
    {
      title: 'Unique Adversary IPs',
      value: uniqueAttackerCount,
      change: `${attackers.length} active attacker profiles`,
      isIncrease: true,
      icon: Users,
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      bgGlow: 'bg-purple-500/5'
    },
    {
      title: 'High-Risk Threat Sessions',
      value: highRiskCount,
      change: `${threats.length} total sessions analyzed`,
      isHighAlert: highRiskCount > 0,
      icon: ShieldAlert,
      borderColor: highRiskCount > 0 ? 'border-red-500/50' : 'border-slate-800',
      iconColor: 'text-red-400',
      bgGlow: highRiskCount > 0 ? 'bg-red-500/10' : 'bg-slate-900/50'
    },
    {
      title: 'Active Honeynet Decoys',
      value: `${activeHoneypotsCount} / 3 Online`,
      change: 'Ports: 2222, 3002, 3003',
      isIncrease: true,
      icon: Server,
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/5'
    }
  ];

  const handleInspectEvent = (id) => {
    setSelectedEventId(id);
    navigate('/live-attacks');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Decoy Security Operations Center"
        subtitle="Real-time multi-honeypot telemetry, rule-based threat evaluation, and Isolation Forest anomaly analysis"
      />

      <div className="p-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl border ${card.borderColor} ${card.bgGlow} bg-slate-900/60 p-4 transition-all hover:border-slate-600`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{card.title}</span>
                  <div className={`p-2 rounded-lg bg-slate-800/80 ${card.iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <div className="text-2xl font-bold font-mono tracking-tight text-slate-100 flex items-center gap-2">
                    {card.value}
                    {card.isHighAlert && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500 text-white animate-pulse">
                        HIGH RISK
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center text-[11px] text-slate-400 gap-1.5 font-mono">
                  {card.isHighAlert ? (
                    <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                  <span dangerouslySetInnerHTML={{ __html: card.change }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid: Threat Score Timeline & Attack Type Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Threat Score Timeline (2 cols) */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  Threat Score Timeline (Rule Score vs. Isolation Forest Anomaly)
                </h2>
                <p className="text-xs text-slate-400">
                  Chronological scoring across captured attacker sessions
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-blue-400" /> Rule Score (0-100)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-purple-400" /> Isolation Forest (%)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {scoreTimeline.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Awaiting threat session data from /api/threats...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={scoreTimeline}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRule" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg shadow-xl text-xs font-mono space-y-1">
                              <div className="text-emerald-400 font-bold">{data.ip}</div>
                              <div className="text-slate-400 text-[10px]">Session: {data.session}</div>
                              <div className="text-slate-200">Attack: <span className="font-semibold text-amber-300">{data.attackType}</span></div>
                              <div className="text-blue-400">Rule Threat Score: <span className="font-bold">{data.ruleScore}/100</span></div>
                              <div className="text-purple-400">Isolation Forest Anomaly: <span className="font-bold">{data.anomalyScore}%</span></div>
                              <div className="text-slate-400">Level: <span className="font-bold text-slate-100">{data.threatLevel}</span></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ruleScore"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRule)"
                      name="Rule Score"
                    />
                    <Area
                      type="monotone"
                      dataKey="anomalyScore"
                      stroke="#a855f7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAnomaly)"
                      name="Isolation Forest Anomaly"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Attack Types Distribution (1 col) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm flex flex-col">
            <div className="mb-2">
              <h2 className="text-sm font-bold text-slate-200">Attack Type Classification</h2>
              <p className="text-xs text-slate-400">Extracted from multi-source feature vector</p>
            </div>

            <div className="h-52 w-full my-auto">
              {attackTypeDistribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  No attack sessions classified yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attackTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {attackTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#f8fafc'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 max-h-36 overflow-y-auto">
              {attackTypeDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-400 truncate max-w-[170px]" title={item.name}>
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">{item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real Threat Level Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {threatLevelCounts.map((sev, idx) => (
            <div
              key={idx}
              className={`rounded-xl border ${sev.border} ${sev.bg} p-4 flex items-center justify-between`}
            >
              <div>
                <span className="text-xs text-slate-400 font-medium block">{sev.name}</span>
                <span className={`text-xl font-bold font-mono ${sev.color}`}>{sev.count} Sessions</span>
              </div>
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center border"
                style={{ borderColor: sev.fill, backgroundColor: `${sev.fill}15` }}
              >
                <Flame className="h-4 w-4" style={{ color: sev.fill }} />
              </div>
            </div>
          ))}
        </div>

        {/* Live Attackers & Threat Sessions Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-red-400" />
                Active Adversary Sessions & Anomaly Assessment
              </h2>
              <p className="text-xs text-slate-400">
                Grouped by (src_ip, session) with rule score, Isolation Forest anomaly, and high-risk badges
              </p>
            </div>
            <button
              onClick={() => navigate('/ai-analysis')}
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Deep Threat Breakdown &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Attacker IP</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Attack Type</th>
                  <th className="py-3 px-4">Threat Level</th>
                  <th className="py-3 px-4">Rule Score</th>
                  <th className="py-3 px-4">Isolation Forest</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4 text-right">Risk Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {threats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Awaiting threat analysis data from /api/threats...
                    </td>
                  </tr>
                ) : (
                  threats.slice(0, 10).map((t, idx) => {
                    const isHighRisk = t.threatLevel === 'Critical' || t.threatLevel === 'High' || t.isHighRisk;
                    const isCrit = t.threatLevel === 'Critical';
                    const isHigh = t.threatLevel === 'High';
                    const isMed = t.threatLevel === 'Medium';

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => navigate('/ai-analysis')}
                      >
                        <td className="py-3 px-4 font-bold text-emerald-400 flex items-center gap-1.5">
                          {t.src_ip}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{t.session}</td>
                        <td className="py-3 px-4 text-slate-200 font-sans font-medium">{t.attackType}</td>
                        <td className="py-3 px-4">
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
                            {t.threatLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-100">{t.ruleScore}/100</td>
                        <td className="py-3 px-4 font-bold text-purple-400">
                          {t.anomalyPercentage || Math.round(t.anomalyScore * 100)}%
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {Math.round(t.confidence * 100)}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isHighRisk ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white shadow-sm shadow-red-500/30 animate-pulse">
                              <AlertTriangle className="h-3 w-3" /> HIGH RISK ATTACKER
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                              MONITORED
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
